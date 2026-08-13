import type {
  DecisionHardConstraint,
  DecisionLocation,
  DecisionPreference,
  DecisionState,
} from "./restaurant-decision-eval-contract.js";
import {
  decisionHardConstraintKey,
  decisionPreferenceKey,
} from "./restaurant-decision-patch-contract.js";

type ComparableDecisionLocation =
  | { kind: "AREA_OR_NEAR_PLACE"; query: string }
  | { kind: "ADDRESS_OR_STREET"; query: string }
  | { kind: "FLEXIBLE"; anchorQuery?: string; scope?: string }
  | { kind: "UNKNOWN" };

type ComparableDecisionState = Omit<DecisionState, "location"> & {
  location?: ComparableDecisionLocation;
};

/**
 * Explicit Eval-only aliases for restaurant category labels. This is not a
 * fuzzy matcher: values outside this table remain unchanged and are scored
 * strictly. Entity names, hard constraints, and arbitrary preferences are
 * intentionally outside this boundary.
 */
const CATEGORY_LABEL_ALIASES: Readonly<Record<string, string>> = {
  "western": "western",
  "western food": "western",
  "japanese": "japanese",
  "japanese food": "japanese",
  "izakaya": "izakaya",
};

function labelKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export function canonicalizeDecisionCategoryLabel(value: string): string {
  return CATEGORY_LABEL_ALIASES[labelKey(value)] ?? value;
}

function canonicalizeLocationQuery(value: string): string {
  return labelKey(value);
}

function canonicalizeFlexibleAnchor(value: string | undefined): string | undefined {
  return value === undefined ? undefined : canonicalizeLocationQuery(value);
}

function scopeToAnchor(scope: string | undefined): string | undefined {
  if (scope === undefined) return undefined;
  const match = /^(?:start(?:ing)?\s+)?(?:from|around|near)\s+(.+?)(?:\s*,|\s+and\s+|$)/i.exec(scope.trim());
  return match?.[1] === undefined ? undefined : canonicalizeLocationQuery(match[1]);
}

function canonicalizeFlexibleScope(scope: string | undefined): string | undefined {
  if (scope === undefined) return undefined;
  const key = labelKey(scope);
  const genericFlexibleScopes = new Set([
    "can travel",
    "can travel farther",
    "can travel farther if it is worth it",
    "can travel farther if it's worth it",
    "farther if it is worth it",
    "farther if it's worth it",
    "if the restaurant is worth it",
    "travel if it is worth it",
    "travel if it's worth it",
    "willing to travel",
    "worth it",
  ]);
  if (genericFlexibleScopes.has(key)) return undefined;
  if (scopeToAnchor(scope) !== undefined) return undefined;
  return key;
}

function canonicalizeDecisionLocation(location: DecisionLocation | undefined): ComparableDecisionLocation | undefined {
  if (location === undefined) return undefined;
  switch (location.kind) {
    case "AREA":
    case "NEAR_PLACE":
      return {
        kind: "AREA_OR_NEAR_PLACE",
        query: canonicalizeLocationQuery(location.query),
      };
    case "ADDRESS_OR_STREET":
      return {
        kind: location.kind,
        query: canonicalizeLocationQuery(location.query),
      };
    case "FLEXIBLE": {
      const anchorQuery = canonicalizeFlexibleAnchor(location.anchorQuery) ?? scopeToAnchor(location.scope);
      const scope = canonicalizeFlexibleScope(location.scope);
      return {
        kind: "FLEXIBLE",
        ...(anchorQuery === undefined ? {} : { anchorQuery }),
        ...(scope === undefined ? {} : { scope }),
      };
    }
    case "UNKNOWN":
      return { kind: "UNKNOWN" };
  }
}

function canonicalizePreference(value: DecisionPreference): DecisionPreference {
  return value.facet === "CUISINE"
    ? { ...value, value: canonicalizeDecisionCategoryLabel(value.value) }
    : structuredClone(value);
}

function canonicalizeHardConstraint(value: DecisionHardConstraint): DecisionHardConstraint {
  return value.kind === "ALLERGY"
    ? { ...value, allergen: value.allergen.trim().toLocaleUpperCase("en-US") }
    : structuredClone(value);
}

/**
 * Produces the representation used only by Eval S1/S2 semantic comparison.
 * It does not mutate Golden data, model proposals, production State, or model
 * input. The same controlled aliases apply only to category targets and
 * explicit cuisine preferences; location rules are limited to exact
 * query normalization, AREA/NEAR_PLACE granularity, and FLEXIBLE anchors.
 * Constraints remain strict.
 */
export function canonicalizeDecisionStateForComparison(state: DecisionState): ComparableDecisionState {
  const comparable: ComparableDecisionState = {
    target: state.target.kind === "CATEGORY"
      ? { ...state.target, query: canonicalizeDecisionCategoryLabel(state.target.query) }
      : structuredClone(state.target),
    preferences: state.preferences
      .map(canonicalizePreference)
      .sort((left, right) => decisionPreferenceKey(left).localeCompare(decisionPreferenceKey(right))),
    hardConstraints: state.hardConstraints
      .map(canonicalizeHardConstraint)
      .sort((left, right) => decisionHardConstraintKey(left).localeCompare(decisionHardConstraintKey(right))),
  };
  if (state.occasion !== undefined) comparable.occasion = state.occasion;
  if (state.time !== undefined) comparable.time = structuredClone(state.time);
  if (state.party !== undefined) comparable.party = structuredClone(state.party);
  const location = canonicalizeDecisionLocation(state.location);
  if (location !== undefined) comparable.location = location;
  return comparable;
}
