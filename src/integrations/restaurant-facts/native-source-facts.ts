import { createHash } from "node:crypto";

import type { RestaurantCandidateFactPort } from "../../application/restaurant-execution-router.js";
import type { RestaurantCandidateFactRead, RestaurantCandidateFactRequest, RestaurantReadEvidence, RestaurantFactSourceDocument, RestaurantServiceScope } from "../../domains/restaurant/contracts.js";
import type { BrowserReadNetworkPolicy, BrowserRuntime, BrowserSnapshot, BrowserPageControl } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserTaskExecutor, type BrowserExecutionBudget, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserReadActionDecisionPort } from "../../infrastructure/browser/browser-action-decision.js";
import { inspectNativeOutletContinuity, sameNativeOutletUrl } from "../restaurant-availability/native-outlet-continuity.js";
import { parseTabelogOutletIdentityWithEvidence } from "../tabelog/tabelog-page-parser.js";
import { hasTableCheckBotChallenge, hasTableCheckPageUnavailable, parseTableCheckOutletIdentityWithEvidence, parseTableCheckScopedMenuSourcePartition, resolveTableCheckReservationTarget, sameReservationOutlet, type TableCheckReservationTarget } from "../tablecheck/tablecheck-page-parser.js";
import { candidateStructuredObservation, candidateVisibleObservation } from "./google-listed-website-facts.js";
import type { RestaurantFactJudgmentPort } from "./model-fact-judgment.js";

function key(value: string): string | undefined {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
  } catch { return undefined; }
}

function sourceDocument(candidateId: string, identityEvidenceId: string, text: string, serviceScope?: RestaurantServiceScope): RestaurantFactSourceDocument {
  const statements: RestaurantFactSourceDocument["statements"] = [];
  let total = 0;
  for (const line of text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
    if (line.length > 1_600 || total + line.length > 6_000 || statements.length >= 50) continue;
    total += line.length;
    statements.push({ id: `${candidateId}:statement:${statements.length}`, text: line });
  }
  const scopeKey = serviceScope ? `${serviceScope.field}\u0000${serviceScope.group}\u0000${serviceScope.value}` : "unscoped";
  return { id: `${candidateId}:document:${createHash("sha256").update(`${scopeKey}\u0000${text}`).digest("hex").slice(0, 16)}`, candidateId, identityEvidenceId,
    ...(serviceScope ? { serviceScope } : {}), statements };
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
    private readonly runtime: BrowserRuntime,
    private readonly judgment: RestaurantFactJudgmentPort,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly modelDecision?: BrowserReadActionDecisionPort,
    private readonly browserBudget?: BrowserExecutionBudget,
    private readonly onBrowserDiagnostic?: (diagnostic: BrowserExecutionDiagnostic) => void,
    /** Actual compositions provide the source-owned isolated read policy. */
    private readonly networkPolicy?: BrowserReadNetworkPolicy,
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
      const executor = new BrowserTaskExecutor(this.runtime, {
        ...(this.modelDecision ? { modelDecision: this.modelDecision, maxModelCallsPerCandidate: 4, maxModelCallsTotal: this.browserBudget?.maxModelCalls ?? 4 } : {}),
        ...(this.browserBudget ? { budget: this.browserBudget } : {}),
        ...(this.onBrowserDiagnostic ? { onDiagnostic: this.onBrowserDiagnostic } : {}),
        maxElapsedMsPerCandidate: 45_000, maxElapsedMsPerProvider: 30_000, maxAutomaticElapsedMs: 45_000, maxOperationsPerCandidate: 24,
      });
      try {
        executor.beginCandidate(candidate.restaurant.id);
        executor.beginProvider(candidate.restaurant.id, provider, "FACTS");
        const session = await executor.acquire(signal, provider, "FACTS", this.networkPolicy);
        await executor.navigate({ source: provider, stage: "FACTS", signal, allowedOrigins: [new URL(sourceUrl).origin], session, url: sourceUrl });
        const documents: RestaurantFactSourceDocument[] = [];
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
          const nextDocuments = scopedMenu?.scoped.length
            ? [
              ...scopedMenu.scoped.map((item) => sourceDocument(candidate.restaurant.id, identity.evidenceId, item.text, item.serviceScope)),
              ...(scopedMenu.unscopedText ? [sourceDocument(candidate.restaurant.id, identity.evidenceId, scopedMenu.unscopedText)] : []),
            ]
            : [sourceDocument(candidate.restaurant.id, identity.evidenceId, page.text)];
          const additions = nextDocuments.filter((document) => !documents.some((item) => item.id === document.id));
          documents.push(...additions);
          return additions.length > 0;
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
              claims: { outletName: extraction.outlet.outletName, address: extraction.outlet.address ?? "" },
              entityMatch: { confidence: "HIGH", matchedBy: ["NATIVE_SOURCE_ID_AND_DETAIL"] },
            };
            identities.push(identity);
          }
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
              claims: { outletName: extraction.outlet.outletName, address: extraction.outlet.address ?? "" },
              entityMatch: { confidence: "HIGH", matchedBy: ["NATIVE_SOURCE_ID_AND_RESERVATION_ENTRANCE"] },
            };
            identities.push(identity);
          }
          nativeContinuity.push({ candidateId: candidate.restaurant.id, provider, expectedSourceEntityId: sourceEntityId,
            observedSourceEntityId: extraction.outlet.sourceEntityId, confirmed: true, reason: "SAME_SOURCE_OUTLET" });
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
              claims: { outletName: candidate.restaurant.outletName, address: candidate.restaurant.address },
              entityMatch: observation.entityMatch };
            identities.push(identity);
          }
          const document = sourceDocument(candidate.restaurant.id, identity.evidenceId, page.text);
          if (documents.some((item) => item.id === document.id)) return false;
          documents.push(document);
          return true;
        };
        const initial = await executor.snapshot({ source: provider, stage: "FACTS", signal, session });
        const initialControls = await executor.observeControls({ source: provider, stage: "FACTS", signal, session });
        tableCheckServiceControls = initialControls;
        if (!retainNativePage(initial, initialControls)) {
          factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "NATIVE_SOURCE_IDENTITY_UNCONFIRMED" };
          continue;
        }
        retainOfficialOrigins(initialControls);
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
          observedReservationTarget = guide && resolveTableCheckReservationTarget(initial, guide.outlet);
          if (observedReservationTarget?.kind === "LINKED_PAGE") {
            const documentsBefore = documents.length;
            await executor.navigate({ source: provider, stage: "FACTS", signal, allowedOrigins: [new URL(sourceUrl).origin], session, url: observedReservationTarget.url, observed: true });
            const reservationPage = await executor.snapshot({ source: provider, stage: "FACTS", signal, session });
            const reservationControls = await executor.observeControls({ source: provider, stage: "FACTS", signal, session });
            tableCheckServiceControls = reservationControls;
            retainTableCheckReservationPage(reservationPage, reservationControls);
            retainOfficialOrigins(reservationControls);
            if (documents.length > documentsBefore) {
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
            completion: (page) => ({ complete: (new URL(page.url).origin === new URL(sourceUrl).origin
              ? isObservedReservationPage(page) ? retainTableCheckReservationPage(page, tableCheckServiceControls) : retainNativePage(page)
              : retainOfficialPage(page)) && documents.length > documentsBefore,
              reason: "A new, identity-confirmed page with source-authored text is required before another cited HARD-fact judgment." }),
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
            judged = await this.judgment.judge({ candidate, intent: request.intent, evidence: identities, sourceDocuments: documents });
            modelCalls += judged.modelUsage?.calls ?? 0;
          } else break;
        }
        evidence.push(...identities, ...judged.evidence);
        sourceDocuments.push(...documents);
        factChecks[candidate.restaurant.id] = { status: hardFactsResolved(request.intent, judged.evidence) ? "COMPLETED" : "UNKNOWN", checkedAt,
          evidenceIds: [...identities.map((item) => item.evidenceId), ...judged.evidence.map((item) => item.evidenceId)], sourceProvider: provider,
          ...(!hardFactsResolved(request.intent, judged.evidence) ? { reasonCode: "NATIVE_HARD_FACTS_UNCONFIRMED" } : {}) };
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
  googleRequestUsage(readRunId: string | undefined) { return this.google.googleRequestUsage?.(readRunId) ?? { limit: 0, total: 0, namedPlaceResolution: 0, discovery: 0, placeDetails: 0 }; }
  async inspectFacts(request: RestaurantCandidateFactRequest, signal: AbortSignal): Promise<RestaurantCandidateFactRead> {
    const nativeCandidates = request.candidates.filter((item) => item.restaurant.sourceIds.tabelogNativeDetailUri || item.restaurant.sourceIds.tablecheckNativeGuideUri);
    const googleCandidates = request.candidates.filter((item) => !nativeCandidates.includes(item));
    const startedAt = Date.now();
    const reads: RestaurantCandidateFactRead[] = [];
    if (nativeCandidates.length) reads.push(await this.native.inspectFacts({ ...request, candidates: nativeCandidates, candidateIds: nativeCandidates.map((item) => item.restaurant.id) }, signal));
    if (googleCandidates.length) reads.push(await this.google.inspectFacts({ ...request, candidates: googleCandidates, candidateIds: googleCandidates.map((item) => item.restaurant.id) }, signal));
    return { evidence: reads.flatMap((read) => read.evidence),
      factChecks: Object.assign({}, ...reads.map((read) => read.factChecks)),
      sourceDocuments: reads.flatMap((read) => read.sourceDocuments ?? []),
      metadata: { provider: reads.length === 1 ? reads[0]!.metadata.provider : "RESTAURANT_WEBSITE", route: this.executionRoute,
        latencyMs: Date.now() - startedAt,
        ...(reads.some((read) => read.metadata.nativeContinuity?.length) ? { nativeContinuity: reads.flatMap((read) => read.metadata.nativeContinuity ?? []) } : {}),
        ...(reads.some((read) => read.metadata.modelUsage?.calls) ? { modelUsage: { calls: reads.reduce((sum, read) => sum + (read.metadata.modelUsage?.calls ?? 0), 0) } } : {}) },
    };
  }
}
