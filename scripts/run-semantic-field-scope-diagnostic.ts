import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { ModelRequest, ModelResponse } from "../src/core/model/contracts.js";
import { ModelGatewayError } from "../src/core/model/errors.js";
import {
  RESTAURANT_SEMANTIC_MAX_OUTPUT_TOKENS,
  RESTAURANT_SEMANTIC_REQUEST_TIMEOUT_MS,
  buildRestaurantSemanticInterpreterSystemPrompt,
} from "../src/domains/restaurant/semantic-interpreter.js";
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
 * A deliberately isolated, exposed-development diagnostic. It preserves the
 * current production request construction for A, then compares it with a
 * field-scoped task that retains only the relevant verbatim production rules.
 * It does not invoke RestaurantSemanticInterpreter because that class may make
 * a schema retry; every planned provider request here is dispatched at most once.
 */

const ROOT = resolve(import.meta.dirname, "..");
const SOURCE_ARTIFACT = resolve(
  ROOT,
  ".eval-artifacts/restaurant-semantic-targeted-repair/semantic-targeted-repair-2026-09-18T05-51-04-450Z.result.json",
);
const OUTPUT_DIRECTORY = resolve(ROOT, ".eval-artifacts/semantic-field-scope-diagnostic-2026-09-18");
const MODE = process.env.PRAXIS_FIELD_SCOPE_DIAGNOSTIC_MODE ?? "preflight";
const CURRENT_HEAD = process.env.PRAXIS_CURRENT_HEAD ?? "UNRECORDED";
const REFERENCE_COMMIT = "01e073f6dbde651c14661d6b2a093a78ce0bf47b";
const PARTY_SAMPLE_IDS = new Set([
  "h002-original",
  "party-closed-singular-counterpart",
  "party-open-attendees",
  "party-explicit-total-overrides-relationship",
]);

if (MODE !== "preflight" && MODE !== "run" && MODE !== "finalize-startup-failure" && MODE !== "finalize-unpersisted-completions") {
  throw new Error("PRAXIS_FIELD_SCOPE_DIAGNOSTIC_MODE must be preflight, run, finalize-startup-failure, or finalize-unpersisted-completions");
}

type ExpectedParty = { value: number; source: "EXPLICIT" | "INFERRED_CLOSED_PARTY" } | "OMIT";
type ExpectedCriterion = {
  phrase: string;
  strength: "HARD" | "SOFT" | "UNSPECIFIED";
};
type Sample = {
  id: string;
  message: string;
  referenceTime: string;
  expected: { party?: ExpectedParty; criteria: readonly ExpectedCriterion[] };
};
type Scope = "A_FULL" | "B_PARTY" | "B_CRITERIA";
type PlannedCall = {
  ordinal: number;
  callId: string;
  sample: Sample;
  repeat: 1 | 2;
  scope: Scope;
  request: ModelRequest;
  promptSha256: string;
  retainedSections: readonly string[];
  deletedSections: readonly string[];
};
type CriterionActual = {
  text: string;
  polarity: string;
  strength: string;
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normal(value: string): string {
  return value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, " ").trim();
}

function between(source: string, start: string, end: string): string {
  const startAt = source.indexOf(start);
  const endAt = source.indexOf(end, startAt + start.length);
  if (startAt < 0 || endAt < 0) {
    throw new Error(`Cannot extract required production prompt section ${start} .. ${end}`);
  }
  return source.slice(startAt, endAt).trim();
}

function after(source: string, start: string): string {
  const startAt = source.indexOf(start);
  if (startAt < 0) throw new Error(`Cannot extract required production prompt section ${start}`);
  return source.slice(startAt).trim();
}

function before(source: string, end: string): string {
  const endAt = source.indexOf(end);
  if (endAt < 0) throw new Error(`Cannot extract required production prompt section ending ${end}`);
  return source.slice(0, endAt).trim();
}

function outputShape(source: string, field: "PARTY_SIZE" | "CRITERION"): string {
  const marker = `${field}:\n`;
  const startAt = source.indexOf(marker);
  const nextAt = source.indexOf("\n\n", startAt);
  if (startAt < 0 || nextAt < 0) throw new Error(`Cannot extract ${field} output shape`);
  return source.slice(startAt, nextAt).trim();
}

function promptPrefix(fullPrompt: string): string {
  return before(fullPrompt, "## OPERATIONS");
}

function promptForScope(fullPrompt: string, scope: Scope): {
  prompt: string;
  retainedSections: readonly string[];
  deletedSections: readonly string[];
} {
  if (scope === "A_FULL") {
    return { prompt: fullPrompt, retainedSections: ["entire production prompt@19"], deletedSections: [] };
  }

  const generic = promptPrefix(fullPrompt);
  const operations = between(fullPrompt, "## OPERATIONS", "## TARGET");
  const party = between(fullPrompt, "## PARTY SIZE", "## AREA");
  const criteria = between(fullPrompt, "## CRITERIA", "## BUDGET");
  const budget = between(fullPrompt, "## BUDGET", "## TIME");
  const partyShape = outputShape(fullPrompt, "PARTY_SIZE");
  const criterionShape = outputShape(fullPrompt, "CRITERION");
  const partySource = between(
    fullPrompt,
    "For every PARTY_SIZE you emit",
    "Do not emit an empty facts list",
  );
  const finalReturn = after(fullPrompt, "Do not emit an empty facts list when the current user message expresses any restaurant-search fact.");

  if (scope === "B_PARTY") {
    return {
      prompt: [
        generic,
        "For this diagnostic, emit only PARTY_SIZE facts expressed by the current user message.",
        operations,
        party,
        "## OUTPUT SHAPES",
        partyShape,
        partySource,
        finalReturn,
      ].join("\n\n"),
      retainedSections: [
        "production generic framing/context",
        "production JSON facts envelope",
        "production OPERATIONS",
        "production PARTY SIZE",
        "production PARTY_SIZE output shape",
        "production PARTY_SIZE source-label rule",
        "production return-only instruction",
      ],
      deletedSections: ["TARGET", "CRITERIA", "POLARITY AND STRENGTH", "BUDGET", "TIME", "AREA", "unrelated output shapes"],
    };
  }

  return {
    prompt: [
      generic,
      "For this diagnostic, emit only CRITERION facts expressed by the current user message.",
      operations,
      criteria,
      budget,
      "## OUTPUT SHAPES",
      criterionShape,
      finalReturn,
    ].join("\n\n"),
    retainedSections: [
      "production generic framing/context",
      "production JSON facts envelope",
      "production OPERATIONS",
      "production CRITERIA",
      "production POLARITY AND STRENGTH",
      "production BUDGET",
      "production CRITERION output shape",
      "production return-only instruction",
    ],
    deletedSections: ["TARGET", "TIME", "PARTY SIZE", "AREA", "unrelated output shapes"],
  };
}

function requestFor(sample: Sample, scope: Scope, callId: string): PlannedCall {
  const fullPrompt = buildRestaurantSemanticInterpreterSystemPrompt({
    referenceTime: sample.referenceTime,
    timezone: "Asia/Tokyo",
    retryAttempt: 1,
  });
  const scoped = promptForScope(fullPrompt, scope);
  const request: ModelRequest = {
    taskId: callId,
    purpose: RESTAURANT_SEMANTIC_PROPOSAL_PURPOSE,
    promptVersion: scope === "A_FULL"
      ? RESTAURANT_SEMANTIC_PROPOSAL_PROMPT_VERSION
      : scope === "B_PARTY" ? "field-scope-party-diagnostic@1" : "field-scope-criteria-diagnostic@1",
    messages: [
      { role: "system", content: scoped.prompt },
      { role: "user", content: `User restaurant message as JSON string: ${JSON.stringify(sample.message)}` },
    ],
    responseFormat: "JSON_SCHEMA",
    outputSchema: { ...RESTAURANT_SEMANTIC_PROPOSAL_SCHEMA, jsonSchema: RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA },
    timeoutMs: RESTAURANT_SEMANTIC_REQUEST_TIMEOUT_MS,
    fallback: "STRUCTURED_FORM",
    maxOutputTokens: RESTAURANT_SEMANTIC_MAX_OUTPUT_TOKENS,
    temperature: 0,
    thinking: "disabled",
  };
  return {
    ordinal: 0,
    callId,
    sample,
    repeat: 1,
    scope,
    request,
    promptSha256: sha256(scoped.prompt),
    retainedSections: scoped.retainedSections,
    deletedSections: scoped.deletedSections,
  };
}

function proposalFrom(response: ModelResponse): {
  status: "PROPOSED" | "INVALID_MODEL_OUTPUT";
  proposal?: RestaurantSemanticProposal;
  errors?: readonly string[];
} {
  if (response.finishReason !== "TOOL_CALLS") {
    return { status: "INVALID_MODEL_OUTPUT", errors: [`finishReason was ${response.finishReason}`] };
  }
  try {
    const validation = validateRestaurantSemanticProposal(JSON.parse(response.outputText));
    return validation.valid
      ? { status: "PROPOSED", proposal: validation.value }
      : { status: "INVALID_MODEL_OUTPUT", errors: validation.errors };
  } catch {
    return { status: "INVALID_MODEL_OUTPUT", errors: ["output was not valid JSON"] };
  }
}

function criteriaFrom(proposal: RestaurantSemanticProposal | undefined): readonly CriterionActual[] {
  if (!proposal) return [];
  return proposal.facts.flatMap((fact) => (
    fact.field === "CRITERION" && fact.value?.kind === "CRITERION"
      ? [{ text: fact.value.text, polarity: fact.value.polarity, strength: fact.value.strength }]
      : []
  ));
}

function partyFrom(proposal: RestaurantSemanticProposal | undefined): readonly unknown[] {
  if (!proposal) return [];
  return proposal.facts.flatMap((fact) => (
    fact.field === "PARTY_SIZE" && fact.value?.kind === "PARTY_SIZE" ? [fact.value] : []
  ));
}

function scoreParty(sample: Sample, proposal: RestaurantSemanticProposal | undefined) {
  const actual = partyFrom(proposal) as readonly { value: number; source: string }[];
  const expected = sample.expected.party;
  if (expected === undefined) return { status: "NOT_APPLICABLE" as const, expected: null, actual };
  if (expected === "OMIT") {
    return { status: actual.length === 0 ? "PASS" as const : "FAIL" as const, expected, actual, failure: actual.length === 0 ? undefined : "unexpected party fact" };
  }
  const matching = actual.length === 1 && actual[0]?.value === expected.value && actual[0]?.source === expected.source;
  return {
    status: matching ? "PASS" as const : "FAIL" as const,
    expected,
    actual,
    failure: matching ? undefined : actual.length === 0 ? "omitted party fact" : actual.length > 1 ? "multiple/conflicting party facts" : "wrong party value or source",
  };
}

function scoreCriteria(sample: Sample, proposal: RestaurantSemanticProposal | undefined) {
  const actual = criteriaFrom(proposal);
  const matched = new Set<number>();
  const expected = sample.expected.criteria.map((criterion) => {
    const phrase = normal(criterion.phrase);
    const index = actual.findIndex((candidate, candidateIndex) => !matched.has(candidateIndex) && (
      normal(candidate.text).includes(phrase) || phrase.includes(normal(candidate.text))
    ));
    if (index >= 0) matched.add(index);
    const observed = index >= 0 ? actual[index] : undefined;
    return {
      expected: { text: criterion.phrase, polarity: "NOT_CAPTURED_IN_SOURCE_EXPECTATION", strength: criterion.strength },
      actual: observed ?? null,
      textRelation: observed === undefined ? "OMITTED_OR_UNRESOLVED_PARAPHRASE" : normal(observed.text) === phrase ? "TEXT_EQUIVALENT" : "CONTAINS_EXPECTED_TERMS",
      strength: observed?.strength === criterion.strength ? "PASS" : "FAIL",
      polarity: "NOT_EVALUATED_EXPECTATION_MISSING",
      meaning: observed === undefined ? "NOT_EVALUATED" : "REVIEW_REQUIRED_FOR_NON_EXACT_TEXT",
    };
  });
  return {
    expected,
    unmatchedActual: actual.filter((_, index) => !matched.has(index)),
    score: expected.every((item) => item.strength === "PASS") ? "PASS" : "FAIL",
    note: "Criterion polarity was not captured in the preserved targeted-repair expectations and is therefore reported, not retroactively scored. Text order is ignored; non-exact text is not automatically judged semantically wrong.",
  };
}

async function loadSamples(): Promise<readonly Sample[]> {
  const raw = await readFile(SOURCE_ARTIFACT, "utf8");
  const artifact = JSON.parse(raw) as { semantic?: { samples?: unknown } };
  if (!Array.isArray(artifact.semantic?.samples) || artifact.semantic.samples.length !== 8) {
    throw new Error("The preserved targeted-repair artifact does not contain exactly eight source samples");
  }
  const samples = artifact.semantic.samples as Sample[];
  const expectedIds = [
    "h002-original", "h003-original", "party-closed-singular-counterpart", "party-open-attendees",
    "party-explicit-total-overrides-relationship", "strength-defining-activity-and-drinks",
    "strength-explicitly-flexible-improvements", "strength-local-optionality-scope",
  ];
  if (samples.map((sample) => sample.id).join("|") !== expectedIds.join("|")) {
    throw new Error("The preserved targeted-repair sample order or identities changed; refusing to reconstruct inputs");
  }
  return samples;
}

function buildPlan(samples: readonly Sample[], runId: string): readonly PlannedCall[] {
  const planned: PlannedCall[] = [];
  for (const sample of samples) {
    const bScope: Scope = PARTY_SAMPLE_IDS.has(sample.id) ? "B_PARTY" : "B_CRITERIA";
    for (const [scope, repeat] of [["A_FULL", 1], [bScope, 1], ["A_FULL", 2], [bScope, 2]] as const) {
      const callId = `${runId}:${String(planned.length + 1).padStart(2, "0")}:${sample.id}:${scope}:r${repeat}`;
      const plan = requestFor(sample, scope, callId);
      planned.push({ ...plan, ordinal: planned.length + 1, repeat });
    }
  }
  if (planned.length !== 32) throw new Error(`Expected exactly 32 planned calls, got ${planned.length}`);
  return planned;
}

async function appendLedger(path: string, value: Record<string, unknown>): Promise<void> {
  await appendFile(path, `${JSON.stringify(value)}\n`, "utf8");
}

function safeFailure(error: unknown) {
  if (error instanceof ModelGatewayError) {
    return { errorCode: error.code, retryable: error.retryable, providerStatus: error.providerStatus };
  }
  return { errorCode: "UNEXPECTED_GATEWAY_ERROR", retryable: false };
}

async function ensureNoIncompleteRun(): Promise<void> {
  await mkdir(OUTPUT_DIRECTORY, { recursive: true });
  const active = resolve(OUTPUT_DIRECTORY, "ACTIVE.lock.json");
  try {
    await readFile(active, "utf8");
    throw new Error(`An incomplete or active diagnostic is recorded at ${active}; inspect it before any new run`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function finalizeStartupFailure(): Promise<void> {
  const lockPath = resolve(OUTPUT_DIRECTORY, "ACTIVE.lock.json");
  const lock = JSON.parse(await readFile(lockPath, "utf8")) as {
    runId?: string;
    status?: string;
    planPath?: string;
  };
  if (lock.status !== "RUNNING" || typeof lock.runId !== "string" || typeof lock.planPath !== "string") {
    throw new Error("ACTIVE.lock.json is not a recognizable interrupted diagnostic record");
  }
  const startedPath = resolve(OUTPUT_DIRECTORY, `${lock.runId}.started.json`);
  const started = JSON.parse(await readFile(startedPath, "utf8")) as { ledgerPath?: string };
  if (typeof started.ledgerPath !== "string") throw new Error("Interrupted run is missing a ledger path");
  let ledgerContents = "";
  try {
    ledgerContents = await readFile(started.ledgerPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (ledgerContents.trim().length > 0) {
    throw new Error("Interrupted run has reserved calls and must not be finalized as a pre-dispatch failure");
  }
  const resultPath = resolve(OUTPUT_DIRECTORY, `${lock.runId}.result.json`);
  await writeFile(resultPath, JSON.stringify({
    runId: lock.runId,
    status: "FAILED_BEFORE_DISPATCH",
    finalizedAt: new Date().toISOString(),
    planPath: lock.planPath,
    ledgerPath: started.ledgerPath,
    reason: "MODEL_CONFIGURATION_UNAVAILABLE",
    budget: { plannedModelCalls: 32, reservedCalls: 0, actualModelCalls: 0, retries: 0 },
    note: "The server-side model key was absent from the process environment before the provider was constructed. No provider request was reserved or dispatched.",
  }, null, 2));
  await rm(lockPath, { force: true });
  console.log(JSON.stringify({ status: "FINALIZED_BEFORE_DISPATCH_FAILURE", resultPath, actualModelCalls: 0 }, null, 2));
}

async function finalizeUnpersistedCompletions(): Promise<void> {
  const lockPath = resolve(OUTPUT_DIRECTORY, "ACTIVE.lock.json");
  const lock = JSON.parse(await readFile(lockPath, "utf8")) as {
    runId?: string;
    status?: string;
    planPath?: string;
  };
  if (lock.status !== "RUNNING" || typeof lock.runId !== "string" || typeof lock.planPath !== "string") {
    throw new Error("ACTIVE.lock.json is not a recognizable interrupted diagnostic record");
  }
  const startedPath = resolve(OUTPUT_DIRECTORY, `${lock.runId}.started.json`);
  const started = JSON.parse(await readFile(startedPath, "utf8")) as { ledgerPath?: string };
  if (typeof started.ledgerPath !== "string") throw new Error("Interrupted run is missing a ledger path");
  const ledgerRows = (await readFile(started.ledgerPath, "utf8"))
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as { status?: string; ordinal?: number });
  const reserved = ledgerRows.filter((row) => row.status === "RESERVED");
  const completed = ledgerRows.filter((row) => row.status === "COMPLETED");
  const failed = ledgerRows.filter((row) => row.status === "FAILED");
  if (reserved.length !== 32 || completed.length !== 32 || failed.length !== 0) {
    throw new Error("Ledger does not show exactly 32 completed and zero failed provider calls; refusing to finalize a partial run");
  }
  const resultPath = resolve(OUTPUT_DIRECTORY, `${lock.runId}.result.json`);
  await writeFile(resultPath, JSON.stringify({
    runId: lock.runId,
    status: "COMPLETED_CALLS_UNFINALIZED",
    finalizedAt: new Date().toISOString(),
    planPath: lock.planPath,
    ledgerPath: started.ledgerPath,
    budget: { plannedModelCalls: 32, reservedCalls: 32, completedCalls: 32, failedCalls: 0, retries: 0 },
    rawRequests: "preserved in the plan artifact",
    rawResponses: "NOT_PERSISTED: process ended after all ledger completions and before aggregate result write",
    assessment: "NOT_RUN: the in-memory responses were lost before deterministic normalization and scoring",
    note: "This result deliberately does not infer semantic outcomes from the completion metadata and does not authorize or perform reruns.",
  }, null, 2));
  await rm(lockPath, { force: true });
  console.log(JSON.stringify({ status: "FINALIZED_UNPERSISTED_COMPLETIONS", resultPath, completedCalls: 32, rawResponses: "NOT_PERSISTED" }, null, 2));
}

async function main(): Promise<void> {
  if (MODE === "finalize-startup-failure") {
    await finalizeStartupFailure();
    return;
  }
  if (MODE === "finalize-unpersisted-completions") {
    await finalizeUnpersistedCompletions();
    return;
  }
  await ensureNoIncompleteRun();
  const sourceRaw = await readFile(SOURCE_ARTIFACT, "utf8");
  const samples = await loadSamples();
  const runId = `semantic-field-scope-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`;
  const plan = buildPlan(samples, runId);
  const planDocument = {
    runId,
    mode: MODE,
    referenceCommit: REFERENCE_COMMIT,
    observedHead: CURRENT_HEAD,
    cohort: "DEVELOPMENT_DIAGNOSTIC",
    contaminationStatus: "PROMPT_AND_RESULT_EXPOSED",
    baselineEligible: false,
    sourceArtifact: { path: SOURCE_ARTIFACT, sha256: sha256(sourceRaw) },
    budget: { authorizedIndependentModelCalls: 32, plannedModelCalls: plan.length, retries: 0, externalSourceCalls: 0, browserCalls: 0 },
    controls: {
      modelAndTransport: "same DeepSeek ModelGateway transport; model from DEEPSEEK_MODEL; temperature 0; thinking disabled; JSON schema transport",
      timeoutMs: RESTAURANT_SEMANTIC_REQUEST_TIMEOUT_MS,
      maxOutputTokens: RESTAURANT_SEMANTIC_MAX_OUTPUT_TOKENS,
      timezone: "Asia/Tokyo",
      currentDraft: {},
      schedule: "each preserved sample: A1, B1, A2, B2",
      evaluationBoundary: "A other facts are retained in artifacts but not scored; B non-target facts are expected absent; criteria order is not scored; source expectations omit polarity",
    },
    calls: plan.map(({ request, ...call }) => ({ ...call, request })),
  };
  const planPath = resolve(OUTPUT_DIRECTORY, `${runId}.plan.json`);
  await writeFile(planPath, JSON.stringify(planDocument, null, 2));

  if (MODE === "preflight") {
    console.log(JSON.stringify({ status: "PREFLIGHT_OK", planPath, plannedCalls: plan.length, sourceArtifact: SOURCE_ARTIFACT }, null, 2));
    return;
  }

  const lockPath = resolve(OUTPUT_DIRECTORY, "ACTIVE.lock.json");
  const startedPath = resolve(OUTPUT_DIRECTORY, `${runId}.started.json`);
  const resultPath = resolve(OUTPUT_DIRECTORY, `${runId}.result.json`);
  const ledgerPath = resolve(OUTPUT_DIRECTORY, `${runId}.ledger.jsonl`);
  let lock: Awaited<ReturnType<typeof open>> | undefined;
  try {
    lock = await open(lockPath, "wx");
    await lock.writeFile(JSON.stringify({ runId, status: "RUNNING", startedAt: new Date().toISOString(), planPath, plannedCalls: plan.length }, null, 2));
    await lock.close();
    lock = undefined;
  } catch (error) {
    if (lock) await lock.close();
    throw error;
  }
  await writeFile(startedPath, JSON.stringify({ runId, status: "STARTED", startedAt: new Date().toISOString(), planPath, ledgerPath, budget: { plannedModelCalls: 32, retries: 0 } }, null, 2));

  const records: unknown[] = [];
  try {
    let provider: DeepSeekModelGateway;
    try {
      provider = DeepSeekModelGateway.fromEnvironment(process.env);
    } catch (error) {
      const failure = safeFailure(error);
      const result = {
        runId,
        status: "FAILED_BEFORE_DISPATCH",
        completedAt: new Date().toISOString(),
        referenceCommit: REFERENCE_COMMIT,
        observedHead: CURRENT_HEAD,
        planPath,
        ledgerPath,
        failure,
        budget: { authorizedIndependentModelCalls: 32, reservedCalls: 0, completedRecords: 0, retries: 0 },
      };
      await writeFile(resultPath, JSON.stringify(result, null, 2));
      console.log(JSON.stringify({ status: "FAILED_BEFORE_DISPATCH", resultPath, actualModelCalls: 0, failure }, null, 2));
      return;
    }
    for (const call of plan) {
      await appendLedger(ledgerPath, {
        at: new Date().toISOString(), status: "RESERVED", ordinal: call.ordinal, callId: call.callId,
        sampleId: call.sample.id, scope: call.scope, repeat: call.repeat, preDispatchDebit: true,
      });
      let response: ModelResponse | undefined;
      try {
        response = await provider.complete(call.request);
        const normalized = proposalFrom(response);
        const record = {
          ordinal: call.ordinal,
          callId: call.callId,
          sampleId: call.sample.id,
          repeat: call.repeat,
          scope: call.scope,
          request: call.request,
          response,
          normalized,
          assessment: {
            party: scoreParty(call.sample, normalized.proposal),
            criteria: scoreCriteria(call.sample, normalized.proposal),
            nonTargetFacts: normalized.proposal?.facts.filter((fact) => call.scope === "B_PARTY" ? fact.field !== "PARTY_SIZE" : call.scope === "B_CRITERIA" ? fact.field !== "CRITERION" : false) ?? [],
          },
        };
        records.push(record);
        await writeFile(
          resolve(OUTPUT_DIRECTORY, `${runId}.call-${String(call.ordinal).padStart(2, "0")}.json`),
          JSON.stringify(record, null, 2),
        );
        await appendLedger(ledgerPath, {
          at: new Date().toISOString(), status: "COMPLETED", ordinal: call.ordinal, callId: call.callId,
          provider: response.provider, model: response.model, latencyMs: response.latencyMs,
          usage: response.usage, finishReason: response.finishReason,
        });
      } catch (error) {
        const failure = safeFailure(error);
        const record = { ordinal: call.ordinal, callId: call.callId, sampleId: call.sample.id, repeat: call.repeat, scope: call.scope, request: call.request, failure };
        records.push(record);
        await writeFile(
          resolve(OUTPUT_DIRECTORY, `${runId}.call-${String(call.ordinal).padStart(2, "0")}.json`),
          JSON.stringify(record, null, 2),
        );
        await appendLedger(ledgerPath, { at: new Date().toISOString(), status: "FAILED", ordinal: call.ordinal, callId: call.callId, ...failure });
      }
    }
    const result = {
      runId,
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
      referenceCommit: REFERENCE_COMMIT,
      observedHead: CURRENT_HEAD,
      cohort: "DEVELOPMENT_DIAGNOSTIC",
      contaminationStatus: "PROMPT_AND_RESULT_EXPOSED",
      baselineEligible: false,
      sourceArtifact: { path: SOURCE_ARTIFACT, sha256: sha256(sourceRaw) },
      budget: { authorizedIndependentModelCalls: 32, reservedCalls: plan.length, completedRecords: records.length, retries: 0, externalSourceCalls: 0, browserCalls: 0 },
      planPath,
      ledgerPath,
      records,
    };
    await writeFile(resultPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ status: "COMPLETED", resultPath, ledgerPath, plannedCalls: plan.length, recordedCalls: records.length }, null, 2));
  } finally {
    await rm(lockPath, { force: true });
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
