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
    assert.equal(neutral.url, "https://tabelog.com/en/tokyo/rstLst/");
    assert.equal(neutral.areaEntrance, "OBSERVE_SOURCE_REGION");
  }
  const tableCheck = new URL(tableCheckDiscoveryPack.buildQuery({...query, keyword: "omakase" }).url);
  assert.equal(tableCheck.searchParams.get("search_text"), "omakase");
  assert.equal(tableCheck.searchParams.get("geo_distance"), "3km");
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
  assert.equal(tabelogDiscoveryPack.availability?.buildRequestUrl({ candidate, request }), "https://tabelog.com/en/tokyo/rstLst/?sw=Fixture");
});

test("directory retrieval URL grammar stays inside its pack", () => {
  const directory = tabelogDiscoveryPack.browser?.directory;
  assert.ok(directory);
  const initial = "https://tabelog.com/en/tokyo/rstLst/";
  const queried = directory.withRetrievalExpression(initial, "omakase");
  assert.equal(tabelogDiscoveryPack.browser!.retrievalExpression(queried), "omakase");
  assert.equal(tabelogDiscoveryPack.browser!.retrievalExpression(directory.withoutRetrievalExpression(queried)), undefined);
  assert.equal(tabelogDiscoveryPack.browser!.isExplicitEmptyListing({ url: initial, title: "", text: "No restaurants found", html: "" }), true);
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


test("Tabelog region selection requires an exact source-owned region label and recognizes only local homepage cards", () => {
  const directory = tabelogDiscoveryPack.browser?.directory;
  assert.ok(directory);
  const nationalMention = {
    url: "https://tabelog.com/en/tokyo/rstLst/",
    title: "Tokyo", text: "All restaurants mentioning Shibuya", html: '<a href="/en/rstLst/">All restaurants in Shibuya</a>',
  };
  assert.equal(directory.isRegionEntrance("https://tabelog.com/en/rstLst/"), false, "a national anchor mentioning an area cannot re-ground the source query");
  const exactRegion = {
    url: "https://tabelog.com/en/tokyo/rstLst/",
    title: "Tokyo", text: "Shibuya", html: '<a href="/en/rstLst/">All restaurants in Shibuya</a><a href="/en/tokyo/A1303/A130301/rstLst/">Shibuya</a>',
  };
  assert.equal(directory.isRegionEntrance("https://tabelog.com/en/tokyo/A1303/A130301/rstLst/"), true);
  const homepage = "https://tabelog.com/en/tokyo/A1303/A130301/";
  assert.equal(directory.isObservedRegionHomepageListing?.({ url: homepage, title: "Shibuya", text: "", html: '<a class="list-rst__rst-name-target" href="/tokyo/A1303/A130301/100/">Local outlet</a>' }, "https://tabelog.com/en/tokyo/A1303/A130301/rstLst/"), true);
  assert.equal(directory.isObservedRegionHomepageListing?.({ url: homepage, title: "Shibuya", text: "", html: '<a href="/en/rstLst/">National directory</a>' }, "https://tabelog.com/en/tokyo/A1303/A130301/rstLst/"), false);
});

test('search availability URL values overwrite source links with the authoritative request, without creating stock',()=>{
 const binding={date:'2026-10-27',time:'19:00',partySize:2};
 const capability=tabelogDiscoveryPack.browser!.searchAvailability!;assert.ok('withRequest' in capability);
 const filtered=new URL(capability.withRequest('https://tabelog.com/en/tokyo/A1303/rstLst/?svd=19990101&svps=99&svt=1000',binding)!);
 assert.equal(filtered.searchParams.get('svd'),'20261027');assert.equal(filtered.searchParams.get('svt'),'1900');assert.equal(filtered.searchParams.get('svps'),'2');
 assert.deepEqual(capability.observe({url:filtered.toString(),title:'Unbound result',text:'2026-10-27 19:00 2 guests',html:'<p>2026-10-27 19:00 2 guests</p>'},[]),{},'URL/prose co-occurrence cannot confirm selected query');
 assert.equal(capability.withRequest('https://tabelog.com/en/tokyo/A1303/rstLst/',{...binding,time:'19:15'}),undefined);
});

test('the ten-field homepage search cannot express the legacy dated listing prefilter',()=>{
 const capability=tabelogDiscoveryPack.browser!.searchAvailability!;assert.ok('withRequest' in capability);
 const observed='https://tabelog.com/en/rstLst/?utf8=%E2%9C%93&pal=tokyo&LstPrf=A1323&LstAre=A132305&station_id=134&area_datatype=RailroadStation&area_id=134&genre_name=&sw=kushikatsu&search_mode=';
 assert.equal(capability.withRequest(observed,{date:'2026-11-11',time:'19:00',partySize:2},observed),undefined,
  'Unsupported optional prefilter must fall back to existing detail checks, not manufacture an unreviewed fourteen-field GET');
});

test('search filters restore only the already observed same-region listing root from a homepage',()=>{
 const capability=tabelogDiscoveryPack.browser!.searchAvailability!;assert.ok('withRequest' in capability);
 const binding={date:'2026-10-27',time:'19:00',partySize:2};
 const homepage='https://tabelog.com/en/tokyo/A1303/?sw=omakase';
 const observed='https://tabelog.com/en/tokyo/A1303/rstLst/';
 const filtered=capability.withRequest(homepage,binding,observed);
 assert.equal(filtered,'https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase&vac_net=1&svd=20261027&svt=1900&svps=2');
 assert.equal(capability.withRequest(homepage,binding),undefined,'a guessed root is not an observation');
 assert.equal(capability.withRequest(homepage,binding,'https://tabelog.com/en/tokyo/A1301/rstLst/'),undefined,'a different region cannot supply the root');
});

test('unsupported TableCheck search filters are explicitly disabled without broadening transport reads',()=>{
 assert.deepEqual(tableCheckDiscoveryPack.browser!.searchAvailability,{disabledReason:'FILTER_TRANSPORT_NOT_REVIEWED'});
 const search=tableCheckDiscoveryPack.reviewedReads.find(rule=>rule.pathname==='/search/');
 assert.equal(search?.queryKeyRules?.allowed?.includes('open_from'),false);
 assert.equal(search?.queryKeyRules?.allowed?.includes('open_until'),false);
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


test("observed regional homepage exposes only its own category listing links", () => {
  const html = readFileSync(new URL('../tabelog/fixtures/p21-region-homepage-categories.html', import.meta.url), 'utf8');
  const directory = tabelogDiscoveryPack.browser!.directory!;
  const homepage = 'https://tabelog.com/en/tokyo/A1303/';
  const foreign = 'https://tabelog.com/en/tokyo/A1301/rstLst/sushi/';
  for (const url of [homepage, homepage + '?sw=omakase']) {
    const links = directory.links({url, html: html + `<a href="${foreign}">Foreign category</a>`, title:'Region',text:'Region'}).filter(link => link.category);
    assert.ok(links.length > 0, 'real A1 homepage category fragment must be exposed');
    assert.ok(links.every(link => directory.listingRoot(link.url) === '/en/tokyo/A1303/rstLst/'));
    assert.equal(links.some(link => link.url === foreign), false);
  }
  assert.equal(directory.links({url:'https://tabelog.com/en/',html,title:'National',text:''}).length,0);
});
