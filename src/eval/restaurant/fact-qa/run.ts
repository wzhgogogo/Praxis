import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { independentPageText } from "./independent-text.js";
import { FACT_QA_SCORER, scoreQaAnswer, type QaResponse, type QaReference } from "./scorer.js";

export async function runQaEvaluation(input: { questions: string; references: string; responses: string; reads: string; output: string }) {
  const questions = JSON.parse(await readFile(input.questions, "utf8")) as {
    pages: Array<{ id: string; pagePath: string; pageSha256: string; storageSha256: string; storageEncoding: string; outlet: { id: string } }>;
    questions: Array<{ id: string; pageId: string; type: string; displayedOutlet: { candidateId: string }; readContext: { runId: string }; sensitiveCategory?: string }>;
  };
  const references = JSON.parse(await readFile(input.references, "utf8")) as { answers: Array<{ questionId: string; status: QaReference["status"]; answerKind: QaReference["kind"]; candidateAnswer: string; approvedAnswers?: string[]; rejectedAnswers?: string[]; requiredQuotes?: string[]; forbiddenAnswerFragments?: string[]; confirmationRequired?: boolean; relatedAnswer?: QaReference["relatedAnswer"]; acceptedSensitiveCategories?: QaReference["acceptedSensitiveCategories"]; evidence: Array<{ quote: string }> }> };
  const unreviewed = questions.questions.filter(question => references.answers.find(answer => answer.questionId === question.id)?.status !== "REVIEWER_CONFIRMED").map(question => question.id);
  if (unreviewed.length) {
    const result = { scorer: FACT_QA_SCORER, status: "NOT_READY", reason: "CANDIDATE_ANSWERS_ARE_NOT_ACCEPTANCE_GOLD", unreviewed, evaluated: 0, falseClaimCount: null, modelCalls: 0, sourceCalls: 0 };
    await writeFile(input.output, JSON.stringify(result, null, 2) + "\n", { flag: "wx" }); return result;
  }
  // Reads are an independently retained Runner log, not fields authored by the model.
  const reads = JSON.parse(await readFile(input.reads, "utf8")) as Array<{ questionId: string; pageId: string; pageSha256: string; readId: string; runId: string }>;
  const responses = JSON.parse(await readFile(input.responses, "utf8")) as Array<{ questionId: string; answer: QaResponse }>;
  const text = new Map<string, string>();
  const rows = [];
  for (const question of questions.questions) {
    const page = questions.pages.find(page => page.id === question.pageId)!;
    const reference = references.answers.find(answer => answer.questionId === question.id)!;
    const read = reads.find(row => row.questionId === question.id), response = responses.find(row => row.questionId === question.id);
    if (!read || !response) { rows.push({ questionId: question.id, status: "NOT_EVALUATED", reasons: ["MISSING_RESPONSE_OR_RUNNER_READ"], falseClaimCount: null }); continue; }
    if (!text.has(page.id)) {
      const path = resolve(page.pagePath), local = relative(process.cwd(), path);
      if (local.startsWith("..") || local === "" || !/\.html(?:\.gz)?$/.test(local)) throw new Error("SOURCE_MUST_BE_REPOSITORY_SAVED_HTML");
      const stored = await readFile(path), body = page.storageEncoding === "gzip" ? gunzipSync(stored) : stored;
      if (createHash("sha256").update(stored).digest("hex") !== page.storageSha256 || createHash("sha256").update(body).digest("hex") !== page.pageSha256) throw new Error("QA_SOURCE_SHA_MISMATCH");
      text.set(page.id, await independentPageText(body.toString()));
    }
    rows.push({ questionId: question.id, ...scoreQaAnswer({ status: reference.status, kind: reference.answerKind,
      approvedAnswers: reference.approvedAnswers ?? [reference.candidateAnswer], ...(reference.rejectedAnswers ? { rejectedAnswers: reference.rejectedAnswers } : {}), requiredQuotes: reference.requiredQuotes ?? reference.evidence.map(row => row.quote), ...(reference.forbiddenAnswerFragments ? { forbiddenAnswerFragments: reference.forbiddenAnswerFragments } : {}),
      ...(reference.acceptedSensitiveCategories ? { acceptedSensitiveCategories: reference.acceptedSensitiveCategories } : {}),
      ...(reference.confirmationRequired !== undefined ? { confirmationRequired: reference.confirmationRequired } : {}), ...(reference.relatedAnswer ? { relatedAnswer: reference.relatedAnswer } : {}),
      targetOutletId: question.displayedOutlet.candidateId, targetRunId: question.readContext.runId, pageId: page.id, pageSha256: page.pageSha256, sensitiveCategory: question.sensitiveCategory === "RELIGIOUS_DIET" ? "RELIGIOUS_DIET" : question.sensitiveCategory === "ALLERGY" ? "ALLERGY" : question.sensitiveCategory === "ACCESSIBILITY" ? "ACCESSIBILITY" : "NONE", notStatedQuestion: question.type === "页面未说明" },
    { ...read, outletId: page.outlet.id, text: text.get(page.id)! }, response.answer) });
  }
  const result = { scorer: FACT_QA_SCORER, status: rows.every(row => row.status === "PASS") ? "PASS" : rows.some(row => row.status === "FAIL") ? "FAIL" : "NOT_EVALUATED", rows,
    falseClaimCount: rows.every(row => row.falseClaimCount !== null) ? rows.reduce((sum, row) => sum + (row.falseClaimCount ?? 0), 0) : null, modelCalls: 0, sourceCalls: 0 };
  await writeFile(input.output, JSON.stringify(result, null, 2) + "\n", { flag: "wx" }); return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (name: string) => { const index = process.argv.indexOf(name); if (index < 0 || !process.argv[index + 1]) throw new Error("Missing " + name); return resolve(process.argv[index + 1]!); };
  const result = await runQaEvaluation({ questions: arg("--questions"), references: arg("--references"), responses: arg("--responses"), reads: arg("--reads"), output: arg("--out") });
  console.log(JSON.stringify({ status: result.status, falseClaimCount: result.falseClaimCount }));
  if (result.status !== "PASS") process.exitCode = 1;
}
