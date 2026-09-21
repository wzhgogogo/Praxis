import type { ModelInvocationRecord } from "../../../core/model/contracts.js";
import type { RestaurantReadExecutionMetadata } from "../../../domains/restaurant/contracts.js";
import type { BrowserExecutionDiagnostic } from "../../../infrastructure/browser/browser-task-executor.js";
import type { TableCheckIdentityDiagnostic } from "../../../integrations/tablecheck/tablecheck-contracts.js";
import type { TabelogIdentityDiagnostic, TabelogUserInterventionRequired } from "../../../integrations/tabelog/tabelog-contracts.js";
import type { createHybridReadComposition } from "./hybrid-read-composition.js";

type Composition = ReturnType<typeof createHybridReadComposition>;

/** The CLI uses this same immutable capture on success, failure, and cancellation. */
export function captureHybridLiveProgress(input: {
  composition: Composition | undefined;
  taskId: string;
  startedAtMs: number;
  nowMs?: number;
  /** Adapter snapshot includes sent reads that have not yet produced a trajectory event. */
  googleRequestUsage?: RestaurantReadExecutionMetadata["googleRequests"];
  modelInvocations: ModelInvocationRecord[];
  diagnostics: {
    tablecheckIdentity: TableCheckIdentityDiagnostic[];
    tabelogIdentity: TabelogIdentityDiagnostic[];
    tabelogUserInterventions: TabelogUserInterventionRequired[];
    browserExecution: BrowserExecutionDiagnostic[];
  };
}) {
  let finalSnapshot: ReturnType<Composition["runtime"]["snapshot"]> | undefined;
  try { finalSnapshot = input.composition?.runtime.snapshot(input.taskId); }
  catch { /* A missing/broken state cannot discard independently captured observations. */ }
  const trajectories = input.composition?.trajectories.steps ?? [];
  const completedGoogleRequests = trajectories.reduce<RestaurantReadExecutionMetadata["googleRequests"]>((latest, step) => {
    const usage = step.executionMetadata?.googleRequests;
    return usage && (!latest || usage.total >= latest.total) ? usage : latest;
  }, undefined);
  const googleRequests = input.googleRequestUsage && (!completedGoogleRequests || input.googleRequestUsage.total >= completedGoogleRequests.total)
    ? input.googleRequestUsage
    : completedGoogleRequests;
  const browser = input.diagnostics.browserExecution;
  const browserOperationsByCandidate = browser.reduce<Record<string, number>>((counts, item) => {
    if (item.event === "OPERATION_STARTED" && item.candidateId) counts[item.candidateId] = (counts[item.candidateId] ?? 0) + 1;
    return counts;
  }, {});
  const state = finalSnapshot?.domainState;
  const checked = new Set(Object.keys(state?.availabilityChecks ?? {}));
  const investigated = new Set([...checked, ...Object.keys(state?.factChecks ?? {})]);
  const candidateIds = state?.candidates.map(candidate => candidate.restaurant.id) ?? [];
  return structuredClone({
    modelInvocations: input.modelInvocations,
    events: input.composition?.runtime.eventLog ?? [],
    trajectories,
    diagnostics: input.diagnostics,
    ...(finalSnapshot ? { finalSnapshot } : {}),
    resourceUsage: {
      discoveryCandidates: candidateIds.length,
      candidatesChecked: checked.size,
      agentDecisions: trajectories.filter(step => step.modelAttempt?.purpose === "restaurant_agent_decide").length,
      browserModelCalls: input.modelInvocations.filter(item => item.purpose === "browser_read_decide").length,
      browserRuntimeCalls: browser.filter(item => item.event === "OPERATION_STARTED").length,
      browserOperationsByCandidate,
      browserModelActions: browser.filter(item => item.event === "MODEL_ACTION").length,
      ...(googleRequests ? { googleRequests } : {}),
      elapsedMs: (input.nowMs ?? Date.now()) - input.startedAtMs,
    },
    searchState: {
      candidatesDiscovered: candidateIds.length,
      candidatesInvestigated: investigated.size,
      candidatesAvailabilityChecked: checked.size,
      remainingCandidateIds: candidateIds.filter(id => !investigated.has(id)),
      remainingAvailabilityCandidateIds: candidateIds.filter(id => !checked.has(id)),
      continuationExhausted: state?.searchContinuation?.exhausted ?? null,
      nextPageTokenPresent: !!state?.searchContinuation?.nextPageToken,
    },
    ...(state?.failure ? { termination: { scope: "TASK" as const, code: state.failure.code, reason: state.failure.message } } : {}),
  });
}
