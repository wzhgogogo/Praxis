import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";

import { RestaurantAgentLoopCoordinator } from "../../../../application/restaurant-agent-loop.js";
import { RestaurantExecutionRouter } from "../../../../application/restaurant-execution-router.js";
import { InMemoryTaskRuntime } from "../../../../core/task-runtime/in-memory-task-runtime.js";
import type { ModelInvocationRecord } from "../../../../core/model/contracts.js";
import { RestaurantAgentDecision } from "../../../../domains/restaurant/agent-decision.js";
import { compileRestaurantSemanticProposal } from "../../../../domains/restaurant/semantic-compiler.js";
import { RestaurantSemanticInterpreter } from "../../../../domains/restaurant/semantic-interpreter.js";
import type { RestaurantCommand, RestaurantEvent, RestaurantOutcome, RestaurantTaskState } from "../../../../domains/restaurant/contracts.js";
import { restaurantBookingTaskDefinition } from "../../../../domains/restaurant/task-definition.js";
import { browserRuntimeFromEnvironment } from "../../../../infrastructure/browser/browser-runtime-factory.js";
import type { BrowserExecutionDiagnostic } from "../../../../infrastructure/browser/browser-task-executor.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { GooglePlacesClient } from "../../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../../integrations/google/google-places-restaurant-search.js";
import { LiveBrowserAvailability } from "../../../../integrations/restaurant-availability/live-browser-availability.js";
import type { TableCheckIdentityDiagnostic } from "../../../../integrations/tablecheck/tablecheck-contracts.js";
import type { TabelogIdentityDiagnostic, TabelogUserInterventionRequired } from "../../../../integrations/tabelog/tabelog-contracts.js";
import { InMemoryRestaurantAgentTrajectoryStore } from "../../../../infrastructure/postgres/restaurant-agent-trajectory-store.js";
import { loadFrozenLiveCases, materializeLiveCase } from "../live-case-materializer.js";
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
const sourcePath = resolve("src/eval/restaurant/agent-loop/drafts/e2e-cases.yaml");
const selectedId = caseIdFromArgs();
const candidateLimit = candidateLimitFromArgs();
const source = await loadFrozenLiveCases(sourcePath);
const frozen = source.find((entry) => entry.id === selectedId);
if (!frozen) throw new Error(`Unknown frozen E2E case: ${selectedId}`);
if (requiresLocation(frozen) && (!process.env.PRAXIS_EVAL_USER_LAT || !process.env.PRAXIS_EVAL_USER_LNG)) {
  throw new Error("PRAXIS_EVAL_USER_LAT and PRAXIS_EVAL_USER_LNG are required for NEAR_USER Live cases");
}

const startedAt = new Date();
const materialized = materializeLiveCase(frozen, startedAt.toISOString());
const liveReadLimits = {
  // H001 diagnostic budget only. These are hard ceilings, not default Web values.
  maxGoogleSearches: 3,
  maxGooglePlaceDetails: 0,
  maxTableCheckBrowserSessions: 3,
  maxTabelogBrowserSessions: 3,
  maxTabelogCandidateMatches: 3,
  maxAvailabilityReads: 20,
  maxBrowserRuntimeFallbacks: 1,
  maxBrowserModelCallsPerCandidate: 20,
  maxBrowserModelCallsTotal: 120,
  maxBrowserOperationsPerCandidate: 80,
  maxAutomaticBrowserMs: 20 * 60_000,
} as const;
const taskId = `hybrid-live:${materialized.id}:${startedAt.valueOf()}`;
const runId = `run:${taskId}`;
const clock = { now: () => new Date() };
let sequence = 0;
const runtime = new InMemoryTaskRuntime<RestaurantTaskState, RestaurantEvent, RestaurantCommand, RestaurantOutcome>(
  restaurantBookingTaskDefinition,
  clock,
  (prefix) => `${prefix}:${++sequence}`,
);
runtime.createTask(taskId, {}, { runId });
const trajectories = new InMemoryRestaurantAgentTrajectoryStore();
const modelInvocations: ModelInvocationRecord[] = [];
const journal = await startDiagnosticRun(resolve(".eval-artifacts", "restaurant-hybrid-live-read"), {
  mode: "HYBRID_LIVE_READ", caseId: materialized.id,
  scorerStatus: "NOT_INTEGRATED_REPOSITORY_DRAFT_ONLY",
  safety: { policy: "READ_ONLY_CODE_PATH", externalSideEffectCount: "NOT_MEASURED" },
});
let stage = "SEMANTIC";
let semantic: Awaited<ReturnType<RestaurantSemanticInterpreter["interpret"]>> | undefined;
try {
  const model = DeepSeekModelGateway.fromEnvironment(process.env, {
    observer: { observe: (record) => { modelInvocations.push(structuredClone(record)); } },
  });
  const interpreter = new RestaurantSemanticInterpreter(model);
  semantic = await interpreter.interpret({
    taskId,
    message: String(materialized.content ?? ""),
    referenceTime: startedAt.toISOString(),
    timezone: "Asia/Tokyo",
  });
  if (semantic.status !== "PROPOSED") throw Object.assign(new Error("Semantic Interpreter did not produce a proposal"), { code: semantic.status });
  stage = "COMPILE_AND_DISPATCH";
  const compilation = compileRestaurantSemanticProposal(semantic.proposal);
  const semanticEvent: RestaurantEvent = compilation.status === "COMPILED"
    ? { type: "SEMANTIC_PROPOSAL_COMPILED", patch: compilation.patch }
    : { type: "SEMANTIC_CONFLICT_RECORDED", conflict: compilation.conflict };
  await runtime.dispatch({
    id: `event:${taskId}:semantic`, taskId, event: semanticEvent, occurredAt: startedAt.toISOString(),
    trace: { schemaVersion: "1", runId, correlationId: `event:${taskId}:semantic`, actor: "MODEL" },
  });

  stage = "PROVIDER_SETUP";
  const evaluationLocation = process.env.PRAXIS_EVAL_USER_LAT && process.env.PRAXIS_EVAL_USER_LNG
    ? { latitude: Number(process.env.PRAXIS_EVAL_USER_LAT), longitude: Number(process.env.PRAXIS_EVAL_USER_LNG) }
    : undefined;
  const search = new GooglePlacesRestaurantSearch(
    new GooglePlacesClient({ apiKey: process.env.GOOGLE_MAPS_API_KEY ?? "" }),
    undefined,
    candidateLimit,
    { ...(evaluationLocation ? { evaluationLocation } : {}), maxSearches: liveReadLimits.maxGoogleSearches },
  );
  const tabelogIdentityDiagnostics: TabelogIdentityDiagnostic[] = [];
  const tableCheckIdentityDiagnostics: TableCheckIdentityDiagnostic[] = [];
  const tabelogUserInterventions: TabelogUserInterventionRequired[] = [];
  const browserExecutionDiagnostics: BrowserExecutionDiagnostic[] = [];
  const browser = browserRuntimeFromEnvironment();
  const availability = new LiveBrowserAvailability(browser, model, {
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
  const coordinator = new RestaurantAgentLoopCoordinator(
    {
      snapshot: async (id) => runtime.snapshot(id),
      dispatch: async (envelope, expectedVersion) => runtime.dispatch(envelope, expectedVersion),
    },
    new RestaurantAgentDecision(model),
    new RestaurantExecutionRouter(search, availability, {
      structuredReadTimeoutMs: 8_000,
      // An explicit human pause is outside the automatic browser-read deadline.
      // The H001 outer-loop deadline is the whole diagnostic cap, not a product SLA.
      browserReadTimeoutMs: manualTabelogIntervention ? null : liveReadLimits.maxAutomaticBrowserMs,
    }),
    trajectories,
    clock,
    { maxSteps: 30, maxRejectedActions: 5, timeoutMs: 20 * 60_000 },
  );
  stage = "AGENT_LOOP";
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
  const resourceUsage = {
    discoveryCandidates: finalSnapshot.domainState.candidates.length,
    candidatesChecked: Object.keys(finalSnapshot.domainState.availabilityChecks).length,
    agentDecisions: trajectories.steps.filter((step) => step.modelAttempt?.purpose === "restaurant_agent_decide").length,
    browserModelCalls: modelInvocations.filter((invocation) => invocation.purpose === "browser_read_decide").length,
    /** All executor calls, including reads; model-initiated clicks/navigation are listed separately. */
    browserRuntimeCalls: browserExecutionDiagnostics.filter((diagnostic) => diagnostic.event === "SITE_METHOD").length,
    browserOperationsByCandidate,
    browserModelActions: browserExecutionDiagnostics.filter((diagnostic) => diagnostic.event === "MODEL_ACTION").length,
    elapsedMs: Date.now() - startedAt.valueOf(),
  };
  const artifact = {
    schemaVersion: "1",
    mode: "HYBRID_LIVE_READ",
    scorerStatus: "NOT_INTEGRATED_REPOSITORY_DRAFT_ONLY",
    limits: liveReadLimits,
    rawRequest: materialized.content,
    materializedCase: materialized,
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
  const completed = finalSnapshot.domainState.phase === "PRESENT_RESULTS" && loop.status === "TERMINAL";
  await journal.finish({ ...artifact, status: completed ? "SUCCEEDED" : "FAILED", stage: "AGENT_LOOP", failureCode: completed ? null : "H001_NOT_COMPLETED" });
  console.log(JSON.stringify({ mode: artifact.mode, caseId: materialized.id, loop, resourceUsage, artifactPath: journal.resultPath, latencyMs: artifact.latencyMs, scorerStatus: artifact.scorerStatus }, null, 2));
  if (!completed) process.exitCode = 1;
} catch (error) {
  await journal.finish({
    status: "FAILED", stage, failureCode: diagnosticFailureCode(error),
    semanticStatus: semantic?.status ?? "NOT_RETURNED", modelInvocations,
    events: runtime.eventLog, trajectories: trajectories.steps,
    downstream: stage === "SEMANTIC" ? "GOOGLE_BROWSER_AGENT_NOT_REACHED" : "SEE_EXECUTED_EVENTS",
    latencyMs: Date.now() - startedAt.valueOf(),
  });
  console.error(JSON.stringify({ failureCode: diagnosticFailureCode(error), stage, artifactPath: journal.resultPath }));
  process.exitCode = 1;
}
