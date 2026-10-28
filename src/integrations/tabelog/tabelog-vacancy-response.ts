import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";

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
  | { status: "OBSERVED"; availableSlots: string[]; hasExplicitSlotUi: true }
  | { status: "UNKNOWN" }
  | { status: "SOURCE_STRUCTURE_CHANGED"; observedAt: string; issue: TabelogVacancyStructureIssue };

const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const type = (value: unknown): string => value === null ? "null" : Array.isArray(value) ? "array" : typeof value;

/** Passive source data only. Caller separately verifies the current query and same-outlet identity. */
export function inspectTabelogVacancyResponse(snapshot: BrowserSnapshot, date: string, partySize: number): TabelogVacancyObservation {
  const unknown: TabelogVacancyObservation = { status: "UNKNOWN" };
  if (snapshot.settlement === "PENDING") return unknown;
  const page = URL.parse(snapshot.url);
  const outletId = page?.pathname.match(/\/(\d+)\/$/)?.[1];
  if (!page || page.protocol !== "https:" || page.hostname.replace(/^www\./u, "") !== "tabelog.com" || !outletId) return unknown;
  // A newer contradictory or malformed reply invalidates the older observation.
  const response = [...snapshot.responses ?? []].sort((a, b) => b.sequence - a.sequence).find(response => {
    const url = URL.parse(response.url);
    return url && TABELOG_VACANCY_RESPONSES.some(rule => url.origin === rule.origin && url.pathname === rule.pathname);
  });
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
  const changed = (field: TabelogVacancyStructureIssue["field"], expected: string, actual: unknown): TabelogVacancyObservation =>
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
  }
  // Empty/unsupported collections are not independently bound no-stock proof.
  return slots.size ? { status: "OBSERVED", availableSlots: [...slots].sort(), hasExplicitSlotUi: true } : unknown;
}
