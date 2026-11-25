import assert from "node:assert/strict";
import { test } from "node:test";
import { materializeRestaurantTemporalFacts } from "./temporal-materialization.js";

import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import { groundGoogleDiscovery, groundTabelogAvailability, openingHoursForRequest } from "./read-grounding.js";

const candidate = fixtureCandidates[0]!;
const request = {
  candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date,
  timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, hardCriteria: ["yakiniku"],
};
const now = "2026-08-05T09:00:00.000Z";

test("materialized AFTER_WORK broad window grounds the actual supported source-hours subset", () => {
  const request = materializeRestaurantTemporalFacts({
    date: { kind: "DATE", value: "2026-11-20", raw: "2026-11-20" },
    timeWindow: { kind: "TIME_WINDOW", daypart: "AFTER_WORK", raw: "after work" },
    referenceTime: now, timezone: "Asia/Tokyo",
  });
  assert.deepEqual(request.timeWindow, { earliest: "17:30", latest: "22:00" });
  assert.equal(request.temporalResolution?.timeWindow?.basis, "DAYPART:AFTER_WORK_BROAD_WINDOW");
  assert.deepEqual(openingHoursForRequest(["Friday: 11:00 AM – 8:00 PM"], request.date,
    request.timeWindow, "Asia/Tokyo", request.temporalResolution?.timeWindow?.basis),
    { matches: true, window: ["17:30", "20:00"], noWindow: false });
});

test("Google discovery accepts structurally valid restaurant places without claiming retrieval criteria as facts", () => {
  const result = groundGoogleDiscovery({
    placeId: "google-1", displayName: "Example Omakase", formattedAddress: "Shibuya, Tokyo",
    location: { latitude: 35.66, longitude: 139.7 }, types: ["restaurant", "food"],
  }, { timezone: fixtureIntent.timezone, requestFingerprint: "request", observedAt: now, areaQuery: "Shibuya" });
  assert.equal(result.accepted, true);
  if (!result.accepted) return;
  assert.equal(result.candidate.restaurant.id.startsWith("praxis:restaurant:"), true);
  assert.equal(result.candidate.matchReasons.includes("omakase"), false);
  assert.equal(result.evidence.provider, "GOOGLE_PLACES");
});

test("Google discovery grounds near Shibuya through an explicit address component, not text query relevance", () => {
  const result = groundGoogleDiscovery({
    placeId: "google-shibuya", displayName: "Example Omakase", formattedAddress: "5-11 Maruyamacho, Shibuya, Tokyo, Japan",
    addressComponents: [
      { longText: "Tokyo", types: ["administrative_area_level_1", "political"] },
      { longText: "Shibuya", types: ["sublocality_level_1", "sublocality", "political"] },
    ],
    types: ["restaurant", "food"],
  }, { timezone: fixtureIntent.timezone, requestFingerprint: "request", observedAt: now, areaQuery: "near Shibuya" });
  assert.equal(result.accepted, true);
  if (!result.accepted) return;
  assert.deepEqual(result.evidence.claims, {
    placeId: "google-shibuya",
    outletName: "Example Omakase",
    address: "5-11 Maruyamacho, Shibuya, Tokyo, Japan",
    types: ["restaurant", "food"],
    areaQuery: "near Shibuya",
    areaMatch: true,
    areaMatchBasis: "GOOGLE_ADDRESS_COMPONENT",
    matchedAddressComponent: "Shibuya",
    matchedAddressComponentTypes: ["sublocality_level_1", "sublocality", "political"],
  });
  assert.deepEqual(result.candidate.matchReasons, ["Address explicitly matches requested area: near Shibuya"]);
});

test("Google discovery does not turn a formatted-address keyword into area evidence when the component is absent", () => {
  const result = groundGoogleDiscovery({
    placeId: "google-keyword", displayName: "Example Omakase", formattedAddress: "5 Shibuya Avenue, Tokyo, Japan",
    addressComponents: [{ longText: "Tokyo", types: ["administrative_area_level_1", "political"] }],
    types: ["restaurant", "food"],
  }, { timezone: fixtureIntent.timezone, requestFingerprint: "request", observedAt: now, areaQuery: "near Shibuya" });
  assert.equal(result.accepted, true);
  if (!result.accepted) return;
  assert.equal(result.evidence.claims.areaMatch, false);
  assert.equal(result.evidence.claims.areaMatchBasis, undefined);
});

test("an explicit evaluation location can establish NEAR_USER by bounded distance without changing text-area rules", () => {
  const result = groundGoogleDiscovery({
    placeId: "nearby-cafe", displayName: "Nearby Cafe", formattedAddress: "Tokyo", location: { latitude: 35.6698, longitude: 139.7671 }, types: ["cafe"],
  }, {
    timezone: fixtureIntent.timezone, requestFingerprint: "request", observedAt: "2026-09-10T00:00:00.000Z", areaQuery: "nearby",
    evaluationLocation: { latitude: 35.6697, longitude: 139.7670, radiusMeters: 3_000, label: "Higashi-Ginza public evaluation point" },
  });
  assert.equal(result.accepted, true);
  if (result.accepted) {
    assert.equal(result.evidence.claims.areaMatch, true);
    assert.equal(result.evidence.claims.areaMatchBasis, "EVALUATION_LOCATION_RADIUS");
  }
});

test("a task-bound device coordinate is distinguished from an eval-only location radius", () => {
  const result = groundGoogleDiscovery({
    placeId: "device-nearby", displayName: "Device Nearby", formattedAddress: "Tokyo", location: { latitude: 35.6698, longitude: 139.7671 }, types: ["cafe"],
  }, {
    timezone: fixtureIntent.timezone, requestFingerprint: "request", observedAt: now, areaQuery: "nearby",
    evaluationLocation: { latitude: 35.6697, longitude: 139.7670, radiusMeters: 3_000, label: "nearby", areaMatchBasis: "TASK_LOCATION_RADIUS" },
  });
  assert.equal(result.accepted, true);
  if (result.accepted) assert.equal(result.evidence.claims.areaMatchBasis, "TASK_LOCATION_RADIUS");
});

test("coordinate-backed nearby discovery fails closed for out-of-radius and coordinate-less candidates", () => {
  const context = { timezone: fixtureIntent.timezone, requestFingerprint: "request", observedAt: now, areaQuery: "nearby", evaluationLocation: { latitude: 35.6697, longitude: 139.767, radiusMeters: 3_000, label: "evaluation" } };
  const outside = groundGoogleDiscovery({
    placeId: "outside", displayName: "Outside", formattedAddress: "Tokyo", location: { latitude: 35.9, longitude: 139.7 }, types: ["restaurant"],
  }, context);
  assert.deepEqual(outside, { accepted: false, reasonCode: "GOOGLE_OUTSIDE_REQUESTED_RADIUS" });
  const missing = groundGoogleDiscovery({
    placeId: "missing", displayName: "Missing", formattedAddress: "Tokyo", types: ["restaurant"],
  }, context);
  assert.deepEqual(missing, { accepted: false, reasonCode: "GOOGLE_LOCATION_REQUIRED_FOR_RADIUS" });
});

test("Google cafe facts require a matching source opening-hours interval for a fact-only afternoon recommendation", () => {
  const result = groundGoogleDiscovery({
    placeId: "cafe-hours", displayName: "Afternoon Cafe", formattedAddress: "Tokyo",
    location: { latitude: 35.6698, longitude: 139.7671 }, types: ["cafe", "food"],
    regularOpeningHours: ["Monday: 10:00 AM – 6:00 PM", "Tuesday: Closed"],
  }, {
    timezone: fixtureIntent.timezone, requestFingerprint: "request", observedAt: now, areaQuery: "nearby", requiredTypeCriteria: ["cafe"],
    requestedDate: "2026-08-03", requestedTimeWindow: { earliest: "12:00", latest: "17:00" },
    evaluationLocation: { latitude: 35.6697, longitude: 139.7670, radiusMeters: 3_000, label: "Higashi-Ginza public evaluation point" },
  });
  assert.equal(result.accepted, true);
  if (!result.accepted) return;
  const facts = result.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT");
  assert.deepEqual(facts?.claims.verifiedHardCriteria, ["cafe"]);
  assert.equal(facts?.claims.openingHoursMatch, true);
  assert.deepEqual(facts?.claims.openingHoursMatchedWindow, ["12:00", "17:00"]);
});

test("opening-hours grounding preserves minutes, rejects the closing boundary, and does not fuse split hours", () => {
  const base = {
    placeId: "hours", displayName: "Hours Cafe", formattedAddress: "Tokyo", types: ["cafe"],
    regularOpeningHours: ["Friday: 09:30 AM - 12:00 PM, 1:00 PM - 9:00 PM"],
  };
  const input = (requestedTimeWindow: { earliest: string; latest: string }) => ({ timezone: fixtureIntent.timezone, requestFingerprint: "hours", observedAt: now, areaQuery: "Tokyo", requestedDate: "2026-08-07", requestedTimeWindow });
  const minutesPreserved = groundGoogleDiscovery(base, input({ earliest: "09:15", latest: "09:29" }));
  const closingBoundary = groundGoogleDiscovery(base, input({ earliest: "21:00", latest: "21:00" }));
  const splitGap = groundGoogleDiscovery(base, input({ earliest: "11:30", latest: "13:30" }));
  assert.equal(minutesPreserved.accepted, true);
  assert.equal(closingBoundary.accepted, true);
  assert.equal(splitGap.accepted, true);
  if (!minutesPreserved.accepted || !closingBoundary.accepted || !splitGap.accepted) return;
  assert.equal(minutesPreserved.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT")?.claims.openingHoursMatch, false);
  assert.equal(closingBoundary.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT")?.claims.openingHoursMatch, false);
  assert.equal(splitGap.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT")?.claims.openingHoursMatch, false);
});

test("Google primary-type facts report explicit exclusion conflicts but never infer a negative-condition pass", () => {
  const accepted = groundGoogleDiscovery({
    placeId: "place-japanese", displayName: "Japanese Dining", formattedAddress: "Higashi-Ginza, Tokyo",
    addressComponents: [{ longText: "Higashi-Ginza", types: ["sublocality_level_1"] }], types: ["restaurant"], primaryType: "japanese_restaurant",
  }, { timezone: fixtureIntent.timezone, requestFingerprint: "request", observedAt: now, areaQuery: "near Higashi-Ginza", negativeCriteria: ["hot pot restaurant", "Sichuan/Hunan cuisine"] });
  assert.equal(accepted.accepted, true);
  if (!accepted.accepted) return;
  const facts = accepted.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT");
  assert.equal(facts?.claims.verifiedNegativeCriteria, undefined);
  const conflict = groundGoogleDiscovery({
    placeId: "place-sichuan", displayName: "Sichuan Dining", formattedAddress: "Higashi-Ginza, Tokyo",
    addressComponents: [{ longText: "Higashi-Ginza", types: ["sublocality_level_1"] }], types: ["restaurant"], primaryType: "sichuan_restaurant",
  }, { timezone: fixtureIntent.timezone, requestFingerprint: "request", observedAt: now, areaQuery: "near Higashi-Ginza", negativeCriteria: ["Sichuan/Hunan cuisine"] });
  assert.equal(conflict.accepted, true);
  if (!conflict.accepted) return;
  assert.deepEqual(conflict.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT")?.claims.violatedNegativeCriteria, ["Sichuan/Hunan cuisine"]);
  const unknown = groundGoogleDiscovery({
    placeId: "place-generic", displayName: "Restaurant", formattedAddress: "Higashi-Ginza, Tokyo",
    addressComponents: [{ longText: "Higashi-Ginza", types: ["sublocality_level_1"] }], types: ["restaurant"], primaryType: "restaurant",
  }, { timezone: fixtureIntent.timezone, requestFingerprint: "request", observedAt: now, areaQuery: "near Higashi-Ginza", negativeCriteria: ["hot pot restaurant"] });
  assert.equal(unknown.accepted, true);
  if (!unknown.accepted) return;
  assert.equal(unknown.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT")?.claims.verifiedNegativeCriteria, undefined);
  const broad = groundGoogleDiscovery({
    placeId: "place-chinese", displayName: "Chinese Dining", formattedAddress: "Higashi-Ginza, Tokyo",
    addressComponents: [{ longText: "Higashi-Ginza", types: ["sublocality_level_1"] }], types: ["restaurant"], primaryType: "chinese_restaurant",
  }, { timezone: fixtureIntent.timezone, requestFingerprint: "request", observedAt: now, areaQuery: "near Higashi-Ginza", negativeCriteria: ["Sichuan/Hunan cuisine"] });
  assert.equal(broad.accepted, true);
  if (broad.accepted) assert.equal(broad.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT")?.claims.verifiedNegativeCriteria, undefined);
  const nonPrimary = groundGoogleDiscovery({
    placeId: "place-hotpot", displayName: "Observed Restaurant", formattedAddress: "Higashi-Ginza, Tokyo",
    addressComponents: [{ longText: "Higashi-Ginza", types: ["sublocality_level_1"] }],
    types: ["restaurant", "hot_pot_restaurant"], primaryType: "japanese_restaurant",
  }, { timezone: fixtureIntent.timezone, requestFingerprint: "request", observedAt: now, areaQuery: "near Higashi-Ginza", negativeCriteria: ["hot pot restaurant"] });
  assert.equal(nonPrimary.accepted, true);
  if (nonPrimary.accepted) {
    const claims = nonPrimary.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT")?.claims;
    assert.deepEqual(claims?.violatedNegativeCriteria, ["hot pot restaurant"]);
    assert.deepEqual(claims?.negativeCriterionJudgments, ["hot pot restaurant<=types:hot pot restaurant"]);
  }
  const liveWording = groundGoogleDiscovery({
    placeId: "place-hotpot-plural", displayName: "Observed Restaurant", formattedAddress: "Higashi-Ginza, Tokyo",
    addressComponents: [{ longText: "Higashi-Ginza", types: ["sublocality_level_1"] }],
    types: ["hot_pot_restaurant", "japanese_restaurant", "restaurant"], primaryType: "japanese_restaurant",
  }, { timezone: fixtureIntent.timezone, requestFingerprint: "request", observedAt: now, areaQuery: "near Higashi-Ginza", negativeCriteria: ["hot-pot restaurants"] });
  assert.equal(liveWording.accepted, true);
  if (liveWording.accepted) assert.deepEqual(liveWording.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT")?.claims.violatedNegativeCriteria, ["hot-pot restaurants"]);
});


test("availability grounding accepts only high-confidence matching outlet, schedule and visible slot", () => {
  const result = groundTabelogAvailability(candidate, request, {
    candidateId: candidate.restaurant.id, sourceEntityId: "A1301/x", sourceUrl: "https://tabelog.com/tokyo/A1301/x/",
    observedAt: now, requestedDate: fixtureIntent.date, requestedPartySize: 2,
    entityMatch: { confidence: "HIGH", matchedBy: ["NORMALIZED_NAME_AND_ADDRESS"] },
    pageState: "AVAILABLE", visibleSlots: ["18:00", "19:00"],
  }, now);
  assert.equal(result.check.status, "AVAILABLE");
  assert.equal(result.offers.length, 1);
  assert.equal(result.offers[0]?.dateTime, "2026-08-05T19:00:00+09:00");
  assert.equal(result.evidence.length, 2);
  assert.deepEqual(result.evidence.map((item) => item.kind), ["ENTITY_MATCH", "AVAILABILITY"]);
});

test("ambiguous, stale, wrong request, browser failure and unsupported observations never become unavailable", () => {
  const base = {
    candidateId: candidate.restaurant.id, observedAt: now, requestedDate: fixtureIntent.date, requestedPartySize: 2,
    entityMatch: { confidence: "HIGH" as const, matchedBy: ["NORMALIZED_NAME_AND_ADDRESS"] }, pageState: "AVAILABLE" as const,
    visibleSlots: ["19:00"],
  };
  const ambiguous = groundTabelogAvailability(candidate, request, { ...base, entityMatch: { confidence: "MEDIUM", matchedBy: ["NORMALIZED_NAME"] } }, now);
  const wrongParty = groundTabelogAvailability(candidate, request, { ...base, requestedPartySize: 3 }, now);
  const stale = groundTabelogAvailability(candidate, request, { ...base, observedAt: "2026-08-05T08:00:00.000Z" }, now);
  const challenge = groundTabelogAvailability(candidate, request, { ...base, pageState: "BOT_CHALLENGE", visibleSlots: [] }, now);
  const unsupported = groundTabelogAvailability(candidate, request, { ...base, pageState: "SOURCE_UNSUPPORTED", visibleSlots: [] }, now);
  assert.deepEqual([ambiguous, wrongParty, stale, challenge].map((result) => result.check.status), ["UNKNOWN", "UNKNOWN", "UNKNOWN", "UNKNOWN"]);
  assert.equal(unsupported.check.status, "SOURCE_UNSUPPORTED");
  assert.equal([ambiguous, wrongParty, stale, challenge, unsupported].every((result) => result.offers.length === 0), true);
});

for (const failureCode of ["BROWSER_RUNTIME_FAILED", "BROWSER_TIMEOUT", "BROWSER_BUDGET_EXHAUSTED"]) test(`browser failure ${failureCode} is preserved before identity`, () => {
  const result = groundTabelogAvailability(candidate, request, {
    candidateId: candidate.restaurant.id,
    observedAt: now,
    entityMatch: { confidence: "LOW", matchedBy: [] },
    pageState: "EXTRACTION_FAILED",
    failureCode,
  }, now);
  assert.equal(result.check.status, "UNKNOWN");
  assert.equal(result.check.reasonCode, failureCode);
  assert.equal(result.offers.length, 0);
});

test("a completed slot extraction with no qualifying slot becomes UNAVAILABLE", () => {
  const result = groundTabelogAvailability(candidate, request, {
    candidateId: candidate.restaurant.id, observedAt: now, requestedDate: fixtureIntent.date, requestedPartySize: 2,
    entityMatch: { confidence: "HIGH", matchedBy: ["NORMALIZED_NAME_AND_ADDRESS"] },
    pageState: "NO_MATCHING_SLOT", visibleSlots: ["18:00"],
  }, now);
  assert.equal(result.check.status, "UNAVAILABLE");
  assert.equal(result.check.receptionMode, "RESERVATION_SUPPORTED");
  const inventory = result.evidence.find((evidence) => evidence.kind === "AVAILABILITY");
  assert.deepEqual(inventory?.claims.inventoryStatus, "UNAVAILABLE");
  assert.deepEqual(inventory?.claims.receptionMode, "RESERVATION_SUPPORTED");
  assert.equal(result.offers.length, 0);
});

test("a no-slot result scoped to one observed service category remains UNKNOWN for the outlet", () => {
  const scope = { field: "reservation[service_category]", group: "form:0|name:reservation[service_category]", value: "sushi", label: "Sushi" };
  const result = groundTabelogAvailability(candidate, request, {
    candidateId: candidate.restaurant.id, observedAt: now, requestedDate: fixtureIntent.date, requestedPartySize: 2,
    entityMatch: { confidence: "HIGH", matchedBy: ["NORMALIZED_NAME_AND_ADDRESS"] },
    pageState: "NO_MATCHING_SLOT", visibleSlots: [], serviceScope: scope,
  }, now);
  assert.equal(result.check.status, "UNKNOWN");
  assert.equal(result.check.reasonCode, "NO_MATCHING_SLOT_SCOPED");
  assert.deepEqual(result.check.serviceScope, scope);
  assert.equal(result.evidence.find((evidence) => evidence.kind === "AVAILABILITY")?.claims.serviceScopeValue, "sushi");
});

test("walk-in reception is admitted only from explicit page evidence and never turns a no-slot result into availability", () => {
  const base = {
    candidateId: candidate.restaurant.id, observedAt: now, requestedDate: fixtureIntent.date, requestedPartySize: 2,
    entityMatch: { confidence: "HIGH" as const, matchedBy: ["NORMALIZED_NAME_AND_ADDRESS"] },
    pageState: "NO_MATCHING_SLOT" as const, visibleSlots: [], receptionMode: "WALK_IN_SUPPORTED" as const,
  };
  const unsupported = groundTabelogAvailability(candidate, request, base, now);
  assert.equal(unsupported.check.status, "UNAVAILABLE");
  assert.equal(unsupported.check.receptionMode, "UNKNOWN");
  const explicit = groundTabelogAvailability(candidate, request, { ...base, walkInEvidence: "Walk-ins are accepted at the counter." }, now);
  assert.equal(explicit.check.status, "UNAVAILABLE");
  assert.equal(explicit.check.receptionMode, "WALK_IN_SUPPORTED");
  assert.equal(explicit.offers.length, 0);
});

test("an unknown slot does not discard independently matched identity and observed restaurant facts", () => {
  // Domain admission test, not a browser/E2E test. Same candidate/fact observation, different slot outcome.
  // The offer must remain absent, while independent source facts stay auditable for recommendation.
  const observation = {
    candidateId: candidate.restaurant.id, sourceEntityId: "outlet-a", sourceUrl: "https://tabelog.com/example",
    observedAt: now, entityMatch: { confidence: "HIGH" as const, matchedBy: ["EXACT_PHONE"] },
    requestedDate: request.date, requestedPartySize: request.partySize, verifiedHardCriteria: ["yakiniku"],
  };
  const available = groundTabelogAvailability(candidate, request, { ...observation, pageState: "AVAILABLE", visibleSlots: [request.timeWindow.earliest] }, now);
  assert.equal(available.check.status, "AVAILABLE", "Control must be a usable observation");
  const unknown = groundTabelogAvailability(candidate, request, { ...observation, pageState: "EXTRACTION_FAILED", failureCode: "EXTRACTION_FAILED" }, now);
  assert.equal(unknown.check.status, "UNKNOWN");
  assert.equal(unknown.offers.length, 0);
  assert.ok(unknown.evidence.some(e => e.kind === "ENTITY_MATCH" && e.entityMatch?.confidence === "HIGH"), "Slot failure erased independently established identity");
  assert.ok(unknown.evidence.some(e => e.kind === "RESTAURANT_FACT" && Array.isArray(e.claims.verifiedHardCriteria) && e.claims.verifiedHardCriteria.includes("yakiniku")), "Slot failure erased an independently observed fact");
  assert.ok(!unknown.evidence.some(e => e.kind === "AVAILABILITY"), "Unknown slot cannot become positive availability evidence");
});


test("opening-hours weekdays use the supplied timezone for the current and previous day", (t) => {
  const formatter = Intl.DateTimeFormat;
  const timezones: Array<string | undefined> = [];
  t.mock.method(Intl, "DateTimeFormat", function (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) {
    timezones.push(options?.timeZone);
    return new formatter(locales, options);
  });
  // The public helper receives a timezone; this does not widen the product's intent contract.
  const result = openingHoursForRequest(
    ["Sunday: 10:00 PM - 2:00 AM", "Monday: Closed"], "2026-08-03",
    { earliest: "01:00", latest: "01:30" }, "UTC",
  );
  assert.deepEqual(timezones, ["UTC", "UTC"]);
  assert.deepEqual(result, { matches: false, noWindow: false });
});

import { groundRestaurantWebsiteFacts } from "./read-grounding.js";
import { applyRestaurantIntentPatch, completeRestaurantIntent, completeRestaurantSearchIntent } from "./intent-state.js";
import type { RestaurantIntentDraft } from "./contracts.js";

const eveningDraft: RestaurantIntentDraft = {
  ...fixtureIntent, schemaVersion: "3", date: "2026-11-20", timeWindow: { earliest: "18:00", latest: "23:00" },
  temporalResolution: { policyVersion: "restaurant-temporal-materialization@6", referenceTime: now, timezone: "Asia/Tokyo",
    timeWindow: { expression: "evening", basis: "DAYPART:EVENING", resolvedTimeWindow: { earliest: "18:00", latest: "23:00" } } },
};

test("party/date patches retain the active DAYPART basis; explicit numeric replacement or clear removes it", () => {
  const party = applyRestaurantIntentPatch(eveningDraft, { schemaVersion: "3", partySize: 7 });
  const date = applyRestaurantIntentPatch(party, { schemaVersion: "3", date: "2026-11-27", temporalResolution: {
    policyVersion: "restaurant-temporal-materialization@6", referenceTime: now, timezone: "Asia/Tokyo",
    date: { expression: "next Friday", basis: "WEEKDAY:FRIDAY", resolvedDate: "2026-11-27" },
  } });
  assert.deepEqual(date.temporalResolution?.timeWindow, eveningDraft.temporalResolution!.timeWindow);
  assert.equal(completeRestaurantSearchIntent(date)?.timeWindowBasis, "DAYPART:EVENING");
  assert.equal(completeRestaurantIntent(date)?.timeWindowBasis, "DAYPART:EVENING");
  for (const timeWindow of [null, { earliest: "18:00", latest: "23:00" }]) {
    assert.equal(applyRestaurantIntentPatch(date, { schemaVersion: "3", timeWindow }).temporalResolution?.timeWindow, undefined);
  }
  assert.equal(applyRestaurantIntentPatch(date, { schemaVersion: "3", timeWindow: eveningDraft.timeWindow!,
    temporalResolution: eveningDraft.temporalResolution! }).temporalResolution?.timeWindow?.basis, "DAYPART:EVENING");
});

test("Google and website distinguish DAYPART intersection from the identical explicit numeric window", () => {
  const hours = ["Friday: 11:00 AM – 10:00 PM"];
  for (const basis of ["DAYPART:EVENING", "DAYPART:AFTERNOON", "DAYPART:AFTER_WORK", "EXPLICIT_RANGE", undefined]) {
    const expected = basis?.startsWith("DAYPART:") === true;
    const google = groundGoogleDiscovery({ placeId: "daypart", displayName: "Evening Sushi", formattedAddress: "Tokyo", types: ["restaurant", "sushi_restaurant"], regularOpeningHours: hours },
      { timezone: "Asia/Tokyo", requestFingerprint: "daypart", areaQuery: "Tokyo", observedAt: now, requestedDate: eveningDraft.date!,
        requestedTimeWindow: eveningDraft.timeWindow!, ...(basis ? { requestedTimeWindowBasis: basis } : {}) });
    assert.ok(google.accepted); if (!google.accepted) continue;
    const website = groundRestaurantWebsiteFacts(google.candidate, { ...completeRestaurantSearchIntent({ ...eveningDraft, temporalResolution: { ...eveningDraft.temporalResolution!, timeWindow: { ...eveningDraft.temporalResolution!.timeWindow!, basis: basis ?? "EXPLICIT_RANGE" } } })! },
      { candidateId: google.candidate.restaurant.id, sourceUrl: "https://sushi.example/", observedAt: now,
        entityMatch: { confidence: "HIGH", matchedBy: ["GOOGLE_LISTED_WEBSITE_URI"] }, regularOpeningHours: hours });
    for (const facts of [google.additionalEvidence, website.evidence]) {
      const claims = facts.find(e => e.kind === "RESTAURANT_FACT")!.claims;
      assert.equal(claims.openingHoursMatch, expected, String(basis));
      assert.deepEqual(claims.openingHoursMatchedWindow, expected ? ["18:00", "22:00"] : undefined);
    }
  }
  assert.equal(openingHoursForRequest(["Friday: 11:00 AM – 6:00 PM"], eveningDraft.date, eveningDraft.timeWindow, "Asia/Tokyo", "DAYPART:EVENING")?.matches, false, "touching the exclusive closing boundary is not an intersection");
  assert.deepEqual(openingHoursForRequest(["Friday: 5:00 PM – 7:00 PM, 8:00 PM – 10:00 PM"], eveningDraft.date, eveningDraft.timeWindow, "Asia/Tokyo", "DAYPART:EVENING")?.window, ["18:00", "19:00"], "split shifts remain separate");
});

test("Google primary dining types admit standalone food and drink venues and reject mixed-use primaries", () => {
  const place = {
    placeId:"place-mixed",displayName:"Fixture in Shibuya",formattedAddress:"Shibuya, Tokyo",
    location:{latitude:35.66,longitude:139.7},
  };
  const context = {timezone:fixtureIntent.timezone,requestFingerprint:"request",observedAt:now,areaQuery:"Shibuya"};
  for (const primaryType of ["hotel","shopping_mall","department_store","art_museum","museum","banquet_hall","event_venue","grocery_store","butcher_shop"]) {
    assert.deepEqual(groundGoogleDiscovery({...place,primaryType,types:["restaurant","food"]},context),
      {accepted:false,reasonCode:"GOOGLE_PLACE_TYPE_UNUSABLE"},primaryType);
  }
  for (const primaryType of ["restaurant","japanese_restaurant","cafe","bar","brewpub","bakery","  WINE Bar  "]) {
    assert.equal(groundGoogleDiscovery({...place,primaryType,types:[primaryType,"point_of_interest","establishment"]},context).accepted,true,primaryType);
  }
  for (const type of ["restaurant","cafe","food","brewpub"]) {
    assert.equal(groundGoogleDiscovery({...place,types:[type,"establishment"]},context).accepted,true,type);
  }
});

const age3={placeId:'age3-policy-observation',displayName:'Age.3 GINZA',formattedAddress:'Ginza, Tokyo',primaryType:'cafe',types:['cafe','dessert_restaurant','snack_bar','sandwich_shop','meal_takeaway','restaurant']};
const ageInput={timezone:'Asia/Tokyo' as const,requestFingerprint:'round20',observedAt:now,areaQuery:'Ginza',targetQuery:'restaurant in Ginza',selectionScope:'OPEN_ENDED' as const,requestedTimeWindow:{earliest:'19:00',latest:'20:00'},requestedTimeWindowBasis:'DAYPART:EVENING'};
test('Round20 observed Age.3 mixed cafe is not generic dinner; explicit outlet/cafe/dessert remain admissible',()=>{
 assert.deepEqual(groundGoogleDiscovery(age3,ageInput),{accepted:false,reasonCode:'GOOGLE_PLACE_TYPE_UNUSABLE'});
 for(const input of [{...ageInput,targetQuery:'Age.3 GINZA',selectionScope:'SPECIFIC_OUTLET' as const},{...ageInput,targetQuery:'café in Ginza'},{...ageInput,criteria:[{text:'dessert',polarity:'POSITIVE' as const,strength:'SOFT' as const}]}])assert.equal(groundGoogleDiscovery(age3,input).accepted,true);
 assert.equal(groundGoogleDiscovery(age3,{...ageInput,targetQuery:'cafe',criteria:[{text:'dessert',polarity:'NEGATIVE',strength:'HARD'}]}).accepted,false);
 const {primaryType:_primary,...withoutPrimary}=age3;
 assert.equal(groundGoogleDiscovery(withoutPrimary,ageInput).accepted,false);
 assert.equal(groundGoogleDiscovery(withoutPrimary,{...ageInput,targetQuery:'cafe'}).accepted,true);
});
for(const [type,query] of Object.entries({sandwich_shop:'sandwich',dessert_shop:'dessert',dessert_restaurant:'dessert',snack_bar:'snack',ice_cream_shop:'ice cream',bagel_shop:'bagel',donut_shop:'donut',juice_shop:'juice',acai_shop:'acai',meal_takeaway:'takeaway',meal_delivery:'delivery',pizza_delivery:'pizza delivery'}))test('Round20 restricted '+type+' requires intent in primary and fallback paths',()=>{
 for(const primary of [true,false]){
  const place={...age3,...(primary?{primaryType:type}:{primaryType:undefined}),types:[type,'restaurant','food']};
  const {primaryType,...rest}=place;const observation=primary?{...rest,primaryType:primaryType!}:rest;
  assert.equal(groundGoogleDiscovery(observation,ageInput).accepted,false);
  assert.equal(groundGoogleDiscovery(observation,{...ageInput,targetQuery:query}).accepted,true);
 }
});

for(const punctuation of ['','.','!','?'])test(`Round24 B5 negative dessert preference has punctuation-invariant grounding ${punctuation||'none'}`,()=>{
 const targetQuery='dinner in Ginza, preferably without overly sweet desserts'+punctuation;
 assert.deepEqual(groundGoogleDiscovery(age3,{...ageInput,targetQuery}),{accepted:false,reasonCode:'GOOGLE_PLACE_TYPE_UNUSABLE'});
 assert.equal(groundGoogleDiscovery(age3,{...ageInput,targetQuery:'Age.3 GINZA'+punctuation,selectionScope:'SPECIFIC_OUTLET'}).accepted,true);
});
for(const targetQuery of ['without outdoor seating I would like a dessert café in Ginza','no parking required and looking for a dessert café in Ginza','not too sweet, but specifically looking for a dessert café in Ginza','nothing too sweet, please find a dessert café in Ginza','a dessert café in Ginza without outdoor seating'])test('Round24 B5 local negation retains a later or earlier positive request: '+targetQuery,()=>{
 assert.equal(groundGoogleDiscovery(age3,{...ageInput,targetQuery}).accepted,true);
});
