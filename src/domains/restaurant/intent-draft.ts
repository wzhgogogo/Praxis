import {
  RESTAURANT_CRITERION_POLARITIES,
  RESTAURANT_CRITERION_STRENGTHS,
  type RestaurantIntentDraft,
} from "./contracts.js";

export type RestaurantIntentValidationResult =
  | { valid: true; value: RestaurantIntentDraft }
  | { valid: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCriterionArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        hasOnlyKeys(item, ["text", "polarity", "strength", "typeExclusionTerms"]) &&
        typeof item.text === "string" &&
        item.text.trim().length > 0 &&
        typeof item.polarity === "string" &&
        (RESTAURANT_CRITERION_POLARITIES as readonly string[]).includes(item.polarity) &&
        typeof item.strength === "string" &&
        (RESTAURANT_CRITERION_STRENGTHS as readonly string[]).includes(item.strength) &&
        (item.typeExclusionTerms === undefined || (
          item.polarity === "NEGATIVE" && item.strength === "HARD" &&
          Array.isArray(item.typeExclusionTerms) && item.typeExclusionTerms.length > 0 &&
          item.typeExclusionTerms.every((term) => typeof term === "string" && term.trim().length > 0)
        )),
    )
  );
}

function isTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function hasOnlyKeys(input: Record<string, unknown>, allowedKeys: readonly string[]): boolean {
  return Object.keys(input).every((key) => allowedKeys.includes(key));
}

export function validateRestaurantIntentDraft(input: unknown): RestaurantIntentValidationResult {
  if (!isRecord(input)) {
    return { valid: false, errors: ["Intent draft must be an object"] };
  }
  const errors: string[] = [];
  if (
    !hasOnlyKeys(input, [
      "schemaVersion",
      "timezone",
      "target",
      "date",
      "timeWindow",
      "partySize",
      "area",
      "criteria",
      "budgetPerPerson",
    ])
  ) {
    errors.push("Intent draft contains unsupported fields");
  }
  if (input.schemaVersion !== "3") {
    errors.push("schemaVersion must be 3");
  }
  if (input.timezone !== "Asia/Tokyo") {
    errors.push("timezone must be Asia/Tokyo");
  }
  if (input.target !== undefined) {
    if (
      !isRecord(input.target) ||
      !hasOnlyKeys(input.target, ["query"]) ||
      typeof input.target.query !== "string" ||
      input.target.query.trim().length === 0
    ) {
      errors.push("target must contain one non-empty query");
    }
  }
  if (input.date !== undefined && !isDate(input.date)) {
    errors.push("date must use YYYY-MM-DD");
  }
  if (input.timeWindow !== undefined) {
    if (
      !isRecord(input.timeWindow) ||
      !hasOnlyKeys(input.timeWindow, ["earliest", "latest"]) ||
      !isTime(input.timeWindow.earliest) ||
      !isTime(input.timeWindow.latest) ||
      input.timeWindow.earliest > input.timeWindow.latest
    ) {
      errors.push("timeWindow must contain ordered HH:mm earliest and latest values");
    }
  }
  if (
    input.partySize !== undefined &&
    (typeof input.partySize !== "number" ||
      !Number.isInteger(input.partySize) ||
      input.partySize <= 0)
  ) {
    errors.push("partySize must be a positive integer");
  }
  if (input.area !== undefined) {
    if (
      !isRecord(input.area) ||
      !hasOnlyKeys(input.area, ["query", "placeId", "radiusMeters", "coordinates"]) ||
      typeof input.area.query !== "string" ||
      input.area.query.trim().length === 0 ||
      (input.area.placeId !== undefined && typeof input.area.placeId !== "string") ||
      (input.area.radiusMeters !== undefined &&
        (typeof input.area.radiusMeters !== "number" ||
          !Number.isInteger(input.area.radiusMeters) ||
          input.area.radiusMeters <= 0)) ||
      (input.area.coordinates !== undefined && (!isRecord(input.area.coordinates) ||
        !hasOnlyKeys(input.area.coordinates, ["latitude", "longitude", "accuracyMeters", "observedAt", "source"]) ||
        typeof input.area.coordinates.latitude !== "number" || !Number.isFinite(input.area.coordinates.latitude) ||
        typeof input.area.coordinates.longitude !== "number" || !Number.isFinite(input.area.coordinates.longitude) ||
        (input.area.coordinates.accuracyMeters !== undefined && (typeof input.area.coordinates.accuracyMeters !== "number" || input.area.coordinates.accuracyMeters < 0)) ||
        typeof input.area.coordinates.observedAt !== "string" || Number.isNaN(Date.parse(input.area.coordinates.observedAt)) ||
        (input.area.coordinates.source !== "DEVICE" && input.area.coordinates.source !== "MANUAL_PLACE")))
    ) {
      errors.push("area must contain a non-empty query and valid optional location fields");
    }
  }
  if (!isCriterionArray(input.criteria)) {
    errors.push("criteria must be a valid criterion array");
  }
  if (input.budgetPerPerson !== undefined) {
    if (
      !isRecord(input.budgetPerPerson) ||
      !hasOnlyKeys(input.budgetPerPerson, ["max", "currency"]) ||
      typeof input.budgetPerPerson.max !== "number" ||
      !Number.isInteger(input.budgetPerPerson.max) ||
      input.budgetPerPerson.max <= 0 ||
      input.budgetPerPerson.currency !== "JPY"
    ) {
      errors.push("budgetPerPerson must contain a positive JPY max");
    }
  }
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return {
    valid: true,
    value: structuredClone(input) as unknown as RestaurantIntentDraft,
  };
}
