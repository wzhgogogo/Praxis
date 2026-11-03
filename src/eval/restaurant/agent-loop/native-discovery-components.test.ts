// Component controls construct discovery cores directly; they do not prove production assembly wiring.
import assert from "node:assert/strict";
import test from "node:test";
import { RestaurantExecutionRouter } from "../../../application/restaurant-execution-router.js";
import { restaurantSearchIntentFingerprint, type RestaurantTaskState } from "../../../domains/restaurant/contracts.js";
import { GooglePlacesClient } from "../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../integrations/google/google-places-restaurant-search.js";
import { NativeRestaurantSearch } from "../../../integrations/restaurant-search/native-restaurant-search.js";
import { tabelogDiscoveryPack } from "../../../integrations/restaurant-search/source-packs.js";
import { center, date, reference, sourcePages } from "./native-fixed-source-pages.js";

const fixtureRetrieval={decide:async()=>({accepted:true,keyword:"omakase",criterionRef:"criterion:0",reason:"Scripted retrieval control."})};

test("native source session acquisition consumes the remaining source window and retains an unstarted detail entrance", async t => {
  let elapsed=0;t.mock.method(Date,'now',()=>elapsed);
  const navigations: string[] = [];
  const delayed = sourcePages("TABELOG_DELIVERS", navigations);
  const browser = { openSession: async (input: { signal: AbortSignal }) => {
    elapsed+=20;
    return delayed.openSession(input);
  } };
  const locality = new GooglePlacesRestaurantSearch(new GooglePlacesClient({ apiKey: "fixture-only", fetchImplementation: async () => {
    throw new Error("coordinates avoid Google resolution");
  } }), () => reference.toISOString(), 10, { maxRequests: 100 });
  const native = new NativeRestaurantSearch(browser, locality, fixtureRetrieval, () => reference.toISOString(), undefined, undefined, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  const intent = {
    timezone: "Asia/Tokyo" as const, target: { goal: "AVAILABILITY" as const, query: "omakase" }, date,
    timeWindow: { earliest: "19:00", latest: "19:00" }, area: { query: "Shibuya", coordinates: { ...center, observedAt: reference.toISOString(), source: "MANUAL_PLACE" as const } },
    criteria: [{ text: "omakase", polarity: "POSITIVE" as const, strength: "HARD" as const }],
  };
  const result = await native.search({ intent, continuation: {
    intentFingerprint: restaurantSearchIntentFingerprint(intent), usedPageTokens: [], pagesRead: 0, exhausted: false,
    sourceProgress: { sourceId: "tabelog", inspectedSourceIds: [], detailAttempts: 0, pagesRead: 0, elapsedMs: 89_999,
      pendingSourceIds: ["tokyo/A1304/A130401/100"], pendingSourceEntries: [{ sourceEntityId: "tokyo/A1304/A130401/100", sourceUrl: "https://tabelog.com/tokyo/A1304/A130401/100/", observedAt: reference.toISOString() }] },
  } }, new AbortController().signal);
  assert.equal(navigations.length, 0, "a session that misses the remaining source window cannot begin detail navigation");
  assert.equal(result.metadata.nativeDiscoveryFunnel?.sourceTimeLimitReached, true);
  assert.deepEqual(result.continuation?.sourceProgress?.pendingSourceIds, ["tokyo/A1304/A130401/100"]);
});

test("the production Router advances the default three-pack cursor and reaches Google Nearby Search after bounded source batches", async () => {
  const navigations: string[] = [];
  const browser = sourcePages("BOTH_BOUNDED_EMPTY", navigations);
  const nearbyRequests: unknown[] = [];
  const google = new GooglePlacesRestaurantSearch(new GooglePlacesClient({
    apiKey: "fixture-only",
    fetchImplementation: async (url, init) => {
      assert.equal(String(url), "https://places.googleapis.com/v1/places:searchNearby");
      const body = JSON.parse(String(init?.body));
      nearbyRequests.push(body);
      return new Response(JSON.stringify({ places: [{
        id: "nearby-directory-result", displayName: { text: "Nearby restaurant" },
        formattedAddress: "Shibuya, Tokyo", location: center, types: ["restaurant"],
        addressComponents: [{ longText: "Shibuya", types: ["locality"] }],
      }] }), { status: 200, headers: { "content-type": "application/json" } });
    },
  }), () => reference.toISOString(), 10, { maxRequests: 100 });
  const native = new NativeRestaurantSearch(browser, google, fixtureRetrieval, () => reference.toISOString(), undefined, undefined, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  const router = new RestaurantExecutionRouter(native, {
    executionRoute: "STRUCTURED_ADAPTER",
    async check() { return { offers: [], availabilityChecks: {}, evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; },
  }, { structuredReadTimeoutMs: 8_000, browserReadTimeoutMs: 20_000 });
  const intentDraft: NonNullable<RestaurantTaskState["intentDraft"]> = {
    schemaVersion: "3" as const, timezone: "Asia/Tokyo", target: { goal: "AVAILABILITY" as const, query: "nearby dinner" },
    date, timeWindow: { earliest: "19:00", latest: "19:00" }, partySize: 2,
    area: { query: "Shibuya", coordinates: { ...center, observedAt: reference.toISOString(), source: "MANUAL_PLACE" as const } }, criteria: [],
  };
  let state: RestaurantTaskState = { schemaVersion: "25", phase: "UNDERSTANDING", intentDraft, candidates: [], availability: {}, availabilityChecks: {}, readEvidence: [], searchRevision: 0 };
  const first = await router.execute({ type: "SEARCH_RESTAURANTS" }, state, reference.toISOString(), "phase2-router-pack");
  assert.equal(first.event?.type, "SEARCH_COMPLETED");
  if (first.event?.type !== "SEARCH_COMPLETED") throw new Error("expected first discovery result");
  assert.equal(first.event.continuation?.discoveryPlan?.entries[first.event.continuation.discoveryPlan.cursor]?.sourceId, "tablecheck");
  state = { ...state, phase: "SEARCHING" as const, searchContinuation: first.event.continuation! };
  const second = await router.execute({ type: "SEARCH_RESTAURANTS" }, state, reference.toISOString(), "phase2-router-pack");
  assert.equal(second.event?.type, "SEARCH_COMPLETED");
  if (second.event?.type !== "SEARCH_COMPLETED") throw new Error("expected second discovery result");
  assert.equal(second.event.continuation?.discoveryPlan?.entries[second.event.continuation.discoveryPlan.cursor]?.sourceId, "google-places");
  state = { ...state, searchContinuation: second.event.continuation! };
  const third = await router.execute({ type: "SEARCH_RESTAURANTS" }, state, reference.toISOString(), "phase2-router-pack");
  assert.equal(third.event?.type, "SEARCH_COMPLETED");
  if (third.event?.type !== "SEARCH_COMPLETED") throw new Error("expected Google discovery result");
  assert.equal(third.event.candidates.length, 1, "Nearby pack should return its grounded candidate");
  assert.deepEqual(nearbyRequests, [{ includedTypes: ["restaurant"], maxResultCount: 20, locationRestriction: { circle: { center, radius: 1_000 } } }]);
  assert.equal(third.event.continuation?.exhausted, true);
  assert.equal(navigations.some((url) => url.includes("tablecheck.com")), true);
});

// Verifies the actual Native → Executor → browser decision boundary; no source page reconstruction.
test("coordinate-only discovery passes source-attributed address observations, including failure, to browser input", async () => {
  for (const failure of [false, true]) {
    const modelInputs: unknown[] = [];
    const locality = new GooglePlacesRestaurantSearch(new GooglePlacesClient({ apiKey: "fixture", fetchImplementation: async () => new Response(JSON.stringify({ results: [{ addressComponents: [{ longText: "Observed district", types: ["sublocality"] }] }] }), { status: failure ? 403 : 200 }) }), () => reference.toISOString(), 10, { maxRequests: 1 });
    let url = "https://tabelog.com/en/";
    const session = { metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM" as const, engine: "CHROMIUM" as const, startedAt: reference.toISOString() },
      navigate: async (next: string) => { url = next; }, snapshot: async () => ({ url, title: "Public directory", text: "Choose an observed region", html: "<main>Choose an observed region</main>" }),
      click: async () => {}, fill: async () => {}, select: async () => [], waitFor: async () => {}, screenshot: async () => new Uint8Array(), close: async () => {},
    };
    const search = new NativeRestaurantSearch({ openSession: async () => session }, locality, fixtureRetrieval, () => reference.toISOString(), undefined, { decide: async input => { modelInputs.push(input.goal.location); return { type: "REQUEST_HUMAN_HELP", reason: "Fixture input observed; stop without navigation" }; } }, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 }, undefined, [tabelogDiscoveryPack]);
    await search.search({ intent: { timezone: "Asia/Tokyo", area: { query: "nearby", coordinates: { latitude: 1, longitude: 2, observedAt: reference.toISOString(), source: "DEVICE" } }, criteria: [], target: { goal: "RECOMMENDATION", query: "restaurants nearby" } }, readRunId: `coordinate-input-${failure}` }, new AbortController().signal);
    assert.equal(modelInputs.length, 1);
    assert.deepEqual(modelInputs[0], { latitude: 1, longitude: 2, radiusMeters: 1000,
      ...(!failure ? { addressComponents: [{ longText: "Observed district", types: ["sublocality"] }] } : {}),
      addressObservation: { source: "GOOGLE_GEOCODING", observedAt: reference.toISOString(), status: failure ? "UNAVAILABLE" : "OBSERVED", ...(failure ? { reasonCode: "GOOGLE_SERVICE_QUOTA_OR_PERMISSION" } : {}) } });
    assert.equal(locality.googleRequestUsage(`coordinate-input-${failure}`).total, 1);
  }
});
