import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import { groundGoogleDiscovery, groundTabelogAvailability } from "./read-grounding.js";

const candidate = fixtureCandidates[0]!;
const request = {
  candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date,
  timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, hardCriteria: ["yakiniku"],
};
const now = "2026-08-05T09:00:00.000Z";

test("Google discovery accepts structurally valid restaurant places without claiming retrieval criteria as facts", () => {
  const result = groundGoogleDiscovery({
    placeId: "google-1", displayName: "Example Omakase", formattedAddress: "Shibuya, Tokyo",
    location: { latitude: 35.66, longitude: 139.7 }, types: ["restaurant", "food"],
  }, { requestFingerprint: "request", observedAt: now, areaQuery: "Shibuya" });
  assert.equal(result.accepted, true);
  if (!result.accepted) return;
  assert.equal(result.candidate.restaurant.id.startsWith("praxis:restaurant:"), true);
  assert.equal(result.candidate.matchReasons.includes("omakase"), false);
  assert.equal(result.evidence.provider, "GOOGLE_PLACES");
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

test("a completed slot extraction with no qualifying slot becomes UNAVAILABLE", () => {
  const result = groundTabelogAvailability(candidate, request, {
    candidateId: candidate.restaurant.id, observedAt: now, requestedDate: fixtureIntent.date, requestedPartySize: 2,
    entityMatch: { confidence: "HIGH", matchedBy: ["NORMALIZED_NAME_AND_ADDRESS"] },
    pageState: "NO_MATCHING_SLOT", visibleSlots: ["18:00"],
  }, now);
  assert.equal(result.check.status, "UNAVAILABLE");
  assert.equal(result.offers.length, 0);
});
