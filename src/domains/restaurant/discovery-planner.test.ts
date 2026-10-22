import assert from "node:assert/strict";
import test from "node:test";

import { advanceDiscoveryPlan, planDiscoverySources, type DiscoveryPackMetadata } from "./discovery-planner.js";
import type { RestaurantSearchIntent } from "./contracts.js";

const location = { latitude: 35.6697, longitude: 139.7670, radiusMeters: 3_000, label: "Higashi-Ginza", areaMatchBasis: "EVALUATION_LOCATION_RADIUS" as const };
const packs: readonly DiscoveryPackMetadata[] = [
  { id: "source-reservation-a", capabilities: ["DISCOVERY", "AVAILABILITY"], reservationOnly: true, supportsGroups: true, supportsSameDay: true, basePriority: 20 },
  { id: "source-directory-b", capabilities: ["DISCOVERY", "FACTS", "AVAILABILITY"], reservationOnly: false, basePriority: 10 },
  { id: "source-places-c", capabilities: ["DISCOVERY", "FACTS"], reservationOnly: false, supportsGroups: true, basePriority: 5 },
];
function intent(overrides: Partial<RestaurantSearchIntent> = {}): RestaurantSearchIntent {
  return { timezone: "Asia/Tokyo", target: { goal: "AVAILABILITY", query: "dinner nearby" }, area: { query: "nearby", radiusMeters: 3_000 }, criteria: [], ...overrides };
}

test("planner passes positive criteria without mechanically choosing a retrieval keyword and retains supplied nearby coordinates", () => {
  const plan = planDiscoverySources(intent({ criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] }), location, packs, "2026-08-19T10:00:00.000Z");
  assert.equal(plan.entries[0]!.query.keyword, undefined);
  assert.equal(plan.entries[0]!.query.category, "restaurant");
  assert.deepEqual(plan.entries[0]!.query.location, location);
});

test("planner keeps negative-only criteria out of discovery text and routes recommendations away from reservation-only packs", () => {
  const negativeOnly = planDiscoverySources(intent({ criteria: [{ text: "hot pot", polarity: "NEGATIVE", strength: "HARD" }] }), location, packs);
  assert.deepEqual(negativeOnly.entries.map((entry) => entry.query), packs.map(() => ({ category: "restaurant", positiveCriteria:[], location })));
  const recommendation = planDiscoverySources(intent({ target: { goal: "RECOMMENDATION", query: "cafes nearby" } }), location, packs);
  assert.deepEqual(recommendation.entries.map((entry) => entry.sourceId), ["source-directory-b", "source-places-c"]);
  assert.ok(recommendation.entries.every((entry) => entry.query.category === "cafe"));
});

test("planner retains base source priority for a group request", () => {
  const plan = planDiscoverySources(intent({ partySize: 10 }), location, packs);
  assert.equal(plan.entries[0]!.sourceId, "source-reservation-a");
});

test("planner evaluates same-day capability in the intent timezone", () => {
  const plan = planDiscoverySources(intent({ date: "2026-10-08" }), location, [
    { id: "general", capabilities: ["DISCOVERY"], reservationOnly: false, basePriority: 5 },
    { id: "same-day", capabilities: ["DISCOVERY"], reservationOnly: false, supportsSameDay: true, basePriority: 0 },
  ], "2026-10-07T16:00:00.000Z");
  assert.equal(plan.entries[0]!.sourceId, "same-day");
  const later = planDiscoverySources(intent({ date: "2026-10-09" }), location, [
    { id: "general", capabilities: ["DISCOVERY"], reservationOnly: false, basePriority: 5 },
    { id: "same-day", capabilities: ["DISCOVERY"], reservationOnly: false, supportsSameDay: true, basePriority: 0 },
  ], "2026-10-07T16:00:00.000Z");
  assert.equal(later.entries[0]!.sourceId, "general");
});

// Real failure: inaccurate group metadata must not starve a higher-priority source.
test("group-window: inaccurate group flag cannot outrank source priority", () => {
  const sources = packs.map(pack => ({...pack, basePriority: pack.id === "source-directory-b" ? 30 : pack.basePriority}));
  assert.equal(planDiscoverySources(intent({partySize:10}), location, sources).entries[0]!.sourceId,"source-directory-b");
});
test("group-window: unfinished source chunk rotates behind every other first batch", () => {
  let plan = planDiscoverySources(intent(), location, packs);
  const first = plan.entries[0]!.sourceId;
  plan = Reflect.apply(advanceDiscoveryPlan, undefined, [plan, false]);
  assert.equal(plan.entries[plan.cursor]!.sourceId,"source-directory-b");
  assert.equal(plan.entries.at(-1)!.sourceId,first);
});
