import { RestaurantAgentLoopCoordinator, type RestaurantAgentLoopOptions } from "../../../application/restaurant-agent-loop.js";
import {
  RestaurantExecutionRouter,
  type RestaurantAvailabilityPort,
  type RestaurantCandidateFactPort,
  type RestaurantExecutionRouterOptions,
  type RestaurantSearchPort,
} from "../../../application/restaurant-execution-router.js";
import { InMemoryTaskRuntime } from "../../../core/task-runtime/in-memory-task-runtime.js";
import type { ModelGateway } from "../../../core/model/contracts.js";
import type { RuntimeClock } from "../../../core/task-runtime/contracts.js";
import { RestaurantAgentDecision } from "../../../domains/restaurant/agent-decision.js";
import { compileRestaurantSemanticProposal } from "../../../domains/restaurant/semantic-compiler.js";
import {
  RestaurantSemanticInterpreter,
  type RestaurantSemanticInterpretInput,
  type RestaurantSemanticInterpretResult,
} from "../../../domains/restaurant/semantic-interpreter.js";
import type {
  RestaurantCommand,
  RestaurantEvent,
  RestaurantOutcome,
  RestaurantTaskState,
} from "../../../domains/restaurant/contracts.js";
import { restaurantBookingTaskDefinition } from "../../../domains/restaurant/task-definition.js";
import { InMemoryRestaurantAgentTrajectoryStore } from "../../../infrastructure/postgres/restaurant-agent-trajectory-store.js";

/** Explicit public test context; it must be bound to State before the Agent runs. */
export interface HybridEvaluationLocation {
  label: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  source: string;
}

export interface HybridReadCompositionOptions {
  taskId: string;
  runId: string;
  clock: RuntimeClock;
  model: ModelGateway;
  search: RestaurantSearchPort;
  availability: RestaurantAvailabilityPort;
  facts?: RestaurantCandidateFactPort;
  router?: RestaurantExecutionRouterOptions;
  loop?: RestaurantAgentLoopOptions;
}

/**
 * The Hybrid CLI's actual Interpreter → Compiler → Runtime → Agent → Router
 * composition. External model, network, and browser implementations remain
 * constructor inputs so integration tests can replace only those boundaries.
 */
export function createHybridReadComposition(options: HybridReadCompositionOptions) {
  let sequence = 0;
  const runtime = new InMemoryTaskRuntime<RestaurantTaskState, RestaurantEvent, RestaurantCommand, RestaurantOutcome>(
    restaurantBookingTaskDefinition,
    options.clock,
    (prefix) => `${prefix}:${++sequence}`,
  );
  runtime.createTask(options.taskId, {}, { runId: options.runId });
  const trajectories = new InMemoryRestaurantAgentTrajectoryStore();
  const interpreter = new RestaurantSemanticInterpreter(options.model);
  const coordinator = new RestaurantAgentLoopCoordinator(
    {
      snapshot: async (taskId) => runtime.snapshot(taskId),
      dispatch: async (envelope, expectedVersion) => runtime.dispatch(envelope, expectedVersion),
    },
    new RestaurantAgentDecision(options.model),
    new RestaurantExecutionRouter(options.search, options.availability, options.router, options.facts),
    trajectories,
    options.clock,
    options.loop,
    (prefix) => `${prefix}:${++sequence}`,
  );

  async function interpretAndDispatch(
    input: RestaurantSemanticInterpretInput,
    evaluationLocation?: HybridEvaluationLocation,
  ): Promise<RestaurantSemanticInterpretResult> {
    const semantic = await interpreter.interpret(input);
    if (semantic.status !== "PROPOSED") return semantic;
    const compilation = compileRestaurantSemanticProposal(semantic.proposal, { referenceTime: input.referenceTime, timezone: input.timezone });
    const snapshot = runtime.snapshot(options.taskId);
    const event: RestaurantEvent = compilation.status === "COMPILED"
      ? { type: "SEMANTIC_PROPOSAL_COMPILED", patch: compilation.patch }
      : { type: "SEMANTIC_CONFLICT_RECORDED", conflict: compilation.conflict };
    // Semantic input is an append-only user/model event, not a once-per-task
    // singleton.  A fresh request after cancellation must not be deduplicated
    // as the task's initial interpretation.
    const semanticEventId = `event:${options.taskId}:semantic:${snapshot.version + 1}`;
    await runtime.dispatch({
      id: semanticEventId, taskId: options.taskId, event,
      occurredAt: options.clock.now().toISOString(),
      trace: { schemaVersion: "1", runId: options.runId, correlationId: semanticEventId, actor: "MODEL" },
    }, snapshot.version);
    if (evaluationLocation && compilation.status === "COMPILED") {
      const afterSemantic = runtime.snapshot(options.taskId);
      const locationEventId = `event:${options.taskId}:evaluation-location:${afterSemantic.version + 1}`;
      await runtime.dispatch({
        id: locationEventId, taskId: options.taskId,
        event: {
          type: "EVALUATION_LOCATION_BOUND",
          coordinates: {
            latitude: evaluationLocation.latitude,
            longitude: evaluationLocation.longitude,
            radiusMeters: evaluationLocation.radiusMeters,
            observedAt: options.clock.now().toISOString(),
            source: "EVALUATION",
          },
        },
        occurredAt: options.clock.now().toISOString(),
        trace: { schemaVersion: "1", runId: options.runId, correlationId: locationEventId, actor: "SYSTEM" },
      }, afterSemantic.version);
    }
    return semantic;
  }

  return { runtime, trajectories, coordinator, interpretAndDispatch };
}
