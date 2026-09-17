import type { RestaurantCandidate } from "../../domains/restaurant/contracts.js";
import { compareCompleteOutletAddress } from "../restaurant-availability/outlet-identity.js";
import type { TableCheckEntityResolution, TableCheckOutletObservation } from "./tablecheck-contracts.js";
import { normalizeTableCheckIdentity, normalizeTableCheckPhone } from "./tablecheck-page-parser.js";

export interface TableCheckEntityInspection {
  resolution: TableCheckEntityResolution;
  comparison: { outletName: "MATCH" | "CONFLICT" | "MISSING"; address: "MATCH" | "CONFLICT" | "INSUFFICIENT" | "MISSING"; phone: "MATCH" | "CONFLICT" | "MISSING" };
  reason: "HIGH_EXACT_PHONE" | "HIGH_NAME_AND_ADDRESS" | "KNOWN_PHONE_CONFLICT" | "NAME_ONLY_MATCH" | "NO_COMPARABLE_IDENTITY_SIGNAL";
}

function strongTextMatch(left: string | undefined, right: string | undefined, minimumLength: number): boolean {
  const a = normalizeTableCheckIdentity(left);
  const b = normalizeTableCheckIdentity(right);
  return a.length >= minimumLength && b.length >= minimumLength && (a === b || a.includes(b) || b.includes(a));
}

function comparison(
  left: string | undefined,
  right: string | undefined,
  matched: boolean,
): "MATCH" | "CONFLICT" | "MISSING" {
  return !left || !right ? "MISSING" : matched ? "MATCH" : "CONFLICT";
}

/** Same-outlet proof remains exact phone or strong name plus full address. */
export function inspectTableCheckEntity(
  candidate: RestaurantCandidate,
  outlet: TableCheckOutletObservation,
): TableCheckEntityInspection {
  const name = strongTextMatch(candidate.restaurant.outletName, outlet.outletName, 3);
  const addressComparison = compareCompleteOutletAddress(candidate.restaurant.address, outlet.address);
  const address = addressComparison === "MATCH";
  const addressConflict = addressComparison === "CONFLICT";
  const candidatePhone = normalizeTableCheckPhone(candidate.restaurant.sourceIds.phone);
  const outletPhone = normalizeTableCheckPhone(outlet.phone);
  const phone = candidatePhone.length >= 8 && candidatePhone === outletPhone;
  const phoneConflict = candidatePhone.length >= 8 && outletPhone.length >= 8 && !phone;
  // A stale/call-centre phone is weaker than an independently complete outlet
  // proof.  It remains visible in diagnostics, but cannot erase matching name
  // and full address; a different branch still lacks that address proof.
  const resolution = phone && !addressConflict
    ? { confidence: "HIGH" as const, outlet, matchedBy: ["EXACT_PHONE"] }
    : name && address
      ? { confidence: "HIGH" as const, outlet, matchedBy: ["NORMALIZED_NAME_AND_ADDRESS"] }
      : name
        ? { confidence: "MEDIUM" as const, outlet, matchedBy: ["NORMALIZED_NAME"] }
        : { confidence: "LOW" as const, matchedBy: [] };
  return {
    resolution,
    comparison: {
      outletName: comparison(candidate.restaurant.outletName, outlet.outletName, name),
      address: !candidate.restaurant.address || !outlet.address ? "MISSING" : addressComparison,
      phone: comparison(candidate.restaurant.sourceIds.phone, outlet.phone, phone),
    },
    reason: resolution.confidence === "HIGH"
      ? (phone ? "HIGH_EXACT_PHONE" : "HIGH_NAME_AND_ADDRESS")
      : phoneConflict
        ? "KNOWN_PHONE_CONFLICT"
        : name
          ? "NAME_ONLY_MATCH"
          : "NO_COMPARABLE_IDENTITY_SIGNAL",
  };
}
