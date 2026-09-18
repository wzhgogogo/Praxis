import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";

import type { ModelRequest, ModelResponse } from "../src/core/model/contracts.js";
import { ModelGatewayError } from "../src/core/model/errors.js";
import type { RestaurantIntentDraft } from "../src/domains/restaurant/contracts.js";
import { applyRestaurantIntentPatch } from "../src/domains/restaurant/intent-state.js";
import { compileRestaurantSemanticProposal } from "../src/domains/restaurant/semantic-compiler.js";
import { buildRestaurantSemanticInterpreterSystemPrompt, RESTAURANT_SEMANTIC_MAX_OUTPUT_TOKENS, RESTAURANT_SEMANTIC_REQUEST_TIMEOUT_MS } from "../src/domains/restaurant/semantic-interpreter.js";
import { RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA, RESTAURANT_SEMANTIC_PROPOSAL_PROMPT_VERSION, RESTAURANT_SEMANTIC_PROPOSAL_PURPOSE, RESTAURANT_SEMANTIC_PROPOSAL_SCHEMA, type RestaurantSemanticProposal, validateRestaurantSemanticProposal } from "../src/domains/restaurant/semantic-proposal.js";
import { DeepSeekModelGateway } from "../src/infrastructure/deepseek/deepseek-model-gateway.js";

/** Diagnostic-only: two independent full-parser A/variant experiments, one request per ledger reservation. */
const ROOT = resolve(import.meta.dirname, "..");
const SOURCE_ARTIFACT = resolve(ROOT, ".eval-artifacts/restaurant-semantic-targeted-repair/semantic-targeted-repair-2026-09-18T05-51-04-450Z.result.json");
const OUTPUT_DIRECTORY = resolve(ROOT, ".eval-artifacts/semantic-rule-expression-diagnostic-2026-09-18");
const REFERENCE_COMMIT = "01e073f6dbde651c14661d6b2a093a78ce0bf47b";
const MODE = process.env.PRAXIS_RULE_EXPRESSION_DIAGNOSTIC_MODE ?? "preflight";
const execFileAsync = promisify(execFile);
if (MODE !== "preflight" && MODE !== "run") throw new Error("PRAXIS_RULE_EXPRESSION_DIAGNOSTIC_MODE must be preflight or run");

type PartyExpected = { value: number; source: "EXPLICIT" | "INFERRED_CLOSED_PARTY" } | "OMIT";
type CriterionExpected = { phrase: string; strength: "HARD" | "SOFT" | "UNSPECIFIED" };
type Sample = { id: string; message: string; referenceTime: string; expected: { party?: PartyExpected; criteria: readonly CriterionExpected[] } };
type ExperimentId = "H002_PARTY_RULE_EXPRESSION" | "H003_LOCAL_SCOPE_EXPRESSION";
type Variant = "A_FULL_V19" | "D_FULL_PARTY_RULE_REWRITE" | "E_FULL_LOCAL_SCOPE_REWRITE";
type Call = { ordinal: number; callId: string; sample: Sample; repeat: 1 | 2 | 3; variant: Variant; request: ModelRequest; promptSha256: string };

const PARTY_REWRITE = `## PARTY SIZE

Prefer an explicit total.

Do not require all participants to be explicitly named. A party is closed when the
message semantically identifies exactly who is participating, even if a relationship
rather than a list describes them. Infer a count only when adding another participant
would contradict the utterance; this is permitted semantic inference, not a
user-provided number.

The speaker counts when participating, and a singular counterpart contributes one.
A clearly two-person encounter can identify the speaker and that counterpart even
without enumerating both. Do not require a numeral for this closed set.

Do not infer a count from an occasion, group type, or typical social situation whose
participant set remains open. Additional unspecified attendees leave the total open.
Do not use customary, average, or statistically typical group sizes. Omit PARTY_SIZE
when the total remains unclear.

`;

const LOCAL_SCOPE_OLD = `Scope approximation and optionality to the condition they modify. A flexible
budget or optional amenity does not soften adjacent unqualified requirements.
Conversely, one required feature does not make neighboring preferences mandatory.

`;
const LOCAL_SCOPE_REWRITE = `Determine each criterion independently from the user's syntax and meaning.
Optionality belongs only to the condition it directly modifies: words such as
"ideally", "preferably", "if possible", and "nice to have" soften only their
attached condition. A nearby required activity or defining selection condition does
not become optional because another condition in the same sentence is approximate or
optional. Likewise, one HARD condition does not make adjacent preferences HARD.

`;

function hash(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function normal(value: string): string { return value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, " ").trim(); }
function block(prompt: string, startMarker: string, endMarker: string): { start: number; end: number; text: string } {
  const start = prompt.indexOf(startMarker); const end = prompt.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`Cannot locate prompt block ${startMarker}`);
  return { start, end, text: prompt.slice(start, end) };
}
function replaceOnly(prompt: string, oldText: string, nextText: string): { prompt: string; validation: Record<string, unknown> } {
  const start = prompt.indexOf(oldText);
  if (start < 0 || prompt.indexOf(oldText, start + oldText.length) >= 0) throw new Error("Expected exactly one replaceable prompt block");
  const next = prompt.slice(0, start) + nextText + prompt.slice(start + oldText.length);
  const validation = {
    originalOccurrences: prompt.split(oldText).length - 1,
    replacementOccurrences: next.split(nextText).length - 1,
    prefixIdentical: prompt.slice(0, start) === next.slice(0, start),
    suffixIdentical: prompt.slice(start + oldText.length) === next.slice(start + nextText.length),
    oldSha256: hash(oldText), nextSha256: hash(nextText),
  };
  if (!validation.prefixIdentical || !validation.suffixIdentical || validation.originalOccurrences !== 1 || validation.replacementOccurrences !== 1) throw new Error(`Prompt diff validation failed: ${JSON.stringify(validation)}`);
  return { prompt: next, validation };
}
function variantPrompt(a: string, variant: Variant): { prompt: string; validation: Record<string, unknown> } {
  if (variant === "A_FULL_V19") return { prompt: a, validation: { variant: "A_FULL_V19", exactProductionPrompt: true } };
  if (variant === "D_FULL_PARTY_RULE_REWRITE") {
    const original = block(a, "## PARTY SIZE", "## AREA").text;
    return replaceOnly(a, original, PARTY_REWRITE);
  }
  return replaceOnly(a, LOCAL_SCOPE_OLD, LOCAL_SCOPE_REWRITE);
}
function proposal(response: ModelResponse): { status: "PROPOSED"; proposal: RestaurantSemanticProposal } | { status: "INVALID_MODEL_OUTPUT"; errors: readonly string[] } {
  if (response.finishReason !== "TOOL_CALLS") return { status: "INVALID_MODEL_OUTPUT", errors: [`finishReason=${response.finishReason}`] };
  try { const checked = validateRestaurantSemanticProposal(JSON.parse(response.outputText)); return checked.valid ? { status: "PROPOSED", proposal: checked.value } : { status: "INVALID_MODEL_OUTPUT", errors: checked.errors }; }
  catch { return { status: "INVALID_MODEL_OUTPUT", errors: ["not valid JSON"] }; }
}
function partyScore(sample: Sample, parsed: RestaurantSemanticProposal | undefined) {
  const facts = parsed?.facts.filter((fact) => fact.field === "PARTY_SIZE") ?? []; const expected = sample.expected.party;
  if (expected === undefined) return { score: "NOT_APPLICABLE", expected: null, facts };
  if (expected === "OMIT") return { score: facts.length === 0 ? "PASS" : "FAIL", expected, facts, reason: facts.length === 0 ? undefined : "unexpected party fact" };
  const one = facts.length === 1 ? facts[0] : undefined; const value = one?.value?.kind === "PARTY_SIZE" ? one.value : undefined;
  const pass = one?.operation === "ASSERT" && value?.value === expected.value && value.source === expected.source;
  return { score: pass ? "PASS" : "FAIL", expected, facts, value: value?.value, source: value?.source, operation: one?.operation, reason: pass ? undefined : facts.length === 0 ? "omitted" : facts.length > 1 ? "duplicate/conflicting facts" : "wrong operation/value/source" };
}
function criterionScore(sample: Sample, parsed: RestaurantSemanticProposal | undefined) {
  const actual = parsed?.facts.filter((fact) => fact.field === "CRITERION" && fact.value?.kind === "CRITERION").map((fact) => ({ text: fact.value!.text, polarity: fact.value!.polarity, strength: fact.value!.strength })) ?? [];
  const used = new Set<number>();
  const checks = sample.expected.criteria.map((expected) => {
    const phrase = normal(expected.phrase); const index = actual.findIndex((item, i) => !used.has(i) && (normal(item.text).includes(phrase) || phrase.includes(normal(item.text))));
    if (index >= 0) used.add(index); const observed = index >= 0 ? actual[index] : undefined;
    return { expected: { text: expected.phrase, polarity: "NOT_CAPTURED", strength: expected.strength }, actual: observed ?? null, textRelation: observed ? normal(observed.text) === phrase ? "TEXT_EQUIVALENT" : "TERM_MATCH_REVIEW" : "OMITTED_OR_UNRESOLVED", strength: observed?.strength === expected.strength ? "PASS" : "FAIL", polarity: "NOT_SCORED_EXPECTATION_MISSING" };
  });
  return { score: checks.every((item) => item.strength === "PASS") ? "PASS" : "FAIL", checks, unmatchedActual: actual.filter((_, i) => !used.has(i)) };
}
function safeFailure(error: unknown): Record<string, unknown> { return error instanceof ModelGatewayError ? { errorCode: error.code, retryable: error.retryable, providerStatus: error.providerStatus } : { errorCode: "UNEXPECTED_GATEWAY_ERROR", retryable: false }; }
async function gitState() { const [head, status] = await Promise.all([execFileAsync("git", ["rev-parse", "HEAD"], { cwd: ROOT }), execFileAsync("git", ["status", "--short"], { cwd: ROOT })]); return { head: head.stdout.trim(), shortStatus: status.stdout.trim() }; }
async function loadSamples(): Promise<readonly Sample[]> { const source = JSON.parse(await readFile(SOURCE_ARTIFACT, "utf8")) as { semantic?: { samples?: Sample[] } }; if (!source.semantic?.samples) throw new Error("Preserved source samples unavailable"); return source.semantic.samples; }
function experimentSamples(all: readonly Sample[], id: ExperimentId): readonly Sample[] { const wanted = id === "H002_PARTY_RULE_EXPRESSION" ? ["h002-original", "party-closed-singular-counterpart", "party-open-attendees", "party-explicit-total-overrides-relationship"] : ["h003-original", "strength-defining-activity-and-drinks", "strength-explicitly-flexible-improvements", "strength-local-optionality-scope"]; const map = new Map(all.map((sample) => [sample.id, sample])); const samples = wanted.map((key) => map.get(key)); if (samples.some((sample) => sample === undefined)) throw new Error(`Missing preserved sample for ${id}`); return samples as Sample[]; }
function callsFor(id: ExperimentId, samples: readonly Sample[], runId: string): { calls: readonly Call[]; diff: Record<string, unknown> } {
  const calls: Call[] = []; const changed: Variant = id === "H002_PARTY_RULE_EXPRESSION" ? "D_FULL_PARTY_RULE_REWRITE" : "E_FULL_LOCAL_SCOPE_REWRITE"; let diff: Record<string, unknown> | undefined;
  for (const sample of samples) {
    const sequence: readonly Variant[] = ["A_FULL_V19", changed, changed, "A_FULL_V19", "A_FULL_V19", changed];
    sequence.forEach((variant, index) => { const repeat = (Math.floor(index / 2) + 1) as 1 | 2 | 3; const callId = `${runId}:${String(calls.length + 1).padStart(2, "0")}:${sample.id}:${variant}:r${repeat}`; const a = buildRestaurantSemanticInterpreterSystemPrompt({ referenceTime: sample.referenceTime, timezone: "Asia/Tokyo", retryAttempt: 1 }); const built = variantPrompt(a, variant); if (variant !== "A_FULL_V19") diff ??= built.validation; const request: ModelRequest = { taskId: callId, purpose: RESTAURANT_SEMANTIC_PROPOSAL_PURPOSE, promptVersion: variant === "A_FULL_V19" ? RESTAURANT_SEMANTIC_PROPOSAL_PROMPT_VERSION : variant === "D_FULL_PARTY_RULE_REWRITE" ? "diagnostic-party-rule-rewrite@1" : "diagnostic-local-scope-rewrite@1", messages: [{ role: "system", content: built.prompt }, { role: "user", content: `User restaurant message as JSON string: ${JSON.stringify(sample.message)}` }], responseFormat: "JSON_SCHEMA", outputSchema: { ...RESTAURANT_SEMANTIC_PROPOSAL_SCHEMA, jsonSchema: RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA }, timeoutMs: RESTAURANT_SEMANTIC_REQUEST_TIMEOUT_MS, fallback: "STRUCTURED_FORM", maxOutputTokens: RESTAURANT_SEMANTIC_MAX_OUTPUT_TOKENS, temperature: 0, thinking: "disabled" }; calls.push({ ordinal: calls.length + 1, callId, sample, repeat, variant, request, promptSha256: hash(built.prompt) }); });
  }
  if (calls.length !== 24) throw new Error(`Expected 24 calls for ${id}`); return { calls, diff: diff ?? {} };
}
async function appendLedger(path: string, value: Record<string, unknown>) { await appendFile(path, `${JSON.stringify(value)}\n`); }

async function runExperiment(id: ExperimentId, allSamples: readonly Sample[], git: Awaited<ReturnType<typeof gitState>>, provider: DeepSeekModelGateway): Promise<{ resultPath: string; runId: string }> {
  const runId = `${id.toLowerCase()}-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`; const samples = experimentSamples(allSamples, id); const { calls, diff } = callsFor(id, samples, runId);
  const planPath = resolve(OUTPUT_DIRECTORY, `${runId}.plan.json`); const startedPath = resolve(OUTPUT_DIRECTORY, `${runId}.started.json`); const resultPath = resolve(OUTPUT_DIRECTORY, `${runId}.result.json`); const ledgerPath = resolve(OUTPUT_DIRECTORY, `${runId}.ledger.jsonl`);
  await writeFile(planPath, JSON.stringify({ runId, experiment: id, referenceCommit: REFERENCE_COMMIT, git, cohort: "DEVELOPMENT_DIAGNOSTIC", contaminationStatus: "PROMPT_AND_RESULT_EXPOSED", baselineEligible: false, samples, promptDiffValidation: diff, budget: { plannedModelCalls: 24, retries: 0, externalSourceCalls: 0, browserCalls: 0 }, schedule: "per sample r1 A→variant; r2 variant→A; r3 A→variant", calls }, null, 2));
  await writeFile(startedPath, JSON.stringify({ runId, experiment: id, status: "STARTED", startedAt: new Date().toISOString(), planPath, ledgerPath, budget: { plannedModelCalls: 24, retries: 0 } }, null, 2));
  const records: unknown[] = [];
  for (const call of calls) {
    await appendLedger(ledgerPath, { at: new Date().toISOString(), status: "RESERVED", ordinal: call.ordinal, callId: call.callId, sampleId: call.sample.id, variant: call.variant, repeat: call.repeat, preDispatchDebit: true });
    try {
      const response = await provider.complete(call.request); const normalized = proposal(response); const compilation = normalized.status === "PROPOSED" ? compileRestaurantSemanticProposal(normalized.proposal, { referenceTime: call.sample.referenceTime, timezone: "Asia/Tokyo" }) : undefined; const draft: RestaurantIntentDraft | undefined = compilation?.status === "COMPILED" ? applyRestaurantIntentPatch(undefined, compilation.patch) : undefined; const parsed = normalized.status === "PROPOSED" ? normalized.proposal : undefined;
      const record = { ordinal: call.ordinal, callId: call.callId, sampleId: call.sample.id, repeat: call.repeat, variant: call.variant, request: call.request, response, normalized, compilation, draft, assessment: { party: partyScore(call.sample, parsed), criteria: criterionScore(call.sample, parsed), nonTargetFacts: parsed?.facts.filter((fact) => fact.field !== "PARTY_SIZE" && fact.field !== "CRITERION") ?? [] } };
      records.push(record); await writeFile(resolve(OUTPUT_DIRECTORY, `${runId}.call-${String(call.ordinal).padStart(2, "0")}.json`), JSON.stringify(record, null, 2)); await appendLedger(ledgerPath, { at: new Date().toISOString(), status: "COMPLETED", ordinal: call.ordinal, callId: call.callId, provider: response.provider, model: response.model, finishReason: response.finishReason, latencyMs: response.latencyMs, usage: response.usage });
    } catch (error) { const failure = safeFailure(error); const record = { ordinal: call.ordinal, callId: call.callId, sampleId: call.sample.id, repeat: call.repeat, variant: call.variant, request: call.request, failure }; records.push(record); await writeFile(resolve(OUTPUT_DIRECTORY, `${runId}.call-${String(call.ordinal).padStart(2, "0")}.json`), JSON.stringify(record, null, 2)); await appendLedger(ledgerPath, { at: new Date().toISOString(), status: "FAILED", ordinal: call.ordinal, callId: call.callId, ...failure }); }
  }
  await writeFile(resultPath, JSON.stringify({ runId, experiment: id, status: "COMPLETED", completedAt: new Date().toISOString(), referenceCommit: REFERENCE_COMMIT, git, cohort: "DEVELOPMENT_DIAGNOSTIC", contaminationStatus: "PROMPT_AND_RESULT_EXPOSED", baselineEligible: false, planPath, ledgerPath, budget: { plannedModelCalls: 24, reservedCalls: 24, records: records.length, retries: 0, externalSourceCalls: 0, browserCalls: 0 }, records }, null, 2)); return { resultPath, runId };
}
async function main() {
  await mkdir(OUTPUT_DIRECTORY, { recursive: true }); const lockPath = resolve(OUTPUT_DIRECTORY, "ACTIVE.lock.json");
  try { await readFile(lockPath, "utf8"); throw new Error(`An active diagnostic lock exists: ${lockPath}`); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const git = await gitState(); if (git.head !== REFERENCE_COMMIT) throw new Error(`HEAD ${git.head} is not ${REFERENCE_COMMIT}`); const samples = await loadSamples();
  const preflight = (id: ExperimentId) => { const { calls, diff } = callsFor(id, experimentSamples(samples, id), `preflight-${id}`); return { id, calls: calls.length, promptDiffValidation: diff }; };
  if (MODE === "preflight") { DeepSeekModelGateway.fromEnvironment(process.env); console.log(JSON.stringify({ status: "PREFLIGHT_OK", git, experiments: [preflight("H002_PARTY_RULE_EXPRESSION"), preflight("H003_LOCAL_SCOPE_EXPRESSION")] }, null, 2)); return; }
  const lock = await open(lockPath, "wx"); await lock.writeFile(JSON.stringify({ status: "RUNNING", startedAt: new Date().toISOString(), experiments: 2, plannedCalls: 48 }, null, 2)); await lock.close();
  try { const provider = DeepSeekModelGateway.fromEnvironment(process.env); const party = await runExperiment("H002_PARTY_RULE_EXPRESSION", samples, git, provider); const strength = await runExperiment("H003_LOCAL_SCOPE_EXPRESSION", samples, git, provider); console.log(JSON.stringify({ status: "COMPLETED", party, strength }, null, 2)); }
  finally { await rm(lockPath, { force: true }); }
}
void main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
