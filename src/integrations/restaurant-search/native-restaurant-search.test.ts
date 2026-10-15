import assert from "node:assert/strict";
import test from "node:test";

import { GooglePlacesClient } from "../google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../google/google-places-restaurant-search.js";
import { NativeRestaurantSearch } from "./native-restaurant-search.js";
import { googlePlacesDiscoveryPack } from "./source-packs.js";

test("native source-plan resolution is reused by the subsequent Google pack request", async () => {
  const queries: string[] = [];
  const client = new GooglePlacesClient({ apiKey: "fixture-only", fetchImplementation: async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as { textQuery: string };
    queries.push(body.textQuery);
    if (body.textQuery === "Shibuya") {
      return new Response(JSON.stringify({ places: [{ id: "shibuya", displayName: { text: "Shibuya" }, formattedAddress: "Tokyo", location: { latitude: 35.658, longitude: 139.7016 }, types: ["train_station"] }] }), { status: 200 });
    }
    return new Response(JSON.stringify({ places: [] }), { status: 200 });
  } });
  const google = new GooglePlacesRestaurantSearch(client, () => "2026-10-07T16:00:00.000Z", 10, { maxRequests: 10 });
  const native = new NativeRestaurantSearch({ openSession: async () => { throw new Error("Google-only pack must not open browser"); } }, google, () => "2026-10-07T16:00:00.000Z", undefined, undefined, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 }, undefined, [googlePlacesDiscoveryPack]);
  await native.search({
    readRunId: "source-plan-google",
    intent: {
      timezone: "Asia/Tokyo", target: { goal: "AVAILABILITY", query: "omakase spot" }, area: { query: "near Shibuya", radiusMeters: 1_000 },
      date: "2026-10-08", partySize: 2, criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }],
    },
  }, new AbortController().signal);
  assert.deepEqual(queries, ["Shibuya", "omakase Shibuya"], "the provider page request reuses the plan location instead of resolving it again");
});


test("coordinate-only address observations reach the discovery goal once and failures keep the exact center", async () => {
  for (const fails of [false, true]) {
    const urls: string[] = [];
    const client = new GooglePlacesClient({ apiKey: "fixture", fetchImplementation: async (url) => {
      urls.push(String(url));
      if (String(url).includes("geocode")) return new Response(JSON.stringify(fails ? {} : { results: [{ addressComponents: [{ longText: "Observed district", types: ["sublocality"] }] }] }), { status: fails ? 403 : 200 });
      return new Response(JSON.stringify({ places: [] }), { status: 200 });
    } });
    const google = new GooglePlacesRestaurantSearch(client, () => "2026-10-11T00:00:00Z", 10, { maxRequests: 2 });
    const native = new NativeRestaurantSearch({ openSession: async () => { throw new Error("No browser for Google-only control"); } }, google, undefined, undefined, undefined, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 }, undefined, [googlePlacesDiscoveryPack]);
    const intent = { timezone: "Asia/Tokyo" as const, target: { goal: "RECOMMENDATION" as const, query: "restaurants nearby" }, area: { query: "nearby", coordinates: { latitude: 1, longitude: 2, source: "DEVICE" as const, observedAt: "2026-10-11T00:00:00Z" } }, criteria: [] };
    const result = await native.search({ intent, readRunId: `address-${fails}` }, new AbortController().signal);
    const location = result.continuation?.locationContext!;
    assert.equal(location.latitude, 1); assert.equal(location.longitude, 2);
    assert.equal(location.areaMatchBasis, "TASK_LOCATION_RADIUS");
    assert.equal(location.label, "nearby");
    assert.equal(urls.filter(url => url.includes("geocode")).length, 1);
    assert.deepEqual(location.addressComponents, fails ? undefined : [{ longText: "Observed district", types: ["sublocality"] }]);
    assert.equal((location as unknown as { addressObservation: { status: string } }).addressObservation.status, fails ? "UNAVAILABLE" : "OBSERVED");
    assert.equal(google.googleRequestUsage(`address-${fails}`).total, 2);
    await assert.rejects(native.search({ intent, readRunId: `address-${fails}`, continuation: result.continuation! }, new AbortController().signal), { code: "DISCOVERY_PLAN_EXHAUSTED" });
    assert.equal(urls.filter(url => url.includes("geocode")).length, 1);
  }
});
