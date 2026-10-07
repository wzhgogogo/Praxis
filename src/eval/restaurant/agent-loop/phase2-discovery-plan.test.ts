import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { completeRestaurantSearchIntent, applyRestaurantIntentPatch } from "../../../domains/restaurant/intent-state.js";
import { planDiscoverySources, type DiscoveryPlanningLocation } from "../../../domains/restaurant/discovery-planner.js";
import type { RestaurantIntentPatch, RestaurantSearchIntent } from "../../../domains/restaurant/contracts.js";
import { restaurantDiscoveryPacks } from "../../../integrations/restaurant-search/source-packs.js";
import { NAMED_PLACE_NEARBY_RADIUS_METERS } from "../../../integrations/google/google-places-restaurant-search.js";
import { loadFrozenLiveCases, materializeLiveCase, RESTAURANT_READ_DEVELOPMENT_CASE_PATH, type FrozenLiveCase } from "./live-case-materializer.js";

type FrozenSemantic = {
  target?: { goal?: "AVAILABILITY" | "RECOMMENDATION" };
  location?: { value?: string };
  date?: { value?: string };
  time?: { value?: string; start?: string; end?: string };
  party_size?: number;
  criteria?: Array<{ value?: string; polarity?: "POSITIVE" | "NEGATIVE"; strength?: "HARD" | "SOFT" | "UNSPECIFIED" }>;
};

function authoritativeIntent(source: FrozenLiveCase): RestaurantSearchIntent {
  const semantic = source.semantic as FrozenSemantic | undefined;
  assert.ok(semantic?.target?.goal && semantic.location?.value, `missing frozen authoritative semantic fields for ${source.id}`);
  const time = semantic.time?.value ? { earliest: semantic.time.value, latest: semantic.time.value }
    : semantic.time?.start && semantic.time.end ? { earliest: semantic.time.start, latest: semantic.time.end } : undefined;
  const patch: RestaurantIntentPatch = {
    schemaVersion: "3",
    target: { goal: semantic.target.goal, query: String(source.content ?? "") },
    area: {
      query: semantic.location.value,
      ...(source.id === "h003" || source.id === "h004" || source.id === "h005"
        ? { coordinates: { latitude: 35.6697, longitude: 139.7670, observedAt: source.reference_time, source: "EVALUATION" as const }, radiusMeters: 3_000 }
        : {}),
    },
    ...(semantic.date?.value ? { date: semantic.date.value } : {}),
    ...(time ? { timeWindow: time } : {}),
    ...(semantic.party_size ? { partySize: semantic.party_size } : {}),
    addCriteria: (semantic.criteria ?? []).flatMap((criterion) =>
      criterion.value && criterion.polarity && criterion.strength
        ? [{ text: criterion.value, polarity: criterion.polarity, strength: criterion.strength }]
        : []),
  };
  const intent = completeRestaurantSearchIntent(applyRestaurantIntentPatch(undefined, patch));
  assert.ok(intent, `frozen semantic mapping did not produce search intent for ${source.id}`);
  return intent;
}

const namedLocations: Record<string, DiscoveryPlanningLocation> = {
  h001: { latitude: 35.658, longitude: 139.7016, radiusMeters: 1_000, label: "Shibuya", areaMatchBasis: "NAMED_PLACE_RADIUS" },
  h002: { latitude: 35.6697, longitude: 139.7670, radiusMeters: NAMED_PLACE_NEARBY_RADIUS_METERS, label: "Higashi-Ginza", areaMatchBasis: "NAMED_PLACE_RADIUS" },
};
const suppliedNearby: DiscoveryPlanningLocation = {
  latitude: 35.6697, longitude: 139.7670, radiusMeters: 3_000, label: "Higashi-Ginza", areaMatchBasis: "EVALUATION_LOCATION_RADIUS",
};

function locationFor(source: FrozenLiveCase): DiscoveryPlanningLocation {
  return namedLocations[source.id] ?? suppliedNearby;
}

test("frozen H001-H005 authoritative semantics materialize into auditable source-pack plans", async () => {
  const frozen = await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH);
  const cases = frozen.filter((item) => /^h00[1-5]$/.test(item.id));
  assert.equal(cases.length, 5);
  const rendered = cases.map((source) => {
    const materialized = materializeLiveCase(source, source.reference_time);
    const intent = authoritativeIntent(materialized);
    const location = locationFor(materialized);
    const plan = planDiscoverySources(intent, location, restaurantDiscoveryPacks.map((pack) => pack.meta), source.reference_time);
    return {
      id: source.id,
      input: {
        date: intent.date,
        timeWindow: intent.timeWindow,
        partySize: intent.partySize,
        coordinates: { latitude: location.latitude, longitude: location.longitude },
        radiusMeters: location.radiusMeters,
        areaMatchBasis: location.areaMatchBasis,
        radiusContract: source.id === "h002" ? "NAMED_PLACE_NEARBY_RADIUS_METERS_DEFAULT" : "FROZEN_REQUEST_OR_EVALUATION_ORACLE",
      },
      plan: plan.entries.map((entry) => ({ pack: entry.sourceId, query: entry.query })),
    };
  });
  assert.deepEqual(rendered.map((item) => item.id), ["h001", "h002", "h003", "h004", "h005"]);
  assert.deepEqual(rendered[0]!.plan.map((item) => item.pack), ["tabelog", "tablecheck", "google-places"]);
  assert.equal(rendered[0]!.plan[0]!.query.keyword, "omakase");
  assert.equal(rendered[1]!.plan[0]!.query.keyword, undefined, "both H002 negative HARD conditions stay out of retrieval");
  assert.equal(rendered[1]!.input.radiusMeters, NAMED_PLACE_NEARBY_RADIUS_METERS, "named H002 retains the existing resolver default when its frozen request supplies no radius");
  assert.equal(rendered[1]!.input.radiusContract, "NAMED_PLACE_NEARBY_RADIUS_METERS_DEFAULT");
  assert.deepEqual(rendered.slice(2).map((item) => item.input.coordinates), Array(3).fill({ latitude: 35.6697, longitude: 139.7670 }));
  assert.deepEqual(rendered[3]!.plan.map((item) => item.pack), ["tabelog", "google-places"], "recommendation excludes reservation-only packs");
  if (process.env.PRAXIS_WRITE_PHASE2_PLAN_ARTIFACT === "1") {
    const directory = resolve(".eval-artifacts", "phase2-source-pack-planning-20261007");
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, "frozen-h001-h005-plans-round2.json"), JSON.stringify({
      artifactType: "phase2-frozen-discovery-plan@1",
      reviewRound: 2,
      mode: "OFFLINE_AUTHORITATIVE_SEMANTIC_MAPPING",
      externalRequests: 0,
      modelCalls: 0,
      plans: rendered,
    }, null, 2));
  }
});
