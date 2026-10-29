import { decodeHTML } from "entities";
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
export type TabelogRequestedDateState = "SELECTABLE" | "UNOBSERVED";

/** UNOBSERVED is UNKNOWN: private date classes never establish a business state. */
export function tabelogRequestedDateState(snapshot: BrowserSnapshot, date: string): TabelogRequestedDateState {
  return observedTabelogResponseDate(snapshot, date);
}

function attributes(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/(?:^|\s)([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(match => [match[1]!.toLowerCase(), match[2]!]));
}

interface QueryElement { name: string; tag: string; content: string; hidden: boolean; parent: QueryElement | undefined }
const plain = (html: string): string => decodeHTML(html.replace(/<[^>]*>/gu, " ")).replace(/\s+/gu, " ").trim();
const present = (tag: string, name: string): boolean => new RegExp(`\\s${name}(?:\\s|=|/?>)`, "iu").test(tag);

/** Public visible/native/ARIA evidence; private attributes are navigation hints only. */
function queryElements(html: string): QueryElement[] {
  const stack: Array<QueryElement & { start: number }> = [], result: QueryElement[] = [];
  for (const token of html.matchAll(/<!--[\s\S]*?-->|<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)\s*>|<\/?[a-z][^>]*>/gi)) {
    const tag = token[0];
    if (/^<!--|^<(?:script|style)\b/i.test(tag)) continue;
    const closing = tag.match(/^<\/([\w-]+)/i);
    if (closing) {
      const index = stack.map(item => item.name).lastIndexOf(closing[1]!.toLowerCase());
      if (index >= 0) { stack[index]!.content = html.slice(stack[index]!.start, token.index); stack.length = index; }
      continue;
    }
    const name = tag.match(/^<([\w-]+)/i)?.[1]?.toLowerCase(); if (!name) continue;
    const parent = stack.at(-1);
    const element = { name, tag, content: "", parent, start: token.index + tag.length,
      hidden: Boolean(parent?.hidden) || present(tag, "hidden") || attribute(tag, "aria-hidden") === "true"
        || attribute(tag, "type") === "hidden" || /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)\s*(?:;|$)/i.test(attribute(tag, "style") ?? "") };
    result.push(element);
    if (!/^(?:input|br|hr|img|meta|link|source|wbr|area|embed|param|col|base)$/u.test(name) && !tag.endsWith("/>")) stack.push(element);
  }
  return result;
}

function publicLabel(element: QueryElement, elements: QueryElement[]): string {
  const own = attribute(element.tag, "aria-label"); if (own) return plain(own);
  const labelledBy = (attribute(element.tag, "aria-labelledby") ?? "").split(/\s+/u).filter(Boolean);
  const labels = elements.filter(row => !row.hidden && labelledBy.includes(attribute(row.tag, "id") ?? ""));
  if (labels.length) return labels.map(row => plain(row.content)).join(" ");
  const id = attribute(element.tag, "id");
  const explicit = id && elements.find(row => !row.hidden && row.name === "label" && attribute(row.tag, "for") === id);
  if (explicit) return plain(explicit.content);
  for (let owner = element.parent; owner; owner = owner.parent) {
    const label = attribute(owner.tag, "aria-label"); if (label) return plain(label);
    const direct = elements.filter(row => row.parent === owner && !row.hidden && /^(?:legend|label|h[1-6]|p|span)$/u.test(row.name));
    const field = direct.map(row => plain(row.content)).filter(text => /^(?:guests?|people|party size|members?|人数|date|日付)$/iu.test(text));
    if (field.length === 1) return field[0]!;
  }
  return "";
}
function publicDate(element: QueryElement): string | undefined {
  const text = plain(attribute(element.tag, "aria-label") ?? element.content);
  const iso = text.match(/(?:^|\D)(\d{4}-\d{2}-\d{2})(?:$|\D)/u)?.[1];
  if (iso) return iso;
  if (!/^\d{1,2}$/u.test(plain(element.content))) return undefined;
  for (let owner: QueryElement | undefined = element; owner; owner = owner.parent) {
    if (owner.name !== "table" && attribute(owner.tag, "role") !== "grid") continue;
    const caption = attribute(owner.tag, "aria-label") ?? plain(owner.content.match(/<caption\b[^>]*>([\s\S]*?)<\/caption>/iu)?.[1] ?? "");
    const english = caption.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/iu);
    const numeric = caption.match(/(\d{4})\s*[年/-]\s*(\d{1,2})/u);
    const year = Number(english?.[2] ?? numeric?.[1]), month = english ? ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].indexOf(english[1]!.slice(0,3).toLowerCase()) + 1 : Number(numeric?.[2]);
    const day = Number(plain(element.content));
    if (year && month > 0 && month <= 12 && day > 0 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate()) return `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }
  return undefined;
}

/** Confirmation may come from visible public state or the latest exactly bound source response. */
export function hasTabelogSelectedQuery(snapshot: BrowserSnapshot, date: string, partySize: number): boolean {
  if (!/^https:\/\/tabelog\.com\/(?:en\/)?[^/?]+\/A\d+\/A\d+\/\d+\/(?:[?#]|$)/u.test(snapshot.url) || snapshot.settlement === "PENDING") return false;
  const elements = queryElements(snapshot.visibleHtml ?? snapshot.html).filter(row => !row.hidden);
  const dates: Array<string | undefined> = [], people: Array<number | undefined> = [];
  for (const element of elements) {
    const native = element.name === "input" && /^(?:date|number|radio|checkbox)$/iu.test(attribute(element.tag, "type") ?? "");
    const selected = hasSelectedControlState(attributes(element.tag)) || element.name === "input" && /^(?:radio|checkbox)$/iu.test(attribute(element.tag, "type") ?? "") && present(element.tag,"checked");
    const label = publicLabel(element, elements);
    if (element.name === "select" || native && /^(?:date|number)$/iu.test(attribute(element.tag,"type") ?? "")) {
      const options = elements.filter(row => row.name === "option" && row.parent === element);
      const option = options.find(row => present(row.tag,"selected")) ?? options[0];
      const value = element.name === "select" ? option && (attribute(option.tag,"value") ?? plain(option.content)) : attribute(element.tag,"value");
      if (attribute(element.tag,"type") === "date" || /^(?:date|日付)$/iu.test(label)) dates.push(value);
      else if (/^(?:guests?|people|party size|members?|人数)$/iu.test(label)) {
        const number = value?.match(/^\d+(?:\s*(?:guests?|people|persons?|名|人))?$/iu)?.[0];
        const textNumber = option && plain(option.content).match(/^(\d+)(?:\s*(?:guests?|people|persons?|名|人))?$/iu)?.[1];
        people.push(number && (!textNumber || Number(textNumber) === Number.parseInt(number,10)) ? Number.parseInt(number,10) : undefined);
      }
    } else if (selected) {
      const day = publicDate(element); if (day) dates.push(day);
      if (/^(?:guests?|people|party size|members?|人数)$/iu.test(label)) {
        const text = plain(element.content) || attribute(element.tag,"value") || "";
        people.push(/^\d+(?:\s*(?:guests?|people|persons?|名|人))?$/iu.test(text) ? Number.parseInt(text,10) : undefined);
      }
    }
  }
  if (dates.some(value => value !== date) || people.some(value => value !== partySize)) return false;
  return dates.length > 0 && people.length > 0 || inspectTabelogVacancyResponse(snapshot,date,partySize).status === "OBSERVED";
}

/** Latest source response still owns all inventory; selected controls alone never establish stock. */
export function tabelogCapturedSlots(snapshot: BrowserSnapshot, date: string, partySize: number): { availableSlots: string[]; hasExplicitSlotUi: boolean } | undefined {
  if (!hasTabelogSelectedQuery(snapshot,date,partySize)) return undefined;
  const response = inspectTabelogVacancyResponse(snapshot,date,partySize);
  return response.status === "OBSERVED" ? { availableSlots: response.availableSlots, hasExplicitSlotUi: true } : undefined;
}
