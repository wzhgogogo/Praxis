import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { RunRecord, EvidenceRecord } from "./diagnostic-evaluator-record.js";

export interface IndependentSourceAssessment { status: "SATISFIED" | "NOT_SATISFIED" | "NOT_EVALUATED"; observations: string[]; refs: string[]; }
interface Slot { time?: string | undefined; linkedTime?: string | undefined; outlet?: string | undefined; date?: string | undefined; party?: number | undefined; }
export interface PostDeliveryTabelogObservation {
  url: string; status: number; observedAt: string; path: string; sha256: string;
  date?: string | undefined; party?: number | undefined; slots: Slot[]; complete: boolean;
}
interface ReadRequest { date?: string; partySize?: number; timeWindow?: { earliest: string; latest: string }; permittedAlternativeTimeWindow?: { earliest: string; latest: string }; }
const record = (value: unknown): Record<string, unknown> | undefined => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const text = (value: unknown): string | undefined => typeof value === "string" ? value : undefined;
const compactDate = (value: string | undefined) => value?.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
const slotTime = (value: string | undefined) => value?.replace(/^(\d{2})(\d{2})$/, "$1:$2");
const outletId = (value: string | undefined) => value?.split("/").filter(Boolean).at(-1);

/** Read an existing raw GET, verifying bytes. Never calls the network. */
export function loadPostDeliveryTabelogObservation(metadataPath: string, bodyPath: string): PostDeliveryTabelogObservation {
  const metadata = record(JSON.parse(readFileSync(metadataPath, "utf8")));
  const bytes = readFileSync(bodyPath), sha256 = createHash("sha256").update(bytes).digest("hex");
  if (!metadata || metadata.method !== "GET" || metadata.sha256 !== sha256 || typeof metadata.url !== "string" || typeof metadata.status !== "number" || typeof metadata.finishedAt !== "string") throw Error(`Invalid raw GET metadata/SHA: ${metadataPath}`);
  const url = new URL(metadata.url);
  if (url.hostname !== "tabelog.com" || url.pathname !== "/en/booking/calendar/find_vacancy/" || [...url.searchParams.keys()].sort().join(",") !== "rst_id,svd,svps,svt") throw Error("Not a frozen four-parameter Tabelog GET");
  const body = record(JSON.parse(bytes.toString("utf8")));
  const baseDate = record(body?.base_date);
  const date = typeof baseDate?.year === "number" && typeof baseDate.month === "number" && typeof baseDate.day === "number"
    ? `${baseDate.year}-${String(baseDate.month).padStart(2,"0")}-${String(baseDate.day).padStart(2,"0")}` : undefined;
  const selection = body?.selection;
  const rows = Array.isArray(selection) ? selection : Object.values(record(selection) ?? {});
  const slots = rows.map(value => {
    const row = record(value);
    try {
      const link = new URL(text(row?.url) ?? "", "https://tabelog.com");
      const member = link.searchParams.get("member");
      return { time: text(row?.time), linkedTime: slotTime(link.searchParams.get("visit_time") ?? undefined), outlet: link.searchParams.get("rcd") ?? undefined,
        date: compactDate(link.searchParams.get("visit_date") ?? undefined), party: member === null ? undefined : Number(member) };
    } catch { return {}; }
  });
  return { url: url.href, status: metadata.status, observedAt: metadata.finishedAt, path: bodyPath, sha256,
    date, party: typeof body?.members === "number" ? body.members : undefined, slots,
    complete: selection !== undefined && selection !== null && (Array.isArray(selection) || Boolean(record(selection))) };
}

/** Independent minimal English weekly-hours grammar. Unsupported prose is UNKNOWN.
 * This intentionally does not infer previous-day overnight carry or merge split shifts.
 */
export function evaluateSourceOpeningHours(lines: string[], date: string, window: { earliest: string; latest: string }, timezone: string): "OPEN" | "CLOSED" | "UNKNOWN" {
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }); } catch { return "UNKNOWN"; }
  const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(`${date}T12:00:00Z`).getUTCDay()];
  const entries = lines.filter(line => line.split(":", 1)[0]?.trim().toLowerCase() === day?.toLowerCase());
  if (entries.length !== 1) return "UNKNOWN";
  const value = entries[0]!.slice(entries[0]!.indexOf(":") + 1).trim();
  if (/^(?:closed(?: today| all day)?|not open)\.?$/i.test(value)) return "CLOSED";
  if (/^open 24 hours$/i.test(value)) return "OPEN";
  const minute = (value: string): number | undefined => {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!match) return undefined;
    let hour = Number(match[1]); const minutes = Number(match[2]);
    if (minutes > 59 || hour > 23 || match[3] && (hour < 1 || hour > 12)) return undefined;
    if (match[3]) hour = hour % 12 + (/pm/i.test(match[3]) ? 12 : 0);
    return hour * 60 + minutes;
  };
  const start = minute(window.earliest), end = minute(window.latest);
  if (start === undefined || end === undefined || start > end) return "UNKNOWN";
  const ranges = value.split(/\s*[,;]\s*/).map(range => range.split(/\s*[–-]\s*/).map(minute));
  if (ranges.some(range => range.length !== 2 || range.some(value => value === undefined) || range[0]! >= range[1]!)) return "UNKNOWN";
  return ranges.some(([open, close]) => open! <= start && end < close!) ? "OPEN" : "CLOSED";
}

export function assessRawTabelog(input: { root: RunRecord; evidence: EvidenceRecord[]; request: ReadRequest; times: string[]; postDelivery: PostDeliveryTabelogObservation[]; expected?: "AVAILABLE" | "EMPTY" }): IndependentSourceAssessment | undefined {
  const sources = input.evidence.filter(item => item.provider === "TABELOG" && item.kind === "AVAILABILITY");
  if (!sources.length) return undefined;
  const expected = input.expected ?? "AVAILABLE";
  const result = (status: IndependentSourceAssessment["status"], reason: string, refs: string[]): IndependentSourceAssessment => ({ status, observations: [`raw Tabelog ${reason}`], refs });
  const request = input.request, window = request.permittedAlternativeTimeWindow ?? request.timeWindow;
  if (!request.date || request.partySize === undefined || !window) return result("NOT_EVALUATED", "request date/party/time missing", ["materializedCase.semantic"]);
  const checks: IndependentSourceAssessment[] = [];
  for (const source of sources) {
    const id = outletId(source.sourceEntityId);
    if (!id) { checks.push(result("NOT_EVALUATED", "source outlet ID missing", ["finalSnapshot.domainState.readEvidence"])); continue; }
    type Raw = { date?: string | undefined; party?: number | undefined; slots: Slot[]; complete: boolean; ref: string; status: number };
    const post = input.postDelivery.filter(item => new URL(item.url).searchParams.get("rst_id") === id).sort((a,b) => Date.parse(a.observedAt) - Date.parse(b.observedAt)).at(-1);
    let raw: Raw | undefined = post ? { ...post, ref: `${post.path}#sha256=${post.sha256}` } : undefined;
    const trace = [...(input.root.diagnostics?.browserTrace ?? []), ...(input.root.sourceTrace?.browserTrace ?? [])];
    const snapshots = trace.filter(entry => entry.kind === "SNAPSHOT" && entry.detail?.url && outletId(new URL(entry.detail.url).pathname) === id
      && /(^|\.)tabelog\.com$/.test(new URL(entry.detail.url).hostname)
      && Date.parse(entry.at ?? "") <= Date.parse(source.observedAt ?? ""));
    if (!raw) {
      const responses = snapshots.flatMap(entry => (entry.detail?.responses ?? []).filter(response => response.url && /\/booking\/calendar\/find_vacancy\//.test(response.url))
        .map(response => ({ entry, response }))).sort((a,b) => Date.parse(a.response.observedAt ?? a.entry.at ?? "") - Date.parse(b.response.observedAt ?? b.entry.at ?? ""));
      const latest = responses.at(-1);
      if (latest) {
        const body = latest.response.body;
        const date = body?.base_date;
        raw = { date: date?.year && date.month && date.day ? `${date.year}-${String(date.month).padStart(2,"0")}-${String(date.day).padStart(2,"0")}` : undefined,
          party: body?.members, slots: (body?.selection ?? []).map(row => ({ time: row.time, linkedTime: slotTime(row.link?.visit_time), outlet: row.link?.rcd,
            date: compactDate(row.link?.visit_date), party: row.link?.member === undefined ? undefined : Number(row.link.member) })),
          complete: body?.selection !== undefined, status: latest.response.status ?? 0, ref: `browserTrace[sequence=${latest.entry.sequence}].responses` };
      }
    }
    if (raw) {
      if (raw.status !== 200 || !raw.complete || !raw.date || raw.party === undefined) { checks.push(result("NOT_EVALUATED", "response lacks raw date/party/selection", [raw.ref])); continue; }
      if (raw.date !== request.date || raw.party !== request.partySize) { checks.push(result("NOT_SATISFIED", `response date/party conflict: ${raw.date}/${raw.party}`, [raw.ref])); continue; }
      const relevant = raw.slots.filter(slot => slot.time && (input.times.length ? input.times.includes(slot.time) : slot.time >= window.earliest && slot.time <= window.latest));
      if (relevant.some(slot => !slot.outlet || !slot.date || slot.party === undefined || !slot.linkedTime)) {
        checks.push(result("NOT_EVALUATED", "slot link lacks outlet/date/party/time fields", [raw.ref])); continue;
      }
      const wrong = relevant.some(slot => slot.outlet !== id || slot.date !== request.date || slot.party !== request.partySize || slot.time !== slot.linkedTime);
      if (wrong) { checks.push(result("NOT_SATISFIED", "slot links conflict with outlet/date/party", [raw.ref])); continue; }
      const supports = expected === "EMPTY" ? !relevant.length : input.times.length > 0 && input.times.every(time => relevant.some(slot => slot.time === time));
      checks.push(result(supports ? "SATISFIED" : "NOT_SATISFIED", `response ${supports ? "supports" : "contradicts"} ${expected} at requested date/party/time`, [raw.ref])); continue;
    }
    // No raw response: only actual selected controls plus enabled visible time buttons.
    const snapshot = snapshots.sort((a,b) => Date.parse(a.at ?? "") - Date.parse(b.at ?? "")).at(-1);
    const controls = trace.findLast(entry => entry.kind === "CONTROLS" && entry.detail?.snapshotSequence === snapshot?.sequence)?.detail?.controls ?? [];
    const dates = controls.filter(control => control.visible && !control.disabled
      && (control.selected && control.calendarDate || control.kind === "SELECT" && /^(?:date|visit_date)$/.test(control.structure?.name ?? "")))
      .flatMap(control => control.calendarDate ?? control.value ?? []);
    const party = controls.find(control => /(?:people|member|party)/i.test(`${control.structure?.name} ${control.name} ${control.label}`) && control.value && /^\d+$/.test(control.value))?.value;
    if (dates.length !== 1 || !party || !snapshot) { checks.push(result("NOT_EVALUATED", "response and selected snapshot date/party missing", ["diagnostics.browserTrace"])); continue; }
    if (dates[0] !== request.date || Number(party) !== request.partySize) { checks.push(result("NOT_SATISFIED", "snapshot date/party conflicts", [`browserTrace[sequence=${snapshot.sequence}]`])); continue; }
    // Snapshot grammar is deliberately limited; no generic number in the page is a slot.
    const slots = (snapshot.detail?.observedStateTags ?? []).filter(tag => tag.tag === "BUTTON"
      && /\bslot\b/.test(tag.class ?? "") && /\bis-available\b/.test(tag.class ?? "") && !tag.disabled && tag["aria-disabled"] !== "true")
      .flatMap(tag => tag["data-time"] && controls.some(control => control.kind === "BUTTON" && control.visible === true && control.disabled !== true && control.label === tag["data-time"]) ? [tag["data-time"]] : []);
    const supports = expected === "AVAILABLE" && input.times.length > 0 && input.times.every(time => slots.includes(time));
    checks.push(result(supports ? "SATISFIED" : "NOT_EVALUATED", supports ? "selected snapshot supports requested slot" : "snapshot lacks independently scoped slot/empty evidence", [`browserTrace[sequence=${snapshot.sequence}]`]));
  }
  const status = checks.some(check => check.status === "NOT_SATISFIED") ? "NOT_SATISFIED" : checks.some(check => check.status === "NOT_EVALUATED") ? "NOT_EVALUATED" : "SATISFIED";
  return { status, observations: checks.flatMap(check => check.observations), refs: checks.flatMap(check => check.refs) };
}
