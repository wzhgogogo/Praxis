export interface QaCitation { pageId: string; pageSha256: string; readId: string; quote: string; }
export type QaSensitiveCategory = "ALLERGY" | "RELIGIOUS_DIET" | "ACCESSIBILITY" | "NONE";
export interface QaResponse { kind: "ANSWERED" | "NOT_STATED" | "UNVERIFIED"; text: string; citations: QaCitation[]; sensitiveCategory: QaSensitiveCategory; confirmationRequired: boolean | null; }
export interface QaRead { pageId: string; pageSha256: string; readId: string; outletId: string; runId: string; text: string; }
export interface QaReference { status: "CANDIDATE" | "REVIEWER_CONFIRMED"; kind: "ANSWERED" | "NOT_STATED" | "MISMATCH" | "CONFLICT"; approvedAnswers: string[]; rejectedAnswers?: string[]; requiredQuotes?: string[]; targetOutletId: string; targetRunId: string; forbiddenAnswerFragments?: string[]; pageId: string; pageSha256: string; sensitiveCategory: QaSensitiveCategory; acceptedSensitiveCategories?: readonly QaSensitiveCategory[]; notStatedQuestion?: boolean; confirmationRequired?: boolean; relatedAnswer?: { requiredQuotes: string[]; approvedAnswers: string[]; requiredLimitationPattern: string }; }

export const FACT_QA_SCORER = "source-quoted-qa-scorer@5";
const words = (value: string) => value.replace(/\s+/g, " ").trim();
export interface QaScore {
  status: "NOT_READY" | "PASS" | "FAIL" | "NOT_EVALUATED";
  reasons: string[];
  consistency: "PASS" | "FAIL" | "NOT_EVALUATED";
  citations: "PASS" | "FAIL" | "NOT_EVALUATED";
  notStated: "PASS" | "FAIL" | "NOT_APPLICABLE" | "NOT_EVALUATED";
  /** Per-answer count, not an inferred number of clauses. Unknown is never zero. */
  falseClaimCount: number | null;
}

/** Eval only: the caller obtains text independently from the frozen source bytes.
 * Unrecognized paraphrases require review, never a lexical claim of falsehood. */
export function scoreQaAnswer(reference: QaReference, read: QaRead, answer: QaResponse): QaScore {
  if (reference.status !== "REVIEWER_CONFIRMED") return { status: "NOT_READY", reasons: ["REFERENCE_NOT_REVIEWER_CONFIRMED"], consistency: "NOT_EVALUATED", citations: "NOT_EVALUATED", notStated: "NOT_EVALUATED", falseClaimCount: null };
  const reasons: string[] = [];
  let falseClaim = false;
  const positive = answer.kind === "ANSWERED";
  const related = positive ? reference.relatedAnswer : undefined;
  const expectedKind = reference.kind === "MISMATCH" ? "UNVERIFIED" : reference.kind === "CONFLICT" ? "ANSWERED" : reference.kind;
  if (read.pageId !== reference.pageId || read.pageSha256 !== reference.pageSha256) reasons.push("CURRENT_READ_SOURCE_MISMATCH");
  if (answer.kind !== "UNVERIFIED" && read.outletId !== reference.targetOutletId) { reasons.push("OTHER_OUTLET_CLAIM"); falseClaim = true; }
  if (answer.kind !== "UNVERIFIED" && read.runId !== reference.targetRunId) { reasons.push("OTHER_RUN_CLAIM"); falseClaim = true; }
  if (answer.kind === "UNVERIFIED" && answer.citations.length) { reasons.push("REJECTED_PAGE_FACTS_QUOTED"); falseClaim = true; }
  if (reference.forbiddenAnswerFragments?.some(fragment => words(answer.text).toLowerCase().includes(words(fragment).toLowerCase()))) {
    reasons.push("FORBIDDEN_ASSERTION_IN_ANSWER"); falseClaim = true;
  }
  for (const citation of answer.citations) {
    if (citation.pageId !== read.pageId || citation.pageSha256 !== read.pageSha256 || citation.readId !== read.readId) {
      reasons.push("CITATION_PAGE_OR_READ_MISMATCH"); falseClaim = true;
    }
    if (!words(citation.quote) || !words(read.text).includes(words(citation.quote))) { reasons.push("QUOTE_NOT_IN_CURRENT_PAGE"); falseClaim = true; }
  }
  if (answer.kind === "NOT_STATED" && answer.citations.length) reasons.push("NOT_STATED_MUST_HAVE_NO_CITATIONS");
  if (positive && !answer.citations.length) reasons.push("MISSING_VERBATIM_QUOTE");
  const requiredQuotes = related?.requiredQuotes ?? reference.requiredQuotes;
  if (positive && requiredQuotes?.some(quote => !answer.citations.some(citation => words(citation.quote).includes(words(quote))))) reasons.push("REQUIRED_SUPPORT_NOT_QUOTED");
  if (!(reference.acceptedSensitiveCategories ?? [reference.sensitiveCategory]).includes(answer.sensitiveCategory)) reasons.push("SENSITIVE_CATEGORY_MISMATCH");
  if (answer.kind !== "UNVERIFIED" && answer.confirmationRequired !== (reference.confirmationRequired ?? ((reference.acceptedSensitiveCategories ? answer.sensitiveCategory : reference.sensitiveCategory) !== "NONE"))) reasons.push("CONFIRMATION_REQUIRED_MISMATCH");
  if (related && !new RegExp(related.requiredLimitationPattern, "iu").test(answer.text)) reasons.push("MISSING_RELATED_ANSWER_LIMITATION");
  const citations = reasons.length ? "FAIL" as const : "PASS" as const;
  if ((reference.kind === "CONFLICT") && !/请向餐厅确认|please (?:check|confirm) with (?:the )?restaurant/i.test(answer.text)) reasons.push("MISSING_RESTAURANT_CONFIRMATION");
  if (reference.kind === "CONFLICT" && !/conflict|inconsisten|do not agree|不一致|冲突/i.test(answer.text)) reasons.push("BILINGUAL_CONFLICT_NOT_ACKNOWLEDGED");
  const kindMatches = expectedKind === answer.kind || Boolean(related);
  if (!kindMatches) {
    reasons.push("ANSWER_KIND_CONTRADICTS_REFERENCE");
    if (positive && expectedKind !== "ANSWERED" && !related) falseClaim = true;
  }
  const notStated = reference.kind !== "NOT_STATED" || related ? "NOT_APPLICABLE" as const
    : kindMatches && (!reference.notStatedQuestion || /页面未说明|page (?:does not (?:say|state)|has not stated)|not stated (?:on|in) (?:the )?page/i.test(answer.text)) ? "PASS" as const : "FAIL" as const;
  if (notStated === "FAIL") reasons.push("NOT_STATED_JUDGMENT_INCORRECT");
  const rejected = reference.rejectedAnswers?.some(text => words(text) === words(answer.text)) ?? false;
  if (rejected) { reasons.push("REVIEWER_REJECTED_ASSERTION"); falseClaim = true; }
  const exactApproved = (answer.kind === "UNVERIFIED" && !words(answer.text)) || (related?.approvedAnswers ?? reference.approvedAnswers).some(text => words(text) === words(answer.text));
  const consistency = !kindMatches || rejected || reasons.includes("FORBIDDEN_ASSERTION_IN_ANSWER") ? "FAIL" as const : exactApproved ? "PASS" as const : "NOT_EVALUATED" as const;
  if (consistency === "NOT_EVALUATED") reasons.push("PARAPHRASE_REQUIRES_REVIEW");
  const failed = reasons.some(reason => reason !== "PARAPHRASE_REQUIRES_REVIEW");
  return { status: failed ? "FAIL" : consistency === "PASS" ? "PASS" : "NOT_EVALUATED", reasons: [...new Set(reasons)], consistency, citations, notStated,
    falseClaimCount: falseClaim ? 1 : consistency === "NOT_EVALUATED" || reasons.includes("CURRENT_READ_SOURCE_MISMATCH") ? null : 0 };
}
