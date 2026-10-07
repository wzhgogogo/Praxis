import assert from "node:assert/strict";
import test from "node:test";

import { createSourceStageProbeManifest, runSourceStageNativeDiscoveryProbe, sourceStageManifestFingerprint, summarizeSourceStageAttempts } from "./source-stage-probe.js";
import { tabelogDiscoveryPack } from "../../../integrations/restaurant-search/source-packs.js";
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
  assert.throws(() => createSourceStageProbeManifest({ ...input, budget: { ...budget, sampleMaxModelCalls: 3 } }));
  assert.throws(() => createSourceStageProbeManifest({ ...input, runtime: undefined! }));
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
