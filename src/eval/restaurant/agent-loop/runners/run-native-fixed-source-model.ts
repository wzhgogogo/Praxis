import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { ModelGateway, ModelInvocationRecord } from "../../../../core/model/contracts.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { GooglePlacesClient } from "../../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../../integrations/google/google-places-restaurant-search.js";
import { LiveBrowserAvailability } from "../../../../integrations/restaurant-availability/live-browser-availability.js";
import { composeNativeRestaurantRead } from "../../../../integrations/restaurant-search/native-read-composition.js";
import { diagnosticFailureCode, startDiagnosticRun } from "../../../shared/diagnostic-run.js";
import { evaluateArtifactAfterFinish } from "../diagnostic-evaluator.js";
import { createHybridReadComposition } from "../hybrid-read-composition.js";
import { loadFrozenLiveCases, RESTAURANT_READ_DEVELOPMENT_CASE_PATH } from "../live-case-materializer.js";
import { center, reference, sourcePages, type SourceScenario } from "../native-fixed-source-pages.js";

function option(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`${name} is required`);
  return value;
}
function boundedOption(name: string, maximum: number): number {
  const value = Number(option(name));
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) throw new Error(`${name} must be 1..${maximum}`);
  return value;
}

if (process.env.PRAXIS_ALLOW_LIVE_MODEL_EVAL !== "1") throw new Error("Set PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 for this paid fixed-source model run");
if (!process.env.DEEPSEEK_API_KEY?.trim()) throw new Error("DEEPSEEK_API_KEY is required");
if (option("--case") !== "h001") throw new Error("Only the frozen h001 request is registered for native fixed sources");
const scenario = option("--scenario") as SourceScenario;
if (!["TABELOG_DELIVERS", "TABLECHECK_RECOVERS", "BOTH_BOUNDED_EMPTY", "TABLECHECK_CONTINUES"].includes(scenario)) throw new Error("Unknown native fixed-source scenario");
const maxModelCalls = boundedOption("--max-model-calls", 50);
const maxSteps = boundedOption("--max-steps", 30);
const timeoutMs = boundedOption("--timeout-ms", 300_000);
const frozen = (await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH)).find((item) => item.id === "h001");
if (!frozen) throw new Error("Frozen H001 is absent");
const startedAt = Date.now();
const deadline = AbortSignal.timeout(timeoutMs);
const taskId = `native-fixed-source-model:h001:${scenario}:${startedAt}`;
const invocations: ModelInvocationRecord[] = [];
const navigations: string[] = [];
const googleQueries: string[] = [];
const sourcePath = resolve(RESTAURANT_READ_DEVELOPMENT_CASE_PATH);
const journal = await startDiagnosticRun(resolve(".eval-artifacts", "h001-native-fixed-source-model"), {
  mode: "FIXED_SOURCE_REAL_MODEL", caseId: "h001", sourceScenario: scenario,
  dataset: { path: RESTAURANT_READ_DEVELOPMENT_CASE_PATH, sha256: createHash("sha256").update(readFileSync(sourcePath)).digest("hex"), contaminationStatus: "PROMPT_AND_RESULT_EXPOSED", baselineEligible: false },
  sourceEnvironment: { network: "OFFLINE_FIXED_TRANSPORT", browser: "OFFLINE_FIXED_PAGES" },
  runCeilings: { maxModelCalls, maxSteps, timeoutMs },
  safety: { policy: "READ_ONLY_CODE_PATH", externalSideEffectCount: 0 },
});

try {
  const provider = DeepSeekModelGateway.fromEnvironment(process.env, { observer: { observe: (record) => { invocations.push(structuredClone(record)); } } });
  let modelCalls = 0;
  const model: ModelGateway = { async complete(request) {
    if (deadline.aborted) throw Object.assign(new Error("Fixed-source deadline reached"), { code: "CANCELLED" });
    if (modelCalls >= maxModelCalls) throw Object.assign(new Error("Shared model budget reached"), { code: "MODEL_CALL_BUDGET_EXHAUSTED" });
    modelCalls += 1;
    return provider.complete({ ...request, timeoutMs: Math.min(request.timeoutMs, Math.max(1, timeoutMs - (Date.now() - startedAt))) });
  } };
  const clock = { now: () => new Date(reference.valueOf() + Date.now() - startedAt) };
  const browser = sourcePages(scenario, navigations);
  const google = new GooglePlacesRestaurantSearch(new GooglePlacesClient({ apiKey: "fixed-transport-only", fetchImplementation: async (_url, init) => {
    const query = JSON.parse(String(init?.body)) as { textQuery: string };
    googleQueries.push(query.textQuery);
    return new Response(JSON.stringify({ places: [{ id: "shibuya-landmark", displayName: { text: "Shibuya" }, formattedAddress: "Shibuya, Tokyo", location: center,
      types: ["train_station"], addressComponents: [{ longText: "Tokyo", types: ["locality"] }] }] }), { status: 200 });
  } }), () => clock.now().toISOString(), 10, { maxRequests: 100 });
  const native = composeNativeRestaurantRead(google, browser, model, undefined, undefined, undefined, () => clock.now().toISOString());
  const availability = new LiveBrowserAvailability(browser, model, { now: () => clock.now().toISOString(), maxModelCallsTotal: maxModelCalls });
  const composition = createHybridReadComposition({ taskId, runId: `run:${taskId}`, clock, model, search: native.search, facts: native.facts, availability,
    router: { structuredReadTimeoutMs: 30_000, browserReadTimeoutMs: timeoutMs }, loop: { maxSteps, timeoutMs } });
  const semantic = await composition.interpretAndDispatch({ taskId, message: String(frozen.content), referenceTime: frozen.reference_time, timezone: "Asia/Tokyo" });
  const loop = semantic.status === "PROPOSED" ? await composition.coordinator.run(taskId, deadline) : undefined;
  const snapshot = composition.runtime.snapshot(taskId);
  const status = loop?.status === "TERMINAL" && ["PRESENT_RESULTS", "NO_VERIFIED_RESULT"].includes(snapshot.domainState.phase) ? "SUCCEEDED"
    : loop?.status === "CANCELLED" || deadline.aborted ? "CANCELLED" : "FAILED";
  await journal.finish({ schemaVersion: "1", mode: "FIXED_SOURCE_REAL_MODEL", status, stage: "AGENT_LOOP", caseId: "h001", runId: snapshot.runId,
    materializedCase: frozen, semantic, finalSnapshot: snapshot, trajectories: composition.trajectories.steps, events: composition.runtime.eventLog, loop,
    modelInvocations: invocations, sourceEnvironment: { network: "OFFLINE_FIXED_TRANSPORT", browser: "OFFLINE_FIXED_PAGES", scenario },
    sourceTrace: { navigations, googleQueries }, runCeilings: { maxAutomaticBrowserMs: timeoutMs, maxAgentSteps: maxSteps, maxBrowserModelCallsTotal: maxModelCalls, maxModelCalls },
    resourceUsage: { elapsedMs: Date.now() - startedAt, modelCallsStarted: modelCalls, browserModelCalls: invocations.filter((item) => item.purpose === "browser_read_decide").length,
      agentDecisions: invocations.filter((item) => item.purpose === "restaurant_agent_decide").length, googleRequests: { total: googleQueries.length, namedPlaceResolution: googleQueries.length, discovery: 0, placeDetails: 0 } },
    safety: { policy: "READ_ONLY_CODE_PATH", externalSideEffectCount: 0 },
    execution: { status, loopStatus: loop?.status, phase: snapshot.domainState.phase },
  });
  const evaluation = await evaluateArtifactAfterFinish(journal.resultPath);
  console.log(JSON.stringify({ mode: "FIXED_SOURCE_REAL_MODEL", scenario, status, phase: snapshot.domainState.phase,
    presentedCandidateIds: snapshot.domainState.presentedResults?.candidateIds ?? [], modelCalls, elapsedMs: Date.now() - startedAt,
    sourceTrace: { navigations, googleQueries }, artifactPath: journal.resultPath, evaluationPath: evaluation.outputPath,
    evaluationFailure: evaluation.evaluationFailure }, null, 2));
  if (status !== "SUCCEEDED" || evaluation.evaluation?.execution.taskProducedQualifiedResult !== (scenario === "BOTH_BOUNDED_EMPTY" ? "NO" : "YES")) process.exitCode = 1;
} catch (error) {
  const code = diagnosticFailureCode(error);
  await journal.finish({ status: code === "CANCELLED" ? "CANCELLED" : "FAILED", stage: "EXECUTION", failureCode: code,
    modelInvocations: invocations, sourceTrace: { navigations, googleQueries }, elapsedMs: Date.now() - startedAt });
  const evaluation = await evaluateArtifactAfterFinish(journal.resultPath);
  console.error(JSON.stringify({ failureCode: code, artifactPath: journal.resultPath, evaluationPath: evaluation.outputPath }));
  process.exitCode = 1;
}
