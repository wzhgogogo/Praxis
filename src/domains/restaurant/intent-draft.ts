import {
  RESTAURANT_BLOCKING_FIELDS,
  type RestaurantBlockingField,
  type RestaurantIntentDraft,
} from "./contracts.js";

export type RestaurantIntentValidationResult =
  | { valid: true; value: RestaurantIntentDraft }
  | { valid: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isBlockingField(value: unknown): value is RestaurantBlockingField {
  return (
    typeof value === "string" &&
    (RESTAURANT_BLOCKING_FIELDS as readonly string[]).includes(value)
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
      "date",
      "timeWindow",
      "partySize",
      "area",
      "cuisines",
      "budgetPerPerson",
      "hardConstraints",
      "softPreferences",
      "missingRequiredFields",
    ])
  ) {
    errors.push("Intent draft contains unsupported fields");
  }
  if (input.schemaVersion !== "1") {
    errors.push("schemaVersion must be 1");
  }
  if (input.timezone !== "Asia/Tokyo") {
    errors.push("timezone must be Asia/Tokyo");
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
      !hasOnlyKeys(input.area, ["query", "placeId", "radiusMeters"]) ||
      typeof input.area.query !== "string" ||
      input.area.query.trim().length === 0 ||
      (input.area.placeId !== undefined && typeof input.area.placeId !== "string") ||
      (input.area.radiusMeters !== undefined &&
        (typeof input.area.radiusMeters !== "number" ||
          !Number.isInteger(input.area.radiusMeters) ||
          input.area.radiusMeters <= 0))
    ) {
      errors.push("area must contain a non-empty query and valid optional location fields");
    }
  }
  if (!isStringArray(input.cuisines)) {
    errors.push("cuisines must be a string array");
  }
  if (!isStringArray(input.hardConstraints)) {
    errors.push("hardConstraints must be a string array");
  }
  if (!isStringArray(input.softPreferences)) {
    errors.push("softPreferences must be a string array");
  }
  if (
    !Array.isArray(input.missingRequiredFields) ||
    !input.missingRequiredFields.every(isBlockingField)
  ) {
    errors.push("missingRequiredFields contains an unsupported field");
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
  if (Array.isArray(input.missingRequiredFields) && input.missingRequiredFields.every(isBlockingField)) {
    for (const field of RESTAURANT_BLOCKING_FIELDS) {
      const valueIsPresent = input[field] !== undefined;
      const markedMissing = input.missingRequiredFields.includes(field);
      if (valueIsPresent && markedMissing) {
        errors.push(`missingRequiredFields must not include populated ${field}`);
      }
      if (!valueIsPresent && !markedMissing) {
        errors.push(`missingRequiredFields must include absent ${field}`);
      }
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
