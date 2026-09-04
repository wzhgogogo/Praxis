import type { RestaurantCandidate } from "../../domains/restaurant/contracts.js";
import type {
  TabelogEntityResolution,
  TabelogEntityResolutionDiagnostic,
  TabelogEntityResolutionReason,
  TabelogIdentityFieldComparison,
  TabelogOutletObservation,
} from "./tabelog-contracts.js";

export function normalizeTabelogIdentity(value: string | undefined): string {
  return (value ?? "").toLocaleLowerCase("ja-JP").replace(/[\s\-‐‑–—()（）・,，.。]/g, "");
}

export function normalizeTabelogPhone(value: string | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function strongNameMatch(left: string, right: string): boolean {
  const a = normalizeTabelogIdentity(left);
  const b = normalizeTabelogIdentity(right);
  return a.length >= 3 && b.length >= 3 && (a === b || a.includes(b) || b.includes(a));
}

function comparison(
  google: string,
  tabelog: string,
  matches: boolean,
  comparable: boolean,
): TabelogIdentityFieldComparison {
  if (!google) return "MISSING_GOOGLE";
  if (!tabelog) return "MISSING_TABELOG";
  return comparable && matches ? "MATCH" : "CONFLICT";
}

function reasonFor(
  candidates: Array<{ name: boolean; addressMatch: boolean; phoneMatch: boolean; phoneConflict: boolean; score: number }>,
  best: { name: boolean; addressMatch: boolean; phoneMatch: boolean; phoneConflict: boolean; score: number } | undefined,
  tied: boolean,
  confidence: TabelogEntityResolution["confidence"],
): TabelogEntityResolutionReason {
  if (confidence === "HIGH") return best?.phoneMatch ? "HIGH_EXACT_PHONE" : "HIGH_NAME_AND_ADDRESS";
  if (!best) return "NO_OUTLETS_PARSED";
  if (tied && best.score > 0) return "AMBIGUOUS_TOP_MATCH";
  if (best.phoneConflict) return "KNOWN_PHONE_CONFLICT";
  if (best.name && !best.addressMatch && !best.phoneMatch) return "NAME_ONLY_MATCH";
  if (best.addressMatch && !best.name && !best.phoneMatch) return "ADDRESS_ONLY_MATCH";
  if (best.phoneConflict || candidates.some((candidate) => candidate.phoneConflict)) return "KNOWN_PHONE_CONFLICT";
  return "NO_COMPARABLE_IDENTITY_SIGNAL";
}

export interface TabelogEntityResolutionInspection {
  resolution: TabelogEntityResolution;
  diagnostic: TabelogEntityResolutionDiagnostic;
}

/** Outlet/branch match; brand name alone never establishes a HIGH match. */
export function inspectTabelogEntity(
  candidate: RestaurantCandidate,
  outlets: TabelogOutletObservation[],
): TabelogEntityResolutionInspection {
  const googleName = normalizeTabelogIdentity(candidate.restaurant.outletName);
  const googleAddress = normalizeTabelogIdentity(candidate.restaurant.address);
  const googlePhone = normalizeTabelogPhone(candidate.restaurant.sourceIds.phone);
  const candidates = outlets.map((outlet) => {
    const name = strongNameMatch(candidate.restaurant.outletName, outlet.outletName);
    const outletAddress = normalizeTabelogIdentity(outlet.address);
    const addressMatch = googleAddress.length >= 6 && outletAddress.length >= 6 && (googleAddress.includes(outletAddress) || outletAddress.includes(googleAddress));
    const outletPhone = normalizeTabelogPhone(outlet.phone);
    const phoneMatch = googlePhone.length >= 8 && googlePhone === outletPhone;
    const phoneConflict = googlePhone.length >= 8 && outletPhone.length >= 8 && !phoneMatch;
    const score = phoneConflict ? -1 : (phoneMatch ? 4 : 0) + (name ? 2 : 0) + (addressMatch ? 2 : 0);
    return { outlet, name, addressMatch, phoneMatch, phoneConflict, score, outletAddress, outletPhone };
  }).sort((left, right) => right.score - left.score);
  const best = candidates[0];
  const next = candidates[1];
  const tied = best !== undefined && next !== undefined && next.score === best.score;
  const resolution: TabelogEntityResolution = !best || best.score <= 0
    ? { confidence: "LOW", matchedBy: [] }
    : !tied && best.phoneMatch
      ? { confidence: "HIGH", outlet: best.outlet, matchedBy: ["EXACT_PHONE"] }
      : !tied && best.name && best.addressMatch
        ? { confidence: "HIGH", outlet: best.outlet, matchedBy: ["NORMALIZED_NAME_AND_ADDRESS"] }
        : !tied && best.name
          ? { confidence: "MEDIUM", outlet: best.outlet, matchedBy: ["NORMALIZED_NAME"] }
          : { confidence: "LOW", matchedBy: [] };
  return {
    resolution,
    diagnostic: {
      candidateId: candidate.restaurant.id,
      google: {
        ...(candidate.restaurant.sourceIds.googlePlaces ? { placeId: candidate.restaurant.sourceIds.googlePlaces } : {}),
        outletName: { value: candidate.restaurant.outletName, normalizedValue: googleName, source: "GOOGLE_PLACES" },
        address: { value: candidate.restaurant.address, normalizedValue: googleAddress, source: "GOOGLE_PLACES" },
        phone: candidate.restaurant.sourceIds.phone
          ? { value: candidate.restaurant.sourceIds.phone, normalizedValue: googlePhone, source: "GOOGLE_PLACES" }
          : { source: "ABSENT" },
      },
      comparedOutlets: candidates.map((entry) => ({
        sourceEntityId: entry.outlet.sourceEntityId,
        sourceUrl: entry.outlet.sourceUrl,
        outletName: { value: entry.outlet.outletName, normalizedValue: normalizeTabelogIdentity(entry.outlet.outletName), source: "SEARCH_RESULT" },
        address: entry.outlet.address
          ? { value: entry.outlet.address, normalizedValue: entry.outletAddress, source: "SEARCH_RESULT" }
          : { source: "ABSENT" },
        phone: entry.outlet.phone
          ? { value: entry.outlet.phone, normalizedValue: entry.outletPhone, source: "SEARCH_RESULT" }
          : { source: "ABSENT" },
        comparison: {
          outletName: comparison(googleName, normalizeTabelogIdentity(entry.outlet.outletName), entry.name, googleName.length >= 3 && normalizeTabelogIdentity(entry.outlet.outletName).length >= 3),
          address: comparison(googleAddress, entry.outletAddress, entry.addressMatch, googleAddress.length >= 6 && entry.outletAddress.length >= 6),
          phone: comparison(googlePhone, entry.outletPhone, entry.phoneMatch, googlePhone.length >= 8 && entry.outletPhone.length >= 8),
        },
        score: entry.score,
      })),
      resolution: {
        confidence: resolution.confidence,
        matchedBy: [...resolution.matchedBy],
        ...(best ? { bestSourceEntityId: best.outlet.sourceEntityId } : {}),
        reason: reasonFor(candidates, best, tied, resolution.confidence),
      },
    },
  };
}

export function resolveTabelogEntity(
  candidate: RestaurantCandidate,
  outlets: TabelogOutletObservation[],
): TabelogEntityResolution {
  return inspectTabelogEntity(candidate, outlets).resolution;
}
