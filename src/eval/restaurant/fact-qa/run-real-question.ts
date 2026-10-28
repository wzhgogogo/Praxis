import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DeepSeekModelGateway } from "../../../infrastructure/deepseek/deepseek-model-gateway.js";
import type { ModelGateway } from "../../../core/model/contracts.js";
import { runBoundQuestions } from "./run-bound-questions.js";
import { fixtureQuestionModel } from "./core-adapter.js";

// One immutable question/attempt per process. References are denied by preload.
const args = process.argv.slice(2);
const arg = (name: string) => { const i = args.indexOf(name); if (i < 0 || !args[i + 1]) throw new Error("MISSING_ARGUMENT"); return args[i + 1]!; };
const id = arg("--question"), repetition = Number(arg("--repetition")), output = resolve(arg("--out"));
if (!/^Q(?:0[1-9]|[12][0-9]|3[0-4])$/.test(id) || ![1, 2, 3].includes(repetition)) throw new Error("INVALID_SLOT");
const fixture = args.includes("--fixture"), ledgerPath = ".eval-artifacts/phase3b/budget.json";
const started = new Date().toISOString();
const gateway = fixture ? fixtureQuestionModel() : DeepSeekModelGateway.fromEnvironment(process.env, {
  fetchImplementation: async (input, init) => {
    const url = new URL(String(input));
    if (url.origin !== "https://api.deepseek.com" || !["/chat/completions", "/beta/chat/completions"].includes(url.pathname) || init?.method !== "POST") throw new Error("ONLY_APPROVED_MODEL_ENDPOINT");
    return fetch(input, { ...init, redirect: "error" });
  },
});
let calls = 0;
const model: ModelGateway = { complete: async request => {
  if (++calls > 1) throw new Error("NO_SCHEMA_OR_AUTOMATIC_RETRY");
  if (!fixture) {
    const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
    const entryId = `phase3b-A-g1-real-${id}-r${repetition}`;
    if (ledger.entries.some((row: { id: string }) => row.id === entryId)) throw new Error("SLOT_ALREADY_CHARGED");
    const used = ledger.entries.filter((row: { id: string }) => row.id.startsWith("phase3b-A-g1-real-")).reduce((n: number, row: { realModelCalls: number }) => n + row.realModelCalls, 0);
    if (used >= 120 || ledger.cumulative.realModelCalls >= ledger.limits.realModelCalls) throw new Error("MODEL_BUDGET_EXHAUSTED");
    ledger.entries.push({ id: entryId, recordedAtUTC: new Date().toISOString(), conversation: "A", mode: "REAL_MODEL_SAVED_PAGES", questionId: id, repetition,
      fullLive: 0, realModelCalls: 1, environmentReruns: 0, evaluationPublicGET: 0, googleRequests: 0, restaurantWebsiteRequests: 0 });
    ledger.cumulative.realModelCalls++; await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
  }
  await writeFile(resolve(output, "model-request.json"), JSON.stringify(request, null, 2) + "\n", { flag: "wx" });
  try {
    const result = await gateway.complete(request);
    await writeFile(resolve(output, "model-response.json"), JSON.stringify(result, null, 2) + "\n", { flag: "wx" }); return result;
  } catch (error) {
    const value = error as { code?: string; providerStatus?: number };
    await writeFile(resolve(output, "model-error.json"), JSON.stringify({ code: value.code ?? "UNKNOWN", providerStatus: value.providerStatus ?? null }) + "\n", { flag: "wx" }); throw error;
  }
} };
try {
  const run = await runBoundQuestions({ questions: `.eval-artifacts/phase3b/g1-real-model/inputs/G1-${id}.json`, output: resolve(output, "execution"), codeRef: arg("--code-ref"), model, signal: AbortSignal.timeout(120_000) });
  await writeFile(resolve(output, "finished.json"), JSON.stringify({ started, finished: new Date().toISOString(), fixture, calls, run }, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ question: id, repetition, calls, executed: run.executed, statusCounts: run.statusCounts }));
} catch (error) {
  if (fixture) console.error(error);
  await writeFile(resolve(output, "failed.json"), JSON.stringify({ started, finished: new Date().toISOString(), fixture, calls, reason: "EXECUTION_FAILED_SEE_SANITIZED_RECORDS" }) + "\n", { flag: "wx" }); process.exitCode = 1;
}
