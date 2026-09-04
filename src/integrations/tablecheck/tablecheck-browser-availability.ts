import { groundTableCheckAvailability } from "../../domains/restaurant/read-grounding.js";
import type { RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import type { BrowserRuntime, BrowserSession, BrowserSessionMetadata, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserRuntimeError } from "../../infrastructure/browser/browser-runtime-errors.js";
import type { RestaurantAvailabilityProvider } from "../restaurant-availability/contracts.js";
import type { TableCheckAvailabilityPageObservation, TableCheckIdentityDiagnostic, TableCheckOutletIdentityExtraction } from "./tablecheck-contracts.js";
import { inspectTableCheckEntity } from "./tablecheck-entity-resolver.js";
import {
  hasTableCheckBotChallenge,
  hasTableCheckPageUnavailable,
  hasTableCheckSelectedRequest,
  parseTableCheckAvailabilitySlots,
  parseTableCheckOutletIdentityWithEvidence,
  parseTableCheckVerifiedHardCriteria,
  tableCheckGuideUrls,
  tableCheckPageExcerpt,
  tableCheckReservationUrl,
} from "./tablecheck-page-parser.js";

function diagnosticUrl(value: string): string {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "<invalid-url>";
  }
}

function selectedDateField(snapshot: BrowserSnapshot): string | undefined {
  return /<select[^>]+(?:name|id)=["'][^"']*(?:date|日付)[^"']*["']/i.test(snapshot.html)
    ? "select[name*='date'], select[id*='date']" : undefined;
}

function selectedPartyField(snapshot: BrowserSnapshot): string | undefined {
  return /<select[^>]+(?:name|id)=["'][^"']*(?:party|person|人数|guest|pax)[^"']*["']/i.test(snapshot.html)
    ? "select[name*='party'], select[name*='person'], select[name*='guest'], select[name*='pax']" : undefined;
}

export class TableCheckBrowserAvailability implements RestaurantAvailabilityProvider {
  readonly provider = "TABLECHECK" as const;
  readonly executionRoute = "GENERIC_BROWSER" as const;
  private sessionsOpened = 0;

  constructor(
    private readonly browser: BrowserRuntime,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly options: {
      maxBrowserSessions?: number;
      onIdentityDiagnostic?: (diagnostic: TableCheckIdentityDiagnostic) => void;
    } = {},
  ) {}

  private recordIdentityDiagnostic(diagnostic: TableCheckIdentityDiagnostic): void {
    try { this.options.onIdentityDiagnostic?.(structuredClone(diagnostic)); } catch { /* diagnostics never affect a read */ }
  }

  async check(request: RestaurantAvailabilityRequest, signal: AbortSignal) {
    const startedAt = Date.now();
    const offers = [] as import("../../domains/restaurant/contracts.js").AvailabilityOffer[];
    const evidence = [] as import("../../domains/restaurant/contracts.js").RestaurantReadEvidence[];
    const availabilityChecks: import("../../domains/restaurant/contracts.js").RestaurantAvailabilityRead["availabilityChecks"] = {};
    const candidateFactUpdates: NonNullable<import("../../domains/restaurant/contracts.js").RestaurantAvailabilityRead["candidateFactUpdates"]> = [];
    let lastMetadata: import("../../domains/restaurant/contracts.js").RestaurantReadExecutionMetadata["browser"];
    for (const candidate of request.candidates) {
      const result = await this.checkCandidate(candidate, request, signal);
      offers.push(...result.offers);
      evidence.push(...result.evidence);
      if (result.candidateFactUpdate) candidateFactUpdates.push(result.candidateFactUpdate);
      availabilityChecks[candidate.restaurant.id] = result.check;
      lastMetadata = result.browser ?? lastMetadata;
    }
    const failureCodes = request.candidateIds.map((candidateId) => availabilityChecks[candidateId]?.reasonCode).filter((value): value is string => value !== undefined);
    const commonFailureCode = failureCodes.length === request.candidateIds.length && failureCodes.every((value) => value === failureCodes[0]) ? failureCodes[0] : undefined;
    return {
      offers,
      availabilityChecks,
      evidence,
      ...(candidateFactUpdates.length ? { candidateFactUpdates } : {}),
      metadata: {
        provider: this.provider,
        route: this.executionRoute,
        latencyMs: Date.now() - startedAt,
        ...(commonFailureCode ? { failureCode: commonFailureCode } : {}),
        ...(lastMetadata ? { browser: lastMetadata } : {}),
      },
    };
  }

  private async checkCandidate(
    candidate: RestaurantAvailabilityRequest["candidates"][number],
    request: RestaurantAvailabilityRequest,
    signal: AbortSignal,
  ): Promise<{
    offers: import("../../domains/restaurant/contracts.js").AvailabilityOffer[];
    evidence: import("../../domains/restaurant/contracts.js").RestaurantReadEvidence[];
    check: import("../../domains/restaurant/contracts.js").RestaurantAvailabilityCheck;
    candidateFactUpdate?: { candidateId: string; matchReasons: string[]; evidenceIds: string[] };
    browser?: BrowserSessionMetadata;
  }> {
    const observedAt = this.now();
    const guideUrls = tableCheckGuideUrls(candidate.restaurant.outletName);
    if (!guideUrls.length) {
      return this.ground(candidate, request, {
        candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] }, pageState: "SOURCE_UNSUPPORTED", failureCode: "TABLECHECK_OUTLET_UNRESOLVED",
      });
    }
    if (this.sessionsOpened >= (this.options.maxBrowserSessions ?? Number.POSITIVE_INFINITY)) {
      return this.ground(candidate, request, {
        candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] }, pageState: "EXTRACTION_FAILED", failureCode: "READ_BUDGET_EXCEEDED",
      });
    }
    this.sessionsOpened += 1;
    let session: BrowserSession | undefined;
    const attemptedPages: TableCheckIdentityDiagnostic["attemptedPages"] = [];
    try {
      session = await this.browser.openSession({ signal });
      const browser = { ...session.metadata };
      let selected: { extraction: TableCheckOutletIdentityExtraction; inspection: ReturnType<typeof inspectTableCheckEntity> } | undefined;
      for (const guideUrl of guideUrls) {
        await session.navigate(guideUrl);
        const page = await session.snapshot();
        if (hasTableCheckBotChallenge(page)) {
          attemptedPages.push({ requestedUrl: diagnosticUrl(guideUrl), finalUrl: diagnosticUrl(page.url), title: page.title, botChallenge: true });
          continue;
        }
        if (hasTableCheckPageUnavailable(page)) {
          attemptedPages.push({ requestedUrl: diagnosticUrl(guideUrl), finalUrl: diagnosticUrl(page.url), title: page.title, botChallenge: false, pageUnavailable: true });
          continue;
        }
        const extraction = parseTableCheckOutletIdentityWithEvidence(page, guideUrl);
        if (!extraction) {
          attemptedPages.push({ requestedUrl: diagnosticUrl(guideUrl), finalUrl: diagnosticUrl(page.url), title: page.title, botChallenge: false });
          continue;
        }
        const inspection = inspectTableCheckEntity(candidate, extraction.outlet);
        attemptedPages.push({
          requestedUrl: diagnosticUrl(guideUrl), finalUrl: diagnosticUrl(page.url), title: page.title,
          ...(extraction.canonicalUrl ? { canonicalUrl: diagnosticUrl(extraction.canonicalUrl) } : {}),
          botChallenge: false, extracted: extraction.fields, comparison: inspection.comparison,
        });
        if (inspection.resolution.confidence === "HIGH") {
          selected = { extraction, inspection };
          break;
        }
      }
      const best = selected?.inspection;
      this.recordIdentityDiagnostic({
        candidateId: candidate.restaurant.id,
        candidate: structuredClone(candidate.restaurant),
        attemptedPages,
        resolution: best
          ? { confidence: best.resolution.confidence, matchedBy: [...best.resolution.matchedBy], reason: best.reason }
          : {
              confidence: "LOW",
              matchedBy: [],
              reason: attemptedPages.some((page) => page.botChallenge)
                ? "BOT_CHALLENGE"
                : attemptedPages.length > 0 && attemptedPages.every((page) => page.pageUnavailable)
                  ? "TABLECHECK_PAGE_UNAVAILABLE"
                  : "ENTITY_MATCH_UNCERTAIN",
            },
      });
      if (!selected) {
        const botOnly = attemptedPages.length > 0 && attemptedPages.every((page) => page.botChallenge);
        const unavailableOnly = attemptedPages.length > 0 && attemptedPages.every((page) => page.pageUnavailable);
        return this.ground(candidate, request, {
          candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] }, pageState: botOnly ? "BOT_CHALLENGE" : unavailableOnly ? "SOURCE_UNSUPPORTED" : "EXTRACTION_FAILED",
          failureCode: botOnly ? "BOT_CHALLENGE" : unavailableOnly ? "TABLECHECK_PAGE_UNAVAILABLE" : "ENTITY_MATCH_UNCERTAIN",
        }, browser);
      }
      const reservationUrl = tableCheckReservationUrl(selected.extraction.outlet.sourceUrl, request.date, request.partySize);
      if (!reservationUrl) return this.ground(candidate, request, {
        candidate, observedAt, sourceEntityId: selected.extraction.outlet.sourceEntityId, sourceUrl: selected.extraction.outlet.sourceUrl,
        entityMatch: selected.inspection.resolution, pageState: "SOURCE_UNSUPPORTED", failureCode: "TABLECHECK_RESERVATION_URL_UNSUPPORTED",
      }, browser);
      await session.navigate(reservationUrl);
      let page = await session.snapshot();
      if (hasTableCheckBotChallenge(page)) return this.ground(candidate, request, {
        candidate, observedAt, sourceEntityId: selected.extraction.outlet.sourceEntityId, sourceUrl: selected.extraction.outlet.sourceUrl,
        entityMatch: selected.inspection.resolution, pageState: "BOT_CHALLENGE", failureCode: "BOT_CHALLENGE", excerpt: tableCheckPageExcerpt(page),
      }, browser);
      const party = selectedPartyField(page);
      const date = selectedDateField(page);
      if (party) {
        const values = await session.select(party, String(request.partySize));
        if (!values.includes(String(request.partySize))) return this.ground(candidate, request, {
          candidate, observedAt, sourceEntityId: selected.extraction.outlet.sourceEntityId, sourceUrl: selected.extraction.outlet.sourceUrl,
          entityMatch: selected.inspection.resolution, pageState: "EXTRACTION_FAILED", failureCode: "PARTY_SELECTION_UNCONFIRMED",
        }, browser);
      }
      if (date) {
        const values = await session.select(date, request.date);
        if (!values.includes(request.date)) return this.ground(candidate, request, {
          candidate, observedAt, sourceEntityId: selected.extraction.outlet.sourceEntityId, sourceUrl: selected.extraction.outlet.sourceUrl,
          entityMatch: selected.inspection.resolution, pageState: "EXTRACTION_FAILED", failureCode: "DATE_SELECTION_UNCONFIRMED",
        }, browser);
      }
      if (party || date) page = await session.snapshot();
      if (!hasTableCheckSelectedRequest(page, request.date, request.partySize) && !(party && date)) return this.ground(candidate, request, {
        candidate, observedAt, sourceEntityId: selected.extraction.outlet.sourceEntityId, sourceUrl: selected.extraction.outlet.sourceUrl,
        entityMatch: selected.inspection.resolution, pageState: "EXTRACTION_FAILED", failureCode: "REQUEST_SELECTION_UNCONFIRMED",
      }, browser);
      const slots = parseTableCheckAvailabilitySlots(page);
      const qualifying = slots.availableSlots.some((slot) => slot >= request.timeWindow.earliest && slot <= request.timeWindow.latest);
      return this.ground(candidate, request, {
        candidate, observedAt: this.now(), sourceEntityId: selected.extraction.outlet.sourceEntityId, sourceUrl: selected.extraction.outlet.sourceUrl,
        entityMatch: selected.inspection.resolution, requestedDate: request.date, requestedPartySize: request.partySize,
        pageState: qualifying ? "AVAILABLE" : slots.hasExplicitSlotUi ? "NO_MATCHING_SLOT" : "EXTRACTION_FAILED",
        visibleSlots: slots.availableSlots,
        verifiedHardCriteria: parseTableCheckVerifiedHardCriteria(page, request.hardCriteria),
        excerpt: tableCheckPageExcerpt(page),
      }, browser);
    } catch (error) {
      const failureCode = error instanceof BrowserRuntimeError
        ? (error.code === "BROWSER_ABORTED" ? "BROWSER_TIMEOUT" : error.code)
        : "BROWSER_RUNTIME_FAILED";
      return this.ground(candidate, request, {
        candidate, observedAt: this.now(), entityMatch: { confidence: "LOW", matchedBy: [] }, pageState: "EXTRACTION_FAILED", failureCode,
      }, session ? { ...session.metadata } : undefined);
    } finally {
      await session?.close();
    }
  }

  private ground(
    candidate: RestaurantAvailabilityRequest["candidates"][number],
    request: RestaurantAvailabilityRequest,
    observation: TableCheckAvailabilityPageObservation,
    metadata?: BrowserSessionMetadata,
  ) {
    const grounded = groundTableCheckAvailability(candidate, request, {
      candidateId: candidate.restaurant.id,
      ...(observation.sourceEntityId ? { sourceEntityId: observation.sourceEntityId } : {}),
      ...(observation.sourceUrl ? { sourceUrl: observation.sourceUrl } : {}),
      observedAt: observation.observedAt,
      ...(observation.requestedDate ? { requestedDate: observation.requestedDate } : {}),
      ...(observation.requestedPartySize !== undefined ? { requestedPartySize: observation.requestedPartySize } : {}),
      entityMatch: observation.entityMatch,
      pageState: observation.pageState,
      ...(observation.visibleSlots ? { visibleSlots: observation.visibleSlots } : {}),
      ...(observation.verifiedHardCriteria ? { verifiedHardCriteria: observation.verifiedHardCriteria } : {}),
      ...(observation.excerpt ? { excerpt: observation.excerpt } : {}),
      ...(observation.failureCode ? { failureCode: observation.failureCode } : {}),
    }, this.now());
    return { ...grounded, ...(metadata ? { browser: metadata } : {}) };
  }
}
