import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { ModelGateway, ModelInvocationRecord } from "../../../../core/model/contracts.js";
import type { BrowserExecutionDiagnostic } from "../../../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime } from "../../../../infrastructure/browser/browser-runtime.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { GooglePlacesClient } from "../../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../../integrations/google/google-places-restaurant-search.js";
import { LiveBrowserAvailability } from "../../../../integrations/restaurant-availability/live-browser-availability.js";
import { composeNativeRestaurantRead } from "../../../../integrations/restaurant-search/native-read-composition.js";
import { diagnosticFailureCode, startDiagnosticRun } from "../../../shared/diagnostic-run.js";
import { evaluateArtifactAfterFinish } from "../diagnostic-evaluator.js";
import { assessFixedSourceAcceptance, fixedNativeSourceUsage } from "../fixed-source-acceptance.js";
import type { FixedSourceExpectation } from "../fixed-source-case-registry.js";
import { createHybridReadComposition } from "../hybrid-read-composition.js";
import { loadFrozenLiveCases, RESTAURANT_READ_DEVELOPMENT_CASE_PATH } from "../live-case-materializer.js";
import { center, dynamicTabelogSourcePages, reference, sourcePages, type SourceScenario } from "../native-fixed-source-pages.js";
import { errorRecord, safeRecord, traceBrowserRuntime } from "./browser-case-slice-evidence.js";
import { finalizeNativeFixedSourceRun, type NativeFixedSourceFinalizationProgress } from "./native-fixed-source-runner-finalization.js";
import { createRunDeadlineSignal, RUN_DEADLINE_EXCEEDED } from "../live-run-deadline.js";

type ScenarioExpectation = Readonly<{
  acceptance: FixedSourceExpectation;
  requiredSources: readonly ("TABELOG" | "TABLECHECK")[];
  forbiddenSources?: readonly ("TABELOG" | "TABLECHECK")[];
}>;

const FIXED_SOURCE_RUNNER_SCENARIOS = [
  "TABELOG_DELIVERS", "TABLECHECK_RECOVERS", "BOTH_BOUNDED_EMPTY", "TABLECHECK_CONTINUES",
  "DYNAMIC_TABELOG_DELIVERS", "TABLECHECK_DISCOVERY_RECOVERS", "TABELOG_NONEMPTY_REGION_RECOVERS",
  "TABELOG_CURRENT_BATCH_DELIVERS", "TABLECHECK_CURRENT_BATCH_DELIVERS", "NATIVE_FACT_FOLLOWUP_DELIVERS",
  "TABLECHECK_SCOPED_MENU_DELIVERS",
] as const;
type FixedSourceRunnerScenario = typeof FIXED_SOURCE_RUNNER_SCENARIOS[number];

const qualifiedResultAcceptance = {
  kind: "QUALIFIED_RESULT",
  execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" },
  coverage: { necessary: true },
  requiredDimensions: ["AUTHORITATIVE_CONDITIONS", "REQUIRED_EVIDENCE", "INVESTIGATION_BEHAVIOR", "FINAL_CLAIM", "COMPLETION_OUTCOME", "RESOURCES"],
} satisfies FixedSourceExpectation;
const boundedEmptyAcceptance = {
  kind: "VERIFIED_NO_RESULT",
  execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "NO_VERIFIED_RESULT" },
  coverage: { necessary: true },
  // There is no presented claim to score in an ordinary bounded empty run.
  requiredDimensions: ["AUTHORITATIVE_CONDITIONS", "INVESTIGATION_BEHAVIOR", "COMPLETION_OUTCOME", "RESOURCES"],
  expectedPresentation: "NONE",
} satisfies FixedSourceExpectation;

const FIXED_SOURCE_SCENARIO_EXPECTATIONS: Readonly<Record<FixedSourceRunnerScenario, ScenarioExpectation>> = {
  TABELOG_DELIVERS: { acceptance: qualifiedResultAcceptance, requiredSources: ["TABELOG"], forbiddenSources: ["TABLECHECK"] },
  TABLECHECK_RECOVERS: { acceptance: qualifiedResultAcceptance, requiredSources: ["TABELOG", "TABLECHECK"] },
  BOTH_BOUNDED_EMPTY: { acceptance: boundedEmptyAcceptance, requiredSources: ["TABELOG", "TABLECHECK"] },
  TABLECHECK_CONTINUES: { acceptance: qualifiedResultAcceptance, requiredSources: ["TABELOG", "TABLECHECK"] },
  DYNAMIC_TABELOG_DELIVERS: { acceptance: qualifiedResultAcceptance, requiredSources: ["TABELOG"], forbiddenSources: ["TABLECHECK"] },
  TABLECHECK_DISCOVERY_RECOVERS: { acceptance: qualifiedResultAcceptance, requiredSources: ["TABELOG", "TABLECHECK"] },
  TABELOG_NONEMPTY_REGION_RECOVERS: { acceptance: qualifiedResultAcceptance, requiredSources: ["TABELOG"], forbiddenSources: ["TABLECHECK"] },
  TABELOG_CURRENT_BATCH_DELIVERS: { acceptance: qualifiedResultAcceptance, requiredSources: ["TABELOG"], forbiddenSources: ["TABLECHECK"] },
  TABLECHECK_CURRENT_BATCH_DELIVERS: { acceptance: qualifiedResultAcceptance, requiredSources: ["TABELOG", "TABLECHECK"] },
  NATIVE_FACT_FOLLOWUP_DELIVERS: { acceptance: qualifiedResultAcceptance, requiredSources: ["TABELOG"], forbiddenSources: ["TABLECHECK"] },
  TABLECHECK_SCOPED_MENU_DELIVERS: { acceptance: qualifiedResultAcceptance, requiredSources: ["TABELOG", "TABLECHECK"] },
};

function scenarioResult(
  scenario: FixedSourceRunnerScenario,
  status: "SUCCEEDED" | "FAILED" | "CANCELLED",
  phase: string,
  presentedCandidateIds: readonly string[],
  navigations: readonly string[],
  browserTrace: readonly Readonly<{ kind: string; detail: unknown }>[],
  qualifiedUserResult: "YES" | "NO" | "UNKNOWN" | undefined,
) {
  const expectation = FIXED_SOURCE_SCENARIO_EXPECTATIONS[scenario];
  const usage = fixedNativeSourceUsage(navigations, browserTrace);
  return {
    scenarioExpectation: { ...expectation, acceptance: expectation.acceptance },
    actualSystemBehavior: { status, phase, presentedCandidateIds, sourceUsage: usage },
    qualifiedUserResult: qualifiedUserResult ?? "UNKNOWN",
  };
}

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
const scenarioInput = option("--scenario");
if (!(FIXED_SOURCE_RUNNER_SCENARIOS as readonly string[]).includes(scenarioInput)) throw new Error("Unknown native fixed-source scenario");
const scenario = scenarioInput as FixedSourceRunnerScenario;
const maxModelCalls = boundedOption("--max-model-calls", 50);
const maxSteps = boundedOption("--max-steps", 30);
const timeoutMs = boundedOption("--timeout-ms", 500_000);
// Fixed-source native scenarios exercise the same bounded per-candidate read
// limits as the qualified delivery slice.  They remain visible in both the
// immutable execution artifact and the journal start record.
const nativeReadLimits = {
  maxCandidateBrowserMs: 60_000,
  maxProviderBrowserMs: 45_000,
  maxBrowserOperations: 30,
  maxBrowserModelCallsPerCandidate: 20,
} as const;
const frozen = (await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH)).find((item) => item.id === "h001");
if (!frozen) throw new Error("Frozen H001 is absent");
const startedAt = Date.now();
const deadlineControl = createRunDeadlineSignal(timeoutMs);
const deadline = deadlineControl.signal;
const taskId = `native-fixed-source-model:h001:${scenario}:${startedAt}`;
const invocations: ModelInvocationRecord[] = [];
const navigations: string[] = [];
const googleQueries: string[] = [];
const browserTrace: Array<{ sequence: number; at: string; kind: string; detail: unknown }> = [];
const browserDiagnostics: BrowserExecutionDiagnostic[] = [];
let browserTraceSequence = 0;
const finalizationProgress: NativeFixedSourceFinalizationProgress = { executionArtifactSaved: false };
let finalizedEvaluation: Awaited<ReturnType<typeof evaluateArtifactAfterFinish>> | undefined;
const recordBrowserTrace = (kind: string, detail: unknown) => {
  const sequence = ++browserTraceSequence;
  browserTrace.push({ sequence, at: new Date().toISOString(), kind, detail: safeRecord(detail) });
  return sequence;
};
const sourcePath = resolve(RESTAURANT_READ_DEVELOPMENT_CASE_PATH);
const dynamicSource = scenario === "DYNAMIC_TABELOG_DELIVERS";
const journal = await startDiagnosticRun(resolve(".eval-artifacts", "h001-native-fixed-source-model"), {
  mode: "FIXED_SOURCE_REAL_MODEL", caseId: "h001", sourceScenario: scenario,
  dataset: { path: RESTAURANT_READ_DEVELOPMENT_CASE_PATH, sha256: createHash("sha256").update(readFileSync(sourcePath)).digest("hex"), contaminationStatus: "PROMPT_AND_RESULT_EXPOSED", baselineEligible: false },
  sourceEnvironment: { network: "OFFLINE_FIXED_TRANSPORT", browser: dynamicSource ? "LOCAL_CHROMIUM_DYNAMIC_FIXED_PAGE" : "OFFLINE_FIXED_PAGES" },
  runCeilings: { maxModelCalls, maxSteps, timeoutMs, ...nativeReadLimits },
  safety: { policy: "READ_ONLY_CODE_PATH", externalSideEffectCount: 0 },
});

try {
  const provider = DeepSeekModelGateway.fromEnvironment(process.env, { observer: { observe: (record) => { invocations.push(structuredClone(record)); } } });
  let modelCalls = 0;
  const model: ModelGateway = { async complete(request) {
    if (deadline.aborted) throw Object.assign(new Error("Fixed-source deadline reached"), { code: RUN_DEADLINE_EXCEEDED });
    if (modelCalls >= maxModelCalls) throw Object.assign(new Error("Shared model budget reached"), { code: "MODEL_CALL_BUDGET_EXHAUSTED" });
    modelCalls += 1;
    return provider.complete({ ...request, timeoutMs: Math.min(request.timeoutMs, Math.max(1, timeoutMs - (Date.now() - startedAt))) });
  } };
  const clock = { now: () => new Date(reference.valueOf() + Date.now() - startedAt) };
  const rawBrowser = dynamicSource ? dynamicTabelogSourcePages() : sourcePages(scenario, navigations);
  // Source usage is evidence of both a navigation attempt and a page that was
  // actually observed. A fixture URL alone cannot satisfy a source scenario.
  const browser: BrowserRuntime = traceBrowserRuntime(rawBrowser, "TABELOG", recordBrowserTrace);
  const google = new GooglePlacesRestaurantSearch(new GooglePlacesClient({ apiKey: "fixed-transport-only", fetchImplementation: async (_url, init) => {
    const query = JSON.parse(String(init?.body)) as { textQuery: string };
    googleQueries.push(query.textQuery);
    return new Response(JSON.stringify({ places: [{ id: "shibuya-landmark", displayName: { text: "Shibuya" }, formattedAddress: "Shibuya, Tokyo", location: center,
      types: ["train_station"], addressComponents: [{ longText: "Tokyo", types: ["locality"] }] }] }), { status: 200 });
  } }), () => clock.now().toISOString(), 10, { maxRequests: 100 });
  const onBrowserDiagnostic = (diagnostic: BrowserExecutionDiagnostic) => browserDiagnostics.push(structuredClone(diagnostic));
  const native = composeNativeRestaurantRead(google, browser, model, undefined, onBrowserDiagnostic, undefined, () => clock.now().toISOString());
  const availability = new LiveBrowserAvailability(browser, model, {
    now: () => clock.now().toISOString(), maxModelCallsPerCandidate: nativeReadLimits.maxBrowserModelCallsPerCandidate, maxModelCallsTotal: maxModelCalls,
    maxOperationsPerCandidate: nativeReadLimits.maxBrowserOperations, maxElapsedMsPerCandidate: nativeReadLimits.maxCandidateBrowserMs, maxElapsedMsPerProvider: nativeReadLimits.maxProviderBrowserMs, maxAutomaticElapsedMs: nativeReadLimits.maxCandidateBrowserMs,
    onBrowserDiagnostic,
  });
  const composition = createHybridReadComposition({ taskId, runId: `run:${taskId}`, clock, model, search: native.search, facts: native.facts, availability,
    router: { structuredReadTimeoutMs: 30_000, browserReadTimeoutMs: Math.min(timeoutMs, nativeReadLimits.maxCandidateBrowserMs) }, loop: { maxSteps, timeoutMs } });
  const semantic = await composition.interpretAndDispatch({ taskId, message: String(frozen.content), referenceTime: frozen.reference_time, timezone: "Asia/Tokyo" });
  const loop = semantic.status === "PROPOSED" ? await composition.coordinator.run(taskId, deadline) : undefined;
  const snapshot = composition.runtime.snapshot(taskId);
  const status = loop?.status === "TERMINAL" && ["PRESENT_RESULTS", "NO_VERIFIED_RESULT"].includes(snapshot.domainState.phase) ? "SUCCEEDED"
    : loop?.status === "CANCELLED" ? "CANCELLED" : "FAILED";
  const presentedCandidateIds = snapshot.domainState.presentedResults?.candidateIds ?? [];
  const result = { schemaVersion: "1", mode: "FIXED_SOURCE_REAL_MODEL", status, stage: "AGENT_LOOP", caseId: "h001", runId: snapshot.runId,
    materializedCase: frozen, semantic, finalSnapshot: snapshot, trajectories: composition.trajectories.steps, events: composition.runtime.eventLog, loop,
    modelInvocations: invocations, sourceEnvironment: { network: "OFFLINE_FIXED_TRANSPORT", browser: dynamicSource ? "LOCAL_CHROMIUM_DYNAMIC_FIXED_PAGE" : "OFFLINE_FIXED_PAGES", scenario },
    sourceTrace: { navigations, googleQueries, browserDiagnostics, browserTrace }, runCeilings: { maxAutomaticBrowserMs: timeoutMs, maxAgentSteps: maxSteps, maxBrowserModelCallsTotal: maxModelCalls, maxModelCalls, ...nativeReadLimits },
    resourceUsage: { elapsedMs: Date.now() - startedAt, modelCallsStarted: modelCalls, browserModelCalls: invocations.filter((item) => item.purpose === "browser_read_decide").length,
      agentDecisions: invocations.filter((item) => item.purpose === "restaurant_agent_decide").length, googleRequests: { total: googleQueries.length, namedPlaceResolution: googleQueries.length, discovery: 0, placeDetails: 0 } },
    safety: { policy: "READ_ONLY_CODE_PATH", externalSideEffectCount: 0 },
    execution: { status, loopStatus: loop?.status, phase: snapshot.domainState.phase, ...(loop?.status === "TIMEOUT" || deadline.aborted ? { failureCode: RUN_DEADLINE_EXCEEDED } : {}) },
  } as const;
  let acceptance: ReturnType<typeof assessFixedSourceAcceptance> | undefined;
  const finalized = await finalizeNativeFixedSourceRun({
    journal,
    result,
    progress: finalizationProgress,
    evaluate: evaluateArtifactAfterFinish,
    buildAcceptanceSidecar: (evaluation) => {
      finalizedEvaluation = evaluation;
      const report = scenarioResult(scenario, status, snapshot.domainState.phase, presentedCandidateIds, navigations, browserTrace,
        evaluation.evaluation?.execution.taskProducedQualifiedResult);
      const scenarioExpectation = FIXED_SOURCE_SCENARIO_EXPECTATIONS[scenario];
      const sourceUsage = fixedNativeSourceUsage(navigations, browserTrace);
      acceptance = assessFixedSourceAcceptance({
        expectation: scenarioExpectation.acceptance,
        execution: { status, ...(loop?.status ? { loopStatus: loop.status } : {}), phase: snapshot.domainState.phase },
        ...(evaluation.evaluation ? { evaluation: evaluation.evaluation } : {}),
        ...(evaluation.evaluationFailure ? { evaluationFailure: evaluation.evaluationFailure } : {}),
        sourceRequirements: { requiredSources: scenarioExpectation.requiredSources, ...(scenarioExpectation.forbiddenSources ? { forbiddenSources: scenarioExpectation.forbiddenSources } : {}) },
        sourceUsage,
        presentedResult: {
          candidateIds: presentedCandidateIds,
          ...(snapshot.domainState.selectionSession?.resultBatchTarget ? { resultBatchTarget: snapshot.domainState.selectionSession.resultBatchTarget } : {}),
          ...(snapshot.domainState.intentDraft?.target?.requestedResultCount !== undefined ? { requestedResultCount: snapshot.domainState.intentDraft.target.requestedResultCount } : {}),
        },
      });
      return {
        schemaVersion: "1",
        sourceArtifact: { path: journal.resultPath },
        ...(evaluation.outputPath ? { evaluationPath: evaluation.outputPath } : {}),
        ...(evaluation.evaluationFailure ? { evaluationFailure: evaluation.evaluationFailure } : {}),
        scenario,
        ...report,
        acceptance,
      };
    },
  });
  finalizedEvaluation = finalized.evaluation;
  if (!acceptance) throw new Error("Fixed-source acceptance sidecar was not produced");
  console.log(JSON.stringify({ mode: "FIXED_SOURCE_REAL_MODEL", status, phase: snapshot.domainState.phase,
    presentedCandidateIds, modelCalls, elapsedMs: Date.now() - startedAt,
    sourceTrace: { navigations, googleQueries, browserDiagnostics, browserTrace }, artifactPath: journal.resultPath, acceptancePath: finalized.acceptancePath,
    evaluationPath: finalizedEvaluation.outputPath, evaluationFailure: finalizedEvaluation.evaluationFailure, acceptance }, null, 2));
  process.exitCode = acceptance.exitCode;
} catch (error) {
  const code = diagnosticFailureCode(error);
  if (!finalizationProgress.executionArtifactSaved) {
    await journal.finish({ status: code === "CANCELLED" ? "CANCELLED" : "FAILED", stage: "EXECUTION", failureCode: code,
      modelInvocations: invocations, sourceTrace: { navigations, googleQueries, browserDiagnostics, browserTrace }, elapsedMs: Date.now() - startedAt });
    finalizationProgress.executionArtifactSaved = true;
  }
  finalizedEvaluation ??= finalizationProgress.evaluation ?? await evaluateArtifactAfterFinish(journal.resultPath);
  console.error(JSON.stringify({ failureCode: code, artifactPath: journal.resultPath, evaluationPath: finalizedEvaluation.outputPath,
    evaluationFailure: finalizedEvaluation.evaluationFailure, evaluationFailurePath: finalizedEvaluation.failurePath }));
  process.exitCode = 1;
} finally {
  deadlineControl.dispose();
}
