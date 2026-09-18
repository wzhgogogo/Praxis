import type {
  RestaurantBookingIntent,
  RestaurantBlockingField,
  RestaurantCriterion,
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

/**
 * Discovery only needs a usable search area.  The delivery goal controls the
 * eventual evidence profile, not whether a candidate lookup may bind its own
 * current parameters.  Availability reads still require their complete,
 * separately-bound date, time window, and party size below.
 */
export function missingSearchFields(input: {
  area?: { query?: unknown; coordinates?: unknown };
}): Array<"area"> {
  const nearbyNeedsLocation = typeof input.area?.query === "string"
    && input.area.query.trim().toLocaleLowerCase("en-US") === "nearby"
    && input.area.coordinates === undefined;
  return [
    ...(input.area === undefined || nearbyNeedsLocation ? (["area"] as const) : []),
  ];
}

function hasOwn(input: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

/** Stable identity for collection semantics; strength is mutable user intent, not identity. */
export function restaurantCriterionKey(criterion: RestaurantCriterion): string {
  return [
    criterion.text.trim().toLowerCase(),
    criterion.polarity,
  ].join("\u0000");
}

function normalizedCriterion(criterion: RestaurantCriterion): RestaurantCriterion {
  return { ...criterion, text: criterion.text.trim() };
}

function mergeCriteria(
  existing: RestaurantCriterion[],
  additions: RestaurantCriterion[] | undefined,
  removals: RestaurantCriterion[] | undefined,
  replacement: RestaurantCriterion[] | undefined,
): RestaurantCriterion[] {
  const removed = new Set((removals ?? []).map(restaurantCriterionKey));
  const merged = new Map<string, RestaurantCriterion>();
  for (const criterion of replacement ?? existing) {
    const normalized = normalizedCriterion(criterion);
    if (!removed.has(restaurantCriterionKey(normalized))) {
      merged.set(restaurantCriterionKey(normalized), normalized);
    }
  }
  for (const criterion of additions ?? []) {
    const normalized = normalizedCriterion(criterion);
    if (!removed.has(restaurantCriterionKey(normalized))) {
      merged.set(restaurantCriterionKey(normalized), normalized);
    }
  }
  return [...merged.values()];
}

/** Reducer-owned projection. Missing fields are derived from authoritative values, never model output. */
export function applyRestaurantIntentPatch(
  current: RestaurantIntentDraft | undefined,
  patch: RestaurantIntentPatch,
): RestaurantIntentDraft {
  const next: RestaurantIntentDraft = {
    schemaVersion: "3",
    timezone: "Asia/Tokyo",
    ...(current?.target ? { target: structuredClone(current.target) } : {}),
    ...(current?.date ? { date: current.date } : {}),
    ...(current?.timeWindow ? { timeWindow: structuredClone(current.timeWindow) } : {}),
    ...(current?.permittedAlternativeTimeWindow ? { permittedAlternativeTimeWindow: structuredClone(current.permittedAlternativeTimeWindow) } : {}),
    ...(current?.temporalResolution ? { temporalResolution: structuredClone(current.temporalResolution) } : {}),
    ...(current?.partySize ? { partySize: current.partySize } : {}),
    ...(current?.partySizeSource ? { partySizeSource: current.partySizeSource } : {}),
    ...(current?.area ? { area: structuredClone(current.area) } : {}),
    criteria: structuredClone(current?.criteria ?? []),
    ...(current?.budgetPerPerson
      ? { budgetPerPerson: structuredClone(current.budgetPerPerson) }
      : {}),
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
    // A replacement time invalidates permission tied to the previous request.
    // An explicitly supplied new permission is applied below.
    delete next.permittedAlternativeTimeWindow;
    if (patch.timeWindow === null) delete next.timeWindow;
    else if (patch.timeWindow) next.timeWindow = structuredClone(patch.timeWindow);
  }
  if (hasOwn(patch, "permittedAlternativeTimeWindow")) {
    if (patch.permittedAlternativeTimeWindow === null) delete next.permittedAlternativeTimeWindow;
    else if (patch.permittedAlternativeTimeWindow) next.permittedAlternativeTimeWindow = structuredClone(patch.permittedAlternativeTimeWindow);
  }
  if (hasOwn(patch, "temporalResolution")) {
    if (patch.temporalResolution === null) delete next.temporalResolution;
    else if (patch.temporalResolution) next.temporalResolution = structuredClone(patch.temporalResolution);
  }
  if (hasOwn(patch, "partySize")) {
    if (patch.partySize === null) {
      delete next.partySize;
      delete next.partySizeSource;
    }
    else if (patch.partySize) next.partySize = patch.partySize;
  }
  if (hasOwn(patch, "partySizeSource")) {
    if (patch.partySizeSource === null) delete next.partySizeSource;
    else if (patch.partySizeSource && next.partySize !== undefined) next.partySizeSource = patch.partySizeSource;
  }
  if (hasOwn(patch, "area")) {
    if (patch.area === null) delete next.area;
    else if (patch.area) next.area = structuredClone(patch.area);
  }
  if (hasOwn(patch, "budgetPerPerson")) {
    if (patch.budgetPerPerson === null) delete next.budgetPerPerson;
    else if (patch.budgetPerPerson) next.budgetPerPerson = structuredClone(patch.budgetPerPerson);
  }
  next.criteria = mergeCriteria(
    next.criteria,
    patch.addCriteria,
    patch.removeCriteria,
    patch.replaceCriteria,
  );

  return next;
}

export function completeRestaurantIntent(
  draft: RestaurantIntentDraft | undefined,
): RestaurantBookingIntent | null {
  if (
    !draft ||
    missingSearchFields(draft).length > 0 ||
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
    ...(draft.permittedAlternativeTimeWindow ? { permittedAlternativeTimeWindow: structuredClone(draft.permittedAlternativeTimeWindow) } : {}),
    partySize: draft.partySize,
    area: structuredClone(draft.area),
    criteria: structuredClone(draft.criteria),
    ...(draft.budgetPerPerson ? { budgetPerPerson: structuredClone(draft.budgetPerPerson) } : {}),
  };
}

export function completeRestaurantSearchIntent(
  draft: RestaurantIntentDraft | undefined,
): import("./contracts.js").RestaurantSearchIntent | null {
  if (
    !draft ||
    missingSearchFields(draft).length > 0 ||
    !draft.area
  ) {
    return null;
  }
  return {
    timezone: draft.timezone,
    ...(draft.target ? { target: structuredClone(draft.target) } : {}),
    ...(draft.date ? { date: draft.date } : {}),
    ...(draft.timeWindow ? { timeWindow: structuredClone(draft.timeWindow) } : {}),
    ...(draft.permittedAlternativeTimeWindow ? { permittedAlternativeTimeWindow: structuredClone(draft.permittedAlternativeTimeWindow) } : {}),
    area: structuredClone(draft.area),
    criteria: structuredClone(draft.criteria),
    ...(draft.budgetPerPerson ? { budgetPerPerson: structuredClone(draft.budgetPerPerson) } : {}),
  };
}
