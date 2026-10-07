import type { RestaurantDiscoveryPlan, RestaurantSearchIntent } from "./contracts.js";

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
}

export interface DiscoveryQuery {
  category: string;
  /** Only a positive HARD criterion may become a retrieval keyword. */
  keyword?: string;
  location: DiscoveryPlanningLocation;
}

export type DiscoveryPlanEntry = RestaurantDiscoveryPlan["entries"][number];
export type DiscoveryPlan = RestaurantDiscoveryPlan;

function genericCategory(intent: RestaurantSearchIntent): string {
  const target = intent.target?.query ?? "";
  return /\bcaf(?:e|es)\b/i.test(target) ? "cafe" : "restaurant";
}

function positiveHardKeyword(intent: RestaurantSearchIntent): string | undefined {
  return intent.criteria.find((criterion) => criterion.polarity === "POSITIVE" && criterion.strength === "HARD")?.text.trim() || undefined;
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
  const keyword = positiveHardKeyword(intent);
  const category = keyword ?? genericCategory(intent);
  const sameDay = Boolean(intent.date && intent.date === localDate(now, intent.timezone));
  const group = intent.partySize !== undefined && intent.partySize >= 6;
  const candidates = packs
    .filter((pack) => pack.capabilities.includes("DISCOVERY"))
    .filter((pack) => intent.target?.goal !== "RECOMMENDATION" || !pack.reservationOnly)
    .map((pack) => ({ pack, score: pack.basePriority + (group && pack.supportsGroups ? 100 : 0) + (sameDay && pack.supportsSameDay ? 10 : 0) }))
    .sort((left, right) => right.score - left.score || left.pack.id.localeCompare(right.pack.id));
  return {
    entries: candidates.map(({ pack }) => ({ sourceId: pack.id, query: { category, ...(keyword ? { keyword } : {}), location: { ...location } } })),
    cursor: 0,
  };
}

export function currentDiscoveryPlanEntry(plan: DiscoveryPlan): DiscoveryPlanEntry | undefined {
  return plan.entries[plan.cursor];
}

export function advanceDiscoveryPlan(plan: DiscoveryPlan): DiscoveryPlan {
  return { entries: plan.entries.map((entry) => ({ sourceId: entry.sourceId, query: { ...entry.query, location: { ...entry.query.location } } })), cursor: Math.min(plan.entries.length, plan.cursor + 1) };
}
