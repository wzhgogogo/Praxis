import type { RestaurantReadEvidence } from "./contracts.js";

export interface CandidateDistanceObservation {
  meters: number;
  centerBasis: "TASK_LOCATION_RADIUS" | "EVALUATION_LOCATION_RADIUS" | "NAMED_PLACE_RADIUS";
  source: string;
}

/** Only source-derived advisory claims; absence grants no supported path. */
export function observedCandidateAvailabilityPath(evidence: readonly RestaurantReadEvidence[], candidateId: string, now: string): "DIRECT_SOURCE_PAGE" | "NAME_RESOLUTION" | "NONE" {
  const latest = evidence.filter(item => item.kind === "DISCOVERY" && item.candidateId === candidateId && Date.parse(item.observedAt) <= Date.parse(now))
    .sort((a,b) => Date.parse(b.observedAt)-Date.parse(a.observedAt))[0]?.claims.availabilityPath;
  return latest === "DIRECT_SOURCE_PAGE" || latest === "NAME_RESOLUTION" ? latest : "NONE";
}

/** Already grounded circle evidence only; advisory projection never changes qualification. */
export function observedCandidateDistance(evidence: readonly RestaurantReadEvidence[], candidateId: string, now: string): { distanceObservation?: CandidateDistanceObservation } {
  const item = evidence.filter(item => item.kind === "DISCOVERY" && item.candidateId === candidateId
    && Date.parse(item.observedAt) <= Date.parse(now) && item.claims.areaMatch === true
    && typeof item.claims.distanceMeters === "number" && Number.isFinite(item.claims.distanceMeters) && item.claims.distanceMeters >= 0
    && ["TASK_LOCATION_RADIUS", "EVALUATION_LOCATION_RADIUS", "NAMED_PLACE_RADIUS"].includes(String(item.claims.areaMatchBasis)))
    .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0];
  return item ? { distanceObservation: { meters: Math.round(item.claims.distanceMeters as number),
    centerBasis: item.claims.areaMatchBasis as CandidateDistanceObservation["centerBasis"], source: item.provider } } : {};
}
