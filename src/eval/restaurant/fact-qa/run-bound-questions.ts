import { gunzipSync } from "node:zlib";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ModelGateway } from "../../../core/model/contracts.js";
import { independentPageText } from "./independent-text.js";
import { loadBoundQuestions, repositoryFile, sha256 } from "./bound-question-input.js";
import { fixtureQuestionModel, G1_CORE_ADAPTER, G1_CORE_REF, invokeQuestionCore, scoringResponse, type BoundRead } from "./core-adapter.js";

/** Execution phase only: neither imports the scorer nor accepts reference paths. */
export async function runBoundQuestions(input: { questions: string; output: string; codeRef: string; model: ModelGateway; signal: AbortSignal }) {
  if (!/^[a-f0-9]{40}$/.test(input.codeRef)) throw new Error("FROZEN_CODE_REF_REQUIRED");
  const source = await loadBoundQuestions(input.questions), pages = new Map<string, { html: string; text: string }>();
  // Materialize every source before calling the model; hash failures cause zero calls.
  for (const page of source.value.pages) {
    if (!/\.html(?:\.gz)?$/.test(page.pagePath)) throw new Error("QA_SOURCE_MUST_BE_SAVED_HTML");
    const stored = await readFile(await repositoryFile(page.pagePath)), raw = page.storageEncoding === "gzip" ? gunzipSync(stored) : stored;
    if (sha256(stored) !== page.storageSha256 || sha256(raw) !== page.pageSha256) throw new Error("QA_SOURCE_SHA_MISMATCH");
    pages.set(page.id, { html: raw.toString(), text: await independentPageText(raw.toString()) });
  }
  const output = resolve(input.output); await mkdir(output, { recursive: false });
  const coreResults: Array<{ questionId: string } & Awaited<ReturnType<typeof invokeQuestionCore>>> = [], reads: BoundRead[] = [], responses = [], invocations: Array<{ questionId: string; purpose: string; provider?: string; model?: string; elapsedMs: number }> = [];
  for (const question of source.value.questions) {
    input.signal.throwIfAborted();
    const page = source.value.pages.find(page => page.id === question.pageId)!, given = question.providedPage;
    const read: BoundRead = { questionId: question.id, pageId: page.id, pageSha256: page.pageSha256,
      readId: given.readId, runId: given.readRunId, outletId: given.candidateId, url: given.sourceUrl, readAt: given.observedAt, text: pages.get(page.id)!.text };
    const model: ModelGateway = { complete: async request => {
      const started = performance.now(), row = { questionId: question.id, purpose: request.purpose, elapsedMs: 0 };
      invocations.push(row);
      try { const result = await input.model.complete(request); Object.assign(row, { provider: result.provider, model: result.model }); return result; }
      finally { row.elapsedMs = performance.now() - started; }
    } };
    const now = new Date(Math.max(Date.parse(given.observedAt), Date.parse(question.readContext.startedAt)) + 1_000).toISOString();
    const result = await invokeQuestionCore({ question, page, ...pages.get(page.id)!, now }, model, input.signal);
    coreResults.push({ questionId: question.id, ...result }); reads.push(read);
    responses.push({ questionId: question.id, answer: scoringResponse(result.answer, read) });
  }
  const run = { mode: "OFFLINE_BOUND_SAVED_PAGES", codeRef: input.codeRef, coreRef: G1_CORE_REF, adapter: G1_CORE_ADAPTER,
    questionSetSha256: source.sha256, inputPages: source.value.pages.map(({ id, pageSha256, storageSha256 }) => ({ id, pageSha256, storageSha256 })),
    bindingOrigin: "LOCAL_CONSTRUCTED_OFFLINE_METADATA_NOT_PRODUCTION_IDENTITY_VERIFICATION", readClock: "SYNTHETIC_BOUND_READ_CLOCK_NOT_FRESH_WEB_READ",
    executed: coreResults.length, modelInvocations: invocations.length, providers: [...new Set(invocations.map(row => row.provider).filter(Boolean))], sourceTransportCalls: 0, freshReads: 0,
    statusCounts: Object.fromEntries(["ANSWERED", "NOT_STATED", "UNVERIFIED"].map(status => [status, coreResults.filter(row => row.answer.status === status).length])) };
  for (const [name, value] of Object.entries({ "core-results": coreResults, reads: reads.map(({ text: _text, ...read }) => read), responses, "model-invocations": invocations, run })) {
    await writeFile(resolve(output, name + ".json"), JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
  }
  return run;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), allowed = ["--questions", "--out", "--code-ref", "--fixture"];
  for (let index = 0; index < args.length; index += 2) if (!allowed.includes(args[index]!) || !args[index + 1]) throw new Error("INVALID_RUNNER_ARGUMENT");
  const arg = (name: string) => { const index = args.indexOf(name); if (index < 0 || !args[index + 1]) throw new Error("Missing " + name); return args[index + 1]!; };
  if (arg("--fixture") !== "not-stated") throw new Error("ONLY_FIXTURE_TRANSPORT_ENABLED_IN_THIS_BATCH");
  const result = await runBoundQuestions({ questions: arg("--questions"), output: arg("--out"), codeRef: arg("--code-ref"),
    model: fixtureQuestionModel(), signal: AbortSignal.timeout(120_000) });
  console.log(JSON.stringify(result));
}
