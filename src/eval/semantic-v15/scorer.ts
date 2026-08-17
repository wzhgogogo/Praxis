import { isDeepStrictEqual } from "node:util";

import type {
  RestaurantDecision,
  RestaurantIntentDraft,
  RestaurantIntentPatch,
} from "../../domains/restaurant/contracts.js";
import type { RestaurantSemanticProposal } from "../../domains/restaurant/semantic-proposal.js";
import type { RestaurantSemanticHoldoutDecision } from "./holdout.js";

export type RestaurantSemanticScoreFailure =
  | "SEMANTIC_INTERPRETER"
  | "COMPILER"
  | "REDUCER"
  | "SEMANTIC_RESULT"
  | "DECISION_KERNEL";

export type RestaurantSemanticScore =
  | { status: "PASS" }
  | {
      status: "FAIL";
      firstFailureStage: RestaurantSemanticScoreFailure;
      error: string;
    };

/**
 * Deterministic v15 Gold scorer. Draft semantics are scored before the Kernel
 * decision so one wrong interpretation is never counted again downstream.
 */
export function scoreRestaurantSemanticTurn(input: {
  actualProposal?: RestaurantSemanticProposal;
  expectedProposal?: RestaurantSemanticProposal;
  actualCompiledPatch?: RestaurantIntentPatch;
  expectedCompiledPatch?: RestaurantIntentPatch;
  actualDraft: RestaurantIntentDraft | undefined;
  expectedDraft: RestaurantIntentDraft;
  actualDecision: RestaurantDecision;
  expectedDecision: RestaurantSemanticHoldoutDecision;
}): RestaurantSemanticScore {
  const hasStageOracle = input.expectedProposal !== undefined;
  if (
    input.expectedProposal !== undefined &&
    !isDeepStrictEqual(input.actualProposal, input.expectedProposal)
  ) {
    return {
      status: "FAIL",
      firstFailureStage: "SEMANTIC_INTERPRETER",
      error: "Semantic Proposal does not match the development-stage interpretation oracle",
    };
  }
  if (
    input.expectedCompiledPatch !== undefined &&
    !isDeepStrictEqual(input.actualCompiledPatch, input.expectedCompiledPatch)
  ) {
    return {
      status: "FAIL",
      firstFailureStage: "COMPILER",
      error: "Compiled patch does not match the deterministic development-stage oracle",
    };
  }
  if (!isDeepStrictEqual(input.actualDraft, input.expectedDraft)) {
    return {
      status: "FAIL",
      firstFailureStage: hasStageOracle ? "REDUCER" : "SEMANTIC_RESULT",
      error: hasStageOracle
        ? "Authoritative Draft differs after a correct Proposal and compiled patch"
        : "Compiled authoritative draft does not match the labelled semantic result",
    };
  }
  if (!isDeepStrictEqual(input.actualDecision, input.expectedDecision)) {
    return {
      status: "FAIL",
      firstFailureStage: "DECISION_KERNEL",
      error: "Decision Kernel result does not match the labelled next step",
    };
  }
  return { status: "PASS" };
}
