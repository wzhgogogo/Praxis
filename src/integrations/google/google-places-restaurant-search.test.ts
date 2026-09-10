import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureIntent } from "../../harness/restaurant-fixtures.js";
import { GooglePlacesClient } from "./google-places-client.js";
import { buildGooglePlacesTextQuery, GooglePlacesRestaurantSearch } from "./google-places-restaurant-search.js";
import { GOOGLE_PLACES_RESTAURANT_FIELD_MASK } from "./google-places-contracts.js";

test("Google query preserves the authoritative intent and only adds a retrieval hint", () => {
  const query = buildGooglePlacesTextQuery({ intent: fixtureIntent, retrievalHint: "Japanese wording" });
  assert.match(query, /Shinjuku/);
  assert.match(query, /yakiniku/);
  assert.match(query, /Japanese wording/);
});

test("Google Places text search uses the explicit small field mask and stable candidate IDs", async () => {
  let captured: RequestInit | undefined;
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async (_url, init) => {
      captured = init;
      return new Response(JSON.stringify({ places: [{
        id: "place-1", displayName: { text: "Restaurant One" }, formattedAddress: "Tokyo",
        location: { latitude: 35.6, longitude: 139.7 }, types: ["restaurant"],
      }] }), { status: 200 });
    },
  });
  const search = new GooglePlacesRestaurantSearch(client, () => "2026-08-05T09:00:00.000Z");
  const result = await search.search({ intent: fixtureIntent }, new AbortController().signal);
  assert.equal((captured?.headers as Record<string, string>)["X-Goog-FieldMask"], GOOGLE_PLACES_RESTAURANT_FIELD_MASK);
  assert.equal(result.candidates[0]?.restaurant.id.startsWith("praxis:restaurant:"), true);
  assert.equal(result.evidence.length, 3);
  assert.deepEqual(result.evidence.map((item) => item.kind), ["DISCOVERY", "ENTITY_MATCH", "RESTAURANT_FACT"]);
  const repeated = await search.search({ intent: fixtureIntent }, new AbortController().signal);
  assert.equal(repeated.candidates[0]?.restaurant.id, result.candidates[0]?.restaurant.id);
});

test("Google Places sends only explicit evaluation coordinates as NEAR_USER location bias", async () => {
  let body: Record<string, unknown> | undefined;
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async (_url, init) => {
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({ places: [] }), { status: 200 });
    },
  });
  const search = new GooglePlacesRestaurantSearch(client, undefined, 10, {
    evaluationLocation: { latitude: 35.6762, longitude: 139.6503 },
  });
  await search.search({ intent: { ...fixtureIntent, area: { query: "nearby" } } }, new AbortController().signal);
  assert.deepEqual(body?.locationBias, {
    circle: { center: { latitude: 35.6762, longitude: 139.6503 }, radius: 3_000 },
  });
  assert.doesNotMatch(String(body?.textQuery), /near nearby/i);
});

test("Google Places search budget is mechanical and bounded per adapter instance", async () => {
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async () => new Response(JSON.stringify({ places: [] }), { status: 200 }),
  });
  const search = new GooglePlacesRestaurantSearch(client, undefined, 10, { maxSearches: 1 });
  await search.search({ intent: fixtureIntent }, new AbortController().signal);
  await assert.rejects(search.search({ intent: fixtureIntent }, new AbortController().signal), { code: "GOOGLE_SEARCH_BUDGET_EXCEEDED" });
});

test("Google Places classifies provider failure without exposing a response body", async () => {
  const failed = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async () => { throw new Error("upstream diagnostic payload"); },
  });
  await assert.rejects(
    failed.textSearch({ textQuery: "restaurant", pageSize: 1 }, new AbortController().signal),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "GOOGLE_SEARCH_FAILED" && !error.message.includes("upstream diagnostic payload"),
  );

});
