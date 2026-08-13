import type {
  DecisionState,
  DecisionStatePatch,
} from "./restaurant-decision-eval-contract.js";
import {
  decisionHardConstraintKey,
  decisionPreferenceKey,
} from "./restaurant-decision-patch-contract.js";

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function mergeSemanticSet<T>(
  current: readonly T[],
  additions: readonly T[] | undefined,
  removals: readonly T[] | undefined,
  keyFor: (value: T) => string,
): T[] {
  const next = new Map(current.map((value) => [keyFor(value), structuredClone(value)]));
  for (const value of removals ?? []) next.delete(keyFor(value));
  for (const value of additions ?? []) next.set(keyFor(value), structuredClone(value));
  return [...next.values()];
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
    preferences: mergeSemanticSet(
      current.preferences,
      patch.add?.preferences,
      patch.remove?.preferences,
      decisionPreferenceKey,
    ),
    hardConstraints: mergeSemanticSet(
      current.hardConstraints,
      patch.add?.hardConstraints,
      patch.remove?.hardConstraints,
      decisionHardConstraintKey,
    ),
  };
  if (occasion !== undefined) next.occasion = occasion;
  if (time !== undefined) next.time = structuredClone(time);
  if (party !== undefined) next.party = structuredClone(party);
  if (location !== undefined) next.location = structuredClone(location);
  return next;
}
