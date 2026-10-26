import assert from "node:assert/strict";
import test from "node:test";
import { independentPageText } from "../../eval/restaurant/fact-qa/independent-text.js";
import { scoreQaAnswer } from "../../eval/restaurant/fact-qa/scorer.js";

test("G1 independent source reader excludes script-only and hidden claims from quote support", async () => {
  // Local construction, never website replay or human-confirmed restaurant Gold.
  const text = await independentPageText('<h1>Local restaurant A</h1><p>Private room for four guests.</p><div hidden>Wheelchair guaranteed.</div><script>globalThis.fake="Wheelchair guaranteed."</script>');
  assert.equal(text.includes("Private room for four guests."), true);
  assert.equal(text.includes("Wheelchair guaranteed."), false);
  const reference = { status: "REVIEWER_CONFIRMED" as const, kind: "ANSWERED" as const, approvedAnswers: ["原文：Private room for four guests."], targetOutletId: "local-A", pageId: "local-page", pageSha256: "local-sha" };
  const read = { pageId: "local-page", pageSha256: "local-sha", readId: "local-current", outletId: "local-A", text };
  const response = { kind: "ANSWERED" as const, text: reference.approvedAnswers[0]!, citations: [{ pageId: read.pageId, pageSha256: read.pageSha256, readId: read.readId, quote: "Private room for four guests." }] };
  assert.equal(scoreQaAnswer(reference, read, response).status, "PASS");
  const invalid = scoreQaAnswer(reference, read, { ...response, citations: [{ ...response.citations[0]!, quote: "Wheelchair guaranteed." }] });
  assert.equal(invalid.status, "FAIL"); assert.equal(invalid.falseClaimCount, 1);
});
