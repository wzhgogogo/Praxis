export const RESTAURANT_SEMANTIC_PROPOSAL_PURPOSE = "restaurant_semantic_interpret";
export const RESTAURANT_SEMANTIC_PROPOSAL_PROMPT_VERSION = "v2";
export const RESTAURANT_SEMANTIC_PROPOSAL_SCHEMA = {
  name: "restaurant-semantic-proposal",
  version: "1",
} as const;

export const RESTAURANT_SEMANTIC_FIELDS = [
  "TARGET",
  "DATE",
  "TIME_WINDOW",
  "PARTY_SIZE",
  "AREA",
  "CUISINE",
  "BUDGET_PER_PERSON",
  "HARD_CONSTRAINT",
  "SOFT_PREFERENCE",
] as const;

export type RestaurantSemanticField = (typeof RESTAURANT_SEMANTIC_FIELDS)[number];

export const RESTAURANT_SEMANTIC_OPERATIONS = [
  "ASSERT",
  "CORRECT",
  "NEGATE",
  "CONFIRM",
] as const;

export type RestaurantSemanticOperation = (typeof RESTAURANT_SEMANTIC_OPERATIONS)[number];

export type RestaurantSemanticValue =
  | { kind: "TARGET"; query: string }
  | { kind: "DATE"; value: string }
  | { kind: "TIME_WINDOW"; earliest: string; latest: string }
  | { kind: "PARTY_SIZE"; value: number }
  | { kind: "AREA"; query: string }
  | { kind: "CUISINE"; value: string }
  | { kind: "BUDGET_PER_PERSON"; max: number; currency: "JPY" }
  | { kind: "HARD_CONSTRAINT"; value: string }
  | { kind: "SOFT_PREFERENCE"; value: string };

export interface RestaurantSemanticFact {
  field: RestaurantSemanticField;
  operation: RestaurantSemanticOperation;
  value?: RestaurantSemanticValue;
}

/**
 * Untrusted language-level proposal. It is deliberately not a StatePatch, Runtime
 * Event, readiness assessment, command, action proposal, or a record of real-world facts.
 */
export interface RestaurantSemanticProposal {
  schemaVersion: "1";
  facts: RestaurantSemanticFact[];
}

export type RestaurantSemanticProposalValidationResult =
  | { valid: true; value: RestaurantSemanticProposal }
  | { valid: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isNonBlankString(value: unknown): value is string {
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

function isSemanticField(value: unknown): value is RestaurantSemanticField {
  return (
    typeof value === "string" &&
    (RESTAURANT_SEMANTIC_FIELDS as readonly string[]).includes(value)
  );
}

function isSemanticOperation(value: unknown): value is RestaurantSemanticOperation {
  return (
    typeof value === "string" &&
    (RESTAURANT_SEMANTIC_OPERATIONS as readonly string[]).includes(value)
  );
}

function isCollectionField(field: RestaurantSemanticField): boolean {
  return field === "CUISINE" || field === "HARD_CONSTRAINT" || field === "SOFT_PREFERENCE";
}

function strictObject(
  properties: Record<string, unknown>,
  required: readonly string[] = Object.keys(properties),
): Record<string, unknown> {
  return { type: "object", properties, required, additionalProperties: false };
}

function valueSchema(field: RestaurantSemanticField): Record<string, unknown> {
  const kind = { type: "string", enum: [field] };
  switch (field) {
    case "TARGET":
    case "AREA":
      return strictObject({ kind, query: { type: "string", minLength: 1 } });
    case "DATE":
      return strictObject({
        kind,
        value: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      });
    case "TIME_WINDOW":
      return strictObject({
        kind,
        earliest: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" },
        latest: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" },
      });
    case "PARTY_SIZE":
      return strictObject({ kind, value: { type: "integer", minimum: 1 } });
    case "CUISINE":
    case "HARD_CONSTRAINT":
    case "SOFT_PREFERENCE":
      return strictObject({ kind, value: { type: "string", minLength: 1 } });
    case "BUDGET_PER_PERSON":
      return strictObject({
        kind,
        max: { type: "integer", minimum: 1 },
        currency: { type: "string", enum: ["JPY"] },
      });
  }
}

function factSchema(
  field: RestaurantSemanticField,
  operations: readonly RestaurantSemanticOperation[],
  withValue: boolean,
): Record<string, unknown> {
  return strictObject({
    field: { type: "string", enum: [field] },
    operation: { type: "string", enum: operations },
    ...(withValue ? { value: valueSchema(field) } : {}),
  });
}

const SINGLETON_FIELDS = [
  "TARGET",
  "DATE",
  "TIME_WINDOW",
  "PARTY_SIZE",
  "AREA",
  "BUDGET_PER_PERSON",
] as const satisfies readonly RestaurantSemanticField[];

const COLLECTION_FIELDS = [
  "CUISINE",
  "HARD_CONSTRAINT",
  "SOFT_PREFERENCE",
] as const satisfies readonly RestaurantSemanticField[];

/** Complete provider-transport schema; the runtime validator below remains authoritative. */
export const RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA: Readonly<Record<string, unknown>> =
  strictObject({
    schemaVersion: { type: "string", enum: ["1"] },
    facts: {
      type: "array",
      items: {
        anyOf: [
          ...SINGLETON_FIELDS.flatMap((field) => [
            factSchema(field, ["ASSERT", "CORRECT"], true),
            factSchema(field, ["NEGATE", "CONFIRM"], false),
          ]),
          ...COLLECTION_FIELDS.map((field) =>
            factSchema(field, ["ASSERT", "CORRECT", "NEGATE"], true),
          ),
        ],
      },
    },
  });

function valueMatchesField(field: RestaurantSemanticField, value: unknown): boolean {
  if (!isRecord(value) || typeof value.kind !== "string" || value.kind !== field) return false;
  switch (field) {
    case "TARGET":
    case "AREA":
      return hasOnlyKeys(value, ["kind", "query"]) && isNonBlankString(value.query);
    case "DATE":
      return hasOnlyKeys(value, ["kind", "value"]) && isDate(value.value);
    case "TIME_WINDOW":
      return (
        hasOnlyKeys(value, ["kind", "earliest", "latest"]) &&
        isTime(value.earliest) &&
        isTime(value.latest) &&
        value.earliest <= value.latest
      );
    case "PARTY_SIZE":
      return (
        hasOnlyKeys(value, ["kind", "value"]) &&
        typeof value.value === "number" &&
        Number.isInteger(value.value) &&
        value.value > 0
      );
    case "CUISINE":
    case "HARD_CONSTRAINT":
    case "SOFT_PREFERENCE":
      return hasOnlyKeys(value, ["kind", "value"]) && isNonBlankString(value.value);
    case "BUDGET_PER_PERSON":
      return (
        hasOnlyKeys(value, ["kind", "max", "currency"]) &&
        typeof value.max === "number" &&
        Number.isInteger(value.max) &&
        value.max > 0 &&
        value.currency === "JPY"
      );
  }
}

function validateFact(input: unknown, index: number): string[] {
  const prefix = `facts[${index}]`;
  if (!isRecord(input)) return [`${prefix} must be an object`];
  const errors: string[] = [];
  if (!hasOnlyKeys(input, ["field", "operation", "value"])) {
    errors.push(`${prefix} contains unsupported fields`);
  }
  if (!isSemanticField(input.field)) errors.push(`${prefix}.field is unsupported`);
  if (!isSemanticOperation(input.operation)) errors.push(`${prefix}.operation is unsupported`);
  if (!isSemanticField(input.field) || !isSemanticOperation(input.operation)) return errors;

  if (input.operation === "CONFIRM") {
    if (isCollectionField(input.field)) {
      errors.push(`${prefix}.operation CONFIRM is unsupported for collection fields`);
    }
    if (input.value !== undefined) errors.push(`${prefix}.value is not allowed for CONFIRM`);
    return errors;
  }

  if (input.operation === "NEGATE" && !isCollectionField(input.field)) {
    if (input.value !== undefined) errors.push(`${prefix}.value is not allowed when negating a singleton`);
    return errors;
  }

  if (!valueMatchesField(input.field, input.value)) {
    errors.push(`${prefix}.value must match ${input.field}`);
  }
  return errors;
}

export function validateRestaurantSemanticProposal(
  input: unknown,
): RestaurantSemanticProposalValidationResult {
  if (!isRecord(input)) return { valid: false, errors: ["Semantic proposal must be an object"] };
  const errors: string[] = [];
  if (!hasOnlyKeys(input, ["schemaVersion", "facts"])) {
    errors.push("Semantic proposal contains unsupported fields");
  }
  if (input.schemaVersion !== "1") errors.push("schemaVersion must be 1");
  if (!Array.isArray(input.facts)) {
    errors.push("facts must be an array");
  } else {
    input.facts.forEach((fact, index) => errors.push(...validateFact(fact, index)));
  }
  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, value: structuredClone(input) as unknown as RestaurantSemanticProposal };
}
