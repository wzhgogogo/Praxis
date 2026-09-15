import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../../core/model/contracts.js";
import { LiveBrowserAvailability } from "../../../integrations/restaurant-availability/live-browser-availability.js";
import type { BrowserRuntime } from "../../../infrastructure/browser/browser-runtime.js";
import { GooglePlacesClient } from "../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../integrations/google/google-places-restaurant-search.js";
import { composeLiveRestaurantFactRead } from "../../../integrations/restaurant-facts/live-restaurant-facts.js";
import { evaluateRestaurantHybridLiveArtifact } from "./diagnostic-evaluator.js";
import { createHybridReadComposition } from "./hybrid-read-composition.js";
import { HIGASHI_GINZA_EVALUATION_LOCATION } from "./live-evaluation-location.js";

const now = new Date("2026-09-16T03:00:00.000Z"); // Wednesday noon in Tokyo.
const clock = { now: () => new Date(now) };

function response(outputText: string, invocationId: string): ModelResponse {
  return { invocationId, provider: "FIXTURE", model: "external-boundary-stub", outputText, finishReason: "TOOL_CALLS", latencyMs: 0 };
}

function strictAction(type: string, candidateIds: string[] = []): Record<string, unknown> {
  return { type, question: "", relatedFields: [], retrievalHint: "", candidateIds, candidateId: "", offerId: "", decisionSummary: "synthetic boundary action" };
}

/** Replaces only model transport: semantic proposal and actions are explicit test input. */
class ScriptedExternalModel implements ModelGateway {
  readonly requests: ModelRequest[] = [];

  constructor(private readonly batchSize = 3, private readonly reverse = false, private readonly useAvailability = false) {}

  async complete(request: ModelRequest): Promise<ModelResponse> {
    this.requests.push(request);
    if (request.purpose === "restaurant_semantic_interpret") {
      return response(JSON.stringify({
        schemaVersion: "3",
        facts: [
          { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "RECOMMENDATION", query: "afternoon cafes" } },
          { field: "DATE", operation: "ASSERT", value: { kind: "DATE", relativeDay: "TOMORROW", raw: "tomorrow" } },
          { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTERNOON", raw: "tomorrow afternoon" } },
          { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
          { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
          { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "cafe", polarity: "POSITIVE", strength: "HARD" } },
        ],
      }), "semantic");
    }
    if (request.purpose === "restaurant_agent_decide") {
      const payload = JSON.parse(request.messages.find((message) => message.role === "user")!.content) as {
        context: { candidates?: Array<{ id: string }>; factInvestigableCandidateIds?: string[]; presentation?: Array<{ candidateId: string; eligible: boolean }>; missingBlockingFields?: string[]; checkableCandidateIds?: string[] };
      };
      const context = payload.context;
      if ((context.missingBlockingFields?.length ?? 0) > 0) return response(JSON.stringify({ ...strictAction("ASK_USER"), question: "Please share your location.", relatedFields: ["area"] }), "agent-missing");
      if (!context.candidates?.length) return response(JSON.stringify(strictAction("SEARCH_RESTAURANTS")), "agent-search");
      if (context.factInvestigableCandidateIds?.length) {
        const ids = [...context.factInvestigableCandidateIds];
        if (this.reverse) ids.reverse();
        return response(JSON.stringify(strictAction("INVESTIGATE_CANDIDATE_FACTS", ids.slice(0, this.batchSize))), "agent-facts");
      }
      if (this.useAvailability && context.checkableCandidateIds?.length) return response(JSON.stringify(strictAction("CHECK_AVAILABILITY", context.checkableCandidateIds.slice(0, 3))), "agent-availability");
      if (this.useAvailability) return response(JSON.stringify(strictAction("END_READ")), "agent-end");
      const eligible = context.presentation?.filter((candidate) => candidate.eligible).map((candidate) => candidate.candidateId) ?? [];
      return response(JSON.stringify(strictAction("PRESENT_RESULTS", eligible)), "agent-present");
    }
    throw new Error(`Unexpected model purpose ${request.purpose}`);
  }
}

/** Two explicit user-request proposals; the second is not synthesized from the first. */
class UpdatedRequestModel extends ScriptedExternalModel {
  private semanticTurn = 0;

  override async complete(request: ModelRequest): Promise<ModelResponse> {
    if (request.purpose !== "restaurant_semantic_interpret") return super.complete(request);
    this.semanticTurn += 1;
    const revised = this.semanticTurn > 1;
    return response(JSON.stringify({
      schemaVersion: "3",
      facts: [
        { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "RECOMMENDATION", query: "afternoon cafes" } },
        { field: "DATE", operation: "ASSERT", value: revised ? { kind: "DATE", value: "2026-09-18", raw: "Friday" } : { kind: "DATE", relativeDay: "TOMORROW", raw: "tomorrow" } },
        { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTERNOON", raw: "afternoon" } },
        { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: revised ? 4 : 2 } },
        { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
        { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "cafe", polarity: "POSITIVE", strength: "HARD" } },
      ],
    }), `semantic-request-${this.semanticTurn}`);
  }
}

/** Explicit source conflict control; the negative criterion is test input, not inferred from a result. */
class MixedStatusModel extends ScriptedExternalModel {
  override async complete(request: ModelRequest): Promise<ModelResponse> {
    if (request.purpose === "restaurant_fact_judgment") {
      const input = JSON.parse(request.messages.find((message) => message.role === "user")!.content) as {
        candidate: { name: string }; observations: Array<{ evidenceId: string }>;
      };
      return response(JSON.stringify({ judgments: [{
        criterion: "hot pot restaurant",
        outcome: input.candidate.name === "Source Hot Pot" ? "CONFLICT" : "SUPPORTED",
        evidenceIds: input.observations.map((observation) => observation.evidenceId),
      }] }), `fact-judgment:${input.candidate.name}`);
    }
    if (request.purpose !== "restaurant_semantic_interpret") return super.complete(request);
    return response(JSON.stringify({
      schemaVersion: "3",
      facts: [
        { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "RECOMMENDATION", query: "afternoon cafes" } },
        { field: "DATE", operation: "ASSERT", value: { kind: "DATE", relativeDay: "TOMORROW", raw: "tomorrow" } },
        { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTERNOON", raw: "tomorrow afternoon" } },
        { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
        { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
        { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "cafe", polarity: "POSITIVE", strength: "HARD" } },
        { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "hot pot restaurant", polarity: "NEGATIVE", strength: "HARD" } },
      ],
    }), "semantic-mixed-status");
  }
}

function noAvailabilityPort() {
  return {
    executionRoute: "GENERIC_BROWSER" as const,
    async check() { throw new Error("Recommendation integration must not check availability"); },
  };
}

function googleSearch(
  recordedBodies: Record<string, unknown>[],
  options: ConstructorParameters<typeof GooglePlacesRestaurantSearch>[3] = { maxRequests: 100 },
  names = ["one", "two", "three"],
  detailIds: string[] = [],
) {
  const places = names.map((id, index) => ({
    id: `cafe-${id}`,
    displayName: { text: `Cafe ${id}` },
    formattedAddress: `Ginza ${index + 1}, Chuo City, Tokyo`,
    location: { latitude: 35.6697 + index * 0.0001, longitude: 139.7670 },
    types: ["restaurant"],
  }));
  const client = new GooglePlacesClient({
    apiKey: "test-key",
    fetchImplementation: async (url, init) => {
      if (init?.method === "POST") {
        recordedBodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        return new Response(JSON.stringify({ places }), { status: 200 });
      }
      const id = String(url).split("/").at(-1)!;
      detailIds.push(id);
      return new Response(JSON.stringify({
        id,
        displayName: { text: `Cafe ${id.replace("cafe-", "")}` },
        formattedAddress: "Ginza, Chuo City, Tokyo",
        location: { latitude: 35.6698, longitude: 139.7670 },
        types: ["cafe", "restaurant"],
        primaryType: "cafe",
        regularOpeningHours: { weekdayDescriptions: ["Wednesday: 10:00 AM – 6:00 PM", "Thursday: 10:00 AM – 6:00 PM"] },
      }), { status: 200 });
    },
  });
  return new GooglePlacesRestaurantSearch(client, () => now.toISOString(), 10, options);
}

/**
 * These are source facts, not expectations derived from the request.  Each
 * independently says that a named venue is a cafe with the stated hours; the
 * sequence oracle below only records which source samples it deliberately
 * selected.  Mixed/conflicting source samples stay covered by the real
 * Google/website composition tests below and by the artifact evaluator.
 */
const INDEPENDENT_FACT_SAMPLES = [
  { id: "amber", outletName: "Amber Cafe", types: ["cafe", "restaurant"], hours: ["Wednesday: 10:00 AM – 6:00 PM", "Thursday: 10:00 AM – 6:00 PM"] },
  { id: "birch", outletName: "Birch Coffee", types: ["cafe", "restaurant"], hours: ["Wednesday: 11:00 AM – 7:00 PM", "Thursday: 11:00 AM – 7:00 PM"] },
  { id: "copper", outletName: "Copper Cafe", types: ["cafe", "restaurant"], hours: ["Wednesday: 9:00 AM – 8:00 PM", "Thursday: 9:00 AM – 8:00 PM"] },
  { id: "dawn", outletName: "Dawn Coffee", types: ["cafe", "restaurant"], hours: ["Wednesday: 8:00 AM – 6:00 PM", "Thursday: 8:00 AM – 6:00 PM"] },
  { id: "elm", outletName: "Elm Cafe", types: ["cafe", "restaurant"], hours: ["Wednesday: 10:00 AM – 8:00 PM", "Thursday: 10:00 AM – 8:00 PM"] },
] as const;

type IndependentFactSample = typeof INDEPENDENT_FACT_SAMPLES[number];

function googleSearchFromIndependentSamples(
  samples: readonly IndependentFactSample[],
  detailIds: string[],
  currentTime: () => string = () => now.toISOString(),
) {
  const byId = new Map<string, IndependentFactSample>(samples.map((sample): [string, IndependentFactSample] => [sample.id, sample]));
  const places = samples.map((sample, index) => ({
    id: `cafe-${sample.id}`,
    displayName: { text: sample.outletName },
    formattedAddress: `Ginza ${index + 1}, Chuo City, Tokyo`,
    location: { latitude: 35.6697 + index * 0.0001, longitude: 139.7670 },
    types: ["restaurant"],
  }));
  const client = new GooglePlacesClient({
    apiKey: "test-key",
    fetchImplementation: async (url, init) => {
      if (init?.method === "POST") return new Response(JSON.stringify({ places }), { status: 200 });
      const id = String(url).split("/").at(-1)!.replace("cafe-", "");
      const sample = byId.get(id);
      if (!sample) return new Response(JSON.stringify({}), { status: 404 });
      detailIds.push(id);
      return new Response(JSON.stringify({
        id: `cafe-${sample.id}`,
        displayName: { text: sample.outletName },
        formattedAddress: "Ginza, Chuo City, Tokyo",
        location: { latitude: 35.6698, longitude: 139.7670 },
        types: sample.types,
        primaryType: "cafe",
        regularOpeningHours: { weekdayDescriptions: sample.hours },
      }), { status: 200 });
    },
  });
  return new GooglePlacesRestaurantSearch(client, currentTime, 10, { maxRequests: 100 });
}

/**
 * A test-owned action plan. It derives batches only from the independently
 * selected source rows and candidate identities, never from production
 * `eligible`, `canEndRead`, or advertised legal-action lists.
 */
class IndependentSequenceModel implements ModelGateway {
  readonly actionSequence: string[] = [];
  private searched = false;
  private batches: string[][] | undefined;
  private nextBatch = 0;

  constructor(private readonly batchSize: number, private readonly reverse: boolean) {}

  async complete(request: ModelRequest): Promise<ModelResponse> {
    if (request.purpose === "restaurant_semantic_interpret") {
      return response(JSON.stringify({
        schemaVersion: "3",
        facts: [
          { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "RECOMMENDATION", query: "afternoon cafes" } },
          { field: "DATE", operation: "ASSERT", value: { kind: "DATE", relativeDay: "TOMORROW", raw: "tomorrow" } },
          { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTERNOON", raw: "tomorrow afternoon" } },
          { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
          { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
          { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "cafe", polarity: "POSITIVE", strength: "HARD" } },
        ],
      }), "semantic-independent-sequence");
    }
    if (request.purpose !== "restaurant_agent_decide") throw new Error(`Unexpected model purpose ${request.purpose}`);
    const payload = JSON.parse(request.messages.find((message) => message.role === "user")!.content) as { context: { candidates?: Array<{ id: string }> } };
    const candidateIds = payload.context.candidates?.map((candidate) => candidate.id) ?? [];
    if (!candidateIds.length) {
      const type = this.searched ? "END_READ" : "SEARCH_RESTAURANTS";
      this.searched = true;
      this.actionSequence.push(type);
      return response(JSON.stringify(strictAction(type)), `independent:${type}:${this.actionSequence.length}`);
    }
    if (!this.batches) {
      const ordered = [...candidateIds].sort();
      if (this.reverse) ordered.reverse();
      this.batches = Array.from({ length: Math.ceil(ordered.length / this.batchSize) }, (_, index) =>
        ordered.slice(index * this.batchSize, (index + 1) * this.batchSize));
    }
    // A later user refresh starts the same independently selected read plan
    // again. It is not inferred from the production context's action lists.
    if (this.nextBatch > this.batches.length) this.nextBatch = 0;
    const batch = this.batches[this.nextBatch++];
    if (batch?.length) {
      this.actionSequence.push(`INVESTIGATE_CANDIDATE_FACTS:${batch.join(",")}`);
      return response(JSON.stringify(strictAction("INVESTIGATE_CANDIDATE_FACTS", batch)), `independent:facts:${this.nextBatch}`);
    }
    this.actionSequence.push(`PRESENT_RESULTS:${candidateIds.sort().join(",")}`);
    return response(JSON.stringify(strictAction("PRESENT_RESULTS", candidateIds)), "independent:present");
  }
}

type IndependentSequence = { candidateCount: number; batchSize: number; reverse: boolean };

async function runIndependentSequence(sequence: IndependentSequence) {
  const samples = INDEPENDENT_FACT_SAMPLES.slice(0, sequence.candidateCount);
  const detailIds: string[] = [];
  const model = new IndependentSequenceModel(sequence.batchSize, sequence.reverse);
  const taskId = `integration:independent:${sequence.candidateCount}:${sequence.batchSize}:${sequence.reverse}`;
  const google = googleSearchFromIndependentSamples(samples, detailIds);
  const composition = createHybridReadComposition({
    taskId,
    runId: `run:${taskId}`,
    clock,
    model,
    search: google,
    availability: noAvailabilityPort(),
    facts: composeLiveRestaurantFactRead(google, {} as BrowserRuntime, model),
    loop: { maxSteps: 12, timeoutMs: 5_000 },
  });
  const semantic = await composition.interpretAndDispatch({ taskId, message: "Find cafes nearby tomorrow afternoon for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
  const loop = await composition.coordinator.run(taskId);
  return { samples, detailIds, model, loop, composition, state: composition.runtime.snapshot(taskId).domainState };
}

function sequenceFailure(result: Awaited<ReturnType<typeof runIndependentSequence>>): string | undefined {
  // The accepted discovery set comes from the source rows supplied to the
  // adapter boundary, never from the State that the system happened to retain.
  // This makes a discovery truncation observable instead of shrinking the
  // oracle along with the implementation under test.
  const expectedIds = result.samples.map((sample) => `cafe-${sample.id}`).sort();
  const sourceIdForCandidate = new Map(result.state.candidates.map((candidate) => [candidate.restaurant.id, candidate.restaurant.sourceIds.googlePlaces]));
  const discoveredIds = result.state.candidates.map((candidate) => candidate.restaurant.sourceIds.googlePlaces).filter((id): id is string => Boolean(id)).sort();
  if (result.samples.length === 0) {
    return result.loop.status === "TERMINAL" && result.state.phase === "NO_VERIFIED_RESULT"
      ? undefined
      : `zero candidates must end as a bounded no-result, got loop=${result.loop.status} phase=${result.state.phase}`;
  }
  if (discoveredIds.join("\n") !== expectedIds.join("\n")) return `discovery conservation=${discoveredIds.join(",")} expected=${expectedIds.join(",")}`;
  const factChecks = Object.keys(result.state.factChecks ?? {}).map((candidateId) => sourceIdForCandidate.get(candidateId)).filter((id): id is string => Boolean(id)).sort();
  if (factChecks.join("\n") !== expectedIds.join("\n")) return `fact-check coverage=${factChecks.join(",")} expected=${expectedIds.join(",")}`;
  const expectedDetailIds = result.samples.map((sample) => sample.id).sort();
  if ([...result.detailIds].sort().join("\n") !== expectedDetailIds.join("\n")) return `fact detail targets=${[...result.detailIds].sort().join(",")} expected=${expectedDetailIds.join(",")}`;
  if (new Set(result.detailIds).size !== result.detailIds.length) return `repeated fact detail reads=${result.detailIds.join(",")}`;
  if (result.loop.status !== "TERMINAL" || result.state.phase !== "PRESENT_RESULTS") return `supported source rows were not presented: loop=${result.loop.status} phase=${result.state.phase}`;
  const presented = result.state.presentedResults;
  const presentedIds = [...(presented?.candidateIds ?? [])].map((candidateId) => sourceIdForCandidate.get(candidateId)).filter((id): id is string => Boolean(id)).sort();
  if (presentedIds.join("\n") !== expectedIds.join("\n")) return `presented candidate conservation=${presentedIds.join(",")} expected=${expectedIds.join(",")}`;
  const cited = new Set(presented?.evidenceIds ?? []);
  for (const sourceId of expectedIds) {
    const candidateId = [...sourceIdForCandidate.entries()].find(([, value]) => value === sourceId)?.[0];
    if (!candidateId) return `missing candidate identity for source ${sourceId}`;
    const checkEvidence = result.state.factChecks?.[candidateId]?.evidenceIds ?? [];
    if (!checkEvidence.length || checkEvidence.some((evidenceId) => !cited.has(evidenceId))) return `presented evidence missing current fact support for ${candidateId}`;
    if (checkEvidence.some((evidenceId) => !result.state.readEvidence.some((evidence) => evidence.evidenceId === evidenceId && evidence.candidateId === candidateId))) return `fact evidence is not candidate-bound for ${candidateId}`;
  }
  return undefined;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4_294_967_296;
  };
}

const workspaceRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const hybridTestRelativePath = "src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts";

async function runCopiedHybridTest(testName: string, mutation?: { relativePath: string; from: string; to: string }) {
  const directory = await mkdtemp(join(tmpdir(), "praxis-contract-mutant-"));
  try {
    await cp(join(workspaceRoot, "src"), join(directory, "src"), { recursive: true });
    await cp(join(workspaceRoot, "package.json"), join(directory, "package.json"));
    await symlink(join(workspaceRoot, "node_modules"), join(directory, "node_modules"));
    if (mutation) {
      const path = join(directory, mutation.relativePath);
      const source = await readFile(path, "utf8");
      assert.ok(source.includes(mutation.from), `isolated mutation target was not found: ${mutation.relativePath}`);
      await writeFile(path, source.replace(mutation.from, mutation.to), "utf8");
    }
    const child = await new Promise<{ code: number | null; output: string }>((resolve, reject) => {
      const environment = { ...process.env };
      delete environment.NODE_TEST_CONTEXT;
      const childProcess = spawn(process.execPath, ["--import", "tsx", "--test", `--test-name-pattern=${testName}`, hybridTestRelativePath], {
        cwd: directory, stdio: ["ignore", "pipe", "pipe"], env: environment,
      });
      let output = "";
      childProcess.stdout.on("data", (chunk) => { output += String(chunk); });
      childProcess.stderr.on("data", (chunk) => { output += String(chunk); });
      childProcess.on("error", reject);
      childProcess.on("close", (code) => resolve({ code, output }));
    });
    return child;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("isolated implementation mutations are detected by passing Hybrid controls", async (t) => {
  // Source mutations are performed only in a disposable /tmp copy. Artifact-only
  // mutations live in diagnostic-evaluator.test.ts and likewise start from clones.
  const mutations = [
    {
      name: "M01 compiler drops an explicit party-size field",
      testName: "Hybrid production composition binds an explicit evaluation location before Agent investigation and independently evaluates its actual result",
      mutation: {
        relativePath: "src/domains/restaurant/semantic-compiler.ts",
        from: "patch.partySize = valueFor(fact, \"PARTY_SIZE\").value;",
        to: "// mutation: explicit PARTY_SIZE is silently dropped",
      },
      expectedBusinessAssertion: /explicit party-size must survive semantic compilation/,
    },
    {
      name: "M02 reducer discards fact checks from a prior batch",
      testName: "independent candidate reads preserve coverage and results across batch partitions and order",
      mutation: {
        relativePath: "src/domains/restaurant/task-definition.ts",
        from: "...(state.factChecks ?? {}),",
        to: "// mutation: fact checks from earlier batches are discarded",
      },
      expectedBusinessAssertion: /Same-scope reads repeated:/,
    },
    {
      name: "source mutation: discovery truncates accepted source candidates",
      testName: "independent source boundary controls cover zero, one, and exactly one fact-read batch",
      mutation: {
        relativePath: "src/integrations/google/google-places-restaurant-search.ts",
        from: "const grounded = places.map((place) => groundGoogleDiscovery(rawObservation(place), {",
        to: "const grounded = places.slice(0, 1).map((place) => groundGoogleDiscovery(rawObservation(place), { // mutation: discovery truncation",
      },
      expectedBusinessAssertion: /discovery conservation=/,
    },
  ] as const;
  for (const item of mutations) await t.test(item.name, async () => {
    const control = await runCopiedHybridTest(item.testName);
    assert.equal(control.code, 0, `control unexpectedly failed:\n${control.output}`);
    const mutant = await runCopiedHybridTest(item.testName, item.mutation);
    assert.notEqual(mutant.code, 0, `mutant unexpectedly passed:\n${mutant.output}`);
    // A compiler/import/setup error is not a killed mutant.  The selected
    // control must fail its named business assertion after it starts.
    assert.match(mutant.output, item.expectedBusinessAssertion, `${item.name} must fail its named business assertion:\n${mutant.output}`);
  });
});

test("independent source boundary controls cover zero, one, and exactly one fact-read batch", async (t) => {
  // Start/end: real Hybrid composition → independently specified Google rows → Runtime/Router/Grounding → end/presentation.
  // Replacements: model transport and Google HTTP only. The test-owned plan never reads `eligible` or `canEndRead`.
  // These are controls for the randomized/exceed-batch regressions below, not an assertion that every source result is positive.
  for (const sequence of [
    { candidateCount: 0, batchSize: 3, reverse: false },
    { candidateCount: 1, batchSize: 3, reverse: false },
    { candidateCount: 3, batchSize: 3, reverse: false },
  ] as const) await t.test(JSON.stringify(sequence), async () => {
    const result = await runIndependentSequence(sequence);
    assert.equal(sequenceFailure(result), undefined, JSON.stringify({ sequence, actions: result.model.actionSequence, details: result.detailIds, loop: result.loop, phase: result.state.phase }));
  });
});

test("a user refresh after the clock advances replaces the current fact observation without losing request fidelity", async () => {
  // Start/end: real composition → present a source-backed candidate → real user refresh event → re-read/present.
  // The clock and Google HTTP are controlled external boundaries; Interpreter, Compiler, Runtime, Context,
  // Validator, Router, and Grounding remain production code. This proves neither website compatibility nor
  // free-text semantic equivalence beyond the exact independently specified request fields.
  let current = new Date(now);
  const movingClock = { now: () => new Date(current) };
  const taskId = "integration:refresh-after-clock";
  const model = new IndependentSequenceModel(1, false);
  const detailIds: string[] = [];
  const google = googleSearchFromIndependentSamples(INDEPENDENT_FACT_SAMPLES.slice(0, 1), detailIds, () => current.toISOString());
  const composition = createHybridReadComposition({
    taskId, runId: "run:refresh-after-clock", clock: movingClock, model, search: google,
    availability: noAvailabilityPort(), facts: composeLiveRestaurantFactRead(google, {} as BrowserRuntime, model),
    loop: { maxSteps: 8, timeoutMs: 5_000 },
  });
  await composition.interpretAndDispatch({ taskId, message: "Find cafes nearby tomorrow afternoon for two.", referenceTime: current.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
  assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL");
  const initial = composition.runtime.snapshot(taskId);
  const candidateId = initial.domainState.presentedResults!.candidateIds[0]!;
  const priorFactEvidence = initial.domainState.factChecks?.[candidateId]?.evidenceIds ?? [];
  current = new Date("2026-09-16T04:00:00.000Z");
  await composition.runtime.dispatch({
    id: "event:refresh-after-clock", taskId,
    event: { type: "CANDIDATE_FACTS_REFRESH_REQUESTED", candidateIds: [candidateId] },
    occurredAt: current.toISOString(),
    trace: { schemaVersion: "1", runId: "run:refresh-after-clock", correlationId: "event:refresh-after-clock", actor: "SYSTEM" },
  }, initial.version);
  assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL");
  const refreshed = composition.runtime.snapshot(taskId).domainState;
  assert.equal(refreshed.phase, "PRESENT_RESULTS");
  assert.equal(refreshed.intentDraft?.date, "2026-09-17");
  assert.equal(refreshed.intentDraft?.partySize, 2);
  assert.equal(refreshed.factChecks?.[candidateId]?.checkedAt, current.toISOString());
  assert.notDeepEqual(refreshed.factChecks?.[candidateId]?.evidenceIds, priorFactEvidence, "the refreshed observation must replace the current source reference");
  assert.equal(new Set(detailIds).size, 1, `refresh should re-read one current candidate, got ${detailIds.join(",")}`);
  assert.equal(detailIds.length, 2, "one initial and one refresh source read are expected");
});

test("cancelling during a real in-flight fact read cannot become a normal no-result", async () => {
  // Start/end: semantic input → actual Router-owned Google Details wait → parent cancellation → Runtime termination.
  // Only the HTTP boundary blocks. This does not prove browser cancellation, which has a separate local Chromium fixture.
  let beginDetail: (() => void) | undefined;
  const detailStarted = new Promise<void>((resolve) => { beginDetail = resolve; });
  const client = new GooglePlacesClient({
    apiKey: "test-key",
    fetchImplementation: async (_url, init) => {
      if (init?.method === "POST") return new Response(JSON.stringify({ places: [{
        id: "cafe-cancel", displayName: { text: "Cancel Cafe" }, formattedAddress: "Ginza, Chuo City, Tokyo",
        location: { latitude: 35.6697, longitude: 139.7670 }, types: ["restaurant"],
      }] }), { status: 200 });
      beginDetail!();
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        if (signal?.aborted) reject(signal.reason);
        else signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
      });
    },
  });
  const google = new GooglePlacesRestaurantSearch(client, () => now.toISOString(), 10, { maxRequests: 100 });
  const taskId = "integration:cancel-in-flight-facts";
  const composition = createHybridReadComposition({
    taskId, runId: "run:cancel-in-flight-facts", clock, model: new ScriptedExternalModel(1), search: google,
    availability: noAvailabilityPort(), facts: composeLiveRestaurantFactRead(google, {} as BrowserRuntime, new ScriptedExternalModel(1)),
    loop: { maxSteps: 8, timeoutMs: 5_000 },
  });
  await composition.interpretAndDispatch({ taskId, message: "Find cafes nearby tomorrow afternoon for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
  const controller = new AbortController();
  const run = composition.coordinator.run(taskId, controller.signal);
  await detailStarted;
  controller.abort(new Error("user cancelled while facts were loading"));
  const result = await run;
  const state = composition.runtime.snapshot(taskId).domainState;
  assert.equal(result.status, "CANCELLED");
  assert.equal(state.phase, "FAILED");
  assert.equal(state.failure?.code, "AGENT_LOOP_CANCELLED");
  assert.equal(state.noVerifiedResult, undefined);
  assert.equal(state.presentedResults, undefined);
});

test("a request update after cancelling an in-flight read starts a new authoritative investigation", async () => {
  // The first source request blocks until its user-owned cancellation reaches the HTTP boundary.
  // The second semantic proposal is an independently specified date/party update. Old discovery,
  // fact evidence and request values must not cross the Runtime reset into the new investigation.
  let firstDetailStarted: (() => void) | undefined;
  const firstDetail = new Promise<void>((resolve) => { firstDetailStarted = resolve; });
  let detailCalls = 0;
  const client = new GooglePlacesClient({
    apiKey: "test-key",
    fetchImplementation: async (_url, init) => {
      if (init?.method === "POST") return new Response(JSON.stringify({ places: [{
        id: "cafe-revision", displayName: { text: "Revision Cafe" }, formattedAddress: "Ginza, Chuo City, Tokyo",
        location: { latitude: 35.6697, longitude: 139.7670 }, types: ["restaurant"],
      }] }), { status: 200 });
      detailCalls += 1;
      if (detailCalls === 1) {
        firstDetailStarted!();
        return new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          if (signal?.aborted) reject(signal.reason);
          else signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
        });
      }
      return new Response(JSON.stringify({
        id: "cafe-revision", displayName: { text: "Revision Cafe" }, formattedAddress: "Ginza, Chuo City, Tokyo",
        location: { latitude: 35.6697, longitude: 139.7670 }, types: ["cafe", "restaurant"], primaryType: "cafe",
        regularOpeningHours: { weekdayDescriptions: ["Thursday: 10:00 AM – 6:00 PM", "Friday: 10:00 AM – 6:00 PM"] },
      }), { status: 200 });
    },
  });
  const model = new UpdatedRequestModel(1);
  const google = new GooglePlacesRestaurantSearch(client, () => now.toISOString(), 10, { maxRequests: 100 });
  const taskId = "integration:request-update-after-cancel";
  const composition = createHybridReadComposition({
    taskId, runId: "run:request-update-after-cancel", clock, model, search: google,
    availability: noAvailabilityPort(), facts: composeLiveRestaurantFactRead(google, {} as BrowserRuntime, model),
    loop: { maxSteps: 8, timeoutMs: 5_000 },
  });
  await composition.interpretAndDispatch({ taskId, message: "Find cafes nearby tomorrow afternoon for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
  const controller = new AbortController();
  const oldRun = composition.coordinator.run(taskId, controller.signal);
  await firstDetail;
  controller.abort(new Error("request changed"));
  assert.equal((await oldRun).status, "CANCELLED");
  const cancelled = composition.runtime.snapshot(taskId);
  assert.equal(cancelled.domainState.phase, "FAILED");
  await composition.interpretAndDispatch({ taskId, message: "Actually Friday afternoon for four.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
  const revisedBeforeRead = composition.runtime.snapshot(taskId).domainState;
  assert.equal(revisedBeforeRead.investigationRevision, (cancelled.domainState.investigationRevision ?? 0) + 1, JSON.stringify({
    cancelledRevision: cancelled.domainState.investigationRevision,
    revisedRevision: revisedBeforeRead.investigationRevision,
    cancelledDraft: cancelled.domainState.intentDraft,
    revisedDraft: revisedBeforeRead.intentDraft,
  }));
  assert.equal(revisedBeforeRead.intentDraft?.date, "2026-09-18");
  assert.equal(revisedBeforeRead.intentDraft?.partySize, 4);
  assert.deepEqual(revisedBeforeRead.candidates, []);
  assert.deepEqual(revisedBeforeRead.readEvidence, []);
  assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL");
  const revised = composition.runtime.snapshot(taskId).domainState;
  assert.equal(revised.phase, "PRESENT_RESULTS");
  assert.equal(revised.intentDraft?.date, "2026-09-18");
  assert.equal(revised.intentDraft?.partySize, 4);
  assert.equal(revised.candidates.length, 1);
  assert.equal(Object.keys(revised.factChecks ?? {}).length, 1);
  assert.equal(detailCalls, 2);
});

test("fixed-seed bounded exploration records and shrinks an independent Hybrid contract failure", async () => {
  // This is deliberately finite: it exercises batch boundaries and legal independent read order,
  // rather than pretending all action permutations are equivalent. Failure output is the durable
  // reproduction record: fixed seed, generated sequence, actual action trace, and minimized case.
  const seed = 0x5EEDC0DE;
  const random = seededRandom(seed);
  const candidateCounts = [0, 1, 3, 4, 5];
  const actualSequence: IndependentSequence[] = Array.from({ length: 8 }, () => ({
    candidateCount: candidateCounts[Math.floor(random() * candidateCounts.length)]!,
    batchSize: random() < 0.5 ? 1 : 3,
    reverse: random() < 0.5,
  }));
  const attempts: Array<{ sequence: IndependentSequence; failure?: string; actions: string[]; details: string[]; loop: string; phase: string }> = [];
  for (const sequence of actualSequence) {
    const result = await runIndependentSequence(sequence);
    const failure = sequenceFailure(result);
    attempts.push({ sequence, ...(failure ? { failure } : {}), actions: result.model.actionSequence, details: result.detailIds, loop: result.loop.status, phase: result.state.phase });
  }
  const first = attempts.find((attempt) => attempt.failure);
  if (!first) return;

  // Smallest candidate count first, then smaller batch and normal order. A candidate is removed
  // only when the independently observed contract failure remains; no production action catalog
  // participates in shrinking.
  let minimized: typeof first | undefined;
  for (let count = 0; count <= first.sequence.candidateCount && !minimized; count += 1) {
    for (const batchSize of [1, 3]) {
      if (batchSize > Math.max(count, 1) || minimized) continue;
      for (const reverse of [false, true]) {
        const sequence = { candidateCount: count, batchSize, reverse };
        const result = await runIndependentSequence(sequence);
        const failure = sequenceFailure(result);
        if (failure) {
          minimized = { sequence, failure, actions: result.model.actionSequence, details: result.detailIds, loop: result.loop.status, phase: result.state.phase };
          break;
        }
      }
    }
  }
  assert.fail(JSON.stringify({
    contract: "state accumulation / independent read order",
    seed: `0x${seed.toString(16)}`,
    actualSequence,
    firstFailure: first,
    minimizedFailure: minimized ?? first,
  }, null, 2));
});

test("Hybrid production composition binds an explicit evaluation location before Agent investigation and independently evaluates its actual result", async () => {
  // Start/end: semantic user input → PRESENT_RESULTS + evaluator. External replacements: Model transport, Google HTTP, unused browser runtime.
  // Catches: adapter-only evaluation coordinates, lost semantic fields, old three-request cap, or evidence that cannot support the displayed result.
  // Does not prove: a real model's judgment, real Google data, or browser website compatibility.
  const bodies: Record<string, unknown>[] = [];
  const model = new ScriptedExternalModel();
  const google = googleSearch(bodies);
  const composition = createHybridReadComposition({
    taskId: "integration:nearby-cafes",
    runId: "run:integration:nearby-cafes",
    clock,
    model,
    search: google,
    availability: noAvailabilityPort(),
    facts: composeLiveRestaurantFactRead(google, {} as BrowserRuntime, model),
    router: { structuredReadTimeoutMs: 1_000, browserReadTimeoutMs: 1_000 },
    loop: { maxSteps: 8, timeoutMs: 5_000 },
  });

  const semantic = await composition.interpretAndDispatch({
    taskId: "integration:nearby-cafes", message: "Find cafes nearby tomorrow afternoon for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo",
  }, HIGASHI_GINZA_EVALUATION_LOCATION);
  assert.equal(semantic.status, "PROPOSED");
  const loop = await composition.coordinator.run("integration:nearby-cafes");
  const snapshot = composition.runtime.snapshot("integration:nearby-cafes");

  assert.equal(loop.status, "TERMINAL");
  assert.equal(snapshot.domainState.phase, "PRESENT_RESULTS");
  assert.deepEqual(snapshot.domainState.intentDraft?.area?.coordinates, {
    latitude: HIGASHI_GINZA_EVALUATION_LOCATION.latitude,
    longitude: HIGASHI_GINZA_EVALUATION_LOCATION.longitude,
    observedAt: now.toISOString(),
    source: "EVALUATION",
  });
  assert.equal(snapshot.domainState.intentDraft?.date, "2026-09-17");
  assert.deepEqual(snapshot.domainState.intentDraft?.timeWindow, { earliest: "12:00", latest: "17:00" });
  assert.deepEqual(snapshot.domainState.intentDraft?.temporalResolution, {
    policyVersion: "restaurant-temporal-materialization@2", referenceTime: now.toISOString(), timezone: "Asia/Tokyo",
    date: { expression: "tomorrow", resolvedDate: "2026-09-17", basis: "TOMORROW" },
    timeWindow: { expression: "tomorrow afternoon", resolvedTimeWindow: { earliest: "12:00", latest: "17:00" }, basis: "DAYPART:AFTERNOON" },
  });
  assert.equal(snapshot.domainState.intentDraft?.partySize, 2, "explicit party-size must survive semantic compilation");
  assert.equal(snapshot.domainState.intentDraft?.criteria[0]?.text, "cafe");
  assert.deepEqual(bodies[0]?.locationBias, {
    circle: { center: { latitude: HIGASHI_GINZA_EVALUATION_LOCATION.latitude, longitude: HIGASHI_GINZA_EVALUATION_LOCATION.longitude }, radius: HIGASHI_GINZA_EVALUATION_LOCATION.radiusMeters },
  });
  const readRunId = `${snapshot.runId}:investigation:${snapshot.domainState.investigationRevision}`;
  assert.deepEqual(google.googleRequestUsage(readRunId), {
    limit: 100, total: 4, namedPlaceResolution: 0, discovery: 1, placeDetails: 3,
  });
  const evaluation = evaluateRestaurantHybridLiveArtifact({
    status: "SUCCEEDED", stage: "AGENT_LOOP", caseId: "integration-nearby-cafes", runId: snapshot.runId,
    materializedCase: { semantic: { target: { goal: "RECOMMENDATION" }, date: { value: "2026-09-17" }, party_size: 2, time: { start: "12:00", end: "17:00" }, location: { value: "nearby", relation: "NEAR_USER" }, criteria: [{ value: "cafe", polarity: "POSITIVE", strength: "HARD" }] } },
    finalSnapshot: snapshot,
    trajectories: composition.trajectories.steps,
    loop: { status: "TERMINAL" },
    resourceUsage: { elapsedMs: 0, agentDecisions: 3, browserModelCalls: 0, googleRequests: google.googleRequestUsage(readRunId) },
  }, { path: "integration.result.json", sha256: "a".repeat(64) });
  assert.equal(evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(evaluation));
  assert.ok(evaluation.findings.every((finding) => finding.status === "SATISFIED"), JSON.stringify(evaluation.findings));
});

test("Hybrid production composition asks for location without an evaluation context and never calls a source", async () => {
  // Start/end: semantic user input → NEEDS_INPUT. External replacements: same model/API boundaries as above.
  // Catches: accidental default evaluation position. Does not prove device permission UX, which is covered by the persistent Web HTTP tests.
  const bodies: Record<string, unknown>[] = [];
  const model = new ScriptedExternalModel();
  const google = googleSearch(bodies);
  const composition = createHybridReadComposition({
    taskId: "integration:no-location", runId: "run:integration:no-location", clock, model, search: google,
    availability: noAvailabilityPort(), facts: composeLiveRestaurantFactRead(google, {} as BrowserRuntime, model),
    loop: { maxSteps: 3, timeoutMs: 5_000 },
  });
  await composition.interpretAndDispatch({ taskId: "integration:no-location", message: "Find cafes nearby tomorrow afternoon for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" });
  const loop = await composition.coordinator.run("integration:no-location");
  const snapshot = composition.runtime.snapshot("integration:no-location");
  assert.equal(loop.status, "WAITING_USER");
  assert.equal(snapshot.domainState.phase, "NEEDS_INPUT");
  assert.equal(snapshot.domainState.intentDraft?.area?.coordinates, undefined);
  assert.equal(bodies.length, 0);
});

test("an adapter-only evaluation coordinate reproduces the old wiring failure and cannot bypass the authoritative Agent context", async () => {
  // Start/end: semantic user input → NEEDS_INPUT with the retired adapter-only configuration present.
  // Catches: reintroducing a private Google coordinate as a substitute for State. Does not prove live geolocation.
  const bodies: Record<string, unknown>[] = [];
  const model = new ScriptedExternalModel();
  const google = googleSearch(bodies, { maxRequests: 100, evaluationLocation: HIGASHI_GINZA_EVALUATION_LOCATION });
  const composition = createHybridReadComposition({
    taskId: "integration:adapter-only-location", runId: "run:integration:adapter-only-location", clock, model, search: google,
    availability: noAvailabilityPort(), facts: composeLiveRestaurantFactRead(google, {} as BrowserRuntime, model),
    loop: { maxSteps: 3, timeoutMs: 5_000 },
  });
  await composition.interpretAndDispatch({ taskId: "integration:adapter-only-location", message: "Find cafes nearby tomorrow afternoon for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" });
  const loop = await composition.coordinator.run("integration:adapter-only-location");
  assert.equal(loop.status, "WAITING_USER");
  assert.equal(composition.runtime.snapshot("integration:adapter-only-location").domainState.intentDraft?.area?.coordinates, undefined);
  assert.equal(bodies.length, 0, "the private adapter setting cannot receive a request before Agent validation");
});

test("real source observations distinguish a supported candidate from an explicit type conflict", async () => {
  // Start/end: two discovery candidates → real Details grounding → only the independently supported cafe is presentable.
  // The facts below are source samples, not expectations reverse-engineered from intent or production eligibility.
  // Catches: losing an explicit conflict, treating a broad discovery type as a fact, or applying one candidate's proof to another.
  const model = new MixedStatusModel(2);
  const places = [
    { id: "source-cafe", displayName: { text: "Source Cafe" }, formattedAddress: "Ginza 1, Tokyo", location: { latitude: 35.6697, longitude: 139.7670 }, types: ["restaurant"] },
    { id: "source-hot-pot", displayName: { text: "Source Hot Pot" }, formattedAddress: "Ginza 2, Tokyo", location: { latitude: 35.6698, longitude: 139.7671 }, types: ["restaurant"] },
  ];
  const client = new GooglePlacesClient({ apiKey: "test-key", fetchImplementation: async (url, init) => {
    if (init?.method === "POST") return new Response(JSON.stringify({ places }), { status: 200 });
    const id = String(url).split("/").at(-1);
    if (id === "source-cafe") return new Response(JSON.stringify({
      ...places[0], types: ["cafe", "restaurant"], primaryType: "cafe",
      regularOpeningHours: { weekdayDescriptions: ["Wednesday: 10:00 AM – 6:00 PM", "Thursday: 10:00 AM – 6:00 PM"] },
    }), { status: 200 });
    return new Response(JSON.stringify({
      ...places[1], types: ["hot_pot_restaurant", "restaurant"], primaryType: "hot_pot_restaurant",
      regularOpeningHours: { weekdayDescriptions: ["Wednesday: 10:00 AM – 6:00 PM", "Thursday: 10:00 AM – 6:00 PM"] },
    }), { status: 200 });
  } });
  const google = new GooglePlacesRestaurantSearch(client, () => now.toISOString(), 10, { maxRequests: 100 });
  const taskId = "integration:source-statuses";
  const composition = createHybridReadComposition({
    taskId, runId: "run:source-statuses", clock, model, search: google,
    availability: noAvailabilityPort(), facts: composeLiveRestaurantFactRead(google, {} as BrowserRuntime, model), loop: { maxSteps: 5, timeoutMs: 5_000 },
  });
  await composition.interpretAndDispatch({ taskId, message: "Find cafes nearby tomorrow afternoon for two, but not hot pot restaurants.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
  const loop = await composition.coordinator.run(taskId);
  const state = composition.runtime.snapshot(taskId).domainState;
  const cafeId = state.candidates.find((candidate) => candidate.restaurant.sourceIds.googlePlaces === "source-cafe")!.restaurant.id;
  const hotPotId = state.candidates.find((candidate) => candidate.restaurant.sourceIds.googlePlaces === "source-hot-pot")!.restaurant.id;
  assert.equal(loop.status, "TERMINAL");
  assert.equal(state.factChecks?.[cafeId]?.status, "COMPLETED");
  assert.equal(state.factChecks?.[hotPotId]?.status, "COMPLETED");
  assert.ok(state.readEvidence.some((item) => item.candidateId === cafeId
    && Array.isArray(item.claims.verifiedHardCriteria) && item.claims.verifiedHardCriteria.includes("cafe")));
  assert.ok(state.readEvidence.some((item) => item.candidateId === hotPotId
    && Array.isArray(item.claims.violatedNegativeCriteria) && item.claims.violatedNegativeCriteria.includes("hot pot restaurant")));
  assert.deepEqual(state.presentedResults?.candidateIds, [cafeId]);
});

test("independent candidate reads preserve coverage and results across batch partitions and order", async (t) => {
  // Start/end: real Hybrid initialization + semantic message → source-produced facts → terminal result + independent evaluator.
  // Only external model transport and Google HTTP are replaced. No intermediate State or evidence injection.
  // Oracle: four source-confirmed open cafes remain checked and presentable regardless of legal read partition/order.
  // Catches: cross-batch check loss and repeat reads. Does not establish real-model planning quality or live inventory.
  for (const [batchSize, reverse] of [[3, false], [1, false], [3, true]] as const) {
    await t.test(`batch=${batchSize}, reverse=${reverse}`, async () => {
      const model = new ScriptedExternalModel(batchSize, reverse);
      const details: string[] = [];
      const google = googleSearch([], { maxRequests: 100 }, ["one", "two", "three", "four"], details);
      const taskId = "integration:batch-invariance";
      const composition = createHybridReadComposition({
        taskId, runId: "run:batch-invariance", clock, model, search: google,
        availability: noAvailabilityPort(), facts: composeLiveRestaurantFactRead(google, {} as BrowserRuntime, model),
        loop: { maxSteps: 10, timeoutMs: 5_000 },
      });
      const semantic = await composition.interpretAndDispatch({ taskId, message: "Find cafes nearby tomorrow afternoon for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
      assert.equal(semantic.status, "PROPOSED");
      const loop = await composition.coordinator.run(taskId);
      const snapshot = composition.runtime.snapshot(taskId);
      const artifact = {
        status: loop.status === "TERMINAL" ? "SUCCEEDED" : "FAILED", loop, finalSnapshot: snapshot,
        materializedCase: { semantic: { target: { goal: "RECOMMENDATION" }, date: { value: "2026-09-17" }, party_size: 2, time: { start: "12:00", end: "17:00" }, location: { value: "nearby", relation: "NEAR_USER" }, criteria: [{ value: "cafe", polarity: "POSITIVE", strength: "HARD" }] } },
        trajectories: composition.trajectories.steps,
        resourceUsage: { elapsedMs: 0, agentDecisions: composition.trajectories.steps.length, browserModelCalls: 0 },
      };
      const evaluation = evaluateRestaurantHybridLiveArtifact(artifact, { path: "synthetic-batch.result.json", sha256: "b".repeat(64) });
      assert.equal(new Set(details).size, details.length, `Same-scope reads repeated: ${details.join(", ")}; loop=${loop.status}`);
      assert.equal(loop.status, "TERMINAL");
      assert.deepEqual(Object.keys(snapshot.domainState.factChecks ?? {}).sort(), snapshot.domainState.candidates.map(c => c.restaurant.id).sort());
      assert.equal(snapshot.domainState.phase, "PRESENT_RESULTS");
      assert.ok(snapshot.domainState.presentedResults!.candidateIds.length > 0);
      assert.equal(evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(evaluation));
      assert.equal(evaluation.findings.find(f => f.dimension === "INVESTIGATION_BEHAVIOR")?.status, "SATISFIED");
    });
  }
});

test("Google fact exhaustion must leave a separately executable browser investigation reachable", async (t) => {
  for (const maxRequests of [100, 1]) await t.test(`Google limit=${maxRequests}`, async () => {
  // Start/end: real Hybrid initialization → actual Google budget exhaustion → real availability composition → browser boundary.
  // External replacements: model transport, Google HTTP, browser snapshots. No source port, Grounding or State is mocked.
  // Oracle: a Google quota cannot prevent a still-legal read from reaching the independent browser source.
  // Browser challenge is deliberate: this checks reachability and honest UNKNOWN, not positive inventory.
  const visited: string[] = [];
  const browser: BrowserRuntime = { openSession: async () => {
    let url = "about:blank";
    return {
      metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: now.toISOString() },
      navigate: async target => { url = target; visited.push(url); },
      snapshot: async () => ({ url, title: "Just a moment...", text: "Verify you are human", html: '<div id="cf-chl-widget">Verify you are human</div>' }),
      click: async () => { throw new Error("Challenge fixture must not click"); },
      fill: async () => { throw new Error("Challenge fixture must not fill"); },
      select: async () => [], waitFor: async () => {}, screenshot: async () => new Uint8Array(), close: async () => {},
    };
  } };
  const model = new ScriptedExternalModel(3, false, true);
  const google = googleSearch([], { maxRequests }); // 100 is the boundary control; 1 injects exhaustion, never changes Live budget
  const taskId = "integration:independent-source";
  const composition = createHybridReadComposition({
    taskId, runId: "run:independent-source", clock, model, search: google,
    availability: new LiveBrowserAvailability(browser, model), facts: composeLiveRestaurantFactRead(google, browser, model),
    loop: { maxSteps: 7, timeoutMs: 5_000 },
  });
  await composition.interpretAndDispatch({ taskId, message: "Find cafes nearby tomorrow afternoon for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
  const loop = await composition.coordinator.run(taskId);
  const state = composition.runtime.snapshot(taskId).domainState;
  if (maxRequests === 1) assert.equal(state.sourceReadState?.googlePlacesSearchBudget, "EXHAUSTED");
  assert.ok(visited.some(url => new URL(url).hostname.endsWith("tablecheck.com")), `Browser source never received a request; loop=${loop.status}, failure=${state.failure?.code}`);
  assert.ok(Object.values(state.availabilityChecks).length > 0);
  assert.ok(Object.values(state.availabilityChecks).every(check => check.status === "UNKNOWN"));
  });
});

test("a website observation for another candidate cannot revive an unknown Google fact", async () => {
  // Start/end: actual Hybrid semantic input → Google discovery/Details + website HTML → Reducer → presentation.
  // Only model transport, Google HTTP and browser snapshots are synthetic. Grounding and source composition are real.
  // Independent oracle: A was a cafe at discovery, but its current fact read failed; B's website cannot renew A's facts.
  const model = new ScriptedExternalModel();
  const sharedPlace = { formattedAddress: "1 Ginza, Tokyo", location: { latitude: 35.6698, longitude: 139.7670 } };
  const a = { ...sharedPlace, id: "scope-a", displayName: { text: "Cafe A" }, types: ["cafe", "restaurant"], regularOpeningHours: { weekdayDescriptions: ["Thursday: 10:00 AM – 6:00 PM"] } };
  const b = { ...sharedPlace, id: "scope-b", displayName: { text: "Cafe B" }, types: ["restaurant"], websiteUri: "https://cafe.example/about" };
  const client = new GooglePlacesClient({ apiKey: "test-key", fetchImplementation: async (url, init) => {
    if (init?.method === "POST") return new Response(JSON.stringify({ places: [a, b] }), { status: 200 });
    const id = String(url).split("/").at(-1);
    return id === a.id ? new Response(JSON.stringify({ id: a.id }), { status: 200 }) : new Response(JSON.stringify(b), { status: 200 });
  } });
  const google = new GooglePlacesRestaurantSearch(client, () => now.toISOString(), 10, { maxRequests: 100 });
  const html = `<script type="application/ld+json">${JSON.stringify({ "@type": "CafeOrCoffeeShop", name: "Cafe B", address: b.formattedAddress, servesCuisine: "cafe", openingHoursSpecification: { dayOfWeek: "Thursday", opens: "10:00", closes: "18:00" } })}</script>`;
  const browser: BrowserRuntime = { openSession: async () => ({
    metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: now.toISOString() },
    navigate: async () => {}, snapshot: async () => ({ url: b.websiteUri, title: "Cafe B", text: "Cafe B", html }),
    click: async () => { throw new Error("The complete source page needs no action"); }, fill: async () => {}, select: async () => [],
    waitFor: async () => {}, screenshot: async () => new Uint8Array(), close: async () => {},
  }) };
  const taskId = "integration:mixed-source-scope";
  const composition = createHybridReadComposition({ taskId, runId: "run:mixed-source-scope", clock, model, search: google,
    availability: noAvailabilityPort(), facts: composeLiveRestaurantFactRead(google, browser, model), loop: { maxSteps: 5, timeoutMs: 5_000 },
  });
  await composition.interpretAndDispatch({ taskId, message: "Find cafes nearby tomorrow afternoon for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
  await composition.coordinator.run(taskId);
  const state = composition.runtime.snapshot(taskId).domainState;
  const aId = state.candidates.find(c => c.restaurant.sourceIds.googlePlaces === a.id)!.restaurant.id;
  const bId = state.candidates.find(c => c.restaurant.sourceIds.googlePlaces === b.id)!.restaurant.id;
  assert.equal(state.factChecks?.[aId]?.status, "UNKNOWN", "Fixture must reach A's real failed Details read");
  assert.ok(state.readEvidence.some(e => e.candidateId === bId && e.provider === "RESTAURANT_WEBSITE" && e.kind === "RESTAURANT_FACT"), "Fixture must reach the real website evidence producer");
  assert.ok(state.presentedResults?.candidateIds.includes(bId), "B's independent supported result must remain deliverable");
  assert.ok(!state.presentedResults?.candidateIds.includes(aId), "B's website must not make A's superseded Google fact eligible");
});
