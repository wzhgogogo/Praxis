import type { BrowserControlHint, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { hasSelectedControlState } from "../../infrastructure/browser/control-selected-state.js";

/** The page may render future calendars in hidden DOM while its current query is restricted. */
export function tabelogQueryControlsRestricted(snapshot: BrowserSnapshot, controls: readonly { label: string; disabled: boolean }[], partySize: number): boolean {
  if (!snapshot.text.includes(`No available seats for ${partySize} guests.`)) return false;
  const dates = controls.filter(control => /^Date \d{4}-\d{2}-\d{2}$/.test(control.label));
  const guests = controls.filter(control => /^Guests \d+$/.test(control.label));
  return dates.length === 0 && guests.length > 0 && guests.every(control => control.disabled);
}

/** Public English outlet calendar attributes, including the October 2026 markup. */
export function tabelogQueryControlHints(snapshot: Readonly<BrowserSnapshot>): readonly BrowserControlHint[] {
  if (!/^https:\/\/tabelog\.com\/en\/[^/?]+\/A\d+\/A\d+\/\d+\/(?:[?#]|$)/.test(snapshot.url)) return [];
  return [
    { selector: ".p-booking-calendar [data-year][data-month][data-day]", labelPrefix: "Date", value: "DATE_PARTS" },
    { selector: '.p-booking-calendar button.p-booking-calendar__people-button, .p-booking-calendar :is(.p-booking-calendar__people-button-box, [aria-label="Guests"], [aria-label="People"], [aria-label="Party size"]) button', labelPrefix: "Guests", value: "TEXT" },
    { selector: ".p-booking-calendar button.p-booking-calendar__time-button[data-time]", labelPrefix: "Booking time", value: "TEXT", observationOnly: true },
  ];
}

function attribute(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\s${name}\\s*=["']([^"']*)["']`, "i"))?.[1];
}
function hasClass(tag: string, name: string): boolean {
  return (attribute(tag, "class") ?? "").split(/\s+/).includes(name);
}

export type TabelogRequestedDateState = "SELECTABLE" | "CLOSED" | "FULL" | "PHONE_ONLY" | "UNOBSERVED";

/** Source calendar day state, not a selected query or a time-specific inventory conclusion. */
export function tabelogRequestedDateState(snapshot: BrowserSnapshot, date: string): TabelogRequestedDateState {
  if (!tabelogQueryControlHints(snapshot).length || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "UNOBSERVED";
  const [year, month, day] = date.split("-").map(Number);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const stack: Array<{ name: string; hidden: boolean; booking: boolean }> = [];
  const tables: Array<{ html: string; hidden: boolean }> = [];
  let tableStart: { index: number; hidden: boolean } | undefined;
  const hiddenTag = (tag: string) => hasClass(tag, "is-hidden") || /\shidden(?:\s|>|=)/i.test(tag)
    || attribute(tag, "aria-hidden") === "true"
    || /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)\s*(?:;|$)/i.test(attribute(tag, "style") ?? "");
  for (const token of snapshot.html.matchAll(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<\/?[a-z][^>]*>/gi)) {
    const tag = token[0];
    if (/^<!--|^<script\b|^<style\b/i.test(tag)) continue;
    const closing = tag.match(/^<\/([a-z][\w-]*)/i);
    if (closing) {
      const name = closing[1]!.toLowerCase();
      if (name === "table" && tableStart) {
        tables.push({ html: snapshot.html.slice(tableStart.index, token.index + tag.length), hidden: tableStart.hidden });
        tableStart = undefined;
      }
      const index = stack.map(item => item.name).lastIndexOf(name);
      if (index >= 0) stack.length = index;
      continue;
    }
    const name = tag.match(/^<([a-z][\w-]*)/i)?.[1]?.toLowerCase();
    if (!name) continue;
    const hidden = hiddenTag(tag) || stack.some(item => item.hidden);
    const booking = hasClass(tag, "p-booking-calendar") || stack.some(item => item.booking);
    if (name === "table" && booking && hasClass(tag, "p-booking-calendar__calendar")) tableStart = { index: token.index, hidden };
    if (!new Set(["input", "br", "hr", "img", "meta", "link"]).has(name) && !tag.endsWith("/>")) stack.push({ name, hidden, booking });
  }
  const states: TabelogRequestedDateState[] = [];
  for (const table of tables) {
    if (table.hidden) continue;
    const caption = table.html.match(/<caption\b[^>]*>[\s\S]*?<em\b[^>]*>\s*([A-Za-z]{3,9})\s+(\d{4})\s*<\/em>/i);
    if (!caption || Number(caption[2]) !== year || monthNames.findIndex(name => name.toLowerCase() === caption[1]!.slice(0, 3).toLowerCase()) + 1 !== month) continue;
    for (const cell of table.html.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)) {
      const content = cell[1]!;
      const dayLabel = content.match(/<span\b([^>]*)>\s*(\d{1,2})\s*<\/span>/i);
      if (!dayLabel || !hasClass(`<span ${dayLabel[1]}>`, "p-booking-calendar__day-num") || Number(dayLabel[2]) !== day) continue;
      const selected = content.match(/<(?:p|button)\b[^>]*\bdata-year=["'][^>]*>/i)?.[0] ?? "";
      if ((hasClass(selected, "is-selectable") || hasSelectedControlState(attributes(selected)))
        && Number(attribute(selected, "data-year")) === year && Number(attribute(selected, "data-month")) === month
        && Number(attribute(selected, "data-day")) === day) states.push("SELECTABLE");
      else if (hasClass(`<span ${dayLabel[1]}>`, "p-booking-calendar__day-num--closed")) states.push("CLOSED");
      else if (hasClass(`<span ${dayLabel[1]}>`, "p-booking-calendar__day-num--full")) states.push("FULL");
      else if (hasClass(`<span ${dayLabel[1]}>`, "p-booking-calendar__day-num--tel")) states.push("PHONE_ONLY");
      else states.push("UNOBSERVED");
    }
  }
  return states.length === 1 ? states[0]! : "UNOBSERVED";
}

function attributes(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/(?:^|\s)([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(match => [match[1]!.toLowerCase(), match[2]!]));
}

interface QueryElement { name: string; tag: string; content: string; hidden: boolean; booking: boolean; parent: QueryElement | undefined }

/** Keep DOM ownership and explicit hidden ancestors; unrelated selected buttons are not people. */
function queryElements(html: string): QueryElement[] {
  const stack: Array<QueryElement & { start: number }> = [];
  const result: QueryElement[] = [];
  for (const token of html.matchAll(/<!--[\s\S]*?-->|<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)\s*>|<\/?[a-z][^>]*>/gi)) {
    const tag = token[0];
    if (/^<!--|^<(?:script|style)\b/i.test(tag)) continue;
    const closing = tag.match(/^<\/([\w-]+)/i);
    if (closing) {
      const index = stack.map(item => item.name).lastIndexOf(closing[1]!.toLowerCase());
      if (index >= 0) {
        const element = stack[index]!;
        element.content = html.slice(element.start, token.index);
        stack.length = index;
      }
      continue;
    }
    const name = tag.match(/^<([\w-]+)/i)?.[1]?.toLowerCase();
    if (!name) continue;
    const parent = stack.at(-1);
    const element = { name, tag, content: "", parent, start: token.index + tag.length,
      hidden: Boolean(parent?.hidden) || hasClass(tag, "is-hidden") || /\shidden(?:\s|=|>)/i.test(tag)
        || attribute(tag, "aria-hidden") === "true" || /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)\s*(?:;|$)/i.test(attribute(tag, "style") ?? ""),
      booking: Boolean(parent?.booking) || hasClass(tag, "p-booking-calendar") };
    if (element.booking) result.push(element);
    if (!new Set(["input", "br", "hr", "img", "meta", "link", "source", "wbr", "area", "embed", "param", "col", "base"]).has(name) && !tag.endsWith("/>")) stack.push(element);
  }
  return result;
}

function inPeopleGroup(element: QueryElement): boolean {
  if (element.name === "button" && hasClass(element.tag, "p-booking-calendar__people-button")) return true;
  for (let current: QueryElement | undefined = element.parent; current?.booking; current = current.parent) {
    if (hasClass(current.tag, "p-booking-calendar__people-button-box")) return true;
    const label = attribute(current.tag, "aria-label") ?? (current.name === "fieldset"
      ? current.content.match(/<legend\b[^>]*>([\s\S]*?)<\/legend>/i)?.[1]
      : hasClass(current.tag, "p-booking-calendar__select") ? current.content.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] : undefined);
    if (label && /^(?:guests?|people|party size|members?|人数)$/i.test(label.replace(/<[^>]*>/g, "").trim())) return true;
  }
  return false;
}

/** Selected query state is not inventory. A time option or hidden Reserve link is not a slot. */
export function hasTabelogSelectedQuery(snapshot: BrowserSnapshot, date: string, partySize: number): boolean {
  if (!tabelogQueryControlHints(snapshot).length) return false;
  const elements = queryElements(snapshot.html);
  const selected = elements.filter(element => !element.hidden && hasSelectedControlState(attributes(element.tag)));
  const selectedDates = selected.filter(element => ["data-year", "data-month", "data-day"].every(name => attribute(element.tag, name) !== undefined))
    .map(element => ["data-year", "data-month", "data-day"].map(name => attribute(element.tag, name)))
    .map(parts => parts.every(part => part && /^\d+$/.test(part)) ? `${parts[0]}-${parts[1]!.padStart(2, "0")}-${parts[2]!.padStart(2, "0")}` : undefined);
  const selectedPeople = selected.filter(element => element.name === "button" && inPeopleGroup(element))
    .map(element => {
      const value = attribute(element.tag, "data-value");
      const text = element.content.replace(/<[^>]*>/g, " ").trim().match(/^(\d+)(?:\s*(?:guests?|people|persons?|名|人))?$/i)?.[1];
      if (value !== undefined && (!/^\d+$/.test(value) || text !== undefined && Number(text) !== Number(value))) return undefined;
      return value !== undefined ? Number(value) : text !== undefined ? Number(text) : undefined;
    });
  const hiddenPeople = elements.filter(element => element.name === "input" && attribute(element.tag, "type") === "hidden" && inPeopleGroup(element))
    .map(element => attribute(element.tag, "value"))
    .map(value => value && /^\d+$/.test(value) ? Number(value) : undefined);
  return selectedDates.length > 0 && selectedDates.every(value => value === date)
    && selectedPeople.length > 0 && selectedPeople.every(value => value === partySize)
    && hiddenPeople.every(value => value === partySize);
}

export const TABELOG_VACANCY_RESPONSES = [
  { origin: "https://tabelog.com", pathname: "/en/booking/calendar/find_vacancy/" },
  { origin: "https://tabelog.com", pathname: "/en/booking/calendar/find_vacancy" },
] as const;

/** Exact source-response binding: another merchant, date, party or stale selection is not stock. */
export function tabelogCapturedSlots(snapshot: BrowserSnapshot, date: string, partySize: number): { availableSlots: string[]; hasExplicitSlotUi: boolean } | undefined {
  if (!hasTabelogSelectedQuery(snapshot, date, partySize)) return undefined;
  const outletId = new URL(snapshot.url).pathname.match(/\/(\d+)\/$/)?.[1];
  for (const response of [...snapshot.responses ?? []].sort((a,b)=>b.sequence-a.sequence)) {
    let responseUrl: URL;
    try { responseUrl = new URL(response.url); } catch { continue; }
    if (!TABELOG_VACANCY_RESPONSES.some(rule => responseUrl.origin === rule.origin && responseUrl.pathname === rule.pathname)) continue;
    if (response.status !== 200) return undefined;
    const body = response.body as { base_date?: {year?:number;month?:number;day?:number}; members?:number; selection?:unknown } | null;
    if (!body || !body.base_date || body.members !== partySize) return undefined;
    const d=body.base_date;
    if (`${d.year}-${String(d.month).padStart(2,"0")}-${String(d.day).padStart(2,"0")}` !== date) return undefined;
    if (!body.selection || typeof body.selection !== "object") return undefined;
    const slots = new Set<string>();
    for (const row of Object.values(body.selection)) {
      if (!row || typeof row !== "object") return undefined;
      const value=row as {time?:unknown;url?:unknown};
      if (typeof value.url !== "string") return undefined;
      let link: URL;
      try { link=new URL(value.url,snapshot.url); } catch { return undefined; }
      if (link.origin !== "https://tabelog.com" || link.pathname !== "/en/booking/form_course/new"
        || link.searchParams.get("rcd") !== outletId || link.searchParams.get("member") !== String(partySize)
        || link.searchParams.get("visit_date") !== date.replaceAll("-","")) return undefined;
      if (typeof value.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.time)) {
        if (/^(?:2[4-9]|[3-9]\d)[0-5]\d$/.test(link.searchParams.get("visit_time") ?? "")) continue;
        return undefined;
      }
      if (link.searchParams.get("visit_time") !== value.time.replace(":","")) return undefined;
      slots.add(value.time);
    }
    return slots.size ? { availableSlots:[...slots].sort(),hasExplicitSlotUi:true } : undefined;
  }
}
