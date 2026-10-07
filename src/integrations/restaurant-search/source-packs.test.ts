import assert from "node:assert/strict";
import test from "node:test";

import { discoveryPackById, googlePlacesDiscoveryPack, tableCheckDiscoveryPack, tabelogDiscoveryPack } from "./source-packs.js";

const query = { category: "restaurant", location: { latitude: 35.6697, longitude: 139.767, radiusMeters: 3_000, label: "Higashi-Ginza", areaMatchBasis: "EVALUATION_LOCATION_RADIUS" as const } };

test("real source packs own URLs, reviewed reads, skills, and opaque source IDs", () => {
  assert.equal(discoveryPackById("tabelog"), tabelogDiscoveryPack);
  assert.equal(discoveryPackById("tablecheck"), tableCheckDiscoveryPack);
  assert.equal(discoveryPackById("google-places"), googlePlacesDiscoveryPack);
  assert.ok(tabelogDiscoveryPack.availability?.ground, "Tabelog grounding remains pack-owned");
  assert.ok(tableCheckDiscoveryPack.availability?.ground, "TableCheck grounding remains pack-owned");
  const shibuyaTask = tabelogDiscoveryPack.buildQuery({ ...query, location: { ...query.location, label: "Shibuya", areaMatchBasis: "TASK_LOCATION_RADIUS" } });
  assert.equal(shibuyaTask.url, "https://tabelog.com/en/tokyo/A1303/A130301/rstLst/", "an exact observed task-location route is pack data");
  assert.equal(shibuyaTask.areaEntrance, "SOURCE_OBSERVED");
  assert.equal(tabelogDiscoveryPack.buildQuery({ ...query, location: { ...query.location, label: "Shibuya", areaMatchBasis: "NAMED_PLACE_RADIUS" } }).url, "https://tabelog.com/en/tokyo/A1303/A130301/rstLst/", "the observed named-place route remains valid after coordinate resolution");
  const anchoredTabelog = tabelogDiscoveryPack.buildQuery(query);
  assert.equal(anchoredTabelog.url, "https://tabelog.com/en/tokyo/A1301/A130101/rstLst/", "the typed Higashi-Ginza anchor may select the observed Ginza source partition");
  assert.equal(anchoredTabelog.areaEntrance, "SOURCE_OBSERVED");
  const neutralTabelog = tabelogDiscoveryPack.buildQuery({ ...query, location: { ...query.location, latitude: 35.72, longitude: 139.72, label: "Unobserved locality" } });
  assert.equal(neutralTabelog.url, "https://tabelog.com/en/tokyo/rstLst/", "an ungrounded location begins at the neutral directory instead of borrowing a nearby source partition");
  assert.equal(neutralTabelog.areaEntrance, "OBSERVE_SOURCE_REGION");
  const tableCheck = new URL(tableCheckDiscoveryPack.buildQuery({ ...query, keyword: "omakase" }).url);
  assert.equal(tableCheck.searchParams.get("search_text"), "omakase");
  assert.equal(tableCheck.searchParams.get("geo_distance"), "3km");
  const noHardTabelog = new URL(tabelogDiscoveryPack.buildQuery(query).url);
  const noHardTableCheck = new URL(tableCheckDiscoveryPack.buildQuery(query).url);
  assert.equal(noHardTabelog.searchParams.has("sw"), false, "a structured category does not become a Tabelog text expression");
  assert.equal(noHardTableCheck.searchParams.has("search_text"), false, "a structured category does not become a TableCheck text expression");
  const tableCheckDocumentRule = tableCheckDiscoveryPack.reviewedReads.find(rule => rule.origin === "https://www.tablecheck.com" && rule.pathname === "/en/japan/search");
  assert.deepEqual(tableCheckDocumentRule?.resourceTypes, ["document"], "the Pack carries its public search-document grammar into guarded recording");
  assert.deepEqual(tableCheckDocumentRule?.queryKeyRules?.required, ["service_mode", "sort_by", "venue_type", "geo_latitude", "geo_longitude", "geo_distance", "auto_geolocate"]);
  assert.deepEqual(tableCheckDocumentRule?.queryKeyRules?.allowed, ["search_text"]);
  const googleNearby = googlePlacesDiscoveryPack.buildQuery(query);
  assert.equal(googleNearby.retrievalExpression, "restaurant");
  assert.equal(googleNearby.mode, "NEARBY");
  assert.equal(googlePlacesDiscoveryPack.buildQuery({ ...query, keyword: "omakase" }).retrievalExpression, "omakase Higashi-Ginza");
});

test("TableCheck request URL construction is consumed through its source pack", () => {
  const buildRequestUrl = tableCheckDiscoveryPack.availability?.buildRequestUrl;
  assert.ok(buildRequestUrl);
  const candidate = { id: "tablecheck:fixture", outletName: "Fixture", address: "Tokyo", sourceIds: {} } as import("../../domains/restaurant/contracts.js").RestaurantOutlet;
  const request = { date: "2026-10-08", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" } } as import("../../domains/restaurant/contracts.js").RestaurantAvailabilityRequest;
  const url = new URL(buildRequestUrl({ candidate, request, target: { kind: "EMBEDDED_AVAILABILITY", url: "https://www.tablecheck.com/en/fixture" } })!);
  assert.equal(url.searchParams.get("date"), "2026-10-08");
  assert.equal(url.searchParams.get("num_people"), "2");
  assert.equal(url.searchParams.get("time"), "19:00");
  assert.equal(tabelogDiscoveryPack.availability?.buildRequestUrl({ candidate, request }), "https://tabelog.com/en/tokyo/rstLst/?sw=Fixture");
});

test("directory retrieval URL grammar stays inside its pack", () => {
  const directory = tabelogDiscoveryPack.browser?.directory;
  assert.ok(directory);
  const initial = "https://tabelog.com/en/tokyo/rstLst/";
  const queried = directory.withRetrievalExpression(initial, "omakase");
  assert.equal(directory.retrievalExpression(queried), "omakase");
  assert.equal(directory.retrievalExpression(directory.withoutRetrievalExpression(queried)), undefined);
  assert.equal(directory.isExplicitEmpty({ url: initial, title: "", text: "No restaurants found", html: "" }), true);
});

test("both browser source packs parse their own current listing entrances before the shared cursor schedules details", () => {
  const tabelog = { url: "https://tabelog.com/en/tokyo/rstLst/", title: "Directory", text: "Restaurants", html: '<a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/100/" data-address="Shibuya">Source directory outlet</a><a rel="next" href="/en/tokyo/rstLst/2/">Next</a>' };
  const tablecheck = { url: "https://www.tablecheck.com/en/japan/search", title: "Search", text: "Venues", html: '<a href="/en/fixture-outlet">Source venue</a>' };
  const directoryListing = tabelogDiscoveryPack.parseListing(tabelog);
  const venueListing = tableCheckDiscoveryPack.parseListing(tablecheck);
  assert.deepEqual(directoryListing.outlets.map((outlet) => outlet.sourceEntityId), ["tokyo/A1304/A130401/100"]);
  assert.equal(directoryListing.nextPage, "https://tabelog.com/en/tokyo/rstLst/2/", "pagination remains source-pack data");
  assert.deepEqual(venueListing.outlets.map((outlet) => outlet.sourceEntityId), ["fixture-outlet"]);
  assert.equal(tabelogDiscoveryPack.browser?.countRawLinks(tabelog), 1);
  assert.equal(tableCheckDiscoveryPack.browser?.countRawLinks(tablecheck), 1);
});


test("Tabelog uses the typed Higashi-ginza anchor only for the observed Ginza source partition", () => {
  const namedAnchor = tabelogDiscoveryPack.buildQuery({
    category: "restaurant", keyword: "", location: { latitude: 35.6697003, longitude: 139.7671399, radiusMeters: 1_000, label: "Higashi-ginza Sta.", areaMatchBasis: "NAMED_PLACE_RADIUS" },
  });
  assert.equal(namedAnchor.url, "https://tabelog.com/en/tokyo/A1301/A130101/rstLst/");
  const nearbyAnchor = tabelogDiscoveryPack.buildQuery({
    category: "restaurant", keyword: "", location: { latitude: 35.6697, longitude: 139.767, radiusMeters: 3_000, label: "Higashi-Ginza evaluation location", areaMatchBasis: "EVALUATION_LOCATION_RADIUS" },
  });
  assert.equal(nearbyAnchor.url, namedAnchor.url, "the independently supplied nearby center remains its original 3km request");
  const unrelated = tabelogDiscoveryPack.buildQuery({
    category: "restaurant", keyword: "", location: { latitude: 35.658, longitude: 139.7016, radiusMeters: 1_000, label: "Higashi-ginza Sta.", areaMatchBasis: "NAMED_PLACE_RADIUS" },
  });
  assert.equal(unrelated.areaEntrance, "OBSERVE_SOURCE_REGION", "matching display text alone cannot borrow the Ginza source partition");
});

test("Tabelog keeps a source-observed civic Shinjuku City entrance for the typed named-place representation", () => {
  const built = tabelogDiscoveryPack.buildQuery({
    category: "restaurant",
    keyword: "omakase",
    location: { latitude: 35.6938, longitude: 139.7034, radiusMeters: 1_000, label: "Shinjuku City", areaMatchBasis: "NAMED_PLACE_RADIUS" },
  });
  assert.equal(built.url, "https://tabelog.com/en/tokyo/C13104/rstLst/");
  assert.equal(built.areaEntrance, "SOURCE_OBSERVED");
  const establishment = tabelogDiscoveryPack.buildQuery({
    category: "restaurant",
    keyword: "omakase",
    location: { latitude: 35.6938, longitude: 139.7034, radiusMeters: 1_000, label: "Shinjuku Station", areaMatchBasis: "NAMED_PLACE_RADIUS" },
  });
  assert.equal(establishment.areaEntrance, "OBSERVE_SOURCE_REGION", "a civic pack row does not stand in for a station");
});

test("Tabelog region selection requires an exact source-owned region label and recognizes only local homepage cards", () => {
  const directory = tabelogDiscoveryPack.browser?.directory;
  assert.ok(directory);
  const nationalMention = {
    url: "https://tabelog.com/en/tokyo/rstLst/",
    title: "Tokyo", text: "All restaurants mentioning Shibuya", html: '<a href="/en/rstLst/">All restaurants in Shibuya</a>',
  };
  assert.equal(directory.observedRegion(nationalMention, "Shibuya"), undefined, "a national anchor mentioning an area cannot re-ground the source query");
  const exactRegion = {
    url: "https://tabelog.com/en/tokyo/rstLst/",
    title: "Tokyo", text: "Shibuya", html: '<a href="/en/rstLst/">All restaurants in Shibuya</a><a href="/en/tokyo/A1303/A130301/rstLst/">Shibuya</a>',
  };
  assert.equal(directory.observedRegion(exactRegion, "Shibuya"), "https://tabelog.com/en/tokyo/A1303/A130301/rstLst/");
  const homepage = "https://tabelog.com/en/tokyo/A1303/A130301/";
  assert.equal(directory.isObservedRegionHomepageListing?.({ url: homepage, title: "Shibuya", text: "", html: '<a class="list-rst__rst-name-target" href="/tokyo/A1303/A130301/100/">Local outlet</a>' }, "https://tabelog.com/en/tokyo/A1303/A130301/rstLst/"), true);
  assert.equal(directory.isObservedRegionHomepageListing?.({ url: homepage, title: "Shibuya", text: "", html: '<a href="/en/rstLst/">National directory</a>' }, "https://tabelog.com/en/tokyo/A1303/A130301/rstLst/"), false);
});
