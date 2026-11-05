import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { normalizeTabelogOutletUrl, candidateAvailabilityPath, discoveryPackById, googlePlacesDiscoveryPack, tableCheckDiscoveryPack, tabelogDiscoveryPack } from "./source-packs.js";

const query = { positiveCriteria:[], category: "restaurant", location: { latitude: 35.6697, longitude: 139.767, radiusMeters: 3_000, label: "Higashi-Ginza", areaMatchBasis: "EVALUATION_LOCATION_RADIUS" as const } };

test("Tabelog Pack normalizes only a supported outlet URL to the same numeric ID in English", () => {
  assert.equal(normalizeTabelogOutletUrl("https://tabelog.com/tokyo/A1303/A130301/13293469/?utm_source=google#menu"), "https://tabelog.com/en/tokyo/A1303/A130301/13293469/");
  assert.equal(normalizeTabelogOutletUrl("https://tabelog.com/en/tokyo/A1303/A130301/13293469/menu/"), "https://tabelog.com/en/tokyo/A1303/A130301/13293469/");
  assert.equal(normalizeTabelogOutletUrl("https://tabelog.com/en/tokyo/rstLst/"), undefined);
  assert.equal(normalizeTabelogOutletUrl("https://yoyaku.tabelog.com/reserve/13293469"), undefined);
  const page = { url: "https://tabelog.com/", title: "", text: "現在アクセスが集中し、ページが表示されにくい状態となっています。", html: "" };
  assert.equal(tabelogDiscoveryPack.availability!.sourceBusy!.matches(page), true);
  assert.equal(tabelogDiscoveryPack.availability!.sourceBusy!.matches({ ...page, text: "A busy sushi restaurant" }), false);
});

test("availability paths distinguish observed outlet entrances from source lists and unsupported booking hosts", () => {
  for (const [website, expected] of [
    ["https://tabelog.com/tokyo/A1303/A130301/13261619/?utm_source=google", "DIRECT_SOURCE_PAGE"],
    ["https://tabelog.com/en/tokyo/A1303/A130301/13261619/menu/", "DIRECT_SOURCE_PAGE"],
    ["https://www.tablecheck.com/en/venue-one", "DIRECT_SOURCE_PAGE"],
    ["https://www.tablecheck.com/en/shops/venue-one/reserve", "DIRECT_SOURCE_PAGE"],
    ["https://tabelog.com/en/tokyo/rstLst/", "NAME_RESOLUTION"],
    ["https://www.tablecheck.com/en/japan/search", "NAME_RESOLUTION"],
    ["https://yoyaku.tabelog.com/reserve/abc", "NAME_RESOLUTION"],
    ["https://restaurant.example/", "NAME_RESOLUTION"],
  ] as const) {
    const outlet = { id: "observed", outletName: "Observed", address: "Tokyo", sourceIds: { googleWebsiteUri: website }, provenance: { outletName: "fixture", address: "fixture", sourceIds: "fixture" } };
    assert.equal(candidateAvailabilityPath(outlet), expected, website);
    assert.equal(candidateAvailabilityPath(outlet, [googlePlacesDiscoveryPack]), "NONE", "an explicit registry without availability cannot grant a path");
  }
});

test("real source packs own URLs, reviewed reads, skills, and opaque source IDs", () => {
  assert.equal(discoveryPackById("tabelog"), tabelogDiscoveryPack);
  assert.equal(discoveryPackById("tablecheck"), tableCheckDiscoveryPack);
  assert.equal(discoveryPackById("google-places"), googlePlacesDiscoveryPack);
  assert.ok(tabelogDiscoveryPack.availability?.ground, "Tabelog grounding remains pack-owned");
  assert.ok(tableCheckDiscoveryPack.availability?.ground, "TableCheck grounding remains pack-owned");
  for (const label of ["Shibuya", "Shinjuku City", "Higashi-Ginza", "Ebisu"]) {
    const neutral = tabelogDiscoveryPack.buildQuery({...query, location: { ...query.location, label, areaMatchBasis: "NAMED_PLACE_RADIUS" } });
    assert.equal(neutral.url, "https://tabelog.com/en/");
    assert.equal(neutral.areaEntrance, "OBSERVE_SOURCE_REGION");
  }
  const tableCheck = new URL(tableCheckDiscoveryPack.buildQuery({...query, keyword: "omakase" }).url);
  assert.equal(tableCheck.toString(), "https://www.tablecheck.com/en/japan/search");
  assert.equal(tableCheck.search, "", "source controls, rather than code, construct search parameters");
  const noHardTabelog = new URL(tabelogDiscoveryPack.buildQuery(query).url);
  const noHardTableCheck = new URL(tableCheckDiscoveryPack.buildQuery(query).url);
  assert.equal(noHardTabelog.searchParams.has("sw"), false, "a structured category does not become a Tabelog text expression");
  assert.equal(noHardTableCheck.searchParams.has("search_text"), false, "a structured category does not become a TableCheck text expression");
  const tableCheckDocumentRule = tableCheckDiscoveryPack.reviewedReads.find(rule => rule.origin === "https://www.tablecheck.com" && rule.pathname === "/en/japan/search");
  assert.deepEqual(tableCheckDocumentRule?.resourceTypes, ["document"], "the Pack carries its public search-document grammar into guarded recording");
  assert.deepEqual(tableCheckDocumentRule?.queryKeyRules?.required, ["service_mode", "sort_by", "venue_type", "geo_latitude", "geo_longitude", "geo_distance", "auto_geolocate"]);
  assert.deepEqual(tableCheckDocumentRule?.queryKeyRules?.allowed, ["search_text", "date", "time", "num_people", "availability_mode"]);
  const googleNearby = googlePlacesDiscoveryPack.buildQuery(query);
  assert.equal(googleNearby.retrievalExpression, "restaurant");
  assert.equal(googleNearby.mode, "NEARBY");
  assert.equal(googlePlacesDiscoveryPack.buildQuery({...query, keyword: "omakase" }).retrievalExpression, "omakase Higashi-Ginza");
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
  assert.equal(tabelogDiscoveryPack.availability?.buildRequestUrl, undefined, "no Tabelog search URL constructor remains");
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


test("C8 list categories stay source-attributed to one outlet, without borrowing neighbouring or hidden text", () => {
  const directory = tabelogDiscoveryPack.parseListing({ url: "https://tabelog.com/en/tokyo/rstLst/", title: "List", text: "List", html: `
    <li class="list-rst"><a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/100/?ref=list">A</a><span class="list-rst__genre">Sushi</span></li>
    <li class="list-rst"><a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/101/">B</a><span class="list-rst__genre">Italian</span><span class="category" hidden>Fast food</span></li>` });
  assert.deepEqual(directory.outlets.map(outlet => outlet.sourceCategories), [["Sushi"], ["Italian"]]);
  const venues = tableCheckDiscoveryPack.parseListing({ url: "https://www.tablecheck.com/en/japan/search", title: "Search", text: "2 venues found", html: `
    <article><a href="/en/outlet-one">One</a><span class="VisibleCuisineText">Japanese, Seafood</span></article>
    <article><a href="/en/outlet-two">Two</a><span class="VisibleCuisineText">French</span></article>` });
  assert.deepEqual(venues.outlets.map(outlet => outlet.sourceCategories), [["Japanese, Seafood"], ["French"]]);
});
