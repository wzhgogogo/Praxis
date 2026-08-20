export const RESTAURANT_AGENT_ACTION_SCHEMA = {
  name: "restaurant_agent_action",
  version: "2",
} as const;

export type RestaurantAgentAction =
  | { type: "ASK_USER"; question: string; relatedFields?: string[] }
  | { type: "SEARCH_RESTAURANTS"; retrievalHint?: string }
  | { type: "CHECK_AVAILABILITY"; candidateIds: string[] }
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
