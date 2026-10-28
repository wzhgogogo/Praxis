import { checkedNamedSourceQuery, type NamedSourceAlternative } from "../restaurant-search/named-source-query.js";
import { parseTabelogPriceFacts, parseTabelogSourceFieldQuotes } from "./tabelog-page-parser.js";
import { restaurantFailureCode, type RestaurantFailureCode } from "../../domains/restaurant/failure-codes.js";
import type { RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import type { BrowserReadNetworkPolicy, BrowserRuntime, BrowserSession, BrowserSessionMetadata, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type { RestaurantAvailabilityProvider } from "../restaurant-availability/contracts.js";
import { BrowserRuntimeError } from "../../infrastructure/browser/browser-runtime-errors.js";
import { BrowserTaskExecutor, type BrowserCompletionAssessment } from "../../infrastructure/browser/browser-task-executor.js";
import { inspectNativeOutletContinuity, sameNativeOutletUrl } from "../restaurant-availability/native-outlet-continuity.js";
import { normalizeTabelogOutletUrl, tabelogDiscoveryPack } from "../restaurant-search/source-packs.js";
import { inspectTabelogEntity } from "./tabelog-entity-resolver.js";
import {
  detectExternalReservationRedirect,
  hasBotChallenge,
  hasReservationControls,
  isTabelogUrl,
  pageExcerpt,
  parseTabelogSearchOutlets,
  tabelogSearchResultBusy,
  tabelogAvailabilityResultBusy,
  parseTabelogAvailabilitySlots,
  parseTabelogListedCourses,
  parseTabelogOutletIdentityWithEvidence,
  parseTabelogVerifiedHardCriteria,
} from "./tabelog-page-parser.js";
import type {
  TabelogAvailabilityPageObservation,
  TabelogEntityResolution,
  TabelogIdentityDiagnostic,
  TabelogOutletIdentityExtraction,
  TabelogUserInterventionHandler,
} from "./tabelog-contracts.js";

import { hasTabelogSelectedQuery, tabelogQueryControlHints, tabelogQueryControlsRestricted, tabelogRequestedDateState, TABELOG_VACANCY_RESPONSES } from "./tabelog-query-controls.js";

export function tabelogNameSearchCompletion(page: BrowserSnapshot): BrowserCompletionAssessment {
  const outlets = parseTabelogSearchOutlets(page);
  return { complete: outlets.length > 0, resultBusy: tabelogSearchResultBusy(page),
    resultKey: JSON.stringify([page.url, outlets]),
    reason: "Continue until an observed public restaurant result is available; do not use navigation, login, or booking links." };
}

export function tabelogAvailabilityCompletion(page: BrowserSnapshot, request: Pick<RestaurantAvailabilityRequest, "date" | "partySize" | "timeWindow">): BrowserCompletionAssessment {
  const slots = parseTabelogAvailabilitySlots(page, request);
  return { complete: hasTabelogSelectedQuery(page, request.date, request.partySize) && slots.hasExplicitSlotUi,
    resultBusy: tabelogAvailabilityResultBusy(page),
    resultKey: JSON.stringify([page.url, request.date, request.partySize, request.timeWindow, slots]),
    reason: "Both the requested calendar date and guest count must be selected; model completion alone does not confirm them." };
}


/** A Google-listed Tabelog URL may be read, but still needs page identity proof. */
function listedTabelogOutlet(candidate: RestaurantAvailabilityRequest["candidates"][number]) {
  const native = candidate.restaurant.sourceIds.tabelogNativeDetailUri;
  const value = native ?? (candidate.restaurant.sourceIds.googleWebsiteUri ? normalizeTabelogOutletUrl(candidate.restaurant.sourceIds.googleWebsiteUri) : undefined);
  if (!value || !isTabelogUrl(value)) return undefined;
  try {
    const url = new URL(value);
    if (url.origin !== "https://tabelog.com" || /\/rstLst\//.test(url.pathname)) return undefined;
    url.search = "";
    url.hash = "";
    return {
      sourceEntityId: native ? candidate.restaurant.sourceIds.tabelog ?? "" : `google-listed:${url.pathname.replace(/^\/+|\/+$/g, "")}`,
      sourceUrl: url.toString(),
      outletName: candidate.restaurant.outletName,
    };
  } catch {
    return undefined;
  }
}

function inspectCandidateOutlet(candidate: RestaurantAvailabilityRequest["candidates"][number], outlets: ReturnType<typeof parseTabelogSearchOutlets>, extraction?: TabelogOutletIdentityExtraction, page?: BrowserSnapshot) {
  const nativeUrl = candidate.restaurant.sourceIds.tabelogNativeDetailUri;
  if (!nativeUrl) return inspectTabelogEntity(candidate, outlets);
  const nativeId = candidate.restaurant.sourceIds.tabelog ?? "";
  const continuity = extraction && page && inspectNativeOutletContinuity({ provider: "TABELOG", sourceEntityId: nativeId, sourceUrl: nativeUrl }, page, {
    sourceEntityId: extraction.outlet.sourceEntityId, sourceUrl: extraction.outlet.sourceUrl, canonicalUrl: extraction.canonicalUrl,
    pageOwnedName: extraction.fields.outletName.source !== "SEARCH_RESULT" && extraction.fields.outletName.source !== "ABSENT",
    pageOwnedAddress: extraction.fields.address.source !== "SEARCH_RESULT" && extraction.fields.address.source !== "ABSENT",
  });
  const resolution = continuity?.confirmed && extraction
    ? { confidence: "HIGH" as const, outlet: extraction.outlet, matchedBy: ["NATIVE_SOURCE_ID_AND_DETAIL"] }
    : { confidence: "LOW" as const, matchedBy: [] };
  return {
    resolution,
    diagnostic: {
      candidateId: candidate.restaurant.id,
      google: { outletName: { source: "ABSENT" as const }, address: { source: "ABSENT" as const }, phone: { source: "ABSENT" as const } },
      comparedOutlets: [],
      resolution: {
        confidence: resolution.confidence,
        matchedBy: [...resolution.matchedBy],
        ...(continuity?.observedSourceEntityId ? { bestSourceEntityId: continuity.observedSourceEntityId } : {}),
        reason: continuity?.confirmed ? "NATIVE_SOURCE_ID_AND_DETAIL" as const : "NO_COMPARABLE_IDENTITY_SIGNAL" as const,
      },
    },
  };
}

function mergeOutlets<T extends { sourceUrl: string }>(listed: T | undefined, discovered: T[], max: number): T[] {
  return [...new Map([...(listed ? [[listed.sourceUrl, listed] as const] : []), ...discovered.map((item) => [item.sourceUrl, item] as const)]).values()].slice(0, max);
}

/** Browser redirects may append short-lived challenge tokens; never persist them in eval diagnostics. */
function diagnosticUrl(value: string): string {
  try {
    const url = new URL(value);
    const searchQuery = /^\/en\/(?:tokyo\/)?rstLst\/$/.test(url.pathname) ? url.searchParams.get("sw") : undefined;
    url.search = searchQuery === null || searchQuery === undefined ? "" : `?sw=${encodeURIComponent(searchQuery)}`;
    url.hash = "";
    return url.toString();
  } catch {
    return "<invalid-url>";
  }
}

/** Compare only the durable source entrance, never transient challenge query data. */
function sourceUrlKey(value: string): string | undefined {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return undefined;
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

class TabelogSourceBusyError extends Error {
  constructor(readonly page: BrowserSnapshot) { super("Tabelog source remains busy after its bounded retry"); }
}

export class TabelogBrowserAvailability implements RestaurantAvailabilityProvider {
  readonly provider = "TABELOG" as const;
  readonly executionRoute = "GENERIC_BROWSER" as const;
  private sessionsOpened = 0;
  private readonly busyRetryUsed = new Set<string>();
  private readonly executor: BrowserTaskExecutor;
  private readonly ownsExecutor: boolean;
  /** At most one explicit human pause per candidate/provider read. */
  private readonly interventionRequestedCandidates = new Set<string>();

  constructor(
    browser: BrowserRuntime | BrowserTaskExecutor,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly maxCandidateMatches = 5,
    private readonly options: {
      maxBrowserSessions?: number;
      alternativeSearch?: NamedSourceAlternative;
      /** Eval-only sink for sanitized identity diagnostics; it never changes Domain State or grounding. */
      onIdentityDiagnostic?: (diagnostic: TabelogIdentityDiagnostic) => void;
      /** Eval-only explicit pause; absence preserves the ordinary fail-closed BOT_CHALLENGE path. */
      onUserInterventionRequired?: TabelogUserInterventionHandler;
      /** Live composition passes an installed source-owned read boundary. */
      networkPolicy?: BrowserReadNetworkPolicy;
    } = {},
  ) {
    if (browser instanceof BrowserTaskExecutor) {
      this.ownsExecutor = false;
      this.executor = browser;
    } else {
      this.ownsExecutor = true;
      this.executor = new BrowserTaskExecutor(browser, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
    }
  }

  private async retryBusyPage(candidateId: string, session: BrowserSession, signal: AbortSignal, page: BrowserSnapshot,
    stage: "DISCOVERY" | "IDENTITY" | "AVAILABILITY"): Promise<BrowserSnapshot> {
    const busy = tabelogDiscoveryPack.availability!.sourceBusy;
    if (!busy?.matches(page)) return page;
    if (this.busyRetryUsed.has(candidateId)) throw new TabelogSourceBusyError(page);
    this.busyRetryUsed.add(candidateId);
    await this.executor.waitForSourceRetry({ source: "TABELOG", stage, signal }, busy.retryDelayMs);
    await this.executor.navigate({ source: "TABELOG", stage, signal, session, url: page.url, allowedOrigins: ["https://tabelog.com"], observed: true });
    const retried = await this.executor.snapshot({ source: "TABELOG", stage, signal, session });
    if (busy.matches(retried)) throw new TabelogSourceBusyError(retried);
    return retried;
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
    if (!hasBotChallenge(page) || !this.options.onUserInterventionRequired || this.interventionRequestedCandidates.has(candidate.restaurant.id)) return page;
    this.interventionRequestedCandidates.add(candidate.restaurant.id);
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

  /**
   * A language/canonical variant is usable only when it was already observed
   * in this source's result/identity chain and the alternate page proves the
   * same candidate and source entity again. No URL is synthesized here.
   */
  private async recoverObservedAlternate(
    candidate: RestaurantAvailabilityRequest["candidates"][number],
    session: BrowserSession,
    signal: AbortSignal,
    challenged: BrowserSnapshot,
    verifiedUrls: readonly string[],
    currentSourceUrl: string,
  ): Promise<{ page: BrowserSnapshot; entityMatch?: ReturnType<typeof inspectTabelogEntity>["resolution"] }> {
    if (!hasBotChallenge(challenged)) return { page: challenged };
    const currentKey = sourceUrlKey(currentSourceUrl);
    const alternate = verifiedUrls.find((value) => isTabelogUrl(value) && sourceUrlKey(value) !== currentKey);
    if (!alternate) return { page: challenged };
    await this.executor.navigate({ source: "TABELOG", stage: "IDENTITY", signal, allowedOrigins: ["https://tabelog.com"], session, url: alternate, observed: true });
    const page = await this.retryBusyPage(candidate.restaurant.id, session, signal, await this.executor.snapshot({ source: "TABELOG", stage: "IDENTITY", signal, session }), "IDENTITY");
    if (hasBotChallenge(page)) return { page };
    const extraction = parseTabelogOutletIdentityWithEvidence(page, {
      sourceEntityId: `observed-alternate:${alternate}`,
      sourceUrl: alternate,
      outletName: candidate.restaurant.outletName,
      address: candidate.restaurant.address,
      ...(candidate.restaurant.sourceIds.phone ? { phone: candidate.restaurant.sourceIds.phone } : {}),
    });
    const verified = inspectCandidateOutlet(candidate, [extraction.outlet], extraction).resolution;
    // Canonical and alternate-language paths do not share a stable path ID.
    // The independent HIGH outlet comparison is the required same-store proof.
    return verified.confidence === "HIGH" ? { page, entityMatch: verified } : { page: challenged };
  }

  async check(request: RestaurantAvailabilityRequest, signal: AbortSignal) {
    this.interventionRequestedCandidates.clear();
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
        ...(commonFailureCode ? { failureCode: restaurantFailureCode(commonFailureCode, "AVAILABILITY_FAILED") } : {}),
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
    let retainedIdentity: { sourceEntityId: string; sourceUrl: string; entityMatch: ReturnType<typeof inspectTabelogEntity>["resolution"] } | undefined;
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
      this.busyRetryUsed.delete(candidate.restaurant.id);
      this.executor.beginCandidate(candidate.restaurant.id);
      this.executor.beginProvider(candidate.restaurant.id, "TABELOG");
      session = await this.executor.acquire(signal, "TABELOG", "DISCOVERY", this.options.networkPolicy);
      await session.captureResponses?.(TABELOG_VACANCY_RESPONSES);
      const browser = { ...session.metadata };
      let requestedSearchUrl = tabelogDiscoveryPack.availability!.buildRequestUrl({ candidate: candidate.restaurant, request })!;
      const listedOutlet = listedTabelogOutlet(candidate);
      let directIdentityVerified = false;
      let directPage: BrowserSnapshot | undefined;
      if (listedOutlet) {
        await this.executor.navigate({
          source: "TABELOG", stage: "IDENTITY", signal, allowedOrigins: ["https://tabelog.com"], session, url: listedOutlet.sourceUrl, observed: true,
        });
        const page = await this.retryBusyPage(candidate.restaurant.id, session, signal, await this.executor.snapshot({ source: "TABELOG", stage: "IDENTITY", signal, session }), "IDENTITY");
        directPage = page;
        if (!hasBotChallenge(page)) {
          const extraction = parseTabelogOutletIdentityWithEvidence(page, listedOutlet);
          const inspection = inspectCandidateOutlet(candidate, [extraction.outlet], extraction, page);
          directIdentityVerified = inspection.resolution.confidence === "HIGH";
          if (candidate.restaurant.sourceIds.tabelogNativeDetailUri) {
            const nativeContinuity = inspectNativeOutletContinuity({ provider: "TABELOG",
              sourceEntityId: candidate.restaurant.sourceIds.tabelog ?? "", sourceUrl: candidate.restaurant.sourceIds.tabelogNativeDetailUri }, page, {
              sourceEntityId: extraction.outlet.sourceEntityId, sourceUrl: extraction.outlet.sourceUrl, canonicalUrl: extraction.canonicalUrl,
              pageOwnedName: extraction.fields.outletName.source !== "SEARCH_RESULT" && extraction.fields.outletName.source !== "ABSENT",
              pageOwnedAddress: extraction.fields.address.source !== "SEARCH_RESULT" && extraction.fields.address.source !== "ABSENT",
            });
            this.recordIdentityDiagnostic({ ...inspection.diagnostic, nativeContinuity,
              search: { query: "", requestedUrl: diagnosticUrl(listedOutlet.sourceUrl), finalUrl: diagnosticUrl(page.url), title: page.title,
                parsedResultCount: 1, inspectedResultCount: 1 }, searchResults: [listedOutlet],
              details: [{ searchResultSourceEntityId: listedOutlet.sourceEntityId, requestedUrl: diagnosticUrl(listedOutlet.sourceUrl),
                finalUrl: diagnosticUrl(page.url), title: page.title, ...(extraction.canonicalUrl ? { canonicalUrl: diagnosticUrl(extraction.canonicalUrl) } : {}),
                botChallenge: false, extracted: extraction.fields }],
            });
          }
        }
      }
      if (candidate.restaurant.sourceIds.tabelogNativeDetailUri && !directIdentityVerified) {
        return this.ground(candidate, request, { candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] },
          pageState: directPage && hasBotChallenge(directPage) ? "BOT_CHALLENGE" : "EXTRACTION_FAILED",
          failureCode: directPage && hasBotChallenge(directPage) ? "BOT_CHALLENGE" : "ENTITY_MATCH_UNCERTAIN",
          ...(directPage ? { excerpt: pageExcerpt(directPage) } : {}),
        }, browser);
      }
      if (candidate.restaurant.sourceIds.tabelogNativeDetailUri && directPage && listedOutlet) {
        const extraction = parseTabelogOutletIdentityWithEvidence(directPage, listedOutlet);
        const resolved = inspectCandidateOutlet(candidate, [extraction.outlet], extraction, directPage).resolution;
        retainedIdentity = { sourceEntityId: extraction.outlet.sourceEntityId, sourceUrl: extraction.outlet.sourceUrl, entityMatch: resolved };
        return await this.readMatchedOutlet(candidate, request, session, signal, observedAt, browser, resolved, directPage,
          [listedOutlet.sourceUrl, extraction.outlet.sourceUrl, ...(extraction.canonicalUrl ? [extraction.canonicalUrl] : [])]);
      }
      let lastOutletPage: BrowserSnapshot | undefined;
      const enrichedOutlets = [] as ReturnType<typeof parseTabelogSearchOutlets>;
      const detailDiagnostics = [] as TabelogIdentityDiagnostic["details"];
      const extractionByEntityId = new Map<string, TabelogOutletIdentityExtraction>();
      const observedUrlsByResolvedUrl = new Map<string, Set<string>>();
      const inspected = new Set<string>();
      let searchName = candidate.restaurant.outletName;
      let alternativeUsed = false;
      let search!: BrowserSnapshot;
      let outlets!: ReturnType<typeof parseTabelogSearchOutlets>;
      for (;;) {
        if (directIdentityVerified && directPage && listedOutlet) {
          // A verified Google-listed merchant entrance is sufficient to begin
          // source reading.  A search challenge must not invalidate it.
          search = directPage;
          outlets = [listedOutlet];
        } else {
          await this.executor.navigate({
            source: "TABELOG", stage: "DISCOVERY", signal, allowedOrigins: ["https://tabelog.com"], session, url: requestedSearchUrl,
          });
          search = await this.retryBusyPage(candidate.restaurant.id, session, signal, await this.executor.snapshot({ source: "TABELOG", stage: "DISCOVERY", signal, session }), "DISCOVERY");
          search = await this.resumeAfterUserIntervention(candidate, request, session, search, "SEARCH", signal);
          if (hasBotChallenge(search)) {
            const inspection = inspectTabelogEntity(candidate, []);
            this.recordIdentityDiagnostic({
              ...inspection.diagnostic,
              resolution: { ...inspection.diagnostic.resolution, reason: "SEARCH_BOT_CHALLENGE" },
              search: {
                query: searchName,
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
          outlets = mergeOutlets(listedOutlet, parseTabelogSearchOutlets(search), this.maxCandidateMatches);
          if (!outlets.length && !tabelogDiscoveryPack.browser!.isExplicitEmptyListing(search)) {
            const generic = await this.executor.runSkill({
              taskId: `browser-read:${candidate.restaurant.id}`,
              source: "TABELOG",
              ...(tabelogDiscoveryPack.skillPath ? { sourceSkillPath: tabelogDiscoveryPack.skillPath } : {}),
              stage: "DISCOVERY",
              session,
              signal,
              allowedOrigins: ["https://tabelog.com"],
              goal: { outlet: { name: searchName, address: candidate.restaurant.address }, date: request.date, partySize: request.partySize, timeWindow: request.timeWindow, hardCriteria: request.hardCriteria },
              objective: "Reveal public Tabelog restaurant search results without booking or logging in.",
              methodReason: "Tabelog discovery has no extractable restaurant result yet.",
              completion: tabelogNameSearchCompletion,
            });
            search = generic.snapshot;
            outlets = mergeOutlets(listedOutlet, parseTabelogSearchOutlets(search), this.maxCandidateMatches);
          }
        }
        for (const outlet of outlets) {
          if (inspected.has(outlet.sourceUrl)) continue;
          if (inspected.size >= this.maxCandidateMatches) break;
          inspected.add(outlet.sourceUrl);
          await this.executor.navigate({
            source: "TABELOG", stage: "IDENTITY", signal, allowedOrigins: ["https://tabelog.com"], session, url: outlet.sourceUrl, observed: true,
          });
          let outletPage = await this.retryBusyPage(candidate.restaurant.id, session, signal, await this.executor.snapshot({ source: "TABELOG", stage: "IDENTITY", signal, session }), "IDENTITY");
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
          lastOutletPage = outletPage;
          const extraction = parseTabelogOutletIdentityWithEvidence(outletPage, outlet);
          enrichedOutlets.push(extraction.outlet);
          extractionByEntityId.set(extraction.outlet.sourceEntityId, extraction);
          const observedUrls = observedUrlsByResolvedUrl.get(extraction.outlet.sourceUrl) ?? new Set<string>();
          observedUrls.add(outlet.sourceUrl);
          observedUrls.add(extraction.outlet.sourceUrl);
          if (extraction.canonicalUrl) observedUrls.add(extraction.canonicalUrl);
          observedUrlsByResolvedUrl.set(extraction.outlet.sourceUrl, observedUrls);
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
        if (directIdentityVerified || inspectTabelogEntity(candidate, enrichedOutlets).resolution.confidence === "HIGH"
          || alternativeUsed || inspected.size >= this.maxCandidateMatches) break;
        alternativeUsed = true;
        const alternative = checkedNamedSourceQuery(candidate, await this.options.alternativeSearch?.(candidate, signal));
        if (!alternative) break;
        searchName = alternative;
        requestedSearchUrl = tabelogDiscoveryPack.availability!.buildRequestUrl({ candidate: candidate.restaurant, request, outletName: alternative })!;
      }
      const nativeExtraction = candidate.restaurant.sourceIds.tabelog
        ? extractionByEntityId.get(candidate.restaurant.sourceIds.tabelog) : undefined;
      const inspection = candidate.restaurant.sourceIds.tabelogNativeDetailUri
        ? inspectCandidateOutlet(candidate, nativeExtraction ? [nativeExtraction.outlet] : [], nativeExtraction, lastOutletPage)
        : inspectTabelogEntity(candidate, enrichedOutlets);
      const detailBotChallenge = outlets.length > 0 && enrichedOutlets.length === 0 && detailDiagnostics.every((detail) => detail.botChallenge);
      const extractionFields = new Map([...extractionByEntityId.entries()].map(([entityId, extraction]) => [entityId, extraction.fields]));
      this.recordIdentityDiagnostic({
        ...inspection.diagnostic,
        search: {
          query: searchName,
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
      // Later controls/timeouts cannot invalidate an already source-proven
      // same-outlet identity. Retain it as identity-only evidence; availability
      // remains UNKNOWN until a fresh request-bound slot observation succeeds.
      retainedIdentity = { sourceEntityId: resolved.outlet.sourceEntityId, sourceUrl: resolved.outlet.sourceUrl, entityMatch: resolved };
      const verifiedAlternateUrls = [...(observedUrlsByResolvedUrl.get(resolved.outlet.sourceUrl) ?? new Set([resolved.outlet.sourceUrl]))];
      return await this.readMatchedOutlet(candidate, request, session, signal, observedAt, browser, resolved, lastOutletPage, verifiedAlternateUrls);
    } catch (error) {
      if (error instanceof TabelogSourceBusyError) {
        const page = error.page, inspection = inspectTabelogEntity(candidate, []);
        this.recordIdentityDiagnostic({ ...inspection.diagnostic,
          resolution: { ...inspection.diagnostic.resolution, reason: "SOURCE_BUSY" },
          search: { query: candidate.restaurant.outletName, requestedUrl: diagnosticUrl(page.url), finalUrl: diagnosticUrl(page.url), title: page.title, parsedResultCount: 0, inspectedResultCount: 0 },
          searchResults: [], details: [{ searchResultSourceEntityId: "", requestedUrl: diagnosticUrl(page.url), finalUrl: diagnosticUrl(page.url), title: page.title, botChallenge: false }],
        });
        return this.ground(candidate, request, { candidate, observedAt: this.now(),
          ...(retainedIdentity ?? { entityMatch: { confidence: "LOW" as const, matchedBy: [] } }),
          pageState: "EXTRACTION_FAILED", failureCode: "SOURCE_BUSY", excerpt: pageExcerpt(page) }, session ? { ...session.metadata } : undefined);
      }
      if (signal.aborted || (error instanceof BrowserRuntimeError && (error.code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" || error.code === "BROWSER_RUNTIME_UNAVAILABLE" || error.code === "BROWSER_ABORTED")) || (error && typeof error === "object" && "code" in error && error.code === "MODEL_CALL_BUDGET_EXHAUSTED")) throw error;
      const failureCode = error instanceof BrowserRuntimeError
        ? (error.code === "BROWSER_ABORTED" ? "BROWSER_TIMEOUT" : error.code)
        : "BROWSER_RUNTIME_FAILED";
      return this.ground(candidate, request, {
        candidate,
        observedAt: this.now(),
        ...(retainedIdentity ? retainedIdentity : { entityMatch: { confidence: "LOW" as const, matchedBy: [] } }),
        pageState: "EXTRACTION_FAILED",
        failureCode,
      }, session ? { ...session.metadata } : undefined);
    } finally {
      this.executor.endProvider();
      if (this.ownsExecutor) await this.executor.close();
    }
  }

  /** Shared request-control and slot tail after either cross-source or native HIGH identity. */
  private async readMatchedOutlet(
    candidate: RestaurantAvailabilityRequest["candidates"][number],
    request: RestaurantAvailabilityRequest,
    session: BrowserSession,
    signal: AbortSignal,
    observedAt: string,
    browser: BrowserSessionMetadata,
    resolved: TabelogEntityResolution,
    lastOutletPage: BrowserSnapshot | undefined,
    verifiedAlternateUrls: string[],
  ) {
      const sourceOutlet = resolved.outlet;
      if (!sourceOutlet) throw new Error("HIGH Tabelog identity has no outlet");
      let alternateRecoveryUsed = false;
      let activeIdentity = resolved;
      const activeSource = () => activeIdentity.outlet ? { sourceEntityId: activeIdentity.outlet.sourceEntityId } : {};
      let page = lastOutletPage;
      if (page?.url !== sourceOutlet.sourceUrl) {
        await this.executor.navigate({
          source: "TABELOG", stage: "AVAILABILITY", signal, allowedOrigins: ["https://tabelog.com"], session, url: sourceOutlet.sourceUrl, observed: true,
        });
        page = await this.retryBusyPage(candidate.restaurant.id, session, signal, await this.executor.snapshot({ source: "TABELOG", stage: "AVAILABILITY", signal, session }), "AVAILABILITY");
      }
      page = await this.resumeAfterUserIntervention(candidate, request, session, page, "AVAILABILITY", signal);
      if (hasBotChallenge(page) && !alternateRecoveryUsed) {
        alternateRecoveryUsed = true;
        const recovered = await this.recoverObservedAlternate(candidate, session, signal, page, verifiedAlternateUrls, sourceOutlet.sourceUrl);
        page = recovered.page;
        if (recovered.entityMatch) activeIdentity = recovered.entityMatch;
      }
      if (hasBotChallenge(page)) return this.ground(candidate, request, { candidate, observedAt, ...activeSource(), sourceUrl: page.url, priceFacts: parseTabelogPriceFacts(page), entityMatch: activeIdentity, pageState: "BOT_CHALLENGE", excerpt: pageExcerpt(page) }, browser);
      if (detectExternalReservationRedirect(page)) return this.ground(candidate, request, { candidate, observedAt, ...activeSource(), sourceUrl: page.url, priceFacts: parseTabelogPriceFacts(page), entityMatch: activeIdentity, pageState: "SOURCE_UNSUPPORTED", failureCode: "EXTERNAL_BOOKING_PROVIDER_REQUIRED", excerpt: pageExcerpt(page) }, browser);
      if (!hasReservationControls(page)) return this.ground(candidate, request, { candidate, observedAt, ...activeSource(), sourceUrl: page.url, priceFacts: parseTabelogPriceFacts(page), entityMatch: activeIdentity, pageState: "SOURCE_UNSUPPORTED", failureCode: "ONLINE_AVAILABILITY_UNSUPPORTED", excerpt: pageExcerpt(page) }, browser);
      const party = selectedPartyField(page.html);
      const date = selectedDateField(page.html);
      if (party && date) {
        const selectedParty = await this.executor.select({
          source: "TABELOG", stage: "AVAILABILITY", signal, session, selector: party, value: String(request.partySize), authoritativeValue: String(request.partySize),
        });
        if (!selectedParty.includes(String(request.partySize))) return this.ground(candidate, request, { candidate, observedAt, ...activeSource(), sourceUrl: page.url, priceFacts: parseTabelogPriceFacts(page), entityMatch: activeIdentity, pageState: "EXTRACTION_FAILED", failureCode: "PARTY_SELECTION_UNCONFIRMED", excerpt: pageExcerpt(page) }, browser);
        const selectedDate = await this.executor.select({
          source: "TABELOG", stage: "AVAILABILITY", signal, session, selector: date, value: request.date, authoritativeValue: request.date,
        });
        if (!selectedDate.includes(request.date)) return this.ground(candidate, request, { candidate, observedAt, ...activeSource(), sourceUrl: page.url, priceFacts: parseTabelogPriceFacts(page), entityMatch: activeIdentity, pageState: "EXTRACTION_FAILED", failureCode: "DATE_SELECTION_UNCONFIRMED", excerpt: pageExcerpt(page) }, browser);
      } else {
        page = await this.retryBusyPage(candidate.restaurant.id, session, signal, await this.executor.snapshot({ source: "TABELOG", stage: "AVAILABILITY", signal, session }), "AVAILABILITY");
        const visibleQueryControls = await session.observeControls?.(tabelogQueryControlHints(page)) ?? [];
        const dateState = tabelogRequestedDateState(page, request.date);
        const terminalDateRestriction = dateState === "CLOSED" || dateState === "FULL" || dateState === "PHONE_ONLY";
        if (tabelogQueryControlsRestricted(page, visibleQueryControls, request.partySize) && terminalDateRestriction) {
          const dateRestriction = { CLOSED: "TABELOG_REQUEST_DATE_CLOSED_ON_CALENDAR",
            FULL: "TABELOG_REQUEST_DATE_FULL_ON_CALENDAR", PHONE_ONLY: "TABELOG_REQUEST_DATE_PHONE_ONLY_ON_CALENDAR" } as const;
          return this.ground(candidate, request, {
            candidate, observedAt: this.now(), ...activeSource(), sourceUrl: page.url, priceFacts: parseTabelogPriceFacts(page), entityMatch: activeIdentity,
            pageState: "EXTRACTION_FAILED", failureCode: dateState in dateRestriction
              ? dateRestriction[dateState as keyof typeof dateRestriction] : "TABELOG_VISIBLE_QUERY_CONTROLS_RESTRICTED",
            excerpt: pageExcerpt(page),
          }, browser);
        }
        const query = await this.executor.runSkill({
          taskId: `browser-read:${candidate.restaurant.id}`, source: "TABELOG", ...(tabelogDiscoveryPack.skillPath ? { sourceSkillPath: tabelogDiscoveryPack.skillPath } : {}), stage: "AVAILABILITY",
          session, signal, allowedOrigins: ["https://tabelog.com"], controlHints: tabelogQueryControlHints,
          goal: { outlet: { name: candidate.restaurant.outletName, address: candidate.restaurant.address }, date: request.date, partySize: request.partySize, timeWindow: request.timeWindow, hardCriteria: request.hardCriteria },
          objective: "Apply the exact requested date and guest count to the public calendar. Date and Guests labels describe source-observed controls. Use CLICK_AUTHORITATIVE for those fields. Do not open Reserve or any booking form. Selected time options alone are not verified availability.",
          completion: current => tabelogAvailabilityCompletion(current, request),
        });
        const querySnapshot = await this.retryBusyPage(candidate.restaurant.id, session, signal, query.snapshot, "AVAILABILITY");
        if (!hasTabelogSelectedQuery(querySnapshot, request.date, request.partySize)) return this.ground(candidate, request, {
          candidate, observedAt: this.now(), ...activeSource(), sourceUrl: querySnapshot.url, priceFacts: parseTabelogPriceFacts(querySnapshot),
          entityMatch: activeIdentity, pageState: "EXTRACTION_FAILED", failureCode: query.reasonCode ?? "REQUEST_SELECTION_UNCONFIRMED", listedCourseDetails: parseTabelogListedCourses(querySnapshot), excerpt: pageExcerpt(querySnapshot),
        }, browser);
      }
      page = await this.retryBusyPage(candidate.restaurant.id, session, signal, await this.executor.snapshot({ source: "TABELOG", stage: "AVAILABILITY", signal, session }), "AVAILABILITY");
      page = await this.resumeAfterUserIntervention(candidate, request, session, page, "AVAILABILITY", signal);
      if (hasBotChallenge(page) && !alternateRecoveryUsed) {
        alternateRecoveryUsed = true;
        const recovered = await this.recoverObservedAlternate(candidate, session, signal, page, verifiedAlternateUrls, activeIdentity.outlet?.sourceUrl ?? sourceOutlet.sourceUrl);
        page = recovered.page;
        if (recovered.entityMatch) activeIdentity = recovered.entityMatch;
      }
      if (hasBotChallenge(page)) return this.ground(candidate, request, { candidate, observedAt: this.now(), ...activeSource(), sourceUrl: page.url, priceFacts: parseTabelogPriceFacts(page), entityMatch: activeIdentity, pageState: "BOT_CHALLENGE", excerpt: pageExcerpt(page) }, browser);
      const slotParse = parseTabelogAvailabilitySlots(page, request);
      const slots = slotParse.availableSlots;
      const hasQualifyingSlot = slots.some((slot) => slot >= request.timeWindow.earliest && slot <= request.timeWindow.latest);
      const immediateSlotNotOffered = request.immediateAvailability !== undefined && !hasQualifyingSlot && slotParse.hasExplicitSlotUi;
      return this.ground(candidate, request, {
        candidate,
        observedAt: this.now(),
        ...activeSource(),
        sourceUrl: page.url,
        entityMatch: activeIdentity,
        requestedDate: request.date,
        requestedPartySize: request.partySize,
        pageState: hasQualifyingSlot ? "AVAILABLE" : immediateSlotNotOffered ? "EXTRACTION_FAILED" : slotParse.hasExplicitSlotUi ? "NO_MATCHING_SLOT" : "EXTRACTION_FAILED",
        ...(immediateSlotNotOffered ? { failureCode: "IMMEDIATE_SLOT_NOT_OFFERED" } : {}),
        visibleSlots: slots,
        priceFacts: parseTabelogPriceFacts(page),
        listedCourseDetails: parseTabelogListedCourses(page),
        sourceFieldQuotes: parseTabelogSourceFieldQuotes(page).filter(q => q.field !== "NAME" && q.field !== "CUSTOMER_REVIEW"),
        verifiedHardCriteria: parseTabelogVerifiedHardCriteria(page, request.hardCriteria),
        excerpt: pageExcerpt(page),
      }, browser);
  }

  private ground(
    candidate: RestaurantAvailabilityRequest["candidates"][number],
    request: RestaurantAvailabilityRequest,
    observation: TabelogAvailabilityPageObservation,
    metadata?: BrowserSessionMetadata,
  ) {
    const grounded = tabelogDiscoveryPack.availability!.ground(candidate, request, {
      candidateId: candidate.restaurant.id,
      ...(observation.sourceEntityId ? { sourceEntityId: observation.sourceEntityId } : {}),
      ...(observation.sourceUrl ? { sourceUrl: observation.sourceUrl } : {}),
      observedAt: observation.observedAt,
      ...(observation.requestedDate ? { requestedDate: observation.requestedDate } : {}),
      ...(observation.requestedPartySize !== undefined ? { requestedPartySize: observation.requestedPartySize } : {}),
      entityMatch: observation.entityMatch.outlet && observation.sourceUrl !== observation.entityMatch.outlet.sourceUrl
        && !(candidate.restaurant.sourceIds.tabelogNativeDetailUri && observation.sourceUrl
          && sameNativeOutletUrl("TABELOG", observation.entityMatch.outlet.sourceUrl, observation.sourceUrl))
        ? { confidence: "LOW", matchedBy: [] }
        : observation.entityMatch,
      pageState: observation.pageState,
      ...(observation.visibleSlots ? { visibleSlots: observation.visibleSlots } : {}),
      ...(observation.priceFacts ? { priceFacts: observation.priceFacts } : {}),
      ...(observation.listedCourseDetails ? { listedCourseDetails: observation.listedCourseDetails } : {}),
      ...(observation.sourceFieldQuotes ? { sourceFieldQuotes: observation.sourceFieldQuotes } : {}),
      ...(observation.verifiedHardCriteria ? { verifiedHardCriteria: observation.verifiedHardCriteria } : {}),
      ...(observation.excerpt ? { excerpt: observation.excerpt } : {}),
      ...(observation.failureCode ? { failureCode: observation.failureCode } : {}),
    }, this.now());
    return { ...grounded, ...(metadata ? { browser: metadata } : {}) };
  }
}
