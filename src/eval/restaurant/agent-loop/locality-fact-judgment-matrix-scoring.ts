import type { ModelResponse } from "../../../core/model/contracts.js";

export type LocalityMatrixExpected = "SUPPORTED" | "UNKNOWN" | "NOT_SUPPORTED";
export type LocalityMatrixRawJudgment = { criterion: string; outcome: "SUPPORTED" | "CONFLICT" | "UNKNOWN"; evidenceIds: string[] };
export type LocalityMatrixCanonical = {
  targetCriterion: string;
  responseStatus:
    | "VALID"
    | "NO_SUCCESSFUL_RESPONSE"
    | "MALFORMED_JSON"
    | "MISSING_TARGET_JUDGMENT"
    | "DUPLICATE_TARGET_JUDGMENT"
    | "ILLEGAL_OUTCOME"
    | "INVALID_EVIDENCE_IDS";
  rawJudgment?: LocalityMatrixRawJudgment;
  sourceEvidenceIds: string[];
  citedEvidenceIds: string[];
  citationStatus: "NONE" | "GROUNDED" | "UNGROUNDED";
  acceptedVerifiedHardCriteria: string[];
  supportingEvidenceIds: string[];
  targetCriterionAccepted: boolean;
};

type RawItem = { criterion?: unknown; outcome?: unknown; evidenceIds?: unknown };

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

/**
 * Canonicalizes only the single requested matrix criterion. It does not
 * interpret cuisine/locality; that remains the real model's responsibility.
 */
export function canonicalizeLocalityMatrixResponse(input: {
  response?: Pick<ModelResponse, "finishReason" | "outputText">;
  targetCriterion: string;
  sourceEvidenceIds: readonly string[];
  acceptedVerifiedHardCriteria: readonly string[];
  supportingEvidenceIds: readonly string[];
}): LocalityMatrixCanonical {
  const base = {
    targetCriterion: input.targetCriterion,
    sourceEvidenceIds: [...input.sourceEvidenceIds],
    acceptedVerifiedHardCriteria: [...input.acceptedVerifiedHardCriteria],
    supportingEvidenceIds: [...input.supportingEvidenceIds],
    targetCriterionAccepted: input.acceptedVerifiedHardCriteria.some((criterion) => normalized(criterion) === normalized(input.targetCriterion)),
  };
  if (!input.response || input.response.finishReason !== "TOOL_CALLS") {
    return { responseStatus: "NO_SUCCESSFUL_RESPONSE", citedEvidenceIds: [], citationStatus: "NONE", ...base };
  }
  let judgments: unknown;
  try {
    judgments = (JSON.parse(input.response.outputText) as { judgments?: unknown }).judgments;
  } catch {
    return { responseStatus: "MALFORMED_JSON", citedEvidenceIds: [], citationStatus: "NONE", ...base };
  }
  if (!Array.isArray(judgments)) {
    return { responseStatus: "MISSING_TARGET_JUDGMENT", citedEvidenceIds: [], citationStatus: "NONE", ...base };
  }
  const targets = judgments
    .map((item) => typeof item === "object" && item !== null && !Array.isArray(item) ? item as RawItem : undefined)
    .filter((item): item is RawItem => typeof item?.criterion === "string" && normalized(item.criterion) === normalized(input.targetCriterion));
  if (targets.length === 0) {
    return { responseStatus: "MISSING_TARGET_JUDGMENT", citedEvidenceIds: [], citationStatus: "NONE", ...base };
  }
  if (targets.length !== 1) {
    return { responseStatus: "DUPLICATE_TARGET_JUDGMENT", citedEvidenceIds: [], citationStatus: "NONE", ...base };
  }
  const target = targets[0]!;
  if (typeof target.outcome !== "string" || !["SUPPORTED", "CONFLICT", "UNKNOWN"].includes(target.outcome)) {
    return { responseStatus: "ILLEGAL_OUTCOME", citedEvidenceIds: [], citationStatus: "NONE", ...base };
  }
  if (!Array.isArray(target.evidenceIds) || !target.evidenceIds.every((item) => typeof item === "string")) {
    return { responseStatus: "INVALID_EVIDENCE_IDS", citedEvidenceIds: [], citationStatus: "NONE", ...base };
  }
  const citedEvidenceIds = target.evidenceIds;
  const outcome = target.outcome as LocalityMatrixRawJudgment["outcome"];
  const citationStatus = citedEvidenceIds.length === 0
    ? "NONE"
    : citedEvidenceIds.every((id) => input.sourceEvidenceIds.includes(id)) ? "GROUNDED" : "UNGROUNDED";
  return {
    responseStatus: "VALID",
    rawJudgment: { criterion: target.criterion as string, outcome, evidenceIds: citedEvidenceIds },
    citedEvidenceIds,
    citationStatus,
    ...base,
  };
}

export function localityMatrixRunPassesExpected(input: {
  expected: LocalityMatrixExpected;
  inputStatus: "INVOKED" | "FILTERED_NOT_INVOKED";
  failureCode?: string;
  canonical: LocalityMatrixCanonical;
}): boolean {
  if (input.inputStatus !== "INVOKED" || input.failureCode || input.canonical.responseStatus !== "VALID") return false;
  const outcome = input.canonical.rawJudgment?.outcome;
  const citationIsSafe = input.canonical.citationStatus !== "UNGROUNDED";
  if (input.expected === "SUPPORTED") {
    return outcome === "SUPPORTED" && input.canonical.citationStatus === "GROUNDED" && input.canonical.targetCriterionAccepted;
  }
  if (input.expected === "UNKNOWN") {
    return outcome === "UNKNOWN" && citationIsSafe && !input.canonical.targetCriterionAccepted;
  }
  return (outcome === "UNKNOWN" || outcome === "CONFLICT") && citationIsSafe && !input.canonical.targetCriterionAccepted;
}
