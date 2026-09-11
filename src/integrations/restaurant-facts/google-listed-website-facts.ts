import { createHash } from "node:crypto";

import type { RestaurantCandidateFactPort } from "../../application/restaurant-execution-router.js";
import {
  groundRestaurantWebsiteFacts,
  type UntrustedRestaurantWebsiteObservation,
} from "../../domains/restaurant/read-grounding.js";
import type {
  RestaurantCandidate,
  RestaurantCandidateFactRead,
  RestaurantCandidateFactRequest,
} from "../../domains/restaurant/contracts.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";

function normalized(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "").trim();
}

function safeWebsiteUrl(value: string | undefined): URL | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) return undefined;
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return undefined;
  }
}

function recordsFromJsonLd(html: string): Record<string, unknown>[] {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const values: unknown[] = [];
  for (const script of scripts) {
    try { values.push(JSON.parse(script[1] ?? "")); } catch { /* malformed source data is unknown */ }
  }
  const flatten = (value: unknown): Record<string, unknown>[] => {
    if (Array.isArray(value)) return value.flatMap(flatten);
    if (!value || typeof value !== "object") return [];
    const record = value as Record<string, unknown>;
    return [record, ...flatten(record["@graph"])];
  };
  return values.flatMap(flatten);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.flatMap(strings) : typeof value === "string" && value.trim() ? [value.trim()] : [];
}

function typeNames(record: Record<string, unknown>): string[] {
  return strings(record["@type"]).map((value) => value.toLocaleLowerCase("en-US"));
}

function structuredAddress(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const values = ["streetAddress", "addressLocality", "addressRegion", "postalCode", "addressCountry"]
    .flatMap((key) => strings(record[key]));
  return values.length ? values.join(" ") : undefined;
}

function hoursFromSpecification(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((spec) => {
    if (!spec || typeof spec !== "object" || Array.isArray(spec)) return [];
    const record = spec as Record<string, unknown>;
    const opens = strings(record.opens)[0]?.replace(/:(\d{2})$/, "");
    const closes = strings(record.closes)[0]?.replace(/:(\d{2})$/, "");
    const days = strings(record.dayOfWeek).map((day) => day.replace(/^https?:\/\/schema\.org\//i, ""));
    return opens && closes && days.length ? days.map((day) => `${day}: ${opens} - ${closes}`) : [];
  });
}

function candidateStructuredObservation(
  candidate: RestaurantCandidate,
  sourceUrl: string,
  observedAt: string,
  html: string,
): UntrustedRestaurantWebsiteObservation | undefined {
  const candidateName = normalized(candidate.restaurant.outletName);
  const candidateAddress = normalized(candidate.restaurant.address);
  const record = recordsFromJsonLd(html).find((item) => {
    const kinds = typeNames(item);
    if (!kinds.some((kind) => kind === "restaurant" || kind === "cafeorcoffeeshop" || kind === "foodestablishment")) return false;
    const name = strings(item.name)[0];
    const address = structuredAddress(item.address);
    return name !== undefined && address !== undefined && normalized(name) === candidateName && normalized(address) === candidateAddress;
  });
  if (!record) return undefined;
  return {
    candidateId: candidate.restaurant.id,
    sourceUrl,
    observedAt,
    entityMatch: { confidence: "HIGH", matchedBy: ["STRUCTURED_WEBSITE_NAME_AND_ADDRESS"] },
    restaurantTypeFacts: strings(record.servesCuisine),
    regularOpeningHours: [...strings(record.openingHours), ...hoursFromSpecification(record.openingHoursSpecification)],
  };
}

/**
 * Bounded generic browser read of a Google-listed candidate website.  It
 * accepts only deterministic JSON-LD facts that identify the same outlet;
 * visible page prose and model interpretation cannot create a fact here.
 */
export class GoogleListedWebsiteFactRead implements RestaurantCandidateFactPort {
  readonly executionRoute = "GENERIC_BROWSER" as const;

  constructor(
    private readonly runtime: BrowserRuntime,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async inspectFacts(request: RestaurantCandidateFactRequest, signal: AbortSignal): Promise<RestaurantCandidateFactRead> {
    const startedAt = Date.now();
    const evidence: RestaurantCandidateFactRead["evidence"] = [];
    const factChecks: RestaurantCandidateFactRead["factChecks"] = {};
    for (const candidate of request.candidates) {
      const listed = safeWebsiteUrl(candidate.restaurant.sourceIds.googleWebsiteUri);
      const checkedAt = this.now();
      if (!listed) {
        factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "GOOGLE_LISTED_WEBSITE_URL_MISSING" };
        continue;
      }
      const executor = new BrowserTaskExecutor(this.runtime, { maxAutomaticElapsedMs: 12_000, maxOperationsPerCandidate: 3 });
      try {
        executor.beginCandidate(candidate.restaurant.id);
        const session = await executor.acquire(signal, "WEBSITE", "FACTS");
        await executor.navigate({ source: "WEBSITE", stage: "FACTS", signal, allowedOrigins: [listed.origin], session, url: listed.toString() });
        const snapshot = await executor.snapshot({ source: "WEBSITE", stage: "FACTS", signal, session });
        const landed = safeWebsiteUrl(snapshot.url);
        const observation = landed?.origin === listed.origin
          ? candidateStructuredObservation(candidate, landed.toString(), checkedAt, snapshot.html)
          : undefined;
        if (!observation) {
          factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "WEBSITE_STRUCTURED_IDENTITY_UNVERIFIED" };
          continue;
        }
        const grounded = groundRestaurantWebsiteFacts(candidate, request.intent, observation);
        evidence.push(...grounded.evidence);
        factChecks[candidate.restaurant.id] = {
          status: grounded.status,
          checkedAt,
          evidenceIds: grounded.evidence.map((item) => item.evidenceId),
          ...(grounded.reasonCode ? { reasonCode: grounded.reasonCode } : {}),
        };
      } catch {
        factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "WEBSITE_FACT_READ_FAILED" };
      } finally {
        await executor.close();
      }
    }
    return {
      evidence,
      factChecks,
      metadata: { provider: "RESTAURANT_WEBSITE", route: this.executionRoute, latencyMs: Date.now() - startedAt },
    };
  }
}

export function websiteFactDocumentFingerprint(html: string): string {
  return createHash("sha256").update(html).digest("hex");
}
