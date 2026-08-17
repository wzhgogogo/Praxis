import type { RuntimeActor } from "../../core/task-runtime/contracts.js";
import { InMemoryTaskRuntime } from "../../core/task-runtime/in-memory-task-runtime.js";
import { isDeepStrictEqual } from "node:util";
import type {
  RestaurantDecision,
  RestaurantCommand,
  RestaurantEvent,
  RestaurantIntentDraft,
  RestaurantOutcome,
  RestaurantTaskState,
} from "../../domains/restaurant/contracts.js";
import { decideRestaurantNext } from "../../domains/restaurant/decision-kernel.js";
import { compileRestaurantSemanticProposal } from "../../domains/restaurant/semantic-compiler.js";
import {
  RestaurantSemanticInterpreter,
  type RestaurantSemanticInterpretInput,
  type RestaurantSemanticInterpretResult,
} from "../../domains/restaurant/semantic-interpreter.js";
import { restaurantBookingTaskDefinition } from "../../domains/restaurant/task-definition.js";
import { FixtureRestaurantSearch } from "../../infrastructure/fixture/fixture-restaurant-search.js";
import { FakeClock } from "../../harness/fake-clock.js";
import {
  type RestaurantSemanticRegressionDataset,
  type RestaurantSemanticRegressionTurn,
  restaurantSemanticRegressionV1,
} from "./fixtures.js";
import { scoreRestaurantSemanticTurn } from "./scorer.js";
import { restaurantSemanticRegressionProposalFor } from "./stage-oracles.js";

export type RestaurantSemanticRegressionInterpreter = Pick<
  RestaurantSemanticInterpreter,
  "interpret"
>;

export type RestaurantSemanticRegressionFirstFailure =
  | "INPUT"
  | "MODEL_GATEWAY"
  | "SEMANTIC_PROPOSAL_CONTRACT"
  | "SEMANTIC_INTERPRETER"
  | "COMPILER"
  | "REDUCER"
  | "SEMANTIC_RESULT"
  | "DECISION_KERNEL"
  | "RUNTIME";

export interface RestaurantSemanticRegressionTurnResult {
  sessionId: string;
  turnId: string;
  status: "PASS" | "FAIL" | "BLOCKED_BY_UPSTREAM";
  firstFailureStage?: RestaurantSemanticRegressionFirstFailure;
  errors: string[];
  modelStatus?: RestaurantSemanticInterpretResult["status"];
  actualDraft?: RestaurantIntentDraft;
  actualDecision?: RestaurantDecision;
  /** Static regression diagnostics only; ordinary production telemetry never retains this. */
  proposal?: unknown;
  compiledPatch?: unknown;
}

export interface RestaurantSemanticRegressionReport {
  evaluatorVersion: "1";
  datasetId: string;
  datasetVersion: string;
  mode: "REAL_MODEL_MOCK_WORLD" | "FIXTURE";
  attributionLevel: "DEVELOPMENT_STAGE_ORACLES" | "PRODUCT_SEMANTIC_ONLY";
  status: "COMPLETED";
  turns: RestaurantSemanticRegressionTurnResult[];
  summary: {
    totalTurns: number;
    modelEvaluatedTurns: number;
    passedTurns: number;
    blockedTurns: number;
    firstFailureStages: Partial<Record<RestaurantSemanticRegressionFirstFailure, number>>;
  };
}

function result(
  input: Omit<RestaurantSemanticRegressionTurnResult, "errors"> & { errors?: string[] },
): RestaurantSemanticRegressionTurnResult {
  return { ...input, errors: input.errors ?? [] };
}

/**
 * v15 regression runner. The DeepSeek call can create only a Semantic Proposal;
 * every state change below is replayable in-memory Runtime code and Fixture Search.
 */
export async function runRestaurantSemanticRegression(
  interpreter: RestaurantSemanticRegressionInterpreter,
  input: {
    mode: RestaurantSemanticRegressionReport["mode"];
    attributionLevel: RestaurantSemanticRegressionReport["attributionLevel"];
    dataset?: RestaurantSemanticRegressionDataset;
    dependencies?: {
      compile?: typeof compileRestaurantSemanticProposal;
      decide?: typeof decideRestaurantNext;
    };
  },
): Promise<RestaurantSemanticRegressionReport> {
  const dataset = input.dataset ?? restaurantSemanticRegressionV1;
  const clock = new FakeClock(dataset.referenceTime);
  const search = new FixtureRestaurantSearch();
  const compile = input.dependencies?.compile ?? compileRestaurantSemanticProposal;
  const decide = input.dependencies?.decide ?? decideRestaurantNext;
  const results: RestaurantSemanticRegressionTurnResult[] = [];
  let sequence = 0;

  for (const session of dataset.sessions) {
    const taskId = `semantic-regression:${session.id}`;
    const runtime = new InMemoryTaskRuntime<
      RestaurantTaskState,
      RestaurantEvent,
      RestaurantCommand,
      RestaurantOutcome
    >(
      restaurantBookingTaskDefinition,
      clock,
      (prefix) => `${prefix}:${++sequence}`,
    );
    runtime.createTask(taskId, {}, { runId: `run:${taskId}` });
    let blocked = false;

    const dispatch = (event: RestaurantEvent, actor: RuntimeActor) => {
      const snapshot = runtime.snapshot(taskId);
      const id = `event:${session.id}:${++sequence}`;
      return runtime.dispatch(
        {
          id,
          taskId,
          event,
          occurredAt: clock.now().toISOString(),
          trace: {
            schemaVersion: "1",
            runId: snapshot.runId,
            correlationId: id,
            actor,
          },
        },
        snapshot.version,
      );
    };

    for (const turn of session.turns) {
      if (blocked) {
        results.push(
          result({
            sessionId: session.id,
            turnId: turn.id,
            status: "BLOCKED_BY_UPSTREAM",
          }),
        );
        continue;
      }

      const snapshot = runtime.snapshot(taskId);
      const interpretInput: RestaurantSemanticInterpretInput = {
        taskId,
        message: turn.message,
        referenceTime: dataset.referenceTime,
        timezone: "Asia/Tokyo",
        ...(snapshot.domainState.intentDraft
          ? { currentDraft: snapshot.domainState.intentDraft }
          : {}),
      };
      const interpreted = await interpreter.interpret(interpretInput);
      if (interpreted.status !== "PROPOSED") {
        const firstFailureStage: RestaurantSemanticRegressionFirstFailure =
          interpreted.status === "INPUT_INVALID"
            ? "INPUT"
            : interpreted.status === "MODEL_FAILURE"
              ? "MODEL_GATEWAY"
              : "SEMANTIC_PROPOSAL_CONTRACT";
        results.push(
          result({
            sessionId: session.id,
            turnId: turn.id,
            status: "FAIL",
            firstFailureStage,
            modelStatus: interpreted.status,
            errors:
              "errors" in interpreted
                ? interpreted.errors
                : [`Model gateway ${interpreted.errorCode}`],
          }),
        );
        blocked = true;
        continue;
      }

      const expectedProposal =
        input.attributionLevel === "DEVELOPMENT_STAGE_ORACLES"
          ? restaurantSemanticRegressionProposalFor(turn.message)
          : undefined;
      if (
        input.attributionLevel === "DEVELOPMENT_STAGE_ORACLES" &&
        expectedProposal === undefined
      ) {
        throw new Error(`Missing development-stage Proposal oracle for ${turn.id}`);
      }
      if (expectedProposal && !isDeepStrictEqual(interpreted.proposal, expectedProposal)) {
        results.push(
          result({
            sessionId: session.id,
            turnId: turn.id,
            status: "FAIL",
            firstFailureStage: "SEMANTIC_INTERPRETER",
            modelStatus: interpreted.status,
            errors: ["Semantic Proposal does not match the development-stage interpretation oracle"],
            proposal: interpreted.proposal,
          }),
        );
        blocked = true;
        continue;
      }
      const compiled = compile(interpreted.proposal);
      const expectedCompilation = expectedProposal
        ? compileRestaurantSemanticProposal(expectedProposal)
        : undefined;
      if (expectedCompilation?.status === "CONFLICT") {
        throw new Error(`Development-stage Proposal oracle conflicts for ${turn.id}`);
      }
      if (compiled.status === "CONFLICT") {
        dispatch({ type: "SEMANTIC_CONFLICT_RECORDED", conflict: compiled.conflict }, "MODEL");
        results.push(
          result({
            sessionId: session.id,
            turnId: turn.id,
            status: "FAIL",
            firstFailureStage: "COMPILER",
            modelStatus: interpreted.status,
            errors: [compiled.conflict.message],
            proposal: interpreted.proposal,
          }),
        );
        blocked = true;
        continue;
      }
      if (
        expectedCompilation?.status === "COMPILED" &&
        !isDeepStrictEqual(compiled.patch, expectedCompilation.patch)
      ) {
        results.push(
          result({
            sessionId: session.id,
            turnId: turn.id,
            status: "FAIL",
            firstFailureStage: "COMPILER",
            modelStatus: interpreted.status,
            errors: ["Compiled patch does not match the deterministic development-stage oracle"],
            proposal: interpreted.proposal,
            compiledPatch: compiled.patch,
          }),
        );
        blocked = true;
        continue;
      }

      let compiledState: RestaurantTaskState;
      let issuedDecisionCommand = false;
      try {
        const compiledDispatch = dispatch(
          { type: "SEMANTIC_PROPOSAL_COMPILED", patch: compiled.patch },
          "MODEL",
        );
        issuedDecisionCommand = compiledDispatch.commands.some(
          (command) => command.command.type === "DECIDE_RESTAURANT_NEXT",
        );
        compiledState = compiledDispatch.snapshot.domainState;
      } catch (error) {
        results.push(
          result({
            sessionId: session.id,
            turnId: turn.id,
            status: "FAIL",
            firstFailureStage: "RUNTIME",
            modelStatus: interpreted.status,
            errors: [error instanceof Error ? error.message : String(error)],
            proposal: interpreted.proposal,
            compiledPatch: compiled.patch,
          }),
        );
        blocked = true;
        continue;
      }

      const decision = decide(compiledState);
      const score = scoreRestaurantSemanticTurn({
        actualProposal: interpreted.proposal,
        ...(expectedProposal ? { expectedProposal } : {}),
        actualCompiledPatch: compiled.patch,
        ...(expectedCompilation?.status === "COMPILED"
          ? { expectedCompiledPatch: expectedCompilation.patch }
          : {}),
        actualDraft: compiledState.intentDraft,
        expectedDraft: turn.expectedDraft,
        actualDecision: decision,
        expectedDecision: turn.expectedDecision,
      });
      if (score.status === "FAIL") {
        results.push(
          result({
            sessionId: session.id,
            turnId: turn.id,
            status: "FAIL",
            firstFailureStage: score.firstFailureStage,
            modelStatus: interpreted.status,
            errors: [score.error],
            ...(compiledState.intentDraft ? { actualDraft: compiledState.intentDraft } : {}),
            actualDecision: decision,
            proposal: interpreted.proposal,
            compiledPatch: compiled.patch,
          }),
        );
        blocked = true;
        continue;
      }
      if (!issuedDecisionCommand) {
        results.push(
          result({
            sessionId: session.id,
            turnId: turn.id,
            status: "FAIL",
            firstFailureStage: "RUNTIME",
            modelStatus: interpreted.status,
            errors: ["A state-changing semantic result did not issue DECIDE_RESTAURANT_NEXT"],
            ...(compiledState.intentDraft ? { actualDraft: compiledState.intentDraft } : {}),
            actualDecision: decision,
            proposal: interpreted.proposal,
            compiledPatch: compiled.patch,
          }),
        );
        blocked = true;
        continue;
      }
      try {
        dispatch({ type: "RESTAURANT_DECISION_MADE", decision }, "SYSTEM");
        if (decision.type === "SEARCH") {
          const searching = runtime.snapshot(taskId).domainState;
          if (!searching.intent) throw new Error("SEARCH decision did not create an executable intent");
          dispatch(
            { type: "SEARCH_COMPLETED", candidates: await search.search(searching.intent) },
            "ADAPTER",
          );
          const presentCandidates = decide(runtime.snapshot(taskId).domainState);
          if (presentCandidates.type !== "PRESENT_CANDIDATES") {
            throw new Error("Fixture search did not lead to PRESENT_CANDIDATES");
          }
          dispatch({ type: "RESTAURANT_DECISION_MADE", decision: presentCandidates }, "SYSTEM");
        }
      } catch (error) {
        results.push(
          result({
            sessionId: session.id,
            turnId: turn.id,
            status: "FAIL",
            firstFailureStage: "RUNTIME",
            modelStatus: interpreted.status,
            errors: [error instanceof Error ? error.message : String(error)],
            ...(compiledState.intentDraft ? { actualDraft: compiledState.intentDraft } : {}),
            actualDecision: decision,
            proposal: interpreted.proposal,
            compiledPatch: compiled.patch,
          }),
        );
        blocked = true;
        continue;
      }

      results.push(
        result({
          sessionId: session.id,
          turnId: turn.id,
          status: "PASS",
          modelStatus: interpreted.status,
          ...(compiledState.intentDraft ? { actualDraft: compiledState.intentDraft } : {}),
          actualDecision: decision,
        }),
      );
    }
  }

  const firstFailureStages: RestaurantSemanticRegressionReport["summary"]["firstFailureStages"] = {};
  for (const item of results) {
    if (item.firstFailureStage) {
      firstFailureStages[item.firstFailureStage] =
        (firstFailureStages[item.firstFailureStage] ?? 0) + 1;
    }
  }
  return {
    evaluatorVersion: "1",
    datasetId: dataset.id,
    datasetVersion: dataset.version,
    mode: input.mode,
    attributionLevel: input.attributionLevel,
    status: "COMPLETED",
    turns: results,
    summary: {
      totalTurns: results.length,
      modelEvaluatedTurns: results.filter((item) => item.status !== "BLOCKED_BY_UPSTREAM").length,
      passedTurns: results.filter((item) => item.status === "PASS").length,
      blockedTurns: results.filter((item) => item.status === "BLOCKED_BY_UPSTREAM").length,
      firstFailureStages,
    },
  };
}
