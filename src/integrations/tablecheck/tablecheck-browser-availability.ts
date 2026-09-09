import { groundTableCheckAvailability } from "../../domains/restaurant/read-grounding.js";
import type { RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import type { BrowserRuntime, BrowserSession, BrowserSessionMetadata, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserRuntimeError } from "../../infrastructure/browser/browser-runtime-errors.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import type { RestaurantAvailabilityProvider } from "../restaurant-availability/contracts.js";
import type { TableCheckAvailabilityPageObservation, TableCheckIdentityDiagnostic, TableCheckOutletIdentityExtraction } from "./tablecheck-contracts.js";
import { inspectTableCheckEntity } from "./tablecheck-entity-resolver.js";
import {
  hasTableCheckBotChallenge,
  hasTableCheckDiscoveryNoResult,
  inspectTableCheckPageUnavailable,
  hasTableCheckSelectedRequest,
  parseTableCheckAvailabilitySlots,
  parseTableCheckControlAvailability,
  parseTableCheckDiscoveryOutletUrls,
  parseTableCheckOutletIdentityWithEvidence,
  parseTableCheckVerifiedHardCriteria,
  resolveTableCheckReservationTarget,
  tableCheckDiscoveryUrl,
  tableCheckPageExcerpt,
  tableCheckRequestedReservationUrl,
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
  private readonly executor: BrowserTaskExecutor;
  private readonly ownsExecutor: boolean;

  constructor(
    browser: BrowserRuntime | BrowserTaskExecutor,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly options: {
      maxBrowserSessions?: number;
      onIdentityDiagnostic?: (diagnostic: TableCheckIdentityDiagnostic) => void;
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
    if (this.sessionsOpened >= (this.options.maxBrowserSessions ?? Number.POSITIVE_INFINITY)) {
      return this.ground(candidate, request, {
        candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] }, pageState: "EXTRACTION_FAILED", failureCode: "READ_BUDGET_EXCEEDED",
      });
    }
    this.sessionsOpened += 1;
    this.executor.beginCandidate(candidate.restaurant.id);
    let session: BrowserSession | undefined;
    const attemptedPages: TableCheckIdentityDiagnostic["attemptedPages"] = [];
    try {
      session = await this.executor.acquire(signal, "TABLECHECK", "DISCOVERY");
      const browser = { ...session.metadata };
      const discoveryUrl = tableCheckDiscoveryUrl(candidate);
      await this.executor.navigate({
        source: "TABLECHECK", stage: "DISCOVERY", signal, allowedOrigins: ["https://www.tablecheck.com"], session, url: discoveryUrl,
      });
      // Search results are hydrated after navigation. A timeout is not a second request;
      // snapshotting immediately afterwards distinguishes an empty result from parser failure.
      try {
        await this.executor.waitFor({ source: "TABLECHECK", stage: "DISCOVERY", signal, session, selector: 'a[href*="search_text="]', timeoutMs: 10_000 });
      } catch { /* inspected below */ }
      let discovery = await this.executor.snapshot({ source: "TABLECHECK", stage: "DISCOVERY", signal, session });
      let discoveryBase = {
        requestedUrl: diagnosticUrl(discoveryUrl),
        finalUrl: diagnosticUrl(discovery.url),
        title: discovery.title,
      };
      const unavailable = inspectTableCheckPageUnavailable(discovery);
      if (hasTableCheckBotChallenge(discovery) || unavailable.pageUnavailable) {
        const botChallenge = hasTableCheckBotChallenge(discovery);
        const failureCode = botChallenge ? "BOT_CHALLENGE" : "TABLECHECK_PAGE_UNAVAILABLE";
        this.recordIdentityDiagnostic({
          candidateId: candidate.restaurant.id,
          candidate: structuredClone(candidate.restaurant),
          discovery: {
            ...discoveryBase,
            status: botChallenge ? "BOT_CHALLENGE" : "PAGE_UNAVAILABLE",
            discoveredOutletUrls: [],
            ...(unavailable.matchedSignals.length ? { unavailableSignals: unavailable.matchedSignals } : {}),
          },
          attemptedPages,
          resolution: { confidence: "LOW", matchedBy: [], reason: failureCode },
        });
        return this.ground(candidate, request, {
          candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] },
          pageState: botChallenge ? "BOT_CHALLENGE" : "SOURCE_UNSUPPORTED", failureCode,
          excerpt: tableCheckPageExcerpt(discovery),
        }, browser);
      }
      let outletUrls = parseTableCheckDiscoveryOutletUrls(discovery, candidate.restaurant.outletName);
      let handoff: TableCheckIdentityDiagnostic["discovery"]["handoff"];
      if (!outletUrls.length && !hasTableCheckDiscoveryNoResult(discovery)) {
        const generic = await this.executor.runSkill({
          taskId: `browser-read:${candidate.restaurant.id}`,
          source: "TABLECHECK",
          stage: "DISCOVERY",
          session,
          signal,
          allowedOrigins: ["https://www.tablecheck.com"],
          goal: { outlet: { name: candidate.restaurant.outletName, address: candidate.restaurant.address }, date: request.date, partySize: request.partySize, timeWindow: request.timeWindow, hardCriteria: request.hardCriteria },
          objective: "Reveal public TableCheck restaurant search results without submitting a reservation.",
          methodReason: "TableCheck discovery has no extractable public outlet link yet.",
          completion: (page) => ({
            complete: parseTableCheckDiscoveryOutletUrls(page, candidate.restaurant.outletName).length > 0 || hasTableCheckDiscoveryNoResult(page),
            reason: "Continue until an observed public outlet result is available, or the page explicitly reports no results.",
          }),
        });
        handoff = { reason: "TABLECHECK_DISCOVERY_HAS_NO_EXTRACTABLE_OUTLET_LINK", outcome: generic.status };
        discovery = generic.snapshot;
        outletUrls = parseTableCheckDiscoveryOutletUrls(discovery, candidate.restaurant.outletName);
        discoveryBase = {
          requestedUrl: diagnosticUrl(discoveryUrl),
          finalUrl: diagnosticUrl(discovery.url),
          title: discovery.title,
        };
      }
      if (!outletUrls.length) {
        const noResult = hasTableCheckDiscoveryNoResult(discovery);
        const failureCode = noResult
          ? "TABLECHECK_DISCOVERY_NO_RESULT"
          : handoff?.outcome === "MODEL_FAILURE"
            ? "MODEL_FAILURE"
            : handoff?.outcome === "BUDGET_EXCEEDED"
              ? "READ_BUDGET_EXCEEDED"
              : "TABLECHECK_DISCOVERY_INCOMPLETE";
        this.recordIdentityDiagnostic({
          candidateId: candidate.restaurant.id,
          candidate: structuredClone(candidate.restaurant),
          discovery: {
            ...discoveryBase,
            status: noResult ? "NO_RESULT" : "EXPLORATION_EXHAUSTED",
            discoveredOutletUrls: [],
            ...(handoff ? { handoff } : {}),
          },
          attemptedPages,
          resolution: { confidence: "LOW", matchedBy: [], reason: failureCode },
        });
        return this.ground(candidate, request, {
          candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] }, pageState: "EXTRACTION_FAILED", failureCode,
          excerpt: tableCheckPageExcerpt(discovery),
        }, browser);
      }
      let selected: {
        extraction: TableCheckOutletIdentityExtraction;
        inspection: ReturnType<typeof inspectTableCheckEntity>;
        page: BrowserSnapshot;
        reservation: NonNullable<ReturnType<typeof resolveTableCheckReservationTarget>>;
      } | undefined;
      let highIdentityWithoutReservation: { extraction: TableCheckOutletIdentityExtraction; inspection: ReturnType<typeof inspectTableCheckEntity> } | undefined;
      for (const outletUrl of outletUrls) {
        await this.executor.navigate({
          source: "TABLECHECK", stage: "IDENTITY", signal, allowedOrigins: ["https://www.tablecheck.com"], session, url: outletUrl, observed: true,
        });
        const page = await this.executor.snapshot({ source: "TABLECHECK", stage: "IDENTITY", signal, session });
        if (hasTableCheckBotChallenge(page)) {
          attemptedPages.push({ requestedUrl: diagnosticUrl(outletUrl), finalUrl: diagnosticUrl(page.url), title: page.title, botChallenge: true });
          continue;
        }
        if (inspectTableCheckPageUnavailable(page).pageUnavailable) {
          attemptedPages.push({ requestedUrl: diagnosticUrl(outletUrl), finalUrl: diagnosticUrl(page.url), title: page.title, botChallenge: false, pageUnavailable: true });
          continue;
        }
        const extraction = parseTableCheckOutletIdentityWithEvidence(page, outletUrl);
        if (!extraction) {
          attemptedPages.push({ requestedUrl: diagnosticUrl(outletUrl), finalUrl: diagnosticUrl(page.url), title: page.title, botChallenge: false });
          continue;
        }
        const inspection = inspectTableCheckEntity(candidate, extraction.outlet);
        const attempted = {
          requestedUrl: diagnosticUrl(outletUrl), finalUrl: diagnosticUrl(page.url), title: page.title,
          ...(extraction.canonicalUrl ? { canonicalUrl: diagnosticUrl(extraction.canonicalUrl) } : {}),
          botChallenge: false, extracted: extraction.fields, comparison: inspection.comparison,
        };
        if (inspection.resolution.confidence === "HIGH") {
          const reservation = resolveTableCheckReservationTarget(page, extraction.outlet);
          attemptedPages.push({
            ...attempted,
            ...(reservation ? { reservation: { kind: reservation.kind, url: diagnosticUrl(reservation.url) } } : {}),
          });
          if (!reservation) {
            highIdentityWithoutReservation = { extraction, inspection };
            break;
          }
          selected = { extraction, inspection, page, reservation };
          break;
        }
        attemptedPages.push(attempted);
      }
      const best = selected?.inspection;
      const highWithoutReservation = highIdentityWithoutReservation?.inspection;
      const extractablePage = attemptedPages.some((page) => page.extracted !== undefined);
      const botOnly = attemptedPages.length > 0 && attemptedPages.every((page) => page.botChallenge);
      const unavailableOnly = attemptedPages.length > 0 && attemptedPages.every((page) => page.pageUnavailable);
      const unresolvedReason = botOnly
        ? "BOT_CHALLENGE" as const
        : unavailableOnly
          ? "TABLECHECK_PAGE_UNAVAILABLE" as const
          : extractablePage
            ? "TABLECHECK_ENTITY_MATCH_UNCERTAIN" as const
            : "TABLECHECK_PARSE_FAILED" as const;
      this.recordIdentityDiagnostic({
        candidateId: candidate.restaurant.id,
        candidate: structuredClone(candidate.restaurant),
        discovery: { ...discoveryBase, status: "RESULTS", discoveredOutletUrls: outletUrls.map(diagnosticUrl) },
        attemptedPages,
        resolution: best
          ? { confidence: best.resolution.confidence, matchedBy: [...best.resolution.matchedBy], reason: best.reason }
          : highWithoutReservation
            ? { confidence: highWithoutReservation.resolution.confidence, matchedBy: [...highWithoutReservation.resolution.matchedBy], reason: highWithoutReservation.reason }
          : {
              confidence: "LOW",
              matchedBy: [],
              reason: unresolvedReason,
            },
      });
      if (highIdentityWithoutReservation) return this.ground(candidate, request, {
        candidate, observedAt, sourceEntityId: highIdentityWithoutReservation.extraction.outlet.sourceEntityId, sourceUrl: highIdentityWithoutReservation.extraction.outlet.sourceUrl,
        entityMatch: highIdentityWithoutReservation.inspection.resolution, pageState: "EXTRACTION_FAILED", failureCode: "TABLECHECK_PARSE_FAILED",
      }, browser);
      if (!selected) {
        return this.ground(candidate, request, {
          candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] }, pageState: botOnly ? "BOT_CHALLENGE" : unavailableOnly ? "SOURCE_UNSUPPORTED" : "EXTRACTION_FAILED",
          failureCode: unresolvedReason,
        }, browser);
      }
      const reservationUrl = tableCheckRequestedReservationUrl(selected.reservation, request.date, request.partySize);
      let page = selected.page;
      if (selected.reservation.kind === "LINKED_PAGE") {
        await this.executor.navigate({
          source: "TABLECHECK", stage: "AVAILABILITY", signal, allowedOrigins: ["https://www.tablecheck.com"], session, url: reservationUrl, observed: true,
        });
        page = await this.executor.snapshot({ source: "TABLECHECK", stage: "AVAILABILITY", signal, session });
      }
      if (hasTableCheckBotChallenge(page)) return this.ground(candidate, request, {
        candidate, observedAt, sourceEntityId: selected.extraction.outlet.sourceEntityId, sourceUrl: selected.extraction.outlet.sourceUrl,
        entityMatch: selected.inspection.resolution, pageState: "BOT_CHALLENGE", failureCode: "BOT_CHALLENGE", excerpt: tableCheckPageExcerpt(page),
      }, browser);
      const availabilityRead = await this.executor.runSkill({
        taskId: `browser-read:${candidate.restaurant.id}`,
        source: "TABLECHECK",
        stage: "AVAILABILITY",
        session,
        signal,
        allowedOrigins: ["https://www.tablecheck.com"],
        goal: { outlet: { name: candidate.restaurant.outletName, address: candidate.restaurant.address }, date: request.date, partySize: request.partySize, timeWindow: request.timeWindow, hardCriteria: request.hardCriteria },
        objective: "For the already identity-grounded outlet, set and verify the requested date, party size, and time window, then read the latest explicit public availability result. Do not submit a reservation.",
        methodReason: "The verifier has not yet established a completed availability result for the full Router-bound request.",
        completion: (current) => ({
          complete: hasTableCheckBotChallenge(current)
            || (hasTableCheckSelectedRequest(current, request.date, request.partySize) && (() => {
              const result = parseTableCheckAvailabilitySlots(current, { date: request.date, partySize: request.partySize });
              return result.queryComplete && (
                result.availableSlots.some((slot) => slot >= request.timeWindow.earliest && slot <= request.timeWindow.latest)
                || result.explicitlyEmpty
                || result.hasExplicitSlotUi
              );
            })()),
          reason: hasTableCheckSelectedRequest(current, request.date, request.partySize)
            ? "The request is selected, but its result is missing, loading, or only partially rendered. Wait for a completed result region or reveal it with an observed safe control."
            : "The latest page must explicitly confirm the complete authoritative date and party size before any result can be used.",
        }),
        shortcut: {
          name: "OBSERVED_STANDARD_DATE_PARTY_FIELDS",
          run: async (current) => {
            const party = selectedPartyField(current);
            const date = selectedDateField(current);
            if (!party && !date) return;
            if (party) {
              const values = await this.executor.select({ source: "TABLECHECK", stage: "AVAILABILITY", signal, session: session!, selector: party, value: String(request.partySize), authoritativeValue: String(request.partySize) });
              if (!values.includes(String(request.partySize))) throw new Error("Party selection did not report the authoritative value");
            }
            if (date) {
              const values = await this.executor.select({ source: "TABLECHECK", stage: "AVAILABILITY", signal, session: session!, selector: date, value: request.date, authoritativeValue: request.date });
              if (!values.includes(request.date)) throw new Error("Date selection did not report the authoritative value");
            }
          },
        },
      });
      page = availabilityRead.snapshot;
      if (hasTableCheckBotChallenge(page)) return this.ground(candidate, request, {
        candidate, observedAt, sourceEntityId: selected.extraction.outlet.sourceEntityId, sourceUrl: selected.extraction.outlet.sourceUrl,
        entityMatch: selected.inspection.resolution, pageState: "BOT_CHALLENGE", failureCode: "BOT_CHALLENGE", excerpt: tableCheckPageExcerpt(page),
      }, browser);
      const controlSlots = parseTableCheckControlAvailability(availabilityRead.controls, request.date, request.partySize);
      const requestConfirmed = hasTableCheckSelectedRequest(page, request.date, request.partySize) || controlSlots.queryComplete;
      if (availabilityRead.status !== "COMPLETED" || !requestConfirmed) return this.ground(candidate, request, {
        candidate, observedAt, sourceEntityId: selected.extraction.outlet.sourceEntityId, sourceUrl: selected.extraction.outlet.sourceUrl,
        entityMatch: selected.inspection.resolution, pageState: "EXTRACTION_FAILED", failureCode: "REQUEST_SELECTION_UNCONFIRMED",
      }, browser);
      const parsedSlots = parseTableCheckAvailabilitySlots(page, { date: request.date, partySize: request.partySize });
      const slots = {
        availableSlots: [...new Set([...parsedSlots.availableSlots, ...controlSlots.availableSlots])].sort(),
        hasExplicitSlotUi: parsedSlots.hasExplicitSlotUi || controlSlots.hasExplicitSlotUi,
        explicitlyEmpty: parsedSlots.explicitlyEmpty,
        queryComplete: parsedSlots.queryComplete || controlSlots.queryComplete,
      };
      const qualifying = slots.queryComplete
        && slots.availableSlots.some((slot) => slot >= request.timeWindow.earliest && slot <= request.timeWindow.latest);
      return this.ground(candidate, request, {
        candidate, observedAt: this.now(), sourceEntityId: selected.extraction.outlet.sourceEntityId, sourceUrl: selected.extraction.outlet.sourceUrl,
        entityMatch: selected.inspection.resolution, requestedDate: request.date, requestedPartySize: request.partySize,
        pageState: qualifying ? "AVAILABLE" : slots.queryComplete && (slots.explicitlyEmpty || slots.hasExplicitSlotUi) ? "NO_MATCHING_SLOT" : "EXTRACTION_FAILED",
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
      if (this.ownsExecutor) await this.executor.close();
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
