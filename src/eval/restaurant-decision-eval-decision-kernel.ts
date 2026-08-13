import type {
  DecisionCoreTopic,
  DecisionEvalGroundingPrediction,
  DecisionReadiness,
  DecisionState,
  ProposedNextAction,
} from "./restaurant-decision-eval-contract.js";
import type { DecisionEvalModelCandidateContext, DecisionEvalModelProposal } from "./restaurant-decision-eval-model-contract.js";

const RECOMMENDATION_DISPLAY_LIMIT = 4;

export interface DecisionEvalKernelInput {
  state: DecisionState;
  /** Read-only Fixture/Search output; never a model claim or Gold label. */
  retrievedCandidateIds?: readonly string[];
  candidateContext?: readonly DecisionEvalModelCandidateContext[];
  retrievalSufficiency?: "ADEQUATE" | "LIMITED";
  /** Visible prior options mean the user is narrowing an existing option set. */
  hasVisibleOptions: boolean;
  /** A newly extracted preference update narrows an already-ready search. */
  hasPreferenceUpdate: boolean;
  rankedCandidateIds?: readonly string[];
}

export interface DecisionEvalKernelDecision {
  readiness: DecisionReadiness;
  nextAction: ProposedNextAction;
  recommendation?: {
    candidateIds: string[];
    explainsInsufficientCandidates?: boolean;
  };
  grounding: DecisionEvalGroundingPrediction;
}

function hasUsableLocation(state: DecisionState): boolean {
  if (state.location === undefined) return false;
  if (state.location.kind === "FLEXIBLE") return state.location.anchorQuery !== undefined;
  return state.location.kind !== "UNKNOWN";
}

function hasResolvedTarget(state: DecisionState): boolean {
  return state.target.kind === "BRAND" || state.target.kind === "RESTAURANT";
}

function hasRecommendationTime(state: DecisionState): boolean {
  const time = state.time;
  if (time === undefined || time.date === undefined) return false;
  return time.precision !== "UNKNOWN" && time.precision !== "DAY";
}

function hasAvailabilityTime(state: DecisionState): boolean {
  const time = state.time;
  return time?.date !== undefined && (time.precision === "WINDOW" || time.precision === "EXACT");
}

function recommendationReadiness(state: DecisionState): boolean {
  return (
    hasRecommendationTime(state) &&
    state.party !== undefined &&
    (hasUsableLocation(state) || hasResolvedTarget(state))
  );
}

function availabilityReadiness(state: DecisionState): boolean {
  return (
    hasAvailabilityTime(state) &&
    state.party?.precision === "EXACT" &&
    (hasUsableLocation(state) || hasResolvedTarget(state))
  );
}

function missingCoreTopics(state: DecisionState): DecisionCoreTopic[] {
  const topics: DecisionCoreTopic[] = [];
  if (state.time?.date === undefined) topics.push("DATE");
  if (state.party === undefined) topics.push("PARTY");
  if (!hasUsableLocation(state) && !hasResolvedTarget(state)) topics.push("LOCATION_STRATEGY");
  if (state.time === undefined || state.time.precision === "DAY" || state.time.precision === "UNKNOWN") {
    topics.push("TIME");
  }
  return topics.slice(0, 2);
}

function stateFactRefsFor(state: DecisionState): string[] {
  return [
    ...(state.occasion === undefined ? [] : ["state.occasion"]),
    ...(state.time === undefined ? [] : ["state.time"]),
    ...(state.party === undefined ? [] : ["state.party"]),
    ...(state.location === undefined ? [] : ["state.location"]),
    ["state.target"],
    ...(state.preferences.length === 0 ? [] : ["state.preferences"]),
    ...(state.hardConstraints.length === 0 ? [] : ["state.hardConstraints"]),
  ].flat();
}

function candidateRequiresAllergyConfirmation(candidate: DecisionEvalModelCandidateContext): boolean {
  return candidate.facts.some(
    (fact) =>
      fact.field === "attributes" &&
      Array.isArray(fact.value) &&
      fact.value.some((attribute) => attribute.toLowerCase().includes("confirmation required")),
  );
}

function selectCandidateIds(input: DecisionEvalKernelInput): string[] {
  const retrieved = input.retrievedCandidateIds ?? [];
  const retrievedSet = new Set(retrieved);
  const ranked = (input.rankedCandidateIds ?? []).filter((id) => retrievedSet.has(id));
  const ordered = [...ranked, ...retrieved.filter((id) => !ranked.includes(id))];
  return ordered.slice(0, RECOMMENDATION_DISPLAY_LIMIT);
}

function groundingFor(
  state: DecisionState,
  candidateContext: readonly DecisionEvalModelCandidateContext[] | undefined,
  selectedIds: readonly string[],
): DecisionEvalGroundingPrediction {
  const selected = new Set(selectedIds);
  const selectedCandidates = (candidateContext ?? []).filter((candidate) => selected.has(candidate.id));
  return {
    stateFactRefs: stateFactRefsFor(state),
    candidateFactRefs: selectedCandidates.flatMap((candidate) => candidate.facts.map((fact) => fact.id)),
    claimLabels: [],
    candidateDisclosures: selectedCandidates.flatMap((candidate) =>
      candidateRequiresAllergyConfirmation(candidate)
        ? [{
            candidateId: candidate.id,
            type: "ALLERGY_CONFIRMATION_REQUIRED" as const,
            factRef: `${candidate.id}.attributes`,
          }]
        : [],
    ),
  };
}

/**
 * Eval-only deterministic policy boundary. It deliberately decides only from
 * trusted state and read-only search context; it never mutates Runtime state or
 * calls a tool. The model supplies semantic extraction and, optionally, ranking.
 */
export function decideRestaurantEvalTurn(input: DecisionEvalKernelInput): DecisionEvalKernelDecision {
  const readiness: DecisionReadiness = availabilityReadiness(input.state)
    ? "AVAILABILITY_READY"
    : recommendationReadiness(input.state)
      ? "RECOMMENDATION_READY"
      : "NOT_READY";
  const selectedIds = selectCandidateIds(input);
  const nextAction: ProposedNextAction = input.state.target.kind === "RESTAURANT"
    ? { type: "CHECK_TARGET_RESTAURANT" }
    : readiness === "AVAILABILITY_READY"
      ? (input.retrievedCandidateIds?.length === 0
          ? { type: "PROPOSE_CONSTRAINT_RELAXATION" }
          : { type: "CHECK_AVAILABILITY" })
      : readiness === "RECOMMENDATION_READY"
        ? { type: input.hasVisibleOptions || input.hasPreferenceUpdate ? "NARROW_FROM_FEEDBACK" : "SHOW_RECOMMENDATIONS" }
        : { type: "ASK_CORE_FIELD", topics: missingCoreTopics(input.state) };
  const recommendation = selectedIds.length === 0
    ? undefined
    : {
        candidateIds: selectedIds,
        ...(input.retrievalSufficiency === "LIMITED" ? { explainsInsufficientCandidates: true } : {}),
      };
  return {
    readiness,
    nextAction,
    ...(recommendation === undefined ? {} : { recommendation }),
    grounding: groundingFor(input.state, input.candidateContext, selectedIds),
  };
}

/** Applies trusted extraction-independent target discovery at most once. */
export function applyTrustedNamedTargetResolution(
  state: DecisionState,
  patch: DecisionEvalModelProposal["statePatch"],
  target: DecisionState["target"] | undefined,
): DecisionEvalModelProposal["statePatch"] {
  if (target === undefined || state.target.kind !== "OPEN" || patch.set?.target !== undefined) return patch;
  return {
    ...patch,
    set: { ...patch.set, target },
  };
}
