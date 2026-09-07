import { groundTabelogAvailability } from "../../domains/restaurant/read-grounding.js";
import type { RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import type { BrowserRuntime, BrowserSession, BrowserSessionMetadata, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type { RestaurantAvailabilityProvider } from "../restaurant-availability/contracts.js";
import { BrowserRuntimeError } from "../../infrastructure/browser/browser-runtime-errors.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import { inspectTabelogEntity } from "./tabelog-entity-resolver.js";
import {
  detectExternalReservationRedirect,
  hasBotChallenge,
  hasReservationControls,
  isTabelogUrl,
  pageExcerpt,
  parseTabelogSearchOutlets,
  parseTabelogAvailabilitySlots,
  parseTabelogOutletIdentityWithEvidence,
  parseTabelogVerifiedHardCriteria,
} from "./tabelog-page-parser.js";
import type {
  TabelogAvailabilityPageObservation,
  TabelogIdentityDiagnostic,
  TabelogOutletIdentityExtraction,
  TabelogUserInterventionHandler,
} from "./tabelog-contracts.js";

function searchUrl(candidateName: string): string {
  return `https://tabelog.com/en/rstLst/?sw=${encodeURIComponent(candidateName)}`;
}

/** Browser redirects may append short-lived challenge tokens; never persist them in eval diagnostics. */
function diagnosticUrl(value: string): string {
  try {
    const url = new URL(value);
    const searchQuery = url.pathname === "/en/rstLst/" ? url.searchParams.get("sw") : undefined;
    url.search = searchQuery === null || searchQuery === undefined ? "" : `?sw=${encodeURIComponent(searchQuery)}`;
    url.hash = "";
    return url.toString();
  } catch {
    return "<invalid-url>";
  }
}

function selectedDateField(snapshotHtml: string): string | undefined {
  return /<select[^>]+(?:name|id)=["'][^"']*(?:date|日付)[^"']*["']/i.test(snapshotHtml)
    ? "select[name*='date'], select[id*='date']" : undefined;
}

function selectedPartyField(snapshotHtml: string): string | undefined {
  return /<select[^>]+(?:name|id)=["'][^"']*(?:party|person|人数|guest)[^"']*["']/i.test(snapshotHtml)
    ? "select[name*='party'], select[name*='person'], select[name*='guest']" : undefined;
}

export class TabelogBrowserAvailability implements RestaurantAvailabilityProvider {
  readonly provider = "TABELOG" as const;
  readonly executionRoute = "GENERIC_BROWSER" as const;
  private sessionsOpened = 0;
  private readonly executor: BrowserTaskExecutor;
  private readonly ownsExecutor: boolean;

  constructor(
    browser: BrowserRuntime | BrowserTaskExecutor,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly maxCandidateMatches = 5,
    private readonly options: {
      maxBrowserSessions?: number;
      /** Eval-only sink for sanitized identity diagnostics; it never changes Domain State or grounding. */
      onIdentityDiagnostic?: (diagnostic: TabelogIdentityDiagnostic) => void;
      /** Eval-only explicit pause; absence preserves the ordinary fail-closed BOT_CHALLENGE path. */
      onUserInterventionRequired?: TabelogUserInterventionHandler;
    } = {},
  ) {
    if (browser instanceof BrowserTaskExecutor) {
      this.ownsExecutor = false;
      this.executor = browser;
    } else {
      this.ownsExecutor = true;
      this.executor = new BrowserTaskExecutor(browser);
    }
  }

  private recordIdentityDiagnostic(diagnostic: TabelogIdentityDiagnostic): void {
    try {
      this.options.onIdentityDiagnostic?.(structuredClone(diagnostic));
    } catch {
      // Diagnostics cannot alter the result of an external read.
    }
  }

  /**
   * The handler only pauses for a human. We deliberately neither navigate nor
   * retry here: the post-intervention snapshot is from the same page/session.
   */
  private async resumeAfterUserIntervention(
    candidate: RestaurantAvailabilityRequest["candidates"][number],
    request: RestaurantAvailabilityRequest,
    session: BrowserSession,
    page: BrowserSnapshot,
    stage: "SEARCH" | "DETAIL" | "AVAILABILITY",
    signal: AbortSignal,
  ): Promise<BrowserSnapshot> {
    if (!hasBotChallenge(page) || !this.options.onUserInterventionRequired) return page;
    await this.options.onUserInterventionRequired({
      state: "USER_INTERVENTION_REQUIRED",
      provider: "TABELOG",
      stage,
      candidate: { id: candidate.restaurant.id, outletName: candidate.restaurant.outletName },
      requestedSchedule: {
        date: request.date,
        timeWindow: structuredClone(request.timeWindow),
        partySize: request.partySize,
      },
      browser: structuredClone(session.metadata),
      page: { url: diagnosticUrl(page.url), title: page.title },
    });
    return this.executor.snapshot({ source: "TABELOG", stage: stage === "DETAIL" ? "IDENTITY" : stage === "SEARCH" ? "DISCOVERY" : "AVAILABILITY", signal, session });
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
      lastMetadata = result.browser;
    }
    const failureCodes = request.candidateIds
      .map((candidateId) => availabilityChecks[candidateId]?.reasonCode)
      .filter((code): code is string => code !== undefined);
    const commonFailureCode = failureCodes.length === request.candidateIds.length &&
      failureCodes.every((code) => code === failureCodes[0])
      ? failureCodes[0]
      : undefined;
    return {
      offers,
      availabilityChecks,
      evidence,
      ...(candidateFactUpdates.length ? { candidateFactUpdates } : {}),
      metadata: {
        provider: "TABELOG" as const,
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
      this.executor.beginCandidate(candidate.restaurant.id);
      session = await this.executor.acquire(signal, "TABELOG", "DISCOVERY");
      const browser = { ...session.metadata };
      const requestedSearchUrl = searchUrl(candidate.restaurant.outletName);
      await this.executor.navigate({
        source: "TABELOG", stage: "DISCOVERY", signal, allowedOrigins: ["https://tabelog.com"], session, url: requestedSearchUrl,
      });
      let search = await this.executor.snapshot({ source: "TABELOG", stage: "DISCOVERY", signal, session });
      search = await this.resumeAfterUserIntervention(candidate, request, session, search, "SEARCH", signal);
      if (hasBotChallenge(search)) {
        const inspection = inspectTabelogEntity(candidate, []);
        this.recordIdentityDiagnostic({
          ...inspection.diagnostic,
          resolution: { ...inspection.diagnostic.resolution, reason: "SEARCH_BOT_CHALLENGE" },
          search: {
            query: candidate.restaurant.outletName,
            requestedUrl: diagnosticUrl(requestedSearchUrl),
            finalUrl: diagnosticUrl(search.url),
            title: search.title,
            parsedResultCount: 0,
            inspectedResultCount: 0,
          },
          searchResults: [],
          details: [],
        });
        return this.ground(candidate, request, { candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] }, pageState: "BOT_CHALLENGE", excerpt: pageExcerpt(search) }, browser);
      }
      let outlets = parseTabelogSearchOutlets(search).slice(0, this.maxCandidateMatches);
      if (!outlets.length) {
        const generic = await this.executor.runSkill({
          taskId: `browser-read:${candidate.restaurant.id}`,
          source: "TABELOG",
          stage: "DISCOVERY",
          session,
          signal,
          allowedOrigins: ["https://tabelog.com"],
          authoritative: { date: request.date, partySize: request.partySize },
          objective: "Reveal public Tabelog restaurant search results without booking or logging in.",
          methodReason: "Tabelog discovery has no extractable restaurant result yet.",
          completion: (page) => ({
            complete: parseTabelogSearchOutlets(page).length > 0,
            reason: "Continue until an observed public restaurant result is available; do not use navigation, login, or booking links.",
          }),
        });
        search = generic.snapshot;
        outlets = parseTabelogSearchOutlets(search).slice(0, this.maxCandidateMatches);
      }
      const outletPages = new Map<string, import("../../infrastructure/browser/browser-runtime.js").BrowserSnapshot>();
      const enrichedOutlets = [] as typeof outlets;
      const detailDiagnostics = [] as TabelogIdentityDiagnostic["details"];
      const extractionByEntityId = new Map<string, TabelogOutletIdentityExtraction>();
      for (const outlet of outlets) {
        await this.executor.navigate({
          source: "TABELOG", stage: "IDENTITY", signal, allowedOrigins: ["https://tabelog.com"], session, url: outlet.sourceUrl, observed: true,
        });
        let outletPage = await this.executor.snapshot({ source: "TABELOG", stage: "IDENTITY", signal, session });
        outletPage = await this.resumeAfterUserIntervention(candidate, request, session, outletPage, "DETAIL", signal);
        if (hasBotChallenge(outletPage)) {
          detailDiagnostics.push({
            searchResultSourceEntityId: outlet.sourceEntityId,
            requestedUrl: outlet.sourceUrl,
            finalUrl: outletPage.url,
            title: outletPage.title,
            botChallenge: true,
          });
          continue;
        }
        outletPages.set(outlet.sourceUrl, outletPage);
        const extraction = parseTabelogOutletIdentityWithEvidence(outletPage, outlet);
        enrichedOutlets.push(extraction.outlet);
        extractionByEntityId.set(extraction.outlet.sourceEntityId, extraction);
        detailDiagnostics.push({
          searchResultSourceEntityId: outlet.sourceEntityId,
          requestedUrl: outlet.sourceUrl,
          finalUrl: outletPage.url,
          title: outletPage.title,
          ...(extraction.canonicalUrl ? { canonicalUrl: extraction.canonicalUrl } : {}),
          botChallenge: false,
          extracted: extraction.fields,
        });
      }
      const inspection = inspectTabelogEntity(candidate, enrichedOutlets);
      const detailBotChallenge = outlets.length > 0 && enrichedOutlets.length === 0 && detailDiagnostics.every((detail) => detail.botChallenge);
      const extractionFields = new Map([...extractionByEntityId.entries()].map(([entityId, extraction]) => [entityId, extraction.fields]));
      this.recordIdentityDiagnostic({
        ...inspection.diagnostic,
        search: {
          query: candidate.restaurant.outletName,
          requestedUrl: diagnosticUrl(requestedSearchUrl),
          finalUrl: diagnosticUrl(search.url),
          title: search.title,
          parsedResultCount: outlets.length,
          inspectedResultCount: enrichedOutlets.length,
        },
        searchResults: outlets.map((outlet) => structuredClone(outlet)),
        details: detailDiagnostics.map((detail) => ({
          ...detail,
          requestedUrl: diagnosticUrl(detail.requestedUrl),
          finalUrl: diagnosticUrl(detail.finalUrl),
          ...(detail.canonicalUrl ? { canonicalUrl: diagnosticUrl(detail.canonicalUrl) } : {}),
        })),
        comparedOutlets: inspection.diagnostic.comparedOutlets.map((outlet) => {
          const extracted = extractionFields.get(outlet.sourceEntityId);
          return extracted ? { ...outlet, outletName: extracted.outletName, address: extracted.address, phone: extracted.phone } : outlet;
        }),
        ...(detailBotChallenge
          ? { resolution: { ...inspection.diagnostic.resolution, reason: "DETAIL_BOT_CHALLENGE" as const } }
          : {}),
      });
      if (detailBotChallenge) return this.ground(candidate, request, {
        candidate,
        observedAt,
        entityMatch: { confidence: "LOW", matchedBy: [] },
        pageState: "BOT_CHALLENGE",
        excerpt: pageExcerpt(search),
      }, browser);
      const resolved = inspection.resolution;
      if (resolved.confidence !== "HIGH" || !resolved.outlet) return this.ground(candidate, request, { candidate, observedAt, entityMatch: resolved, pageState: "EXTRACTION_FAILED", failureCode: "ENTITY_MATCH_UNCERTAIN", excerpt: pageExcerpt(search) }, browser);
      if (!isTabelogUrl(resolved.outlet.sourceUrl)) return this.ground(candidate, request, { candidate, observedAt, entityMatch: resolved, pageState: "SOURCE_UNSUPPORTED", failureCode: "EXTERNAL_BOOKING_PROVIDER_REQUIRED" }, browser);
      let page = outletPages.get(resolved.outlet.sourceUrl);
      if (!page) {
        await this.executor.navigate({
          source: "TABELOG", stage: "AVAILABILITY", signal, allowedOrigins: ["https://tabelog.com"], session, url: resolved.outlet.sourceUrl, observed: true,
        });
        page = await this.executor.snapshot({ source: "TABELOG", stage: "AVAILABILITY", signal, session });
      }
      page = await this.resumeAfterUserIntervention(candidate, request, session, page, "AVAILABILITY", signal);
      if (hasBotChallenge(page)) return this.ground(candidate, request, { candidate, observedAt, sourceEntityId: resolved.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: resolved, pageState: "BOT_CHALLENGE", excerpt: pageExcerpt(page) }, browser);
      if (detectExternalReservationRedirect(page)) return this.ground(candidate, request, { candidate, observedAt, sourceEntityId: resolved.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: resolved, pageState: "SOURCE_UNSUPPORTED", failureCode: "EXTERNAL_BOOKING_PROVIDER_REQUIRED", excerpt: pageExcerpt(page) }, browser);
      if (!hasReservationControls(page)) return this.ground(candidate, request, { candidate, observedAt, sourceEntityId: resolved.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: resolved, pageState: "SOURCE_UNSUPPORTED", failureCode: "ONLINE_AVAILABILITY_UNSUPPORTED", excerpt: pageExcerpt(page) }, browser);
      const party = selectedPartyField(page.html);
      const date = selectedDateField(page.html);
      if (!party || !date) return this.ground(candidate, request, { candidate, observedAt, sourceEntityId: resolved.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: resolved, pageState: "EXTRACTION_FAILED", failureCode: "EXTRACTION_FAILED", excerpt: pageExcerpt(page) }, browser);
      const selectedParty = await this.executor.select({
        source: "TABELOG", stage: "AVAILABILITY", signal, session, selector: party, value: String(request.partySize), authoritativeValue: String(request.partySize),
      });
      if (!selectedParty.includes(String(request.partySize))) return this.ground(candidate, request, { candidate, observedAt, sourceEntityId: resolved.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: resolved, pageState: "EXTRACTION_FAILED", failureCode: "PARTY_SELECTION_UNCONFIRMED", excerpt: pageExcerpt(page) }, browser);
      const selectedDate = await this.executor.select({
        source: "TABELOG", stage: "AVAILABILITY", signal, session, selector: date, value: request.date, authoritativeValue: request.date,
      });
      if (!selectedDate.includes(request.date)) return this.ground(candidate, request, { candidate, observedAt, sourceEntityId: resolved.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: resolved, pageState: "EXTRACTION_FAILED", failureCode: "DATE_SELECTION_UNCONFIRMED", excerpt: pageExcerpt(page) }, browser);
      page = await this.executor.snapshot({ source: "TABELOG", stage: "AVAILABILITY", signal, session });
      page = await this.resumeAfterUserIntervention(candidate, request, session, page, "AVAILABILITY", signal);
      if (hasBotChallenge(page)) return this.ground(candidate, request, { candidate, observedAt: this.now(), sourceEntityId: resolved.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: resolved, pageState: "BOT_CHALLENGE", excerpt: pageExcerpt(page) }, browser);
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
      if (this.ownsExecutor) await this.executor.close();
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
