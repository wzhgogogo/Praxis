import assert from "node:assert/strict";
import test from "node:test";
import { scoreQaAnswer, type QaRead, type QaReference, type QaResponse } from "../fact-qa/scorer.js";

// Local construction, not website replay or human-confirmed restaurant Gold.
const read: QaRead = { pageId: "page-A", pageSha256: "sha-A", readId: "read-current", outletId: "outlet-A", text: "Private room for four guests." };
const reference: QaReference = { status: "REVIEWER_CONFIRMED", kind: "ANSWERED", approvedAnswers: ["原文：Private room for four guests."], targetOutletId: "outlet-A", pageId: "page-A", pageSha256: "sha-A" };
const answer: QaResponse = { kind: "ANSWERED", text: reference.approvedAnswers[0]!, citations: [{ pageId: "page-B", pageSha256: "sha-B", readId: "read-other", quote: "Private room for four guests." }] };

test("G1 scorer rejects the same words cited from another outlet page/read", () => {
  assert.equal(scoreQaAnswer(reference, read, answer).status, "FAIL");
});
