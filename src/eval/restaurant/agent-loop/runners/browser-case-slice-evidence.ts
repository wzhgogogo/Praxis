import { createHash } from "node:crypto";

import type { BrowserReadActionTarget } from "../../../../infrastructure/browser/browser-action-decision.js";
import type { BrowserCapturedResponse, BrowserPageControl, BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../../../infrastructure/browser/browser-runtime.js";

export function safeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.username = ""; url.password = ""; url.search = ""; url.hash = "";
    return url.toString();
  } catch { return value.split(/[?#]/, 1)[0] ?? ""; }
}

export function safeString(value: string): string {
  return value.replace(/https?:\/\/[^\s"'<>]+/g, match => safeUrl(match))
    .replace(/\b(?:Bearer\s+\S+|sk-[A-Za-z0-9_-]{8,})/gi, "[REDACTED]")
    .replace(/\b(authorization|api[_-]?key|access[_-]?token|csrf[_-]?token|session[_-]?id)\s*[:=]\s*\S+/gi, "$1=[REDACTED]");
}

export function safeRecord(value: unknown, key = ""): unknown {
  if (/(?:secret|password|cookie|authorization|api[_-]?key|access[_-]?token|csrf|session[_-]?id)/i.test(key)) return "[REDACTED]";
  if ((key === "html" || key === "text") && typeof value === "string") return {
    sha256: createHash("sha256").update(value).digest("hex"), length: value.length,
    ...(key === "html" ? { observedStateTags: observedStateTags(value) } : {}),
  };
  if (typeof value === "string") return /(?:url|uri|href)$/i.test(key) ? safeUrl(value) : safeString(value);
  if (Array.isArray(value)) return value.map(item => safeRecord(item));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, safeRecord(item, name)]));
  return value;
}

function observedStateTags(html: string): Record<string, string>[] {
  const markers = /js-calendar-day-target|js-people-button|js-people-hidden-value|data-selected-date|data-pax|data-time|time-slot|Venue Availability|Venue Pax Select|Venue Time Select/;
  const allowed = new Set(["class", "type", "disabled", "aria-selected", "aria-disabled", "data-selected-date", "data-pax", "data-time", "data-date", "data-year", "data-month", "data-day", "value"]);
  return [...html.matchAll(/<(?:p|button|input|select|section|div)\b[^>]*>/gi)]
    .filter(match => markers.test(match[0]))
    .map(match => {
      const attributes: Record<string, string> = { tag: match[0].match(/^<([a-z]+)/i)?.[1]?.toUpperCase() ?? "" };
      for (const attr of match[0].matchAll(/([\w-]+)(?:=["']([^"']*)["'])?/g)) {
        if (allowed.has(attr[1]!) && (attr[1] !== "value" || /^(?:\d{1,3}|\d{1,2}:\d{2})$/.test(attr[2] ?? ""))) {
          attributes[attr[1]!] = safeString(attr[2] ?? "true");
        }
      }
      return attributes;
    });
}

function attr(tag: string, name: string): string | undefined {
  const exactName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return tag.match(new RegExp(`(?:^|\\s)${exactName}\\s*=(?:"([^"]*)"|'([^']*)')`, "i"))?.slice(1).find(Boolean);
}

function safeCalendarTag(tag: string, sourceUrl?: string): string {
  const name = tag.match(/^<([a-z][\w-]*)\b/i)?.[1]?.toLowerCase();
  if (!name) return "";
  const allowed = ["div", "section", "table", "caption", "em", "thead", "tbody", "tr", "th", "td", "p", "span", "button", "input", "a", "br"];
  if (!allowed.includes(name)) return "";
  const attributes: string[] = [];
  const classes = attr(tag, "class")?.split(/\s+/).filter(value => /^[a-z0-9_-]{1,100}$/i.test(value)).join(" ");
  if (classes) attributes.push(`class="${classes}"`);
  for (const key of ["data-year", "data-month", "data-day", "aria-selected", "aria-disabled", "aria-hidden", "disabled"]) {
    const value = attr(tag, key);
    if (value !== undefined && /^(?:\d{1,4}|true|false|disabled)$/i.test(value)) attributes.push(`${key}="${value}"`);
    else if (key === "disabled" && /\sdisabled(?:\s|>|=)/i.test(tag)) attributes.push("disabled");
  }
  const testId = attr(tag, "data-testid");
  if (testId && /^(?:Venue Availability|Venue Pax Select|Venue Time Select)$/i.test(testId)) attributes.push(`data-testid="${testId}"`);
  // Retain only the observed public category query field, its opaque public
  // value and checked state. This lets evaluation rebuild scope from raw
  // source controls without retaining arbitrary form inputs or profiles.
  if (name === "input" && attr(tag, "name") === "reservation[service_category]" && attr(tag, "type")?.toLowerCase() === "radio") {
    attributes.push('name="reservation[service_category]"', 'type="radio"');
    const value = attr(tag, "value");
    if (value && /^[a-z0-9_-]{1,160}$/i.test(value)) attributes.push(`value="${value}"`);
    if (/\schecked(?:\s|>|=)/i.test(tag)) attributes.push("checked");
  }
  // The normal URL redaction remains in force.  A TableCheck booking anchor
  // is the exception: retain only the three public query fields that bind a
  // visible slot to a date and party, so the evaluator can audit the captured
  // result without retaining an arbitrary link or any account/session data.
  if (name === "a") {
    const href = attr(tag, "href")?.replace(/&amp;/gi, "&");
    try {
      const url = new URL(href ?? "", sourceUrl);
      if (/(^|\.)tablecheck\.com$/i.test(url.hostname)) {
        const source = url.pathname;
        const date = url.searchParams.get("start_date") ?? url.searchParams.get("date");
        const party = url.searchParams.get("num_people") ?? url.searchParams.get("pax");
        const time = url.searchParams.get("start_time") ?? url.searchParams.get("time");
        const serviceCategory = url.searchParams.get("service_category");
        if (/^\/(?:en|ja)\/(?:shops\/)?[a-z0-9][a-z0-9-]{0,199}(?:\/reserve(?:\/landing)?)?$/i.test(source)) attributes.push(`data-reservation-source="${source}"`);
        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) attributes.push(`data-reservation-date="${date}"`);
        if (party && /^\d{1,3}$/.test(party)) attributes.push(`data-reservation-party="${party}"`);
        if (time && /^\d{2}:\d{2}$/.test(time)) attributes.push(`data-reservation-time="${time}"`);
        if (serviceCategory && /^[a-z0-9_-]{1,160}$/i.test(serviceCategory)) attributes.push(`data-reservation-service-category="${serviceCategory}"`);
      }
    } catch { /* Keep malformed links redacted. */ }
  }
  let sourceIsTableCheck = false;
  try { sourceIsTableCheck = Boolean(sourceUrl && /(^|\.)tablecheck\.com$/i.test(new URL(sourceUrl).hostname)); } catch { /* Invalid source URL cannot grant raw evidence. */ }
  if (sourceIsTableCheck && name === "section" && attr(tag, "data-availability-state") === "empty") {
    const date = attr(tag, "data-date") ?? attr(tag, "data-selected-date");
    const party = attr(tag, "data-pax");
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) attributes.push(`data-reservation-empty-date="${date}"`);
    if (party && /^\d{1,3}$/.test(party)) attributes.push(`data-reservation-empty-party="${party}"`);
  }
  if (markupHidden(tag)) attributes.push('data-markup-hidden="true"');
  if (name === "input" && classes && /(?:^| )(?:js-people-hidden-value|js-time-hidden-value)(?: |$)/.test(classes)) {
    const value = attr(tag, "value");
    if (value !== undefined && /^(?:\d{1,3}|\d{1,2}:\d{2})$/.test(value)) attributes.push(`value="${value}"`);
  }
  return `<${name}${attributes.length ? ` ${attributes.join(" ")}` : ""}>`;
}

function markupHidden(tag: string): boolean {
  return /\shidden(?:\s|>|=)/i.test(tag) || attr(tag, "aria-hidden") === "true"
    || (attr(tag, "class") ?? "").split(/\s+/).includes("is-hidden")
    || /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)\s*(?:;|$)/i.test(attr(tag, "style") ?? "");
}

/** Retain only source booking widget structure; no links, scripts, form fields or page profiles. */
export function bookingQueryRegions(html: string, sourceUrl?: string): Array<{ markup: string; truncated: boolean; ancestorMarkupHidden: boolean; computedVisibility: "UNKNOWN" }> {
  const regions: Array<{ markup: string; truncated: boolean; ancestorMarkupHidden: boolean; computedVisibility: "UNKNOWN" }> = [];
  const tokens = html.match(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<\/?[a-z][^>]*>|[^<]+/gi) ?? [];
  const stack: string[] = [];
  const hiddenStack: boolean[] = [];
  let depth = -1;
  let ancestorMarkupHidden = false;
  let markup = "";
  let truncated = false;
  const append = (part: string) => {
    if (markup.length + part.length > 200_000) { truncated = true; return; }
    markup += part;
  };
  for (const token of tokens) {
    if (/^<!--|^<script\b|^<style\b/i.test(token)) continue;
    const closing = token.match(/^<\/([a-z][\w-]*)\s*>/i);
    if (closing) {
      const name = closing[1]!.toLowerCase();
      if (depth >= 0) append(`</${name}>`);
      const index = stack.lastIndexOf(name);
      if (index >= 0) { stack.length = index; hiddenStack.length = index; }
      if (depth >= 0 && stack.length < depth) {
        regions.push({ markup, truncated, ancestorMarkupHidden, computedVisibility: "UNKNOWN" });
        depth = -1; markup = ""; truncated = false; ancestorMarkupHidden = false;
      }
      continue;
    }
    const opening = token.match(/^<([a-z][\w-]*)\b/i);
    if (opening) {
      const name = opening[1]!.toLowerCase();
      const classes = attr(token, "class")?.split(/\s+/) ?? [];
      const testId = attr(token, "data-testid");
      const isTabelogCalendar = name === "div" && classes.includes("p-booking-calendar");
      const isTableCheckAvailability = /^(?:Venue Availability|Venue Pax Select|Venue Time Select)$/i.test(testId ?? "");
      if (depth < 0 && (isTabelogCalendar || isTableCheckAvailability)) {
        depth = stack.length + 1;
        ancestorMarkupHidden = hiddenStack.includes(true);
      }
      if (depth >= 0) append(safeCalendarTag(token, sourceUrl));
      if (!new Set(["input", "br", "hr", "img", "meta", "link"]).has(name) && !token.endsWith("/>")) {
        stack.push(name); hiddenStack.push(markupHidden(token));
      }
      continue;
    }
    if (depth >= 0) append(safeString(token).replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED]").replace(/\+?\d[\d()\s-]{8,}\d/g, "[REDACTED]") );
  }
  if (depth >= 0) regions.push({ markup, truncated: true, ancestorMarkupHidden, computedVisibility: "UNKNOWN" });
  return regions;
}

/** Preserve every observed control; remove text belonging to source review/profile links. */
function safeControlFields(control: { href?: string; label: string }, value: unknown): Record<string, unknown> {
    const safe = safeRecord(value) as Record<string, unknown>;
    try {
      if (control.href && /\/(?:dtlrvwlst|review|profile|member)(?:\/|$)/i.test(new URL(control.href, "https://tabelog.com").pathname)) {
        safe.label = "[REDACTED_PROFILE_LABEL]";
        if ("stableKey" in safe) safe.stableKey = "[REDACTED_PROFILE_KEY]";
        safe.href = "[REDACTED_PROFILE_HREF]";
      }
    } catch { safe.href = "[INVALID_URL]"; }
    if (typeof safe.label === "string") safe.label = safe.label
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
      .replace(/\+?\d[\d()\s-]{8,}\d/g, "[REDACTED_PHONE]");
    try {
      const url = control.href ? new URL(control.href) : undefined;
      if (url && /(^|\.)tablecheck\.com$/i.test(url.hostname)) {
        const date = url.searchParams.get("start_date") ?? url.searchParams.get("date");
        const party = url.searchParams.get("num_people") ?? url.searchParams.get("pax");
        const time = url.searchParams.get("start_time") ?? url.searchParams.get("time");
        const serviceCategory = url.searchParams.get("service_category");
        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && party && /^\d{1,3}$/.test(party) && time && /^\d{2}:\d{2}$/.test(time)) {
          safe.reservationBinding = { source: url.pathname, date, party, time,
            ...(serviceCategory && /^[a-z0-9_-]{1,160}$/i.test(serviceCategory) ? { serviceCategory } : {}) };
        }
      }
    } catch { /* redacted URL remains sufficient when a binding cannot be reconstructed */ }
    return safe;
}

export function safeObservedControls(controls: readonly BrowserPageControl[]): unknown[] {
  return controls.map(control => safeControlFields(control, control));
}

export function safeActionTargets(targets: readonly BrowserReadActionTarget[]): unknown[] {
  return targets.map(target => safeControlFields(target, target));
}

export function errorRecord(error: unknown): Record<string, unknown> {
  const seen = new Set<unknown>();
  const visit = (value: unknown, depth: number): Record<string, unknown> | undefined => {
    if (!value || typeof value !== "object" || seen.has(value) || depth > 3) return undefined;
    seen.add(value);
    const item = value as { name?: unknown; message?: unknown; code?: unknown; cause?: unknown };
    const cause = visit(item.cause, depth + 1);
    return { ...(typeof item.name === "string" ? { name: item.name } : {}),
      ...(typeof item.message === "string" ? { message: safeString(item.message) } : {}),
      ...(typeof item.code === "string" ? { code: item.code } : {}),
      ...(cause ? { cause } : {}) };
  };
  return visit(error, 0) ?? { name: "UnknownError" };
}

const observedSessionMethods = new Set(["navigate", "click", "openLink", "fill", "select", "setChecked", "press", "scroll", "waitFor", "waitForChange", "captureResponses"]);

/** Exact BrowserSession trace wrapper used by the Live case-slice runner. */
export function traceBrowserSession(session: BrowserSession, source: "TABELOG" | "TABLECHECK", record: (kind: string, detail: unknown) => number): BrowserSession {
  let lastSnapshotUrl: string | undefined;
  let lastSnapshotSequence: number | undefined;
  record("SESSION_OPENED", session.metadata);
  return new Proxy(session, { get(target, property) {
    if (property === "snapshot") return async () => {
      try {
        const snapshot = await target.snapshot();
        lastSnapshotUrl = snapshot.url;
        lastSnapshotSequence = record("SNAPSHOT", snapshotRecord(snapshot));
        return snapshot;
      } catch (error) { record("SNAPSHOT_ERROR", errorRecord(error)); throw error; }
    };
    if (property === "observeControls" && target.observeControls) return async (hints?: Parameters<NonNullable<typeof target.observeControls>>[0]) => {
      try {
        const controls = await target.observeControls!(hints);
        record("CONTROLS", { snapshotSequence: lastSnapshotSequence, url: lastSnapshotUrl ? safeUrl(lastSnapshotUrl) : "UNKNOWN",
          totalObserved: controls.length, scope: "ALL_OBSERVED_REDACTED", controls: safeObservedControls(controls) });
        return controls;
      } catch (error) { record("CONTROLS_ERROR", errorRecord(error)); throw error; }
    };
    const value = Reflect.get(target, property, target);
    if (typeof property === "string" && observedSessionMethods.has(property) && typeof value === "function") return async (...args: unknown[]) => {
      record("SESSION_CALL", { method: property, args });
      try {
        const result: unknown = await value.apply(target, args);
        record("SESSION_RETURN", { method: property, result });
        return result;
      } catch (error) { record("SESSION_ERROR", { method: property, error: errorRecord(error) }); throw error; }
    };
    return typeof value === "function" ? value.bind(target) : value;
  } });
}

/** Preserve the runtime-owned Guard capability while tracing its safe sessions. */
export function traceBrowserRuntime(
  runtime: BrowserRuntime,
  source: "TABELOG" | "TABLECHECK",
  record: (kind: string, detail: unknown) => number,
): BrowserRuntime {
  return {
    ...(runtime.readNetworkBoundaryCapability ? { readNetworkBoundaryCapability: runtime.readNetworkBoundaryCapability } : {}),
    openSession: async input => {
      try { return traceBrowserSession(await runtime.openSession(input), source, record); }
      catch (error) { record("SESSION_OPEN_ERROR", errorRecord(error)); throw error; }
    },
  };
}

function passiveResponses(snapshot: BrowserSnapshot): unknown {
  if (!snapshot.url.startsWith("https://tabelog.com/")) return safeRecord(snapshot.responses ?? []);
  return (snapshot.responses ?? []).map((response: BrowserCapturedResponse) => {
    const body = response.body && typeof response.body === "object" && !Array.isArray(response.body)
      ? response.body as Record<string, unknown> : {};
    const date = body.base_date && typeof body.base_date === "object" && !Array.isArray(body.base_date)
      ? body.base_date as Record<string, unknown> : {};
    const selected = body.selection && typeof body.selection === "object" && !Array.isArray(body.selection)
      ? Object.values(body.selection as Record<string, unknown>).map(item => {
        const row = item && typeof item === "object" && !Array.isArray(item) ? item as Record<string, unknown> : {};
        let link: Record<string, unknown> | undefined;
        try {
          if (typeof row.url === "string") {
            const url = new URL(row.url, snapshot.url);
            link = { origin: url.origin, pathname: url.pathname,
              rcd: /^\d+$/.test(url.searchParams.get("rcd") ?? "") ? url.searchParams.get("rcd") : null,
              member: /^\d{1,3}$/.test(url.searchParams.get("member") ?? "") ? url.searchParams.get("member") : null,
              visit_date: /^\d{8}$/.test(url.searchParams.get("visit_date") ?? "") ? url.searchParams.get("visit_date") : null,
              visit_time: /^\d{4}$/.test(url.searchParams.get("visit_time") ?? "") ? url.searchParams.get("visit_time") : null };
          }
        } catch { link = { parseable: false }; }
        return { ...(typeof row.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(row.time) ? { time: row.time } : {}), ...(link ? { link } : {}) };
      }) : undefined;
    return { url: safeUrl(response.url), status: response.status, observedAt: response.observedAt, sequence: response.sequence,
      body: { ...(Object.keys(date).length ? { base_date: Object.fromEntries(["year", "month", "day"].filter(key => Number.isInteger(date[key])).map(key => [key, date[key]])) } : {}),
        ...(Number.isInteger(body.members) ? { members: body.members } : {}), ...(selected ? { selection: selected } : {}) } };
  });
}

export function snapshotRecord(snapshot: BrowserSnapshot): Record<string, unknown> {
  const queryRegions = bookingQueryRegions(snapshot.html, snapshot.url);
  return { url: safeUrl(snapshot.url), title: safeString(snapshot.title),
    textSha256: createHash("sha256").update(snapshot.text).digest("hex"), textLength: snapshot.text.length,
    pageId: snapshot.pageId, htmlSha256: createHash("sha256").update(snapshot.html).digest("hex"),
    htmlLength: snapshot.html.length, observedStateTags: observedStateTags(snapshot.html),
    queryRegions,
    responses: passiveResponses(snapshot),
    ...(snapshot.networkDiagnostics?.length ? { networkDiagnostics: snapshot.networkDiagnostics.map(item => ({
      code: item.code, origin: item.origin, pathname: item.pathname,
      method: item.method, resourceType: item.resourceType, queryKeys: item.queryKeys,
    })) } : {}) };
}
