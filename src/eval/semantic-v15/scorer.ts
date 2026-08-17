import { isDeepStrictEqual } from "node:util";

import type {
  RestaurantDecision,
  RestaurantIntentDraft,
  RestaurantIntentPatch,
} from "../../domains/restaurant/contracts.js";
import type {
  RestaurantSemanticFact,
  RestaurantSemanticProposal,
  RestaurantSemanticValue,
} from "../../domains/restaurant/semantic-proposal.js";
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

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalStringSet(values: string[] | undefined): string[] | undefined {
  return values === undefined ? undefined : [...new Set(values)].sort(compareStrings);
}

function semanticValueKey(value: RestaurantSemanticValue | undefined): string {
  if (!value) return "";
  switch (value.kind) {
    case "TARGET":
    case "AREA":
      return `${value.kind}:${value.query}`;
    case "DATE":
    case "CUISINE":
    case "HARD_CONSTRAINT":
    case "SOFT_PREFERENCE":
      return `${value.kind}:${value.value}`;
    case "TIME_WINDOW":
      return `${value.kind}:${value.earliest}:${value.latest}`;
    case "PARTY_SIZE":
      return `${value.kind}:${value.value}`;
    case "BUDGET_PER_PERSON":
      return `${value.kind}:${value.max}:${value.currency}`;
  }
}

function semanticFactKey(fact: RestaurantSemanticFact): string {
  return `${fact.field}:${fact.operation}:${semanticValueKey(fact.value)}`;
}

function canonicalProposal(proposal: RestaurantSemanticProposal | undefined) {
  if (!proposal) return proposal;
  const facts = new Map<string, RestaurantSemanticFact>();
  for (const fact of proposal.facts) facts.set(semanticFactKey(fact), fact);
  return {
    ...proposal,
    facts: [...facts.entries()]
      .sort(([left], [right]) => compareStrings(left, right))
      .map(([, fact]) => fact),
  };
}

function canonicalPatch(patch: RestaurantIntentPatch | undefined) {
  if (!patch) return patch;
  return {
    ...patch,
    ...(patch.addCuisines !== undefined ? { addCuisines: canonicalStringSet(patch.addCuisines) } : {}),
    ...(patch.replaceCuisines !== undefined
      ? { replaceCuisines: canonicalStringSet(patch.replaceCuisines) }
      : {}),
    ...(patch.removeCuisines !== undefined
      ? { removeCuisines: canonicalStringSet(patch.removeCuisines) }
      : {}),
    ...(patch.addHardConstraints !== undefined
      ? { addHardConstraints: canonicalStringSet(patch.addHardConstraints) }
      : {}),
    ...(patch.replaceHardConstraints !== undefined
      ? { replaceHardConstraints: canonicalStringSet(patch.replaceHardConstraints) }
      : {}),
    ...(patch.removeHardConstraints !== undefined
      ? { removeHardConstraints: canonicalStringSet(patch.removeHardConstraints) }
      : {}),
    ...(patch.addSoftPreferences !== undefined
      ? { addSoftPreferences: canonicalStringSet(patch.addSoftPreferences) }
      : {}),
    ...(patch.replaceSoftPreferences !== undefined
      ? { replaceSoftPreferences: canonicalStringSet(patch.replaceSoftPreferences) }
      : {}),
    ...(patch.removeSoftPreferences !== undefined
      ? { removeSoftPreferences: canonicalStringSet(patch.removeSoftPreferences) }
      : {}),
  };
}

function canonicalDraft(draft: RestaurantIntentDraft | undefined) {
  if (!draft) return draft;
  return {
    ...draft,
    cuisines: canonicalStringSet(draft.cuisines)!,
    hardConstraints: canonicalStringSet(draft.hardConstraints)!,
    softPreferences: canonicalStringSet(draft.softPreferences)!,
  };
}

/** Eval-only semantic equality for unordered Restaurant collection values and facts. */
export function equalRestaurantSemanticProposals(
  actual: RestaurantSemanticProposal | undefined,
  expected: RestaurantSemanticProposal | undefined,
): boolean {
  return isDeepStrictEqual(canonicalProposal(actual), canonicalProposal(expected));
}

export function equalRestaurantIntentPatches(
  actual: RestaurantIntentPatch | undefined,
  expected: RestaurantIntentPatch | undefined,
): boolean {
  return isDeepStrictEqual(canonicalPatch(actual), canonicalPatch(expected));
}

export function equalRestaurantIntentDrafts(
  actual: RestaurantIntentDraft | undefined,
  expected: RestaurantIntentDraft | undefined,
): boolean {
  return isDeepStrictEqual(canonicalDraft(actual), canonicalDraft(expected));
}

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
    !equalRestaurantSemanticProposals(input.actualProposal, input.expectedProposal)
  ) {
    return {
      status: "FAIL",
      firstFailureStage: "SEMANTIC_INTERPRETER",
      error: "Semantic Proposal does not match the development-stage interpretation oracle",
    };
  }
  if (
    input.expectedCompiledPatch !== undefined &&
    !equalRestaurantIntentPatches(input.actualCompiledPatch, input.expectedCompiledPatch)
  ) {
    return {
      status: "FAIL",
      firstFailureStage: "COMPILER",
      error: "Compiled patch does not match the deterministic development-stage oracle",
    };
  }
  if (!equalRestaurantIntentDrafts(input.actualDraft, input.expectedDraft)) {
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
