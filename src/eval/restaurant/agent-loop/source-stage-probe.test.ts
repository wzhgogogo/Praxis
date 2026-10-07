import assert from "node:assert/strict";
import test from "node:test";

import {
  createSourceStageProbeManifest,
  createFrozenReplayBrowserDecision,
  runSourceStageAvailabilityProbe,
  runSourceStageFactsProbe,
  runSourceStageNativeDiscoveryProbe,
  runSourceStagePackDiscoveryProbe,
  reportedSourceStageModelCalls,
  remainingSourceStageSampleModelCalls,
  sharedSourceStageModelGateway,
  sourceStageManifestFingerprint,
  summarizeSourceStageAttempts,
} from "./source-stage-probe.js";
import { browserReadActionTargetReplayFingerprint, type BrowserReadDecisionInput } from "../../../infrastructure/browser/browser-action-decision.js";
import type { ModelGateway } from "../../../core/model/contracts.js";
import { googlePlacesDiscoveryPack, tabelogDiscoveryPack } from "../../../integrations/restaurant-search/source-packs.js";
import { GooglePlacesClient } from "../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../integrations/google/google-places-restaurant-search.js";
import { center, date, reference, sourcePages } from "./native-fixed-source-pages.js";

const budget = {
  sampleMaxElapsedMs: 60_000,
  sampleMaxModelCalls: 2,
  matrixMaxModelCalls: 50,
  matrixMaxElapsedMs: 1_800_000,
  matrixRepairRoundsMax: 3,
  stageActualModelCallsMax: 150,
};
const input = {
  stage: "DISCOVERY" as const,
  mode: "LIVE_READ_ONLY" as const,
  samples: [
    { id: "tabelog-shibuya-omakase", sourcePackId: "tabelog", input: { queryFingerprint: "a" } },
    { id: "tablecheck-shibuya-omakase", sourcePackId: "tablecheck", input: { queryFingerprint: "b" } },
  ],
  budget,
  sourceDataset: { path: "cases/e2e-cases.yaml", sha256: "00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6", contamination: "PROMPT_AND_RESULT_EXPOSED" as const },
  network: { proxyMode: "DISABLED_BY_CLI" as const, preflightTargets: ["TABELOG", "TABLECHECK"] as const },
  runtime: { browserEngine: "LOCAL_CHROMIUM" as const },
};

test("source-stage manifest freezes the Phase3 budgets, full denominator and evaluator boundary", () => {
  const manifest = createSourceStageProbeManifest(input);
  assert.equal(manifest.status, "PLANNED");
  assert.equal(manifest.evaluator.applicability, "NOT_APPLICABLE");
  assert.equal(manifest.attemptAccounting.replayFallbackNetworkDisabled, true);
  assert.equal(sourceStageManifestFingerprint(manifest), sourceStageManifestFingerprint(manifest));
  assert.throws(() => createSourceStageProbeManifest({ ...input, samples: [...input.samples, input.samples[0]!] }));
  assert.equal(createSourceStageProbeManifest({ ...input, budget: { ...budget, sampleMaxModelCalls: 4 } }).budget.sampleMaxModelCalls, 4);
  assert.equal(createSourceStageProbeManifest({ ...input, budget: { ...budget, sampleMaxModelCalls: 0, matrixMaxModelCalls: 0 } }).budget.sampleMaxModelCalls, 0,
    "an identity-only source read can prohibit model dispatch without inventing a positive allowance");
  assert.throws(() => createSourceStageProbeManifest({ ...input, budget: { ...budget, sampleMaxModelCalls: -1 } }));
  assert.throws(() => createSourceStageProbeManifest({ ...input, budget: { ...budget, sampleMaxModelCalls: 5 } }));
  assert.throws(() => createSourceStageProbeManifest({ ...input, runtime: undefined! }));
});

test("source-stage Replay reports no real model request while retaining replay decision accounting", () => {
  assert.equal(reportedSourceStageModelCalls("REPLAY", 4), 0);
  assert.equal(reportedSourceStageModelCalls("DISCOVERY", 4), 4);
});

test("source-stage matrix cap limits the next sample before model dispatch", () => {
  const manifest = createSourceStageProbeManifest({ ...input, budget: { ...budget, sampleMaxModelCalls: 4, matrixMaxModelCalls: 8 } });
  assert.equal(remainingSourceStageSampleModelCalls(manifest, [{ modelCallsStarted: 4 }]), 4);
  assert.equal(remainingSourceStageSampleModelCalls(manifest, [{ modelCallsStarted: 4 }, { modelCallsStarted: 2 }]), 2);
  assert.equal(remainingSourceStageSampleModelCalls(manifest, [{ modelCallsStarted: 8 }]), 0);
});

test("source-stage attempt accounting retains failed samples and cannot convert a partial matrix into a pass", () => {
  const manifest = createSourceStageProbeManifest(input);
  const partial = summarizeSourceStageAttempts(manifest, [{ sampleId: "tabelog-shibuya-omakase", status: "FAILED", elapsedMs: 120, modelCallsStarted: 0, replay: "NO_COVERAGE" }]);
  assert.deepEqual(partial.missingSampleIds, ["tablecheck-shibuya-omakase"]);
  assert.equal(partial.completeDenominator, false);
  assert.equal(partial.statuses["tabelog-shibuya-omakase"], "FAILED");
  assert.equal(partial.guardAssessment, "NOT_ASSESSED");
  const overspent = summarizeSourceStageAttempts(manifest, [
    { sampleId: "tabelog-shibuya-omakase", status: "SUCCEEDED", elapsedMs: 61_000, modelCallsStarted: 3, replay: "NOT_APPLICABLE" },
    { sampleId: "tablecheck-shibuya-omakase", status: "SUCCEEDED", elapsedMs: 1, modelCallsStarted: 0, replay: "NOT_APPLICABLE" },
  ], { matrixElapsedMs: 1_800_001 });
  assert.equal(overspent.budgetCompliant, false);
  assert.deepEqual(overspent.budgetViolations.sampleElapsedMs, [{ sampleId: "tabelog-shibuya-omakase", actual: 61_000, limit: 60_000 }]);
  assert.deepEqual(overspent.budgetViolations.sampleModelCalls, [{ sampleId: "tabelog-shibuya-omakase", actual: 3, limit: 2 }]);
  assert.deepEqual(overspent.budgetViolations.matrixElapsedMs, { actual: 1_800_001, limit: 1_800_000 });
  assert.throws(() => summarizeSourceStageAttempts(manifest, [{ sampleId: "tabelog-shibuya-omakase", status: "SUCCEEDED", elapsedMs: -1, modelCallsStarted: 0, replay: "NOT_APPLICABLE" }]));
});

test("direct source stages retain production-port reads without inventing a Hybrid evaluator verdict", async () => {
  const manifest = createSourceStageProbeManifest({ ...input, stage: "AVAILABILITY", samples: [input.samples[0]!] });
  assert.equal(manifest.evaluator.applicability, "NOT_APPLICABLE");
  const lifecycle: string[] = [];
  const browserBudget = { totalModelCalls: 3, maxModelCalls: 4 };
  const availability = {
    executionRoute: "GENERIC_BROWSER" as const,
    beginReadRun() { lifecycle.push("begin"); },
    endReadRun() { lifecycle.push("end"); },
    async check() { return { offers: [], availabilityChecks: {}, evidence: [], metadata: { provider: "TABELOG" as const, route: "GENERIC_BROWSER" as const, latencyMs: 1 } }; },
  };
  const availabilityResult = await runSourceStageAvailabilityProbe({
    availability,
    request: { candidateIds: [], candidates: [], date, partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
    signal: new AbortController().signal,
    browserBudget,
  });
  assert.deepEqual(lifecycle, ["begin", "end"]);
  assert.equal(availabilityResult.modelCallsStarted, 3);
  assert.equal(availabilityResult.read.metadata.provider, "TABELOG");

  const failedBudget = { totalModelCalls: 3, maxModelCalls: 4 };
  const failedAvailability = {
    executionRoute: "GENERIC_BROWSER" as const,
    beginReadRun() {},
    endReadRun() { failedBudget.totalModelCalls = 0; },
    async check() { throw new Error("controlled provider failure"); },
  };
  await assert.rejects(
    () => runSourceStageAvailabilityProbe({
      availability: failedAvailability,
      request: { candidateIds: [], candidates: [], date, partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
      signal: new AbortController().signal,
      browserBudget: failedBudget,
    }),
    (error: unknown) => typeof error === "object" && error !== null && (error as { sourceStageModelCalls?: unknown }).sourceStageModelCalls === 3,
  );
  assert.equal(failedBudget.totalModelCalls, 0, "the provider may retire the counter only after the failing read was measured");

  const facts = {
    executionRoute: "GENERIC_BROWSER" as const,
    async inspectFacts() { return { evidence: [], factChecks: {}, sourceDocuments: [], metadata: { provider: "RESTAURANT_WEBSITE" as const, route: "GENERIC_BROWSER" as const, latencyMs: 1 } }; },
  };
  const factsResult = await runSourceStageFactsProbe({
    facts,
    request: { candidateIds: [], candidates: [], intent: {
      timezone: "Asia/Tokyo", target: { goal: "AVAILABILITY", query: "omakase" }, area: { query: "Shibuya" }, criteria: [],
    } },
    signal: new AbortController().signal,
    browserBudget,
  });
  assert.equal(factsResult.modelCallsStarted, 3);
  assert.equal(factsResult.read.metadata.provider, "RESTAURANT_WEBSITE");
});

test("source-stage facts and browser decisions share one bounded model counter", async () => {
  const calls: string[] = [];
  const upstream: ModelGateway = {
    async complete(request) {
      calls.push(request.purpose);
      return { invocationId: `fixture-${calls.length}`, provider: "FIXTURE", model: "fixture", outputText: "{}", finishReason: "TOOL_CALLS", latencyMs: 0 };
    },
  };
  const browserBudget = { totalModelCalls: 1, maxModelCalls: 2 };
  const model = sharedSourceStageModelGateway(upstream, browserBudget);
  await model.complete({ taskId: "fact", purpose: "restaurant_fact_judgment", promptVersion: "1", messages: [], responseFormat: "JSON_SCHEMA", outputSchema: { name: "fact", version: "1" }, timeoutMs: 1, fallback: "FAIL_CLOSED" });
  assert.equal(browserBudget.totalModelCalls, 2);
  await assert.rejects(() => model.complete({ taskId: "fact-2", purpose: "restaurant_fact_judgment", promptVersion: "1", messages: [], responseFormat: "JSON_SCHEMA", outputSchema: { name: "fact", version: "1" }, timeoutMs: 1, fallback: "FAIL_CLOSED" }), { code: "MODEL_CALL_BUDGET_EXHAUSTED" });
  // BrowserTaskExecutor increments this same counter before its decision, so
  // the gateway must not charge the action twice.
  const browserBudget2 = { totalModelCalls: 1, maxModelCalls: 2 };
  const browserModel = sharedSourceStageModelGateway(upstream, browserBudget2);
  await browserModel.complete({ taskId: "browser", purpose: "browser_read_decide", promptVersion: "1", messages: [], responseFormat: "JSON_SCHEMA", outputSchema: { name: "browser", version: "1" }, timeoutMs: 1, fallback: "FAIL_CLOSED" });
  assert.equal(browserBudget2.totalModelCalls, 1);
  assert.deepEqual(calls, ["restaurant_fact_judgment", "browser_read_decide"]);
});

test("frozen Replay wires use the production decoder and require a fresh opaque target rebind", async () => {
  const input: BrowserReadDecisionInput = {
    taskId: "replay-fixture", source: "TABELOG", stage: "AVAILABILITY", objective: "fixture", progress: "fixture",
    skills: { generic: "", source: "" }, goal: { outlet: { name: "Fixture" }, hardCriteria: [] },
    observation: {
      revision: 1, url: "https://example.test/fixture", title: "Fixture", visibleText: "",
      targets: [{ ref: "observation:1:target:1", kind: "BUTTON", role: "button", label: "Apply", availableActions: ["CLICK"] }],
    },
  };
  const replay = createFrozenReplayBrowserDecision([{
    action: "CLICK", targetRef: "observation:1:target:1", authoritativeField: "NONE", requestedState: "NONE", reason: "REDACTED", extras: [],
    targetFingerprint: browserReadActionTargetReplayFingerprint(input.observation.targets[0]!),
  }]);
  assert.deepEqual(await replay.decide(input), { type: "CLICK", targetRef: "observation:1:target:1", reason: "REPLAYED_FROZEN_WIRE" });
  assert.equal(replay.replayedDecisionCount(), 1);
  assert.deepEqual(replay.takeLastWireRecord?.(), {
    action: "CLICK", targetRef: "observation:1:target:1", authoritativeField: "NONE", requestedState: "NONE", reason: "REDACTED", extras: [],
  });

  const stale = createFrozenReplayBrowserDecision([{
    action: "CLICK", targetRef: "observation:1:target:old", authoritativeField: "NONE", requestedState: "NONE", reason: "REDACTED", extras: [],
    targetFingerprint: browserReadActionTargetReplayFingerprint(input.observation.targets[0]!),
  }]);
  assert.deepEqual(await stale.decide(input), { type: "CLICK", targetRef: "observation:1:target:1", reason: "REPLAYED_FROZEN_WIRE" }, "fresh semantic target can rebind after opaque refs change");

  const reordered = createFrozenReplayBrowserDecision([{
    action: "CLICK", targetRef: "observation:1:target:1", authoritativeField: "NONE", requestedState: "NONE", reason: "REDACTED", extras: [],
    targetFingerprint: browserReadActionTargetReplayFingerprint({ ...input.observation.targets[0]!, label: "Original apply" }),
  }]);
  await assert.rejects(() => reordered.decide(input), { code: "REPLAY_TARGET_NOT_REBOUND" });

  const deterministic = createFrozenReplayBrowserDecision([]);
  await assert.rejects(() => deterministic.decide(input), { code: "REPLAY_ACTION_NO_COVERAGE" }, "an empty frozen schedule is valid until the restored production path requests a model decision");
  assert.equal(deterministic.replayedDecisionCount(), 0);
});


test("live source-stage discovery delegates to the production NativeRestaurantSearch flow instead of a direct Pack snapshot", async () => {
  const navigations: string[] = [];
  const runtime = sourcePages("TABELOG_DELIVERS", navigations);
  const locality = new GooglePlacesRestaurantSearch(new GooglePlacesClient({
    apiKey: "fixture-only",
    fetchImplementation: async () => { throw new Error("coordinates avoid named-place resolution"); },
  }), () => reference.toISOString(), 10, { maxRequests: 2 });
  const result = await runSourceStageNativeDiscoveryProbe({
    pack: tabelogDiscoveryPack,
    runtime,
    locality,
    readRunId: "source-stage-native-control",
    timeoutMs: 10_000,
    signal: new AbortController().signal,
    now: () => reference.toISOString(),
    intent: {
      timezone: "Asia/Tokyo",
      target: { goal: "AVAILABILITY", query: "omakase" },
      date,
      timeWindow: { earliest: "19:00", latest: "19:00" },
      partySize: 2,
      area: { query: "Shibuya", radiusMeters: 1_000, coordinates: { ...center, observedAt: reference.toISOString(), source: "EVALUATION" } },
      criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }],
    },
  });
  assert.equal(result.status, "LIST_OBSERVED", JSON.stringify({ failureCode: result.failureCode, metadata: result.read.metadata, navigations }));
  assert.equal(result.discoveryCoverage, "REGION_FILTERED_LIST_ONLY");
  assert.ok((result.read.metadata.nativeDiscoveryFunnel?.parsedOutlets ?? 0) > 0);
  assert.ok(navigations.length >= 2, "production NativeRestaurantSearch must read listing and grounded detail rather than only snapshot a Pack URL");
  assert.match(navigations[0]!, /tabelog\.com/);
});

test("source-stage discovery keeps a parsed list without any frozen-radius candidate as NO_COVERAGE", async () => {
  const locality = new GooglePlacesRestaurantSearch(new GooglePlacesClient({
    apiKey: "fixture-only", fetchImplementation: async () => { throw new Error("coordinates avoid named-place resolution"); },
  }), () => reference.toISOString(), 10, { maxRequests: 2 });
  const result = await runSourceStageNativeDiscoveryProbe({
    pack: tabelogDiscoveryPack,
    runtime: sourcePages("OUTSIDE_RADIUS", []),
    locality,
    readRunId: "source-stage-outside-radius",
    timeoutMs: 10_000,
    signal: new AbortController().signal,
    now: () => reference.toISOString(),
    intent: {
      timezone: "Asia/Tokyo", target: { goal: "AVAILABILITY", query: "omakase" }, date,
      timeWindow: { earliest: "19:00", latest: "19:00" }, partySize: 2,
      area: { query: "Shibuya", radiusMeters: 1_000, coordinates: { ...center, observedAt: reference.toISOString(), source: "EVALUATION" } },
      criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }],
    },
  });
  assert.equal(result.status, "NO_COVERAGE");
  assert.equal(result.discoveryCoverage, "NO_COVERAGE");
  assert.ok((result.read.metadata.nativeDiscoveryFunnel?.parsedOutlets ?? 0) > 0);
  assert.equal(result.read.candidates.length, 0);
});

test("browserless Google Pack runs through its production search port with the frozen pack query", async () => {
  const requests: Array<{ discoveryQuery?: unknown; readRunId?: string }> = [];
  const result = await runSourceStagePackDiscoveryProbe({
    pack: googlePlacesDiscoveryPack,
    search: {
      executionRoute: "STRUCTURED_ADAPTER",
      async search(request) {
        requests.push({
          ...(request.discoveryQuery ? { discoveryQuery: request.discoveryQuery } : {}),
          ...(request.readRunId ? { readRunId: request.readRunId } : {}),
        });
        return { candidates: [], evidence: [], continuation: { intentFingerprint: "fixture", usedPageTokens: [], pagesRead: 1, exhausted: true }, metadata: { provider: "GOOGLE_PLACES", route: "STRUCTURED_ADAPTER", latencyMs: 1 } };
      },
    },
    intent: { timezone: "Asia/Tokyo", target: { goal: "AVAILABILITY", query: "dining" }, date, timeWindow: { earliest: "19:00", latest: "19:00" }, partySize: 2, area: { query: "nearby" }, criteria: [] },
    location: { latitude: center.latitude, longitude: center.longitude, radiusMeters: 3_000, label: "evaluation location", areaMatchBasis: "EVALUATION_LOCATION_RADIUS" },
    readRunId: "google-pack-control", signal: new AbortController().signal, modelCallsStarted: 0,
  });
  assert.equal(result.status, "NO_COVERAGE");
  assert.equal(result.packId, "google-places");
  assert.deepEqual(requests, [{ discoveryQuery: { category: "restaurant", location: { latitude: center.latitude, longitude: center.longitude, radiusMeters: 3_000, label: "evaluation location", areaMatchBasis: "EVALUATION_LOCATION_RADIUS" } }, readRunId: "google-pack-control" }]);
});
