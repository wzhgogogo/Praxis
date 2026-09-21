import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureIntent } from "../../harness/restaurant-fixtures.js";
import { GooglePlacesClient } from "./google-places-client.js";
import { buildGooglePlacesTextQuery, GooglePlacesRestaurantSearch } from "./google-places-restaurant-search.js";
import { GOOGLE_PLACES_RESTAURANT_FIELD_MASK } from "./google-places-contracts.js";

test("Google query is discovery-owned and does not serialize criteria into retrieval text", () => {
  const query = buildGooglePlacesTextQuery({ intent: fixtureIntent, retrievalHint: "Japanese wording" });
  assert.match(query, /Shinjuku/);
  assert.match(query, /Japanese wording/);
  assert.doesNotMatch(query, /yakiniku/);
});

test("initial discovery reads at most two 20-result pages, dedupes stable outlets, and retains the next cursor", async () => {
  const requests: Array<Record<string, unknown>> = [];
  const place = (id: string) => ({ id, displayName: { text: `Restaurant ${id}` }, formattedAddress: "Tokyo", location: { latitude: 35.6, longitude: 139.7 }, types: ["restaurant"] });
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      requests.push(body);
      return new Response(JSON.stringify(body.pageToken === "page-2"
        ? { places: [place("b"), place("c")], nextPageToken: "page-3" }
        : body.pageToken === "page-3"
          ? { places: [place("d")] }
          : { places: [place("a"), place("b")], nextPageToken: "page-2" }), { status: 200 });
    },
  });
  const result = await new GooglePlacesRestaurantSearch(client).search({ intent: fixtureIntent, readRunId: "two-pages" }, new AbortController().signal);
  assert.deepEqual(requests.map((request) => request.pageSize), [20, 20]);
  assert.deepEqual(requests.map((request) => request.pageToken), [undefined, "page-2"]);
  assert.equal(result.candidates.length, 3, "the second page duplicate is merged by stable outlet ID");
  assert.deepEqual(result.continuation, {
    intentFingerprint: JSON.stringify(fixtureIntent),
    nextPageToken: "page-3",
    usedPageTokens: ["page-2"],
    pagesRead: 2,
    exhausted: false,
    sourceRequestContext: { textQuery: buildGooglePlacesTextQuery({ intent: fixtureIntent }) },
  });
  const continued = await new GooglePlacesRestaurantSearch(client).search({
    intent: fixtureIntent,
    retrievalHint: "different wording must not alter this cursor",
    readRunId: "two-pages",
    continuation: result.continuation,
  }, new AbortController().signal);
  assert.deepEqual(requests.map((request) => request.textQuery), Array(3).fill(buildGooglePlacesTextQuery({ intent: fixtureIntent })), "a page token must retain the first request query even when the Agent supplies a later retrieval hint");
  assert.deepEqual(continued.candidates.map((candidate) => candidate.restaurant.sourceIds.googlePlaces), ["d"]);
  assert.ok(continued.continuation);
  assert.equal(continued.continuation.exhausted, true);
});

test("a second-page provider failure preserves accepted first-page candidates and records a bounded retry cursor", async () => {
  let calls = 0;
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async (_url, init) => {
      calls += 1;
      if (JSON.parse(String(init?.body)).pageToken === "page-2") return new Response("unavailable", { status: 503 });
      return new Response(JSON.stringify({ places: [{ id: "first", displayName: { text: "First" }, formattedAddress: "Tokyo", location: { latitude: 35.6, longitude: 139.7 }, types: ["restaurant"] }], nextPageToken: "page-2" }), { status: 200 });
    },
  });
  const result = await new GooglePlacesRestaurantSearch(client, undefined, 20, { maxRequests: 2 }).search({ intent: fixtureIntent, readRunId: "partial-page" }, new AbortController().signal);
  assert.equal(calls, 2);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.metadata.failureCode, "GOOGLE_SERVICE_REJECTED");
  assert.deepEqual(result.continuation, {
    intentFingerprint: JSON.stringify(fixtureIntent),
    nextPageToken: "page-2",
    usedPageTokens: [],
    pagesRead: 1,
    exhausted: false,
    lastFailureCode: "GOOGLE_SERVICE_REJECTED",
    sourceRequestContext: { textQuery: buildGooglePlacesTextQuery({ intent: fixtureIntent }) },
  });
});

test("a named nearby place is resolved to observed coordinates and grounds candidate distance", async () => {
  let call = 0;
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async (_url, init) => {
      call += 1;
      const payload = JSON.parse(String(init?.body)) as { textQuery: string };
      if (call === 1) {
        assert.equal(payload.textQuery, "Higashi-Ginza Station");
        return new Response(JSON.stringify({ places: [{
          id: "station-1", displayName: { text: "Higashi-ginza Station" }, formattedAddress: "Tokyo",
          location: { latitude: 35.6697, longitude: 139.767 }, types: ["subway_station"],
        }] }), { status: 200 });
      }
      return new Response(JSON.stringify({ places: [{
        id: "cafe-near", displayName: { text: "Nearby Cafe" }, formattedAddress: "Tokyo",
        location: { latitude: 35.6701, longitude: 139.7672 }, types: ["cafe"],
      }, {
        id: "cafe-far", displayName: { text: "Far Cafe" }, formattedAddress: "Tokyo",
        location: { latitude: 35.69, longitude: 139.79 }, types: ["cafe"],
      }, {
        id: "cafe-missing-coordinate", displayName: { text: "Coordinate-less Cafe" }, formattedAddress: "Tokyo", types: ["cafe"],
      }] }), { status: 200 });
    },
  });
  const result = await new GooglePlacesRestaurantSearch(client, () => "2026-09-11T00:00:00.000Z", 10, { maxRequests: 2 }).search({
    intent: { ...fixtureIntent, area: { query: "near Higashi-Ginza Station" } },
    readRunId: "named-place",
  }, new AbortController().signal);
  assert.equal(call, 2);
  assert.deepEqual(result.candidates.map((candidate) => candidate.restaurant.outletName), ["Nearby Cafe"]);
  const near = result.evidence.find((item) => item.candidateId === result.candidates[0]?.restaurant.id && item.kind === "DISCOVERY");
  assert.equal(near?.claims.areaMatchBasis, "NAMED_PLACE_RADIUS");
  assert.equal(near?.claims.distanceMeters, 48);
  assert.equal(result.evidence.some((item) => item.kind === "DISCOVERY" && item.claims.areaMatch === false), false, "a candidate outside the named-place radius must not be emitted as discovery evidence");
  assert.equal(result.evidence[0]?.claims.locationResolutionSource, "GOOGLE_TEXT_SEARCH");
  assert.deepEqual({
    providerMode: result.metadata.googleGeoDiagnostics?.providerMode,
    requestMode: result.metadata.googleGeoDiagnostics?.requestMode,
    exactRadiusGate: result.metadata.googleGeoDiagnostics?.exactRadiusGate,
    center: result.metadata.googleGeoDiagnostics?.center,
    radiusMeters: result.metadata.googleGeoDiagnostics?.radiusMeters,
    areaMatchBasis: result.metadata.googleGeoDiagnostics?.areaMatchBasis,
  }, {
    providerMode: "GOOGLE_TEXT_SEARCH",
    requestMode: "LOCATION_RESTRICTION_RECTANGLE",
    exactRadiusGate: "ENFORCED",
    center: { latitude: 35.6697, longitude: 139.767 },
    radiusMeters: 1_000,
    areaMatchBasis: "NAMED_PLACE_RADIUS",
  });
  const namedDiagnostics = result.metadata.googleGeoDiagnostics?.candidates ?? [];
  assert.equal(namedDiagnostics.length, 3);
  assert.deepEqual(namedDiagnostics.map(({ sourcePlaceId, accepted, reasonCode }) => ({ sourcePlaceId, accepted, reasonCode })), [
    { sourcePlaceId: "cafe-near", accepted: true, reasonCode: "ACCEPTED" },
    { sourcePlaceId: "cafe-far", accepted: false, reasonCode: "GOOGLE_OUTSIDE_REQUESTED_RADIUS" },
    { sourcePlaceId: "cafe-missing-coordinate", accepted: false, reasonCode: "GOOGLE_LOCATION_REQUIRED_FOR_RADIUS" },
  ]);
  assert.deepEqual(namedDiagnostics[0]?.sourceCoordinates, { latitude: 35.6701, longitude: 139.7672 });
  assert.ok(namedDiagnostics[0]?.distanceMeters && namedDiagnostics[0].distanceMeters > 0 && namedDiagnostics[0].distanceMeters < 1_000, "the diagnostic retains the unrounded distance used by the gate");
  assert.deepEqual(namedDiagnostics[1]?.sourceCoordinates, { latitude: 35.69, longitude: 139.79 });
  assert.ok((namedDiagnostics[1]?.distanceMeters ?? 0) > 1_000);
  assert.equal(namedDiagnostics[2]?.sourceCoordinates, undefined);
  assert.equal(namedDiagnostics[2]?.distanceMeters, undefined);
  assert.equal(result.evidence.some((item) => item.claims.placeId === "cafe-far" || item.claims.placeId === "cafe-missing-coordinate"), false, "rejected raw observations are diagnostics only");
  assert.deepEqual(result.metadata.googleRequests, {
    limit: 2,
    total: 2,
    namedPlaceResolution: 1,
    discovery: 1,
    placeDetails: 0,
  });
});

test("named-place resolution rejects an unmatched suffix instead of treating address text or rank as landmark identity", async () => {
  let call = 0;
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async (_url, init) => {
      call += 1;
      const payload = JSON.parse(String(init?.body)) as { pageSize: number };
      if (call === 1) {
        assert.equal(payload.pageSize, 10, "one bounded location query sees more than the retired three-result cap");
        return new Response(JSON.stringify({ places: [
          { id: "unrelated", displayName: { text: "Different Station" }, location: { latitude: 35.1, longitude: 139.1 } },
          { id: "central-east", displayName: { text: "Central Station East Entrance" }, formattedAddress: "Central Station, Tokyo", location: { latitude: 35.6, longitude: 139.7 }, types: ["transit_station"] },
        ] }), { status: 200 });
      }
      return new Response(JSON.stringify({ places: [] }), { status: 200 });
    },
  });
  await assert.rejects(
    new GooglePlacesRestaurantSearch(client, undefined, 10, { maxRequests: 2 }).search({
      intent: { ...fixtureIntent, area: { query: "near Central Station" } },
    }, new AbortController().signal),
    { code: "GOOGLE_LOCATION_UNRESOLVED" },
  );
  assert.equal(call, 1);
});

test("named-place resolution accepts a provider-typed station suffix but rejects an administrative-area-to-station substitution", async () => {
  const station = { id: "higashi-ginza", displayName: { text: "Higashi-ginza Sta." }, formattedAddress: "Chuo City, Tokyo", location: { latitude: 35.6697, longitude: 139.767 }, types: ["subway_station", "transit_station"], addressComponents: [{ longText: "Chuo City", types: ["locality"] }] };
  const client = new GooglePlacesClient({ apiKey: "key", fetchImplementation: async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as { textQuery: string };
    if (body.textQuery === "Higashi-Ginza") return new Response(JSON.stringify({ places: [station] }), { status: 200 });
    return new Response(JSON.stringify({ places: [] }), { status: 200 });
  } });
  const result = await new GooglePlacesRestaurantSearch(client, undefined, 10, { maxRequests: 2 }).search({ intent: { ...fixtureIntent, area: { query: "near Higashi-Ginza" } } }, new AbortController().signal);
  assert.equal(result.evidence[0]?.claims.resolvedPlaceId, "higashi-ginza");

  const ambiguousRegion = new GooglePlacesClient({ apiKey: "key", fetchImplementation: async () => new Response(JSON.stringify({ places: [{
    id: "tokyo-station", displayName: { text: "Tokyo Station" }, formattedAddress: "Chiyoda City, Tokyo", location: { latitude: 35.6812, longitude: 139.7671 }, types: ["train_station", "transit_station"],
    addressComponents: [{ longText: "Tokyo", types: ["administrative_area_level_1"] }],
  }] }), { status: 200 }) });
  await assert.rejects(new GooglePlacesRestaurantSearch(ambiguousRegion, undefined, 10, { maxRequests: 2 }).search({ intent: { ...fixtureIntent, area: { query: "near Tokyo" } } }, new AbortController().signal), { code: "GOOGLE_LOCATION_UNRESOLVED" });
});

test("named-place suffix matching fails closed without a corresponding provider type and independent geographic context", async () => {
  const client = new GooglePlacesClient({ apiKey: "key", fetchImplementation: async () => new Response(JSON.stringify({ places: [
    { id: "wrong-type", displayName: { text: "Higashi-Ginza Station" }, location: { latitude: 35.6697, longitude: 139.767 }, types: ["park"], addressComponents: [{ longText: "Chuo City", types: ["locality"] }] },
    { id: "missing-context", displayName: { text: "Higashi-Ginza Station" }, location: { latitude: 35.6697, longitude: 139.767 }, types: ["subway_station"] },
  ] }), { status: 200 }) });
  await assert.rejects(new GooglePlacesRestaurantSearch(client, undefined, 10, { maxRequests: 2 }).search({ intent: { ...fixtureIntent, area: { query: "near Higashi-Ginza" } } }, new AbortController().signal), { code: "GOOGLE_LOCATION_UNRESOLVED" });
});

test("only source-level duplicate exact named locations ask for disambiguation", async () => {
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async () => new Response(JSON.stringify({ places: [
      { id: "station-a", displayName: { text: "Central Station" }, location: { latitude: 35.6, longitude: 139.7 } },
      { id: "station-b", displayName: { text: "Central Station" }, location: { latitude: 35.7, longitude: 139.8 } },
    ] }), { status: 200 }),
  });
  const search = new GooglePlacesRestaurantSearch(client, undefined, 10, { maxRequests: 2 });
  await assert.rejects(search.search({ intent: { ...fixtureIntent, area: { query: "near Central Station" } } }, new AbortController().signal), { code: "GOOGLE_LOCATION_AMBIGUOUS" });
});

test("an unrelated first search result never becomes a named nearby landmark", async () => {
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async () => new Response(JSON.stringify({ places: [
      { id: "wrong", displayName: { text: "Different Station" }, location: { latitude: 35.6, longitude: 139.7 } },
    ] }), { status: 200 }),
  });
  const search = new GooglePlacesRestaurantSearch(client, undefined, 10, { maxRequests: 2 });
  await assert.rejects(
    search.search({ intent: { ...fixtureIntent, area: { query: "near Central Station" } } }, new AbortController().signal),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "GOOGLE_LOCATION_UNRESOLVED" && error.message.includes("Different Station") && error.message.includes("wrong"),
  );
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

test("Google Places reports eval-radius decisions separately from its accepted discovery pool", async () => {
  let body: Record<string, unknown> | undefined;
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async (_url, init) => {
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({ places: [
        { id: "eval-near", displayName: { text: "Eval Near" }, formattedAddress: "Tokyo", location: { latitude: 35.6763, longitude: 139.6504 }, types: ["restaurant"] },
        { id: "eval-far", displayName: { text: "Eval Far" }, formattedAddress: "Tokyo", location: { latitude: 35.8, longitude: 139.8 }, types: ["restaurant"] },
        { id: "eval-missing", displayName: { text: "Eval Missing" }, formattedAddress: "Tokyo", types: ["restaurant"] },
      ] }), { status: 200 });
    },
  });
  const search = new GooglePlacesRestaurantSearch(client, undefined, 10, {
    evaluationLocation: { latitude: 35.6762, longitude: 139.6503 },
  });
  const result = await search.search({ intent: { ...fixtureIntent, area: { query: "nearby" } } }, new AbortController().signal);
  const rectangle = (body?.locationRestriction as { rectangle?: { low: { latitude: number; longitude: number }; high: { latitude: number; longitude: number } } } | undefined)?.rectangle;
  assert.ok(rectangle);
  assert.ok(rectangle.low.latitude < 35.6762 && rectangle.high.latitude > 35.6762);
  assert.ok(rectangle.low.longitude < 139.6503 && rectangle.high.longitude > 139.6503);
  assert.equal(body?.locationBias, undefined);
  assert.doesNotMatch(String(body?.textQuery), /near nearby/i);
  assert.deepEqual(result.candidates.map((candidate) => candidate.restaurant.sourceIds.googlePlaces), ["eval-near"]);
  assert.deepEqual({
    providerMode: result.metadata.googleGeoDiagnostics?.providerMode,
    requestMode: result.metadata.googleGeoDiagnostics?.requestMode,
    exactRadiusGate: result.metadata.googleGeoDiagnostics?.exactRadiusGate,
    center: result.metadata.googleGeoDiagnostics?.center,
    radiusMeters: result.metadata.googleGeoDiagnostics?.radiusMeters,
    areaMatchBasis: result.metadata.googleGeoDiagnostics?.areaMatchBasis,
  }, {
    providerMode: "GOOGLE_TEXT_SEARCH",
    requestMode: "LOCATION_RESTRICTION_RECTANGLE",
    exactRadiusGate: "ENFORCED",
    center: { latitude: 35.6762, longitude: 139.6503 },
    radiusMeters: 3_000,
    areaMatchBasis: "EVALUATION_LOCATION_RADIUS",
  });
  const evalDiagnostics = result.metadata.googleGeoDiagnostics?.candidates ?? [];
  assert.deepEqual(evalDiagnostics.map(({ distanceMeters: _distanceMeters, ...diagnostic }) => diagnostic), [
    { sourcePlaceId: "eval-near", sourceCoordinates: { latitude: 35.6763, longitude: 139.6504 }, accepted: true, reasonCode: "ACCEPTED" },
    { sourcePlaceId: "eval-far", sourceCoordinates: { latitude: 35.8, longitude: 139.8 }, accepted: false, reasonCode: "GOOGLE_OUTSIDE_REQUESTED_RADIUS" },
    { sourcePlaceId: "eval-missing", accepted: false, reasonCode: "GOOGLE_LOCATION_REQUIRED_FOR_RADIUS" },
  ]);
  assert.ok((evalDiagnostics[0]?.distanceMeters ?? 0) < 3_000);
  assert.ok((evalDiagnostics[1]?.distanceMeters ?? 0) > 3_000);
  assert.equal(result.evidence.some((item) => item.claims.placeId === "eval-far" || item.claims.placeId === "eval-missing"), false, "rejected eval observations are diagnostics only");
});

test("Google Places request budget is mechanical and isolated by persistent read run", async () => {
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async () => new Response(JSON.stringify({ places: [] }), { status: 200 }),
  });
  const search = new GooglePlacesRestaurantSearch(client, undefined, 10, { maxRequests: 1 });
  await search.search({ intent: fixtureIntent, readRunId: "task-a" }, new AbortController().signal);
  await assert.rejects(search.search({ intent: fixtureIntent, readRunId: "task-a" }, new AbortController().signal), { code: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" });
  await search.search({ intent: fixtureIntent, readRunId: "task-b" }, new AbortController().signal);
});

test("candidate fact investigation re-reads only the known Google place and shares discovery budget", async () => {
  let calls = 0;
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async (_url, init) => {
      calls += 1;
      const place = {
        id: "place-1", displayName: { text: "Cafe One" }, formattedAddress: "Tokyo",
        types: ["cafe", "food"], primaryType: "cafe",
        regularOpeningHours: { weekdayDescriptions: ["Tuesday: 10:00 AM – 6:00 PM"] },
      };
      return new Response(JSON.stringify(init?.method === "GET" ? place : { places: [place] }), { status: 200 });
    },
  });
  const intent = {
    ...fixtureIntent,
    target: { goal: "RECOMMENDATION" as const, query: "afternoon cafe" },
    date: "2026-08-04", timeWindow: { earliest: "12:00", latest: "15:00" },
    criteria: [{ text: "cafe", polarity: "POSITIVE" as const, strength: "HARD" as const }],
  };
  const search = new GooglePlacesRestaurantSearch(client, () => "2026-08-03T09:00:00.000Z", 10, { maxRequests: 2 });
  const discovered = await search.search({ intent }, new AbortController().signal);
  const facts = await search.inspectFacts({ candidateIds: [discovered.candidates[0]!.restaurant.id], candidates: discovered.candidates, intent }, new AbortController().signal);
  assert.equal(calls, 2);
  assert.equal(facts.factChecks[discovered.candidates[0]!.restaurant.id]?.status, "COMPLETED");
  assert.ok(facts.evidence.some((item) => item.kind === "RESTAURANT_FACT" && item.claims.openingHoursMatch === true));
  assert.deepEqual(facts.metadata.googleRequests, {
    limit: 2,
    total: 2,
    namedPlaceResolution: 0,
    discovery: 1,
    placeDetails: 1,
  });
  await assert.rejects(search.search({ intent }, new AbortController().signal), { code: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" });
});

test("candidate fact investigation uses Place Details by stable ID, never another text search", async () => {
  const urls: string[] = [];
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async (url, init) => {
      urls.push(String(url));
      const place = { id: "place-1", displayName: { text: "Cafe One" }, formattedAddress: "Tokyo", types: ["cafe"] };
      return new Response(JSON.stringify(init?.method === "GET" ? place : { places: [place] }), { status: 200 });
    },
  });
  const search = new GooglePlacesRestaurantSearch(client, undefined, 10, { maxRequests: 2 });
  const intent = { ...fixtureIntent, target: { goal: "RECOMMENDATION" as const, query: "cafe" } };
  const discovered = await search.search({ intent, readRunId: "run-a" }, new AbortController().signal);
  await search.inspectFacts({ candidateIds: [discovered.candidates[0]!.restaurant.id], candidates: discovered.candidates, intent, readRunId: "run-a" }, new AbortController().signal);
  assert.match(urls[1] ?? "", /\/v1\/places\/place-1$/);
});

test("a fact read records exhausted shared discovery capacity without a second provider call", async () => {
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async () => new Response(JSON.stringify({ places: [{
      id: "place-1", displayName: { text: "Cafe One" }, formattedAddress: "Tokyo", types: ["cafe"], primaryType: "cafe",
    }] }), { status: 200 }),
  });
  const intent = { ...fixtureIntent, target: { goal: "RECOMMENDATION" as const, query: "cafe" } };
  const search = new GooglePlacesRestaurantSearch(client, undefined, 10, { maxRequests: 1 });
  const discovered = await search.search({ intent }, new AbortController().signal);
  const facts = await search.inspectFacts({ candidateIds: [discovered.candidates[0]!.restaurant.id], candidates: discovered.candidates, intent }, new AbortController().signal);
  assert.equal(facts.factChecks[discovered.candidates[0]!.restaurant.id]?.reasonCode, "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED");
  assert.equal(facts.metadata.failureCode, "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED");
});

test("Google Places classifies provider failure without exposing a response body", async () => {
  const failed = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async () => { throw new Error("upstream diagnostic payload"); },
  });
  await assert.rejects(
    failed.textSearch({ textQuery: "restaurant", pageSize: 1 }, new AbortController().signal),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "GOOGLE_NETWORK_FAILED" && !error.message.includes("upstream diagnostic payload"),
  );

});

test("failed sent Google requests consume the same per-run local budget and remain separately accounted", async () => {
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async () => { throw new Error("unreachable provider"); },
  });
  const search = new GooglePlacesRestaurantSearch(client, undefined, 10, { maxRequests: 1 });
  await assert.rejects(search.search({ intent: fixtureIntent, readRunId: "failed-run" }, new AbortController().signal), { code: "GOOGLE_NETWORK_FAILED" });
  assert.deepEqual(search.googleRequestUsage("failed-run"), {
    limit: 1,
    total: 1,
    namedPlaceResolution: 0,
    discovery: 1,
    placeDetails: 0,
  });
  await assert.rejects(search.search({ intent: fixtureIntent, readRunId: "failed-run" }, new AbortController().signal), { code: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" });
});

test("the explicit one-hundred-request debug ceiling permits work beyond the retired cap and stops only at its own run boundary", async () => {
  // Start/end: the production Google adapter receives 100 successful discovery reads, then its 101st local request is rejected.
  // External replacement: Google HTTP response only. This proves accounting, not real Google service capacity.
  let sent = 0;
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async () => {
      sent += 1;
      return new Response(JSON.stringify({ places: [] }), { status: 200 });
    },
  });
  const search = new GooglePlacesRestaurantSearch(client, undefined, 10, { maxRequests: 100 });
  for (let index = 0; index < 100; index += 1) {
    await search.search({ intent: fixtureIntent, readRunId: "debug-run" }, new AbortController().signal);
  }
  assert.equal(sent, 100);
  assert.deepEqual(search.googleRequestUsage("debug-run"), {
    limit: 100, total: 100, namedPlaceResolution: 0, discovery: 100, placeDetails: 0,
  });
  await assert.rejects(search.search({ intent: fixtureIntent, readRunId: "debug-run" }, new AbortController().signal), { code: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" });
  assert.equal(sent, 100, "the local boundary rejects before another network request");
  await search.search({ intent: fixtureIntent, readRunId: "next-debug-run" }, new AbortController().signal);
  assert.equal(sent, 101, "a distinct run has an isolated request budget");
});
