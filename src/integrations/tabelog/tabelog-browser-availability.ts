import type { RestaurantAvailabilityPort } from "../../application/restaurant-execution-router.js";
import { groundTabelogAvailability } from "../../domains/restaurant/read-grounding.js";
import type { RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import type { BrowserRuntime, BrowserSession, BrowserSessionMetadata } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserRuntimeError } from "../../infrastructure/browser/browser-runtime-errors.js";
import { resolveTabelogEntity } from "./tabelog-entity-resolver.js";
import {
  detectExternalReservationRedirect,
  hasBotChallenge,
  hasReservationControls,
  isTabelogUrl,
  pageExcerpt,
  parseTabelogSearchOutlets,
  parseTabelogAvailabilitySlots,
  parseTabelogOutletIdentity,
  parseTabelogVerifiedHardCriteria,
} from "./tabelog-page-parser.js";
import type { TabelogAvailabilityPageObservation } from "./tabelog-contracts.js";

function searchUrl(candidateName: string): string {
  return `https://tabelog.com/rstLst/?sk=${encodeURIComponent(candidateName)}`;
}

function selectedDateField(snapshotHtml: string): string | undefined {
  return /<select[^>]+(?:name|id)=["'][^"']*(?:date|日付)[^"']*["']/i.test(snapshotHtml)
    ? "select[name*='date'], select[id*='date']" : undefined;
}

function selectedPartyField(snapshotHtml: string): string | undefined {
  return /<select[^>]+(?:name|id)=["'][^"']*(?:party|person|人数|guest)[^"']*["']/i.test(snapshotHtml)
    ? "select[name*='party'], select[name*='person'], select[name*='guest']" : undefined;
}

export class TabelogBrowserAvailability implements RestaurantAvailabilityPort {
  readonly executionRoute = "GENERIC_BROWSER" as const;
  private sessionsOpened = 0;

  constructor(
    private readonly browser: BrowserRuntime,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly maxCandidateMatches = 5,
    private readonly options: { maxBrowserSessions?: number } = {},
  ) {}

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
      lastMetadata = result.browser;
    }
    return {
      offers,
      availabilityChecks,
      evidence,
      ...(candidateFactUpdates.length ? { candidateFactUpdates } : {}),
      metadata: {
        provider: "TABELOG" as const,
        route: this.executionRoute,
        latencyMs: Date.now() - startedAt,
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
    let session: BrowserSession | undefined;
    const observedAt = this.now();
    try {
      if (this.sessionsOpened >= (this.options.maxBrowserSessions ?? Number.POSITIVE_INFINITY)) {
        return {
          offers: [],
          evidence: [],
          check: { status: "UNKNOWN", checkedAt: observedAt, evidenceIds: [], reasonCode: "READ_BUDGET_EXCEEDED" },
        };
      }
      this.sessionsOpened += 1;
      session = await this.browser.openSession({ signal });
      const browser = { ...session.metadata };
      await session.navigate(searchUrl(candidate.restaurant.outletName));
      const search = await session.snapshot();
      if (hasBotChallenge(search)) return this.ground(candidate, request, { candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] }, pageState: "BOT_CHALLENGE", excerpt: pageExcerpt(search) }, browser);
      const outlets = parseTabelogSearchOutlets(search).slice(0, this.maxCandidateMatches);
      const outletPages = new Map<string, import("../../infrastructure/browser/browser-runtime.js").BrowserSnapshot>();
      const enrichedOutlets = [] as typeof outlets;
      for (const outlet of outlets) {
        await session.navigate(outlet.sourceUrl);
        const outletPage = await session.snapshot();
        if (hasBotChallenge(outletPage)) continue;
        outletPages.set(outlet.sourceUrl, outletPage);
        enrichedOutlets.push(parseTabelogOutletIdentity(outletPage, outlet));
      }
      const resolved = resolveTabelogEntity(candidate, enrichedOutlets);
      if (resolved.confidence !== "HIGH" || !resolved.outlet) return this.ground(candidate, request, { candidate, observedAt, entityMatch: resolved, pageState: "EXTRACTION_FAILED", failureCode: "ENTITY_MATCH_UNCERTAIN", excerpt: pageExcerpt(search) }, browser);
      if (!isTabelogUrl(resolved.outlet.sourceUrl)) return this.ground(candidate, request, { candidate, observedAt, entityMatch: resolved, pageState: "SOURCE_UNSUPPORTED", failureCode: "EXTERNAL_BOOKING_PROVIDER_REQUIRED" }, browser);
      let page = outletPages.get(resolved.outlet.sourceUrl);
      if (!page) {
        await session.navigate(resolved.outlet.sourceUrl);
        page = await session.snapshot();
      }
      if (hasBotChallenge(page)) return this.ground(candidate, request, { candidate, observedAt, sourceEntityId: resolved.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: resolved, pageState: "BOT_CHALLENGE", excerpt: pageExcerpt(page) }, browser);
      if (detectExternalReservationRedirect(page)) return this.ground(candidate, request, { candidate, observedAt, sourceEntityId: resolved.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: resolved, pageState: "SOURCE_UNSUPPORTED", failureCode: "EXTERNAL_BOOKING_PROVIDER_REQUIRED", excerpt: pageExcerpt(page) }, browser);
      if (!hasReservationControls(page)) return this.ground(candidate, request, { candidate, observedAt, sourceEntityId: resolved.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: resolved, pageState: "SOURCE_UNSUPPORTED", failureCode: "ONLINE_AVAILABILITY_UNSUPPORTED", excerpt: pageExcerpt(page) }, browser);
      const party = selectedPartyField(page.html);
      const date = selectedDateField(page.html);
      if (!party || !date) return this.ground(candidate, request, { candidate, observedAt, sourceEntityId: resolved.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: resolved, pageState: "EXTRACTION_FAILED", failureCode: "EXTRACTION_FAILED", excerpt: pageExcerpt(page) }, browser);
      const selectedParty = await session.select(party, String(request.partySize));
      if (!selectedParty.includes(String(request.partySize))) return this.ground(candidate, request, { candidate, observedAt, sourceEntityId: resolved.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: resolved, pageState: "EXTRACTION_FAILED", failureCode: "PARTY_SELECTION_UNCONFIRMED", excerpt: pageExcerpt(page) }, browser);
      const selectedDate = await session.select(date, request.date);
      if (!selectedDate.includes(request.date)) return this.ground(candidate, request, { candidate, observedAt, sourceEntityId: resolved.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: resolved, pageState: "EXTRACTION_FAILED", failureCode: "DATE_SELECTION_UNCONFIRMED", excerpt: pageExcerpt(page) }, browser);
      page = await session.snapshot();
      const slotParse = parseTabelogAvailabilitySlots(page);
      const slots = slotParse.availableSlots;
      const hasQualifyingSlot = slots.some((slot) => slot >= request.timeWindow.earliest && slot <= request.timeWindow.latest);
      return this.ground(candidate, request, {
        candidate,
        observedAt: this.now(),
        sourceEntityId: resolved.outlet.sourceEntityId,
        sourceUrl: page.url,
        entityMatch: resolved,
        requestedDate: request.date,
        requestedPartySize: request.partySize,
        pageState: hasQualifyingSlot ? "AVAILABLE" : slotParse.hasExplicitSlotUi ? "NO_MATCHING_SLOT" : "EXTRACTION_FAILED",
        visibleSlots: slots,
        verifiedHardCriteria: parseTabelogVerifiedHardCriteria(page, request.hardCriteria),
        excerpt: pageExcerpt(page),
      }, browser);
    } catch (error) {
      const failureCode = error instanceof BrowserRuntimeError
        ? (error.code === "BROWSER_ABORTED" ? "BROWSER_TIMEOUT" : error.code)
        : "BROWSER_RUNTIME_FAILED";
      return this.ground(candidate, request, {
        candidate,
        observedAt: this.now(),
        entityMatch: { confidence: "LOW", matchedBy: [] },
        pageState: "EXTRACTION_FAILED",
        failureCode,
      }, session ? { ...session.metadata } : undefined);
    } finally {
      await session?.close();
    }
  }

  private ground(
    candidate: RestaurantAvailabilityRequest["candidates"][number],
    request: RestaurantAvailabilityRequest,
    observation: TabelogAvailabilityPageObservation,
    metadata?: BrowserSessionMetadata,
  ) {
    const grounded = groundTabelogAvailability(candidate, request, {
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
