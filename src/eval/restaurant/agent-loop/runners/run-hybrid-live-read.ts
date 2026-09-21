import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";

import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET } from "../../../../application/live-read-investigation-budget.js";
import type { ModelGateway, ModelInvocationRecord } from "../../../../core/model/contracts.js";
import { RestaurantSemanticInterpreter } from "../../../../domains/restaurant/semantic-interpreter.js";
import { browserRuntimeFromEnvironment } from "../../../../infrastructure/browser/browser-runtime-factory.js";
import type { BrowserExecutionBudget } from "../../../../infrastructure/browser/browser-task-executor.js";
import type { BrowserExecutionDiagnostic } from "../../../../infrastructure/browser/browser-task-executor.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { GooglePlacesClient } from "../../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../../integrations/google/google-places-restaurant-search.js";
import { LiveBrowserAvailability } from "../../../../integrations/restaurant-availability/live-browser-availability.js";
import { composeLiveRestaurantFactRead } from "../../../../integrations/restaurant-facts/live-restaurant-facts.js";
import type { TableCheckIdentityDiagnostic } from "../../../../integrations/tablecheck/tablecheck-contracts.js";
import type { TabelogIdentityDiagnostic, TabelogUserInterventionRequired } from "../../../../integrations/tabelog/tabelog-contracts.js";
import { loadFrozenLiveCases, materializeLiveCase, RESTAURANT_READ_DEVELOPMENT_CASE_PATH, RESTAURANT_READ_DEVELOPMENT_DATASET_VERSION } from "../live-case-materializer.js";
import { HIGASHI_GINZA_EVALUATION_LOCATION } from "../live-evaluation-location.js";
import { requiresEvaluationLocation } from "../evaluation-location-selection.js";
import { createHybridReadComposition } from "../hybrid-read-composition.js";
import { captureHybridLiveProgress } from "../hybrid-live-artifact.js";
import { RestaurantPartySizeSupplementResolver } from "../../../../domains/restaurant/party-size-supplement-resolver.js";
import { evaluateArtifactAfterFinish, RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION } from "../diagnostic-evaluator.js";
import { settleAtRunDeadline } from "../live-run-deadline.js";
import { diagnosticFailureCode, startDiagnosticRun } from "../../../shared/diagnostic-run.js";

function requiredGate(key: string): void {
  if (process.env[key] !== "1") throw new Error(`Set ${key}=1 to run a Live / Hybrid read diagnostic`);
}

function requiredValue(key: string): void {
  if (!process.env[key]?.trim()) throw new Error(`${key} is required for the H001 live read diagnostic`);
}

function caseIdFromArgs(): string {
  const index = process.argv.indexOf("--case");
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1]! : "h001";
}

/** Eval-only discovery cap; the frozen case input itself is unchanged. */
function candidateLimitFromArgs(): number {
  const index = process.argv.indexOf("--candidate-limit");
  if (index < 0) return 10;
  const value = Number(process.argv[index + 1]);
  if (!Number.isInteger(value) || value < 1 || value > 20) throw new Error("--candidate-limit must be an integer from 1 to 20");
  return value;
}

function manualTabelogInterventionEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
  return environment.PRAXIS_EVAL_ALLOW_TABELOG_MANUAL_INTERVENTION === "1";
}

function safeGitContext(): { commitSha: string; worktree: "CLEAN" | "DIRTY" | "UNKNOWN" } {
  try {
    const commitSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const dirty = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim().length > 0;
    return { commitSha, worktree: dirty ? "DIRTY" : "CLEAN" };
  } catch {
    return { commitSha: "UNKNOWN", worktree: "UNKNOWN" };
  }
}

function fileSha256(path: string): string {
  return createHash("sha256").update(readFileSync(resolve(path))).digest("hex");
}

async function waitForManualTabelogIntervention(input: TabelogUserInterventionRequired): Promise<void> {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log(
      `User intervention required. Complete the site verification in the open browser for ${input.candidate.outletName}, then press Enter to resume.`,
    );
    await terminal.question("");
  } finally {
    terminal.close();
  }
}

requiredGate("PRAXIS_ALLOW_LIVE_RESTAURANT_READ");
requiredGate("PRAXIS_ALLOW_BROWSER_RUN");
requiredGate("PRAXIS_ALLOW_LIVE_MODEL_EVAL");
requiredValue("DEEPSEEK_API_KEY");
requiredValue("GOOGLE_MAPS_API_KEY");
if (process.env.PRAXIS_BROWSER_ENGINE !== "LOCAL_CHROMIUM") {
  requiredValue("CLOUDFLARE_ACCOUNT_ID");
  requiredValue("CLOUDFLARE_API_TOKEN");
}
const manualTabelogIntervention = manualTabelogInterventionEnabled();
if (manualTabelogIntervention && process.env.PRAXIS_BROWSER_ENGINE !== "LOCAL_CHROMIUM") {
  throw new Error("PRAXIS_EVAL_ALLOW_TABELOG_MANUAL_INTERVENTION=1 requires PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM");
}
if (manualTabelogIntervention && process.env.PRAXIS_LOCAL_CHROMIUM_INTERACTIVE !== "1") {
  throw new Error("PRAXIS_EVAL_ALLOW_TABELOG_MANUAL_INTERVENTION=1 requires PRAXIS_LOCAL_CHROMIUM_INTERACTIVE=1");
}
if (manualTabelogIntervention && !process.stdin.isTTY) {
  throw new Error("PRAXIS_EVAL_ALLOW_TABELOG_MANUAL_INTERVENTION=1 requires an interactive terminal");
}
const sourcePath = resolve(RESTAURANT_READ_DEVELOPMENT_CASE_PATH);
const selectedId = caseIdFromArgs();
const candidateLimit = candidateLimitFromArgs();
const source = await loadFrozenLiveCases(sourcePath);
const frozen = source.find((entry) => entry.id === selectedId);
if (!frozen) throw new Error(`Unknown frozen E2E case: ${selectedId}`);
if (frozen.dataset !== RESTAURANT_READ_DEVELOPMENT_DATASET_VERSION) throw new Error("Development case dataset version does not match the Runner");
if ((process.env.PRAXIS_EVAL_USER_LAT && !process.env.PRAXIS_EVAL_USER_LNG) || (!process.env.PRAXIS_EVAL_USER_LAT && process.env.PRAXIS_EVAL_USER_LNG)) {
  throw new Error("PRAXIS_EVAL_USER_LAT and PRAXIS_EVAL_USER_LNG must be set together");
}

const startedAt = new Date();
const materialized = materializeLiveCase(frozen, startedAt.toISOString());
const { content: rawRequest, ...materializedCase } = materialized;
const runtimeContext = {
  ...safeGitContext(),
  dataset: {
    version: RESTAURANT_READ_DEVELOPMENT_DATASET_VERSION,
    sourcePath: RESTAURANT_READ_DEVELOPMENT_CASE_PATH,
    sha256: fileSha256(sourcePath),
    cohort: "DEVELOPMENT_DIAGNOSTIC",
    contaminationStatus: "PROMPT_AND_RESULT_EXPOSED",
    baselineEligible: false,
  },
  browserEngine: process.env.PRAXIS_BROWSER_ENGINE ?? "AUTO",
  nodeVersion: process.version,
  skillHashes: {
    browserRead: fileSha256("web-skills/browser-read/SKILL.md"),
    tablecheck: fileSha256("web-skills/tablecheck/SKILL.md"),
    tabelog: fileSha256("web-skills/tabelog/SKILL.md"),
  },
};
// Optional run-specific ceilings only tighten the existing debugging limits.
function runCeiling(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isSafeInteger(value) || value < 1 || value > fallback) throw new Error(`${flag} must be between 1 and ${fallback}`);
  return value;
}

const maxModelCalls = runCeiling("--max-model-calls", 150);
const liveReadLimits = {
  ...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,
  maxGoogleRequests: runCeiling("--max-google-requests", LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxGoogleRequests),
  maxAutomaticBrowserMs: runCeiling("--timeout-ms", LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxAutomaticBrowserMs),
  maxBrowserOperationsPerCandidate: runCeiling("--max-browser-operations", LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxBrowserOperationsPerCandidate),
  maxCandidateBrowserMs: runCeiling("--max-candidate-browser-ms", LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxCandidateBrowserMs),
  maxProviderBrowserMs: runCeiling("--max-provider-browser-ms", LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxProviderBrowserMs),
};
let modelCallsStarted = 0;
const taskId = `hybrid-live:${materialized.id}:${startedAt.valueOf()}`;
const runId = `run:${taskId}`;
const clock = { now: () => new Date() };
const modelInvocations: ModelInvocationRecord[] = [];
const journal = await startDiagnosticRun(resolve(".eval-artifacts", "restaurant-hybrid-live-read"), {
  mode: "HYBRID_LIVE_READ", caseId: materialized.id,
  scorerStatus: "FULL_RUBRIC_NOT_INTEGRATED",
  diagnosticEvaluator: { version: RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, rubricVersion: RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION },
  runtimeContext,
  safety: { policy: "READ_ONLY_CODE_PATH", externalSideEffectCount: "NOT_MEASURED" },
  runCeilings: { maxModelCalls, ...liveReadLimits },
});
// This is real elapsed time, deliberately independent of the Runtime clock
// used to materialize business dates and evidence freshness.  It begins before
// semantic interpretation so Parser/model setup cannot sit outside the run cap.
const deadline = AbortSignal.timeout(liveReadLimits.maxAutomaticBrowserMs);
// Some browser/provider implementations leave only unref'ed work while a
// promise is still pending. Keep this diagnostic process alive until its
// result artifact has been finalized; an orphaned STARTED record is neither a
// usable live result nor a diagnosable failure.
const lifecycleKeepAlive = setInterval(() => undefined, 30_000);
let stage = "SEMANTIC";
let semantic: Awaited<ReturnType<RestaurantSemanticInterpreter["interpret"]>> | undefined;
let composition: ReturnType<typeof createHybridReadComposition> | undefined;
let googleSearch: GooglePlacesRestaurantSearch | undefined;
// These append-only records are intentionally allocated before provider setup:
// a timeout/error artifact must preserve work observed before the failing
// await, not merely the successful-path summary.
const tabelogIdentityDiagnostics: TabelogIdentityDiagnostic[] = [];
const tableCheckIdentityDiagnostics: TableCheckIdentityDiagnostic[] = [];
const tabelogUserInterventions: TabelogUserInterventionRequired[] = [];
const browserExecutionDiagnostics: BrowserExecutionDiagnostic[] = [];
const browserBudget: BrowserExecutionBudget = { totalModelCalls: 0 };

function captureProgress() {
  let googleRequestUsage: ReturnType<GooglePlacesRestaurantSearch["googleRequestUsage"]> | undefined;
  try {
    const snapshot = composition?.runtime.snapshot(taskId);
    if (googleSearch && snapshot) {
      googleRequestUsage = googleSearch.googleRequestUsage(`${snapshot.runId}:investigation:${snapshot.domainState.investigationRevision ?? 0}`);
    }
  } catch { /* The shared capture still preserves completed trajectory data when Runtime state is unavailable. */ }
  return captureHybridLiveProgress({
    composition, taskId, startedAtMs: startedAt.valueOf(), modelInvocations,
    ...(googleRequestUsage ? { googleRequestUsage } : {}),
    diagnostics: {
      tablecheckIdentity: tableCheckIdentityDiagnostics,
      tabelogIdentity: tabelogIdentityDiagnostics,
      tabelogUserInterventions,
      browserExecution: browserExecutionDiagnostics,
    },
  });
}
try {
  const providerModel = DeepSeekModelGateway.fromEnvironment(process.env, {
    observer: { observe: (record) => { modelInvocations.push(structuredClone(record)); } },
  });
  const model: ModelGateway = { async complete(request) {
    if (modelCallsStarted >= maxModelCalls) throw Object.assign(new Error("Run model-call ceiling reached"), { code: "MODEL_CALL_BUDGET_EXHAUSTED" });
    modelCallsStarted += 1;
    const remainingMs = liveReadLimits.maxAutomaticBrowserMs - (Date.now() - startedAt.valueOf());
    if (remainingMs <= 0) throw Object.assign(new Error("Run deadline reached"), { code: "CANCELLED" });
    return providerModel.complete({ ...request, timeoutMs: Math.min(request.timeoutMs, remainingMs) });
  } };
  stage = "PROVIDER_SETUP";
  const evaluationLocation = process.env.PRAXIS_EVAL_USER_LAT && process.env.PRAXIS_EVAL_USER_LNG
    ? {
        label: "Explicit evaluation coordinate",
        latitude: Number(process.env.PRAXIS_EVAL_USER_LAT),
        longitude: Number(process.env.PRAXIS_EVAL_USER_LNG),
        radiusMeters: HIGASHI_GINZA_EVALUATION_LOCATION.radiusMeters,
        source: "PRAXIS_EVAL_USER_LAT/PRAXIS_EVAL_USER_LNG",
      }
    : requiresEvaluationLocation(frozen) ? HIGASHI_GINZA_EVALUATION_LOCATION : undefined;
  const search = new GooglePlacesRestaurantSearch(
    new GooglePlacesClient({ apiKey: process.env.GOOGLE_MAPS_API_KEY ?? "", timeoutMs: liveReadLimits.maxStructuredReadMs }),
    undefined,
    candidateLimit,
    { maxRequests: liveReadLimits.maxGoogleRequests },
  );
  googleSearch = search;
  const browser = browserRuntimeFromEnvironment();
  const availability = new LiveBrowserAvailability(browser, model, {
    browserBudget,
    maxTableCheckBrowserSessions: liveReadLimits.maxTableCheckBrowserSessions,
    maxTabelogBrowserSessions: liveReadLimits.maxTabelogBrowserSessions,
    maxTabelogCandidateMatches: liveReadLimits.maxTabelogCandidateMatches,
    maxModelCallsPerCandidate: liveReadLimits.maxBrowserModelCallsPerCandidate,
    maxModelCallsTotal: liveReadLimits.maxBrowserModelCallsTotal,
    maxOperationsPerCandidate: liveReadLimits.maxBrowserOperationsPerCandidate,
    maxElapsedMsPerCandidate: liveReadLimits.maxCandidateBrowserMs,
    maxElapsedMsPerProvider: liveReadLimits.maxProviderBrowserMs,
    maxAutomaticElapsedMs: liveReadLimits.maxAutomaticBrowserMs,
    onBrowserDiagnostic: (diagnostic) => browserExecutionDiagnostics.push(structuredClone(diagnostic)),
    onTableCheckIdentityDiagnostic: (diagnostic) => tableCheckIdentityDiagnostics.push(diagnostic),
    onTabelogIdentityDiagnostic: (diagnostic) => tabelogIdentityDiagnostics.push(diagnostic),
    ...(manualTabelogIntervention
      ? {
          onTabelogUserInterventionRequired: async (intervention: TabelogUserInterventionRequired) => {
            tabelogUserInterventions.push(structuredClone(intervention));
            await waitForManualTabelogIntervention(intervention);
          },
        }
      : {}),
  });
  composition = createHybridReadComposition({
    taskId,
    runId,
    clock,
    model,
    search,
    availability,
    partySizeSupplementResolver: new RestaurantPartySizeSupplementResolver(model),
    facts: composeLiveRestaurantFactRead(search, browser, model, browserBudget, undefined, (diagnostic) => browserExecutionDiagnostics.push(structuredClone(diagnostic))),
    router: {
      structuredReadTimeoutMs: liveReadLimits.maxStructuredReadMs,
      // An explicit human pause is outside the automatic browser-read deadline.
      // The H001 outer-loop deadline is the whole diagnostic cap, not a product SLA.
      browserReadTimeoutMs: manualTabelogIntervention ? null : liveReadLimits.maxAutomaticBrowserMs,
    },
    loop: {
      maxSteps: liveReadLimits.maxAgentSteps,
      maxRejectedActions: liveReadLimits.maxRejectedActions,
      timeoutMs: liveReadLimits.maxAutomaticBrowserMs,
    },
  });
  stage = "SEMANTIC";
  semantic = await settleAtRunDeadline(composition.interpretAndDispatch({
    taskId,
    message: String(materialized.content ?? ""),
    referenceTime: startedAt.toISOString(),
    timezone: "Asia/Tokyo",
  }, evaluationLocation), deadline);
  if (semantic.status !== "PROPOSED") throw Object.assign(new Error("Semantic Interpreter did not produce a proposal"), { code: semantic.status });
  stage = "AGENT_LOOP";
  const { coordinator } = composition;
  console.log(JSON.stringify({
    mode: "HYBRID_LIVE_READ",
    caseId: materialized.id,
    browserEngine: process.env.PRAXIS_BROWSER_ENGINE ?? "AUTO",
    candidateLimit,
    profileMode: manualTabelogIntervention ? "PERSISTENT_EVAL" : "TEMPORARY",
    limits: liveReadLimits,
    safety: "READ_ONLY_CODE_PATH",
  }));
  const loop = await settleAtRunDeadline(coordinator.run(taskId, deadline), deadline);
  const progress = captureProgress();
  const { finalSnapshot, resourceUsage } = progress;
  if (!finalSnapshot) throw new Error("Completed run has no runtime snapshot");
  const artifact = {
    schemaVersion: "1",
    mode: "HYBRID_LIVE_READ",
    scorerStatus: "FULL_RUBRIC_NOT_INTEGRATED",
    diagnosticEvaluator: { version: RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, rubricVersion: RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION },
    limits: liveReadLimits,
    requestMetadata: { sha256: createHash("sha256").update(String(rawRequest)).digest("hex"), characterCount: String(rawRequest).length },
    materializedCase,
    runtimeContext,
    semantic,
    ...progress,
    loop,
    resourceUsage,
    resolvedEvalLocation: evaluationLocation,
    latencyMs: resourceUsage.elapsedMs,
    safety: { policy: "READ_ONLY_CODE_PATH", externalSideEffectCount: "NOT_MEASURED" },
  };
  const completed = ["PRESENT_RESULTS", "NO_VERIFIED_RESULT"].includes(finalSnapshot.domainState.phase) && loop.status === "TERMINAL";
  await journal.finish({ ...artifact, status: completed ? "SUCCEEDED" : "FAILED", stage: "AGENT_LOOP", failureCode: completed ? null : "LIVE_CASE_NOT_COMPLETED" });
  const evaluation = await evaluateArtifactAfterFinish(journal.resultPath);
  console.log(JSON.stringify({ mode: artifact.mode, caseId: materialized.id, loop, resourceUsage, artifactPath: journal.resultPath, evaluationPath: evaluation.outputPath, evaluationFailure: evaluation.evaluationFailure, evaluationFailurePath: evaluation.failurePath, latencyMs: artifact.latencyMs, scorerStatus: artifact.scorerStatus }, null, 2));
  if (!completed) process.exitCode = 1;
} catch (error) {
  const failureCode = diagnosticFailureCode(error);
  const progress = captureProgress();
  const { resourceUsage } = progress;
  await journal.finish({
    status: failureCode === "CANCELLED" ? "CANCELLED" : "FAILED", stage, failureCode,
    materializedCase, runtimeContext,
    semanticStatus: semantic?.status ?? "NOT_RETURNED",
    ...progress,
    termination: { scope: "TASK", code: failureCode, reason: stage === "SEMANTIC" ? "Run stopped before execution" : "Run failed or was cancelled during execution" },
    partial: true,
    downstream: stage === "SEMANTIC" ? "GOOGLE_BROWSER_AGENT_NOT_REACHED" : "SEE_EXECUTED_EVENTS",
    latencyMs: resourceUsage.elapsedMs,
  });
  const evaluation = await evaluateArtifactAfterFinish(journal.resultPath);
  console.error(JSON.stringify({ failureCode, stage, artifactPath: journal.resultPath, evaluationPath: evaluation.outputPath, evaluationFailure: evaluation.evaluationFailure, evaluationFailurePath: evaluation.failurePath }));
  process.exitCode = 1;
} finally {
  clearInterval(lifecycleKeepAlive);
}
