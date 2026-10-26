export interface QaCitation { pageId: string; pageSha256: string; readId: string; quote: string; }
export interface QaResponse { kind: "ANSWERED" | "NOT_STATED" | "MISMATCH" | "CONFLICT"; text: string; citations: QaCitation[]; }
export interface QaRead { pageId: string; pageSha256: string; readId: string; outletId: string; text: string; }
export interface QaReference { status: "CANDIDATE" | "REVIEWER_CONFIRMED"; kind: QaResponse["kind"]; approvedAnswers: string[]; rejectedAnswers?: string[]; requiredQuotes?: string[]; targetOutletId: string; pageId: string; pageSha256: string; sensitive?: boolean; notStatedQuestion?: boolean; }

export const FACT_QA_SCORER = "source-quoted-qa-scorer@1";
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
  if (read.pageId !== reference.pageId || read.pageSha256 !== reference.pageSha256) reasons.push("CURRENT_READ_SOURCE_MISMATCH");
  if (positive && read.outletId !== reference.targetOutletId) { reasons.push("OTHER_OUTLET_CLAIM"); falseClaim = true; }
  for (const citation of answer.citations) {
    if (citation.pageId !== read.pageId || citation.pageSha256 !== read.pageSha256 || citation.readId !== read.readId) {
      reasons.push("CITATION_PAGE_OR_READ_MISMATCH"); falseClaim = true;
    }
    if (!words(citation.quote) || !words(read.text).includes(words(citation.quote))) { reasons.push("QUOTE_NOT_IN_CURRENT_PAGE"); falseClaim = true; }
  }
  if ((answer.kind !== "NOT_STATED" || reference.sensitive) && !answer.citations.length) reasons.push("MISSING_VERBATIM_QUOTE");
  if ((answer.kind !== "NOT_STATED" || reference.sensitive) && reference.requiredQuotes?.some(quote => !answer.citations.some(citation => words(citation.quote).includes(words(quote))))) reasons.push("REQUIRED_SUPPORT_NOT_QUOTED");
  const citations = reasons.length ? "FAIL" as const : "PASS" as const;
  if (reference.sensitive && !/请向餐厅确认|please (?:check|confirm) with (?:the )?restaurant/i.test(answer.text)) reasons.push("MISSING_RESTAURANT_CONFIRMATION");
  const kindMatches = reference.kind === answer.kind;
  if (!kindMatches) {
    reasons.push("ANSWER_KIND_CONTRADICTS_REFERENCE");
    if (positive && reference.kind !== "ANSWERED") falseClaim = true;
  }
  const notStated = reference.kind !== "NOT_STATED" ? "NOT_APPLICABLE" as const
    : kindMatches && (!reference.notStatedQuestion || /页面未说明|page (?:does not (?:say|state)|has not stated)|not stated (?:on|in) (?:the )?page/i.test(answer.text)) ? "PASS" as const : "FAIL" as const;
  if (notStated === "FAIL") reasons.push("NOT_STATED_JUDGMENT_INCORRECT");
  const rejected = reference.rejectedAnswers?.some(text => words(text) === words(answer.text)) ?? false;
  if (rejected) { reasons.push("REVIEWER_REJECTED_ASSERTION"); falseClaim = true; }
  const exactApproved = reference.approvedAnswers.some(text => words(text) === words(answer.text));
  const consistency = !kindMatches || rejected ? "FAIL" as const : exactApproved ? "PASS" as const : "NOT_EVALUATED" as const;
  if (consistency === "NOT_EVALUATED") reasons.push("PARAPHRASE_REQUIRES_REVIEW");
  const failed = reasons.some(reason => reason !== "PARAPHRASE_REQUIRES_REVIEW");
  return { status: failed ? "FAIL" : consistency === "PASS" ? "PASS" : "NOT_EVALUATED", reasons: [...new Set(reasons)], consistency, citations, notStated,
    falseClaimCount: falseClaim ? 1 : consistency === "NOT_EVALUATED" || reasons.includes("CURRENT_READ_SOURCE_MISMATCH") ? null : 0 };
}
