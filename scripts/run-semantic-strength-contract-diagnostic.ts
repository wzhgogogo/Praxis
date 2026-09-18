import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { ModelGateway, ModelRequest, ModelResponse } from "../src/core/model/contracts.js";
import { ModelGatewayError } from "../src/core/model/errors.js";
import { compileRestaurantSemanticProposal } from "../src/domains/restaurant/semantic-compiler.js";
import { RestaurantSemanticInterpreter } from "../src/domains/restaurant/semantic-interpreter.js";
import { DeepSeekModelGateway } from "../src/infrastructure/deepseek/deepseek-model-gateway.js";

const MODE = process.env.PRAXIS_SEMANTIC_STRENGTH_CONTRACT_MODE ?? "preflight";
if (MODE !== "preflight" && MODE !== "run") throw new Error("PRAXIS_SEMANTIC_STRENGTH_CONTRACT_MODE must be preflight or run");
const runId = `semantic-strength-contract-v20-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`;
const root = resolve(".eval-artifacts", "semantic-strength-contract-2026-09-18", runId);
type Expected = { text: string; polarity: "POSITIVE" | "NEGATIVE"; strength: "HARD" | "SOFT" | "UNSPECIFIED" };
type Sample = { id: string; message: string; expected: readonly Expected[] };
const samples: readonly Sample[] = [
  { id: "h003", message: "Need a place for a team dinner nearby this Friday after work. 10 people, around 3,000 yen per person, good for drinks, ideally with a private room.", expected: [{ text: "team dinner", polarity: "POSITIVE", strength: "UNSPECIFIED" }, { text: "around 3,000 yen per person", polarity: "POSITIVE", strength: "SOFT" }, { text: "good for drinks", polarity: "POSITIVE", strength: "UNSPECIFIED" }, { text: "private room", polarity: "POSITIVE", strength: "SOFT" }] },
  { id: "hard-exclusion", message: "Find dinner in Ginza tomorrow at 7 for two people, no hot pot restaurant.", expected: [{ text: "hot pot restaurant", polarity: "NEGATIVE", strength: "HARD" }] },
  { id: "hard-core-venue-type", message: "Find a cafe in Shibuya tomorrow at 3 PM for two people.", expected: [{ text: "cafe", polarity: "POSITIVE", strength: "HARD" }] },
  { id: "soft-explicit-preference", message: "Find dinner in Shibuya tomorrow at 7 for two people; ideally a quiet place.", expected: [{ text: "quiet", polarity: "POSITIVE", strength: "SOFT" }] },
  { id: "ambiguous-capability", message: "Find dinner in Shibuya tomorrow at 7 for two people, good for drinks.", expected: [{ text: "good for drinks", polarity: "POSITIVE", strength: "UNSPECIFIED" }] },
  { id: "ambiguous-occasion", message: "Find dinner in Shibuya tomorrow at 7 for two people, for a team dinner.", expected: [{ text: "team dinner", polarity: "POSITIVE", strength: "UNSPECIFIED" }] },
];
function normal(value: string): string { return value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, " ").trim(); }
function hash(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function score(sample: Sample, result: Awaited<ReturnType<RestaurantSemanticInterpreter["interpret"]>>) {
  if (result.status !== "PROPOSED") return { pass: false, reason: result.status, actual: [] };
  const actual = result.proposal.facts.filter((fact) => fact.field === "CRITERION" && fact.value?.kind === "CRITERION").map((fact) => ({ text: fact.value!.text, polarity: fact.value!.polarity, strength: fact.value!.strength }));
  const expected = sample.expected.map((item) => ({ ...item, text: normal(item.text) }));
  const normalizedActual = actual.map((item) => ({ ...item, text: normal(item.text) }));
  const expectedKeys = expected.map((item) => `${item.text}|${item.polarity}|${item.strength}`).sort();
  const actualKeys = normalizedActual.map((item) => `${item.text}|${item.polarity}|${item.strength}`).sort();
  return { pass: JSON.stringify(expectedKeys) === JSON.stringify(actualKeys), expected, actual, expectedKeys, actualKeys };
}

async function main() {
  const plan = { runId, frozenAt: new Date().toISOString(), purpose: "H003 semantic strength contract", samples, sampleSetSha256: hash(samples), plannedCalls: 18, maxCalls: 18, repeats: 3, promptVersion: "v20", schemaVersion: "3", temperature: 0, thinking: "disabled", timeoutMs: 30_000, retries: 0, google: 0, browser: 0, booking: 0, modelConfigured: process.env.DEEPSEEK_MODEL ?? "<provider-default>" };
  if (MODE === "preflight") { DeepSeekModelGateway.fromEnvironment(process.env); console.log(JSON.stringify({ status: "PREFLIGHT_OK", plan }, null, 2)); return; }
  await mkdir(root, { recursive: true }); await writeFile(resolve(root, "plan.json"), JSON.stringify(plan, null, 2));
  const provider = DeepSeekModelGateway.fromEnvironment(process.env); const ledger: Record<string, unknown>[] = []; const records: Record<string, unknown>[] = []; let calls = 0;
  const model: ModelGateway = { async complete(request: ModelRequest): Promise<ModelResponse> {
    const callId = `${String(++calls).padStart(2, "0")}:${request.taskId}`;
    await writeFile(resolve(root, `call-${String(calls).padStart(2, "0")}.reserved.json`), JSON.stringify({ callId, request, status: "RESERVED", at: new Date().toISOString() }, null, 2));
    ledger.push({ callId, status: "RESERVED", at: new Date().toISOString(), purpose: request.purpose, promptVersion: request.promptVersion });
    try { const response = await provider.complete(request); ledger.push({ callId, status: "COMPLETED", provider: response.provider, model: response.model, usage: response.usage, latencyMs: response.latencyMs }); records.push({ callId, request, response }); return response; }
    catch (error) { const failure = error instanceof ModelGatewayError ? { code: error.code, retryable: error.retryable, providerStatus: error.providerStatus } : { code: "UNEXPECTED" }; ledger.push({ callId, status: "FAILED", ...failure }); throw error; }
  } };
  const interpreter = new RestaurantSemanticInterpreter(model); const rows: Record<string, unknown>[] = [];
  for (const sample of samples) for (let repeat = 1; repeat <= 3; repeat += 1) {
    const result = await interpreter.interpret({ taskId: `${runId}:${sample.id}:r${repeat}`, message: sample.message, referenceTime: "2026-09-18T09:00:00+09:00", timezone: "Asia/Tokyo" });
    const compilation = result.status === "PROPOSED" ? compileRestaurantSemanticProposal(result.proposal, { referenceTime: "2026-09-18T09:00:00+09:00", timezone: "Asia/Tokyo" }) : undefined;
    rows.push({ sampleId: sample.id, repeat, message: sample.message, expected: sample.expected, result, compilation, assessment: score(sample, result) });
  }
  const grouped = samples.map((sample) => { const entries = rows.filter((row) => row.sampleId === sample.id); return { sampleId: sample.id, passes: entries.filter((row) => (row.assessment as { pass: boolean }).pass).length, total: entries.length, entries }; });
  await writeFile(resolve(root, "ledger.json"), JSON.stringify(ledger, null, 2)); await writeFile(resolve(root, "transport-records.json"), JSON.stringify(records, null, 2));
  const accepted = calls <= 18 && grouped.every((entry) => entry.passes === 3);
  await writeFile(resolve(root, "result.json"), JSON.stringify({ status: accepted ? "ACCEPTED" : "REJECTED", runId, root, scope: { calls, plannedCalls: 18, retries: Math.max(0, calls - 18), google: 0, browser: 0, booking: 0 }, grouped }, null, 2));
  console.log(JSON.stringify({ status: accepted ? "ACCEPTED" : "REJECTED", root, calls }, null, 2));
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
