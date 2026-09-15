import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";

import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET } from "../../../../application/live-read-investigation-budget.js";
import type { ModelInvocationRecord } from "../../../../core/model/contracts.js";
import { RestaurantSemanticInterpreter } from "../../../../domains/restaurant/semantic-interpreter.js";
import type { RestaurantReadExecutionMetadata } from "../../../../domains/restaurant/contracts.js";
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
import { createHybridReadComposition } from "../hybrid-read-composition.js";
import { evaluateArtifactAfterFinish, RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION } from "../diagnostic-evaluator.js";
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

function requiresLocation(caseValue: unknown): boolean {
  return JSON.stringify(caseValue).includes("NEAR_USER");
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
const liveReadLimits = LIVE_READ_DEBUG_INVESTIGATION_BUDGET;
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
});
// Some browser/provider implementations leave only unref'ed work while a
// promise is still pending. Keep this diagnostic process alive until its
// result artifact has been finalized; an orphaned STARTED record is neither a
// usable live result nor a diagnosable failure.
const lifecycleKeepAlive = setInterval(() => undefined, 30_000);
let stage = "SEMANTIC";
let semantic: Awaited<ReturnType<RestaurantSemanticInterpreter["interpret"]>> | undefined;
let composition: ReturnType<typeof createHybridReadComposition> | undefined;
try {
  const model = DeepSeekModelGateway.fromEnvironment(process.env, {
    observer: { observe: (record) => { modelInvocations.push(structuredClone(record)); } },
  });
  stage = "PROVIDER_SETUP";
  const evaluationLocation = process.env.PRAXIS_EVAL_USER_LAT && process.env.PRAXIS_EVAL_USER_LNG
    ? {
        label: "Explicit evaluation coordinate",
        latitude: Number(process.env.PRAXIS_EVAL_USER_LAT),
        longitude: Number(process.env.PRAXIS_EVAL_USER_LNG),
        radiusMeters: HIGASHI_GINZA_EVALUATION_LOCATION.radiusMeters,
        source: "PRAXIS_EVAL_USER_LAT/PRAXIS_EVAL_USER_LNG",
      }
    : requiresLocation(frozen) ? HIGASHI_GINZA_EVALUATION_LOCATION : undefined;
  const search = new GooglePlacesRestaurantSearch(
    new GooglePlacesClient({ apiKey: process.env.GOOGLE_MAPS_API_KEY ?? "", timeoutMs: liveReadLimits.maxStructuredReadMs }),
    undefined,
    candidateLimit,
    { maxRequests: liveReadLimits.maxGoogleRequests },
  );
  const tabelogIdentityDiagnostics: TabelogIdentityDiagnostic[] = [];
  const tableCheckIdentityDiagnostics: TableCheckIdentityDiagnostic[] = [];
  const tabelogUserInterventions: TabelogUserInterventionRequired[] = [];
  const browserExecutionDiagnostics: BrowserExecutionDiagnostic[] = [];
  const browser = browserRuntimeFromEnvironment();
  const browserBudget: BrowserExecutionBudget = { totalModelCalls: 0 };
  const availability = new LiveBrowserAvailability(browser, model, {
    browserBudget,
    maxTableCheckBrowserSessions: liveReadLimits.maxTableCheckBrowserSessions,
    maxTabelogBrowserSessions: liveReadLimits.maxTabelogBrowserSessions,
    maxTabelogCandidateMatches: liveReadLimits.maxTabelogCandidateMatches,
    maxModelCallsPerCandidate: liveReadLimits.maxBrowserModelCallsPerCandidate,
    maxModelCallsTotal: liveReadLimits.maxBrowserModelCallsTotal,
    maxOperationsPerCandidate: liveReadLimits.maxBrowserOperationsPerCandidate,
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
    facts: composeLiveRestaurantFactRead(search, browser, model, browserBudget),
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
  semantic = await composition.interpretAndDispatch({
    taskId,
    message: String(materialized.content ?? ""),
    referenceTime: startedAt.toISOString(),
    timezone: "Asia/Tokyo",
  }, evaluationLocation);
  if (semantic.status !== "PROPOSED") throw Object.assign(new Error("Semantic Interpreter did not produce a proposal"), { code: semantic.status });
  stage = "AGENT_LOOP";
  const { runtime, trajectories, coordinator } = composition;
  console.log(JSON.stringify({
    mode: "HYBRID_LIVE_READ",
    caseId: materialized.id,
    browserEngine: process.env.PRAXIS_BROWSER_ENGINE ?? "AUTO",
    candidateLimit,
    profileMode: manualTabelogIntervention ? "PERSISTENT_EVAL" : "TEMPORARY",
    limits: liveReadLimits,
    safety: "READ_ONLY_CODE_PATH",
  }));
  const loop = await coordinator.run(taskId);
  const finalSnapshot = runtime.snapshot(taskId);
  const browserOperationsByCandidate = browserExecutionDiagnostics.reduce<Record<string, number>>((counts, diagnostic) => {
    if (diagnostic.event === "SITE_METHOD" && diagnostic.candidateId) {
      counts[diagnostic.candidateId] = (counts[diagnostic.candidateId] ?? 0) + 1;
    }
    return counts;
  }, {});
  const googleRequests = trajectories.steps.reduce<NonNullable<RestaurantReadExecutionMetadata["googleRequests"]> | undefined>((latest, step) => {
    const usage = step.executionMetadata?.googleRequests;
    return usage && (!latest || usage.total >= latest.total) ? usage : latest;
  }, undefined);
  const resourceUsage = {
    discoveryCandidates: finalSnapshot.domainState.candidates.length,
    candidatesChecked: Object.keys(finalSnapshot.domainState.availabilityChecks).length,
    agentDecisions: trajectories.steps.filter((step) => step.modelAttempt?.purpose === "restaurant_agent_decide").length,
    browserModelCalls: modelInvocations.filter((invocation) => invocation.purpose === "browser_read_decide").length,
    /** All executor calls, including reads; model-initiated clicks/navigation are listed separately. */
    browserRuntimeCalls: browserExecutionDiagnostics.filter((diagnostic) => diagnostic.event === "SITE_METHOD").length,
    browserOperationsByCandidate,
    browserModelActions: browserExecutionDiagnostics.filter((diagnostic) => diagnostic.event === "MODEL_ACTION").length,
    ...(googleRequests ? { googleRequests } : {}),
    elapsedMs: Date.now() - startedAt.valueOf(),
  };
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
    modelInvocations,
    events: runtime.eventLog,
    trajectories: trajectories.steps,
    diagnostics: {
      tablecheckIdentity: tableCheckIdentityDiagnostics,
      tabelogIdentity: tabelogIdentityDiagnostics,
      tabelogUserInterventions,
      browserExecution: browserExecutionDiagnostics,
    },
    finalSnapshot,
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
  await journal.finish({
    status: failureCode === "CANCELLED" ? "CANCELLED" : "FAILED", stage, failureCode,
    materializedCase, runtimeContext,
    semanticStatus: semantic?.status ?? "NOT_RETURNED", modelInvocations,
    events: composition?.runtime.eventLog ?? [], trajectories: composition?.trajectories.steps ?? [],
    downstream: stage === "SEMANTIC" ? "GOOGLE_BROWSER_AGENT_NOT_REACHED" : "SEE_EXECUTED_EVENTS",
    latencyMs: Date.now() - startedAt.valueOf(),
  });
  const evaluation = await evaluateArtifactAfterFinish(journal.resultPath);
  console.error(JSON.stringify({ failureCode, stage, artifactPath: journal.resultPath, evaluationPath: evaluation.outputPath, evaluationFailure: evaluation.evaluationFailure, evaluationFailurePath: evaluation.failurePath }));
  process.exitCode = 1;
} finally {
  clearInterval(lifecycleKeepAlive);
}
