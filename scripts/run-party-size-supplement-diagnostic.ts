import { mkdir, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { resolve } from "node:path";

import type { ModelGateway, ModelRequest, ModelResponse } from "../src/core/model/contracts.js";
import { ModelGatewayError } from "../src/core/model/errors.js";
import { RESTAURANT_PARTY_SIZE_SUPPLEMENT_PROMPT_VERSION, RESTAURANT_PARTY_SIZE_SUPPLEMENT_SCHEMA, RestaurantPartySizeSupplementResolver, type RestaurantPartySizeSupplementResult } from "../src/domains/restaurant/party-size-supplement-resolver.js";
import { DeepSeekModelGateway } from "../src/infrastructure/deepseek/deepseek-model-gateway.js";

const MODE = process.env.PRAXIS_PARTY_SIZE_SUPPLEMENT_DIAGNOSTIC_MODE ?? "run";
const runId = `party-size-wire-gate-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`;
const root = resolve(".eval-artifacts", "party-size-supplement-wire-gate-2026-09-18", runId);
type Expected = { status: "RESOLVED"; partySize: number } | { status: "UNKNOWN" };
type Sample = { id: string; category: "h002" | "closed_relational" | "double_date" | "open_party"; message: string; expected: Expected };
const samples: readonly Sample[] = [
  { id: "h002-bare-closed-pair", category: "h002", message: "Please find a table in Shibuya tomorrow at 7 for a first date.", expected: { status: "RESOLVED", partySize: 2 } },
  { id: "closed-relational", category: "closed_relational", message: "Find dinner in Shibuya tomorrow at 7 for my parents and me.", expected: { status: "RESOLVED", partySize: 3 } },
  { id: "double-date", category: "double_date", message: "Find dinner in Ginza tomorrow at 19:30 for a double date.", expected: { status: "RESOLVED", partySize: 4 } },
  { id: "open-party", category: "open_party", message: "Find dinner in Shimokitazawa tomorrow evening for a group date.", expected: { status: "UNKNOWN" } },
];
function draft() { return { schemaVersion: "3" as const, timezone: "Asia/Tokyo" as const, target: { goal: "AVAILABILITY" as const, query: "find a table" }, date: "2026-09-19", timeWindow: { earliest: "19:00", latest: "19:00" }, area: { query: "Shibuya" }, criteria: [] }; }
function actual(result: RestaurantPartySizeSupplementResult): Record<string, unknown> {
  if (result.status === "RESOLVED") return { status: result.status, partySize: result.partySize, attempts: result.attempts };
  if (result.status === "UNKNOWN") return { status: result.status, attempts: result.attempts };
  return { status: result.status, ...("errorCode" in result ? { errorCode: result.errorCode, retryable: result.retryable } : { errors: result.errors }), attempts: result.attempts };
}
function pass(expected: Expected, result: RestaurantPartySizeSupplementResult) { return result.status === "RESOLVED" && expected.status === "RESOLVED" ? result.partySize === expected.partySize : result.status === expected.status; }

async function main() {
  const frozenPlan = {
    frozenAt: new Date().toISOString(),
    sampleSetSha256: createHash("sha256").update(JSON.stringify(samples)).digest("hex"),
    samples,
    model: process.env.DEEPSEEK_MODEL ?? "<provider-default>",
    temperature: 0,
    thinking: "disabled",
    timeoutMs: 30_000,
    retries: 0,
    promptVersion: RESTAURANT_PARTY_SIZE_SUPPLEMENT_PROMPT_VERSION,
    outputSchema: RESTAURANT_PARTY_SIZE_SUPPLEMENT_SCHEMA,
    plannedCalls: samples.length * 2,
  };
  if (MODE === "preflight") { DeepSeekModelGateway.fromEnvironment(process.env); console.log(JSON.stringify({ status: "PREFLIGHT_OK", schemaComposition: "non-empty-object-root-wire", plannedCalls: frozenPlan.plannedCalls, frozenPlan }, null, 2)); return; }
  await mkdir(root, { recursive: true });
  await writeFile(resolve(root, "plan-reference.json"), JSON.stringify(frozenPlan, null, 2));
  const ledger: Record<string, unknown>[] = []; const records: Record<string, unknown>[] = [];
  const provider = DeepSeekModelGateway.fromEnvironment(process.env); let number = 0;
  const model: ModelGateway = { async complete(request: ModelRequest): Promise<ModelResponse> {
    const callId = `${String(++number).padStart(2, "0")}:${request.taskId}`;
    ledger.push({ at: new Date().toISOString(), callId, phase: "PRE_DISPATCH_RESERVED", purpose: request.purpose, promptVersion: request.promptVersion, schemaComposition: "non-empty-object-root-wire" });
    try { const response = await provider.complete(request); records.push({ callId, request, response }); ledger.push({ at: new Date().toISOString(), callId, phase: "COMPLETED", latencyMs: response.latencyMs, usage: response.usage }); return response; }
    catch (error) { ledger.push({ at: new Date().toISOString(), callId, phase: "FAILED", diagnostic: error instanceof ModelGatewayError ? { code: error.code, retryable: error.retryable, providerStatus: error.providerStatus, providerRequestId: error.providerRequestId, providerError: error.providerError } : { code: "UNEXPECTED" } }); throw error; }
  } };
  const resolver = new RestaurantPartySizeSupplementResolver(model); const rows: Record<string, unknown>[] = [];
  for (const sample of samples) for (let repeat = 1; repeat <= 2; repeat += 1) { const result = await resolver.resolve({ taskId: `${runId}:${sample.id}:r${repeat}`, message: sample.message, currentDraft: draft() }); rows.push({ sampleId: sample.id, category: sample.category, repeat, expected: sample.expected, actual: actual(result), passed: pass(sample.expected, result) }); }
  const grouped = samples.map((sample) => { const entries = rows.filter((row) => row.sampleId === sample.id); return { sampleId: sample.id, category: sample.category, expected: sample.expected, passes: entries.filter((row) => row.passed).length, total: entries.length, entries }; });
  const accepted = grouped.every((entry) => entry.passes === 2);
  await writeFile(resolve(root, "ledger.json"), JSON.stringify(ledger, null, 2)); await writeFile(resolve(root, "records.json"), JSON.stringify(records, null, 2));
  await writeFile(resolve(root, "result.json"), JSON.stringify({ status: accepted ? "ACCEPTED" : "REJECTED", runId, schemaComposition: "non-empty-object-root-wire", scope: { plannedCalls: frozenPlan.plannedCalls, dispatchedCalls: number, retries: 0, google: 0, browser: 0, booking: 0 }, grouped }, null, 2));
  console.log(JSON.stringify({ status: accepted ? "ACCEPTED" : "REJECTED", root, calls: number }, null, 2));
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
