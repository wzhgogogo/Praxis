import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scoreQaAnswer, type QaRead, type QaReference, type QaResponse } from "../fact-qa/scorer.js";
import { runQaEvaluation } from "../fact-qa/run.js";

// Local construction, not website replay or human-confirmed restaurant Gold.
const read: QaRead = { pageId: "page-A", pageSha256: "sha-A", readId: "read-current", outletId: "outlet-A", runId: "run-current", text: "Private room for four guests." };
const reference: QaReference = { status: "REVIEWER_CONFIRMED", kind: "ANSWERED", approvedAnswers: ["原文：Private room for four guests."], requiredQuotes: ["Private room for four guests."], targetOutletId: "outlet-A", targetRunId: "run-current", sensitiveCategory: "NONE", pageId: "page-A", pageSha256: "sha-A" };
const answer: QaResponse = { kind: "ANSWERED", sensitiveCategory: "NONE", text: reference.approvedAnswers[0]!, citations: [{ pageId: "page-B", pageSha256: "sha-B", readId: "read-other", quote: "Private room for four guests." }] };

test("G1 scorer rejects the same words cited from another outlet page/read", () => {
  assert.equal(scoreQaAnswer(reference, read, answer).status, "FAIL");
  const current = { ...answer, citations: [{ ...answer.citations[0]!, pageId: read.pageId, pageSha256: read.pageSha256, readId: read.readId }] };
  assert.equal(scoreQaAnswer(reference, read, current).status, "PASS");
  for (const patch of [{ readId: "old-read" }, { pageSha256: "old-page" }, { pageId: "other-page" }]) {
    assert.equal(scoreQaAnswer(reference, read, { ...current, citations: [{ ...current.citations[0]!, ...patch }] }).status, "FAIL");
  }
  assert.equal(scoreQaAnswer({ ...reference, targetOutletId: "outlet-B" }, read, current).status, "FAIL");
  assert.equal(scoreQaAnswer(reference, { ...read, pageSha256: "other-source" }, current).status, "FAIL");
});

test("G1 refuses candidate Gold and leaves unseen paraphrase consistency unknown", () => {
  const current = { ...answer, citations: [{ ...answer.citations[0]!, pageId: read.pageId, pageSha256: read.pageSha256, readId: read.readId }] };
  const unreviewed = scoreQaAnswer({ ...reference, status: "CANDIDATE" }, read, current);
  assert.equal(unreviewed.status, "NOT_READY"); assert.equal(unreviewed.falseClaimCount, null);
  const paraphrase = scoreQaAnswer(reference, read, { ...current, text: "页面说有可坐四人的包间。" });
  assert.equal(paraphrase.status, "NOT_EVALUATED"); assert.equal(paraphrase.consistency, "NOT_EVALUATED"); assert.equal(paraphrase.falseClaimCount, null);
});

test("G1 distinguishes honest absence, unsupported claims, bilingual conflict and sensitive confirmation", () => {
  const current = { ...answer, citations: [{ ...answer.citations[0]!, pageId: read.pageId, pageSha256: read.pageSha256, readId: read.readId }] };
  const absent: QaReference = { ...reference, kind: "NOT_STATED", notStatedQuestion: true, approvedAnswers: ["页面未说明。"] };
  assert.equal(scoreQaAnswer(absent, read, { kind: "NOT_STATED", sensitiveCategory: "NONE", text: "页面未说明。", citations: [] }).status, "PASS");
  assert.equal(scoreQaAnswer(absent, read, current).falseClaimCount, 1);
  assert.equal(scoreQaAnswer({ ...reference, kind: "CONFLICT" }, read, current).status, "FAIL");
  assert.equal(scoreQaAnswer(reference, read, { ...current, citations: [] }).status, "FAIL");
  assert.equal(scoreQaAnswer({ ...reference, sensitiveCategory: "ALLERGY" }, read, current).status, "FAIL");
  const sensitive = current.text + " 请向餐厅确认。";
  assert.equal(scoreQaAnswer({ ...reference, sensitiveCategory: "ALLERGY", approvedAnswers: [sensitive] }, read, { ...current, text: sensitive, sensitiveCategory: "ALLERGY" }).status, "PASS");
  const unrelatedRead = { ...read, text: read.text + " Welcome." };
  assert.equal(scoreQaAnswer(reference, unrelatedRead, { ...current, citations: [{ ...current.citations[0]!, quote: "Welcome." }] }).status, "FAIL");
});

test("G1 evaluator cannot turn candidate answers into a scored acceptance set", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qa-candidate-control-"));
  try {
    const questions = join(directory, "questions.json"), references = join(directory, "candidate.json"), output = join(directory, "result.json");
    await writeFile(questions, JSON.stringify({ pages: [], questions: [{ id: "local-question", pageId: "missing-page", displayedOutlet: { candidateId: "local-A" }, type: "有答案" }] }));
    await writeFile(references, JSON.stringify({ answers: [{ questionId: "local-question", status: "CANDIDATE" }] }));
    const result = await runQaEvaluation({ questions, references, responses: join(directory, "deliberately-absent-responses"), reads: join(directory, "deliberately-absent-reads"), output });
    assert.equal(result.status, "NOT_READY"); assert.equal(result.falseClaimCount, null);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

// Local construction: public G1 response kinds are the three core outcomes.
test("G1 maps an outlet/run mismatch reference to UNVERIFIED without quoting the rejected page", () => {
  const mismatch: QaReference = { ...reference, kind: "MISMATCH", approvedAnswers: ["Unable to verify."], requiredQuotes: [] };
  const result = scoreQaAnswer(mismatch, { ...read, outletId: "other-branch" },
    JSON.parse('{"kind":"UNVERIFIED","sensitiveCategory":"NONE","text":"Unable to verify.","citations":[]}') as QaResponse);
  assert.equal(result.status, "PASS");
  assert.equal(result.falseClaimCount, 0);
  assert.equal(scoreQaAnswer({ ...mismatch, forbiddenAnswerFragments: ["56"] }, read,
    { kind: "UNVERIFIED", sensitiveCategory: "NONE", text: "Unable to verify, but they have 56 seats.", citations: [] }).falseClaimCount, 1);
  assert.equal(scoreQaAnswer(mismatch, read, { kind: "UNVERIFIED", sensitiveCategory: "NONE", text: "", citations: [] }).status, "PASS");
  assert.equal(scoreQaAnswer(reference, { ...read, runId: "previous-run" },
    { kind: "ANSWERED", sensitiveCategory: "NONE", text: reference.approvedAnswers[0]!, citations: [{ pageId: read.pageId, pageSha256: read.pageSha256, readId: read.readId, quote: read.text }] }).falseClaimCount, 1);
});

test("G1 maps bilingual conflict to ANSWERED with both originals and restaurant confirmation", () => {
  const text = "The originals conflict. Please confirm with the restaurant.";
  const quoteB = "コースのみ10％";
  const conflict: QaReference = { ...reference, kind: "CONFLICT", approvedAnswers: [text], requiredQuotes: [read.text, quoteB] };
  const result = scoreQaAnswer(conflict, { ...read, text: read.text + " " + quoteB },
    { kind: "ANSWERED", sensitiveCategory: "NONE", text, citations: [read.text, quoteB].map(quote => ({ pageId: read.pageId, pageSha256: read.pageSha256, readId: read.readId, quote })) });
  assert.equal(result.status, "PASS");
  assert.equal(result.falseClaimCount, 0);
  const citations = [read.text, quoteB].map(quote => ({ pageId: read.pageId, pageSha256: read.pageSha256, readId: read.readId, quote }));
  assert.equal(scoreQaAnswer(conflict, { ...read, text: read.text + " " + quoteB }, { kind: "ANSWERED", sensitiveCategory: "NONE", text, citations: citations.slice(0, 1) }).status, "FAIL");
  assert.equal(scoreQaAnswer(conflict, { ...read, text: read.text + " " + quoteB }, { kind: "ANSWERED", sensitiveCategory: "NONE", text: "Please confirm with the restaurant.", citations }).status, "FAIL");
});
