import type { RestaurantCandidate } from "../../domains/restaurant/contracts.js";
import type { BrowserSessionMetadata } from "../../infrastructure/browser/browser-runtime.js";

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

/** Public-page provenance for a single identity field; never raw HTML. */
export type TabelogIdentityEvidenceSource = "GOOGLE_PLACES" | "SEARCH_RESULT" | "JSON_LD" | "DOM" | "TEL_LINK" | "ABSENT";

export interface TabelogIdentityFieldDiagnostic {
  value?: string;
  normalizedValue?: string;
  source: TabelogIdentityEvidenceSource;
}

export interface TabelogOutletIdentityExtraction {
  outlet: TabelogOutletObservation;
  canonicalUrl?: string;
  fields: {
    outletName: TabelogIdentityFieldDiagnostic;
    address: TabelogIdentityFieldDiagnostic;
    phone: TabelogIdentityFieldDiagnostic;
  };
}

export type TabelogIdentityFieldComparison = "MATCH" | "CONFLICT" | "MISSING_GOOGLE" | "MISSING_TABELOG";

export type TabelogEntityResolutionReason =
  | "HIGH_EXACT_PHONE"
  | "HIGH_NAME_AND_ADDRESS"
  | "SEARCH_BOT_CHALLENGE"
  | "DETAIL_BOT_CHALLENGE"
  | "NO_OUTLETS_PARSED"
  | "NO_COMPARABLE_IDENTITY_SIGNAL"
  | "KNOWN_PHONE_CONFLICT"
  | "AMBIGUOUS_TOP_MATCH"
  | "NAME_ONLY_MATCH"
  | "ADDRESS_ONLY_MATCH";

/**
 * Eval-only diagnostic of untrusted public identity fields. It deliberately
 * lives in the Tabelog integration rather than Domain evidence or Task State.
 */
export interface TabelogEntityResolutionDiagnostic {
  candidateId: string;
  google: {
    placeId?: string;
    outletName: TabelogIdentityFieldDiagnostic;
    address: TabelogIdentityFieldDiagnostic;
    phone: TabelogIdentityFieldDiagnostic;
  };
  comparedOutlets: Array<{
    sourceEntityId: string;
    sourceUrl: string;
    outletName: TabelogIdentityFieldDiagnostic;
    address: TabelogIdentityFieldDiagnostic;
    phone: TabelogIdentityFieldDiagnostic;
    comparison: {
      outletName: TabelogIdentityFieldComparison;
      address: TabelogIdentityFieldComparison;
      phone: TabelogIdentityFieldComparison;
    };
    score: number;
  }>;
  resolution: {
    confidence: TabelogEntityResolution["confidence"];
    matchedBy: string[];
    bestSourceEntityId?: string;
    reason: TabelogEntityResolutionReason;
  };
}

export interface TabelogIdentityDiagnostic extends TabelogEntityResolutionDiagnostic {
  search: {
    query: string;
    requestedUrl: string;
    finalUrl: string;
    title: string;
    parsedResultCount: number;
    inspectedResultCount: number;
  };
  searchResults: TabelogOutletObservation[];
  details: Array<{
    searchResultSourceEntityId: string;
    requestedUrl: string;
    finalUrl: string;
    title: string;
    canonicalUrl?: string;
    botChallenge: boolean;
    extracted?: TabelogOutletIdentityExtraction["fields"];
  }>;
}

/**
 * Eval-only execution pause. It carries enough safe state to resume the exact
 * browser page after a human completes a site-provided verification.
 */
export interface TabelogUserInterventionRequired {
  state: "USER_INTERVENTION_REQUIRED";
  provider: "TABELOG";
  stage: "SEARCH" | "DETAIL" | "AVAILABILITY";
  candidate: { id: string; outletName: string };
  requestedSchedule: {
    date: string;
    timeWindow: { earliest: string; latest: string };
    partySize: number;
  };
  browser: BrowserSessionMetadata;
  page: { url: string; title: string };
}

/**
 * An explicit human-only pause hook. It never receives page HTML, cookies,
 * challenge tokens, credentials, or a mechanism to automate verification.
 */
export type TabelogUserInterventionHandler = (input: TabelogUserInterventionRequired) => Promise<void>;

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
