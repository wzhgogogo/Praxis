import { isDeepStrictEqual } from "node:util";

import type {
  RestaurantCriterion,
  RestaurantSemanticExpectedDecision,
  RestaurantIntentDraft,
  RestaurantIntentPatch,
  RestaurantReadGoal,
} from "../../../domains/restaurant/contracts.js";
import type {
  RestaurantSemanticFact,
  RestaurantSemanticProposal,
  RestaurantSemanticValue,
  RestaurantGoalBasis,
} from "../../../domains/restaurant/semantic-proposal.js";

export const RESTAURANT_SEMANTIC_SCORER_VERSION = "4";

export interface RestaurantGoalBoundaryExpectation {
  category: "A" | "B" | "NO_TIME" | "GRAY" | "CONTEXT_CARRY";
  message: string;
  previousGoal?: RestaurantReadGoal;
}

export interface RestaurantGoalBoundaryEvaluation {
  category: RestaurantGoalBoundaryExpectation["category"];
  status: "SATISFIED" | "NOT_SATISFIED";
  actualGoal?: RestaurantReadGoal;
  basis?: RestaurantGoalBasis;
  errors: string[];
}

/** Independent evaluation of frozen category annotations, not a production goal classifier. */
export function evaluateRestaurantSemanticGoal(input: {
  proposal?: RestaurantSemanticProposal;
  actualGoal?: RestaurantReadGoal;
  expectation: RestaurantGoalBoundaryExpectation;
}): RestaurantGoalBoundaryEvaluation {
  const { expectation, actualGoal } = input;
  const targets = input.proposal?.facts.filter(fact => fact.field === "TARGET" && fact.value?.kind === "TARGET") ?? [];
  const target = targets[0]?.value;
  const basis = target?.kind === "TARGET" ? target.goalBasis : undefined;
  const errors: string[] = [];
  if (input.proposal?.schemaVersion !== "4") errors.push("goal evaluation requires semantic proposal schema 4");
  if (expectation.category === "CONTEXT_CARRY") {
    if (targets.length || !expectation.previousGoal || actualGoal !== expectation.previousGoal) errors.push("target.goal must carry the previous goal without a new TARGET");
  } else {
    if (!targets.length || targets.some(fact => fact.value?.kind !== "TARGET" || fact.value.goal !== actualGoal)) errors.push("target.goal must match every new TARGET");
    // Keep this oracle independent of the production proposal validator.
    const words = (value: string) => value.toLowerCase().split(/\s+/).filter(Boolean).join(" ");
    if (!targets.every(fact => {
      const evidence = fact.value?.kind === "TARGET" ? fact.value.goalBasis : undefined;
      return evidence && ["BOOKING_WORDING", "SPECIFIC_TIME_MEAL", "JUDGMENT"].includes(evidence.type)
        && typeof evidence.reason === "string" && evidence.reason.trim() && Array.isArray(evidence.quotes)
        && evidence.quotes.length > 0 && evidence.quotes.every(quote => typeof quote === "string" && words(quote) && words(expectation.message).includes(words(quote)));
    })) {
      errors.push("goalBasis needs nonempty quotes grounded in the current user message");
    }
    const allowed = expectation.category === "GRAY" ? ["RECOMMENDATION", "AVAILABILITY"]
      : [expectation.category === "NO_TIME" ? "RECOMMENDATION" : "AVAILABILITY"];
    if (!actualGoal || !allowed.includes(actualGoal)) errors.push(`target.goal violates frozen ${expectation.category} annotation`);
  }
  return { category: expectation.category, status: errors.length ? "NOT_SATISFIED" : "SATISFIED", ...(actualGoal ? { actualGoal } : {}), ...(basis ? { basis } : {}), errors };
}

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
      return `${value.kind}:${value.goal}:${value.query}`;
    case "AREA":
      return `${value.kind}:${value.query}`;
    case "DATE":
      return `${value.kind}:${"value" in value ? value.value : "relativeDay" in value ? value.relativeDay : "relativeOffsetDays" in value ? `OFFSET_DAYS:${value.relativeOffsetDays}` : value.weekday}`;
    case "TIME_WINDOW":
      return `${value.kind}:${"earliest" in value ? `${value.earliest}:${value.latest}` : "daypart" in value ? value.daypart : value.relativeOffsetMinutes}`;
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
  /** Deprecated ADR-0007 next-step labels, intentionally ignored by current semantic scoring. */
  actualDecision?: RestaurantSemanticExpectedDecision;
  expectedDecision?: RestaurantSemanticExpectedDecision;
  goalBoundary?: RestaurantGoalBoundaryExpectation;
}): RestaurantSemanticScore {
  if (input.goalBoundary) {
    const goal = evaluateRestaurantSemanticGoal({ ...(input.actualProposal ? { proposal: input.actualProposal } : {}), ...(input.actualDraft?.target ? { actualGoal: input.actualDraft.target.goal } : {}), expectation: input.goalBoundary });
    if (goal.status !== "SATISFIED") return { status: "FAIL", firstFailureStage: "SEMANTIC_INTERPRETER", error: goal.errors.join("; ") };
  }
  const withoutTarget = (proposal: RestaurantSemanticProposal | undefined) => input.goalBoundary && proposal
    ? { ...proposal, facts: proposal.facts.filter(fact => fact.field !== "TARGET") } : proposal;
  const withoutTargetPatch = (patch: RestaurantIntentPatch | undefined) => {
    if (!input.goalBoundary || !patch) return patch;
    const { target: _target, ...rest } = patch;
    return rest;
  };
  let actualDraft = input.actualDraft;
  if (input.goalBoundary && actualDraft) {
    const { target, ...rest } = actualDraft;
    // Missing legacy target labels stay unannotated; the new target is scored above.
    actualDraft = input.expectedDraft.target && target
      ? { ...rest, target: { ...target, goal: input.expectedDraft.target.goal } } : rest;
  }
  const hasStageOracle = input.expectedProposal !== undefined;
  if (
    input.expectedProposal !== undefined &&
    !equalRestaurantSemanticProposals(withoutTarget(input.actualProposal), withoutTarget(input.expectedProposal))
  ) {
    return {
      status: "FAIL",
      firstFailureStage: "SEMANTIC_INTERPRETER",
      error: "Semantic Proposal does not match the development-stage interpretation oracle",
    };
  }
  if (
    input.expectedCompiledPatch !== undefined &&
    !equalRestaurantIntentPatches(withoutTargetPatch(input.actualCompiledPatch), withoutTargetPatch(input.expectedCompiledPatch))
  ) {
    return {
      status: "FAIL",
      firstFailureStage: "COMPILER",
      error: "Compiled patch does not match the deterministic development-stage oracle",
    };
  }
  if (!equalRestaurantIntentDrafts(actualDraft, input.expectedDraft)) {
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
