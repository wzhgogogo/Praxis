import { TABELOG_ENGLISH_SYSTEM_FEE } from "./booking-platform-fees.js";
import {
  restaurantAvailabilityRequestFingerprint,
  type AvailabilityOffer, type RestaurantAvailabilityCheck, type RestaurantBookingIntent,
  type RestaurantCandidate, type RestaurantReadEvidence,
} from "./contracts.js";
import type { RestaurantPageAnswer, RestaurantPageCitation } from "./page-question.js";

/** Transient B1 contract only: no Task State, submission authority or verified outcome. */
export type BookingHandoffProvider = "TABELOG" | "TABLECHECK";
export interface BookingHandoffContext {
  candidate: RestaurantCandidate;
  offer: AvailabilityOffer;
  check: RestaurantAvailabilityCheck;
  request: RestaurantBookingIntent;
  evidence: readonly RestaurantReadEvidence[];
  now: string;
}
export interface BookingHandoffPage {
  candidateId: string;
  provider: BookingHandoffProvider;
  sourceEntityId: string;
  identityEvidenceId: string;
  url: string;
  readAt: string;
  /** Current, identity-bound G1 cache text; never included in a Web projection. */
  text: string;
}
export interface BookingHandoffTerms {
  pages: readonly BookingHandoffPage[];
  cancellation?: RestaurantPageAnswer;
  /** User-declared/source-admitted conflict pair; no model/code strictness ranking. */
  cancellationConflict?: { japanese: RestaurantPageAnswer; english: RestaurantPageAnswer };
  card?: { requirement: "REQUIRED" | "NOT_REQUIRED" | "MAY_REQUIRE"; answer: RestaurantPageAnswer };
  /** Exact observed label; the hint asks the user to pick it, never says selected. */
  plan?: RestaurantPageCitation;
}
export type BookingHandoffSource = {
  candidateId: string;
  offerId: string;
  sourceEntityId: string;
  availabilityEvidenceId: string;
  observedAt: string;
  url: string;
  terms?: BookingHandoffTerms;
} & (
  { provider: "TABELOG"; linkBasis: "SOURCE_RESPONSE" }
  | { provider: "TABLECHECK"; linkBasis: "VERIFIED_PARAMETERS"; observedEntranceUrl: string }
);
export interface PreparedBookingHandoff {
  contract: "restaurant-booking-handoff@2";
  source: BookingHandoffSource;
}
export interface BookingHandoffView {
  candidateId: string;
  offerId: string;
  provider: BookingHandoffProvider;
  url: string;
  directLabel: string;
  continueLabel: string;
  selectionHint?: string;
  verificationHint?: string;
  cancellationConfirmation?: "Confirm cancellation terms on the website";
  checkedAt: string;
  displayExpiresAt: string;
  knowledge: "SOURCE_OBSERVED_AVAILABILITY";
  linkCarries: readonly ["DATE", "TIME", "PARTY_SIZE"];
  sourceSelection: "UNKNOWN";
  terms: Array<{ label: string; citations: RestaurantPageCitation[] }>;
  cancellationNotice?: "Cancellation terms differ between the Japanese and English pages";
  platformFee?: typeof TABELOG_ENGLISH_SYSTEM_FEE;
}

const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
function safeUrl(value: string): URL | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && !url.hash
      && !/[\u0000-\u0020\\]/u.test(value) ? url : undefined;
  } catch { return undefined; }
}
function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString().slice(0, 10) === value;
}
function fresh(expiry: string | undefined, now: number): expiry is string {
  return expiry !== undefined && Number.isFinite(Date.parse(expiry)) && Date.parse(expiry) > now;
}
function shopId(value: string): string { return value.replace(/^shops\//, ""); }
function tableCheckPath(url: URL): string | undefined {
  return url.pathname.match(/^\/(?:en|ja)\/(?:shops\/)?([a-zA-Z0-9_-]+)(?:\/reserve(?:\/landing)?)?\/?$/)?.[1];
}
function providerHost(url: URL, provider: BookingHandoffProvider): boolean {
  return provider === "TABELOG" ? url.hostname === "tabelog.com"
    : ["www.tablecheck.com", "tablecheck.com"].includes(url.hostname);
}
function sameDocumentOutlet(url: URL, provider: BookingHandoffProvider, id: string): boolean {
  if (!providerHost(url, provider)) return false;
  if (provider === "TABLECHECK") return tableCheckPath(url) === shopId(id);
  return url.pathname.match(/^\/(?:en\/)?[a-z]+\/A\d+\/A\d+\/(\d+)\//)?.[1] === id;
}
function queryOnly(url: URL, keys: readonly string[]): boolean {
  return [...url.searchParams.keys()].every(key => keys.includes(key) && url.searchParams.getAll(key).length === 1);
}

/** Source grammar only; this function never fetches or reconstructs a URL. */
function checkedLink(source: BookingHandoffSource, context: BookingHandoffContext, time: string): URL | undefined {
  const url = safeUrl(source.url);
  if (!url || !providerHost(url, source.provider)) return undefined;
  const date = context.request.date, party = String(context.request.partySize);
  if (source.provider === "TABELOG") {
    if (source.linkBasis !== "SOURCE_RESPONSE" || url.pathname !== "/en/booking/form_course/new"
      || !queryOnly(url, ["rcd", "member", "visit_date", "visit_time"])
      || url.searchParams.get("rcd") !== source.sourceEntityId || url.searchParams.get("member") !== party
      || url.searchParams.get("visit_date") !== date.replaceAll("-", "")
      || url.searchParams.get("visit_time") !== time.replace(":", "")) return undefined;
  } else {
    const entrance = safeUrl(source.observedEntranceUrl);
    if (source.linkBasis !== "VERIFIED_PARAMETERS" || !entrance || !providerHost(entrance, source.provider)
      || tableCheckPath(entrance) !== shopId(source.sourceEntityId)
      || !/^\/(?:en|ja)\/(?:shops\/)?[a-zA-Z0-9_-]+\/reserve(?:\/landing)?\/?$/.test(entrance.pathname)
      || entrance.origin !== url.origin || entrance.pathname !== url.pathname
      || !queryOnly(entrance, ["utm_source", "start_date", "start_time", "num_people", "pax"])
      || !queryOnly(url, ["start_date", "start_time", "num_people", "utm_source"])
      || url.searchParams.get("utm_source") !== entrance.searchParams.get("utm_source")
      || url.searchParams.get("start_date") !== date || url.searchParams.get("num_people") !== party
      || url.searchParams.get("start_time") !== time) return undefined;
  }
  return url;
}
function admitted(source: BookingHandoffSource, context: BookingHandoffContext): boolean {
  const { candidate, offer, check, request } = context;
  const now = Date.parse(context.now);
  if (!Number.isFinite(now) || !validDate(request.date) || !TIME.test(request.timeWindow.earliest)
    || !TIME.test(request.timeWindow.latest) || request.timeWindow.earliest > request.timeWindow.latest
    || !Number.isInteger(request.partySize) || request.partySize < 1) return false;
  const slot = offer.dateTime.match(/^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):[0-5]\d):00\+09:00$/);
  if (!slot || slot[1] !== request.date || offer.timezone !== "Asia/Tokyo" || request.timezone !== "Asia/Tokyo") return false;
  const time = slot[2]!;
  const window = time >= request.timeWindow.earliest && time <= request.timeWindow.latest
    || offer.alternativeToRequestedTime === true && request.permittedAlternativeTimeWindow !== undefined
      && time >= request.permittedAlternativeTimeWindow.earliest && time <= request.permittedAlternativeTimeWindow.latest;
  if (!window || source.candidateId !== candidate.restaurant.id || offer.restaurantId !== source.candidateId
    || source.offerId !== offer.id || offer.source !== source.provider || offer.partySize !== request.partySize
    || check.status !== "AVAILABLE" || check.sourceProvider !== source.provider
    || check.requestFingerprint !== restaurantAvailabilityRequestFingerprint(request)
    || !check.evidenceIds.includes(source.availabilityEvidenceId)
    || !fresh(check.displayExpiresAt, now) || !fresh(offer.displayExpiresAt, now)
    || [offer.sourceExpiresAt, check.expiresAt].some(expiry => expiry !== undefined && !fresh(expiry, now))) return false;
  const evidence = context.evidence.find(item => item.evidenceId === source.availabilityEvidenceId);
  if (!evidence || evidence.kind !== "AVAILABILITY" || evidence.provider !== source.provider
    || evidence.candidateId !== source.candidateId || evidence.sourceEntityId !== source.sourceEntityId
    || evidence.entityMatch?.confidence !== "HIGH" || evidence.claims.inventoryStatus !== "AVAILABLE"
    || evidence.claims.date !== request.date || evidence.claims.partySize !== request.partySize
    || !Array.isArray(evidence.claims.visibleSlots) || !evidence.claims.visibleSlots.includes(time)
    || !fresh(evidence.displayExpiresAt, now)
    || [evidence.sourceExpiresAt, evidence.expiresAt].some(expiry => expiry !== undefined && !fresh(expiry, now))
    || evidence.observedAt !== offer.checkedAt || evidence.observedAt !== check.checkedAt
    || source.observedAt !== evidence.observedAt || !Number.isFinite(Date.parse(source.observedAt))
    || Date.parse(source.observedAt) > now) return false;
  const candidateId = candidate.restaurant.sourceIds[source.provider === "TABELOG" ? "tabelog" : "tablecheck"];
  if (candidateId !== undefined && (source.provider === "TABLECHECK" ? shopId(candidateId) !== shopId(source.sourceEntityId) : candidateId !== source.sourceEntityId)) return false;
  return checkedLink(source, context, time) !== undefined;
}

/** First server check, directly after reading a code-owned source result. */
export function prepareBookingHandoff(source: BookingHandoffSource, context: BookingHandoffContext): PreparedBookingHandoff | undefined {
  return admitted(source, context) ? { contract: "restaurant-booking-handoff@2", source: structuredClone(source) } : undefined;
}
function checkedCitation(citation: RestaurantPageCitation, source: BookingHandoffSource, context: BookingHandoffContext): boolean {
  const terms = source.terms;
  if (!terms || !citation.text.trim() || !citation.identityEvidenceId) return false;
  const page = terms.pages.find(item => item.url === citation.url && item.readAt === citation.readAt
    && item.identityEvidenceId === citation.identityEvidenceId && item.candidateId === source.candidateId
    && item.sourceEntityId === source.sourceEntityId && item.provider === source.provider);
  const identity = context.evidence.find(item => item.evidenceId === citation.identityEvidenceId);
  const url = safeUrl(citation.url);
  return Boolean(page && url && sameDocumentOutlet(url, source.provider, source.sourceEntityId)
    && identity?.candidateId === source.candidateId && identity.provider === source.provider
    && identity.sourceEntityId === source.sourceEntityId && identity.entityMatch?.confidence === "HIGH"
    && Number.isFinite(Date.parse(page.readAt)) && Date.parse(page.readAt) <= Date.parse(context.now)
    && page.text.includes(citation.text));
}
function checkedAnswer(answer: RestaurantPageAnswer | undefined, source: BookingHandoffSource, context: BookingHandoffContext): answer is Extract<RestaurantPageAnswer, {status: "ANSWERED"}> {
  return answer?.status === "ANSWERED" && answer.candidateId === source.candidateId
    && Boolean(answer.answer.trim()) && !/[\r\n]/.test(answer.answer) && answer.citations.length > 0
    && answer.citations.every(citation => checkedCitation(citation, source, context))
    && answer.checkedPages.every(page => source.terms?.pages.some(item => item.url === page.url && item.readAt === page.readAt));
}

/** Second server check against the current snapshot; no prepared copy or URL is trusted. */
export function presentBookingHandoff(prepared: PreparedBookingHandoff, context: BookingHandoffContext): BookingHandoffView | undefined {
  if (prepared.contract !== "restaurant-booking-handoff@2" || !admitted(prepared.source, context)) return undefined;
  const source = prepared.source, name = source.provider === "TABELOG" ? "Tabelog" : "TableCheck";
  const evidence = context.evidence.find(item => item.evidenceId === source.availabilityEvidenceId)!;
  const terms: BookingHandoffView["terms"] = [];
  const cancellation = source.terms?.cancellation;
  const conflict = source.terms?.cancellationConflict;
  let cancellationNotice: BookingHandoffView["cancellationNotice"];
  if (conflict) {
    const {japanese, english} = conflict;
    if (checkedAnswer(japanese, source, context) && checkedAnswer(english, source, context)
      && japanese.citations.every(citation => !new URL(citation.url).pathname.startsWith("/en/"))
      && english.citations.every(citation => new URL(citation.url).pathname.startsWith("/en/"))) {
      cancellationNotice = "Cancellation terms differ between the Japanese and English pages";
      terms.push({label:"Japanese page: " + japanese.answer, citations:structuredClone(japanese.citations)},
        {label:"English page: " + english.answer, citations:structuredClone(english.citations)});
    }
  } else if (checkedAnswer(cancellation, source, context)) {
    terms.push({ label: cancellation.answer, citations: structuredClone(cancellation.citations) });
  }
  const card = source.terms?.card;
  if (card && checkedAnswer(card.answer, source, context)) {
    const label = {REQUIRED: "Card required", NOT_REQUIRED: "No card needed", MAY_REQUIRE: "May require a card"}[card.requirement];
    if (label) terms.push({label, citations: structuredClone(card.answer.citations)});
  }
  const plan = source.terms?.plan;
  const selectionHint = plan && !/[\r\n]/.test(plan.text) && checkedCitation(plan, source, context) ? `Pick ${plan.text}` : undefined;
  return {
    candidateId: source.candidateId, offerId: source.offerId, provider: source.provider, url: source.url,
    directLabel: `Book on ${name}`,
    continueLabel: `Continue on ${name} — date, time, ${context.offer.partySize} ${context.offer.partySize === 1 ? "guest" : "guests"} filled in`,
    ...(selectionHint ? {selectionHint} : {}),
    ...(source.provider === "TABLECHECK" ? {verificationHint: "Check date and guests"} : {}),
    ...(cancellationNotice ? {cancellationConfirmation: "Confirm cancellation terms on the website" as const} : {}),
    checkedAt: source.observedAt,
    displayExpiresAt: new Date(Math.min(...[context.offer.displayExpiresAt!, context.check.displayExpiresAt!,
      ...[context.offer.sourceExpiresAt, context.check.expiresAt, evidence.displayExpiresAt, evidence.sourceExpiresAt, evidence.expiresAt].filter((value): value is string => value !== undefined)].map(Date.parse))).toISOString(),
    ...(cancellationNotice ? {cancellationNotice} : {}),
    ...(source.provider === "TABELOG" ? {platformFee:TABELOG_ENGLISH_SYSTEM_FEE} : {}),
    knowledge: "SOURCE_OBSERVED_AVAILABILITY", linkCarries: ["DATE", "TIME", "PARTY_SIZE"], sourceSelection: "UNKNOWN", terms,
  };
}
