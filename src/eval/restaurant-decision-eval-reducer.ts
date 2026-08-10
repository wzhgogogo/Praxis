import type {
  DecisionState,
  DecisionStatePatch,
} from "./restaurant-decision-eval-contract.js";

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function mergeStringSet(
  current: readonly string[],
  additions: readonly string[] | undefined,
  removals: readonly string[] | undefined,
): string[] {
  const next = new Set(current);
  for (const value of removals ?? []) next.delete(value);
  for (const value of additions ?? []) next.add(value);
  return [...next];
}

/**
 * Applies a Golden or model-proposed patch without mutating either input.
 * This reducer belongs exclusively to the progressive-decision Eval harness.
 */
export function applyDecisionStatePatch(
  current: DecisionState,
  patch: DecisionStatePatch,
): DecisionState {
  const set = patch.set;
  let occasion = current.occasion;
  let time = current.time;
  let party = current.party;
  let location = current.location;
  let target = current.target;

  if (set !== undefined && hasOwn(set, "occasion")) occasion = set.occasion ?? undefined;
  if (set !== undefined && hasOwn(set, "time")) time = set.time ?? undefined;
  if (set !== undefined && hasOwn(set, "party")) party = set.party ?? undefined;
  if (set !== undefined && hasOwn(set, "location")) location = set.location ?? undefined;
  if (set !== undefined && hasOwn(set, "target") && set.target !== undefined) {
    target = set.target;
  }

  const next: DecisionState = {
    target: structuredClone(target),
    positivePreferences: mergeStringSet(
      current.positivePreferences,
      patch.add?.positivePreferences,
      patch.remove?.positivePreferences,
    ),
    negativePreferences: mergeStringSet(
      current.negativePreferences,
      patch.add?.negativePreferences,
      patch.remove?.negativePreferences,
    ),
    hardConstraints: mergeStringSet(
      current.hardConstraints,
      patch.add?.hardConstraints,
      patch.remove?.hardConstraints,
    ),
  };
  if (occasion !== undefined) next.occasion = occasion;
  if (time !== undefined) next.time = structuredClone(time);
  if (party !== undefined) next.party = structuredClone(party);
  if (location !== undefined) next.location = structuredClone(location);
  return next;
}
