import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import type { RestaurantAvailabilityRead, RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import type { RestaurantAvailabilityProvider } from "./contracts.js";
import { AvailabilitySourceResolver } from "./availability-source-resolver.js";

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

test("source resolver always prefers TableCheck and does not call Tabelog after a conclusive read", async () => {
  const calls: string[] = [];
  const result = await new AvailabilitySourceResolver(
    provider("TABLECHECK", { status: "AVAILABLE" }, calls),
    provider("TABELOG", { status: "AVAILABLE" }, calls),
  ).check(request, new AbortController().signal);
  assert.deepEqual(calls, ["TABLECHECK"]);
  assert.equal(result.metadata.provider, "TABLECHECK");
  assert.deepEqual(result.metadata.providerAttempts, [{ candidateId: candidate.restaurant.id, provider: "TABLECHECK", outcome: "AVAILABLE" }]);
});

test("source resolver falls back from a TableCheck provider failure to Tabelog", async () => {
  const calls: string[] = [];
  const result = await new AvailabilitySourceResolver(
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
  const result = await new AvailabilitySourceResolver(
    provider("TABLECHECK", { status: "UNKNOWN", reasonCode: "TABLECHECK_DISCOVERY_NO_RESULT" }, calls),
    provider("TABELOG", { status: "UNKNOWN", reasonCode: "BOT_CHALLENGE" }, calls),
  ).check(request, new AbortController().signal);
  assert.deepEqual(calls, ["TABLECHECK", "TABELOG"]);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "AVAILABILITY_SOURCES_EXHAUSTED");
  assert.equal(result.metadata.failureCode, "AVAILABILITY_SOURCES_EXHAUSTED");
  assert.equal(result.metadata.providerAttempts?.[1]?.failureCode, "BOT_CHALLENGE");
});
