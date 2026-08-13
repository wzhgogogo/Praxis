import {
  DECISION_DAYPARTS,
  DECISION_FORMALITY_VALUES,
  DECISION_LOCATION_KINDS,
  DECISION_MENU_FORMAT_VALUES,
  DECISION_OCCASIONS,
  DECISION_PREFERENCE_POLARITIES,
  DECISION_TARGET_KINDS,
  DECISION_TIME_PRECISIONS,
  DECISION_VIBE_VALUES,
  type DecisionHardConstraint,
  type DecisionPreference,
  type DecisionState,
  type DecisionStatePatch,
} from "./restaurant-decision-eval-contract.js";

export const RESTAURANT_DECISION_PATCH_CONTRACT_VERSION = "4" as const;

export const RESTAURANT_DECISION_PATCH_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `urn:praxis:restaurant-decision-state-patch:${RESTAURANT_DECISION_PATCH_CONTRACT_VERSION}`,
  title: "RestaurantDecisionStatePatch",
  type: "object",
  additionalProperties: false,
  properties: {
    set: { $ref: "#/$defs/setBlock" },
    add: { $ref: "#/$defs/deltaBlock" },
    remove: { $ref: "#/$defs/deltaBlock" },
  },
  $defs: {
    time: {
      type: "object",
      additionalProperties: false,
      properties: {
        date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        precision: { type: "string", enum: DECISION_TIME_PRECISIONS },
        daypart: { type: "string", enum: DECISION_DAYPARTS },
        preferred: { type: "string", pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d$" },
        earliest: { type: "string", pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d$" },
        latest: { type: "string", pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d$" },
      },
      required: ["precision"],
    },
    party: {
      type: "object",
      additionalProperties: false,
      properties: {
        min: { type: "integer", minimum: 1 },
        max: { type: "integer", minimum: 1 },
        precision: { type: "string", enum: ["EXACT", "RANGE"] },
      },
      required: ["min", "max", "precision"],
    },
    location: {
      type: "object",
      additionalProperties: false,
      properties: {
        kind: { type: "string", enum: DECISION_LOCATION_KINDS },
        query: { type: "string" },
        anchorQuery: { type: "string" },
        scope: { type: "string" },
      },
      required: ["kind"],
    },
    target: {
      type: "object",
      additionalProperties: false,
      properties: {
        kind: { type: "string", enum: DECISION_TARGET_KINDS },
        query: { type: "string" },
        outletQuery: { type: "string" },
      },
      required: ["kind"],
    },
    preference: {
      oneOf: [
        {
          type: "object",
          additionalProperties: false,
          properties: {
            facet: { const: "CUISINE" },
            value: { type: "string" },
            polarity: { type: "string", enum: DECISION_PREFERENCE_POLARITIES },
          },
          required: ["facet", "value", "polarity"],
        },
        ...([
          ["VIBE", DECISION_VIBE_VALUES],
          ["MENU_FORMAT", DECISION_MENU_FORMAT_VALUES],
          ["FORMALITY", DECISION_FORMALITY_VALUES],
        ] as const).map(([facet, values]) => ({
          type: "object",
          additionalProperties: false,
          properties: {
            facet: { const: facet },
            value: { type: "string", enum: values },
            polarity: { type: "string", enum: DECISION_PREFERENCE_POLARITIES },
          },
          required: ["facet", "value", "polarity"],
        })),
      ],
    },
    hardConstraint: {
      oneOf: [
        {
          type: "object",
          additionalProperties: false,
          properties: {
            kind: { const: "SMOKING_POLICY" },
            value: { const: "FULLY_NON_SMOKING" },
          },
          required: ["kind", "value"],
        },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            kind: { const: "ALLERGY" },
            allergen: { type: "string" },
            severity: { const: "SEVERE" },
          },
          required: ["kind", "allergen", "severity"],
        },
      ],
    },
    setBlock: {
      type: "object",
      additionalProperties: false,
      minProperties: 1,
      properties: {
        occasion: { anyOf: [{ type: "string", enum: DECISION_OCCASIONS }, { type: "null" }] },
        time: { anyOf: [{ $ref: "#/$defs/time" }, { type: "null" }] },
        party: { anyOf: [{ $ref: "#/$defs/party" }, { type: "null" }] },
        location: { anyOf: [{ $ref: "#/$defs/location" }, { type: "null" }] },
        target: { $ref: "#/$defs/target" },
      },
    },
    deltaBlock: {
      type: "object",
      additionalProperties: false,
      minProperties: 1,
      properties: {
        preferences: {
          type: "array",
          minItems: 1,
          items: { $ref: "#/$defs/preference" },
        },
        hardConstraints: {
          type: "array",
          minItems: 1,
          items: { $ref: "#/$defs/hardConstraint" },
        },
      },
    },
  },
} as const;

export interface DecisionContractIssue {
  path: string;
  message: string;
  rule?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function nonBlank(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function issue(
  issues: DecisionContractIssue[],
  path: string,
  message: string,
  rule?: string,
): void {
  issues.push({ path, message, ...(rule === undefined ? {} : { rule }) });
}

function validateTime(value: unknown, path: string, issues: DecisionContractIssue[]): void {
  if (!isRecord(value) || !hasOnlyKeys(value, ["date", "precision", "daypart", "preferred", "earliest", "latest"])) {
    issue(issues, path, "must contain only supported time fields", "SUPPORTED_FIELDS");
    return;
  }
  if (!oneOf(value.precision, DECISION_TIME_PRECISIONS)) {
    issue(issues, `${path}.precision`, "must be supported", "TIME_PRECISION");
    return;
  }
  if (value.date !== undefined && !isDate(value.date)) issue(issues, `${path}.date`, "must be YYYY-MM-DD", "CALENDAR_DATE");
  if (value.daypart !== undefined && !oneOf(value.daypart, DECISION_DAYPARTS)) {
    issue(issues, `${path}.daypart`, "must be supported", "DAYPART");
  }
  for (const field of ["preferred", "earliest", "latest"] as const) {
    if (value[field] !== undefined && !isTime(value[field])) issue(issues, `${path}.${field}`, "must be HH:mm", "CLOCK_TIME");
  }
  if (value.precision === "UNKNOWN") {
    if (["date", "daypart", "preferred", "earliest", "latest"].some((field) => value[field] !== undefined)) {
      issue(issues, path, "UNKNOWN precision cannot include time facts", "UNKNOWN_TIME");
    }
  } else if (value.precision !== "DAYPART" && !isDate(value.date)) {
    issue(issues, `${path}.date`, "is required for this precision", "PRECISION_REQUIRES_DATE");
  }
  if (value.precision === "DAYPART" && !oneOf(value.daypart, DECISION_DAYPARTS)) {
    issue(issues, `${path}.daypart`, "is required for DAYPART", "DAYPART_REQUIRED");
  }
  if (value.precision === "APPROXIMATE") {
    if (!isTime(value.preferred)) issue(issues, `${path}.preferred`, "is required for APPROXIMATE", "APPROXIMATE_TIME_REQUIRED");
    if (value.earliest !== undefined || value.latest !== undefined) {
      issue(issues, path, "APPROXIMATE cannot invent a window", "APPROXIMATE_NOT_BOUNDED");
    }
  } else if (value.preferred !== undefined) {
    issue(issues, `${path}.preferred`, "is only valid for APPROXIMATE", "PREFERRED_TIME_PRECISION");
  }
  if (value.precision === "WINDOW" || value.precision === "EXACT") {
    if (!isTime(value.earliest) || !isTime(value.latest)) {
      issue(issues, path, `${value.precision} requires earliest and latest`, "TIME_WINDOW_REQUIRED");
    } else if (value.earliest > value.latest) {
      issue(issues, `${path}.earliest`, "must not be later than latest", "ORDERED_TIME");
    } else if (value.precision === "EXACT" && value.earliest !== value.latest) {
      issue(issues, path, "EXACT requires equal earliest and latest", "EXACT_TIME");
    }
  }
}

function validateParty(value: unknown, path: string, issues: DecisionContractIssue[]): void {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["min", "max", "precision"]) ||
    !Number.isInteger(value.min) ||
    !Number.isInteger(value.max) ||
    typeof value.min !== "number" ||
    typeof value.max !== "number" ||
    value.min < 1 ||
    value.max < value.min ||
    (value.precision !== "EXACT" && value.precision !== "RANGE")
  ) {
    issue(issues, path, "must be a valid party");
    return;
  }
  if (value.precision === "EXACT" && value.min !== value.max) issue(issues, path, "EXACT requires equal min/max");
  if (value.precision === "RANGE" && value.min === value.max) issue(issues, path, "RANGE requires different min/max");
}

function validateLocation(value: unknown, path: string, issues: DecisionContractIssue[]): void {
  if (!isRecord(value) || !oneOf(value.kind, DECISION_LOCATION_KINDS)) {
    issue(issues, path, "must contain a supported location kind");
    return;
  }
  const allowed = value.kind === "FLEXIBLE"
    ? ["kind", "anchorQuery", "scope"]
    : value.kind === "UNKNOWN"
      ? ["kind"]
      : ["kind", "query"];
  if (!hasOnlyKeys(value, allowed)) issue(issues, path, "contains unsupported location fields");
  if (["AREA", "NEAR_PLACE", "ADDRESS_OR_STREET"].includes(value.kind) && !nonBlank(value.query)) {
    issue(issues, `${path}.query`, "is required");
  }
  if (value.anchorQuery !== undefined && !nonBlank(value.anchorQuery)) issue(issues, `${path}.anchorQuery`, "must be non-empty");
  if (value.scope !== undefined && !nonBlank(value.scope)) issue(issues, `${path}.scope`, "must be non-empty");
}

function validateTarget(value: unknown, path: string, issues: DecisionContractIssue[]): void {
  if (!isRecord(value) || !oneOf(value.kind, DECISION_TARGET_KINDS)) {
    issue(issues, path, "must contain a supported target kind");
    return;
  }
  const allowed = value.kind === "OPEN"
    ? ["kind"]
    : value.kind === "RESTAURANT"
      ? ["kind", "query", "outletQuery"]
      : ["kind", "query"];
  if (!hasOnlyKeys(value, allowed)) issue(issues, path, "contains unsupported target fields");
  if (value.kind !== "OPEN" && !nonBlank(value.query)) issue(issues, `${path}.query`, "is required");
  if (value.outletQuery !== undefined && !nonBlank(value.outletQuery)) issue(issues, `${path}.outletQuery`, "must be non-empty");
}

export function decisionPreferenceKey(value: DecisionPreference): string {
  const normalizedValue = value.facet === "CUISINE"
    ? value.value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US")
    : value.value;
  return `${value.facet}:${normalizedValue}:${value.polarity}`;
}

export function decisionHardConstraintKey(value: DecisionHardConstraint): string {
  return value.kind === "SMOKING_POLICY"
    ? `${value.kind}:${value.value}`
    : `${value.kind}:${value.allergen.trim().toLocaleUpperCase("en-US")}:${value.severity}`;
}

function validatePreference(value: unknown, path: string, issues: DecisionContractIssue[]): value is DecisionPreference {
  const issueCount = issues.length;
  if (!isRecord(value) || !hasOnlyKeys(value, ["facet", "value", "polarity"])) {
    issue(issues, path, "must contain only facet, value and polarity");
    return false;
  }
  if (!oneOf(value.polarity, DECISION_PREFERENCE_POLARITIES)) {
    issue(issues, `${path}.polarity`, "must be PREFER or AVOID");
  }
  switch (value.facet) {
    case "CUISINE":
      if (!nonBlank(value.value)) issue(issues, `${path}.value`, "must be a non-empty cuisine");
      break;
    case "VIBE":
      if (!oneOf(value.value, DECISION_VIBE_VALUES)) issue(issues, `${path}.value`, "must be a supported VIBE");
      break;
    case "MENU_FORMAT":
      if (!oneOf(value.value, DECISION_MENU_FORMAT_VALUES)) issue(issues, `${path}.value`, "must be a supported MENU_FORMAT");
      break;
    case "FORMALITY":
      if (!oneOf(value.value, DECISION_FORMALITY_VALUES)) issue(issues, `${path}.value`, "must be a supported FORMALITY");
      break;
    default:
      issue(issues, `${path}.facet`, "must be a supported preference facet");
  }
  return issues.length === issueCount;
}

function validateHardConstraint(
  value: unknown,
  path: string,
  issues: DecisionContractIssue[],
): value is DecisionHardConstraint {
  const issueCount = issues.length;
  if (!isRecord(value) || typeof value.kind !== "string") {
    issue(issues, path, "must be a hard constraint object");
    return false;
  }
  if (value.kind === "SMOKING_POLICY") {
    if (!hasOnlyKeys(value, ["kind", "value"]) || value.value !== "FULLY_NON_SMOKING") {
      issue(issues, path, "SMOKING_POLICY must be FULLY_NON_SMOKING");
    }
  } else if (value.kind === "ALLERGY") {
    if (!hasOnlyKeys(value, ["kind", "allergen", "severity"])) issue(issues, path, "ALLERGY contains unsupported fields");
    if (!nonBlank(value.allergen)) issue(issues, `${path}.allergen`, "must be non-empty");
    if (value.severity !== "SEVERE") issue(issues, `${path}.severity`, "must be SEVERE");
  } else {
    issue(issues, `${path}.kind`, "must be SMOKING_POLICY or ALLERGY");
  }
  return issues.length === issueCount;
}

function validateUniqueArray<T>(
  value: unknown,
  path: string,
  issues: DecisionContractIssue[],
  validateItem: (item: unknown, itemPath: string, issues: DecisionContractIssue[]) => item is T,
  keyFor: (item: T) => string,
  allowEmpty: boolean,
): value is T[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    issue(issues, path, allowEmpty ? "must be an array" : "must be a non-empty array");
    return false;
  }
  const valid: T[] = [];
  value.forEach((item, index) => {
    if (validateItem(item, `${path}[${index}]`, issues)) valid.push(item);
  });
  if (valid.length === value.length && new Set(valid.map(keyFor)).size !== valid.length) {
    issue(issues, path, "must not contain duplicate semantic values");
  }
  return valid.length === value.length;
}

function validateSetBlock(value: unknown, path: string, issues: DecisionContractIssue[]): void {
  if (!isRecord(value) || !hasOnlyKeys(value, ["occasion", "time", "party", "location", "target"])) {
    issue(issues, path, "contains unsupported state fields");
    return;
  }
  if (Object.keys(value).length === 0) issue(issues, path, "must not be empty");
  if (value.occasion !== undefined && value.occasion !== null && !oneOf(value.occasion, DECISION_OCCASIONS)) {
    issue(issues, `${path}.occasion`, "must be supported or null");
  }
  if (value.time !== undefined && value.time !== null) validateTime(value.time, `${path}.time`, issues);
  if (value.party !== undefined && value.party !== null) validateParty(value.party, `${path}.party`, issues);
  if (value.location !== undefined && value.location !== null) validateLocation(value.location, `${path}.location`, issues);
  if (value.target !== undefined) validateTarget(value.target, `${path}.target`, issues);
}

function validateDeltaBlock(value: unknown, path: string, issues: DecisionContractIssue[]): void {
  if (!isRecord(value) || !hasOnlyKeys(value, ["preferences", "hardConstraints"])) {
    issue(issues, path, "contains unsupported delta fields");
    return;
  }
  if (Object.keys(value).length === 0) issue(issues, path, "must not be empty");
  if (value.preferences !== undefined) {
    validateUniqueArray(value.preferences, `${path}.preferences`, issues, validatePreference, decisionPreferenceKey, false);
  }
  if (value.hardConstraints !== undefined) {
    validateUniqueArray(value.hardConstraints, `${path}.hardConstraints`, issues, validateHardConstraint, decisionHardConstraintKey, false);
  }
}

export function validateDecisionStatePatchContract(value: unknown):
  | { valid: true; value: DecisionStatePatch }
  | { valid: false; issues: DecisionContractIssue[] } {
  const issues: DecisionContractIssue[] = [];
  if (!isRecord(value) || !hasOnlyKeys(value, ["set", "add", "remove"])) {
    return { valid: false, issues: [{ path: "statePatch", message: "must contain only set, add and remove" }] };
  }
  if (value.set !== undefined) validateSetBlock(value.set, "statePatch.set", issues);
  if (value.add !== undefined) validateDeltaBlock(value.add, "statePatch.add", issues);
  if (value.remove !== undefined) validateDeltaBlock(value.remove, "statePatch.remove", issues);
  if (isRecord(value.add) && isRecord(value.remove)) {
    const additions = [
      ...(Array.isArray(value.add.preferences) ? value.add.preferences.filter((item): item is DecisionPreference => validatePreference(item, "statePatch.add.preferences", [])) : []).map(decisionPreferenceKey),
      ...(Array.isArray(value.add.hardConstraints) ? value.add.hardConstraints.filter((item): item is DecisionHardConstraint => validateHardConstraint(item, "statePatch.add.hardConstraints", [])) : []).map(decisionHardConstraintKey),
    ];
    const removals = new Set([
      ...(Array.isArray(value.remove.preferences) ? value.remove.preferences.filter((item): item is DecisionPreference => validatePreference(item, "statePatch.remove.preferences", [])) : []).map(decisionPreferenceKey),
      ...(Array.isArray(value.remove.hardConstraints) ? value.remove.hardConstraints.filter((item): item is DecisionHardConstraint => validateHardConstraint(item, "statePatch.remove.hardConstraints", [])) : []).map(decisionHardConstraintKey),
    ]);
    if (additions.some((item) => removals.has(item))) {
      issue(issues, "statePatch", "cannot add and remove the same semantic value");
    }
  }
  return issues.length === 0
    ? { valid: true, value: value as DecisionStatePatch }
    : { valid: false, issues };
}

export function validateDecisionStateContract(value: unknown, path = "state"): DecisionContractIssue[] {
  const issues: DecisionContractIssue[] = [];
  if (!isRecord(value) || !hasOnlyKeys(value, ["occasion", "time", "party", "location", "target", "preferences", "hardConstraints"])) {
    return [{ path, message: "contains unsupported Decision State fields" }];
  }
  if (value.occasion !== undefined && !oneOf(value.occasion, DECISION_OCCASIONS)) issue(issues, `${path}.occasion`, "must be supported");
  if (value.time !== undefined) validateTime(value.time, `${path}.time`, issues);
  if (value.party !== undefined) validateParty(value.party, `${path}.party`, issues);
  if (value.location !== undefined) validateLocation(value.location, `${path}.location`, issues);
  validateTarget(value.target, `${path}.target`, issues);
  validateUniqueArray(value.preferences, `${path}.preferences`, issues, validatePreference, decisionPreferenceKey, true);
  validateUniqueArray(value.hardConstraints, `${path}.hardConstraints`, issues, validateHardConstraint, decisionHardConstraintKey, true);
  return issues;
}
