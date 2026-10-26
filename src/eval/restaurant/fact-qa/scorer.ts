export interface QaCitation { pageId: string; pageSha256: string; readId: string; quote: string; }
export interface QaResponse { kind: "ANSWERED" | "NOT_STATED" | "MISMATCH" | "CONFLICT"; text: string; citations: QaCitation[]; }
export interface QaRead { pageId: string; pageSha256: string; readId: string; outletId: string; text: string; }
export interface QaReference { status: "CANDIDATE" | "REVIEWER_CONFIRMED"; kind: QaResponse["kind"]; approvedAnswers: string[]; rejectedAnswers?: string[]; targetOutletId: string; pageId: string; pageSha256: string; sensitive?: boolean; notStatedQuestion?: boolean; }

// Red-stage local comparator: quote-presence alone has no page/read binding.
// This is not the product verifier, nor a claim about current product behavior.
export function scoreQaAnswer(_reference: QaReference, read: QaRead, answer: QaResponse) {
  return { status: answer.citations.every(citation => read.text.includes(citation.quote)) ? "PASS" : "FAIL" };
}
