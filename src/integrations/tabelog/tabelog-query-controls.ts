import type { BrowserControlHint, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";

export const TABELOG_QUERY_READY_SELECTOR = ".p-booking-calendar:has(p.js-calendar-day-target.is-selectable):has(button.js-people-button:not(.is-hidden))";

/** Live-observed English outlet calendar, 2026-09-16. No booking-form controls. */
export function tabelogQueryControlHints(snapshot: Readonly<BrowserSnapshot>): readonly BrowserControlHint[] {
  if (!/^https:\/\/tabelog\.com\/en\/[^/?]+\/A\d+\/A\d+\/\d+\/(?:[?#]|$)/.test(snapshot.url)) return [];
  return [
    { selector: ".p-booking-calendar p.js-calendar-day-target.is-selectable[data-year][data-month][data-day]", labelPrefix: "Date", value: "DATE_PARTS", selectedClass: "is-current" },
    { selector: ".p-booking-calendar button.js-people-button", labelPrefix: "Guests", value: "TEXT", selectedClass: "is-active" },
    { selector: ".p-booking-calendar button.js-time-button", labelPrefix: "Booking time", value: "TEXT", selectedClass: "is-active", observationOnly: true },
  ];
}

function attribute(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1];
}
function hasClass(tag: string, name: string): boolean {
  return (attribute(tag, "class") ?? "").split(/\s+/).includes(name);
}

/** Selected query state is not inventory. A time option or hidden Reserve link is not a slot. */
export function hasTabelogSelectedQuery(snapshot: BrowserSnapshot, date: string, partySize: number): boolean {
  if (!tabelogQueryControlHints(snapshot).length) return false;
  const selectedDates = [...snapshot.html.matchAll(/<p\b[^>]*>/gi)].map(match => match[0])
    .filter(tag => hasClass(tag, "js-calendar-day-target") && hasClass(tag, "is-current"))
    .map(tag => [attribute(tag, "data-year"), attribute(tag, "data-month"), attribute(tag, "data-day")])
    .filter(parts => parts.every(part => part && /^\d+$/.test(part)))
    .map(parts => `${parts[0]}-${parts[1]!.padStart(2, "0")}-${parts[2]!.padStart(2, "0")}`);
  const selectedPeople = [...snapshot.html.matchAll(/<button\b[^>]*>\s*(\d+)\s*<\/button>/gi)]
    .filter(match => hasClass(match[0], "js-people-button") && hasClass(match[0], "is-active"))
    .map(match => Number(match[1]));
  const hiddenPeople = [...snapshot.html.matchAll(/<input\b[^>]*>/gi)].map(match => match[0])
    .filter(tag => hasClass(tag, "js-people-hidden-value"))
    .map(tag => Number(attribute(tag, "value")));
  return selectedDates.length > 0 && selectedDates.every(value => value === date)
    && selectedPeople.length > 0 && selectedPeople.every(value => value === partySize)
    && hiddenPeople.length > 0 && hiddenPeople.every(value => value === partySize);
}


export const TABELOG_VACANCY_RESPONSES = [{ origin: "https://tabelog.com", pathname: "/en/booking/calendar/find_vacancy/" }] as const;

/** Exact source-response binding: another merchant, date, party or stale selection is not stock. */
export function tabelogCapturedSlots(snapshot: BrowserSnapshot, date: string, partySize: number): { availableSlots: string[]; hasExplicitSlotUi: boolean } | undefined {
  if (!hasTabelogSelectedQuery(snapshot, date, partySize)) return undefined;
  const outletId = new URL(snapshot.url).pathname.match(/\/(\d+)\/$/)?.[1];
  for (const response of [...snapshot.responses ?? []].sort((a,b)=>b.sequence-a.sequence)) {
    const responseUrl = new URL(response.url);
    if (response.status !== 200 || responseUrl.origin !== TABELOG_VACANCY_RESPONSES[0].origin || responseUrl.pathname !== TABELOG_VACANCY_RESPONSES[0].pathname) continue;
    const body = response.body as { base_date?: {year?:number;month?:number;day?:number}; members?:number; selection?:unknown } | null;
    if (!body || !body.base_date || body.members !== partySize) continue;
    const d=body.base_date;
    if (`${d.year}-${String(d.month).padStart(2,"0")}-${String(d.day).padStart(2,"0")}` !== date) continue;
    if (!body.selection || typeof body.selection !== "object") return undefined;
    const rows=Object.values(body.selection);
    // Empty responses need an independent merchant binding; never infer it from the current URL alone.
    if (!rows.length) return undefined;
    const slots = new Set<string>();
    for (const row of rows) {
      if (!row || typeof row !== "object") return undefined;
      const value=row as {time?:unknown;url?:unknown};
      if (typeof value.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.time) || typeof value.url !== "string") return undefined;
      let link: URL;
      try { link=new URL(value.url,snapshot.url); } catch { return undefined; }
      if (link.origin !== "https://tabelog.com" || link.pathname !== "/en/booking/form_course/new"
        || link.searchParams.get("rcd") !== outletId || link.searchParams.get("member") !== String(partySize)
        || link.searchParams.get("visit_date") !== date.replaceAll("-","")
        || link.searchParams.get("visit_time") !== value.time.replace(":","")) return undefined;
      slots.add(value.time);
    }
    return { availableSlots:[...slots].sort(),hasExplicitSlotUi:true };
  }
  return undefined;
}
