import assert from "node:assert/strict";
import test from "node:test";
import { execFile as childExec } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { runBoundQuestions } from "../../eval/restaurant/fact-qa/run-bound-questions.js";
import { fixtureQuestionModel, scoringResponse, type QuestionOutcome, type BoundRead } from "../../eval/restaurant/fact-qa/core-adapter.js";
import { runQaEvaluation } from "../../eval/restaurant/fact-qa/run.js";

// Local construction, not a website replay or reviewer-confirmed restaurant Gold.
const questions = "src/harness/browser/fixtures/fact-qa-runner/questions.json";
const quote = "Private rooms for four guests.";
const model = () => fixtureQuestionModel([{ question: "Are private rooms listed?", quote }]);
async function temporary() { return mkdtemp(resolve(".eval-artifacts/local-g1-runner-")); }

test("G1 Runner executes bound pages, rejects previous-run binding, then scores in a separate phase", async () => {
  const directory = await temporary();
  try {
    const output = join(directory, "execution");
    const run = await runBoundQuestions({ questions, output, codeRef: "0".repeat(40), model: model(), signal: AbortSignal.timeout(20_000) });
    const results = JSON.parse(await readFile(join(output, "core-results.json"), "utf8"));
    assert.equal(results[2].answer.status, "UNVERIFIED", "an old-run page must never be relabelled as current by the Runner");
    assert.equal(results[2].answer.reason, "NO_BOUND_PAGE");
    assert.deepEqual(results.map((row: { answer: QuestionOutcome }) => row.answer.status), ["ANSWERED", "NOT_STATED", "UNVERIFIED"]);
    assert.equal(results[0].answer.citations[0].text, quote);
    assert.equal(results[0].answer.citations[0].url, "https://merchant.example/fixture-cafe");
    assert.equal(results[0].answer.citations[0].readAt, "2026-10-27T10:00:01+01:00");
    assert.equal(run.executed, 3); assert.equal(run.modelInvocations, 2); assert.equal(run.freshReads, 0); assert.equal(run.sourceTransportCalls, 0);
    assert.deepEqual(run.providers, ["FIXTURE"]);
    // These synthetic references are created only AFTER the execution is retained.
    const references = join(directory, "references.json"), evaluation = join(directory, "evaluation.json");
    await writeFile(references, JSON.stringify({ answers: [
      { questionId: "local-answer", status: "REVIEWER_CONFIRMED", answerKind: "ANSWERED", candidateAnswer: "“Private rooms for four guests.”\n请向餐厅确认", approvedAnswers: ["“Private rooms for four guests.”\n请向餐厅确认", "Private rooms for four guests."], evidence: [{ quote }] },
      { questionId: "local-absence", status: "REVIEWER_CONFIRMED", answerKind: "NOT_STATED", candidateAnswer: "页面未说明", approvedAnswers: ["页面未说明", "The page does not state this."], evidence: [] },
      { questionId: "local-old-run", status: "REVIEWER_CONFIRMED", answerKind: "MISMATCH", candidateAnswer: "", requiredQuotes: [], evidence: [] },
    ] }));
    const result = await runQaEvaluation({ questions, references, reads: join(output, "reads.json"), responses: join(output, "responses.json"), output: evaluation });
    assert.equal(result.status, "PASS"); assert.equal(result.falseClaimCount, 0);
    assert.equal(JSON.parse(await readFile(join(output, "run.json"), "utf8")).executed, 3, "evaluation must not overwrite execution");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("G1 Runner rejects unknown public keys and changed source SHA before any model invocation", async () => {
  const directory = await temporary(); let calls = 0;
  try {
    const original = JSON.parse(await readFile(questions, "utf8"));
    const path = join(directory, "questions.json");
    const invalid = { ...original, answers: [] };
    await writeFile(path, JSON.stringify(invalid));
    const gateway = { complete: async () => { calls++; throw new Error("must not be called"); } };
    await assert.rejects(runBoundQuestions({ questions: path, output: join(directory, "bad-keys"), codeRef: "0".repeat(40), model: gateway, signal: AbortSignal.timeout(10_000) }), /UNKNOWN_QA_INPUT_KEY/);
    original.pages[0].pageSha256 = "0".repeat(64);
    for (const question of original.questions) question.providedPage.pageSha256 = "0".repeat(64);
    await writeFile(path, JSON.stringify(original));
    await assert.rejects(runBoundQuestions({ questions: path, output: join(directory, "bad-hash"), codeRef: "0".repeat(40), model: gateway, signal: AbortSignal.timeout(10_000) }), /QA_SOURCE_SHA_MISMATCH/);
    assert.equal(calls, 0);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("G1 scoring projection rejects a citation with another URL or readAt", () => {
  const read: BoundRead = { questionId: "local", pageId: "page", pageSha256: "sha", readId: "read", runId: "run", outletId: "local", url: "https://merchant.example/cafe", readAt: "2026-10-27T10:00:00Z", text: quote };
  const answer: QuestionOutcome = { status: "ANSWERED", candidateId: "local", answer: quote, sensitiveCategory: "NONE", confirmationRequired: false, citations: [{ text: quote, url: read.url, readAt: read.readAt }], checkedPages: [{ url: read.url, readAt: read.readAt }] };
  assert.equal(scoringResponse(answer, read).citations[0]!.readId, "read");
  for (const patch of [{ url: "https://merchant.example/other" }, { readAt: "2026-10-27T09:59:00Z" }]) {
    assert.throws(() => scoringResponse({ ...answer, citations: [{ ...answer.citations[0]!, ...patch }] }, read), /CITATION_NOT_BOUND/);
  }
});

test("G1 execution CLI runs while answer-file reads are denied, with a working canary", async () => {
  const directory = await temporary(), execFile = promisify(childExec);
  const guard = "./src/harness/browser/fixtures/fact-qa-runner/deny-reference-reads.mjs";
  try {
    await assert.rejects(execFile(process.execPath, ["--import", guard, "--input-type=module", "-e",
      "import {readFile} from 'node:fs/promises'; await readFile('.eval-artifacts/phase3b/g1-qa/answers.reviewed.json');"], { timeout: 10_000 }), error => String(error).includes("RUNNER_REFERENCE_READ_FORBIDDEN"));
    const result = await execFile(process.execPath, ["--import", guard, "--import", "tsx", "src/eval/restaurant/fact-qa/run-bound-questions.ts",
      "--questions", questions, "--out", join(directory, "cli-execution"), "--code-ref", "0".repeat(40), "--fixture", "not-stated"], { timeout: 20_000 });
    assert.equal(JSON.parse(result.stdout).executed, 3);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("G1 reviewed Q28/Q30 run both permitted outcomes through actual core and independent references", async () => {
  // Saved public source bytes + locally scripted model; not website replay or model quality.
  const directory = await temporary();
  try {
    const dataset = JSON.parse(await readFile(".eval-artifacts/phase3b/g1-qa/questions.json", "utf8"));
    const selected = dataset.questions.filter((question: { id: string }) => ["G1-Q28", "G1-Q30"].includes(question.id));
    const subset = { ...dataset, questions: selected, pages: dataset.pages.filter((page: { id: string }) => selected.some((question: { pageId: string }) => question.pageId === page.id)) };
    const questions = join(directory, "questions.json"); await writeFile(questions, JSON.stringify(subset));
    for (const kind of ["NOT_STATED", "ANSWERED"] as const) {
      const selections = selected.map((question: { id: string; question: string }) => question.id === "G1-Q28"
        ? { question: question.question, sensitiveCategory: "ALLERGY" as const, ...(kind === "ANSWERED" ? { quote: "Allergy information available", answer: "The page states “Allergy information available”. This is not a safety guarantee." } : {}) }
        : { question: question.question, sensitiveCategory: "RELIGIOUS_DIET" as const, ...(kind === "ANSWERED" ? { quote: "Beef short rib steak", answer: "The menu lists “Beef short rib steak”. This is not halal certification." } : {}) });
      const output = join(directory, kind);
      await runBoundQuestions({ questions, output, codeRef: "0".repeat(40), model: fixtureQuestionModel(selections), signal: AbortSignal.timeout(30_000) });
      const raw = JSON.parse(await readFile(join(output, "core-results.json"), "utf8"));
      assert.deepEqual(raw.map((row: { answer: QuestionOutcome }) => row.answer.status), [kind, kind]);
      for (const row of raw) { assert.equal(row.raw.confirmationRequired, true); assert.equal(row.answer.confirmationRequired, true); }
      const responses = JSON.parse(await readFile(join(output, "responses.json"), "utf8"));
      assert.deepEqual(responses.map((row: { answer: { confirmationRequired: boolean } }) => row.answer.confirmationRequired), [true, true]);
      const result = await runQaEvaluation({ questions, references: ".eval-artifacts/phase3b/g1-qa/answers.reviewed.json", responses: join(output, "responses.json"), reads: join(output, "reads.json"), output: join(directory, kind + "-evaluation.json") });
      assert.equal(result.status, "PASS"); assert.equal(result.falseClaimCount, 0);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
