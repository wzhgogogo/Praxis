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
  assert.equal(tabelogDiscoveryPack.buildQuery({ ...query, location: { ...query.location, label: "Shibuya", areaMatchBasis: "TASK_LOCATION_RADIUS" } }).url, "https://tabelog.com/en/tokyo/A1303/A130301/rstLst/", "an exact observed task-location route is pack data");
  assert.equal(tabelogDiscoveryPack.buildQuery({ ...query, location: { ...query.location, label: "Shibuya", areaMatchBasis: "NAMED_PLACE_RADIUS" } }).url, "https://tabelog.com/en/tokyo/A1303/A130301/rstLst/", "the observed named-place route remains valid after coordinate resolution");
  assert.equal(tabelogDiscoveryPack.buildQuery(query).url, "https://tabelog.com/en/tokyo/rstLst/", "a named or unverified locality begins at the neutral directory and refines through an observed source entrance");
  const tableCheck = new URL(tableCheckDiscoveryPack.buildQuery({ ...query, keyword: "omakase" }).url);
  assert.equal(tableCheck.searchParams.get("search_text"), "omakase");
  assert.equal(tableCheck.searchParams.get("geo_distance"), "3km");
  const noHardTabelog = new URL(tabelogDiscoveryPack.buildQuery(query).url);
  const noHardTableCheck = new URL(tableCheckDiscoveryPack.buildQuery(query).url);
  assert.equal(noHardTabelog.searchParams.has("sw"), false, "a structured category does not become a Tabelog text expression");
  assert.equal(noHardTableCheck.searchParams.has("search_text"), false, "a structured category does not become a TableCheck text expression");
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
