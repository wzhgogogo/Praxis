import { resolve } from "node:path";

import type { ModelGateway } from "../../../../core/model/contracts.js";
import type { RestaurantAvailabilityRequest, RestaurantCandidate } from "../../../../domains/restaurant/contracts.js";
import { restaurantAvailabilityRequestFingerprint } from "../../../../domains/restaurant/contracts.js";
import { RESTAURANT_TEMPORAL_MATERIALIZATION_POLICY } from "../../../../domains/restaurant/temporal-materialization.js";
import { ModelBrowserReadActionDecision, type BrowserReadActionDecisionPort } from "../../../../infrastructure/browser/browser-action-decision.js";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime } from "../../../../infrastructure/browser/browser-runtime.js";
import { LocalPlaywrightChromium } from "../../../../infrastructure/browser/local-playwright-chromium.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { TabelogBrowserAvailability } from "../../../../integrations/tabelog/tabelog-browser-availability.js";
import { TableCheckBrowserAvailability } from "../../../../integrations/tablecheck/tablecheck-browser-availability.js";
import { loadFrozenLiveCases, materializeLiveCase, RESTAURANT_READ_DEVELOPMENT_CASE_PATH } from "../live-case-materializer.js";
import { startDiagnosticRun } from "../../../shared/diagnostic-run.js";
import { errorRecord, safeActionTargets, safeRecord, traceBrowserRuntime } from "./browser-case-slice-evidence.js";
import { environmentWithEffectiveLiveNetwork, resolveEffectiveLiveNetworkConfiguration, runLivePreflight } from "../live-preflight.js";

const caseId = process.argv[process.argv.indexOf("--case") + 1];
const execute = process.argv.includes("--execute");
const h001Tomorrow = process.argv.includes("--h001-tomorrow");
if (!caseId || !["h001", "h002", "h003", "h005"].includes(caseId)) throw new Error("Use --case h001|h002|h003|h005");
if (h001Tomorrow && caseId !== "h001") throw new Error("--h001-tomorrow applies only to H001");
if (process.argv.some(arg => arg.startsWith("--") && !["--case", "--execute", "--plan", "--h001-tomorrow", "--no-proxy"].includes(arg))) throw new Error("Unknown option");

// Historical native entrances are browser-control probes, not newly qualified
// Case candidates. Their current identity and inventory must be re-observed.
const source = caseId === "h001" ? {
  provider: "TABELOG" as const,
  url: "https://tabelog.com/en/tokyo/A1303/A130301/13308491/",
  id: "en/tokyo/A1303/A130301/13308491", name: "Sushi Teppen", address: "東京都渋谷区宇田川町42-4 2F",
  sourceIds: { tabelog: "en/tokyo/A1303/A130301/13308491", tabelogNativeDetailUri: "https://tabelog.com/en/tokyo/A1303/A130301/13308491/" },
  provenance: "H001_2026_09_29_NATIVE_LIVE",
} : {
  provider: "TABLECHECK" as const,
  url: "https://www.tablecheck.com/en/0711-ginzabistro",
  id: "0711-ginzabistro", name: "0711 GiNZA BiSTRO", address: "104-0061 Tokyo Chuoku Ginza 8-7-7 Chuohayashi Building 3F",
  sourceIds: { tablecheck: "0711-ginzabistro", tablecheckNativeGuideUri: "https://www.tablecheck.com/en/0711-ginzabistro" },
  provenance: "H003_2026_09_24_NATIVE_SOURCE_DETAIL",
};
if (source.provider === "TABELOG" && source.sourceIds.tabelog !== new URL(source.url).pathname.replace(/^\/+|\/+$/g, "")) {
  throw new Error("Historical Tabelog source ID must match the source-native detail path before any browser or model call");
}

const frozen = (await loadFrozenLiveCases(resolve(RESTAURANT_READ_DEVELOPMENT_CASE_PATH))).find(item => item.id === caseId);
if (!frozen) throw new Error("Frozen development case is missing");
const referenceTime = new Date().toISOString();
const materialized = materializeLiveCase(frozen, referenceTime);
const semantic = materialized.semantic as { date?: { value?: string }; time?: { value?: string; start?: string; end?: string }; party_size?: number };
const originalDate = semantic.date?.value;
// The Sep 29 authorization says "tomorrow" specifically: freeze Sep 30 so a
// later invocation cannot silently advance the diagnostic to another date.
const h001AuthorizedDate = "2026-09-30";
const date = h001Tomorrow ? h001AuthorizedDate : originalDate;
const exact = semantic.time?.value;
const window = exact ? { earliest: exact, latest: exact } : semantic.time?.start && semantic.time.end
  ? { earliest: semantic.time.start, latest: semantic.time.end } : undefined;
const partySize = semantic.party_size;
if (!date || !window || !partySize) throw new Error("Materialized case has no complete availability parameters");
const candidate: RestaurantCandidate = {
  restaurant: { id: `browser-slice:${caseId}`, outletName: source.name, address: source.address,
    sourceIds: source.sourceIds, provenance: { observedEntrance: source.provenance } },
  matchReasons: [], warnings: ["Historical source entrance; current request suitability is not established"], executionConfidence: "LOW",
};
const request: RestaurantAvailabilityRequest = {
  candidates: [candidate], candidateIds: [candidate.restaurant.id], date, timeWindow: window, partySize,
  hardCriteria: [], // Facts and Case qualification are outside this browser-control slice.
  ...(caseId === "h005" ? { immediateAvailability: {
    validUntil: new Date(new Date(referenceTime).valueOf() + RESTAURANT_TEMPORAL_MATERIALIZATION_POLICY.immediate.validityMinutes * 60_000).toISOString(),
    sourceSlotPolicy: "EXACT_ONLY" as const,
  } } : {}),
};
const requestFingerprint = restaurantAvailabilityRequestFingerprint(request);
const tokyoParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(referenceTime));
const tokyoPart = (type: string) => tokyoParts.find(item => item.type === type)?.value ?? "";
const currentDate = `${tokyoPart("year")}-${tokyoPart("month")}-${tokyoPart("day")}`;
const currentMinute = `${tokyoPart("hour")}:${tokyoPart("minute")}`;
const elapsedWindow = date < currentDate || date === currentDate && window.latest < currentMinute;
const plan = { mode: "BROWSER_EXECUTION_SLICE_PLAN", caseId, dataset: frozen.dataset, referenceTime,
  ...(h001Tomorrow ? { diagnosticVariant: { id: "H001_TOMORROW_USER_AUTHORIZED", originalRequest: {
    content: frozen.content, materializedDateAtRun: originalDate, dateAtAuthorization: "2026-09-29", timeWindow: window, partySize }, authorizedDate: date,
    basis: "User explicitly authorized tomorrow for H001 browser diagnosis; frozen Gold is unchanged" } } : {}),
  source: { provider: source.provider, url: source.url, historicalEvidence: source.provenance },
  request: { date, timeWindow: window, partySize, requestFingerprint,
    ...(request.immediateAvailability ? { immediateAvailability: request.immediateAvailability } : {}) },
  applicability: elapsedWindow ? "REQUEST_WINDOW_ELAPSED" : "CURRENT_OR_FUTURE",
  limits: { browserReadMs: 45_000, providerMs: 30_000, modelCalls: 5 },
  boundaries: ["No semantic interpretation", "No Google discovery or geocoding", "No cross-source matching or facts", "No booking write", "No Case qualification"] };
if (!execute || process.argv.includes("--plan")) { console.log(JSON.stringify(plan, null, 2)); process.exit(0); }
for (const gate of ["PRAXIS_ALLOW_LIVE_RESTAURANT_READ", "PRAXIS_ALLOW_BROWSER_RUN", "PRAXIS_ALLOW_LIVE_MODEL_EVAL"] as const) {
  if (process.env[gate] !== "1") throw new Error(`${gate}=1 is required for the explicit browser-only read`);
}
const effectiveNetwork = resolveEffectiveLiveNetworkConfiguration(process.env);
const effectiveEnvironment = environmentWithEffectiveLiveNetwork(process.env, effectiveNetwork);
if (effectiveEnvironment.PRAXIS_BROWSER_ENGINE !== "LOCAL_CHROMIUM" || effectiveEnvironment.PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER) {
  throw new Error("Use LOCAL_CHROMIUM on its default browser network without a browser proxy");
}
if (elapsedWindow) throw new Error(`The materialized ${caseId} request window has elapsed; no stale inventory query was sent`);
const preflight = await runLivePreflight({
  runner: "BROWSER_CASE_SLICE",
  targets: ["DEEPSEEK", source.provider],
  network: effectiveNetwork,
  timeoutMs: 10_000,
});
const trace: Array<Record<string, unknown>> = [];
let sequence = 0;
const record = (kind: string, detail: unknown): number => {
  const current = ++sequence;
  trace.push({ sequence: current, at: new Date().toISOString(), kind, detail: safeRecord(detail) });
  return current;
};
let modelCalls = 0;
const gateway = DeepSeekModelGateway.fromEnvironment(effectiveEnvironment, { observer: { observe: invocation => { record("MODEL_INVOCATION", invocation); } } });
const model: ModelGateway = { async complete(input) {
  if (modelCalls >= 5) throw Object.assign(new Error("Browser slice model-call ceiling reached"), { code: "MODEL_CALL_BUDGET_EXHAUSTED" });
  modelCalls += 1;
  return gateway.complete(input);
} };
const underlyingDecision = new ModelBrowserReadActionDecision(model);
const modelDecision: BrowserReadActionDecisionPort = { async decide(input) {
  record("MODEL_INPUT", { ...input, observation: { ...input.observation, visibleText: "[OMITTED_FULL_PAGE_TEXT]",
    targets: safeActionTargets(input.observation.targets) } }); // Keep complete action targets without page reviews/profiles.
  try {
    const action = await underlyingDecision.decide(input);
    record("MODEL_ACTION", action);
    return action;
  } catch (error) {
    record("MODEL_DECISION_ERROR", errorRecord(error));
    throw error;
  }
} };
const underlyingRuntime = LocalPlaywrightChromium.fromEnvironment(effectiveEnvironment);
const runtime: BrowserRuntime = traceBrowserRuntime(underlyingRuntime, source.provider, record);
const executor = new BrowserTaskExecutor(runtime, {
  modelDecision, maxModelCallsPerCandidate: 5, maxModelCallsTotal: 5,
  maxElapsedMsPerCandidate: 45_000, maxElapsedMsPerProvider: 30_000, maxAutomaticElapsedMs: 45_000,
  maxOperationsPerCandidate: 24, onDiagnostic: (event: BrowserExecutionDiagnostic) => record("EXECUTOR_DIAGNOSTIC", event),
});
const journal = await startDiagnosticRun(resolve(".eval-artifacts", "browser-case-slices"), {
  mode: "LIVE_READ_ONLY_BROWSER_EXECUTION_SLICE", caseId, plan: safeRecord(plan),
  preflight: { artifactPath: preflight.artifactPath, elapsedMs: preflight.elapsedMs },
});
const startedAt = Date.now();
const signal = AbortSignal.timeout(45_000);
let summary: Record<string, unknown>;
let adapterResult: unknown;
let failure: Record<string, unknown> | undefined;
try {
  const adapter = source.provider === "TABELOG"
    ? new TabelogBrowserAvailability(executor, undefined, undefined, {
      onIdentityDiagnostic: diagnostic => record("IDENTITY_DIAGNOSTIC", diagnostic),
    })
    : new TableCheckBrowserAvailability(executor);
  const result = await adapter.check(request, signal);
  adapterResult = safeRecord(result);
  const check = result.availabilityChecks[candidate.restaurant.id];
  const immediateStillCurrent = request.immediateAvailability ? Date.now() <= Date.parse(request.immediateAvailability.validUntil) : undefined;
  summary = { status: immediateStillCurrent === false ? "UNKNOWN" : check?.status ?? "UNKNOWN",
    reasonCode: immediateStillCurrent === false ? "IMMEDIATE_REQUEST_EXPIRED" : check?.reasonCode,
    requestFingerprint, offerCount: result.offers.length, evidenceCount: result.evidence.length,
    identityHigh: result.evidence.some(item => item.kind === "ENTITY_MATCH" && item.entityMatch?.confidence === "HIGH"),
    immediateStillCurrent };
} catch (error) {
  failure = errorRecord(error);
  summary = { status: "FAILED", reasonCode: signal.aborted ? "BROWSER_TIMEOUT"
    : error && typeof error === "object" && "code" in error ? String(error.code) : "BROWSER_RUNTIME_FAILED" };
} finally {
  try { await executor.close(); } catch (error) { record("CLOSE_ERROR", errorRecord(error)); }
}
const diagnosticEvents = trace.filter(item => item.kind === "EXECUTOR_DIAGNOSTIC").map(item => item.detail as BrowserExecutionDiagnostic);
const artifact = { elapsedMs: Date.now() - startedAt, modelCalls,
  browserOperations: diagnosticEvents.filter(item => item.event === "OPERATION_STARTED").length,
  browserNavigations: diagnosticEvents.filter(item => item.event === "OPERATION_STARTED" && item.detail === "NAVIGATE").length,
  browserSnapshots: trace.filter(item => item.kind === "SNAPSHOT").length,
  modelActions: trace.filter(item => item.kind === "MODEL_ACTION").length,
  adapterRequest: safeRecord(request), adapterResult, trace,
  ...(failure ? { failure } : {}), result: summary! };
await journal.finish({ status: summary!.status === "FAILED" ? "FAILED" : "SUCCEEDED", ...artifact });
console.log(JSON.stringify({ artifactPath: journal.resultPath, result: summary, elapsedMs: artifact.elapsedMs,
  modelCalls, browserOperations: artifact.browserOperations, modelActions: artifact.modelActions }));
