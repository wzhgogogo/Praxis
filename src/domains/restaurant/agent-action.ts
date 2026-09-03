export const RESTAURANT_AGENT_ACTION_SCHEMA = {
  name: "restaurant_agent_action",
  version: "3",
} as const;

export type RestaurantAgentAction =
  | { type: "ASK_USER"; question: string; relatedFields?: string[] }
  | { type: "SEARCH_RESTAURANTS"; retrievalHint?: string }
  | { type: "CHECK_AVAILABILITY"; candidateIds: string[] }
  | { type: "PRESENT_RESULTS"; candidateIds: string[] }
  | { type: "SELECT_CANDIDATE"; candidateId: string; offerId?: string }
  | { type: "BOOK_RESERVATION"; candidateId: string; offerId: string };

export const RESTAURANT_AGENT_ACTION_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["type"],
  properties: {
    type: {
      type: "string",
      enum: [
        "ASK_USER",
        "SEARCH_RESTAURANTS",
        "CHECK_AVAILABILITY",
        "PRESENT_RESULTS",
        "SELECT_CANDIDATE",
        "BOOK_RESERVATION",
      ],
    },
    question: { type: "string" },
    relatedFields: { type: "array", items: { type: "string" } },
    retrievalHint: { type: "string" },
    candidateIds: { type: "array", items: { type: "string" } },
    candidateId: { type: "string" },
    offerId: { type: "string" },
    decisionSummary: { type: "string" },
  },
};

/**
 * DeepSeek strict Function Calling requires every property of every object to
 * be required. This wire schema is provider-facing only: blank strings and
 * empty arrays represent canonical optional fields and are normalized locally
 * before the authoritative @3 action parser runs.
 */
export const RESTAURANT_AGENT_ACTION_STRICT_WIRE_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["type", "question", "relatedFields", "retrievalHint", "candidateIds", "candidateId", "offerId", "decisionSummary"],
  properties: {
    type: {
      type: "string",
      enum: ["ASK_USER", "SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS", "SELECT_CANDIDATE", "BOOK_RESERVATION"],
    },
    question: { type: "string" },
    relatedFields: { type: "array", items: { type: "string" } },
    retrievalHint: { type: "string" },
    candidateIds: { type: "array", items: { type: "string" } },
    candidateId: { type: "string" },
    offerId: { type: "string" },
    decisionSummary: { type: "string" },
  },
};

export interface ValidatedRestaurantAgentAction {
  action: RestaurantAgentAction;
  decisionSummary?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonBlank(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function stringList(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every((item) => nonBlank(item))) return null;
  return value.map((item) => item.trim());
}

function emptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length === 0;
}

function emptyList(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}

function onlyExpectedStrictPlaceholders(value: Record<string, unknown>, allowed: ReadonlySet<string>): boolean {
  return Object.entries(value).every(([key, item]) =>
    key === "type" || key === "decisionSummary" || allowed.has(key) || emptyString(item) || emptyList(item),
  );
}

/** Converts the strict all-fields wire value into the canonical @3 action shape. */
export function normalizeRestaurantAgentActionStrictWire(value: unknown):
  | { valid: true; value: unknown }
  | { valid: false; errors: string[] } {
  if (!isRecord(value)) return { valid: false, errors: ["Strict action output must be an object"] };
  const expected = ["type", "question", "relatedFields", "retrievalHint", "candidateIds", "candidateId", "offerId", "decisionSummary"];
  if (expected.some((key) => !(key in value)) || Object.keys(value).some((key) => !expected.includes(key))) {
    return { valid: false, errors: ["Strict action output must contain exactly the provider wire fields"] };
  }
  const decisionSummary = nonBlank(value.decisionSummary) ? value.decisionSummary.trim() : undefined;
  switch (value.type) {
    case "ASK_USER":
      if (!onlyExpectedStrictPlaceholders(value, new Set(["question", "relatedFields"]))) return { valid: false, errors: ["ASK_USER contains non-placeholder fields"] };
      return { valid: true, value: { type: value.type, question: value.question, ...(emptyList(value.relatedFields) ? {} : { relatedFields: value.relatedFields }), ...(decisionSummary ? { decisionSummary } : {}) } };
    case "SEARCH_RESTAURANTS":
      if (!onlyExpectedStrictPlaceholders(value, new Set(["retrievalHint"]))) return { valid: false, errors: ["SEARCH_RESTAURANTS contains non-placeholder fields"] };
      return { valid: true, value: { type: value.type, ...(nonBlank(value.retrievalHint) ? { retrievalHint: value.retrievalHint } : {}), ...(decisionSummary ? { decisionSummary } : {}) } };
    case "CHECK_AVAILABILITY":
    case "PRESENT_RESULTS":
      if (!onlyExpectedStrictPlaceholders(value, new Set(["candidateIds"]))) return { valid: false, errors: [`${value.type} contains non-placeholder fields`] };
      return { valid: true, value: { type: value.type, candidateIds: value.candidateIds, ...(decisionSummary ? { decisionSummary } : {}) } };
    case "SELECT_CANDIDATE":
      if (!onlyExpectedStrictPlaceholders(value, new Set(["candidateId", "offerId"]))) return { valid: false, errors: ["SELECT_CANDIDATE contains non-placeholder fields"] };
      return { valid: true, value: { type: value.type, candidateId: value.candidateId, ...(nonBlank(value.offerId) ? { offerId: value.offerId } : {}), ...(decisionSummary ? { decisionSummary } : {}) } };
    case "BOOK_RESERVATION":
      if (!onlyExpectedStrictPlaceholders(value, new Set(["candidateId", "offerId"]))) return { valid: false, errors: ["BOOK_RESERVATION contains non-placeholder fields"] };
      return { valid: true, value: { type: value.type, candidateId: value.candidateId, offerId: value.offerId, ...(decisionSummary ? { decisionSummary } : {}) } };
    default:
      return { valid: true, value };
  }
}

/** Validates only the untrusted action's shape. State-dependent permission is Kernel-owned. */
export function validateRestaurantAgentAction(
  value: unknown,
): { valid: true; value: ValidatedRestaurantAgentAction } | { valid: false; errors: string[] } {
  if (!isRecord(value) || !nonBlank(value.type)) {
    return { valid: false, errors: ["Agent action must be an object with a non-empty type"] };
  }
  const decisionSummary = nonBlank(value.decisionSummary) ? value.decisionSummary.trim() : undefined;
  switch (value.type) {
    case "ASK_USER": {
      const relatedFields = value.relatedFields === undefined ? undefined : stringList(value.relatedFields);
      if (!nonBlank(value.question) || relatedFields === null) {
        return { valid: false, errors: ["ASK_USER requires a question and optional non-empty relatedFields"] };
      }
      return {
        valid: true,
        value: {
          action: {
            type: "ASK_USER",
            question: value.question.trim(),
            ...(relatedFields ? { relatedFields } : {}),
          },
          ...(decisionSummary ? { decisionSummary } : {}),
        },
      };
    }
    case "SEARCH_RESTAURANTS": {
      if (value.retrievalHint !== undefined && !nonBlank(value.retrievalHint)) {
        return { valid: false, errors: ["SEARCH_RESTAURANTS retrievalHint must be non-empty when provided"] };
      }
      return {
        valid: true,
        value: {
          action: {
            type: "SEARCH_RESTAURANTS",
            ...(nonBlank(value.retrievalHint) ? { retrievalHint: value.retrievalHint.trim() } : {}),
          },
          ...(decisionSummary ? { decisionSummary } : {}),
        },
      };
    }
    case "CHECK_AVAILABILITY": {
      const candidateIds = stringList(value.candidateIds);
      return candidateIds && candidateIds.length > 0
        ? { valid: true, value: { action: { type: "CHECK_AVAILABILITY", candidateIds }, ...(decisionSummary ? { decisionSummary } : {}) } }
        : { valid: false, errors: ["CHECK_AVAILABILITY requires one or more candidateIds"] };
    }
    case "PRESENT_RESULTS": {
      const candidateIds = stringList(value.candidateIds);
      return candidateIds && candidateIds.length > 0
        ? { valid: true, value: { action: { type: "PRESENT_RESULTS", candidateIds }, ...(decisionSummary ? { decisionSummary } : {}) } }
        : { valid: false, errors: ["PRESENT_RESULTS requires one or more candidateIds"] };
    }
    case "SELECT_CANDIDATE":
      return nonBlank(value.candidateId) && (value.offerId === undefined || nonBlank(value.offerId))
        ? { valid: true, value: { action: { type: "SELECT_CANDIDATE", candidateId: value.candidateId.trim(), ...(nonBlank(value.offerId) ? { offerId: value.offerId.trim() } : {}) }, ...(decisionSummary ? { decisionSummary } : {}) } }
        : { valid: false, errors: ["SELECT_CANDIDATE requires candidateId and optional offerId"] };
    case "BOOK_RESERVATION":
      return nonBlank(value.candidateId) && nonBlank(value.offerId)
        ? { valid: true, value: { action: { type: "BOOK_RESERVATION", candidateId: value.candidateId.trim(), offerId: value.offerId.trim() }, ...(decisionSummary ? { decisionSummary } : {}) } }
        : { valid: false, errors: ["BOOK_RESERVATION requires candidateId and offerId"] };
    default:
      return { valid: false, errors: [`Unsupported Restaurant Agent action: ${value.type}`] };
  }
}
