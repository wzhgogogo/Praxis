import type {
  RestaurantBookingIntent,
  RestaurantBlockingField,
  RestaurantIntentDraft,
  RestaurantIntentPatch,
} from "./contracts.js";

export function missingBlockingFields(input: {
  date?: unknown;
  timeWindow?: unknown;
  partySize?: unknown;
  area?: unknown;
}): RestaurantBlockingField[] {
  return [
    ...(input.date === undefined ? (["date"] as const) : []),
    ...(input.timeWindow === undefined ? (["timeWindow"] as const) : []),
    ...(input.partySize === undefined ? (["partySize"] as const) : []),
    ...(input.area === undefined ? (["area"] as const) : []),
  ];
}

function hasOwn(input: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function mergeValues(
  existing: string[],
  additions: string[] | undefined,
  removals: string[] | undefined,
  replacement: string[] | undefined,
) {
  const removed = new Set(removals ?? []);
  const base = replacement ?? existing;
  return [...new Set([...base.filter((item) => !removed.has(item)), ...(additions ?? [])])];
}

/** Reducer-owned projection. Missing fields are derived from authoritative values, never model output. */
export function applyRestaurantIntentPatch(
  current: RestaurantIntentDraft | undefined,
  patch: RestaurantIntentPatch,
): RestaurantIntentDraft {
  const next: RestaurantIntentDraft = {
    schemaVersion: "1",
    timezone: "Asia/Tokyo",
    ...(current?.target ? { target: structuredClone(current.target) } : {}),
    ...(current?.date ? { date: current.date } : {}),
    ...(current?.timeWindow ? { timeWindow: structuredClone(current.timeWindow) } : {}),
    ...(current?.partySize ? { partySize: current.partySize } : {}),
    ...(current?.area ? { area: structuredClone(current.area) } : {}),
    cuisines: structuredClone(current?.cuisines ?? []),
    ...(current?.budgetPerPerson
      ? { budgetPerPerson: structuredClone(current.budgetPerPerson) }
      : {}),
    hardConstraints: structuredClone(current?.hardConstraints ?? []),
    softPreferences: structuredClone(current?.softPreferences ?? []),
  };

  if (hasOwn(patch, "target")) {
    if (patch.target === null) delete next.target;
    else if (patch.target) next.target = structuredClone(patch.target);
  }
  if (hasOwn(patch, "date")) {
    if (patch.date === null) delete next.date;
    else if (patch.date) next.date = patch.date;
  }
  if (hasOwn(patch, "timeWindow")) {
    if (patch.timeWindow === null) delete next.timeWindow;
    else if (patch.timeWindow) next.timeWindow = structuredClone(patch.timeWindow);
  }
  if (hasOwn(patch, "partySize")) {
    if (patch.partySize === null) delete next.partySize;
    else if (patch.partySize) next.partySize = patch.partySize;
  }
  if (hasOwn(patch, "area")) {
    if (patch.area === null) delete next.area;
    else if (patch.area) next.area = structuredClone(patch.area);
  }
  if (hasOwn(patch, "budgetPerPerson")) {
    if (patch.budgetPerPerson === null) delete next.budgetPerPerson;
    else if (patch.budgetPerPerson) next.budgetPerPerson = structuredClone(patch.budgetPerPerson);
  }
  next.cuisines = mergeValues(
    next.cuisines,
    patch.addCuisines,
    patch.removeCuisines,
    patch.replaceCuisines,
  );
  next.hardConstraints = mergeValues(
    next.hardConstraints,
    patch.addHardConstraints,
    patch.removeHardConstraints,
    patch.replaceHardConstraints,
  );
  next.softPreferences = mergeValues(
    next.softPreferences,
    patch.addSoftPreferences,
    patch.removeSoftPreferences,
    patch.replaceSoftPreferences,
  );

  return next;
}

export function completeRestaurantIntent(
  draft: RestaurantIntentDraft | undefined,
): RestaurantBookingIntent | null {
  if (
    !draft ||
    missingBlockingFields(draft).length > 0 ||
    !draft.date ||
    !draft.timeWindow ||
    !draft.partySize ||
    !draft.area
  ) {
    return null;
  }
  return {
    timezone: draft.timezone,
    ...(draft.target ? { target: structuredClone(draft.target) } : {}),
    date: draft.date,
    timeWindow: structuredClone(draft.timeWindow),
    partySize: draft.partySize,
    area: structuredClone(draft.area),
    cuisines: structuredClone(draft.cuisines),
    ...(draft.budgetPerPerson ? { budgetPerPerson: structuredClone(draft.budgetPerPerson) } : {}),
    hardConstraints: structuredClone(draft.hardConstraints),
    softPreferences: structuredClone(draft.softPreferences),
  };
}
