import type { RestaurantCandidate } from "../../domains/restaurant/contracts.js";

export interface TabelogOutletObservation {
  sourceEntityId: string;
  sourceUrl: string;
  outletName: string;
  address?: string;
  phone?: string;
}

export interface TabelogEntityResolution {
  confidence: "HIGH" | "MEDIUM" | "LOW";
  matchedBy: string[];
  outlet?: TabelogOutletObservation;
}

export interface TabelogAvailabilityPageObservation {
  candidate: RestaurantCandidate;
  sourceEntityId?: string;
  sourceUrl?: string;
  observedAt: string;
  requestedDate?: string;
  requestedPartySize?: number;
  entityMatch: TabelogEntityResolution;
  pageState:
    | "AVAILABLE"
    | "NO_MATCHING_SLOT"
    | "SOURCE_UNSUPPORTED"
    | "BOT_CHALLENGE"
    | "UNEXPECTED_PAGE"
    | "EXTRACTION_FAILED";
  visibleSlots?: string[];
  verifiedHardCriteria?: string[];
  excerpt?: string;
  failureCode?: string;
}
