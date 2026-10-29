import type { BrowserControlHint, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { hasSelectedControlState } from "../../infrastructure/browser/control-selected-state.js";
import { inspectTabelogVacancyResponse, observedTabelogResponseDate } from "./tabelog-vacancy-response.js";
export { TABELOG_VACANCY_RESPONSES } from "./tabelog-vacancy-response.js";

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

export type TabelogRequestedDateState = "SELECTABLE" | "UNOBSERVED";

/** UNOBSERVED is UNKNOWN: private date classes never establish a business state. */
export function tabelogRequestedDateState(snapshot: BrowserSnapshot, date: string): TabelogRequestedDateState {
  return observedTabelogResponseDate(snapshot, date);
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

/** Exact source-response binding: another merchant, date, party or stale selection is not stock. */
export function tabelogCapturedSlots(snapshot: BrowserSnapshot, date: string, partySize: number): { availableSlots: string[]; hasExplicitSlotUi: boolean } | undefined {
  if (tabelogQueryControlHints(snapshot).length && !hasTabelogSelectedQuery(snapshot, date, partySize)) return undefined;
  const response = inspectTabelogVacancyResponse(snapshot, date, partySize);
  return response.status === "OBSERVED" ? { availableSlots: response.availableSlots, hasExplicitSlotUi: true } : undefined;
}
