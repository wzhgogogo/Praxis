import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import type { ModelGateway, ModelRequest, ModelResponse } from "../../../../core/model/contracts.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { BrowserTaskExecutor } from "../../../../infrastructure/browser/browser-task-executor.js";
import { PlaywrightControlRegistry } from "../../../../infrastructure/browser/playwright-browser-controls.js";
import type { BrowserSession, BrowserSnapshot } from "../../../../infrastructure/browser/browser-runtime.js";
import { ModelBrowserReadActionDecision, decodeBrowserReadActionWire, BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA, BROWSER_ACTION_DECISION_SCHEMA, BROWSER_READ_HISTORY_INSTRUCTION, type BrowserReadDecisionInput, type BrowserReadHistoryStep } from "../../../../infrastructure/browser/browser-action-decision.js";
import { normalizeRestaurantAgentActionStrictWire, RESTAURANT_AGENT_ACTION_STRICT_WIRE_JSON_SCHEMA } from "../../../../domains/restaurant/agent-action.js";
import { candidateAvailabilityPath, restaurantDiscoveryPacks } from "../../../../integrations/restaurant-search/source-packs.js";
import { tabelogQueryControlHints } from "../../../../integrations/tabelog/tabelog-query-controls.js";
import { observedCandidateSourceCategories } from "../../../../domains/restaurant/agent-context.js";
import { RESTAURANT_AGENT_AVAILABILITY_PATH_INSTRUCTION, RESTAURANT_AGENT_DECISION_PROMPT_VERSION, RESTAURANT_AGENT_SOURCE_CATEGORY_INSTRUCTION } from "../../../../domains/restaurant/agent-decision.js";
import type { RestaurantOutlet, RestaurantReadEvidence } from "../../../../domains/restaurant/contracts.js";
import { RESTAURANT_AGENT_CONTEXT_SCHEMA } from "../../../../domains/restaurant/agent-context.js";

export interface ActionLabel { type: string; field?: string; direction?: string; targetLabel?: string | null; targetKind?: string | null; targetLabelPattern?: string; candidateIds?: string[]; excludeCandidateIds?: string[]; candidateIdsExact?: string[]; }
export interface ReplaySeed {
  seedId: string; level: "BROWSER" | "AGENT"; subCause: string; labelStatus: string;
  origin: { run: string; runArtifact: string; decisionIndex: number; recordingDir: string; recordingSnapshot?: number; observationRevision?: number; url?: string };
  recordedAction: ActionLabel; acceptableActions: ActionLabel[]; requires?: string[];
}
export interface CapturedDecision {
  startedAt?: string;
  sequence: number; purpose: string; promptVersion: string; messages: ModelRequest["messages"];
  outputSchema: ModelRequest["outputSchema"]; responseFormat: ModelRequest["responseFormat"];
  timeoutMs: number; maxOutputTokens: number | null; temperature: number | null; thinking: ModelRequest["thinking"] | null;
  browser?: { recordingSnapshot?: number; observationRevision?: number; url?: string }; outputText: string | null;
}

/** Same captured messages/constraints, enriched only with source IDs observed
 * before this turn. Independent labels and witnesses are never arguments. */
export function availabilityPathInjectedRequest(seed: ReplaySeed, row: CapturedDecision, observed: readonly RestaurantOutlet[]): ModelRequest {
  if (seed.level !== "AGENT") throw Error("AVAILABILITY_PATH_REQUIRES_AGENT_SEED");
  const base = originalRequest(seed,row);
  return { ...base, promptVersion: RESTAURANT_AGENT_DECISION_PROMPT_VERSION,
    messages: row.messages.map(message => {
      if (message.role === "system") return { ...message, content: message.content + "\n\n" + RESTAURANT_AGENT_AVAILABILITY_PATH_INSTRUCTION };
      if (message.role !== "user") return message;
      const input = JSON.parse(message.content);
      return { ...message, content: JSON.stringify({ ...input, context: { ...input.context, schemaVersion: RESTAURANT_AGENT_CONTEXT_SCHEMA.version,
        candidates: input.context.candidates.map((candidate: { id: string }) => {
          const outlet = observed.find(item => item.id === candidate.id);
          if (!outlet) throw Error(`MISSING_PRE_DECISION_SOURCE_IDS:${candidate.id}`);
          return { ...candidate, availabilityPath: candidateAvailabilityPath(outlet) };
        }) } }) };
    }) };
}
/** Original messages plus source facts already observed at this decision, without DOM reconstruction. */
export function categoryInjectedRequest(seed: ReplaySeed, row: CapturedDecision, evidence: RestaurantReadEvidence[]): ModelRequest {
  if (seed.level !== "AGENT") throw new Error("CATEGORY_INJECTION_REQUIRES_AGENT_SEED");
  return { ...originalRequest(seed, row), promptVersion: `${row.promptVersion}+source-categories@1`,
    messages: row.messages.map(message => {
      if (message.role === "system") return { ...message, content: message.content + "\n\n" + RESTAURANT_AGENT_SOURCE_CATEGORY_INSTRUCTION };
      if (message.role !== "user") return message;
      const input = JSON.parse(message.content);
      return { ...message, content: JSON.stringify({ ...input, context: { ...input.context, schemaVersion: "10",
        candidates: input.context.candidates.map((candidate: { id: string }) => ({ ...candidate,
          sourceCategories: observedCandidateSourceCategories(evidence, candidate.id, row.startedAt ?? input.context.now),
        })) } }) };
    }) };
}
export function acceptableReplayAction(action: ActionLabel, acceptable: ActionLabel): boolean {
  validateReplayMatchFields(acceptable);
  const selected = action.candidateIds === undefined ? undefined : new Set(action.candidateIds);
  if (acceptable.excludeCandidateIds && (!selected || acceptable.excludeCandidateIds.some(id => selected.has(id)))) return false;
  if (acceptable.candidateIdsExact) {
    const exact = new Set(acceptable.candidateIdsExact);
    if (!selected || selected.size !== exact.size || [...exact].some(id => !selected.has(id))) return false;
  }
  return action.type === acceptable.type && (!acceptable.field || action.field === acceptable.field)
    && (!acceptable.direction || action.direction === acceptable.direction)
    && (!acceptable.targetKind || action.targetKind === acceptable.targetKind)
    && (acceptable.targetLabel == null || action.targetLabel === acceptable.targetLabel)
    && (!acceptable.targetLabelPattern || new RegExp(acceptable.targetLabelPattern).test(action.targetLabel ?? ""));
}

/** Validate every label before any scoring or paid request, including entries after a matching alternative. */
export function validateReplayMatchFields(acceptable: ActionLabel): void {
  const fields = new Set(["type", "field", "direction", "targetLabel", "targetKind", "targetLabelPattern", "excludeCandidateIds", "candidateIdsExact"]);
  for (const field of Object.keys(acceptable)) if (!fields.has(field)) throw new Error(`UNSUPPORTED_REPLAY_MATCH_FIELD:${field}`);
  for (const field of ["excludeCandidateIds", "candidateIdsExact"] as const) {
    if (acceptable[field] !== undefined && (!Array.isArray(acceptable[field]) || !acceptable[field]!.every(id => typeof id === "string"))) throw new Error(`INVALID_REPLAY_MATCH_FIELD:${field}`);
  }
}
export function reproducesRecordedAction(action: ActionLabel, recorded: ActionLabel): boolean {
  return action.type === recorded.type && (!recorded.field || recorded.field === "NONE" || !/AUTHORITATIVE|CHOOSE_OPTION/.test(recorded.type) || action.field === recorded.field)
    && (!recorded.direction || action.direction === recorded.direction)
    && (recorded.targetLabel == null || action.targetLabel === recorded.targetLabel)
    && (!recorded.targetKind || action.targetKind === recorded.targetKind);
}
function userInput(row: CapturedDecision): BrowserReadDecisionInput {
  return JSON.parse(row.messages.find(message => message.role === "user")!.content) as BrowserReadDecisionInput;
}
function browserLabel(text: string, input: BrowserReadDecisionInput): ActionLabel {
  const action = decodeBrowserReadActionWire(JSON.parse(text), new Set(input.observation.targets.map(target => target.ref)));
  const target = "targetRef" in action ? input.observation.targets.find(target => target.ref === action.targetRef) : undefined;
  return { type: action.type, ...("field" in action ? { field: action.field } : {}), ...("direction" in action ? { direction: action.direction } : {}),
    ...(target ? { targetLabel: target.label, targetKind: target.kind } : {}) };
}

/** Score captured actions without a model request, using their original observed targets. */
export function capturedReplayAction(seed: ReplaySeed, row: CapturedDecision): ActionLabel {
  if (!row.outputText) throw new Error("CAPTURED_MODEL_OUTPUT_MISSING");
  if (seed.level === "BROWSER") return browserLabel(row.outputText, userInput(row));
  const canonical = normalizeRestaurantAgentActionStrictWire(JSON.parse(row.outputText));
  if (!canonical.valid) throw new Error("INVALID_CAPTURED_AGENT_WIRE");
  return canonical.value as ActionLabel;
}
/** Preceding captured steps, limited to the same source/stage/outlet read, not new executions. */
export function capturedBrowserHistory(rows: CapturedDecision[], current: CapturedDecision) {
  const input = userInput(current);
  const prior = rows.filter(row => row.sequence < current.sequence && row.purpose === "browser_read_decide");
  const read: CapturedDecision[] = [];
  for (const row of prior.reverse()) {
    const previous = userInput(row);
    if (previous.source !== input.source || previous.stage !== input.stage || previous.goal.outlet.name !== input.goal.outlet.name) break;
    read.unshift(row);
  }
  return read.map((row, index) => {
    let action: ActionLabel = { type: "MODEL_FAILURE" };
    if (row.outputText) { try { action = browserLabel(row.outputText, userInput(row)); } catch { action = { type: "MODEL_OUTPUT_REJECTED" }; } }
    return { sequence: row.sequence, action,
      progressAfter: read[index + 1] ? userInput(read[index + 1]!).progress : input.progress,
      urlChanged: userInput(row).observation.url !== (read[index + 1] ? userInput(read[index + 1]!).observation.url : input.observation.url) };
  });
}
function originalRequest(seed: ReplaySeed, row: CapturedDecision): ModelRequest {
  return { taskId: `replay:${seed.seedId}`, purpose: row.purpose, promptVersion: row.promptVersion,
    messages: row.messages, responseFormat: row.responseFormat,
    outputSchema: { ...row.outputSchema, jsonSchema: seed.level === "BROWSER" ? BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA : RESTAURANT_AGENT_ACTION_STRICT_WIRE_JSON_SCHEMA },
    timeoutMs: row.timeoutMs, fallback: "FAIL_CLOSED",
    ...(row.maxOutputTokens === null ? {} : { maxOutputTokens: row.maxOutputTokens }),
    ...(row.temperature === null ? {} : { temperature: row.temperature }), ...(row.thinking == null ? {} : { thinking: row.thinking }) };
}

/** Infer only feedback present in the following captured observation; no CSS rebuild or source execution. */
export function injectedBrowserHistory(rows: CapturedDecision[], current: CapturedDecision): BrowserReadHistoryStep[] {
  const input = userInput(current);
  const prior = rows.filter(row => row.sequence < current.sequence && row.purpose === "browser_read_decide");
  const contiguous: CapturedDecision[] = [];
  let next = input;
  for (const row of prior.reverse()) {
    const previous = userInput(row);
    if (previous.source !== input.source || previous.stage !== input.stage || previous.goal.outlet.name !== input.goal.outlet.name
      || previous.observation.revision >= next.observation.revision) break;
    contiguous.unshift(row); next = previous;
    if (contiguous.length === 6) break;
  }
  return contiguous.map((row, index) => {
    const before = userInput(row), after = contiguous[index + 1] ? userInput(contiguous[index + 1]!) : input;
    let action: ActionLabel;
    try { action = browserLabel(row.outputText ?? "", before); }
    catch { return { action: "MODEL_OUTPUT", outcome: "REJECTED", reason: "RECORDED_MODEL_OUTPUT_REJECTED", urlChanged: false }; }
    const rejected = /rejected|Completion was not accepted/i.test(after.progress ?? "");
    const changed = before.observation.url !== after.observation.url || before.observation.visibleText !== after.observation.visibleText;
    return { action: action.type, ...(action.field ? {field: action.field} : {}),
      ...(action.targetLabel ? {targetLabel: action.targetLabel.slice(0,160)} : {}), ...(action.targetKind ? {targetKind:action.targetKind} : {}),
      outcome: rejected ? "REJECTED" : changed ? "PAGE_CHANGED" : "NO_CHANGE",
      ...(rejected ? {reason:(after.progress ?? "").slice(0,240)} : {}), urlChanged: before.observation.url !== after.observation.url };
  });
}

export function historyInjectedRequest(seed: ReplaySeed, row: CapturedDecision, rows: CapturedDecision[]): ModelRequest {
  if (seed.level !== "BROWSER") throw new Error("HISTORY_INJECTION_REQUIRES_BROWSER_SEED");
  const request = originalRequest(seed, row);
  return { ...request, promptVersion: `${row.promptVersion}+history@2`,
    outputSchema: { ...BROWSER_ACTION_DECISION_SCHEMA, jsonSchema: BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA },
    messages: row.messages.map(message => message.role === "system" ? { ...message, content: message.content + "\n\n" + BROWSER_READ_HISTORY_INSTRUCTION }
      : message.role === "user" ? { ...message, content: JSON.stringify({ ...JSON.parse(message.content), history: injectedBrowserHistory(rows, row) }) } : message) };
}
/** Static saved DOM only. Page scripts, sockets and every external resource are disabled. */
export async function rebuildBrowserInput(html: string, input: BrowserReadDecisionInput, history: ReturnType<typeof capturedBrowserHistory>): Promise<{ input: BrowserReadDecisionInput; limitations: string[] }> {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: "block", viewport: { width: 1280, height: 720 } });
  const registry = new PlaywrightControlRegistry();
  try {
    const page = await context.newPage();
    await context.routeWebSocket("**/*", socket => socket.close());
    await context.route("**/*", route => route.request().resourceType() === "document" && route.request().isNavigationRequest() && route.request().frame() === page.mainFrame()
      ? route.fulfill({ status: 200, contentType: "text/html", body: html }) : route.abort());
    await page.goto(input.observation.url, { waitUntil: "domcontentloaded" });
    const snapshot = async (): Promise<BrowserSnapshot> => ({ url: input.observation.url, title: await page.title(), html: await page.content(), text: await page.locator("body").innerText() });
    const session: BrowserSession = {
      metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: new Date().toISOString(),
        ...(input.observation.pageActions?.includes("PRESS_ESCAPE") ? { readNetworkBoundary: "INSTALLED" } : {}) },
      snapshot, observeControls: hints => registry.observe(page, hints),
      navigate: async () => { throw new Error("STATIC_REPLAY_NO_NAVIGATION"); }, click: async () => { throw new Error("STATIC_REPLAY_NO_EXECUTION"); },
      fill: async () => { throw new Error("STATIC_REPLAY_NO_EXECUTION"); }, select: async () => [], waitFor: async () => {}, screenshot: async () => new Uint8Array(),
      pressEscape: async () => { throw new Error("STATIC_REPLAY_NO_EXECUTION"); }, close: async () => {},
    };
    let rebuilt: BrowserReadDecisionInput | undefined;
    const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(value) {
      // The prior records supply the existing post-action progress. DOM targets
      // and action eligibility come exclusively from the current Executor.
      rebuilt = { ...value, progress: history.at(-1)?.progressAfter ?? input.progress };
      return { type: "REQUEST_HUMAN_HELP", reason: "Input capture only; no action executed" };
    } } });
    executor.beginProvider(input.goal.outlet.name, input.source, input.stage);
    await executor.runSkill({ taskId: input.taskId ?? "static-replay", source: input.source, stage: input.stage, session,
      signal: new AbortController().signal, allowedOrigins: [new URL(input.observation.url).origin], goal: input.goal, objective: input.objective,
      methodReason: input.progress, ...(input.source === "TABELOG" ? { controlHints: tabelogQueryControlHints } : {}),
      ...(restaurantDiscoveryPacks.find(pack => pack.browser?.provider === input.source)?.skillPath ? { sourceSkillPath: restaurantDiscoveryPacks.find(pack => pack.browser?.provider === input.source)!.skillPath } : {}),
      completion: () => ({ complete: false, reason: input.progress }) });
    if (!rebuilt) throw new Error("NO_EXECUTOR_OBSERVATION");
    const limitations: string[] = [];
    if (await page.locator("link[rel=stylesheet]").count()) limitations.push("STYLESHEETS_NOT_AVAILABLE_IN_STATIC_CAPTURE");
    for (const original of input.observation.targets.filter(target => target.kind === "REGION" && target.scrollable)) {
      if (!rebuilt.observation.targets.some(target => target.kind === "REGION" && target.label === original.label && target.scrollable)) limitations.push("SCROLL_GEOMETRY_MISSING_FROM_STATIC_DOM");
    }
    // CSSOM style rules and source assets are not invented from known labels.
    if (input.observation.targets.length && !rebuilt.observation.targets.length) limitations.push("CONTROLS_MISSING_FROM_STATIC_DOM");
    await executor.close();
    return { input: rebuilt, limitations: [...new Set(limitations)] };
  } finally { await registry.dispose(); await context.close(); await browser.close(); }
}
export async function runDecisionReplay(options: { mode: "original" | "rebuild" | "history" | "categories"; seedsPath: string; sourceRoot: string; outputDir: string; budgetPath: string; item: string; round: number; select?: string[]; gateway: ModelGateway }) {
  await mkdir(options.outputDir, { recursive: true });
  const seedBytes = await readFile(options.seedsPath);
  const all = (JSON.parse(seedBytes.toString()) as { seeds: ReplaySeed[] }).seeds;
  for (const seed of all) for (const expected of seed.acceptableActions) validateReplayMatchFields(expected);
  const seeds = all.filter(seed => !options.select || options.select.includes(seed.seedId));
  const rowsByPath = new Map<string, CapturedDecision[]>();
  const documentsByPath = new Map<string, Array<{ snapshot: number; file: string; url: string }>>();
  const results: Array<Record<string, unknown>> = [];
  for (const seed of seeds) {
    const outputPath = join(options.outputDir, `${seed.seedId}.json`);
    // Never overwrite a paid result or issue a second successful call for a seed/round.
    try { await readFile(outputPath); throw new Error(`REPLAY_RESULT_EXISTS:${seed.seedId}`); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    const result: Record<string, unknown> = { seed, mode: options.mode, realModelCalls: 0, status: "SKIPPED", codeCommit: process.env.PRAXIS_REPLAY_CODE_COMMIT ?? "UNRECORDED" };
    try {
      const path = resolve(options.sourceRoot, seed.origin.runArtifact);
      let rows = rowsByPath.get(path);
      if (!rows) { rows = (await readFile(path, "utf8")).trim().split("\n").map(row => JSON.parse(row) as CapturedDecision); rowsByPath.set(path, rows); }
      const row = rows.find(row => row.sequence === seed.origin.decisionIndex);
      if (!row) throw new Error("CAPTURED_DECISION_MISSING");
      result.original = row;
      let input = seed.level === "BROWSER" ? userInput(row) : undefined;
      const history = input ? capturedBrowserHistory(rows, row) : [];
      result.priorCapturedSteps = history;
      if (options.mode === "rebuild") {
        if (!input) throw new Error("AGENT_REQUIRES_STATE_REPLAY_SEPARATE_FROM_DOM");
        if (seed.origin.recordingSnapshot !== row.browser?.recordingSnapshot || seed.origin.observationRevision !== input.observation.revision) throw new Error("ANNOTATED_CAPTURE_POINTER_MISMATCH");
        const directory = resolve(options.sourceRoot, seed.origin.recordingDir);
        let documents = documentsByPath.get(directory);
        if (!documents) { documents = (JSON.parse(await readFile(join(directory, "recording.json"), "utf8")) as { documents: Array<{ snapshot: number; file: string; url: string }> }).documents; documentsByPath.set(directory, documents); }
        const document = documents.find(document => document.snapshot === seed.origin.recordingSnapshot);
        if (!document) throw new Error("RECORDING_SNAPSHOT_MISSING");
        if (document.url !== input.observation.url) throw new Error("RECORDING_URL_MISMATCH");
        const html = await readFile(join(directory, document.file), "utf8");
        const rebuilt = await rebuildBrowserInput(html, input, history); input = rebuilt.input;
        result.rebuiltInput = input; result.reconstructionLimitations = rebuilt.limitations;
        if (rebuilt.limitations.length) throw new Error(rebuilt.limitations.join(";"));
      }
      let request: ModelRequest | undefined; let response: ModelResponse | undefined;
      const counted: ModelGateway = { complete: async value => {
        request = value;
        const budget = JSON.parse(await readFile(options.budgetPath, "utf8"));
        if (budget.nightRealModelCalls >= budget.limit || budget.nightRealModelCalls + budget.previousPhaseReplayCalls >= budget.phaseReplayLimit) throw new Error("REPLAY_BUDGET_EXHAUSTED");
        if (budget.calls.some((call: { item: string; seed: string; round: number; status: string }) => call.item === options.item && call.seed === seed.seedId && call.round === options.round && call.status !== "FAILED")) throw new Error("SEED_ALREADY_CALLED_IN_ROUND");
        const call: Record<string, unknown> = { item: options.item, seed: seed.seedId, round: options.round, status: "STARTED", startedAt: new Date().toISOString() };
        budget.calls.push(call); budget.nightRealModelCalls++; result.realModelCalls = 1;
        await writeFile(options.budgetPath, JSON.stringify(budget, null, 2));
        try { response = await options.gateway.complete(value); call.status = "SUCCEEDED"; call.usage = response.usage; call.latencyMs = response.latencyMs; return response; }
        catch (error) { call.status = "FAILED"; call.errorCode = (error as { code?: string }).code ?? "UNKNOWN"; throw error; }
        finally { result.request = request; result.response = response; await writeFile(options.budgetPath, JSON.stringify(budget, null, 2)); }
      } };
      let action: ActionLabel;
      if (options.mode === "original" || options.mode === "history" || options.mode === "categories") {
        let replayRequest = originalRequest(seed, row);
        if (options.mode === "history") replayRequest = historyInjectedRequest(seed,row,rows);
        if (options.mode === "categories") {
          const artifact = JSON.parse(await readFile(path.replace(/\.decisions\.jsonl$/, ".result.json"), "utf8"));
          replayRequest = categoryInjectedRequest(seed, row, artifact.finalSnapshot.domainState.readEvidence);
        }
        response = await counted.complete(replayRequest);
        if (response.finishReason !== "TOOL_CALLS") throw new Error(`INVALID_FINISH_REASON:${response.finishReason}`);
        if (seed.level === "BROWSER") action = browserLabel(response.outputText, input!);
        else { const canonical = normalizeRestaurantAgentActionStrictWire(JSON.parse(response.outputText)); if (!canonical.valid) throw new Error("INVALID_AGENT_WIRE"); action = canonical.value as ActionLabel; }
      } else {
        const proposed = await new ModelBrowserReadActionDecision(counted).decide({ ...input!, taskId: `replay:${seed.seedId}` });
        action = browserLabel(JSON.stringify({ action: proposed.type, targetRef: "targetRef" in proposed ? proposed.targetRef : "", authoritativeField: "field" in proposed ? proposed.field : "NONE", requestedState: "direction" in proposed ? proposed.direction : "checked" in proposed ? proposed.checked ? "CHECKED" : "UNCHECKED" : "NONE", reason: proposed.reason }), input!);
      }
      result.status = "EVALUATED"; result.action = action;
      result.acceptable = seed.labelStatus === "FROZEN" ? seed.acceptableActions.some(expected => acceptableReplayAction(action, expected)) : null;
      result.reproduced = reproducesRecordedAction(action, seed.recordedAction);
      result.modelLatencyMs = response!.latencyMs; result.tokenUsage = response!.usage;
    } catch (error) { result.reason = error instanceof Error ? error.message : "UNKNOWN"; if (result.realModelCalls === 1) result.status = "FAILED_CALL_OR_OUTPUT"; }
    results.push(result); await writeFile(outputPath, JSON.stringify(result, null, 2));
    await appendFile(join(options.outputDir, "progress.jsonl"), JSON.stringify({ seedId: seed.seedId, status: result.status, action: result.action, acceptable: result.acceptable, reason: result.reason }) + "\n");
  }
  const labels = [...new Set(seeds.map(seed => `${seed.level}:${seed.subCause}:${seed.labelStatus}`))];
  const summary = { mode: options.mode, seedsSha256: createHash("sha256").update(seedBytes).digest("hex"), totalSeeds: seeds.length,
    realModelCalls: results.reduce((total, row) => total + Number(row.realModelCalls), 0),
    byLabel: labels.map(label => { const selected = results.filter(row => { const seed = row.seed as ReplaySeed; return `${seed.level}:${seed.subCause}:${seed.labelStatus}` === label; }); const evaluated = selected.filter(row => row.status === "EVALUATED"); return { label, total: selected.length, evaluated: evaluated.length, skipped: selected.filter(row => row.status === "SKIPPED").length, failures: selected.filter(row => row.status === "FAILED_CALL_OR_OUTPUT").length, passed: evaluated.filter(row => row.acceptable === true).length, reproduced: evaluated.filter(row => row.reproduced === true).length }; }),
    results: results.map(({ original: _original, request: _request, response: _response, rebuiltInput: _input, priorCapturedSteps: _prior, ...row }) => row) };
  await writeFile(join(options.outputDir, "summary.json"), JSON.stringify(summary, null, 2)); return summary;
}
async function main() {
  const args = process.argv.slice(2); const get = (key: string, fallback?: string) => { const index = args.indexOf(key); return index < 0 ? fallback : args[index + 1]; };
  const mode = get("--mode"); if (mode !== "original" && mode !== "rebuild" && mode !== "history" && mode !== "categories") throw new Error("--mode original|rebuild|history|categories required");
  const required = (key: string) => { const value = get(key); if (!value) throw new Error(`${key} required`); return value; };
  const summary = await runDecisionReplay({ mode, seedsPath: required("--seeds"), sourceRoot: required("--source-root"), outputDir: required("--out-dir"), budgetPath: required("--budget-file"), item: required("--item"), round: Number(get("--round", "1")), ...(get("--select") ? { select: get("--select")!.split(",") } : {}), gateway: DeepSeekModelGateway.fromEnvironment() });
  console.log(JSON.stringify({ ...summary, results: undefined }, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
