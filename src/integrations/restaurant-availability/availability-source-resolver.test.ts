import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import type { RestaurantAvailabilityRead, RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import type { RestaurantAvailabilityProvider } from "./contracts.js";
import { AvailabilitySourceResolver } from "./availability-source-resolver.js";
import { tableCheckDiscoveryPack, tabelogDiscoveryPack } from "../restaurant-search/source-packs.js";

const candidate = fixtureCandidates[0]!;
const request: RestaurantAvailabilityRequest = {
  candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date,
  timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, hardCriteria: ["yakiniku"],
};

function provider(
  name: RestaurantAvailabilityProvider["provider"],
  result: { status: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN" | "SOURCE_UNSUPPORTED"; reasonCode?: string },
  calls: string[],
): RestaurantAvailabilityProvider {
  return {
    provider: name,
    executionRoute: "GENERIC_BROWSER",
    async check(input) {
      calls.push(name);
      const checkedAt = "2026-08-05T09:00:00.000Z";
      const read: RestaurantAvailabilityRead = {
        offers: result.status === "AVAILABLE" ? [{
          id: `offer:${name}`, restaurantId: input.candidateIds[0]!, source: name, dateTime: "2026-08-05T19:00:00+09:00", timezone: "Asia/Tokyo", partySize: 2,
          bookingMode: "REQUEST", executionMode: "BROWSER", checkedAt, expiresAt: "2026-08-05T09:02:00.000Z",
        }] : [],
        availabilityChecks: { [input.candidateIds[0]!]: { status: result.status, checkedAt, evidenceIds: [], ...(result.reasonCode ? { reasonCode: result.reasonCode } : {}) } },
        evidence: [],
        metadata: { provider: name, route: "GENERIC_BROWSER", latencyMs: 1, ...(result.reasonCode ? { failureCode: result.reasonCode } : {}) },
      };
      return read;
    },
  };
}

function resolver(tableCheck: RestaurantAvailabilityProvider, tabelog: RestaurantAvailabilityProvider) {
  return new AvailabilitySourceResolver([{ pack: tableCheckDiscoveryPack, provider: tableCheck }, { pack: tabelogDiscoveryPack, provider: tabelog }]);
}

test("source resolver always prefers TableCheck and does not call Tabelog after a conclusive read", async () => {
  const calls: string[] = [];
  const result = await resolver(
    provider("TABLECHECK", { status: "AVAILABLE" }, calls),
    provider("TABELOG", { status: "AVAILABLE" }, calls),
  ).check(request, new AbortController().signal);
  assert.deepEqual(calls, ["TABLECHECK"]);
  assert.equal(result.metadata.provider, "TABLECHECK");
  assert.deepEqual(result.metadata.providerAttempts, [{ candidateId: candidate.restaurant.id, provider: "TABLECHECK", outcome: "AVAILABLE" }]);
});

test("a legal Tabelog same-store entrance changes only source order and still stops after its grounded no-slot observation", async () => {
  const calls: string[] = [];
  const hinted = {
    ...candidate,
    restaurant: {
      ...candidate.restaurant,
      sourceIds: { ...candidate.restaurant.sourceIds, googleWebsiteUri: "https://tabelog.com/tokyo/A1301/example/" },
    },
  };
  const result = await resolver(
    provider("TABLECHECK", { status: "AVAILABLE" }, calls),
    provider("TABELOG", { status: "UNAVAILABLE" }, calls),
  ).check({ ...request, candidates: [hinted] }, new AbortController().signal);
  assert.deepEqual(calls, ["TABELOG"]);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNAVAILABLE");
  assert.deepEqual(result.availabilityChecks[candidate.restaurant.id]?.sourceAttempts, [{ source: "TABELOG", outcome: "UNAVAILABLE" }]);
});

test("a source-native outlet is checked only on its own platform even when the read is unknown", async () => {
  for (const native of [
    { tablecheck: "restaurant1", tablecheckNativeGuideUri: "https://www.tablecheck.com/en/restaurant1" },
    { tabelog: "tokyo/A1301/123", tabelogNativeDetailUri: "https://tabelog.com/tokyo/A1301/123/" },
  ]) {
    const calls: string[] = [];
    const nativeCandidate = { ...candidate, restaurant: { ...candidate.restaurant, sourceIds: native } };
    const result = await resolver(
      provider("TABLECHECK", { status: "UNKNOWN", reasonCode: "REQUEST_UNCONFIRMED" }, calls),
      provider("TABELOG", { status: "AVAILABLE" }, calls),
    ).check({ ...request, candidates: [nativeCandidate] }, new AbortController().signal);
    const expected = "tablecheck" in native ? "TABLECHECK" : "TABELOG";
    assert.deepEqual(calls, [expected]);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, expected === "TABLECHECK" ? "UNKNOWN" : "AVAILABLE");
  }
});

test("an unrelated or malformed URL cannot reorder the default TableCheck-first source path", async () => {
  for (const googleWebsiteUri of ["https://evil.example/tabelog.com/restaurant", "not a URL"]) {
    const calls: string[] = [];
    const hinted = { ...candidate, restaurant: { ...candidate.restaurant, sourceIds: { ...candidate.restaurant.sourceIds, googleWebsiteUri } } };
    await resolver(
      provider("TABLECHECK", { status: "UNAVAILABLE" }, calls),
      provider("TABELOG", { status: "AVAILABLE" }, calls),
    ).check({ ...request, candidates: [hinted] }, new AbortController().signal);
    assert.deepEqual(calls, ["TABLECHECK"], googleWebsiteUri);
  }
});

test("source resolver falls back from a TableCheck provider failure to Tabelog", async () => {
  const calls: string[] = [];
  const result = await resolver(
    provider("TABLECHECK", { status: "UNKNOWN", reasonCode: "EXTRACTION_FAILED" }, calls),
    provider("TABELOG", { status: "UNAVAILABLE" }, calls),
  ).check(request, new AbortController().signal);
  assert.deepEqual(calls, ["TABLECHECK", "TABELOG"]);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNAVAILABLE");
  assert.deepEqual(result.metadata.providerAttempts, [
    { candidateId: candidate.restaurant.id, provider: "TABLECHECK", outcome: "PROVIDER_FAILURE", failureCode: "EXTRACTION_FAILED" },
    { candidateId: candidate.restaurant.id, provider: "TABELOG", outcome: "UNAVAILABLE" },
  ]);
});

test("Tabelog bot challenge remains provider-scoped and all providers exhausted fail closed", async () => {
  const calls: string[] = [];
  const result = await resolver(
    provider("TABLECHECK", { status: "UNKNOWN", reasonCode: "TABLECHECK_DISCOVERY_NO_RESULT" }, calls),
    provider("TABELOG", { status: "UNKNOWN", reasonCode: "BOT_CHALLENGE" }, calls),
  ).check(request, new AbortController().signal);
  assert.deepEqual(calls, ["TABLECHECK", "TABELOG"]);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BOT_CHALLENGE");
  assert.deepEqual(result.availabilityChecks[candidate.restaurant.id]?.sourceAttempts, [
    { source: "TABLECHECK", outcome: "FAILED", reasonCode: "TABLECHECK_DISCOVERY_NO_RESULT" },
    { source: "TABELOG", outcome: "FAILED", reasonCode: "BOT_CHALLENGE" },
  ]);
  assert.equal(result.metadata.failureCode, "AVAILABILITY_SOURCES_EXHAUSTED");
  assert.equal(result.metadata.providerAttempts?.[1]?.failureCode, "BOT_CHALLENGE");
});
