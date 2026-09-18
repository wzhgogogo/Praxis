import type { ModelGateway } from "../../../core/model/contracts.js";
import type { RuntimeClock } from "../../../core/task-runtime/contracts.js";
import { createCurrentDevelopmentFixedSources } from "./current-development-fixed-sources.js";
import type { FixedSourceCaseRegistration } from "./fixed-source-case-registry.js";
import type { FrozenLiveCase } from "./live-case-materializer.js";
import { requiresEvaluationLocation } from "./evaluation-location-selection.js";
import { HIGASHI_GINZA_EVALUATION_LOCATION } from "./live-evaluation-location.js";
import { settleAtRunDeadline } from "./live-run-deadline.js";
import { createHybridReadComposition } from "./hybrid-read-composition.js";
import { currentDevelopmentSourceScenario } from "./current-development-source-scenarios.js";
import { RestaurantPartySizeSupplementResolver } from "../../../domains/restaurant/party-size-supplement-resolver.js";

export type FixedSourceCaseExecution = {
  registration: FixedSourceCaseRegistration;
  materializedCase: FrozenLiveCase;
  sourceScenarioId: string;
  semantic?: unknown;
  loop?: { status?: string };
  finalSnapshot?: ReturnType<ReturnType<typeof createHybridReadComposition>["runtime"]["snapshot"]>;
  trajectories: ReturnType<typeof createHybridReadComposition>["trajectories"]["steps"];
  events: ReturnType<typeof createHybridReadComposition>["runtime"]["eventLog"];
  sourceCalls: ReturnType<typeof createCurrentDevelopmentFixedSources>["calls"];
  /** Actual calls admitted by this controlled transport, including semantic parsing. */
  modelCalls: number;
  execution: { status: "SUCCEEDED" | "FAILED" | "CANCELLED"; loopStatus?: string; phase?: string; failureCode?: string };
  elapsedMs: number;
};

function failureCode(error: unknown): string {
  const code = error instanceof Error && "code" in error ? error.code : undefined;
  return typeof code === "string" && /^[A-Z][A-Z0-9_]{0,63}$/.test(code) ? code : "FIXED_SOURCE_EXECUTION_FAILED";
}

/**
 * The one deterministic execution chain for registered fixed-source cases.
 * It starts from the actual Interpreter and ends at the actual runtime
 * snapshot; callers may only replace the model transport and source pages.
 */
export async function executeFixedSourceCase(input: {
  registration: FixedSourceCaseRegistration;
  materializedCase: FrozenLiveCase;
  model: ModelGateway;
  taskId: string;
  clock?: RuntimeClock;
  maxSteps?: number;
  deadlineMs?: number;
  /** A controlled user cancellation passed into the real runtime chain. */
  signal?: AbortSignal;
  /** A controlled transport budget; it never changes product action policy. */
  maxModelCalls?: number;
}): Promise<FixedSourceCaseExecution> {
  const started = Date.now();
  const scenario = currentDevelopmentSourceScenario(input.registration.sourceScenarioId);
  const businessStart = Date.parse(input.materializedCase.reference_time);
  if (Number.isNaN(businessStart)) throw Object.assign(new Error(`Invalid fixed-source reference time: ${input.materializedCase.reference_time}`), { code: "FIXED_SOURCE_CASE_INVALID" });
  // A fixed provider page is not permission to freeze business time forever.
  // Default time begins at the registered reference point and advances with
  // real elapsed execution; deterministic snapshots must opt in via `clock`.
  const businessClock = input.clock ?? { now: () => new Date(businessStart + Date.now() - started) };
  const deadline = input.signal
    ? AbortSignal.any([AbortSignal.timeout(Math.max(1, input.deadlineMs ?? 5_000)), input.signal])
    : AbortSignal.timeout(Math.max(1, input.deadlineMs ?? 5_000));
  let modelCalls = 0;
  let lastModelFailureCode: string | undefined;
  const guardedModel: ModelGateway = {
    async complete(request) {
      if (deadline.aborted) throw Object.assign(new Error("Run deadline reached before model invocation"), { code: "CANCELLED" });
      if (input.maxModelCalls !== undefined && modelCalls >= input.maxModelCalls) {
        lastModelFailureCode = "MODEL_CALL_BUDGET_EXHAUSTED";
        throw Object.assign(new Error("Fixed-source model-call budget reached"), { code: lastModelFailureCode });
      }
      modelCalls += 1;
      const remainingMs = Math.max(1, (input.deadlineMs ?? 5_000) - (Date.now() - started));
      try {
        return await settleAtRunDeadline(input.model.complete({ ...request, timeoutMs: Math.min(request.timeoutMs, remainingMs) }), deadline);
      } catch (error) {
        lastModelFailureCode = failureCode(error);
        throw error;
      }
    },
  };
  const sources = createCurrentDevelopmentFixedSources(scenario, businessClock, guardedModel);
  const composition = createHybridReadComposition({
    taskId: input.taskId,
    runId: `run:${input.taskId}`,
    clock: businessClock,
    model: guardedModel,
    search: sources.search,
    facts: sources.facts,
    availability: sources.availability,
    partySizeSupplementResolver: new RestaurantPartySizeSupplementResolver(guardedModel),
    loop: { maxSteps: input.maxSteps ?? 6, timeoutMs: input.deadlineMs ?? 5_000 },
  });
  let semantic: unknown;
  try {
    semantic = await settleAtRunDeadline(composition.interpretAndDispatch({
      taskId: input.taskId,
      message: String(input.materializedCase.content ?? ""),
      referenceTime: input.materializedCase.reference_time,
      timezone: "Asia/Tokyo",
    }, requiresEvaluationLocation(input.materializedCase) ? HIGASHI_GINZA_EVALUATION_LOCATION : undefined), deadline);
    if ((semantic as { status?: string }).status !== "PROPOSED") throw Object.assign(new Error("Semantic Interpreter did not produce a proposal"), { code: (semantic as { status?: string }).status ?? "SEMANTIC_FAILED" });
    const loop = await settleAtRunDeadline(composition.coordinator.run(input.taskId, deadline), deadline);
    const finalSnapshot = composition.runtime.snapshot(input.taskId);
    const success = (loop.status === "TERMINAL" && ["PRESENT_RESULTS", "NO_VERIFIED_RESULT"].includes(finalSnapshot.domainState.phase)) || loop.status === "WAITING_USER";
    return {
      registration: input.registration, materializedCase: input.materializedCase, sourceScenarioId: scenario.scenarioId, semantic, loop, finalSnapshot,
      trajectories: composition.trajectories.steps, events: composition.runtime.eventLog, sourceCalls: sources.calls, modelCalls,
      execution: success ? { status: "SUCCEEDED", loopStatus: loop.status, phase: finalSnapshot.domainState.phase } : loop.status === "CANCELLED" ? { status: "CANCELLED", loopStatus: loop.status, phase: finalSnapshot.domainState.phase, failureCode: "CANCELLED" } : { status: "FAILED", loopStatus: loop.status, phase: finalSnapshot.domainState.phase, failureCode: lastModelFailureCode ?? "FIXED_SOURCE_CASE_NOT_COMPLETED" },
      elapsedMs: Date.now() - started,
    };
  } catch (error) {
    const finalSnapshot = composition.runtime.snapshot(input.taskId);
    const code = failureCode(error);
    return {
      registration: input.registration, materializedCase: input.materializedCase, sourceScenarioId: scenario.scenarioId, semantic,
      trajectories: composition.trajectories.steps, events: composition.runtime.eventLog, sourceCalls: sources.calls, modelCalls, finalSnapshot,
      execution: { status: code === "CANCELLED" ? "CANCELLED" : "FAILED", phase: finalSnapshot.domainState.phase, failureCode: code },
      elapsedMs: Date.now() - started,
    };
  }
}
