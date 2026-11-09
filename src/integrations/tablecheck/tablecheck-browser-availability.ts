import type { ModelGateway } from "../../core/model/contracts.js";
import { readQuotedRestaurantSourceFacts, quotedRestaurantSourceEvidence } from "../restaurant-facts/model-source-facts.js";
import { mergeQuotedSourceFacts } from "../restaurant-availability/quoted-source-fact-merge.js";
import { checkedNamedSourceQuery, type NamedSourceAlternative } from "../restaurant-search/named-source-query.js";
import {isBrowserReadPathProhibited} from "../../infrastructure/browser/browser-read-policy.js";
import { restaurantFailureCode, type RestaurantFailureCode } from "../../domains/restaurant/failure-codes.js";
import { parseTableCheckCapturedAvailability, tableCheckAvailabilityResponseRule } from "./tablecheck-availability-response.js";
import type { RestaurantAvailabilityRequest, RestaurantServiceScope } from "../../domains/restaurant/contracts.js";
import type { BrowserPageControl, BrowserReadNetworkPolicy, BrowserRuntime, BrowserSession, BrowserSessionMetadata, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserRuntimeError } from "../../infrastructure/browser/browser-runtime-errors.js";
import { BrowserTaskExecutor, type BrowserSkillReadInput, type BrowserCompletionAssessment } from "../../infrastructure/browser/browser-task-executor.js";
import { inspectNativeOutletContinuity } from "../restaurant-availability/native-outlet-continuity.js";
import { tableCheckDiscoveryPack } from "../restaurant-search/source-packs.js";
import type { RestaurantAvailabilityProvider } from "../restaurant-availability/contracts.js";
import type { TableCheckAvailabilityPageObservation, TableCheckIdentityDiagnostic, TableCheckOutletIdentityExtraction, TableCheckUserInterventionHandler } from "./tablecheck-contracts.js";
import { inspectTableCheckEntity } from "./tablecheck-entity-resolver.js";
import {
  hasTableCheckBotChallenge,
  hasTableCheckAvailabilityWidget,
  hasTableCheckAvailabilityResultLoading,
  hasTableCheckDisabledRequestMarkup,
  hasTableCheckDisabledRequestControl,
  hasTableCheckDiscoveryNoResult,
  inspectTableCheckPageUnavailable,
  hasTableCheckSelectedRequest,
  parseTableCheckAvailabilitySlots,
  parseTableCheckControlAvailability,
  sameReservationOutlet,
  parseTableCheckDiscoveryOutletUrls,
  tableCheckSearchResultBusy,
  parseTableCheckOutletIdentityWithEvidence,
  resolveTableCheckReservationTarget,
  tableCheckDiscoveryUrl,
  tableCheckPageExcerpt,
} from "./tablecheck-page-parser.js";

export function tableCheckNameSearchCompletion(page: BrowserSnapshot, outletName: string): BrowserCompletionAssessment {
  const urls = parseTableCheckDiscoveryOutletUrls(page, outletName);
  const empty = hasTableCheckDiscoveryNoResult(page);
  return { complete: urls.length > 0 || empty, resultBusy: tableCheckSearchResultBusy(page),
    resultKey: JSON.stringify([page.url, urls.sort(), empty]), resultUrls: urls,
    reason: "Continue until an observed public outlet result is available, or the page explicitly reports no results." };
}

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

function sourceUrlKey(value: string): string | undefined {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return undefined;
  }
}

/** A Google-listed TableCheck merchant page is only a candidate pointer. */
function listedTableCheckOutletUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.origin !== "https://www.tablecheck.com" || !/^\/(?:en|ja)\/(?!japan\/search(?:\/|$))[^/]+/i.test(url.pathname)) return undefined;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

/**
 * Google fields describe different kinds of links.  Validate each one before
 * choosing: a normal Maps URL must not hide a later public TableCheck website
 * URL merely because it was populated first.
 */
function firstListedTableCheckOutletUrl(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const safe = listedTableCheckOutletUrl(value);
    if (safe) return safe;
  }
  return undefined;
}

function inspectCandidateOutlet(candidate: RestaurantAvailabilityRequest["candidates"][number], extraction: TableCheckOutletIdentityExtraction, page: BrowserSnapshot) {
  const nativeUrl = candidate.restaurant.sourceIds.tablecheckNativeGuideUri;
  if (!nativeUrl) return inspectTableCheckEntity(candidate, extraction.outlet);
  const continuity = inspectNativeOutletContinuity({ provider: "TABLECHECK", sourceEntityId: candidate.restaurant.sourceIds.tablecheck ?? "", sourceUrl: nativeUrl }, page, {
    sourceEntityId: extraction.outlet.sourceEntityId, sourceUrl: extraction.outlet.sourceUrl, canonicalUrl: extraction.canonicalUrl,
    pageOwnedName: extraction.fields.outletName.source !== "ABSENT",
    pageOwnedAddress: extraction.fields.address.source !== "ABSENT",
  });
  return {
    resolution: continuity.confirmed
      ? { confidence: "HIGH" as const, outlet: extraction.outlet, matchedBy: ["NATIVE_SOURCE_ID_AND_DETAIL"] }
      : { confidence: "LOW" as const, matchedBy: [] },
    comparison: { outletName: "MISSING" as const, address: "MISSING" as const, phone: "MISSING" as const },
    reason: continuity.confirmed ? "NATIVE_SOURCE_ID_AND_DETAIL" as const : "NO_COMPARABLE_IDENTITY_SIGNAL" as const,
  };
}

type MatchedTableCheckOutlet = {
  extraction: TableCheckOutletIdentityExtraction;
  inspection: ReturnType<typeof inspectTableCheckEntity>;
  page: BrowserSnapshot;
  reservation: NonNullable<ReturnType<typeof resolveTableCheckReservationTarget>>;
  observedOutletUrls: readonly string[];
};

/** A service-category radio must have exactly one current observed selection. */
function selectedServiceScope(controls: readonly BrowserPageControl[]): RestaurantServiceScope | null | undefined {
  const choices = controls.filter((control) => control.kind === "RADIO"
    && control.structure?.name === "reservation[service_category]");
  if (!choices.length) return undefined;
  const selected = choices.filter((control) => control.checked === true);
  if (selected.length !== 1) return null;
  const control = selected[0]!;
  const value = control.value?.trim();
  const label = control.label.trim();
  const group = control.structure?.radioGroupKey;
  return value && label && group ? { field: control.structure!.name, group, value, label } : null;
}

/**
 * A checked category is query state, not inventory evidence.  Keep a scoped
 * result only where the same public reservation link carries the observed
 * category value with its date, party and time.  This deliberately leaves an
 * unbound empty/result panel UNKNOWN rather than relabelling an older scope.
 */
export function hasTableCheckScopeBoundSlot(
  page: BrowserSnapshot,
  controls: readonly BrowserPageControl[],
  request: Pick<RestaurantAvailabilityRequest, "date" | "partySize" | "timeWindow">,
  scope: RestaurantServiceScope | undefined,
  slots: readonly string[],
): boolean {
  if (!scope) return true;
  if (!slots.length) return false;
  const matches = (href: string | undefined, label: string) => {
    if (!href || !/^\d{2}:\d{2}$/.test(label) || label < request.timeWindow.earliest || label > request.timeWindow.latest) return false;
    try {
      const url = new URL(href.replace(/&amp;/g, "&"), page.url);
      return url.origin === "https://www.tablecheck.com"
        && sameReservationOutlet(page.url, url)
        && url.searchParams.get("start_date") === request.date
        && url.searchParams.get("num_people") === String(request.partySize)
        && url.searchParams.get("start_time") === label
        && url.searchParams.get("service_category") === scope.value;
    } catch { return false; }
  };
  const observedTimes = new Set<string>();
  // The live registry has already applied the browser's rendered visibility,
  // disabled and active-layer checks. Do not recreate a weaker HTML scanner
  // here: a hidden or disabled new-category anchor cannot bless an old slot.
  for (const control of controls) {
    if (control.kind === "LINK" && control.visible && !control.disabled && matches(control.href, control.label.trim())) observedTimes.add(control.label.trim());
  }
  return slots.every((slot) => observedTimes.has(slot));
}

/**
 * Source-observed TableCheck entrances for one Router-owned read run.  They
 * are navigation hints only: every later candidate still passes identity
 * verification before an availability page can be read.
 */
export class TableCheckEntryLedger {
  private readonly urls = new Set<string>();
  private readonly identityPages = new Map<string, { page: BrowserSnapshot; extraction: TableCheckOutletIdentityExtraction }>();

  observe(value: string): void {
    const safe = listedTableCheckOutletUrl(value);
    if (safe) this.urls.add(safe);
  }

  entries(): string[] {
    return [...this.urls];
  }

  rememberIdentity(url: string, page: BrowserSnapshot, extraction: TableCheckOutletIdentityExtraction): void {
    const key = sourceUrlKey(url);
    if (key) this.identityPages.set(key, { page, extraction });
  }

  identity(url: string): { page: BrowserSnapshot; extraction: TableCheckOutletIdentityExtraction } | undefined {
    const key = sourceUrlKey(url);
    return key ? this.identityPages.get(key) : undefined;
  }
}

function matchesDiscoveryQuery(page: BrowserSnapshot, _requestedUrl: string): boolean {
  return new URL(page.url).origin === "https://www.tablecheck.com"
    && !tableCheckNameSearchCompletion(page, "").resultBusy;
}

function matchesReservationPage(page: BrowserSnapshot, observedReservationUrl: string): boolean {
  return sourceUrlKey(page.url) === sourceUrlKey(observedReservationUrl);
}


export class TableCheckBrowserAvailability implements RestaurantAvailabilityProvider {
  readonly provider = "TABLECHECK" as const;
  readonly executionRoute = "GENERIC_BROWSER" as const;
  private sessionsOpened = 0;
  private readonly executor: BrowserTaskExecutor;
  private readonly ownsExecutor: boolean;
  /** At most one explicit human pause per candidate/provider read. */
  private readonly interventionRequestedCandidates = new Set<string>();

  constructor(
    browser: BrowserRuntime | BrowserTaskExecutor,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly options: {
      maxBrowserSessions?: number;
      /** Stop after the unchanged HIGH identity gate; no request controls or slot read. */
      identityOnly?: boolean;
      targetQuery?: string;
      sourceFactsModel?: ModelGateway;
      alternativeSearch?: NamedSourceAlternative;
      maxCandidateMatches?: number;
      onIdentityDiagnostic?: (diagnostic: TableCheckIdentityDiagnostic) => void;
      /** Eval-only explicit pause; absence preserves the ordinary fail-closed path. */
      onUserInterventionRequired?: TableCheckUserInterventionHandler;
      /** Router-owned and reset at read-run boundaries; never process-global. */
      entryLedger?: TableCheckEntryLedger;
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

  private recordIdentityDiagnostic(diagnostic: TableCheckIdentityDiagnostic): void {
    try { this.options.onIdentityDiagnostic?.(structuredClone(diagnostic)); } catch { /* diagnostics never affect a read */ }
  }

  private async resumeAfterUserIntervention(
    candidate: RestaurantAvailabilityRequest["candidates"][number],
    request: RestaurantAvailabilityRequest,
    session: BrowserSession,
    page: BrowserSnapshot,
    stage: "DISCOVERY" | "IDENTITY" | "AVAILABILITY",
    signal: AbortSignal,
  ): Promise<BrowserSnapshot> {
    if (!hasTableCheckBotChallenge(page) || !this.options.onUserInterventionRequired || this.interventionRequestedCandidates.has(candidate.restaurant.id)) return page;
    this.interventionRequestedCandidates.add(candidate.restaurant.id);
    await this.options.onUserInterventionRequired({
      state: "USER_INTERVENTION_REQUIRED",
      provider: "TABLECHECK",
      stage,
      candidate: { id: candidate.restaurant.id, outletName: candidate.restaurant.outletName },
      requestedSchedule: { date: request.date, timeWindow: structuredClone(request.timeWindow), partySize: request.partySize },
      browser: structuredClone(session.metadata),
      page: { url: diagnosticUrl(page.url), title: page.title },
    });
    return this.executor.snapshot({ source: "TABLECHECK", stage, signal, session });
  }

  /**
   * Only a canonical or alternate-language source URL observed while proving
   * this outlet can recover a challenge. The alternate independently needs
   * HIGH identity, so a same-brand but different branch is rejected.
   */
  private async recoverObservedAlternate(
    candidate: RestaurantAvailabilityRequest["candidates"][number],
    request: RestaurantAvailabilityRequest,
    session: BrowserSession,
    signal: AbortSignal,
    selected: {
      extraction: TableCheckOutletIdentityExtraction;
      inspection: ReturnType<typeof inspectTableCheckEntity>;
      page: BrowserSnapshot;
      reservation: NonNullable<ReturnType<typeof resolveTableCheckReservationTarget>>;
      observedOutletUrls: readonly string[];
    },
  ): Promise<{ selected: typeof selected; page: BrowserSnapshot } | undefined> {
    const currentKey = sourceUrlKey(selected.extraction.outlet.sourceUrl);
    const alternate = selected.observedOutletUrls.find((url) => sourceUrlKey(url) !== currentKey);
    if (!alternate) return undefined;
    await this.executor.navigate({ source: "TABLECHECK", stage: "IDENTITY", signal, allowedOrigins: ["https://www.tablecheck.com"], session, url: alternate, observed: true });
    const page = await this.executor.snapshot({ source: "TABLECHECK", stage: "IDENTITY", signal, session });
    if (hasTableCheckBotChallenge(page) || inspectTableCheckPageUnavailable(page).pageUnavailable) return undefined;
    const extraction = parseTableCheckOutletIdentityWithEvidence(page, alternate);
    if (!extraction) return undefined;
    const inspection = inspectCandidateOutlet(candidate, extraction, page);
    if (inspection.resolution.confidence !== "HIGH") return undefined;
    const reservation = resolveTableCheckReservationTarget(page, extraction.outlet, this.options.networkPolicy);
    if (!reservation || isBrowserReadPathProhibited(this.options.networkPolicy, reservation.url)) return undefined;
    let availabilityPage = page;
    if (reservation.kind === "LINKED_PAGE") {
      // This is a distinct observed reservation target. Install its source
      // rule before navigation so a same-navigation initialization GET is
      // retained as diagnostic chronology.
      const responseRule = tableCheckAvailabilityResponseRule(reservation);
      if (responseRule) await session.captureResponses?.([responseRule]);
      await this.executor.navigate({
        source: "TABLECHECK", stage: "AVAILABILITY", signal, allowedOrigins: ["https://www.tablecheck.com"], session,
        url: reservation.url, observed: true,
      });
      availabilityPage = await this.executor.snapshot({ source: "TABLECHECK", stage: "AVAILABILITY", signal, session });
    }
    return {
      selected: {
        extraction,
        inspection,
        page,
        reservation,
        observedOutletUrls: [...new Set([alternate, extraction.outlet.sourceUrl, ...(extraction.canonicalUrl ? [extraction.canonicalUrl] : [])])],
      },
      page: availabilityPage,
    };
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
    const observedAt = this.now();
    const listedOutletUrl = firstListedTableCheckOutletUrl(
      candidate.restaurant.sourceIds.tablecheckNativeGuideUri,
      candidate.restaurant.sourceIds.googleListedTableCheckUri,
      candidate.restaurant.sourceIds.googleWebsiteUri,
      candidate.restaurant.sourceIds.googleMapsUri,
    );
    if (listedOutletUrl && isBrowserReadPathProhibited(this.options.networkPolicy, listedOutletUrl)) {
      return this.ground(candidate, request, {candidate, observedAt, sourceUrl: listedOutletUrl,
        entityMatch: {confidence: "LOW", matchedBy: []}, pageState: "SOURCE_UNSUPPORTED", failureCode: "SOURCE_UNSUPPORTED",
        excerpt: "This observed entrance is prohibited by the current source policy; neither identity nor inventory was read."});
    }
    let retainedIdentity: { extraction: TableCheckOutletIdentityExtraction; inspection: ReturnType<typeof inspectTableCheckEntity> } | undefined;
    if (this.sessionsOpened >= (this.options.maxBrowserSessions ?? Number.POSITIVE_INFINITY)) {
      return this.ground(candidate, request, {
        candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] }, pageState: "EXTRACTION_FAILED", failureCode: "READ_BUDGET_EXCEEDED",
      });
    }
    this.sessionsOpened += 1;
    this.executor.beginCandidate(candidate.restaurant.id);
      this.executor.beginProvider(candidate.restaurant.id, "TABLECHECK");
    let session: BrowserSession | undefined;
    const attemptedPages: TableCheckIdentityDiagnostic["attemptedPages"] = [];
    try {
      session = await this.executor.acquire(signal, "TABLECHECK", "DISCOVERY", this.options.networkPolicy);
      const browser = { ...session.metadata };
      let discoveryUrl = tableCheckDiscoveryUrl(candidate);
      const boundPages=request.verifiedOutletPages?.filter(p=>p.candidateId===candidate.restaurant.id&&p.provider===this.provider)??[];
      if(!this.options.identityOnly&&boundPages.length===1){
        const bound=boundPages[0]!;
        if(!listedTableCheckOutletUrl(bound.sourceUrl))return this.ground(candidate,request,{candidate,observedAt,
          entityMatch:{confidence:"LOW",matchedBy:[]},pageState:"EXTRACTION_FAILED",failureCode:"TABLECHECK_ENTITY_MATCH_UNCERTAIN"},browser);
        let page=await this.executor.snapshot({source:this.provider,stage:"AVAILABILITY",signal,session});
        if(sourceUrlKey(page.url)!==sourceUrlKey(bound.sourceUrl)){
          await this.executor.navigate({source:this.provider,stage:"AVAILABILITY",signal,session,
            allowedOrigins:["https://www.tablecheck.com"],url:bound.sourceUrl,observed:true});
          page=await this.executor.snapshot({source:this.provider,stage:"AVAILABILITY",signal,session});
        }
        const extraction=parseTableCheckOutletIdentityWithEvidence(page,bound.sourceUrl);
        const inspection=extraction&&inspectCandidateOutlet(candidate,extraction,page);
        const reservation=extraction&&resolveTableCheckReservationTarget(page,extraction.outlet,this.options.networkPolicy);
        if(!extraction||inspection?.resolution.confidence!=="HIGH"||!reservation
          ||extraction.outlet.sourceEntityId!==bound.sourceEntityId
          ||sourceUrlKey(extraction.outlet.sourceUrl)!==sourceUrlKey(bound.sourceUrl)
          ||hasTableCheckBotChallenge(page)||inspectTableCheckPageUnavailable(page).pageUnavailable){
          return this.ground(candidate,request,{candidate,observedAt,entityMatch:{confidence:"LOW",matchedBy:[]},
            pageState:"EXTRACTION_FAILED",failureCode:"TABLECHECK_ENTITY_MATCH_UNCERTAIN"},browser);
        }
        retainedIdentity={extraction,inspection};
        return await this.readMatchedOutlet(candidate,request,session,signal,observedAt,browser,
          {extraction,inspection,reservation,page,observedOutletUrls:[bound.sourceUrl]});
      }

      // A Google-listed TableCheck URL is an observed entrance, not identity
      // proof. Keep it for later candidates only as a lead; every use below
      // still passes inspectTableCheckEntity before inventory is accepted.
      if (listedOutletUrl) this.options.entryLedger?.observe(listedOutletUrl);
      let directIdentityVerified = false;
      let directPage: BrowserSnapshot | undefined;
      if (listedOutletUrl) {
        await this.executor.navigate({
          source: "TABLECHECK", stage: "IDENTITY", signal, allowedOrigins: ["https://www.tablecheck.com"], session, url: listedOutletUrl, observed: true,
        });
        let page = await this.executor.snapshot({ source: "TABLECHECK", stage: "IDENTITY", signal, session });
        page = await this.resumeAfterUserIntervention(candidate, request, session, page, "IDENTITY", signal);
        directPage = page;
        if (!hasTableCheckBotChallenge(page) && !inspectTableCheckPageUnavailable(page).pageUnavailable) {
          const extraction = parseTableCheckOutletIdentityWithEvidence(page, listedOutletUrl);
          const inspection = extraction && inspectCandidateOutlet(candidate, extraction, page);
          directIdentityVerified = inspection?.resolution.confidence === "HIGH";
          if (candidate.restaurant.sourceIds.tablecheckNativeGuideUri) {
            const nativeContinuity = extraction && inspectNativeOutletContinuity({ provider: "TABLECHECK",
              sourceEntityId: candidate.restaurant.sourceIds.tablecheck ?? "", sourceUrl: candidate.restaurant.sourceIds.tablecheckNativeGuideUri }, page, {
              sourceEntityId: extraction.outlet.sourceEntityId, sourceUrl: extraction.outlet.sourceUrl, canonicalUrl: extraction.canonicalUrl,
              pageOwnedName: extraction.fields.outletName.source !== "ABSENT", pageOwnedAddress: extraction.fields.address.source !== "ABSENT",
            });
            this.recordIdentityDiagnostic({ candidateId: candidate.restaurant.id, candidate: structuredClone(candidate.restaurant),
              ...(nativeContinuity ? { nativeContinuity } : {}),
              discovery: { requestedUrl: diagnosticUrl(listedOutletUrl), finalUrl: diagnosticUrl(page.url), title: page.title,
                status: extraction ? "RESULTS" : "PARSE_FAILED", discoveredOutletUrls: extraction ? [extraction.outlet.sourceUrl] : [] },
              attemptedPages: [{ requestedUrl: diagnosticUrl(listedOutletUrl), finalUrl: diagnosticUrl(page.url), title: page.title,
                botChallenge: false, ...(extraction && inspection ? { extracted: extraction.fields, comparison: inspection.comparison } : {}) }],
              resolution: { confidence: inspection?.resolution.confidence ?? "LOW", matchedBy: inspection?.resolution.matchedBy ?? [],
                reason: inspection?.reason ?? "TABLECHECK_PARSE_FAILED" },
            });
          }
        }
      }
      if (candidate.restaurant.sourceIds.tablecheckNativeGuideUri && !directIdentityVerified) {
        const challenged = directPage && hasTableCheckBotChallenge(directPage);
        return this.ground(candidate, request, { candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] },
          pageState: challenged ? "BOT_CHALLENGE" : "EXTRACTION_FAILED",
          failureCode: challenged ? "BOT_CHALLENGE" : "ENTITY_MATCH_UNCERTAIN",
          ...(directPage ? { excerpt: tableCheckPageExcerpt(directPage) } : {}),
        }, browser);
      }
      if (candidate.restaurant.sourceIds.tablecheckNativeGuideUri && directPage && listedOutletUrl) {
        const extraction = parseTableCheckOutletIdentityWithEvidence(directPage, listedOutletUrl);
        const inspection = extraction && inspectCandidateOutlet(candidate, extraction, directPage);
        const reservation = extraction && resolveTableCheckReservationTarget(directPage, extraction.outlet, this.options.networkPolicy);
        const observedTarget = !reservation && extraction && resolveTableCheckReservationTarget(directPage, extraction.outlet);
        const prohibited = Boolean(observedTarget && isBrowserReadPathProhibited(this.options.networkPolicy, observedTarget.url));
        if (!extraction || !inspection || !reservation) return this.ground(candidate, request, {
          candidate, observedAt, entityMatch: inspection?.resolution ?? { confidence: "LOW", matchedBy: [] },
          pageState: prohibited ? "SOURCE_UNSUPPORTED" : "EXTRACTION_FAILED", failureCode: prohibited ? "SOURCE_UNSUPPORTED" : "TABLECHECK_PARSE_FAILED",
        }, browser);
        const selected = { extraction, inspection, reservation, page: directPage,
          observedOutletUrls: [listedOutletUrl, extraction.outlet.sourceUrl, ...(extraction.canonicalUrl ? [extraction.canonicalUrl] : [])] };
        retainedIdentity = selected;
        return await this.readMatchedOutlet(candidate, request, session, signal, observedAt, browser, selected);
      }
      let selected: {
        extraction: TableCheckOutletIdentityExtraction;
        inspection: ReturnType<typeof inspectTableCheckEntity>;
        page: BrowserSnapshot;
        reservation: NonNullable<ReturnType<typeof resolveTableCheckReservationTarget>>;
        observedOutletUrls: readonly string[];
      } | undefined;
      let highIdentityWithoutReservation: { extraction: TableCheckOutletIdentityExtraction; inspection: ReturnType<typeof inspectTableCheckEntity>; prohibited:boolean } | undefined;
      let discovery!: BrowserSnapshot;
      let discoveryBase!: { requestedUrl: string; finalUrl: string; title: string };
      let handoff: TableCheckIdentityDiagnostic["discovery"]["handoff"];
      const inspected = new Set<string>();
      const detailLimit = Math.min(5, this.options.maxCandidateMatches ?? 5);
      let outletUrls: string[] = [];
      let searchName = this.options.targetQuery?.trim() || candidate.restaurant.outletName;
      let querySource: "SPECIFIC_OUTLET" | "G4_SOURCE_TERM" = this.options.targetQuery?.trim() ? "SPECIFIC_OUTLET" : "G4_SOURCE_TERM";
      let alternativeUsed = false;
      let modelFailed = false;
      const nextSearch = async (): Promise<boolean> => {
        if (directIdentityVerified || alternativeUsed || modelFailed || inspected.size >= detailLimit) return false;
        alternativeUsed = true;
        const alternative = checkedNamedSourceQuery(candidate, await this.options.alternativeSearch?.(candidate, signal));
        if (!alternative) return false;
        searchName = alternative;
        querySource = "G4_SOURCE_TERM";
        discoveryUrl = tableCheckDiscoveryPack.browser!.startupUrl!;
        return true;
      };
      for (;;) {
        let currentOutletUrls: string[] = [];
        let handoffPage:BrowserSnapshot|undefined;
        if (directIdentityVerified && directPage && listedOutletUrl) {
          // A Google-listed merchant page that passes the same identity gate is
          // a normal entrance.  Do not let a later search challenge erase it.
          discovery = directPage;
          discoveryBase = { requestedUrl: diagnosticUrl(listedOutletUrl), finalUrl: diagnosticUrl(directPage.url), title: directPage.title };
        } else {
          const searched = await this.executor.search({
            source: "TABLECHECK", signal, allowedOrigins: ["https://www.tablecheck.com"], session, url: discoveryUrl, query: searchName, querySource, completion: page => tableCheckNameSearchCompletion(page, searchName),
          });
          modelFailed ||= searched.status === "MODEL_FAILURE";
          handoff = searched.status === "COMPLETED" ? undefined : { reason: "TABLECHECK_DISCOVERY_HAS_NO_EXTRACTABLE_OUTLET_LINK", outcome: searched.status };
          // Snapshot first: a parsed result or explicit empty state is ready now.
          // Otherwise the shared skill receives the parser state and decides
          // whether a public control or a bounded wait is appropriate; no URL
          // parameter is treated as a universal loading selector.
          discovery = await this.executor.snapshot({ source: "TABLECHECK", stage: "DISCOVERY", signal, session });
          if (searched.status === "REQUESTED_HUMAN_HELP"
            && searched.reasonCode !== "OBSERVED_QUERY_CONFLICT" && !hasTableCheckBotChallenge(discovery)
            && !inspectTableCheckPageUnavailable(discovery).pageUnavailable && await nextSearch()) continue;
          discovery = await this.resumeAfterUserIntervention(candidate, request, session, discovery, "DISCOVERY", signal);
          discoveryBase = { requestedUrl: diagnosticUrl(discoveryUrl), finalUrl: diagnosticUrl(discovery.url), title: discovery.title };
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
          if (searched.reasonCode === "OBSERVED_QUERY_CONFLICT" || !matchesDiscoveryQuery(discovery, discoveryUrl)) {
            this.recordIdentityDiagnostic({ candidateId: candidate.restaurant.id, candidate: structuredClone(candidate.restaurant),
              discovery: { ...discoveryBase, status: "PARSE_FAILED", discoveredOutletUrls: [], incompleteStage: "INITIAL_QUERY_MISMATCH", queryMatchesAtExit: false }, attemptedPages,
              resolution: { confidence: "LOW", matchedBy: [], reason: "TABLECHECK_DISCOVERY_INCOMPLETE" } });
            return this.ground(candidate, request, { candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] },
              pageState: "EXTRACTION_FAILED", failureCode: "TABLECHECK_DISCOVERY_INCOMPLETE" }, browser);
          }
          if(searched.sourceHandoff&&searched.sourceHandoff.url===discovery.url&&searched.sourceHandoff.pageId===discovery.pageId)handoffPage=discovery;
          currentOutletUrls = handoffPage ? [diagnosticUrl(handoffPage.url)] : parseTableCheckDiscoveryOutletUrls(discovery, searchName).slice(0, 5);
          for (const url of currentOutletUrls) this.options.entryLedger?.observe(url);
        }
        outletUrls = [...new Set([
          ...(listedOutletUrl ? [listedOutletUrl] : []),
          ...currentOutletUrls,
          ...this.options.entryLedger?.entries() ?? [],
        ])];

        if (!outletUrls.length) {
          if (await nextSearch()) continue;
          const noResult = matchesDiscoveryQuery(discovery, discoveryUrl) && hasTableCheckDiscoveryNoResult(discovery);
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
              ...(failureCode === "TABLECHECK_DISCOVERY_INCOMPLETE" ? { incompleteStage: "NO_OUTLET_URLS_AFTER_EXPLORATION" as const, queryMatchesAtExit: matchesDiscoveryQuery(discovery, discoveryUrl) } : {}),
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
        for (const outletUrl of outletUrls) {
          if (inspected.has(outletUrl)) continue;
          if (inspected.size >= detailLimit) break;
          inspected.add(outletUrl);
          const cached = this.options.entryLedger?.identity(outletUrl);
          let page: BrowserSnapshot;
          if (cached) {
            page = cached.page;
          } else if(handoffPage&&sourceUrlKey(handoffPage.url)===sourceUrlKey(outletUrl)) {
            // The source just rendered this page; inspect it through the same
            // extraction/comparison below without a redundant document read.
            page=handoffPage;
          } else {
            await this.executor.navigate({
              source: "TABLECHECK", stage: "IDENTITY", signal, allowedOrigins: ["https://www.tablecheck.com"], session, url: outletUrl, observed: true,
            });
            page = await this.executor.snapshot({ source: "TABLECHECK", stage: "IDENTITY", signal, session });
            page = await this.resumeAfterUserIntervention(candidate, request, session, page, "IDENTITY", signal);
          }
          if (hasTableCheckBotChallenge(page)) {
            attemptedPages.push({ requestedUrl: diagnosticUrl(outletUrl), finalUrl: diagnosticUrl(page.url), title: page.title, botChallenge: true });
            continue;
          }
          if (inspectTableCheckPageUnavailable(page).pageUnavailable) {
            attemptedPages.push({ requestedUrl: diagnosticUrl(outletUrl), finalUrl: diagnosticUrl(page.url), title: page.title, botChallenge: false, pageUnavailable: true });
            continue;
          }
          const extraction = cached?.extraction ?? parseTableCheckOutletIdentityWithEvidence(page, outletUrl);
          if (!extraction) {
            attemptedPages.push({ requestedUrl: diagnosticUrl(outletUrl), finalUrl: diagnosticUrl(page.url), title: page.title, botChallenge: false });
            continue;
          }
          if (!cached) this.options.entryLedger?.rememberIdentity(outletUrl, page, extraction);
          const inspection = inspectCandidateOutlet(candidate, extraction, page);
          const attempted = {
            requestedUrl: diagnosticUrl(outletUrl), finalUrl: diagnosticUrl(page.url), title: page.title,
            ...(extraction.canonicalUrl ? { canonicalUrl: diagnosticUrl(extraction.canonicalUrl) } : {}),
            botChallenge: false, extracted: extraction.fields, comparison: inspection.comparison,
          };
          if (inspection.resolution.confidence === "HIGH") {
            const reservation = resolveTableCheckReservationTarget(page, extraction.outlet, this.options.networkPolicy);
            attemptedPages.push({
              ...attempted,
              ...(reservation ? { reservation: { kind: reservation.kind, url: diagnosticUrl(reservation.url) } } : {}),
            });
            if (!reservation) {
              // Keep looking for a stronger exact-phone match before retaining a
              // name/address-only outlet with no read target.
              const observedTarget = resolveTableCheckReservationTarget(page, extraction.outlet);
              highIdentityWithoutReservation ??= { extraction, inspection,
                prohibited: Boolean(observedTarget && isBrowserReadPathProhibited(this.options.networkPolicy, observedTarget.url)) };
              if (!inspection.comparison.phone || inspection.comparison.phone !== "CONFLICT") break;
              continue;
            }
            const exactPhone = inspection.resolution.matchedBy.includes("EXACT_PHONE");
            if (exactPhone || !selected) selected = {
              extraction,
              inspection,
              page,
              reservation,
              observedOutletUrls: [...new Set([outletUrl, extraction.outlet.sourceUrl, ...(extraction.canonicalUrl ? [extraction.canonicalUrl] : [])])],
            };
            // A disagreeing phone does not veto complete identity, but an exact
            // phone outlet is stronger and must get a chance to replace it.
            if (exactPhone || inspection.comparison.phone !== "CONFLICT") break;
          }
          attemptedPages.push(attempted);
        }
        if (!selected && !highIdentityWithoutReservation && await nextSearch()) continue;
        break;
      }
      if (selected) this.options.entryLedger?.observe(selected.extraction.outlet.sourceUrl);
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
      if (!selected && highIdentityWithoutReservation) return this.ground(candidate, request, {
        candidate, observedAt, sourceEntityId: highIdentityWithoutReservation.extraction.outlet.sourceEntityId, sourceUrl: highIdentityWithoutReservation.extraction.outlet.sourceUrl,
        entityMatch: highIdentityWithoutReservation.inspection.resolution,
        pageState: highIdentityWithoutReservation.prohibited ? "SOURCE_UNSUPPORTED" : "EXTRACTION_FAILED",
        failureCode: highIdentityWithoutReservation.prohibited ? "SOURCE_UNSUPPORTED" : "TABLECHECK_PARSE_FAILED",
      }, browser);
      if (!selected) {
        return this.ground(candidate, request, {
          candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] }, pageState: botOnly ? "BOT_CHALLENGE" : unavailableOnly ? "SOURCE_UNSUPPORTED" : "EXTRACTION_FAILED",
          failureCode: unresolvedReason,
        }, browser);
      }
      retainedIdentity = selected;
      return await this.readMatchedOutlet(candidate, request, session, signal, observedAt, browser, selected);
    } catch (error) {
      if (signal.aborted || (error instanceof BrowserRuntimeError && (error.code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" || error.code === "BROWSER_RUNTIME_UNAVAILABLE" || error.code === "BROWSER_ABORTED")) || (error && typeof error === "object" && "code" in error && error.code === "MODEL_CALL_BUDGET_EXHAUSTED")) throw error;
      const failureCode = error instanceof BrowserRuntimeError
        ? (error.code === "BROWSER_ABORTED" ? "BROWSER_TIMEOUT" : error.code)
        : "BROWSER_RUNTIME_FAILED";
      return this.ground(candidate, request, {
        candidate, observedAt: this.now(),
        ...(retainedIdentity
          ? { sourceEntityId: retainedIdentity.extraction.outlet.sourceEntityId, sourceUrl: retainedIdentity.extraction.outlet.sourceUrl, entityMatch: retainedIdentity.inspection.resolution }
          : { entityMatch: { confidence: "LOW" as const, matchedBy: [] } }),
        pageState: "EXTRACTION_FAILED", failureCode,
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
    selected: MatchedTableCheckOutlet,
  ) {
      if (this.options.identityOnly) return this.ground(candidate, request, {
        candidate, observedAt, sourceEntityId: selected.extraction.outlet.sourceEntityId,
        sourceUrl: selected.extraction.outlet.sourceUrl, entityMatch: selected.inspection.resolution,
        pageState: "EXTRACTION_FAILED",
      }, browser);
      // A prior identity observation may be reused for matching, but the live
      // page must be the selected outlet before any request controls are read.
      let selectedPage = await this.executor.snapshot({ source: "TABLECHECK", stage: "IDENTITY", signal, session });
      if (sourceUrlKey(selectedPage.url) !== sourceUrlKey(selected.page.url)) {
        await this.executor.navigate({ source: "TABLECHECK", stage: "IDENTITY", signal,
          allowedOrigins: ["https://www.tablecheck.com"], session, url: selected.page.url, observed: true });
        selectedPage = await this.executor.snapshot({ source: "TABLECHECK", stage: "IDENTITY", signal, session });
      }
      const freshExtraction = parseTableCheckOutletIdentityWithEvidence(selectedPage, selected.page.url);
      const freshInspection = freshExtraction && inspectCandidateOutlet(candidate, freshExtraction, selectedPage);
      const freshReservation = freshExtraction && resolveTableCheckReservationTarget(selectedPage, freshExtraction.outlet, this.options.networkPolicy);
      if (!freshExtraction || freshInspection?.resolution.confidence !== "HIGH" || !freshReservation
        || sourceUrlKey(freshExtraction.outlet.sourceUrl) !== sourceUrlKey(selected.extraction.outlet.sourceUrl)) {
        return this.ground(candidate, request, { candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] },
          pageState: "EXTRACTION_FAILED", failureCode: "TABLECHECK_ENTITY_MATCH_UNCERTAIN" }, browser);
      }
      selected = { ...selected, extraction: freshExtraction, inspection: freshInspection, reservation: freshReservation, page: selectedPage };
      let retainedIdentity = selected;
      let activeSelected = selected;
      let alternateRecoveryUsed = false;
      let page = activeSelected.page;
      // Menu observations belong to the confirmed guide, even if a separate
      // request page later has no readable inventory or menu.
      const guideReadAt = this.now();
      const guideIdentity = this.options.sourceFactsModel ? this.ground(candidate, request, {candidate, observedAt: guideReadAt,
        sourceEntityId: selected.extraction.outlet.sourceEntityId, sourceUrl: selectedPage.url,
        entityMatch: selected.inspection.resolution, pageState: "EXTRACTION_FAILED"}).evidence.find(item=>item.kind==="ENTITY_MATCH") : undefined;
      const guideFacts = guideIdentity ? await readQuotedRestaurantSourceFacts({complete: input=>this.executor.readModel(signal,()=>this.options.sourceFactsModel!.complete(input))},
        {candidate, identity:guideIdentity, page:selectedPage, readAt:guideReadAt, criteria:request.hardCriteria},this.now,signal) : undefined;
      let readWindow = request.timeWindow;
      const covered: Array<{earliest:string;latest:string;status:"EMPTY"|"AVAILABLE"}> = [];
      let coverageStop: "RESULT_FOUND"|"OBSERVED_TIMES_EXHAUSTED"|"TIME_QUERY_LIMIT"|"INCOMPLETE_RESULT" = "INCOMPLETE_RESULT";
      const ground = (observation: TableCheckAvailabilityPageObservation) => {
        const result = this.ground(candidate, request, observation, browser);
        if (covered.length) {
          const points = [...new Set(covered.map(p => p.earliest))].sort();
          const uncovered: NonNullable<typeof result.check.timeWindowCoverage>["uncovered"] = [];
          let earliest = request.timeWindow.earliest, earliestExclusive = false;
          for (const time of points) {
            if (time > earliest) uncovered.push({earliest, latest: time, earliestExclusive, latestExclusive: true});
            earliest = time; earliestExclusive = true;
          }
          if (earliest < request.timeWindow.latest) uncovered.push({earliest, latest: request.timeWindow.latest, earliestExclusive, latestExclusive: false});
          result.check.timeWindowCoverage = {date: request.date, partySize: request.partySize, requestedWindow: {...request.timeWindow}, covered: [...covered], uncovered, stopReason: coverageStop};
        }
        const guideEvidence = guideIdentity && guideFacts ? quotedRestaurantSourceEvidence(guideIdentity, guideFacts) : undefined;
        return guideEvidence ? mergeQuotedSourceFacts(candidate.restaurant.id, result, [guideIdentity!,guideEvidence]) : result;
      };
      if (isBrowserReadPathProhibited(this.options.networkPolicy, activeSelected.reservation.url)) {
        return ground({candidate, observedAt: this.now(), sourceEntityId: selected.extraction.outlet.sourceEntityId,
          sourceUrl: selectedPage.url, entityMatch: selected.inspection.resolution, pageState: "SOURCE_UNSUPPORTED", failureCode: "SOURCE_UNSUPPORTED",
          excerpt: "The observed linked workflow is prohibited by the current source read policy; this outlet's inventory was not read."});
      }
      // Configure passive GET capture before any lawful navigation that can
      // itself issue the source-owned availability request.  Capture is never
      // an availability oracle, but late registration loses its chronology.
      const availabilityResponseRule = tableCheckAvailabilityResponseRule(activeSelected.reservation);
      if (availabilityResponseRule) await session.captureResponses?.([availabilityResponseRule]);
      const requestedReservationUrl = activeSelected.reservation.url;
      // Embedded controls belong to this freshly reverified page. Its public
      // routing query does not require a canonical-URL navigation.
      if (activeSelected.reservation.kind === "LINKED_PAGE" && requestedReservationUrl !== page.url) {
        await this.executor.navigate({
          source: "TABLECHECK", stage: "AVAILABILITY", signal, allowedOrigins: ["https://www.tablecheck.com"], session,
          url: requestedReservationUrl, observed: true,
        });
        page = await this.executor.snapshot({ source: "TABLECHECK", stage: "AVAILABILITY", signal, session });
        if (!matchesReservationPage(page, activeSelected.reservation.url)) {
          return ground({ candidate, observedAt, entityMatch: { confidence: "LOW", matchedBy: [] },
            pageState: "EXTRACTION_FAILED", failureCode: "TABLECHECK_ENTITY_MATCH_UNCERTAIN" });
        }
      }
      page = await this.resumeAfterUserIntervention(candidate, request, session, page, "AVAILABILITY", signal);
      if (hasTableCheckBotChallenge(page) && !alternateRecoveryUsed) {
        alternateRecoveryUsed = true;
        const recovered = await this.recoverObservedAlternate(candidate, request, session, signal, activeSelected);
        if (recovered) {
          activeSelected = recovered.selected;
          page = recovered.page;
        }
      }
      if (hasTableCheckBotChallenge(page)) return ground({
        candidate, observedAt, sourceEntityId: retainedIdentity.extraction.outlet.sourceEntityId, sourceUrl: retainedIdentity.extraction.outlet.sourceUrl,
        entityMatch: retainedIdentity.inspection.resolution, pageState: "BOT_CHALLENGE", failureCode: "BOT_CHALLENGE", excerpt: tableCheckPageExcerpt(page),
      });
      const currentResult = (current: BrowserSnapshot, controls: readonly BrowserPageControl[]) => {
        const serviceScope = selectedServiceScope(controls);
        const requestSelected = hasTableCheckSelectedRequest(current, request.date, request.partySize, controls);
        // A page without this source-specific radio remains compatible with
        // ordinary TableCheck request binding. When the observed group exists,
        // however, no checked member is a distinct query prerequisite rather
        // than evidence that date or party selection failed.
        const categorySelected = serviceScope !== null;
        const selected = requestSelected && categorySelected;
        const html = parseTableCheckAvailabilitySlots(current, { date: request.date, partySize: request.partySize, timeWindow: readWindow });
        const live = parseTableCheckControlAvailability(controls, request.date, request.partySize, current.url, readWindow);
        const htmlRejected = hasTableCheckDisabledRequestMarkup(current, request.date, request.partySize, request.timeWindow, live.availableSlots);
        const liveRejected = hasTableCheckDisabledRequestControl(controls, request.date, request.partySize, current.url, readWindow, html.availableSlots);
        const loading = current.settlement === "PENDING" || hasTableCheckAvailabilityResultLoading(current);
        const hasResultWidget = hasTableCheckAvailabilityWidget(current);
        const htmlCurrent = !loading && selected && html.queryComplete;
        // A live link cannot establish that it belongs to a guide's result
        // component when the source HTML has an explicit component but no
        // matching in-component result. Keep the historical live-only path
        // for public reservation pages without that widget.
        const liveCurrent = !loading && live.queryComplete && (!hasResultWidget || html.queryComplete);
        // HTML and live controls are two readings of one current result.  Do
        // not OR their slots into a synthetic answer: if both are complete,
        // they must agree about requested-window availability/emptiness.
        const inRequestWindow = (slots: readonly string[]) => slots.filter((slot) => slot >= request.timeWindow.earliest && slot <= request.timeWindow.latest);
        const sameResult = !htmlCurrent || !liveCurrent
          || (html.explicitlyEmpty === live.explicitlyEmpty
            && inRequestWindow(html.availableSlots).join(",") === inRequestWindow(live.availableSlots).join(","));
        const rawResult = htmlRejected || liveRejected || !sameResult ? undefined : htmlCurrent ? html : liveCurrent ? live : undefined;
        const scopeBound = hasTableCheckScopeBoundSlot(current, controls, request, serviceScope ?? undefined, rawResult?.availableSlots ?? []);
        const result = rawResult && scopeBound ? rawResult : undefined;
        return { selected, requestSelected, categorySelected, serviceScope, scopeBound, html, live, loading, htmlRejected, liveRejected, result, complete: result !== undefined };
      };
      const availabilityInput: BrowserSkillReadInput = {
        taskId: `browser-read:${candidate.restaurant.id}`,
        source: "TABLECHECK",
        ...(tableCheckDiscoveryPack.skillPath ? { sourceSkillPath: tableCheckDiscoveryPack.skillPath } : {}),
        stage: "AVAILABILITY",
        session: session!,
        signal,
        allowedOrigins: ["https://www.tablecheck.com"],
        goal: { outlet: { name: candidate.restaurant.outletName, address: candidate.restaurant.address }, date: request.date, partySize: request.partySize, timeWindow: request.timeWindow, hardCriteria: request.hardCriteria },
        objective: "For the already identity-grounded outlet, set and verify the requested date, party size, and time window, then read the latest explicit public availability result. If the current public query exposes a source-permitted service-category radio, selecting one current permitted category and reading back its checked state is a query prerequisite before its category-bound result can appear. Do not submit a reservation.",
        methodReason: "The verifier has not yet established a completed availability result for the full Router-bound request.",
        completion: (current, controls) => {
          const assessed = currentResult(current, controls);
          const capturedResponse = parseTableCheckCapturedAvailability(current.responses, activeSelected.reservation, request);
          // A captured `failure/data:null` payload is kept as page diagnostic
          // material. It has no source semantic contract for inventory and is
          // therefore deliberately excluded from completion and slot grounding.
          // Some TableCheck pages render the public, request-bound result only
          // as live controls. Evaluate that evidence at completion as well as
          // during final grounding, otherwise a correct DOM-only slot is
          // rejected before the Domain can inspect it.
          return {
            resultBusy: assessed.loading,
            resultKey: JSON.stringify([current.url, request.date, request.partySize, request.timeWindow, assessed.serviceScope, assessed.result, assessed.html.emptyMealtime]),
            complete: hasTableCheckBotChallenge(current) || assessed.complete || (assessed.selected && !assessed.loading && !assessed.serviceScope && assessed.html.emptyMealtime !== undefined),
            reason: !assessed.requestSelected
              ? "The latest page must explicitly confirm the complete authoritative date and party size before any result can be used."
              : !assessed.categorySelected
              ? "Date and party are already selected, but this public query has no selected service category. If one current radio target offers SET_CHECKED, select exactly one source-permitted category with CHECKED, re-observe its checked state, then wait for the latest category-bound result; otherwise request human help."
              : assessed.loading
              ? "The current availability widget is still loading. Do not use its prior slot links; wait for the current result to settle."
              : assessed.selected
              ? capturedResponse
                ? "The page returned an unclassified response for the selected request; wait for explicit public slot UI or a request-bound HTML/control result before drawing an inventory conclusion."
                : "Date and party are selected, but the latest HTML/control observations do not yet form one completed, non-conflicting result for the requested time window. If the mealtime differs, open the observed time combobox and choose a time inside the goal window; otherwise wait for its result."
              : "The selected request is incomplete; continue only with a current permitted query action or request human help.",
          };
        },
      };
      const readAvailability = () => this.executor.runSkill(availabilityInput);
      let availabilityRead = await readAvailability();
      for (let queries = 1; queries <= 4; queries++) {
        const assessed = currentResult(availabilityRead.snapshot, availabilityRead.controls);
        if (availabilityRead.status !== "COMPLETED" || !assessed.selected || assessed.loading || assessed.serviceScope || !assessed.html.emptyMealtime) break;
        const time = assessed.html.emptyMealtime.time;
        if (!covered.some(p => p.earliest === time)) covered.push({earliest:time,latest:time,status:"EMPTY"});
        if (request.timeWindow.earliest === request.timeWindow.latest && assessed.html.queryComplete) {coverageStop = "OBSERVED_TIMES_EXHAUSTED"; break;}
        if (queries === 4) {coverageStop = "TIME_QUERY_LIMIT"; break;}
        try {
          const next = await this.executor.advanceAvailabilityTime({...availabilityInput, goal: {...availabilityInput.goal, timeWindow: request.timeWindow}}, covered.map(p=>p.earliest));
          if (!next) {coverageStop = "OBSERVED_TIMES_EXHAUSTED"; break;}
          readWindow = {earliest: next, latest: next};
          availabilityInput.goal = {...availabilityInput.goal, timeWindow: readWindow};
          availabilityRead = await readAvailability();
        } catch (error) {
          if (signal.aborted || error instanceof BrowserRuntimeError && ["BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED", "BROWSER_RUNTIME_UNAVAILABLE", "BROWSER_ABORTED"].includes(error.code)
            || error && typeof error === "object" && "code" in error && error.code === "MODEL_CALL_BUDGET_EXHAUSTED") throw error;
          coverageStop = "INCOMPLETE_RESULT";
          return ground({candidate, observedAt: this.now(), sourceEntityId: activeSelected.extraction.outlet.sourceEntityId,
            sourceUrl: availabilityRead.snapshot.url, entityMatch: activeSelected.inspection.resolution, pageState: "EXTRACTION_FAILED",
            failureCode: error instanceof BrowserRuntimeError ? error.code : "BROWSER_RUNTIME_FAILED",
            excerpt: "A later time query did not complete. Only the recorded empty points are covered; the remaining request window is UNKNOWN."});
        }
      }
      page = availabilityRead.snapshot;
      page = await this.resumeAfterUserIntervention(candidate, request, session, page, "AVAILABILITY", signal);
      if (hasTableCheckBotChallenge(page) && !alternateRecoveryUsed) {
        alternateRecoveryUsed = true;
        const recovered = await this.recoverObservedAlternate(candidate, request, session, signal, activeSelected);
        if (recovered) {
          activeSelected = recovered.selected;
          // The earlier controls/status belong to the challenged page. Read
          // the recovered source page again before accepting any request or slot.
          availabilityRead = await readAvailability();
          page = availabilityRead.snapshot;
          page = await this.resumeAfterUserIntervention(candidate, request, session, page, "AVAILABILITY", signal);
        }
      }
      if (hasTableCheckBotChallenge(page)) return ground({
        candidate, observedAt, sourceEntityId: retainedIdentity.extraction.outlet.sourceEntityId, sourceUrl: retainedIdentity.extraction.outlet.sourceUrl,
        entityMatch: retainedIdentity.inspection.resolution, pageState: "BOT_CHALLENGE", failureCode: "BOT_CHALLENGE", excerpt: tableCheckPageExcerpt(page),
      });
      const assessed = currentResult(page, availabilityRead.controls);
      if (availabilityRead.status === "COMPLETED" && assessed.selected && !assessed.loading && !assessed.serviceScope
        && assessed.html.emptyMealtime && request.timeWindow.earliest !== request.timeWindow.latest) {
        return ground({
          candidate, observedAt: this.now(), sourceEntityId: activeSelected.extraction.outlet.sourceEntityId,
          sourceUrl: page.url, entityMatch: activeSelected.inspection.resolution,
          requestedDate: request.date, requestedPartySize: request.partySize, pageState: "EXTRACTION_FAILED",
          failureCode: "SELECTED_MEALTIME_EMPTY", excerpt: `${JSON.stringify(assessed.html.emptyMealtime)}; other times in the requested window remain UNKNOWN`,
        });
      }
      if (availabilityRead.status !== "COMPLETED" || !assessed.complete) return ground({
        candidate, observedAt, sourceEntityId: activeSelected.extraction.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: activeSelected.inspection.resolution, pageState: "EXTRACTION_FAILED",
        failureCode: availabilityRead.reasonCode ?? (assessed.selected ? "AVAILABILITY_RESULT_UNOBSERVED" : "REQUEST_SELECTION_UNCONFIRMED"),
      });
      const capturedResponse = parseTableCheckCapturedAvailability(page.responses, activeSelected.reservation, request);
      // Never turn an unclassified passive payload into slot or completion
      // evidence. The page controls/HTML must independently bind request and
      // inventory before the Domain sees AVAILABLE or UNAVAILABLE.
      void capturedResponse;
      const slots = assessed.result!;
      const qualifying = slots.queryComplete
        && slots.availableSlots.some((slot) => slot >= request.timeWindow.earliest && slot <= request.timeWindow.latest);
      const immediateSlotNotOffered = request.immediateAvailability !== undefined
        && !qualifying && !slots.explicitlyEmpty && slots.hasExplicitSlotUi;
      if (qualifying) {
        coverageStop = "RESULT_FOUND";
        for (const time of slots.availableSlots.filter(t => t >= request.timeWindow.earliest && t <= request.timeWindow.latest)) covered.push({earliest:time,latest:time,status:"AVAILABLE"});
      }
      return ground({
        candidate, observedAt: this.now(), sourceEntityId: activeSelected.extraction.outlet.sourceEntityId, sourceUrl: page.url, entityMatch: activeSelected.inspection.resolution, requestedDate: request.date, requestedPartySize: request.partySize,
        ...(assessed.scopeBound && assessed.serviceScope ? { serviceScope: assessed.serviceScope } : {}),
        pageState: qualifying ? "AVAILABLE" : immediateSlotNotOffered ? "EXTRACTION_FAILED" : slots.queryComplete && (slots.explicitlyEmpty || slots.hasExplicitSlotUi) ? "NO_MATCHING_SLOT" : "EXTRACTION_FAILED",
        ...(immediateSlotNotOffered ? { failureCode: "IMMEDIATE_SLOT_NOT_OFFERED" } : {}),
        visibleSlots: slots.availableSlots,
        // A selected radio scopes inventory, never all visible menu prose.
        // This source has no observed public menu-to-category binding yet, so
        // scoped inventory leaves HARD facts for cited source judgment.
        excerpt: tableCheckPageExcerpt(page),
      });
  }

  private ground(
    candidate: RestaurantAvailabilityRequest["candidates"][number],
    request: RestaurantAvailabilityRequest,
    observation: TableCheckAvailabilityPageObservation,
    metadata?: BrowserSessionMetadata,
  ) {
    const grounded = tableCheckDiscoveryPack.availability!.ground(candidate, request, {
      candidateId: candidate.restaurant.id,
      ...(observation.sourceEntityId ? { sourceEntityId: observation.sourceEntityId } : {}),
      ...(observation.sourceUrl ? { sourceUrl: observation.sourceUrl } : {}),
      observedAt: observation.observedAt,
      ...(observation.requestedDate ? { requestedDate: observation.requestedDate } : {}),
      ...(observation.requestedPartySize !== undefined ? { requestedPartySize: observation.requestedPartySize } : {}),
      ...(observation.serviceScope ? { serviceScope: observation.serviceScope } : {}),
      entityMatch: observation.entityMatch,
      pageState: observation.pageState,
      ...(observation.priceFacts ? { priceFacts: observation.priceFacts } : {}),
      ...(observation.visibleSlots ? { visibleSlots: observation.visibleSlots } : {}),
      ...(observation.verifiedHardCriteria ? { verifiedHardCriteria: observation.verifiedHardCriteria } : {}),
      ...(observation.excerpt ? { excerpt: observation.excerpt } : {}),
      ...(observation.failureCode ? { failureCode: observation.failureCode } : {}),
    }, this.now());
    return { ...grounded, ...(metadata ? { browser: metadata } : {}) };
  }
}
