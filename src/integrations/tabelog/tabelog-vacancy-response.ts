import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { observedTabelogQuerySelections } from "./tabelog-query-controls.js";

export const TABELOG_VACANCY_RESPONSES = [
  { origin: "https://tabelog.com", pathname: "/en/booking/calendar/find_vacancy/" },
  { origin: "https://tabelog.com", pathname: "/en/booking/calendar/find_vacancy" },
] as const;

export interface TabelogVacancyStructureIssue {
  field: "body" | "base_date" | "members" | "selection" | "selection.row" | "selection.row.url" | "selection.row.time";
  expected: string;
  actual: string;
}
export type TabelogVacancyObservation =
  | { status: "OBSERVED"; availableSlots: string[]; hasExplicitSlotUi: true;
      /** Already validated, verbatim response URLs; relative URLs stay relative. */
      formCourseLinks: Array<{ time: string; url: string }>;
      sourceResponse: { sequence: number; url: string; observedAt: string } }
  | { status: "UNKNOWN" }
  | { status: "SOURCE_STRUCTURE_CHANGED"; observedAt: string; issue: TabelogVacancyStructureIssue };

const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const type = (value: unknown): string => value === null ? "null" : Array.isArray(value) ? "array" : typeof value;

type BoundVacancyQuery = Exclude<TabelogVacancyObservation, {status:"OBSERVED"}> | {
  status: "BOUND_QUERY";
  value: Omit<Extract<TabelogVacancyObservation, {status:"OBSERVED"}>, "status" | "hasExplicitSlotUi">;
};

/** Shared validation of the existing response contract, including empty results. */
function inspectBoundVacancyQuery(snapshot: BrowserSnapshot, date: string, partySize: number): BoundVacancyQuery {
  const unknown: TabelogVacancyObservation = { status: "UNKNOWN" };
  if (snapshot.settlement === "PENDING") return unknown;
  const page = URL.parse(snapshot.url);
  const outletId = page?.pathname.match(/\/(\d+)\/$/)?.[1];
  if (!page || page.protocol !== "https:" || page.hostname.replace(/^www\./u, "") !== "tabelog.com" || !outletId) return unknown;
  // A newer contradictory or malformed reply invalidates the older observation.
  const response = latestVacancyResponse(snapshot);
  if (!response || response.status !== 200) return unknown;
  const requestUrl = new URL(response.url);
  for (const [field, expected] of [["rst_id", outletId], ["svps", String(partySize)]] as const) {
    if (requestUrl.searchParams.has(field) && (requestUrl.searchParams.getAll(field).length !== 1 || requestUrl.searchParams.get(field) !== expected)) return unknown;
  }
  if (requestUrl.searchParams.has("svd")) {
    const value = requestUrl.searchParams.get("svd")!;
    const parts = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/u);
    const normalized = parts ? `${parts[1]}-${parts[2]!.padStart(2, "0")}-${parts[3]!.padStart(2, "0")}` : /^\d{8}$/u.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : undefined;
    if (requestUrl.searchParams.getAll("svd").length !== 1 || normalized !== date) return unknown;
  }
  const changed = (field: TabelogVacancyStructureIssue["field"], expected: string, actual: unknown): Extract<TabelogVacancyObservation, {status:"SOURCE_STRUCTURE_CHANGED"}> =>
    ({ status: "SOURCE_STRUCTURE_CHANGED", observedAt: response.observedAt, issue: { field, expected, actual: type(actual) } });
  const body = object(response.body);
  if (!body) return changed("body", "object", response.body);
  const day = object(body.base_date);
  if (!day || ![day.year, day.month, day.day].every(Number.isSafeInteger)) return changed("base_date", "year/month/day integers", body.base_date);
  if (!Number.isSafeInteger(body.members) || Number(body.members) <= 0) return changed("members", "positive integer", body.members);
  const responseDate = `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`;
  if (responseDate !== date || body.members !== partySize) return unknown;
  if (!object(body.selection) && !Array.isArray(body.selection)) return changed("selection", "object or array", body.selection);
  const slots = new Set<string>();
  const formCourseLinks: Array<{ time: string; url: string }> = [];
  for (const row of Object.values(body.selection as object)) {
    const value = object(row);
    if (!value) return changed("selection.row", "object", row);
    if (typeof value.url !== "string") return changed("selection.row.url", "string", value.url);
    const link = URL.parse(value.url, snapshot.url);
    if (!link || link.origin !== "https://tabelog.com" || link.pathname !== "/en/booking/form_course/new"
      || link.searchParams.get("rcd") !== outletId || link.searchParams.get("member") !== String(partySize)
      || link.searchParams.get("visit_date") !== date.replaceAll("-", "")) return unknown;
    if (typeof value.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/u.test(value.time)) {
      // Existing observed alternatives after 24:00 are unsupported clocks,
      // not proof of a requested slot or of day-wide unavailability.
      if (/^(?:2[4-9]|[3-9]\d)[0-5]\d$/u.test(link.searchParams.get("visit_time") ?? "")) continue;
      return changed("selection.row.time", "HH:MM clock", value.time);
    }
    if (link.searchParams.get("visit_time") !== value.time.replace(":", "")) return unknown;
    slots.add(value.time);
    formCourseLinks.push({ time: value.time, url: value.url });
  }
  return { status: "BOUND_QUERY", value: { availableSlots: [...slots].sort(),
    formCourseLinks: formCourseLinks.sort((a, b) => a.time.localeCompare(b.time)),
    sourceResponse: { sequence: response.sequence, url: response.url, observedAt: response.observedAt } } };
}

/** Passive source data only. Empty results still do not establish inventory. */
export function inspectTabelogVacancyResponse(snapshot: BrowserSnapshot, date: string, partySize: number): TabelogVacancyObservation {
  const query = inspectBoundVacancyQuery(snapshot, date, partySize);
  if (query.status !== "BOUND_QUERY") return query;
  return query.value.availableSlots.length ? {status:"OBSERVED", hasExplicitSlotUi:true, ...query.value} : {status:"UNKNOWN"};
}

function latestVacancyResponse(snapshot: BrowserSnapshot) {
  return [...snapshot.responses ?? []].sort((a, b) => b.sequence - a.sequence).find(response => {
    const url = URL.parse(response.url);
    return url && TABELOG_VACANCY_RESPONSES.some(rule => url.origin === rule.origin && url.pathname === rule.pathname);
  });
}

/** Response-observed day only; it is not inventory for another party or time. */
export function observedTabelogResponseDate(snapshot: BrowserSnapshot, date: string): "SELECTABLE" | "UNOBSERVED" {
  const body = object(latestVacancyResponse(snapshot)?.body);
  if (!body || !Number.isSafeInteger(body.members) || Number(body.members) <= 0) return "UNOBSERVED";
  return inspectTabelogVacancyResponse(snapshot, date, Number(body.members)).status === "OBSERVED" ? "SELECTABLE" : "UNOBSERVED";
}

/** Query-setting progress only, never stock or confirmation of another field. */
export function observedTabelogResponsePartySize(snapshot: BrowserSnapshot, partySize: number): "SELECTABLE" | "UNOBSERVED" {
  const body = object(latestVacancyResponse(snapshot)?.body), day = object(body?.base_date);
  if (!Number.isSafeInteger(partySize) || partySize <= 0 || body?.members !== partySize
    || !day || ![day.year,day.month,day.day].every(Number.isSafeInteger) || Number(day.year) <= 0) return "UNOBSERVED";
  const calendar = new Date(0);
  calendar.setUTCFullYear(Number(day.year),Number(day.month)-1,Number(day.day));
  if (calendar.getUTCFullYear() !== day.year || calendar.getUTCMonth()+1 !== day.month || calendar.getUTCDate() !== day.day) return "UNOBSERVED";
  const date = `${day.year}-${String(day.month).padStart(2,"0")}-${String(day.day).padStart(2,"0")}`;
  const query = inspectBoundVacancyQuery(snapshot,date,partySize);
  if (query.status !== "BOUND_QUERY") return "UNOBSERVED";
  const conflict = observedTabelogQuerySelections(snapshot).people.some(value => value !== partySize);
  return conflict ? "UNOBSERVED" : "SELECTABLE";
}
