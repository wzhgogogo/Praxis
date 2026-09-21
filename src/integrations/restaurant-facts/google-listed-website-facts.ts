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
import { BrowserTaskExecutor, type BrowserExecutionBudget, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type { BrowserReadActionDecisionPort } from "../../infrastructure/browser/browser-action-decision.js";

function normalized(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "").trim();
}

/**
 * Website and Google addresses can differ only in punctuation or ordering.
 * A name alone never identifies an outlet through this address path; absent or
 * contradictory address components still fail closed.
 */
function addressMatches(candidateAddress: string, observedAddress: string): boolean {
  const expected = normalized(candidateAddress); const observed = normalized(observedAddress);
  if (!expected || !observed) return false;
  if (expected.includes(observed) || observed.includes(expected)) return true;
  const expectedNumbers = candidateAddress.normalize("NFKC").match(/\d+/gu) ?? [];
  const observedNumbers = observedAddress.normalize("NFKC").match(/\d+/gu) ?? [];
  if (!expectedNumbers.length || expectedNumbers.length !== observedNumbers.length || !expectedNumbers.every((value, index) => value === observedNumbers[index])) return false;
  // A shared street number is never sufficient outlet identity: branches in
  // different cities commonly reuse it.  For reordered/translated addresses,
  // retain at least the available non-numeric locality tokens as well.  This
  // deliberately accepts punctuation/order variation but rejects a visibly
  // different city or district.
  const tokens = (value: string) => [...value.normalize("NFKC").toLocaleLowerCase("en-US").matchAll(/[\p{L}]{2,}/gu)].map((match) => match[0]!);
  const expectedTokens = [...new Set(tokens(candidateAddress))];
  const observedTokens = new Set(tokens(observedAddress));
  const requiredSharedTokens = Math.min(2, expectedTokens.length, observedTokens.size);
  return requiredSharedTokens > 0 && expectedTokens.filter((token) => observedTokens.has(token)).length >= requiredSharedTokens;
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
 * it first proves the candidate through visible name/address or one matching
 * public phone on the Google-listed origin, then accepts source-labelled facts.
 * The browser model may navigate observed pages but never supplies these facts.
 */
function exactVisiblePhone(candidate: RestaurantCandidate, text: string): boolean {
  const normalize = (value: string) => value.replace(/[^0-9]/g, "").replace(/^81/, "0");
  const expected = normalize(candidate.restaurant.sourceIds.phone ?? "");
  const phones = new Set((text.match(/(?:\+81[- ]?|0)\d{1,4}[-ー ]\d{1,4}[-ー ]\d{3,4}\b/g) ?? []).map(normalize));
  return expected.length >= 10 && phones.size === 1 && phones.has(expected);
}

function candidateVisibleObservation(
  candidate: RestaurantCandidate,
  sourceUrl: string,
  observedAt: string,
  visibleText: string,
  html = "",
): UntrustedRestaurantWebsiteObservation | undefined {
  const text = visibleText.replace(/\s+/gu, " ").trim();
  const normalizedText = normalized(text);
  const candidateName = normalized(candidate.restaurant.outletName);
  const candidateAddress = normalized(candidate.restaurant.address);
  const matchedPhone = exactVisiblePhone(candidate, visibleText);
  if (!matchedPhone && (!candidateName || !candidateAddress || !normalizedText.includes(candidateName) || !addressMatches(candidate.restaurant.address, text))) return undefined;
  const lines = visibleText.split(/\r?\n/).map((line) => line.replace(/\s+/gu, " ").trim()).filter(Boolean);
  const restaurantTypeFacts = [
    ...(/\b(?:cafe|coffee\s*shop|restaurant|bistro|bakery)\b/iu.test(text) ? [text.match(/\b(?:cafe|coffee\s*shop|restaurant|bistro|bakery)\b/iu)?.[0] ?? ""] : []),
    ...lines.filter((line) => /(?:cuisine|料理|cafe|coffee|restaurant)/iu.test(line)).slice(0, 3),
  ].filter(Boolean);
  const regularOpeningHours = lines.filter((line) =>
    /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/iu.test(line) && /\b\d{1,2}:\d{2}/u.test(line),
  ).slice(0, 7);
  const publicCommercialTerms = labelledPublicCommercialTerms(lines, html, sourceUrl);
  return {
    candidateId: candidate.restaurant.id,
    sourceUrl,
    observedAt,
    entityMatch: { confidence: "HIGH", matchedBy: [matchedPhone ? "GOOGLE_LISTED_WEBSITE_EXACT_PHONE" : "VISIBLE_WEBSITE_NAME_AND_ADDRESS_COMPONENTS"] },
    ...(restaurantTypeFacts.length ? { restaurantTypeFacts } : {}),
    ...(regularOpeningHours.length ? { regularOpeningHours } : {}),
    ...(publicCommercialTerms ? { publicCommercialTerms } : {}),
  };
}

// Scalar claims require one complete labelled line, with no competing amount or
// package. More complex menus need scoped evidence; they stay unknown here.
function labelledPublicCommercialTerms(lines: string[], html: string, sourceUrl: string): NonNullable<UntrustedRestaurantWebsiteObservation["publicCommercialTerms"]> | undefined {
  const terms: NonNullable<UntrustedRestaurantWebsiteObservation["publicCommercialTerms"]> = {};
  const courseLines = lines.filter(line => /(?:course|package|menu)\s+(?:price|fee)|コース料金/iu.test(line));
  const roomLines = lines.filter(line => /(?:private\s*room|room)\s+minimum|個室.*(?:最低|ミニマム)/iu.test(line));
  const amount = "(?:¥|￥|JPY\\s*)\\s*([0-9][0-9,]*)";
  if (courseLines.length === 1) {
    const match = courseLines[0]!.match(new RegExp("^(?:(?:course|package|menu)\\s+(?:price|fee)|コース料金)\\s*[:：]\\s*" + amount + "(?:\\s*\\((tax included|tax excluded|税込|税別)\\))?\\s*[.]?$", "iu"));
    const price = match ? Number(match[1]!.replaceAll(",", "")) : NaN;
    if (Number.isSafeInteger(price) && price >= 0) {
      terms.coursePriceYen = price;
      terms.coursePriceTax = /^(?:tax included|税込)$/iu.test(match?.[2] ?? "") ? "INCLUDED"
        : /^(?:tax excluded|税別)$/iu.test(match?.[2] ?? "") ? "EXCLUDED" : "UNSPECIFIED";
    }
  }
  if (roomLines.length === 1) {
    const match = roomLines[0]!.match(new RegExp("^(?:(?:private\\s*room|room)\\s+minimum(?:\\s+spend)?|個室最低利用料金)\\s*[:：]\\s*" + amount + "\\s*[.]?$", "iu"));
    const price = match ? Number(match[1]!.replaceAll(",", "")) : NaN;
    if (Number.isSafeInteger(price) && price >= 0) terms.privateRoomMinimumYen = price;
  }
  // Semantic definition lists keep multi-line rules together, rather than
  // assuming every website prints a colon on one line.
  const plain = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const definitions = [...html.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi)]
    .map(match => ({ label: plain(match[1]!), value: plain(match[2]!) }))
    .filter(item => item.value.length > 0 && item.value.length <= 1600 && lines.join(" ").includes(item.value));
  const cancellationDefinitions = definitions.filter(item => /^(?:cancellation(?: policy)?|キャンセル(?:規定|ポリシー)?)$/iu.test(item.label));
  if (cancellationDefinitions.length === 1) terms.cancellationTerms = `${cancellationDefinitions[0]!.label}: ${cancellationDefinitions[0]!.value}`;
  // Public OWST course-list contract, observed on 2026-09-16. Capture complete
  // named cards; do not convert a displayed menu to a query-qualified offer.
  if (new URL(sourceUrl).hostname.endsWith(".owst.jp")) {
    const courses = [...html.matchAll(/<a\b[^>]*href=["']\/courses\/\d+["'][^>]*>([\s\S]*?)<\/a>/gi)].flatMap(match => {
      const card = match[1]!;
      if (!/class=["']courseName["']/.test(card) || !/class=["']coursePrice["']/.test(card)) return [];
      const text = plain(card.replace(/<img\b[^>]*>/gi, ""));
      return text.length <= 1600 && lines.join(" ").replace(/\s/g, "").includes(text.replace(/\s/g, "")) ? [text] : [];
    });
    if (courses.length) terms.listedCourseDetails = [...new Set(courses)].slice(0, 3);
  }
  const cancellations = lines.filter(line => /^(?:cancellation(?: policy)?|キャンセル(?:規定|ポリシー)?)\s*[:：]\s*\S/iu.test(line));
  const noShows = lines.filter(line => /^(?:no[ -]?show|無断キャンセル)\s*[:：]\s*\S/iu.test(line));
  if (cancellations.length === 1) terms.cancellationTerms = cancellations[0]!;
  if (noShows.length === 1) terms.noShowTerms = noShows[0]!;
  return Object.keys(terms).length ? terms : undefined;
}

function mergeObservations(
  structured: UntrustedRestaurantWebsiteObservation | undefined,
  visible: UntrustedRestaurantWebsiteObservation | undefined,
): UntrustedRestaurantWebsiteObservation | undefined {
  if (!structured) return visible;
  if (!visible) return structured;
  const publicCommercialTerms = structured.publicCommercialTerms || visible.publicCommercialTerms
    ? { ...structured.publicCommercialTerms, ...visible.publicCommercialTerms }
    : undefined;
  return {
    ...structured,
    restaurantTypeFacts: [...new Set([...(structured.restaurantTypeFacts ?? []), ...(visible.restaurantTypeFacts ?? [])])],
    regularOpeningHours: [...new Set([...(structured.regularOpeningHours ?? []), ...(visible.regularOpeningHours ?? [])])],
    ...(publicCommercialTerms ? { publicCommercialTerms } : {}),
  };
}

export function requestedCommercialFields(intent: RestaurantCandidateFactRequest["intent"]): Array<keyof NonNullable<UntrustedRestaurantWebsiteObservation["publicCommercialTerms"]>> {
  const text = [intent.target?.query ?? "", ...intent.criteria.map(criterion => criterion.text)].join("\n");
  const fields: Array<keyof NonNullable<UntrustedRestaurantWebsiteObservation["publicCommercialTerms"]>> = [];
  if (/cancellation|キャンセル|取消/iu.test(text)) fields.push("cancellationTerms");
  if (/no[ -]?show|無断|爽约/iu.test(text)) fields.push("noShowTerms");
  if (/(?:course|package|menu).*(?:price|fee)|套餐.*(?:价|費|费)|コース料金/iu.test(text)) fields.push("coursePriceYen");
  if (/(?:private room|個室|包间).*(?:minimum|最低|低消)/iu.test(text)) fields.push("privateRoomMinimumYen");
  return fields;
}

function hasRequestedFacts(observation: UntrustedRestaurantWebsiteObservation, request: RestaurantCandidateFactRequest): boolean {
  const needsType = request.intent.criteria.some((criterion) => criterion.strength === "HARD");
  const needsHours = request.intent.target?.goal === "RECOMMENDATION" && request.intent.date !== undefined && request.intent.timeWindow !== undefined;
  return requestedCommercialFields(request.intent).every(field => observation.publicCommercialTerms?.[field] !== undefined || (field === "coursePriceYen" && !!observation.publicCommercialTerms?.listedCourseDetails?.length))
    && (!needsType || (observation.restaurantTypeFacts?.length ?? 0) > 0)
    && (!needsHours || (observation.regularOpeningHours?.length ?? 0) > 0);
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
    private readonly browserBudget?: BrowserExecutionBudget,
    private readonly onBrowserDiagnostic?: (diagnostic: BrowserExecutionDiagnostic) => void,
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
        ...(this.modelDecision ? { modelDecision: this.modelDecision, maxModelCallsPerCandidate: 4, maxModelCallsTotal: this.browserBudget ? (this.browserBudget.maxModelCalls ?? 12) : 4 } : {}),
        ...(this.browserBudget ? { budget: this.browserBudget } : {}),
        ...(this.onBrowserDiagnostic ? { onDiagnostic: this.onBrowserDiagnostic } : {}),
        // A website is one provider path inside the existing 45-second
        // candidate investigation, never a reason to extend the run ceiling.
        maxElapsedMsPerCandidate: 45_000,
        maxElapsedMsPerProvider: 30_000,
        maxAutomaticElapsedMs: 45_000,
        // Public terms and courses may live on separate observed pages. The
        // shared run budget still applies; this does not permit form submission.
        maxOperationsPerCandidate: 24,
      });
      const pages = new Map<string, { observation: UntrustedRestaurantWebsiteObservation; text: string }>();
      const remember = (snapshot: BrowserSnapshot): void => {
        const landed = safeWebsiteUrl(snapshot.url);
        if (landed?.origin !== listed.origin) return;
        const observation = mergeObservations(
          candidateStructuredObservation(candidate, landed.toString(), checkedAt, snapshot.html),
          candidateVisibleObservation(candidate, landed.toString(), checkedAt, snapshot.text, snapshot.html),
        );
        if (observation) pages.set(landed.toString(), { observation, text: snapshot.text });
      };
      const complete = (): boolean => {
        const combined = [...pages.values()].reduce<UntrustedRestaurantWebsiteObservation | undefined>((prior, page) => mergeObservations(prior, page.observation), undefined);
        return combined !== undefined && hasRequestedFacts(combined, request);
      };
      let failureCode: string | undefined;
      try {
        executor.beginCandidate(candidate.restaurant.id);
        executor.beginProvider(candidate.restaurant.id, "WEBSITE", "FACTS");
        const session = await executor.acquire(signal, "WEBSITE", "FACTS");
        await executor.navigate({ source: "WEBSITE", stage: "FACTS", signal, allowedOrigins: [listed.origin], session, url: listed.toString() });
        const generic = await executor.runSkill({
          taskId: request.readRunId ?? candidate.restaurant.id,
          source: "WEBSITE", stage: "FACTS", signal, session, allowedOrigins: [listed.origin],
          goal: {
            outlet: { name: candidate.restaurant.outletName, address: candidate.restaurant.address },
            ...(request.intent.date ? { date: request.intent.date } : {}),
            ...(request.intent.timeWindow ? { timeWindow: request.intent.timeWindow } : {}),
            hardCriteria: request.intent.criteria.map(criterion => criterion.text),
          },
          objective: `Find public candidate-bound type, opening-hours and requested commercial facts (${requestedCommercialFields(request.intent).join(", ") || "none requested"}); read observed public disclosures or course/menu links when needed. Earlier verified pages are retained with their own source. Never log in or submit.`,
          completion: page => {
            remember(page);
            return { complete: complete(), reason: "The observed pages have not yet supplied all requested candidate-bound facts. Read an observed relevant public link if available." };
          },
        });
        remember(generic.snapshot);
        if (!complete()) failureCode = pages.size ? "WEBSITE_REQUESTED_FACTS_UNCONFIRMED" : "WEBSITE_STRUCTURED_IDENTITY_UNVERIFIED";
      } catch (error) {
        // A runner-owned budget/cancellation is task-global. Do not disguise
        // it as a candidate website gap and let later fact code continue.
        if (error && typeof error === "object" && "code" in error && (error.code === "MODEL_CALL_BUDGET_EXHAUSTED" || error.code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" || error.code === "BROWSER_RUNTIME_UNAVAILABLE" || error.code === "BROWSER_ABORTED")) throw error;
        failureCode = "WEBSITE_FACT_READ_FAILED";
      } finally {
        executor.endProvider();
        await executor.close();
      }
      const candidateEvidence = [...pages.values()].flatMap(page => groundRestaurantWebsiteFacts(candidate, request.intent, page.observation).evidence.map(item => ({
        ...item, artifactRef: { kind: "DOM_EXCERPT" as const, reference: `website-visible:${websiteFactDocumentFingerprint(page.text)}` },
      })));
      evidence.push(...candidateEvidence);
      factChecks[candidate.restaurant.id] = {
        status: complete() ? "COMPLETED" : "UNKNOWN", checkedAt,
        evidenceIds: candidateEvidence.map(item => item.evidenceId),
        ...(!complete() ? { reasonCode: failureCode ?? "WEBSITE_REQUESTED_FACTS_UNCONFIRMED" } : {}),
      };
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
