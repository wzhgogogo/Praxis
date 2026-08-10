import type { RestaurantIntentDraft } from "../domains/restaurant/contracts.js";
import { validateRestaurantIntentDraft } from "../domains/restaurant/intent-draft.js";

export interface RestaurantIntentEvalCase {
  id: string;
  input: {
    message: string;
    referenceTime: string;
    timezone: "Asia/Tokyo";
  };
  expected: RestaurantIntentDraft;
  tags: string[];
}

export interface RestaurantIntentEvalInput {
  caseId: string;
  message: string;
  referenceTime: string;
  timezone: "Asia/Tokyo";
}

export interface RestaurantIntentParser {
  id: string;
  mode: "FIXTURE" | "REPLAY" | "REAL_MODEL";
  parse(input: RestaurantIntentEvalInput): Promise<unknown>;
}

export type IntentField =
  | "date"
  | "timeWindow"
  | "partySize"
  | "area"
  | "cuisines"
  | "budgetPerPerson"
  | "hardConstraints"
  | "softPreferences"
  | "missingRequiredFields";

export interface RestaurantIntentEvalCaseResult {
  id: string;
  validOutput: boolean;
  exactMatch: boolean;
  matchedFields: IntentField[];
  mismatchedFields: IntentField[];
  validatorErrors: string[];
  missedBlockingFields: string[];
  unnecessaryClarification: boolean;
}

export interface RestaurantIntentEvalReport {
  evaluatorVersion: "1";
  parser: { id: string; mode: RestaurantIntentParser["mode"] };
  totalCases: number;
  validOutputRate: number;
  exactMatchRate: number;
  fieldAccuracy: Record<IntentField, number>;
  blockingFieldMissRate: number;
  unnecessaryClarificationRate: number;
  p0Errors: number;
  cases: RestaurantIntentEvalCaseResult[];
}

const INTENT_FIELDS: IntentField[] = [
  "date",
  "timeWindow",
  "partySize",
  "area",
  "cuisines",
  "budgetPerPerson",
  "hardConstraints",
  "softPreferences",
  "missingRequiredFields",
];

function normalizedString(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function normalizedStringSet(values: string[]): string[] {
  return values.map(normalizedString).sort();
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function fieldsMatch(
  expected: RestaurantIntentDraft,
  actual: RestaurantIntentDraft,
): Record<IntentField, boolean> {
  return {
    date: expected.date === actual.date,
    timeWindow: sameJson(expected.timeWindow, actual.timeWindow),
    partySize: expected.partySize === actual.partySize,
    area:
      expected.area?.query === undefined && actual.area?.query === undefined
        ? true
        : expected.area !== undefined &&
            actual.area !== undefined &&
            normalizedString(expected.area.query) === normalizedString(actual.area.query) &&
            expected.area.placeId === actual.area.placeId &&
            expected.area.radiusMeters === actual.area.radiusMeters,
    cuisines: sameJson(
      normalizedStringSet(expected.cuisines),
      normalizedStringSet(actual.cuisines),
    ),
    budgetPerPerson: sameJson(expected.budgetPerPerson, actual.budgetPerPerson),
    hardConstraints: sameJson(
      normalizedStringSet(expected.hardConstraints),
      normalizedStringSet(actual.hardConstraints),
    ),
    softPreferences: sameJson(
      normalizedStringSet(expected.softPreferences),
      normalizedStringSet(actual.softPreferences),
    ),
    missingRequiredFields: sameJson(
      [...expected.missingRequiredFields].sort(),
      [...actual.missingRequiredFields].sort(),
    ),
  };
}

function rate(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Number((numerator / denominator).toFixed(4));
}

export async function evaluateRestaurantIntentParser(
  parser: RestaurantIntentParser,
  cases: readonly RestaurantIntentEvalCase[],
): Promise<RestaurantIntentEvalReport> {
  const results: RestaurantIntentEvalCaseResult[] = [];
  const matchedByField = Object.fromEntries(INTENT_FIELDS.map((field) => [field, 0])) as Record<
    IntentField,
    number
  >;

  for (const item of cases) {
    const validation = validateRestaurantIntentDraft(
      await parser.parse({ caseId: item.id, ...item.input }),
    );
    if (!validation.valid) {
      results.push({
        id: item.id,
        validOutput: false,
        exactMatch: false,
        matchedFields: [],
        mismatchedFields: [...INTENT_FIELDS],
        validatorErrors: validation.errors,
        missedBlockingFields: item.expected.missingRequiredFields,
        unnecessaryClarification: false,
      });
      continue;
    }
    const match = fieldsMatch(item.expected, validation.value);
    const matchedFields = INTENT_FIELDS.filter((field) => match[field]);
    const mismatchedFields = INTENT_FIELDS.filter((field) => !match[field]);
    for (const field of matchedFields) {
      matchedByField[field] += 1;
    }
    const missedBlockingFields = item.expected.missingRequiredFields.filter(
      (field) => !validation.value.missingRequiredFields.includes(field),
    );
    results.push({
      id: item.id,
      validOutput: true,
      exactMatch: mismatchedFields.length === 0,
      matchedFields,
      mismatchedFields,
      validatorErrors: [],
      missedBlockingFields,
      unnecessaryClarification:
        item.expected.missingRequiredFields.length === 0 &&
        validation.value.missingRequiredFields.length > 0,
    });
  }

  const valid = results.filter((item) => item.validOutput).length;
  const exact = results.filter((item) => item.exactMatch).length;
  const missedBlocking = results.flatMap((item) => item.missedBlockingFields).length;
  const expectedBlocking = cases.reduce(
    (count, item) => count + item.expected.missingRequiredFields.length,
    0,
  );
  const unnecessaryClarification = results.filter(
    (item) => item.unnecessaryClarification,
  ).length;
  const p0Errors = results.filter(
    (item) => !item.validOutput || item.missedBlockingFields.length > 0,
  ).length;

  return {
    evaluatorVersion: "1",
    parser: { id: parser.id, mode: parser.mode },
    totalCases: cases.length,
    validOutputRate: rate(valid, cases.length),
    exactMatchRate: rate(exact, cases.length),
    fieldAccuracy: Object.fromEntries(
      INTENT_FIELDS.map((field) => [field, rate(matchedByField[field], cases.length)]),
    ) as Record<IntentField, number>,
    blockingFieldMissRate: rate(missedBlocking, expectedBlocking),
    unnecessaryClarificationRate: rate(unnecessaryClarification, cases.length),
    p0Errors,
    cases: results,
  };
}
