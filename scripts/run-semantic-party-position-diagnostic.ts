import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";

import type { ModelRequest, ModelResponse } from "../src/core/model/contracts.js";
import { ModelGatewayError } from "../src/core/model/errors.js";
import type { RestaurantIntentDraft } from "../src/domains/restaurant/contracts.js";
import { applyRestaurantIntentPatch } from "../src/domains/restaurant/intent-state.js";
import {
  RESTAURANT_SEMANTIC_MAX_OUTPUT_TOKENS,
  RESTAURANT_SEMANTIC_REQUEST_TIMEOUT_MS,
  buildRestaurantSemanticInterpreterSystemPrompt,
} from "../src/domains/restaurant/semantic-interpreter.js";
import { compileRestaurantSemanticProposal } from "../src/domains/restaurant/semantic-compiler.js";
import {
  RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA,
  RESTAURANT_SEMANTIC_PROPOSAL_PROMPT_VERSION,
  RESTAURANT_SEMANTIC_PROPOSAL_PURPOSE,
  RESTAURANT_SEMANTIC_PROPOSAL_SCHEMA,
  type RestaurantSemanticProposal,
  validateRestaurantSemanticProposal,
} from "../src/domains/restaurant/semantic-proposal.js";
import { DeepSeekModelGateway } from "../src/infrastructure/deepseek/deepseek-model-gateway.js";

/**
 * Diagnostic-only A/C experiment. It uses the real production Prompt@19
 * builder for A. C is created by moving exactly the existing PARTY SIZE
 * paragraph before TARGET. It never reaches production composition and calls
 * the gateway directly once per pre-reserved entry to prohibit retries.
 */

const ROOT = resolve(import.meta.dirname, "..");
const SOURCE_ARTIFACT = resolve(
  ROOT,
  ".eval-artifacts/semantic-field-scope-diagnostic-2026-09-18/semantic-field-scope-2026-09-18T06-52-33-743Z-3cfad038-39b8-4ac5-8c44-465949ce3f4f.result.json",
);
const OUTPUT_DIRECTORY = resolve(ROOT, ".eval-artifacts/semantic-party-position-diagnostic-2026-09-18");
const REFERENCE_COMMIT = "01e073f6dbde651c14661d6b2a093a78ce0bf47b";
const MODE = process.env.PRAXIS_PARTY_POSITION_DIAGNOSTIC_MODE ?? "preflight";
const execFileAsync = promisify(execFile);

if (MODE !== "preflight" && MODE !== "run") {
  throw new Error("PRAXIS_PARTY_POSITION_DIAGNOSTIC_MODE must be preflight or run");
}

type ExpectedParty = { value: number; source: "EXPLICIT" | "INFERRED_CLOSED_PARTY" } | "OMIT";
type Sample = {
  id: string;
  message: string;
  referenceTime: string;
  expected: { party?: ExpectedParty; criteria: readonly { phrase: string; strength: string }[] };
};
type Variant = "A_FULL_V19" | "C_FULL_PARTY_MOVED";
type PlannedCall = {
  ordinal: number;
  callId: string;
  sample: Sample;
  repeat: 1 | 2 | 3;
  variant: Variant;
  request: ModelRequest;
  promptSha256: string;
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function partyRange(prompt: string): { start: number; end: number; text: string } {
  const start = prompt.indexOf("## PARTY SIZE");
  const nextHeading = prompt.indexOf("\n## ", start + "## PARTY SIZE".length);
  if (start < 0 || nextHeading < 0) throw new Error("Production prompt no longer contains a locatable complete PARTY SIZE section");
  // The first separator newline belongs to the moved section, keeping all
  // non-section text byte-identical after deletion/insertion.
  const end = nextHeading + 1;
  return { start, end, text: prompt.slice(start, end) };
}

function movePartySection(fullPrompt: string): { prompt: string; validation: Record<string, unknown> } {
  const original = partyRange(fullPrompt);
  const targetStart = fullPrompt.indexOf("## TARGET");
  if (targetStart < 0 || targetStart >= original.start) {
    throw new Error("Production prompt has unexpected TARGET/PARTY SIZE order");
  }
  const moved = fullPrompt.slice(0, targetStart)
    + original.text
    + fullPrompt.slice(targetStart, original.start)
    + fullPrompt.slice(original.end);
  const movedRange = partyRange(moved);
  const removeOriginal = fullPrompt.slice(0, original.start) + fullPrompt.slice(original.end);
  const removeMoved = moved.slice(0, movedRange.start) + moved.slice(movedRange.end);
  const titleCount = (input: string) => input.split("## PARTY SIZE").length - 1;
  const validation = {
    partySectionSha256: sha256(original.text),
    partySectionOccurrences: { A: titleCount(fullPrompt), C: titleCount(moved) },
    originalRange: { start: original.start, end: original.end },
    movedRange: { start: movedRange.start, end: movedRange.end },
    sameSectionText: movedRange.text === original.text,
    allOtherTextIdentical: removeOriginal === removeMoved,
    outputShapePositionUnchanged: fullPrompt.indexOf("PARTY_SIZE:\n") === moved.indexOf("PARTY_SIZE:\n"),
    expectedOnlyMove: moved === fullPrompt.slice(0, targetStart) + original.text + fullPrompt.slice(targetStart, original.start) + fullPrompt.slice(original.end),
  };
  if (
    validation.partySectionOccurrences.A !== 1 ||
    validation.partySectionOccurrences.C !== 1 ||
    !validation.sameSectionText ||
    !validation.allOtherTextIdentical ||
    !validation.outputShapePositionUnchanged ||
    !validation.expectedOnlyMove
  ) {
    throw new Error(`Prompt move validation failed: ${JSON.stringify(validation)}`);
  }
  return { prompt: moved, validation };
}

function proposalFrom(response: ModelResponse):
  | { status: "PROPOSED"; proposal: RestaurantSemanticProposal }
  | { status: "INVALID_MODEL_OUTPUT"; errors: readonly string[] } {
  if (response.finishReason !== "TOOL_CALLS") return { status: "INVALID_MODEL_OUTPUT", errors: [`finishReason was ${response.finishReason}`] };
  try {
    const validated = validateRestaurantSemanticProposal(JSON.parse(response.outputText));
    return validated.valid
      ? { status: "PROPOSED", proposal: validated.value }
      : { status: "INVALID_MODEL_OUTPUT", errors: validated.errors };
  } catch {
    return { status: "INVALID_MODEL_OUTPUT", errors: ["output was not valid JSON"] };
  }
}

function partyAssessment(sample: Sample, proposal: RestaurantSemanticProposal | undefined) {
  const actual = proposal?.facts.filter((fact) => fact.field === "PARTY_SIZE") ?? [];
  const valueFacts = actual.filter((fact) => fact.operation === "ASSERT" || fact.operation === "CORRECT");
  const expected = sample.expected.party;
  if (expected === undefined) return { score: "NOT_APPLICABLE", expected: null, actual };
  if (expected === "OMIT") {
    return {
      score: actual.length === 0 ? "PASS" : "FAIL",
      expected,
      actual,
      operation: actual.length === 0 ? "PASS" : "UNEXPECTED_PARTY_OPERATION",
      compilerFaithful: proposal === undefined ? "NOT_EVALUATED" : actual.length === 0 ? "PASS" : "CHECK_COMPILATION",
    };
  }
  const one = valueFacts.length === 1 ? valueFacts[0] : undefined;
  const value = one?.value?.kind === "PARTY_SIZE" ? one.value : undefined;
  const correct = actual.length === 1 && one?.operation === "ASSERT" && value?.value === expected.value && value?.source === expected.source;
  return {
    score: correct ? "PASS" : "FAIL",
    expected,
    actual,
    operation: one?.operation === "ASSERT" ? "PASS" : "FAIL",
    value: value?.value,
    source: value?.source,
    failure: correct ? undefined : actual.length === 0 ? "omitted party fact" : actual.length > 1 ? "extra/repeated/conflicting party facts" : "wrong operation, party value, or source",
  };
}

function nonPartySignature(proposal: RestaurantSemanticProposal | undefined): readonly Record<string, unknown>[] {
  return proposal?.facts.filter((fact) => fact.field !== "PARTY_SIZE").map((fact) => ({
    field: fact.field,
    operation: fact.operation,
    value: fact.value,
  })) ?? [];
}

function safeFailure(error: unknown): Record<string, unknown> {
  if (error instanceof ModelGatewayError) {
    return { errorCode: error.code, retryable: error.retryable, providerStatus: error.providerStatus };
  }
  return { errorCode: "UNEXPECTED_GATEWAY_ERROR", retryable: false };
}

async function gitState(): Promise<{ head: string; shortStatus: string }> {
  const [head, status] = await Promise.all([
    execFileAsync("git", ["rev-parse", "HEAD"], { cwd: ROOT }),
    execFileAsync("git", ["status", "--short"], { cwd: ROOT }),
  ]);
  return { head: head.stdout.trim(), shortStatus: status.stdout.trim() };
}

async function samplesFromArtifact(): Promise<readonly Sample[]> {
  const raw = await readFile(SOURCE_ARTIFACT, "utf8");
  const artifact = JSON.parse(raw) as { records?: Array<{ sampleId: string; request: ModelRequest }>; sourceArtifact?: { path?: string } };
  const priorSourcePath = artifact.sourceArtifact?.path;
  if (!priorSourcePath) throw new Error("The prior diagnostic does not identify its preserved source artifact");
  const source = JSON.parse(await readFile(priorSourcePath, "utf8")) as { semantic?: { samples?: unknown } };
  if (!Array.isArray(source.semantic?.samples)) throw new Error("The preserved source artifact lacks samples");
  const wanted = [
    "h002-original",
    "party-closed-singular-counterpart",
    "party-open-attendees",
    "party-explicit-total-overrides-relationship",
  ];
  const byId = new Map((source.semantic.samples as Sample[]).map((sample) => [sample.id, sample]));
  const samples = wanted.map((id) => byId.get(id));
  if (samples.some((sample) => sample === undefined)) throw new Error("One or more required preserved party samples is missing; refusing to reconstruct them");
  return samples as Sample[];
}

function requestFor(sample: Sample, variant: Variant, callId: string): {
  request: ModelRequest;
  promptValidation: Record<string, unknown>;
} {
  const aPrompt = buildRestaurantSemanticInterpreterSystemPrompt({ referenceTime: sample.referenceTime, timezone: "Asia/Tokyo", retryAttempt: 1 });
  const moved = movePartySection(aPrompt);
  const prompt = variant === "A_FULL_V19" ? aPrompt : moved.prompt;
  return {
    request: {
      taskId: callId,
      purpose: RESTAURANT_SEMANTIC_PROPOSAL_PURPOSE,
      promptVersion: variant === "A_FULL_V19" ? RESTAURANT_SEMANTIC_PROPOSAL_PROMPT_VERSION : "diagnostic-party-section-moved@1",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `User restaurant message as JSON string: ${JSON.stringify(sample.message)}` },
      ],
      responseFormat: "JSON_SCHEMA",
      outputSchema: { ...RESTAURANT_SEMANTIC_PROPOSAL_SCHEMA, jsonSchema: RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA },
      timeoutMs: RESTAURANT_SEMANTIC_REQUEST_TIMEOUT_MS,
      fallback: "STRUCTURED_FORM",
      maxOutputTokens: RESTAURANT_SEMANTIC_MAX_OUTPUT_TOKENS,
      temperature: 0,
      thinking: "disabled",
    },
    promptValidation: moved.validation,
  };
}

function planFor(samples: readonly Sample[], runId: string): { plan: readonly PlannedCall[]; promptValidation: Record<string, unknown> } {
  const planned: PlannedCall[] = [];
  let validation: Record<string, unknown> | undefined;
  for (const sample of samples) {
    const schedule: readonly Variant[] = ["A_FULL_V19", "C_FULL_PARTY_MOVED", "C_FULL_PARTY_MOVED", "A_FULL_V19", "A_FULL_V19", "C_FULL_PARTY_MOVED"];
    schedule.forEach((variant, index) => {
      const repeat = (Math.floor(index / 2) + 1) as 1 | 2 | 3;
      const callId = `${runId}:${String(planned.length + 1).padStart(2, "0")}:${sample.id}:${variant}:r${repeat}`;
      const built = requestFor(sample, variant, callId);
      validation ??= built.promptValidation;
      planned.push({ ordinal: planned.length + 1, callId, sample, repeat, variant, request: built.request, promptSha256: sha256(built.request.messages[0]!.content) });
    });
  }
  if (planned.length !== 24) throw new Error(`Expected 24 planned calls, received ${planned.length}`);
  return { plan: planned, promptValidation: validation ?? {} };
}

async function appendLedger(path: string, entry: Record<string, unknown>): Promise<void> {
  await appendFile(path, `${JSON.stringify(entry)}\n`, "utf8");
}

async function ensureNoLock(): Promise<void> {
  await mkdir(OUTPUT_DIRECTORY, { recursive: true });
  const lockPath = resolve(OUTPUT_DIRECTORY, "ACTIVE.lock.json");
  try {
    await readFile(lockPath, "utf8");
    throw new Error(`An existing position diagnostic lock is present at ${lockPath}; do not start a second process`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function main(): Promise<void> {
  await ensureNoLock();
  const state = await gitState();
  if (state.head !== REFERENCE_COMMIT) {
    throw new Error(`HEAD ${state.head} is not required reference ${REFERENCE_COMMIT}; refusing to mix baselines`);
  }
  const samples = await samplesFromArtifact();
  const runId = `semantic-party-position-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`;
  const { plan, promptValidation } = planFor(samples, runId);
  const sourceRaw = await readFile(SOURCE_ARTIFACT, "utf8");
  const planPath = resolve(OUTPUT_DIRECTORY, `${runId}.plan.json`);
  await writeFile(planPath, JSON.stringify({
    runId,
    mode: MODE,
    referenceCommit: REFERENCE_COMMIT,
    git: state,
    cohort: "DEVELOPMENT_DIAGNOSTIC",
    contaminationStatus: "PROMPT_AND_RESULT_EXPOSED",
    baselineEligible: false,
    sourceArtifact: { path: SOURCE_ARTIFACT, sha256: sha256(sourceRaw) },
    samples,
    promptMoveValidation: promptValidation,
    budget: { authorizedIndependentModelCalls: 24, plannedModelCalls: 24, retries: 0, externalSourceCalls: 0, browserCalls: 0 },
    schedule: "per sample: r1 A→C; r2 C→A; r3 A→C",
    calls: plan,
  }, null, 2));

  if (MODE === "preflight") {
    // Configuration is checked without printing any environment values.
    DeepSeekModelGateway.fromEnvironment(process.env);
    console.log(JSON.stringify({ status: "PREFLIGHT_OK", planPath, plannedCalls: plan.length, promptMoveValidation: promptValidation }, null, 2));
    return;
  }

  const lockPath = resolve(OUTPUT_DIRECTORY, "ACTIVE.lock.json");
  const startedPath = resolve(OUTPUT_DIRECTORY, `${runId}.started.json`);
  const resultPath = resolve(OUTPUT_DIRECTORY, `${runId}.result.json`);
  const ledgerPath = resolve(OUTPUT_DIRECTORY, `${runId}.ledger.jsonl`);
  const lock = await open(lockPath, "wx");
  await lock.writeFile(JSON.stringify({ runId, status: "RUNNING", startedAt: new Date().toISOString(), planPath, plannedCalls: 24 }, null, 2));
  await lock.close();
  await writeFile(startedPath, JSON.stringify({ runId, status: "STARTED", startedAt: new Date().toISOString(), planPath, ledgerPath, budget: { plannedModelCalls: 24, retries: 0 } }, null, 2));

  const records: unknown[] = [];
  try {
    let provider: DeepSeekModelGateway;
    try {
      provider = DeepSeekModelGateway.fromEnvironment(process.env);
    } catch (error) {
      const failure = safeFailure(error);
      await writeFile(resultPath, JSON.stringify({ runId, status: "FAILED_BEFORE_DISPATCH", planPath, ledgerPath, failure, budget: { plannedModelCalls: 24, reservedCalls: 0, actualModelCalls: 0 } }, null, 2));
      console.log(JSON.stringify({ status: "FAILED_BEFORE_DISPATCH", resultPath, actualModelCalls: 0, failure }, null, 2));
      return;
    }
    for (const call of plan) {
      await appendLedger(ledgerPath, { at: new Date().toISOString(), status: "RESERVED", ordinal: call.ordinal, callId: call.callId, sampleId: call.sample.id, variant: call.variant, repeat: call.repeat, preDispatchDebit: true });
      try {
        const response = await provider.complete(call.request);
        const normalized = proposalFrom(response);
        const compilation = normalized.status === "PROPOSED"
          ? compileRestaurantSemanticProposal(normalized.proposal, { referenceTime: call.sample.referenceTime, timezone: "Asia/Tokyo" })
          : undefined;
        const draft: RestaurantIntentDraft | undefined = compilation?.status === "COMPILED"
          ? applyRestaurantIntentPatch(undefined, compilation.patch)
          : undefined;
        const party = partyAssessment(call.sample, normalized.status === "PROPOSED" ? normalized.proposal : undefined);
        const compilerPartyFaithfulness = compilation?.status === "COMPILED"
          ? JSON.stringify({ partySize: draft?.partySize, partySizeSource: draft?.partySizeSource }) === JSON.stringify(
            party.expected && party.expected !== "OMIT" ? { partySize: party.expected.value, partySizeSource: party.expected.source } : {},
          )
            ? "PASS"
            : party.expected === "OMIT" && draft?.partySize === undefined ? "PASS" : "FAIL_OR_NOT_APPLICABLE"
          : "NOT_EVALUATED";
        const record = {
          ordinal: call.ordinal, callId: call.callId, sampleId: call.sample.id, repeat: call.repeat, variant: call.variant,
          request: call.request, response, normalized, compilation, draft,
          assessment: { party: { ...party, compilerFaithfulness: compilerPartyFaithfulness }, nonPartyFacts: nonPartySignature(normalized.status === "PROPOSED" ? normalized.proposal : undefined) },
        };
        records.push(record);
        await writeFile(resolve(OUTPUT_DIRECTORY, `${runId}.call-${String(call.ordinal).padStart(2, "0")}.json`), JSON.stringify(record, null, 2));
        await appendLedger(ledgerPath, { at: new Date().toISOString(), status: "COMPLETED", ordinal: call.ordinal, callId: call.callId, provider: response.provider, model: response.model, finishReason: response.finishReason, latencyMs: response.latencyMs, usage: response.usage });
      } catch (error) {
        const failure = safeFailure(error);
        const record = { ordinal: call.ordinal, callId: call.callId, sampleId: call.sample.id, repeat: call.repeat, variant: call.variant, request: call.request, failure };
        records.push(record);
        await writeFile(resolve(OUTPUT_DIRECTORY, `${runId}.call-${String(call.ordinal).padStart(2, "0")}.json`), JSON.stringify(record, null, 2));
        await appendLedger(ledgerPath, { at: new Date().toISOString(), status: "FAILED", ordinal: call.ordinal, callId: call.callId, ...failure });
      }
    }
    await writeFile(resultPath, JSON.stringify({
      runId, status: "COMPLETED", completedAt: new Date().toISOString(), referenceCommit: REFERENCE_COMMIT, git: state,
      cohort: "DEVELOPMENT_DIAGNOSTIC", contaminationStatus: "PROMPT_AND_RESULT_EXPOSED", baselineEligible: false,
      sourceArtifact: { path: SOURCE_ARTIFACT, sha256: sha256(sourceRaw) }, planPath, ledgerPath,
      budget: { authorizedIndependentModelCalls: 24, reservedCalls: 24, completedRecords: records.length, retries: 0, externalSourceCalls: 0, browserCalls: 0 },
      records,
    }, null, 2));
    console.log(JSON.stringify({ status: "COMPLETED", resultPath, ledgerPath, records: records.length }, null, 2));
  } finally {
    await rm(lockPath, { force: true });
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
