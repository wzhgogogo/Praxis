import type { RestaurantCandidate } from "../../domains/restaurant/contracts.js";
import type { TabelogEntityResolution, TabelogOutletObservation } from "./tabelog-contracts.js";

function normalize(value: string | undefined): string {
  return (value ?? "").toLocaleLowerCase("ja-JP").replace(/[\s\-‐‑–—()（）・,，.。]/g, "");
}

function phone(value: string | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function strongNameMatch(left: string, right: string): boolean {
  const a = normalize(left);
  const b = normalize(right);
  return a.length >= 3 && b.length >= 3 && (a === b || a.includes(b) || b.includes(a));
}

/** Outlet/branch match; brand name alone never establishes a HIGH match. */
export function resolveTabelogEntity(
  candidate: RestaurantCandidate,
  outlets: TabelogOutletObservation[],
): TabelogEntityResolution {
  const exactPhone = phone(candidate.restaurant.sourceIds.phone);
  const candidates = outlets.map((outlet) => {
    const name = strongNameMatch(candidate.restaurant.outletName, outlet.outletName);
    const address = normalize(candidate.restaurant.address);
    const outletAddress = normalize(outlet.address);
    const addressMatch = address.length >= 6 && outletAddress.length >= 6 && (address.includes(outletAddress) || outletAddress.includes(address));
    const outletPhone = phone(outlet.phone);
    const phoneMatch = exactPhone.length >= 8 && exactPhone === outletPhone;
    const phoneConflict = exactPhone.length >= 8 && outletPhone.length >= 8 && !phoneMatch;
    const score = phoneConflict ? -1 : (phoneMatch ? 4 : 0) + (name ? 2 : 0) + (addressMatch ? 2 : 0);
    return { outlet, name, addressMatch, phoneMatch, phoneConflict, score };
  }).sort((left, right) => right.score - left.score);
  const best = candidates[0];
  const next = candidates[1];
  if (!best || best.score <= 0) return { confidence: "LOW", matchedBy: [] };
  const tied = next !== undefined && next.score === best.score;
  if (!tied && best.phoneMatch) return { confidence: "HIGH", outlet: best.outlet, matchedBy: ["EXACT_PHONE"] };
  if (!tied && best.name && best.addressMatch) return { confidence: "HIGH", outlet: best.outlet, matchedBy: ["NORMALIZED_NAME_AND_ADDRESS"] };
  if (!tied && best.name) return { confidence: "MEDIUM", outlet: best.outlet, matchedBy: ["NORMALIZED_NAME"] };
  return { confidence: "LOW", matchedBy: [] };
}
