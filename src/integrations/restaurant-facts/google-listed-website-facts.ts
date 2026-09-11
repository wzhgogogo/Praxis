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
import type { BrowserReadActionDecisionPort } from "../../infrastructure/browser/browser-action-decision.js";

function normalized(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "").trim();
}

/**
 * Website and Google addresses can differ only in punctuation or ordering.
 * A name alone never identifies an outlet; absent or contradictory address
 * components still fail closed.
 */
function addressMatches(candidateAddress: string, observedAddress: string): boolean {
  const expected = normalized(candidateAddress); const observed = normalized(observedAddress);
  if (!expected || !observed) return false;
  if (expected.includes(observed) || observed.includes(expected)) return true;
  const expectedNumbers = candidateAddress.normalize("NFKC").match(/\d+/gu) ?? [];
  const observedNumbers = observedAddress.normalize("NFKC").match(/\d+/gu) ?? [];
  return expectedNumbers.length > 0 && expectedNumbers.length === observedNumbers.length && expectedNumbers.every((value, index) => value === observedNumbers[index]);
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
    // Schema.org permits HH:mm and HH:mm:ss.  Strip seconds only; stripping
    // every final :NN silently turns 09:30 into 09:00.
    const opens = strings(record.opens)[0]?.replace(/^(\d{1,2}:\d{2}):\d{2}$/, "$1");
    const closes = strings(record.closes)[0]?.replace(/^(\d{1,2}:\d{2}):\d{2}$/, "$1");
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
    return name !== undefined && address !== undefined && normalized(name) === candidateName && addressMatches(candidate.restaurant.address, address);
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
 * A public page can expose facts without JSON-LD.  This parser remains narrow:
 * it first proves the exact candidate name and address are both visible, then
 * accepts only labelled cuisine/type or weekday-hour lines.  The browser model
 * may navigate to an observed page, but it never supplies these facts.
 */
function candidateVisibleObservation(
  candidate: RestaurantCandidate,
  sourceUrl: string,
  observedAt: string,
  visibleText: string,
): UntrustedRestaurantWebsiteObservation | undefined {
  const text = visibleText.replace(/\s+/gu, " ").trim();
  const normalizedText = normalized(text);
  const candidateName = normalized(candidate.restaurant.outletName);
  const candidateAddress = normalized(candidate.restaurant.address);
  if (!candidateName || !candidateAddress || !normalizedText.includes(candidateName) || !addressMatches(candidate.restaurant.address, text)) return undefined;
  const lines = visibleText.split(/\r?\n/).map((line) => line.replace(/\s+/gu, " ").trim()).filter(Boolean);
  const restaurantTypeFacts = [
    ...(/\b(?:cafe|coffee\s*shop|restaurant|bistro|bakery)\b/iu.test(text) ? [text.match(/\b(?:cafe|coffee\s*shop|restaurant|bistro|bakery)\b/iu)?.[0] ?? ""] : []),
    ...lines.filter((line) => /(?:cuisine|料理|cafe|coffee|restaurant)/iu.test(line)).slice(0, 3),
  ].filter(Boolean);
  const regularOpeningHours = lines.filter((line) =>
    /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/iu.test(line) && /\b\d{1,2}:\d{2}/u.test(line),
  ).slice(0, 7);
  return {
    candidateId: candidate.restaurant.id,
    sourceUrl,
    observedAt,
    entityMatch: { confidence: "HIGH", matchedBy: ["VISIBLE_WEBSITE_NAME_AND_ADDRESS_COMPONENTS"] },
    ...(restaurantTypeFacts.length ? { restaurantTypeFacts } : {}),
    ...(regularOpeningHours.length ? { regularOpeningHours } : {}),
  };
}

/**
 * Bounded generic browser investigation of a Google-listed candidate website.
 * JSON-LD is fast-path evidence, while visible, candidate-bound public facts
 * are a second path.  The model can only navigate observed safe controls; it
 * cannot write Task State or invent a fact.
 */
export class GoogleListedWebsiteFactRead implements RestaurantCandidateFactPort {
  readonly executionRoute = "GENERIC_BROWSER" as const;

  constructor(
    private readonly runtime: BrowserRuntime,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly modelDecision?: BrowserReadActionDecisionPort,
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
      const executor = new BrowserTaskExecutor(this.runtime, {
        ...(this.modelDecision ? { modelDecision: this.modelDecision, maxModelCallsPerCandidate: 2, maxModelCallsTotal: 2 } : {}),
        maxAutomaticElapsedMs: 12_000,
        maxOperationsPerCandidate: 4,
      });
      try {
        executor.beginCandidate(candidate.restaurant.id);
        const session = await executor.acquire(signal, "WEBSITE", "FACTS");
        await executor.navigate({ source: "WEBSITE", stage: "FACTS", signal, allowedOrigins: [listed.origin], session, url: listed.toString() });
        const generic = await executor.runSkill({
          taskId: request.readRunId ?? candidate.restaurant.id,
          source: "WEBSITE",
          stage: "FACTS",
          signal,
          session,
          allowedOrigins: [listed.origin],
          goal: { outlet: { name: candidate.restaurant.outletName, address: candidate.restaurant.address }, date: request.intent.date ?? "unscheduled", partySize: 1, timeWindow: request.intent.timeWindow ?? { earliest: "00:00", latest: "00:00" }, hardCriteria: request.intent.criteria.map((criterion) => criterion.text) },
          objective: "Find public candidate-bound type or opening-hours facts; never log in or submit.",
          completion: (page) => {
            const landed = safeWebsiteUrl(page.url);
            const sourceUrl = landed?.origin === listed.origin ? landed.toString() : undefined;
            const found = sourceUrl && (candidateStructuredObservation(candidate, sourceUrl, checkedAt, page.html) || candidateVisibleObservation(candidate, sourceUrl, checkedAt, page.text));
            return { complete: found !== undefined, reason: "No candidate-bound public fact is visible yet" };
          },
        });
        const snapshot = generic.snapshot;
        const landed = safeWebsiteUrl(snapshot.url);
        const observation = landed?.origin === listed.origin
          ? candidateStructuredObservation(candidate, landed.toString(), checkedAt, snapshot.html)
            ?? candidateVisibleObservation(candidate, landed.toString(), checkedAt, snapshot.text)
          : undefined;
        if (!observation) {
          factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "WEBSITE_STRUCTURED_IDENTITY_UNVERIFIED" };
          continue;
        }
        const grounded = groundRestaurantWebsiteFacts(candidate, request.intent, observation);
        const excerpt = websiteFactDocumentFingerprint(snapshot.text);
        evidence.push(...grounded.evidence.map((item) => ({
          ...item,
          artifactRef: { kind: "DOM_EXCERPT" as const, reference: `website-visible:${excerpt}` },
        })));
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
