import { isDeepStrictEqual } from "node:util";

import type {
  RestaurantCriterion,
  RestaurantSemanticExpectedDecision,
  RestaurantIntentDraft,
  RestaurantIntentPatch,
} from "../../domains/restaurant/contracts.js";
import type {
  RestaurantSemanticFact,
  RestaurantSemanticProposal,
  RestaurantSemanticValue,
} from "../../domains/restaurant/semantic-proposal.js";

export const RESTAURANT_SEMANTIC_SCORER_VERSION = "3";

export type RestaurantSemanticScoreFailure =
  | "SEMANTIC_INTERPRETER"
  | "COMPILER"
  | "REDUCER"
  | "SEMANTIC_RESULT";

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

function canonicalCriterion(criterion: RestaurantCriterion): RestaurantCriterion {
  return { ...criterion, text: criterion.text.trim().toLowerCase() };
}

function criterionKey(criterion: RestaurantCriterion): string {
  const canonical = canonicalCriterion(criterion);
  return `${canonical.text}\u0000${canonical.polarity}\u0000${canonical.strength}`;
}

function canonicalCriterionSet(
  criteria: RestaurantCriterion[] | undefined,
): RestaurantCriterion[] | undefined {
  if (criteria === undefined) return undefined;
  const unique = new Map<string, RestaurantCriterion>();
  for (const criterion of criteria) {
    const canonical = canonicalCriterion(criterion);
    unique.set(criterionKey(canonical), canonical);
  }
  return [...unique.entries()]
    .sort(([left], [right]) => compareStrings(left, right))
    .map(([, criterion]) => criterion);
}

function semanticValueKey(value: RestaurantSemanticValue | undefined): string {
  if (!value) return "";
  switch (value.kind) {
    case "TARGET":
    case "AREA":
      return `${value.kind}:${value.query}`;
    case "DATE":
      return `${value.kind}:${value.value}`;
    case "TIME_WINDOW":
      return `${value.kind}:${value.earliest}:${value.latest}`;
    case "PARTY_SIZE":
      return `${value.kind}:${value.value}`;
    case "BUDGET_PER_PERSON":
      return `${value.kind}:${value.max}:${value.currency}`;
    case "CRITERION":
      return `${value.kind}:${criterionKey(value)}`;
  }
}

function semanticFactKey(fact: RestaurantSemanticFact): string {
  return `${fact.field}:${fact.operation}:${semanticValueKey(fact.value)}`;
}

function canonicalFact(fact: RestaurantSemanticFact): RestaurantSemanticFact {
  if (fact.value?.kind !== "CRITERION") return fact;
  return { ...fact, value: { ...fact.value, ...canonicalCriterion(fact.value) } };
}

function canonicalProposal(proposal: RestaurantSemanticProposal | undefined) {
  if (!proposal) return proposal;
  const facts = new Map<string, RestaurantSemanticFact>();
  for (const fact of proposal.facts) {
    const canonical = canonicalFact(fact);
    facts.set(semanticFactKey(canonical), canonical);
  }
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
    ...(patch.addCriteria !== undefined ? { addCriteria: canonicalCriterionSet(patch.addCriteria) } : {}),
    ...(patch.replaceCriteria !== undefined
      ? { replaceCriteria: canonicalCriterionSet(patch.replaceCriteria) }
      : {}),
    ...(patch.removeCriteria !== undefined
      ? { removeCriteria: canonicalCriterionSet(patch.removeCriteria) }
      : {}),
  };
}

function canonicalDraft(draft: RestaurantIntentDraft | undefined) {
  if (!draft) return draft;
  return {
    ...draft,
    criteria: canonicalCriterionSet(draft.criteria)!,
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
 * Semantic scorer for the Interpreter → Compiler → Reducer boundary.
 */
export function scoreRestaurantSemanticTurn(input: {
  actualProposal?: RestaurantSemanticProposal;
  expectedProposal?: RestaurantSemanticProposal;
  actualCompiledPatch?: RestaurantIntentPatch;
  expectedCompiledPatch?: RestaurantIntentPatch;
  actualDraft: RestaurantIntentDraft | undefined;
  expectedDraft: RestaurantIntentDraft;
  /** Deprecated v17 eval labels, intentionally ignored by v18 semantic scoring. */
  actualDecision?: RestaurantSemanticExpectedDecision;
  expectedDecision?: RestaurantSemanticExpectedDecision;
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
  return { status: "PASS" };
}
