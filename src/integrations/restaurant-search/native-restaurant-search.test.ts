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
  const native = new NativeRestaurantSearch({ openSession: async () => { throw new Error("Google-only pack must not open browser"); } }, google, () => "2026-10-07T16:00:00.000Z", undefined, undefined, undefined, undefined, undefined, undefined, [googlePlacesDiscoveryPack]);
  await native.search({
    readRunId: "source-plan-google",
    intent: {
      timezone: "Asia/Tokyo", target: { goal: "AVAILABILITY", query: "omakase spot" }, area: { query: "near Shibuya", radiusMeters: 1_000 },
      date: "2026-10-08", partySize: 2, criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }],
    },
  }, new AbortController().signal);
  assert.deepEqual(queries, ["Shibuya", "omakase Shibuya"], "the provider page request reuses the plan location instead of resolving it again");
});
