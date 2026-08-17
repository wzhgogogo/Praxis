import { isDeepStrictEqual } from "node:util";

import type {
  RestaurantDecision,
  RestaurantIntentDraft,
} from "../../domains/restaurant/contracts.js";
import type { RestaurantSemanticHoldoutDecision } from "./holdout.js";

export type RestaurantSemanticScoreFailure = "SEMANTIC_RESULT" | "DECISION_KERNEL";

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
  actualDraft: RestaurantIntentDraft | undefined;
  expectedDraft: RestaurantIntentDraft;
  actualDecision: RestaurantDecision;
  expectedDecision: RestaurantSemanticHoldoutDecision;
}): RestaurantSemanticScore {
  if (!isDeepStrictEqual(input.actualDraft, input.expectedDraft)) {
    return {
      status: "FAIL",
      firstFailureStage: "SEMANTIC_RESULT",
      error: "Compiled authoritative draft does not match the labelled semantic result",
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
