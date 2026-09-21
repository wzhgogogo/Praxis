import type { RestaurantCandidate } from "../../domains/restaurant/contracts.js";
import type { BrowserSessionMetadata } from "../../infrastructure/browser/browser-runtime.js";

export type TableCheckIdentityEvidenceSource = "TABLECHECK_URL" | "JSON_LD" | "DOM" | "TEL_LINK" | "ABSENT";

export interface TableCheckIdentityField {
  value?: string;
  normalizedValue?: string;
  source: TableCheckIdentityEvidenceSource;
}

export interface TableCheckOutletObservation {
  sourceEntityId: string;
  sourceUrl: string;
  outletName: string;
  address?: string;
  phone?: string;
}

export interface TableCheckEntityResolution {
  confidence: "HIGH" | "MEDIUM" | "LOW";
  matchedBy: string[];
  outlet?: TableCheckOutletObservation;
}

export interface TableCheckOutletIdentityExtraction {
  outlet: TableCheckOutletObservation;
  canonicalUrl?: string;
  fields: {
    outletName: TableCheckIdentityField;
    address: TableCheckIdentityField;
    phone: TableCheckIdentityField;
  };
}

/** Eval-only public-page diagnostic. It is not Restaurant Domain evidence. */
export interface TableCheckIdentityDiagnostic {
  candidateId: string;
  candidate: Pick<RestaurantCandidate["restaurant"], "outletName" | "address" | "sourceIds">;
  discovery: {
    requestedUrl: string;
    finalUrl: string;
    title: string;
    status: "RESULTS" | "NO_RESULT" | "PAGE_UNAVAILABLE" | "PARSE_FAILED" | "EXPLORATION_EXHAUSTED" | "BOT_CHALLENGE";
    discoveredOutletUrls: string[];
    unavailableSignals?: Array<{ source: "TITLE" | "PRIMARY_HEADING"; value: string }>;
    handoff?: { reason: string; outcome: "COMPLETED" | "MODEL_HANDOFF" | "REQUESTED_HUMAN_HELP" | "NO_SAFE_ACTION" | "BUDGET_EXCEEDED" | "MODEL_FAILURE" };
  };
  attemptedPages: Array<{
    requestedUrl: string;
    finalUrl: string;
    title: string;
    canonicalUrl?: string;
    botChallenge: boolean;
    pageUnavailable?: boolean;
    extracted?: TableCheckOutletIdentityExtraction["fields"];
    comparison?: { outletName: "MATCH" | "CONFLICT" | "MISSING"; address: "MATCH" | "CONFLICT" | "INSUFFICIENT" | "MISSING"; phone: "MATCH" | "CONFLICT" | "MISSING" };
    reservation?: { kind: "EMBEDDED_AVAILABILITY" | "LINKED_PAGE"; url: string };
  }>;
  resolution: { confidence: TableCheckEntityResolution["confidence"]; matchedBy: string[]; reason: "HIGH_EXACT_PHONE" | "HIGH_NAME_AND_ADDRESS" | "KNOWN_PHONE_CONFLICT" | "NAME_ONLY_MATCH" | "NO_COMPARABLE_IDENTITY_SIGNAL" | "BOT_CHALLENGE" | "MODEL_FAILURE" | "READ_BUDGET_EXCEEDED" | "TABLECHECK_DISCOVERY_NO_RESULT" | "TABLECHECK_DISCOVERY_INCOMPLETE" | "TABLECHECK_ENTITY_MATCH_UNCERTAIN" | "TABLECHECK_PAGE_UNAVAILABLE" | "TABLECHECK_PARSE_FAILED" };
}

export interface TableCheckAvailabilityPageObservation {
  candidate: RestaurantCandidate;
  sourceEntityId?: string;
  sourceUrl?: string;
  observedAt: string;
  requestedDate?: string;
  requestedPartySize?: number;
  entityMatch: TableCheckEntityResolution;
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

/** Eval-only pause metadata. It never exposes page content, credentials, or a solver. */
export interface TableCheckUserInterventionRequired {
  state: "USER_INTERVENTION_REQUIRED";
  provider: "TABLECHECK";
  stage: "DISCOVERY" | "IDENTITY" | "AVAILABILITY";
  candidate: { id: string; outletName: string };
  requestedSchedule: {
    date: string;
    timeWindow: { earliest: string; latest: string };
    partySize: number;
  };
  browser: BrowserSessionMetadata;
  page: { url: string; title: string };
}

/** One human pause can resume the exact source page; it cannot automate verification. */
export type TableCheckUserInterventionHandler = (input: TableCheckUserInterventionRequired) => Promise<void>;
