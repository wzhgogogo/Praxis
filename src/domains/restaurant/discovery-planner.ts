import {positiveDiscoveryCriteria} from "./discovery-retrieval.js";
import type { RestaurantDiscoveryPlan, RestaurantSearchIntent, LocationAddressObservation } from "./contracts.js";

/** Source capability metadata is integration-owned data. The planner consumes no source names or URLs. */
export interface DiscoveryPackMetadata {
  id: string;
  capabilities: readonly ("DISCOVERY" | "FACTS" | "AVAILABILITY")[];
  reservationOnly: boolean;
  supportsGroups?: boolean;
  supportsSameDay?: boolean;
  basePriority: number;
}

export interface DiscoveryPlanningLocation {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  label: string;
  areaMatchBasis: "TASK_LOCATION_RADIUS" | "EVALUATION_LOCATION_RADIUS" | "NAMED_PLACE_RADIUS";
      addressComponents?: Array<{ longText: string; shortText?: string; types: string[] }>;
  addressObservation?: LocationAddressObservation;
}

export interface DiscoveryQuery {
  category: string;
  /** Executor-validated Agent retrieval, never a mechanical HARD projection. */
  keyword?: string;
  positiveCriteria: import("./discovery-retrieval.js").PositiveDiscoveryCriterion[];
  location: DiscoveryPlanningLocation;
}

export type DiscoveryPlanEntry = RestaurantDiscoveryPlan["entries"][number];
export type DiscoveryPlan = RestaurantDiscoveryPlan;

export function generalDiscoveryCategory(intent: RestaurantSearchIntent): string {
  const target = intent.target?.query ?? "";
  return /\bcaf(?:e|es)\b/i.test(target) ? "cafe" : "restaurant";
}


function localDate(now: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(now));
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

/**
 * Pure request-driven ordering. It intentionally does not interpret negative
 * criteria as search text: fact grounding owns exclusions after discovery.
 */
export function planDiscoverySources(
  intent: RestaurantSearchIntent,
  location: DiscoveryPlanningLocation,
  packs: readonly DiscoveryPackMetadata[],
  now = new Date().toISOString(),
): DiscoveryPlan {
  const category = generalDiscoveryCategory(intent);
  const sameDay = Boolean(intent.date && intent.date === localDate(now, intent.timezone));
  const candidates = packs
    .filter((pack) => pack.capabilities.includes("DISCOVERY"))
    .filter((pack) => intent.target?.goal !== "RECOMMENDATION" || !pack.reservationOnly)
    .map((pack) => ({ pack, score: pack.basePriority + (sameDay && pack.supportsSameDay ? 10 : 0) }))
    .sort((left, right) => right.score - left.score || left.pack.id.localeCompare(right.pack.id));
  return {
    entries: candidates.map(({ pack }) => ({ sourceId: pack.id, query: { category, positiveCriteria:positiveDiscoveryCriteria(intent), location: { ...location } } })),
    cursor: 0,
  };
}

export function currentDiscoveryPlanEntry(plan: DiscoveryPlan): DiscoveryPlanEntry | undefined {
  return plan.entries[plan.cursor];
}

/** A partial chunk rejoins the tail, after every other scheduled source batch. */
export function advanceDiscoveryPlan(plan: DiscoveryPlan, sourceEnded = true): DiscoveryPlan {
  const entries = structuredClone(plan.entries);
  const current = entries[plan.cursor];
  if (current && !sourceEnded) entries.push(structuredClone(current));
  return {...plan, entries, cursor: Math.min(entries.length, plan.cursor + 1)};
}
