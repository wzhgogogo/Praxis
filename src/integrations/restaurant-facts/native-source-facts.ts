import type { ModelGateway } from "../../core/model/contracts.js";
import { readQuotedRestaurantSourceFacts, quotedRestaurantSourceEvidence, type QuotedRestaurantSourceFacts } from "./model-source-facts.js";
import { createRestaurantFactSourceDocument as sourceDocument, bindRestaurantFactSourceRoles, type RestaurantFactPageObserver } from "./fact-source-document.js";
import {isBrowserReadPathProhibited} from "../../infrastructure/browser/browser-read-policy.js";
import type { BrowserReadLimits } from "../../infrastructure/browser/browser-task-executor.js";
import { createHash } from "node:crypto";

import { groundRestaurantWebsiteFacts } from "../../domains/restaurant/read-grounding.js";
import type { RestaurantCandidateFactPort } from "../../application/restaurant-execution-router.js";
import type { RestaurantCandidateFactRead, RestaurantCandidateFactRequest, RestaurantReadEvidence, RestaurantFactSourceDocument } from "../../domains/restaurant/contracts.js";
import type { BrowserReadNetworkPolicy, BrowserRuntime, BrowserSnapshot, BrowserPageControl } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserTaskExecutor, type BrowserExecutionBudget, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserReadActionDecisionPort } from "../../infrastructure/browser/browser-action-decision.js";
import { inspectNativeOutletContinuity, sameNativeOutletUrl } from "../restaurant-availability/native-outlet-continuity.js";
import { parseTabelogOutletIdentityWithEvidence, parseTabelogSourceFieldQuotes } from "../tabelog/tabelog-page-parser.js";
import { hasTableCheckBotChallenge, hasTableCheckPageUnavailable, parseTableCheckOutletIdentityWithEvidence, parseTableCheckScopedMenuSourcePartition, resolveTableCheckReservationTarget, sameReservationOutlet, type TableCheckReservationTarget } from "../tablecheck/tablecheck-page-parser.js";
import { candidateStructuredObservation, candidateVisibleObservation } from "./google-listed-website-facts.js";
import type { RestaurantFactJudgmentPort } from "./model-fact-judgment.js";

function key(value: string): string | undefined {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
  } catch { return undefined; }
}


/** A menu/course page may be one child path below the observed native outlet. */
function sameNativeOutletSubpath(provider: "TABELOG" | "TABLECHECK", sourceUrl: string, pageUrl: string, canonicalUrl: string | undefined): boolean {
  if (!canonicalUrl || !sameNativeOutletUrl(provider, sourceUrl, canonicalUrl)) return false;
  try {
    const source = new URL(sourceUrl); const page = new URL(pageUrl);
    const base = source.pathname.replace(/\/$/, "");
    return source.origin === page.origin && page.pathname.startsWith(`${base}/`);
  } catch { return false; }
}

/** The same criterion gate is used before ending either native or website fact work. */
function hardFactsResolved(
  intent: RestaurantCandidateFactRequest["intent"],
  evidence: readonly RestaurantReadEvidence[],
): boolean {
  const values = (key: string) => evidence.flatMap((item) => Array.isArray(item.claims[key])
    && item.claims[key].every((value) => typeof value === "string") ? item.claims[key] as string[] : []);
  const normalized = (value: string) => value.trim().toLocaleLowerCase("en-US");
  const positive = new Set(values("verifiedHardCriteria").map(normalized));
  const verifiedNegative = new Set(values("verifiedNegativeCriteria").map(normalized));
  const conflicts = new Set(values("violatedNegativeCriteria").map(normalized));
  const categoryUnknown = new Set(values("categoryUnknownNegativeCriteria").map(normalized));
  return intent.criteria.filter((criterion) => criterion.strength === "HARD").every((criterion) => criterion.polarity === "POSITIVE"
    ? positive.has(normalized(criterion.text))
    : verifiedNegative.has(normalized(criterion.text)) || conflicts.has(normalized(criterion.text)) || categoryUnknown.has(normalized(criterion.text)));
}

function hasConfirmedNegativeConflict(
  intent: RestaurantCandidateFactRequest["intent"],
  evidence: readonly RestaurantReadEvidence[],
): boolean {
  const excluded = new Set(intent.criteria.filter((criterion) => criterion.strength === "HARD" && criterion.polarity === "NEGATIVE")
    .map((criterion) => criterion.text.trim().toLocaleLowerCase("en-US")));
  return evidence.some((item) => Array.isArray(item.claims.violatedNegativeCriteria)
    && item.claims.violatedNegativeCriteria.some((value) => typeof value === "string" && excluded.has(value.trim().toLocaleLowerCase("en-US"))));
}

/** Reopens the same source detail and cites its own text; Google details are never required. */
export class NativeSourceFactRead implements RestaurantCandidateFactPort {
  readonly executionRoute = "GENERIC_BROWSER" as const;

  constructor(
    private readonly limits: BrowserReadLimits,
    private readonly runtime: BrowserRuntime,
    private readonly judgment: RestaurantFactJudgmentPort,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly modelDecision?: BrowserReadActionDecisionPort,
    private readonly browserBudget?: BrowserExecutionBudget,
    private readonly onBrowserDiagnostic?: (diagnostic: BrowserExecutionDiagnostic) => void,
    /** Actual compositions provide the source-owned isolated read policy. */
    private readonly networkPolicy?: BrowserReadNetworkPolicy,
    private readonly onSourcePage?: RestaurantFactPageObserver,
    private readonly sourceFactsModel?: ModelGateway,
  ) {}

  async inspectFacts(request: RestaurantCandidateFactRequest, signal: AbortSignal): Promise<RestaurantCandidateFactRead> {
    const startedAt = Date.now();
    const evidence: RestaurantReadEvidence[] = [];
    const sourceDocuments: RestaurantFactSourceDocument[] = [];
    const factChecks: RestaurantCandidateFactRead["factChecks"] = {};
    const nativeContinuity: NonNullable<RestaurantCandidateFactRead["metadata"]["nativeContinuity"]> = [];
    let modelCalls = 0;
    for (const candidate of request.candidates) {
      const ids = candidate.restaurant.sourceIds;
      const provider = ids.tabelogNativeDetailUri && ids.tabelog ? "TABELOG" as const
        : ids.tablecheckNativeGuideUri && ids.tablecheck ? "TABLECHECK" as const : undefined;
      const sourceUrl = provider === "TABELOG" ? ids.tabelogNativeDetailUri : provider === "TABLECHECK" ? ids.tablecheckNativeGuideUri : undefined;
      const sourceEntityId = provider === "TABELOG" ? ids.tabelog : provider === "TABLECHECK" ? ids.tablecheck : undefined;
      const checkedAt = this.now();
      if (!provider || !sourceUrl || !sourceEntityId || !key(sourceUrl)) {
        factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "NATIVE_SOURCE_ID_MISSING" };
        continue;
      }
      if (isBrowserReadPathProhibited(this.networkPolicy, sourceUrl)) {
        factChecks[candidate.restaurant.id] = {status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "SOURCE_UNSUPPORTED"};
        continue;
      }
      const executor = new BrowserTaskExecutor(this.runtime, {
        ...this.limits,
        ...(!request.capturePagesOnly&&this.modelDecision ? { modelDecision: this.modelDecision } : {}),
        ...(this.browserBudget ? { budget: this.browserBudget } : {}),
        ...(this.onBrowserDiagnostic ? { onDiagnostic: this.onBrowserDiagnostic } : {}),
      });
      try {
        executor.beginCandidate(candidate.restaurant.id);
        executor.beginProvider(candidate.restaurant.id, provider, "FACTS");
        const session = await executor.acquire(signal, provider, "FACTS", this.networkPolicy);
        await executor.navigate({ source: provider, stage: "FACTS", signal, allowedOrigins: [new URL(sourceUrl).origin], session, url: sourceUrl, observed:true });
        const documents: RestaurantFactSourceDocument[] = [];
        const retained = new Map<string, {page: BrowserSnapshot; identity: RestaurantReadEvidence; readAt: string; frames: Array<{document: RestaurantFactSourceDocument; text: string}>; processed: boolean}>();
        const identities: RestaurantReadEvidence[] = [];
        const observedOfficialOrigins = new Set<string>();
        let tableCheckServiceControls: readonly BrowserPageControl[] = [];
        let observedReservationTarget: TableCheckReservationTarget | undefined;
        const retainOfficialOrigins = (controls: readonly BrowserPageControl[]): void => {
          for (const control of controls) {
            if (control.kind !== "LINK" || !control.visible || control.disabled || !control.href
              || !/(?:official|website|home\s*page|公式|ホームページ)/iu.test(control.label)) continue;
            try {
              const url = new URL(control.href);
              if (/^https?:$/i.test(url.protocol) && url.origin !== new URL(sourceUrl).origin) observedOfficialOrigins.add(url.origin);
            } catch { /* malformed source href remains unavailable */ }
          }
        };
        const retainDocuments = (
          page: BrowserSnapshot,
          identity: RestaurantReadEvidence,
          controls: readonly BrowserPageControl[] = tableCheckServiceControls,
        ): boolean => {
          const scopedMenu = provider === "TABLECHECK" ? parseTableCheckScopedMenuSourcePartition(page, controls) : undefined;
          // When public markup partitions menu text by category, retain the
          // page remainder for venue-wide facts but never duplicate a scoped
          // menu container as an unscoped substitute.
          const parts = scopedMenu?.scoped.length
            ? [...scopedMenu.scoped.map(item=>({text:item.text,scope:item.serviceScope})),...(scopedMenu.unscopedText?[{text:scopedMenu.unscopedText,scope:undefined}]:[])]
            : [{text:scopedMenu?.unscopedText ?? page.text,scope:undefined}];
          const frames = parts.map(part=>({text:part.text,document:bindRestaurantFactSourceRoles(sourceDocument(candidate.restaurant.id,identity.evidenceId,part.text,part.scope,provider==="TABELOG"?parseTabelogSourceFieldQuotes(page):undefined),page,typeof identity.claims.outletName === "string" ? [identity.claims.outletName] : [])}));
          const additions=frames.filter(frame=>!documents.some(item=>item.id===frame.document.id));
          documents.push(...additions.map(frame=>frame.document));
          if(additions.length)retained.set(createHash("sha256").update(identity.evidenceId+page.text).digest("hex"),{page:structuredClone(page),identity:structuredClone(identity),readAt:this.now(),frames:frames.map(frame=>({...frame,document:documents.find(d=>d.id===frame.document.id)!})),processed:false});
          this.onSourcePage?.(structuredClone({ candidateId: candidate.restaurant.id, readRunId: request.readRunId, requestedSourceUrl: sourceUrl, identity, snapshot: page, observedAt: this.now() }));
          return additions.length > 0;
        };
        const retainPageHours = (page: BrowserSnapshot): void => {
          const structured = candidateStructuredObservation(candidate, page.url, checkedAt, page.html);
          const visible = candidateVisibleObservation(candidate, page.url, checkedAt, page.text, page.html, { allowExactSourcePhone: false });
          const observation = structured ?? visible;
          const hours = [...structured?.regularOpeningHours ?? [], ...visible?.regularOpeningHours ?? []];
          if (!observation || !hours.length) return;
          // Business hours are separate from menu judgments and add no HARD or stock claim.
          const grounded = groundRestaurantWebsiteFacts(candidate, { ...request.intent, criteria: [] }, {
            candidateId: candidate.restaurant.id, sourceUrl: page.url, observedAt: checkedAt,
            entityMatch: observation.entityMatch, regularOpeningHours: hours,
          });
          for (const item of grounded.evidence) if (!identities.some(known => known.evidenceId === item.evidenceId)) identities.push(item);
        };
        const retainNativePage = (page: BrowserSnapshot, controls: readonly BrowserPageControl[] = tableCheckServiceControls): boolean => {
          const extraction = provider === "TABELOG"
            ? parseTabelogOutletIdentityWithEvidence(page, { sourceEntityId, sourceUrl, outletName: candidate.restaurant.outletName })
            : parseTableCheckOutletIdentityWithEvidence(page, sourceUrl);
          const continuity = extraction && inspectNativeOutletContinuity({ provider, sourceEntityId, sourceUrl }, page, {
            sourceEntityId: extraction.outlet.sourceEntityId, sourceUrl: extraction.outlet.sourceUrl,
            canonicalUrl: extraction.canonicalUrl,
            pageOwnedName: extraction.fields.outletName.source !== "ABSENT" && extraction.fields.outletName.source !== "SEARCH_RESULT",
            pageOwnedAddress: extraction.fields.address.source !== "ABSENT" && extraction.fields.address.source !== "SEARCH_RESULT",
          });
          // A same-origin menu/course link can carry a canonical detail URL.
          // It remains usable only when that canonical source and the page's
          // own structured name/address both bind it to this exact outlet.
          const relatedSourcePage = extraction !== undefined && continuity?.reason === "PROVIDER_CHANGED"
            && sameNativeOutletSubpath(provider, sourceUrl, page.url, extraction?.canonicalUrl)
            && extraction.fields.outletName.source !== "ABSENT" && extraction.fields.outletName.source !== "SEARCH_RESULT"
            && extraction.fields.address.source !== "ABSENT" && extraction.fields.address.source !== "SEARCH_RESULT";
          const continuityConfirmed = continuity?.confirmed === true || relatedSourcePage;
          nativeContinuity.push({ candidateId: candidate.restaurant.id, provider, expectedSourceEntityId: sourceEntityId,
            ...(continuity?.observedSourceEntityId ? { observedSourceEntityId: continuity.observedSourceEntityId } : {}),
            confirmed: continuityConfirmed, reason: continuityConfirmed ? "SAME_SOURCE_OUTLET" : continuity?.reason ?? "PAGE_IDENTITY_ABSENT" });
          if (!extraction || !continuityConfirmed) return false;
          const identityEvidenceId = `evidence:restaurant:native-fact-identity:${createHash("sha256").update(`${candidate.restaurant.id}:${page.url}`).digest("hex").slice(0, 24)}`;
          let identity = identities.find((item) => item.evidenceId === identityEvidenceId);
          if (!identity) {
            identity = {
              evidenceId: identityEvidenceId, kind: "ENTITY_MATCH", provider,
              candidateId: candidate.restaurant.id, sourceEntityId, sourceUrl: page.url,
              observedAt: checkedAt, requestFingerprint: JSON.stringify({ candidateId: candidate.restaurant.id, sourceUrl: page.url }),
              claims: { observationKind: "PUBLIC_PAGE", outletName: extraction.outlet.outletName, address: extraction.outlet.address ?? "" },
              entityMatch: { confidence: "HIGH", matchedBy: ["NATIVE_SOURCE_ID_AND_DETAIL"] },
            };
            identities.push(identity);
          }
          retainPageHours(page);
          return retainDocuments(page, identity, controls);
        };
        const isObservedReservationPage = (page: BrowserSnapshot): boolean => {
          if (provider !== "TABLECHECK" || !observedReservationTarget) return false;
          try {
            const expected = new URL(observedReservationTarget.url);
            const observed = new URL(page.url);
            return expected.origin === observed.origin && expected.pathname === observed.pathname
              && sameReservationOutlet(sourceUrl, observed);
          } catch { return false; }
        };
        const retainTableCheckReservationPage = (page: BrowserSnapshot, controls: readonly BrowserPageControl[]): boolean => {
          if (!isObservedReservationPage(page)) return false;
          // An observed entrance does not override an explicit provider error
          // or challenge. Those pages can retain stale restaurant metadata.
          if (hasTableCheckBotChallenge(page) || hasTableCheckPageUnavailable(page)) return false;
          const extraction = parseTableCheckOutletIdentityWithEvidence(page, sourceUrl);
          if (!extraction || extraction.fields.outletName.source === "ABSENT" || extraction.fields.address.source === "ABSENT") return false;
          if (extraction.canonicalUrl) {
            try {
              const canonical = new URL(extraction.canonicalUrl);
              const guide = new URL(sourceUrl);
              const reservation = new URL(observedReservationTarget!.url);
              const sameGuide = canonical.origin === guide.origin && canonical.pathname.replace(/\/$/, "") === guide.pathname.replace(/\/$/, "");
              const sameObservedReservation = canonical.origin === reservation.origin && canonical.pathname.replace(/\/$/, "") === reservation.pathname.replace(/\/$/, "");
              if (!sameGuide && !sameObservedReservation && !sameReservationOutlet(sourceUrl, canonical)) return false;
            } catch { return false; }
          }
          const identityEvidenceId = `evidence:restaurant:native-fact-reservation-identity:${createHash("sha256").update(`${candidate.restaurant.id}:${page.url}`).digest("hex").slice(0, 24)}`;
          let identity = identities.find((item) => item.evidenceId === identityEvidenceId);
          if (!identity) {
            identity = {
              evidenceId: identityEvidenceId, kind: "ENTITY_MATCH", provider: "TABLECHECK",
              candidateId: candidate.restaurant.id, sourceEntityId, sourceUrl: page.url,
              observedAt: checkedAt, requestFingerprint: JSON.stringify({ candidateId: candidate.restaurant.id, sourceUrl: page.url }),
              claims: { observationKind: "PUBLIC_PAGE", outletName: extraction.outlet.outletName, address: extraction.outlet.address ?? "" },
              entityMatch: { confidence: "HIGH", matchedBy: ["NATIVE_SOURCE_ID_AND_RESERVATION_ENTRANCE"] },
            };
            identities.push(identity);
          }
          nativeContinuity.push({ candidateId: candidate.restaurant.id, provider, expectedSourceEntityId: sourceEntityId,
            observedSourceEntityId: extraction.outlet.sourceEntityId, confirmed: true, reason: "SAME_SOURCE_OUTLET" });
          retainPageHours(page);
          return retainDocuments(page, identity, controls);
        };
        const retainOfficialPage = (page: BrowserSnapshot): boolean => {
          const observation = candidateStructuredObservation(candidate, page.url, checkedAt, page.html)
            // An observed official origin is a new identity boundary. A
            // shared telephone number can support a Google-listed page but
            // cannot bind a branch or brand menu reached from a native detail.
            ?? candidateVisibleObservation(candidate, page.url, checkedAt, page.text, page.html, { allowExactSourcePhone: false });
          if (!observation) return false;
          const identityEvidenceId = `evidence:restaurant:official-fact-identity:${createHash("sha256").update(`${candidate.restaurant.id}:${page.url}`).digest("hex").slice(0, 24)}`;
          let identity = identities.find(item => item.evidenceId === identityEvidenceId);
          if (!identity) {
            identity = { evidenceId: identityEvidenceId, kind: "ENTITY_MATCH", provider: "RESTAURANT_WEBSITE",
              candidateId: candidate.restaurant.id, sourceEntityId: `official:${createHash("sha256").update(new URL(page.url).origin + new URL(page.url).pathname).digest("hex").slice(0, 16)}`,
              sourceUrl: page.url, observedAt: checkedAt,
              requestFingerprint: JSON.stringify({ candidateId: candidate.restaurant.id, sourceUrl: page.url }),
              claims: { observationKind: "PUBLIC_PAGE", outletName: candidate.restaurant.outletName, address: candidate.restaurant.address },
              entityMatch: observation.entityMatch };
            identities.push(identity);
          }
          retainPageHours(page);
          const document = bindRestaurantFactSourceRoles(sourceDocument(candidate.restaurant.id, identity.evidenceId, page.text), page, typeof identity.claims.outletName === "string" ? [identity.claims.outletName] : []);
          if (documents.some((item) => item.id === document.id)) return false;
          documents.push(document);
          retained.set(document.id,{page:structuredClone(page),identity:structuredClone(identity),readAt:this.now(),frames:[{document,text:page.text}],processed:false});
          this.onSourcePage?.(structuredClone({ candidateId: candidate.restaurant.id, readRunId: request.readRunId, requestedSourceUrl: sourceUrl, identity, snapshot: page, observedAt: this.now() }));
          return true;
        };
        const enrichQuotations = async (): Promise<void> => {
          if(!this.sourceFactsModel||request.capturePagesOnly)return;
          const normalize=(text:string)=>text.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu," ").trim();
          const compact=(text:string)=>text.replace(/\s+/gu," ").trim();
          for(const row of retained.values()){
            if(row.processed)continue;row.processed=true;
            const publicFields=row.frames.flatMap(frame=>frame.document.sourceFieldQuotes??[]).filter(q=>["CATEGORY","COURSE_TITLE","COURSE_DESCRIPTION"].includes(q.field));
            const criteria=request.intent.criteria.filter(c=>c.strength==="HARD"&&!publicFields.some(q=>(" "+normalize(q.quote)+" ").includes(" "+normalize(c.text)+" "))).map(c=>c.text);
            const quoted=await readQuotedRestaurantSourceFacts({complete:input=>executor.readModel(signal,()=>{modelCalls++;return this.sourceFactsModel!.complete(input);})},{candidate,identity:row.identity,page:row.page,readAt:row.readAt,criteria},this.now,signal);
            if(!quoted)continue;
            const belongs=(quote:string,frame:typeof row.frames[number])=>{
              const owners=row.frames.filter(f=>compact(f.text).includes(compact(quote)));return owners.length===1&&owners[0]===frame;
            };
            for(const frame of row.frames){
              const fields=quoted.sourceFieldQuotes.filter(q=>belongs(q.quote,frame));
              const prices=quoted.priceFacts;
              const priceFacts=prices?{schemaVersion:prices.schemaVersion,listedCoursePricesYen:prices.listedCoursePricesYen.filter(q=>belongs(q.quote,frame)),
                ...(prices.dinnerBudgetRangeYen&&belongs(prices.dinnerBudgetRangeYen.quote,frame)?{dinnerBudgetRangeYen:prices.dinnerBudgetRangeYen}:{}),
                ...(prices.lunchBudgetRangeYen&&belongs(prices.lunchBudgetRangeYen.quote,frame)?{lunchBudgetRangeYen:prices.lunchBudgetRangeYen}:{})}:undefined;
              const part:QuotedRestaurantSourceFacts={readAt:quoted.readAt,sourceUrl:quoted.sourceUrl,listedCourseDetails:quoted.listedCourseDetails.filter(q=>belongs(q,frame)),sourceFieldQuotes:fields,
                ...(priceFacts&&(priceFacts.listedCoursePricesYen.length||priceFacts.dinnerBudgetRangeYen||priceFacts.lunchBudgetRangeYen)?{priceFacts}:{})};
              if(fields.length)frame.document.sourceFieldQuotes=[...(frame.document.sourceFieldQuotes??[]),...fields];
              if(part.priceFacts)frame.document.priceFacts=part.priceFacts;
              const evidence=quotedRestaurantSourceEvidence(row.identity,part,frame.document.serviceScope);
              if(evidence&&!identities.some(item=>item.evidenceId===evidence.evidenceId))identities.push(evidence);
            }
          }
        };
        const capturePage = async () => {
          const page=await executor.snapshot({source:provider,stage:"FACTS",signal,session});
          const controls=await executor.observeControls({source:provider,stage:"FACTS",signal,session});
          if(!request.capturePagesOnly||page.settlement!=="PENDING")return {page,controls,ready:true};
          // A short navigation sample is not a complete G1 document. Reuse
          // the executor's bounded, text-stability observation; never clear
          // PENDING by assertion or ask a browser model to manufacture it.
          const ready=await executor.runSkill({taskId:request.readRunId??candidate.restaurant.id,
            source:provider,stage:"FACTS",signal,session,allowedOrigins:[new URL(sourceUrl).origin],
            goal:{outlet:{name:candidate.restaurant.outletName,address:candidate.restaurant.address},hardCriteria:[]},
            objective:"Observe the complete current public page for cited restaurant questions",
            completion:current=>current.text.trim()?{complete:true,reason:"Current public page text is present",
              resultKey:createHash("sha256").update(current.url+"\u0000"+current.text).digest("hex"),
              resultBusy:Boolean(current.settlementDiagnostics?.blockingDataRequests||current.settlementDiagnostics?.busySelectors.length||current.settlementDiagnostics?.visibleTextChanging)}
              :{complete:false,reason:"No current public page text"}});
          return {page:ready.snapshot,controls:ready.controls??[],ready:ready.status==="COMPLETED"&&ready.snapshot.settlement!=="PENDING"};
        };
        const first=await capturePage();
        if(!first.ready){factChecks[candidate.restaurant.id]={status:"UNKNOWN",checkedAt,evidenceIds:[],reasonCode:"NATIVE_SOURCE_PAGE_UNSETTLED"};continue;}
        const initial=first.page,initialControls=first.controls;
        tableCheckServiceControls = initialControls;
        if (!retainNativePage(initial, initialControls)) {
          factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "NATIVE_SOURCE_IDENTITY_UNCONFIRMED" };
          continue;
        }
        retainOfficialOrigins(initialControls);
        if(request.capturePagesOnly){
          if(request.captureLinkedTranslation){
            const english=new URL(initial.url).pathname.startsWith("/en/");
            const translation=initialControls.find(control=>{
              if(control.kind!=="LINK"||!control.visible||control.disabled||control.blockedByActiveLayer||!control.href)return false;
              try{return sameNativeOutletUrl(provider,sourceUrl,control.href)
                && new URL(control.href).pathname.startsWith("/en/")!==english
                && !isBrowserReadPathProhibited(this.networkPolicy,control.href);}catch{return false;}
            });
            if(translation?.href){
              await executor.navigate({source:provider,stage:"FACTS",signal,allowedOrigins:[new URL(sourceUrl).origin],session,url:translation.href,observed:true});
              const translationPage=await capturePage();
              if(translationPage.ready)retainNativePage(translationPage.page,translationPage.controls);
            }
          }
          evidence.push(...identities);sourceDocuments.push(...documents);
          factChecks[candidate.restaurant.id]={status:"COMPLETED",checkedAt,evidenceIds:identities.map(item=>item.evidenceId),sourceProvider:provider};
          continue;
        }
        await enrichQuotations();
        // Judge the guide before reading an additional source surface. A
        // category menu is relevant only when this cited material leaves a
        // HARD condition unresolved; a sufficient ordinary guide stops here.
        let judged = await this.judgment.judge({ candidate, intent: request.intent, evidence: identities, sourceDocuments: documents });
        modelCalls += judged.modelUsage?.calls ?? 0;
        // The TableCheck guide itself authoritatively exposes one same-outlet
        // public reservation entrance. Read that page as source material in
        // this same bounded FACTS action; it is neither an Agent-proposed link
        // nor a reservation submission. The public category menu markup lives
        // there, not on every guide page.
        if (provider === "TABLECHECK" && !hardFactsResolved(request.intent, judged.evidence) && !hasConfirmedNegativeConflict(request.intent, judged.evidence)) {
          const guide = parseTableCheckOutletIdentityWithEvidence(initial, sourceUrl);
          observedReservationTarget = guide && resolveTableCheckReservationTarget(initial, guide.outlet, this.networkPolicy);
          if (observedReservationTarget?.kind === "LINKED_PAGE" && !isBrowserReadPathProhibited(this.networkPolicy, observedReservationTarget.url)) {
            const documentsBefore = documents.length;
            await executor.navigate({ source: provider, stage: "FACTS", signal, allowedOrigins: [new URL(sourceUrl).origin], session, url: observedReservationTarget.url, observed: true });
            const reservationPage = await executor.snapshot({ source: provider, stage: "FACTS", signal, session });
            const reservationControls = await executor.observeControls({ source: provider, stage: "FACTS", signal, session });
            tableCheckServiceControls = reservationControls;
            retainTableCheckReservationPage(reservationPage, reservationControls);
            retainOfficialOrigins(reservationControls);
            if (documents.length > documentsBefore) {
              await enrichQuotations();
            judged = await this.judgment.judge({ candidate, intent: request.intent, evidence: identities, sourceDocuments: documents });
              modelCalls += judged.modelUsage?.calls ?? 0;
            }
          }
        }
        // Each follow-up is entered only after the preceding cited judgment
        // leaves a HARD condition unresolved. The shared 45/30/4/24 executor
        // limits the sequence; the two relevant source routes currently exposed
        // by this slice are a menu/course page and an observed official page.
        for (let followUps = 0; followUps < 2 && !hardFactsResolved(request.intent, judged.evidence)
          && !hasConfirmedNegativeConflict(request.intent, judged.evidence) && this.modelDecision; followUps += 1) {
          const documentsBefore = documents.length;
          const generic = await executor.runSkill({
            taskId: request.readRunId ?? candidate.restaurant.id, source: provider, stage: "FACTS", session, signal,
            allowedOrigins: [new URL(sourceUrl).origin, ...observedOfficialOrigins],
            goal: { outlet: { name: candidate.restaurant.outletName, address: candidate.restaurant.address }, hardCriteria: request.intent.criteria.filter((criterion) => criterion.strength === "HARD").map((criterion) => criterion.text) },
            objective: "The cited source material has not resolved every HARD criterion. Follow one observed public menu, course, or official information link relevant to the missing criterion. A linked official page must prove this exact outlet by its own visible name/address or structured data. Do not sign in, submit, revisit a page, or treat navigation itself as evidence.",
            completion: (page) => {
              if (new URL(page.url).origin === new URL(sourceUrl).origin) {
                if (isObservedReservationPage(page)) retainTableCheckReservationPage(page, tableCheckServiceControls);
                else retainNativePage(page);
              } else retainOfficialPage(page);
              // Retention is idempotent: the second stability snapshot must assess
              // the same bound documents, rather than whether they were just added.
              const bound = documents.slice(documentsBefore).filter(document => identities.some(identity => identity.evidenceId === document.identityEvidenceId && identity.sourceUrl === page.url));
              return { complete: bound.length > 0, resultBusy: false, resultKey: JSON.stringify(bound),
                reason: "A new, identity-confirmed page with source-authored text is required before another cited HARD-fact judgment." };
            },
          });
          // A completed generic read already retained its final page. Calling the
          // idempotent retain function here covers runtimes that return the final
          // snapshot after the post-action read without treating it as new proof.
          if (new URL(generic.snapshot.url).origin === new URL(sourceUrl).origin) {
            if (isObservedReservationPage(generic.snapshot)) retainTableCheckReservationPage(generic.snapshot, tableCheckServiceControls);
            else retainNativePage(generic.snapshot);
          }
          else retainOfficialPage(generic.snapshot);
          retainOfficialOrigins(await executor.observeControls({ source: provider, stage: "FACTS", signal, session }));
          // A rejected action, an unchanged page, or an identity failure is not
          // new cited material.  Preserve the preceding judgment instead of
          // spending another fact-judgment call on the same document set.
          if (documents.length > documentsBefore) {
            await enrichQuotations();
            judged = await this.judgment.judge({ candidate, intent: request.intent, evidence: identities, sourceDocuments: documents });
            modelCalls += judged.modelUsage?.calls ?? 0;
          } else break;
        }
        evidence.push(...identities, ...judged.evidence);
        sourceDocuments.push(...documents);
        const unsupported = observedReservationTarget?.kind === "LINKED_PAGE" && isBrowserReadPathProhibited(this.networkPolicy, observedReservationTarget.url);
        factChecks[candidate.restaurant.id] = { status: hardFactsResolved(request.intent, judged.evidence) ? "COMPLETED" : "UNKNOWN", checkedAt,
          evidenceIds: [...identities.map((item) => item.evidenceId), ...judged.evidence.map((item) => item.evidenceId)], sourceProvider: provider,
          ...(!hardFactsResolved(request.intent, judged.evidence) ? { reasonCode: unsupported ? "SOURCE_UNSUPPORTED" : "NATIVE_HARD_FACTS_UNCONFIRMED" } : {}) };
      } catch (error) {
        if (signal.aborted || (error && typeof error === "object" && "code" in error && (
          error.code === "MODEL_CALL_BUDGET_EXHAUSTED" || error.code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED"
          || error.code === "BROWSER_RUNTIME_UNAVAILABLE" || error.code === "BROWSER_ABORTED"
        ))) throw error;
        factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [],
          reasonCode: error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "NATIVE_FACT_READ_FAILED" };
      } finally {
        executor.endProvider();
        await executor.close();
      }
    }
    const providers = new Set(request.candidates.map((candidate) => candidate.restaurant.sourceIds.tabelogNativeDetailUri ? "TABELOG" : "TABLECHECK"));
    return { evidence, factChecks, sourceDocuments,
      metadata: { provider: providers.size === 1 ? [...providers][0]! : "RESTAURANT_WEBSITE",
        route: this.executionRoute, latencyMs: Date.now() - startedAt,
        ...(nativeContinuity.length ? { nativeContinuity } : {}),
        ...(modelCalls ? { modelUsage: { calls: modelCalls } } : {}) },
    };
  }
}

/** One fact port for a mixed candidate pool; each candidate keeps its source. */
export class SourceAwareFactRead implements RestaurantCandidateFactPort {
  readonly executionRoute = "GENERIC_BROWSER" as const;
  constructor(private readonly native: RestaurantCandidateFactPort, private readonly google: RestaurantCandidateFactPort) {}
  googleRequestUsage(readRunId: string | undefined) { return this.google.googleRequestUsage?.(readRunId) ?? { limit: 0, total: 0, namedPlaceResolution: 0, discovery: 0, placeDetails: 0, reverseAddressObservation: 0 }; }
  async inspectFacts(request: RestaurantCandidateFactRequest, signal: AbortSignal): Promise<RestaurantCandidateFactRead> {
    const nativeCandidates = request.candidates.filter((item) => item.restaurant.sourceIds.tabelogNativeDetailUri || item.restaurant.sourceIds.tablecheckNativeGuideUri);
    const googleCandidates = request.candidates.filter((item) => !nativeCandidates.includes(item));
    const startedAt = Date.now();
    const reads: RestaurantCandidateFactRead[] = [];
    if (nativeCandidates.length) reads.push(await this.native.inspectFacts({ ...request, candidates: nativeCandidates, candidateIds: nativeCandidates.map((item) => item.restaurant.id) }, signal));
    if (googleCandidates.length) reads.push(await this.google.inspectFacts({ ...request, candidates: googleCandidates, candidateIds: googleCandidates.map((item) => item.restaurant.id) }, signal));
    const googleMetadata = reads.find(read => read.metadata.googleRequests)?.metadata;
    const failureCode = reads.find(read => read.metadata.failureCode)?.metadata.failureCode;
    return { evidence: reads.flatMap((read) => read.evidence),
      factChecks: Object.assign({}, ...reads.map((read) => read.factChecks)),
      sourceDocuments: reads.flatMap((read) => read.sourceDocuments ?? []),
      metadata: { provider: reads.length === 1 ? reads[0]!.metadata.provider : "RESTAURANT_WEBSITE", route: this.executionRoute,
        latencyMs: Date.now() - startedAt,
        ...(googleMetadata?.googleRequests ? { googleRequests: googleMetadata.googleRequests } : {}),
        ...(failureCode ? { failureCode } : {}),
        ...(reads.some((read) => read.metadata.nativeContinuity?.length) ? { nativeContinuity: reads.flatMap((read) => read.metadata.nativeContinuity ?? []) } : {}),
        ...(reads.some((read) => read.metadata.modelUsage?.calls) ? { modelUsage: { calls: reads.reduce((sum, read) => sum + (read.metadata.modelUsage?.calls ?? 0), 0) } } : {}) },
    };
  }
}
