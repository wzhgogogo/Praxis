import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureIntent as namedFixtureIntent } from "../../harness/restaurant-fixtures.js";
// Transport/pagination/fact tests start with an already observed circle. Named
// resolution is exercised separately with an explicit area (near X and X).
const fixtureIntent = { ...namedFixtureIntent, area: { ...namedFixtureIntent.area!,
  coordinates: { latitude: 35.6, longitude: 139.7, observedAt: "2026-10-08T00:00:00Z", source: "MANUAL_PLACE" as const },
} };
import { GooglePlacesClient } from "./google-places-client.js";
import { buildGooglePlacesTextQuery, GooglePlacesRestaurantSearch } from "./google-places-restaurant-search.js";
import { GOOGLE_PLACES_RESTAURANT_FIELD_MASK } from "./google-places-contracts.js";

test("Japanese source names share the run's existing Google Details ceiling and cache across consumers", async () => {
  const sent: string[] = [];
  const adapter = new GooglePlacesRestaurantSearch(new GooglePlacesClient({apiKey:"fixture",fetchImplementation:async url=>{
    sent.push(String(url));
    return new Response(JSON.stringify({id:new URL(String(url)).pathname.split("/").at(-1),displayName:{text:"原文の店名",languageCode:"ja"}}));
  }}),undefined,10,{maxRequests:1});
  const signal=new AbortController().signal;
  const both=await Promise.all([adapter.japaneseName("place-a","run-a",signal),adapter.japaneseName("places/place-a","run-a",signal)]);
  assert.strictEqual(both[0],both[1]);
  assert.equal(sent.length,1);
  assert.deepEqual(adapter.googleRequestUsage("run-a"),{limit:1,total:1,namedPlaceResolution:0,discovery:0,placeDetails:1,reverseAddressObservation:0});
  await assert.rejects(adapter.japaneseName("place-b","run-a",signal),{code:"GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED"});
  assert.equal(sent.length,1,"no request beyond the combined ceiling");
  await adapter.japaneseName("place-a","run-a",signal);
  await adapter.japaneseName("place-a","run-b",signal);
  assert.equal(sent.length,2,"different runs do not share a source observation");
  const controller=new AbortController();controller.abort();
  await assert.rejects(adapter.japaneseName("place-a","run-a",controller.signal));
  assert.equal(sent.length,2);
});

test("a sent Japanese-name failure consumes one Details request without retry by the second source", async () => {
  let sent=0;
  const adapter=new GooglePlacesRestaurantSearch(new GooglePlacesClient({apiKey:"fixture",fetchImplementation:async()=>{
    sent++;return new Response(JSON.stringify({id:"different-place",displayName:{text:"別の店",languageCode:"ja"}}));
  }}),undefined,10,{maxRequests:5});
  for(let consumer=0;consumer<2;consumer++)await assert.rejects(adapter.japaneseName("place-a","run-a",new AbortController().signal),{code:"GOOGLE_MALFORMED_RESPONSE"});
  assert.equal(sent,1);
  assert.equal(adapter.googleRequestUsage("run-a").placeDetails,1);
});

test("a Japanese full user name can retain a same-ID source name without translating the Google English display name",async()=>{
  const sent:string[]=[];
  const adapter=new GooglePlacesRestaurantSearch(new GooglePlacesClient({apiKey:"fixture",fetchImplementation:async(url,init)=>{
    sent.push(String(url));
    const place={id:"same-place",displayName:{text:"Google English Display"},formattedAddress:"Tokyo Akabane 1-15-1",types:["restaurant"],nationalPhoneNumber:"03-5249-4011"};
    return new Response(JSON.stringify(init?.method==="POST"?{places:[place]}:{id:"same-place",displayName:{text:"串カツでんがな赤羽店",languageCode:"ja"}}));
  }}),()=>"2026-11-03T03:00:00Z",10,{maxRequests:2});
  const {area:_area,...withoutArea}=fixtureIntent;
  const intent={...withoutArea,target:{goal:"AVAILABILITY" as const,selectionScope:"SPECIFIC_OUTLET" as const,query:"串カツでんがな赤羽店"}};
  const read=await adapter.search({intent,readRunId:"source-name-run"},new AbortController().signal);
  assert.equal(read.candidates.length,1);assert.equal(read.candidates[0]!.restaurant.outletName,"Google English Display");
  assert.ok(read.evidence.some(e=>e.provider==="GOOGLE_PLACES"&&e.sourceEntityId==="same-place"&&e.claims.outletName==="串カツでんがな赤羽店"&&e.claims.sourceNameLanguage==="ja"));
  assert.equal(read.evidence.find(e=>e.kind==="DISCOVERY")!.claims.namedOutletStatus,"AMBIGUOUS","Source identity is still required before selection/presentation");
  assert.equal((await adapter.observedSourceNames(read.candidates,"source-name-run")).length,1);
  assert.deepEqual(await adapter.observedSourceNames(read.candidates,"other-run"),[]);
  assert.equal(sent.length,2,"Read-back adds no request beyond Text Search plus same-ID Japanese Details");
  assert.equal(adapter.googleRequestUsage("source-name-run").total,2);
});

test("ranked named geography accepts the saved spellings, keeps nearby geographic alternatives and rejects remote ambiguity", async () => {
  const captured = JSON.parse(readFileSync(new URL("./fixtures/phase2c-location-observations.json", import.meta.url), "utf8"));
  const center = { latitude: 35.6697, longitude: 139.7670 };
  const resolve = async (places: unknown[], query: string) => new GooglePlacesRestaurantSearch(new GooglePlacesClient({
    apiKey: "fixture", fetchImplementation: async () => new Response(JSON.stringify({ places }), { status: 200 }),
  }), undefined, 10, { evaluationLocation: center }).resolveNamedNearbyLocation({ intent: { ...fixtureIntent, area: { query } } }, new AbortController().signal);
  for (const observation of captured.observations) {
    const first = observation.places[0];
    const result = await resolve(observation.places, observation.query);
    assert.equal(result.location?.label, first.displayName.text);
    assert.deepEqual({ latitude: result.location?.latitude, longitude: result.location?.longitude }, first.location);
    assert.equal(result.evidence?.claims.locationNameExactMatch, false, "spelling correspondence is recorded, never a gate");
  }
  const first = captured.observations[0].places[0];
  const second = { ...first, id: "nearby-alternative", displayName: { text: "Source supplied adjacent station" }, location: { latitude: first.location.latitude + 0.001, longitude: first.location.longitude } };
  const clustered = await resolve([first, second], "near user supplied area");
  assert.equal(clustered.publicLocationObservation?.placeId, first.id, "preserve source ranking inside a local cluster");
  await assert.rejects(resolve([{ ...first, types: ["restaurant"] }], "near user supplied area"), { code: "GOOGLE_LOCATION_UNRESOLVED" });
  await assert.rejects(resolve([{ ...first, location: { latitude: 26.9, longitude: -80.1 } }], "near user supplied area"), { code: "GOOGLE_LOCATION_AMBIGUOUS" });
  await assert.rejects(resolve([first, { ...second, location: { latitude: 38, longitude: 141 } }], "near user supplied area"), { code: "GOOGLE_LOCATION_AMBIGUOUS" });
});

test("Google query is discovery-owned and does not serialize criteria into retrieval text", () => {
  const query = buildGooglePlacesTextQuery({ intent: fixtureIntent, retrievalHint: "Japanese wording" });
  assert.match(query, /Shinjuku/);
  assert.match(query, /Japanese wording/);
  assert.doesNotMatch(query, /yakiniku/);
});

test("a positive-HARD pack query keeps only its keyword and resolved location in Text Search", () => {
  const query = buildGooglePlacesTextQuery({ intent: fixtureIntent, discoveryQuery: { positiveCriteria:[],
    category: "omakase", keyword: "omakase",
    location: { latitude: 35.658, longitude: 139.7, radiusMeters: 1_000, label: "Shibuya", areaMatchBasis: "TASK_LOCATION_RADIUS" },
  } });
  assert.equal(query, "omakase Shibuya");
});

test("a source-plan location prevents a second named-place lookup before Google discovery", async () => {
  const queries: string[] = [];
  const client = new GooglePlacesClient({ apiKey: "key", fetchImplementation: async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as { textQuery: string };
    queries.push(body.textQuery);
    return new Response(JSON.stringify({ places: [] }), { status: 200 });
  } });
  await new GooglePlacesRestaurantSearch(client).search({
    intent: { ...fixtureIntent, area: { query: "near Shibuya" } },
    discoveryQuery: { positiveCriteria:[],
      category: "omakase", keyword: "omakase",
      location: { latitude: 35.658, longitude: 139.7016, radiusMeters: 1_000, label: "Shibuya", areaMatchBasis: "NAMED_PLACE_RADIUS" },
    },
    readRunId: "source-plan-location",
  }, new AbortController().signal);
  assert.deepEqual(queries, ["omakase Shibuya"]);
});

test("a pack query without a positive HARD keyword uses Nearby Search's exact circle instead of location-only text", async () => {
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
  const client = new GooglePlacesClient({ apiKey: "key", fetchImplementation: async (url, init) => {
    requests.push({ url: String(url), body: JSON.parse(String(init?.body)) as Record<string, unknown> });
    return new Response(JSON.stringify({ places: [{ id: "nearby-1", displayName: { text: "Nearby restaurant" }, formattedAddress: "Tokyo", location: { latitude: 35.6697, longitude: 139.767 }, types: ["restaurant"] }] }), { status: 200 });
  } });
  const result = await new GooglePlacesRestaurantSearch(client).search({
    intent: { ...fixtureIntent, criteria: [], area: { query: "Higashi-Ginza", coordinates: { latitude: 35.6697, longitude: 139.767, observedAt: "2026-10-07T00:00:00.000Z", source: "MANUAL_PLACE" }, radiusMeters: 3_000 } },
    discoveryQuery: { positiveCriteria:[], category: "restaurant", location: { latitude: 35.6697, longitude: 139.767, radiusMeters: 3_000, label: "Higashi-Ginza", areaMatchBasis: "TASK_LOCATION_RADIUS" } },
  }, new AbortController().signal);
  assert.equal(requests[0]?.url, "https://places.googleapis.com/v1/places:searchNearby");
  assert.equal((requests[0]?.body.locationRestriction as { circle: { radius: number } }).circle.radius, 3_000);
  assert.equal(result.metadata.googleGeoDiagnostics?.providerMode, "GOOGLE_NEARBY_SEARCH");
  assert.equal(result.continuation?.exhausted, true);
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
    locationContext: { latitude: 35.6, longitude: 139.7, radiusMeters: 1000, label: fixtureIntent.area.query, areaMatchBasis: "TASK_LOCATION_RADIUS" },
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
    locationContext: { latitude: 35.6, longitude: 139.7, radiusMeters: 1000, label: fixtureIntent.area.query, areaMatchBasis: "TASK_LOCATION_RADIUS" },
  });
});

test("named-location resolution accepts near X and bare X with the same bounded typed observation", async () => {
  for (const query of ["near Higashi Ginza", "Higashi Ginza"]) {
  let calls = 0;
  const client = new GooglePlacesClient({ apiKey: "key", fetchImplementation: async (_url, init) => {
    calls++;
    assert.equal(JSON.parse(String(init?.body)).textQuery, "Higashi Ginza");
    return new Response(JSON.stringify({ places: [{
    id: "higashi-ginza", displayName: { text: "Higashi Ginza" }, formattedAddress: "Tokyo",
    location: { latitude: 35.6697, longitude: 139.767 }, types: ["neighborhood", "political"],
    addressComponents: [{ longText: "Ginza", types: ["sublocality_level_1", "political"] }],
  }] }), { status: 200 }); } });
  const result = await new GooglePlacesRestaurantSearch(client, () => "2026-10-08T00:00:00.000Z", 10, { maxRequests: 1 }).resolveNamedNearbyLocation({
    intent: { ...fixtureIntent, area: { query, radiusMeters: 1_000 } }, readRunId: "typed-public-observation",
  }, new AbortController().signal);
  assert.deepEqual(result.publicLocationObservation, {
    placeId: "higashi-ginza", displayName: "Higashi Ginza", types: ["neighborhood", "political"],
    addressComponents: [{ longText: "Ginza", types: ["sublocality_level_1", "political"] }],
    coordinates: { latitude: 35.6697, longitude: 139.767 },
  });
  assert.equal(calls, 1);
  }
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
    placeDetails: 0, reverseAddressObservation: 0,
  });
});

test("geographic source labels require no spelling or administrative suffix inference", async () => {
  for (const type of ["locality", "subway_station", "park"]) {
    const place = { id: type, displayName: { text: "Actual source label" }, location: { latitude: 1, longitude: 2 }, types: [type] };
    const client = new GooglePlacesClient({ apiKey: "fixture", fetchImplementation: async () => new Response(JSON.stringify({ places: [place] }), { status: 200 }) });
    const result = await new GooglePlacesRestaurantSearch(client).resolveNamedNearbyLocation({ intent: { ...fixtureIntent, area: { query: "near User wording" } } }, new AbortController().signal);
    assert.equal(result.location?.label, place.displayName.text);
    assert.deepEqual(result.evidence?.claims.resolvedPlaceTypes, [type]);
  }
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

test("unresolved named-place diagnostics retain only bounded public identity observations", async () => {
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async () => new Response(JSON.stringify({ places: [{
      id: "wrong", displayName: { text: "Different Station" }, formattedAddress: "not-retained-address",
      location: { latitude: 35.6, longitude: 139.7 }, types: ["restaurant"],
      addressComponents: [{ longText: "Shinjuku City", shortText: "Shinjuku", types: ["locality"] }],
      nationalPhoneNumber: "private-phone", websiteUri: "https://private.example",
    }] }), { status: 200 }),
  });
  const search = new GooglePlacesRestaurantSearch(client, undefined, 10, { maxRequests: 2 });
  await assert.rejects(
    search.search({ intent: { ...fixtureIntent, area: { query: "near Central Station" } } }, new AbortController().signal),
    (error: unknown) => {
      if (!error || typeof error !== "object" || !("publicLocationObservations" in error)) return false;
      const observations = error.publicLocationObservations as Array<Record<string, unknown>>;
      assert.deepEqual(observations, [{
        placeId: "wrong", displayName: "Different Station", types: ["restaurant"],
        addressComponents: [{ longText: "Shinjuku City", shortText: "Shinjuku", types: ["locality"] }],
        coordinates: { latitude: 35.6, longitude: 139.7 },
      }]);
      assert.doesNotMatch(JSON.stringify(observations), /private-phone|private\.example|not-retained-address/);
      return true;
    },
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
    radiusMeters: 1_000,
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
  const requests: Array<{ url: string; method: string }> = [];
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async (url, init) => {
      calls += 1;
      requests.push({ url: String(url), method: init?.method ?? "GET" });
      const place = {
        id: "place-1", displayName: { text: "Cafe One" }, formattedAddress: "Tokyo", location: { latitude: 35.6, longitude: 139.7 },
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
  const discovered = await search.search({ intent, readRunId: "run-a" }, new AbortController().signal);
  const facts = await search.inspectFacts({ candidateIds: [discovered.candidates[0]!.restaurant.id], candidates: discovered.candidates, intent, readRunId: "run-a" }, new AbortController().signal);
  assert.equal(calls, 2);
  assert.deepEqual(requests, [
    { url: "https://places.googleapis.com/v1/places:searchText", method: "POST" },
    { url: "https://places.googleapis.com/v1/places/place-1", method: "GET" },
  ], "fact investigation must reuse the stable place ID without another text search");
  assert.equal(facts.factChecks[discovered.candidates[0]!.restaurant.id]?.status, "COMPLETED");
  assert.ok(facts.evidence.some((item) => item.kind === "RESTAURANT_FACT" && item.claims.openingHoursMatch === true));
  assert.deepEqual(facts.metadata.googleRequests, {
    limit: 2,
    total: 2,
    namedPlaceResolution: 0,
    discovery: 1,
    placeDetails: 1, reverseAddressObservation: 0,
  });
  await assert.rejects(search.search({ intent, readRunId: "run-a" }, new AbortController().signal), { code: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" });
});


test("a fact read records exhausted shared discovery capacity without a second provider call", async () => {
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async () => new Response(JSON.stringify({ places: [{
      id: "place-1", displayName: { text: "Cafe One" }, formattedAddress: "Tokyo", location: { latitude: 35.6, longitude: 139.7 }, types: ["cafe"], primaryType: "cafe",
    }] }), { status: 200 }),
  });
  const intent = { ...fixtureIntent, target: { goal: "RECOMMENDATION" as const, query: "cafe" } };
  const search = new GooglePlacesRestaurantSearch(client, undefined, 10, { maxRequests: 1 });
  const discovered = await search.search({ intent }, new AbortController().signal);
  const facts = await search.inspectFacts({ candidateIds: [discovered.candidates[0]!.restaurant.id], candidates: discovered.candidates, intent }, new AbortController().signal);
  assert.equal(facts.factChecks[discovered.candidates[0]!.restaurant.id]?.reasonCode, "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED");
  assert.equal(facts.metadata.failureCode, "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED");
});


test("failed sent Google requests consume the same per-run local budget and remain separately accounted", async () => {
  const client = new GooglePlacesClient({
    apiKey: "key",
    fetchImplementation: async () => { throw new Error("upstream diagnostic payload"); },
  });
  const search = new GooglePlacesRestaurantSearch(client, undefined, 10, { maxRequests: 1 });
  await assert.rejects(search.search({ intent: fixtureIntent, readRunId: "failed-run" }, new AbortController().signal),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "GOOGLE_NETWORK_FAILED" && !error.message.includes("upstream diagnostic payload"));
  assert.deepEqual(search.googleRequestUsage("failed-run"), {
    limit: 1,
    total: 1,
    namedPlaceResolution: 0,
    discovery: 1,
    placeDetails: 0, reverseAddressObservation: 0,
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
    limit: 100, total: 100, namedPlaceResolution: 0, discovery: 100, placeDetails: 0, reverseAddressObservation: 0,
  });
  await assert.rejects(search.search({ intent: fixtureIntent, readRunId: "debug-run" }, new AbortController().signal), { code: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" });
  assert.equal(sent, 100, "the local boundary rejects before another network request");
  await search.search({ intent: fixtureIntent, readRunId: "next-debug-run" }, new AbortController().signal);
  assert.equal(sent, 101, "a distinct run has an isolated request budget");
});


test("nearby defaults to 1000 meters, preserves explicit radius and admits only the exact circle", async () => {
  const center = { latitude: 1, longitude: 2 };
  const requests: unknown[] = [];
  const client = new GooglePlacesClient({ apiKey: "fixture", fetchImplementation: async (_url, init) => {
    requests.push(JSON.parse(String(init?.body)));
    return new Response(JSON.stringify({ places: [999, 1001].map(meters => ({
      id: `distance-${meters}`, displayName: { text: `Restaurant ${meters}` }, formattedAddress: "observed address",
      location: { latitude: center.latitude + meters / 111320, longitude: center.longitude }, types: ["restaurant"],
    })) }), { status: 200 });
  } });
  const search = new GooglePlacesRestaurantSearch(client, undefined, 10, { evaluationLocation: center });
  const intent = { ...fixtureIntent, criteria: [], area: { query: "nearby" } };
  const evaluation = await search.search({ intent }, new AbortController().signal);
  assert.equal(evaluation.metadata.googleGeoDiagnostics?.radiusMeters, 1000);
  assert.deepEqual(evaluation.candidates.map(c => c.restaurant.sourceIds.googlePlaces), ["distance-999"]);
  const task = await search.search({ intent: { ...intent, area: { query: "nearby", coordinates: { ...center, observedAt: "2026-10-11T00:00:00Z", source: "DEVICE" } } } }, new AbortController().signal);
  assert.equal(task.metadata.googleGeoDiagnostics?.radiusMeters, 1000);
  const explicit = await search.search({ intent: { ...intent, area: { query: "nearby", radiusMeters: 2000, coordinates: { ...center, observedAt: "2026-10-11T00:00:00Z", source: "DEVICE" } } } }, new AbortController().signal);
  assert.equal(explicit.metadata.googleGeoDiagnostics?.radiusMeters, 2000);
  assert.equal(explicit.candidates.length, 2);
  await client.textSearch({ textQuery: "observed query", pageSize: 10, locationBias: center }, new AbortController().signal);
  assert.equal((requests.at(-1) as { locationBias: { circle: { radius: number } } }).locationBias.circle.radius, 1000);
});


test("named area resolution binds bias, prefers geography and refuses distant or merchant authority", async () => {
  const center = { latitude: 1, longitude: 2 };
  const recorded = JSON.parse(readFileSync(new URL("./fixtures/far-named-merchant.json", import.meta.url), "utf8"));
  const resolve = async (places: unknown[], query = "near Example area", context: typeof center | null = center) => {
    let body: Record<string, unknown> | undefined;
    const client = new GooglePlacesClient({ apiKey: "fixture", fetchImplementation: async (_url, init) => { body = JSON.parse(String(init?.body)); return new Response(JSON.stringify({ places }), { status: 200 }); } });
    const search = new GooglePlacesRestaurantSearch(client, undefined, 10, context ? { evaluationLocation: context } : {});
    const result = await search.resolveNamedNearbyLocation({ intent: { ...fixtureIntent, area: { query } } }, new AbortController().signal);
    return { result, body };
  };
  await assert.rejects(resolve(recorded.places, "near Recorded area"), { code: "GOOGLE_LOCATION_UNRESOLVED" });
  const merchant = { id: "merchant", displayName: { text: "Example area" }, location: center, types: ["restaurant"] };
  const geographic = { id: "geographic", displayName: { text: "Example area" }, location: center, types: ["neighborhood"] };
  const mixed = await resolve([merchant, geographic]);
  assert.equal(mixed.result.publicLocationObservation?.placeId, "geographic");
  assert.deepEqual((mixed.body?.locationBias as { circle: unknown }).circle, { center, radius: 1000 });
  await assert.rejects(resolve([merchant]), { code: "GOOGLE_LOCATION_UNRESOLVED" });
  await assert.rejects(resolve([{ ...geographic, location: { latitude: 3, longitude: 4 } }]), error => {
    assert.equal((error as { code: string }).code, "GOOGLE_LOCATION_AMBIGUOUS");
    assert.equal((error as { publicLocationObservations: unknown[] }).publicLocationObservations.length, 1);
    return true;
  });
  const withoutContext = await resolve([geographic], "near Example area", null);
  assert.equal(withoutContext.body?.locationBias, undefined);
  assert.equal(withoutContext.result.location?.latitude, center.latitude);
});

// P1-G: real failed observation and saved location projections, offline transport only.
test("saved successful geographic observations retain their source coordinates and distance boundary", async () => {
  const fixture = JSON.parse(readFileSync(new URL("./fixtures/p1g-location-observations.json", import.meta.url), "utf8"));
  const center = { latitude: 35.6697, longitude: 139.7670 };
  const resolve = async (query: string, places: unknown[]) => {
    const client = new GooglePlacesClient({ apiKey: "fixture", fetchImplementation: async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body.locationBias.circle, { center, radius: 1000 });
      return new Response(JSON.stringify({ places }), { status: 200 });
    } });
    return new GooglePlacesRestaurantSearch(client, undefined, 10, { evaluationLocation: center })
      .resolveNamedNearbyLocation({ intent: { ...fixtureIntent, area: { query: `near ${query}` } } }, new AbortController().signal);
  };
  const recorded = await resolve("Kichijoji", [fixture.kichijoji]);
  assert.equal(recorded.location?.latitude, 35.704096);
  assert.equal(recorded.location?.longitude, 139.580205);
  for (const [query, name, type] of [["Jiyugaoka", "Jiyūgaoka", "neighborhood"], ["KO EN-JI", "Kōenji", "sublocality"]]) {
    const positive = await resolve(query!, [{ id: query, displayName: { text: name }, types: [type], location: center }]);
    assert.equal(positive.location?.label, name);
  }
  await assert.rejects(resolve("Ebisu", [{ id: "merchant", displayName: { text: "Ebisu" }, types: ["restaurant"], location: { latitude: 26.9355755, longitude: -80.1379124 } }]), { code: "GOOGLE_LOCATION_UNRESOLVED" });
  assert.equal((await resolve("Kichijoji", [fixture.kichijoji, { ...fixture.kichijoji, id: "second", location: center }])).location?.latitude, fixture.kichijoji.location.latitude);
  await assert.rejects(resolve("Kichijoji", [{ ...fixture.kichijoji, location: { latitude: 26.9, longitude: -80.1 } }]), { code: "GOOGLE_LOCATION_AMBIGUOUS" });
  for (const previous of fixture.regressions) {
    const result = await resolve(previous.query, [{ id: previous.query, displayName: { text: previous.name }, types: [previous.type], addressComponents: previous.addressComponents, location: { latitude: previous.latitude, longitude: previous.longitude } }]);
    assert.equal(result.location?.latitude, previous.latitude, previous.query);
    assert.equal(result.location?.longitude, previous.longitude, previous.query);
  }
});

test('Round20 Google ordinary, named and detail entries carry the same intent/type gate',async()=>{
 const place={id:'age3-test',displayName:{text:'Age.3 GINZA'},formattedAddress:'Ginza, Tokyo',location:{latitude:35.6,longitude:139.7},primaryType:'cafe',types:['cafe','dessert_restaurant','snack_bar','sandwich_shop','meal_takeaway','restaurant']};
 const client=new GooglePlacesClient({apiKey:'fixture',fetchImplementation:async(_url,init)=>new Response(JSON.stringify(init?.method==='POST'?{places:[place]}:place))});
 const adapter=new GooglePlacesRestaurantSearch(client,()=> '2026-11-21T08:00:00Z',10,{maxRequests:12});
 const generic={...fixtureIntent,criteria:[],timeWindow:{earliest:'19:00',latest:'20:00'},target:{goal:'RECOMMENDATION' as const,selectionScope:'OPEN_ENDED' as const,query:'restaurant in Ginza'}};
 const signal=new AbortController().signal;
 assert.equal((await adapter.search({intent:generic,readRunId:'round20-generic'},signal)).candidates.length,0);
 const named=await adapter.search({intent:{...generic,target:{...generic.target,selectionScope:'SPECIFIC_OUTLET',query:'Age.3 GINZA'}},readRunId:'round20-named'},signal);assert.equal(named.candidates.length,1);
 const detail=await adapter.inspectFacts({intent:generic,candidateIds:[named.candidates[0]!.restaurant.id],candidates:named.candidates,readRunId:'round20-details'},signal);
 assert.equal(detail.factChecks[named.candidates[0]!.restaurant.id]!.reasonCode,'GOOGLE_PLACE_TYPE_UNUSABLE');
 assert.equal((await adapter.search({intent:{...generic,target:{...generic.target,query:'dessert cafe'}},readRunId:'round20-cafe'},signal)).candidates.length,1);
});
