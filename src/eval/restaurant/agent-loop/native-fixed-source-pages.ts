import type { BrowserPageControl, BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../../infrastructure/browser/browser-runtime.js";
import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../../infrastructure/browser/local-playwright-chromium.js";

export const reference = new Date("2026-08-19T07:20:00.000Z");
export const center = { latitude: 35.6619707, longitude: 139.703795 };
export const date = "2026-08-19";

export type SourceScenario = "TABELOG_DELIVERS" | "TABLECHECK_RECOVERS" | "BOTH_BOUNDED_EMPTY" | "OUTSIDE_RADIUS" | "TABELOG_ONE_DETAIL_FAILS" | "EARLY_END_ATTEMPT"
  | "TABELOG_CONTINUES" | "TABLECHECK_CONTINUES" | "NATIVE_PARTIAL" | "NATIVE_TRUE_NO_RESULT" | "TABLECHECK_UNPARSED" | "TABLECHECK_EARLY_ACTIONS" | "TABELOG_BATCH_CAP" | "DYNAMIC_TABELOG_DELIVERS" | "TABLECHECK_DISCOVERY_RECOVERS" | "TABELOG_REGION_PRESERVES_QUERY" | "TABELOG_PENDING_RESTORED"
  | "TABELOG_NONEMPTY_REGION_RECOVERS" | "TABELOG_CURRENT_BATCH_DELIVERS" | "TABLECHECK_CURRENT_BATCH_DELIVERS" | "TABELOG_REOPEN_RETAINS" | "TABLECHECK_QUERY_READY" | "TABELOG_STALE_REJECTS" | "TABLECHECK_STALE_REJECTS" | "NATIVE_FACT_FOLLOWUP_DELIVERS" | "TABLECHECK_SCOPED_MENU_DELIVERS"
  | "TABELOG_RETRIEVAL_CATEGORY_DELIVERS" | "TABELOG_RESULT_PAGES_CONTINUE";

function page(url: string, html: string, text: string, title = "Restaurant"): BrowserSnapshot { return { url, html, text, title }; }

class NativeFixtureSession implements BrowserSession {
  readonly metadata: BrowserSession["metadata"];
  private current?: BrowserSnapshot;
  private navigationUnusable = false;
  constructor(private readonly lookup: (url: string) => BrowserSnapshot, private readonly navigations: string[],
    private readonly sessionId: number, private readonly navigationSessionIds?: number[], private readonly closedSessionIds?: number[],
    private readonly onReadOnlyClick?: (url: string) => void, private readonly onReadOnlyFill?: (value: string) => void,
    private readonly onReadOnlySetChecked?: (url: string, value: string, checked: boolean) => void,
    private readonly onReadOnlyWaitForChange?: (url: string) => boolean,
    guardedReadBoundary = false) {
    this.metadata = {
      runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: reference.toISOString(),
      ...(guardedReadBoundary ? { readNetworkBoundary: "INSTALLED" } : {}),
    };
  }
  async navigate(url: string): Promise<void> {
    if (this.navigationUnusable) throw Object.assign(new Error("Prior navigation is still unresolved"), { code: "BROWSER_TIMEOUT" });
    this.navigations.push(url);
    this.navigationSessionIds?.push(this.sessionId);
    try { this.current = this.lookup(url); } catch (error) { this.navigationUnusable = true; throw error; }
  }
  async snapshot(): Promise<BrowserSnapshot> { if (!this.current) throw new Error("No source page navigated"); return this.current; }
  async observeControls(): Promise<BrowserPageControl[]> {
    if (!this.current) return [];
    const controls: BrowserPageControl[] = [];
    for (const match of this.current.html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
      const attrs = match[1] ?? "";
      const href = attrs.match(/\bhref=["']([^"']+)/i)?.[1];
      if (!href) continue;
      const label = (match[2] ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      controls.push({ id: `native:${this.sessionId}:link:${controls.length}`, stableKey: `link|${href}|${controls.length}`,
        kind: "LINK", role: "link", label, href: new URL(href.replaceAll("&amp;", "&"), this.current.url).toString(), disabled: /\bdisabled\b|aria-disabled=["']true/i.test(attrs), visible: true });
    }
    for (const match of this.current.html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
      const attrs = match[1] ?? "";
      const label = (match[2] ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const type = attrs.match(/\btype=["']([^"']+)/i)?.[1];
      controls.push({
        id: `native:${this.sessionId}:button:${controls.length}`,
        stableKey: `button|${label}|${controls.length}`,
        kind: "BUTTON", role: "button", label,
        ...(type ? { type } : {}),
        disabled: /\bdisabled\b|aria-disabled=["']true/i.test(attrs), visible: true,
      });
    }
    for (const match of this.current.html.matchAll(/<input\b([^>]*)>/gi)) {
      const attrs = match[1] ?? "";
      const label = attrs.match(/(?:aria-label|placeholder|name)=["']([^"']+)/i)?.[1] ?? "";
      const type = attrs.match(/\btype=["']([^"']+)/i)?.[1];
      const value = attrs.match(/\bdata-live-value=["']([^"']*)/i)?.[1] ?? attrs.match(/\bvalue=["']([^"']*)/i)?.[1];
      if (type?.toLowerCase() === "radio") {
        const id = attrs.match(/\bid=["']([^"']+)/i)?.[1];
        const radioLabel = id ? this.current.html.match(new RegExp(`<label\\b[^>]*\\bfor=["']${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>([\\s\\S]*?)<\\/label>`, "i"))?.[1]?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : undefined;
        const form = [...this.current.html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)].find((item) => item[0].includes(match[0]));
        const formAttrs = form?.[1] ?? "";
        const formId = formAttrs.match(/\bid=["']([^"']+)/i)?.[1] ?? "0";
        const name = attrs.match(/\bname=["']([^"']+)/i)?.[1] ?? "";
        controls.push({ id: `native:${this.sessionId}:radio:${controls.length}`, stableKey: `radio|form:${formId}|name:${name}|${value ?? ""}|${controls.length}`,
          kind: "RADIO", role: "radio", label: radioLabel ?? label, ...(value !== undefined ? { value } : {}), type: "radio",
          checked: /\bchecked\b/i.test(attrs), disabled: /\bdisabled\b|aria-disabled=["']true/i.test(attrs), visible: true,
          structure: { tag: "INPUT", name, classes: (attrs.match(/\bclass=["']([^"']+)/i)?.[1] ?? "").split(/\s+/).filter(Boolean), dialogLabel: "", formClass: formAttrs.match(/\bclass=["']([^"']+)/i)?.[1] ?? "", sliderCount: 0, radioGroupKey: `form:${formId}|name:${name}` } });
        continue;
      }
      controls.push({ id: `native:${this.sessionId}:input:${controls.length}`, stableKey: `input|${label}|${controls.length}`,
        kind: "INPUT", role: "textbox", label, ...(type ? { type } : {}),
        ...(value !== undefined ? { value } : {}),
        disabled: /\bdisabled\b|aria-disabled=["']true/i.test(attrs), visible: true,
        structure: { tag: "INPUT", name: attrs.match(/\bname=["']([^"']+)/i)?.[1] ?? "", classes: [], dialogLabel: "", formClass: "", sliderCount: 0 } });
    }
    for (const match of this.current.html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)) {
      const attrs = match[1] ?? ""; const optionMarkup = match[2] ?? "";
      const name = attrs.match(/\bname=["']([^"']+)/i)?.[1] ?? "";
      const selected = [...optionMarkup.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)].map((option) => ({
        value: option[1]?.match(/\bvalue=["']([^"']*)/i)?.[1] ?? "",
        label: (option[2] ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
        selected: /\bselected\b/i.test(option[1] ?? ""), disabled: /\bdisabled\b/i.test(option[1] ?? ""),
      }));
      const value = selected.find((option) => option.selected)?.value;
      controls.push({ id: `native:${this.sessionId}:select:${controls.length}`, stableKey: `select|${name}|${controls.length}`,
        kind: "SELECT", role: "combobox", label: name, ...(value !== undefined ? { value } : {}),
        disabled: /\bdisabled\b|aria-disabled=["']true/i.test(attrs), visible: true, options: selected,
        structure: { tag: "SELECT", name, classes: [], dialogLabel: "", formClass: "", sliderCount: 0 } });
    }
    if (/data-testid=["']Venue Availability/i.test(this.current.html)) {
      controls.push({ id: `native:${this.sessionId}:availability-region`, stableKey: "region|venue-availability", kind: "REGION", role: "region", label: "Venue Availability", disabled: false, visible: true });
    }
    return controls;
  }
  async openLink(_target: string, observedHref?: string): Promise<void> {
    if (!observedHref) throw new Error("Observed link URL is required");
    await this.navigate(observedHref);
  }
  async click(): Promise<void> {
    if (!this.onReadOnlyClick || !this.current) throw new Error("No model-controlled click is expected in fixed source pages");
    this.onReadOnlyClick(this.current.url);
    this.current = this.lookup(this.current.url);
  }
  async fill(_target: string, value: string): Promise<void> {
    if (!this.onReadOnlyFill || !this.current) throw new Error("No model-controlled fill is expected in fixed source pages");
    this.onReadOnlyFill(value);
    this.current = this.lookup(this.current.url);
  }
  async setChecked(target: string, checked: boolean): Promise<void> {
    if (!this.current || !this.onReadOnlySetChecked) throw new Error("No source-owned checked query control is configured");
    const control = (await this.observeControls()).find((item) => item.id === target);
    if (control?.kind !== "RADIO" || !control.value) throw new Error("Observed checked query control is unavailable");
    this.onReadOnlySetChecked(this.current.url, control.value, checked);
    this.current = this.lookup(this.current.url);
  }
  async waitForChange(_previous: Pick<BrowserSnapshot, "url" | "title" | "text" | "interactiveState">): Promise<boolean> {
    if (!this.current || !this.onReadOnlyWaitForChange) return false;
    const changed = this.onReadOnlyWaitForChange(this.current.url);
    if (changed) this.current = this.lookup(this.current.url);
    return changed;
  }
  async select(_target: string, value: string): Promise<string[]> { return [value]; }
  async waitFor(): Promise<void> {}
  async screenshot(): Promise<Uint8Array> { return new Uint8Array(); }
  async close(): Promise<void> { this.closedSessionIds?.push(this.sessionId); }
}

export function sourcePages(
  scenario: SourceScenario,
  navigations: string[],
  sessionsOpened?: number[],
  navigationSessionIds?: number[],
  closedSessionIds?: number[],
  options: { guardedReadBoundary?: boolean; guardedQuerySubmit?: boolean } = {},
) {
  let tableCheckDiscoveryRevealed = false;
  let tableCheckDiscoveryInputValue = "stale query";
  let tableCheckDiscoveryExpectedQuery = "";
  const tableCheckAvailabilityRevealed = new Set<string>();
  let tableCheckScopedCategory = "";
  let tableCheckScopedResultReady = false;
  let tabelogListingVisits = 0;
  let tabelogSecondPageRevealed = false;
  const tabelogCount = scenario === "TABELOG_DELIVERS" || scenario === "TABELOG_ONE_DETAIL_FAILS" || scenario === "TABELOG_CONTINUES" ? 3
    : scenario === "TABELOG_BATCH_CAP" || scenario === "TABELOG_PENDING_RESTORED" || scenario === "TABELOG_CURRENT_BATCH_DELIVERS" || scenario === "TABELOG_REOPEN_RETAINS" ? 6
    : scenario === "TABELOG_NONEMPTY_REGION_RECOVERS" || scenario === "TABELOG_REGION_PRESERVES_QUERY" ? 1
    : scenario === "NATIVE_PARTIAL" || scenario === "TABLECHECK_CONTINUES" || scenario === "NATIVE_TRUE_NO_RESULT" || scenario === "TABLECHECK_EARLY_ACTIONS" ? 2
    : scenario === "TABLECHECK_RECOVERS" || scenario === "OUTSIDE_RADIUS" || scenario === "NATIVE_FACT_FOLLOWUP_DELIVERS" ? 1 : 0;
  const tablecheckCount = scenario === "TABLECHECK_RECOVERS" ? 3
    : scenario === "TABLECHECK_CURRENT_BATCH_DELIVERS" ? 6
    : scenario === "TABLECHECK_CONTINUES" || scenario === "TABLECHECK_EARLY_ACTIONS" ? 2 : scenario === "NATIVE_TRUE_NO_RESULT" ? 1
    : scenario === "OUTSIDE_RADIUS" || scenario === "TABLECHECK_DISCOVERY_RECOVERS" || scenario === "TABLECHECK_QUERY_READY" || scenario === "TABLECHECK_SCOPED_MENU_DELIVERS" ? 1 : 0;
  const sourcePoint = scenario === "OUTSIDE_RADIUS" ? { latitude: 35.75, longitude: 139.80 } : center;
  const lookup = (url: string): BrowserSnapshot => {
    const parsed = new URL(url);
    if (parsed.hostname === "tabelog.com" && parsed.pathname.includes("/rstLst/")) {
      tabelogListingVisits += 1;
      if (scenario === "TABELOG_RETRIEVAL_CATEGORY_DELIVERS") {
        const category = parsed.pathname.includes("/sushi/");
        const keyword = parsed.searchParams.has("sw");
        const ids = category && !keyword ? [100, 101, 102] : [100];
        return page(url, [
          ...ids.map((id) => `<a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/${id}/">Native Tabelog ${id}</a>`),
          category ? '<a href="/en/tokyo/rstLst/sushi/">omakase ×</a>' : '<a href="/en/tokyo/rstLst/sushi/?sw=omakase">Sushi</a>',
        ].join(""), `${category ? "Sushi" : "Restaurants"} in Tokyo\n1～${ids.length}／${ids.length}`, "Tabelog search");
      }
      if (scenario === "TABELOG_RESULT_PAGES_CONTINUE") {
        const category = parsed.pathname.includes("/sushi/");
        const keyword = parsed.searchParams.has("sw");
        const second = parsed.pathname.endsWith("/2/");
        const third = parsed.pathname.endsWith("/3/");
        if (second && !tabelogSecondPageRevealed) return page(url,
          '<button type="button">Show public venues</button>', "Reveal the current public venue results", "Tabelog search");
        const ids = !category || keyword ? [100] : third ? [106] : second ? [104, 105] : [100, 101, 102, 103, 104];
        const route = !category ? '<a href="/en/tokyo/rstLst/sushi/?sw=omakase">Sushi</a>'
          : keyword ? '<a href="/en/tokyo/rstLst/sushi/">omakase ×</a>'
          : third ? '<input type="search" name="keyword" aria-label="Search restaurants" value="">'
          : second ? '<a rel="next" href="/en/tokyo/rstLst/sushi/3/">Next 20</a>'
          : '<a rel="next" href="/en/tokyo/rstLst/sushi/2/">Next 20</a>';
        return page(url, ids.map((id) => `<a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/${id}/">Native Tabelog ${id}</a>`).join("") + route,
          `Sushi in Tokyo\n${third ? "7～7" : second ? "6～6" : "1～5"}／7`, "Tabelog search");
      }
      if (scenario === "TABELOG_STALE_REJECTS") return page(url,
        '<input type="search" name="search_text" aria-label="Search restaurants" value="omakase" data-live-value="old-query"><div aria-busy="true">Loading current search</div><a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/100/">Old Tabelog result</a>',
        "Loading current search", "Tabelog search");
      if (scenario === "TABELOG_REGION_PRESERVES_QUERY" && tabelogListingVisits === 1) {
        return page(url, '<a href="/en/tokyo/A1303/A130301/rstLst/">Shibuya</a>', "Choose Shibuya", "Tabelog search");
      }
      if (scenario === "TABELOG_NONEMPTY_REGION_RECOVERS" && tabelogListingVisits === 1) {
        return page(url, '<a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/199/">Outside current area</a><a href="/en/tokyo/A1303/A130301/rstLst/">Shibuya</a>', "Restaurants in Tokyo. Choose Shibuya to refine this search.", "Tabelog search");
      }
      const count = scenario === "TABELOG_PENDING_RESTORED" && tabelogListingVisits > 1 ? 0 : tabelogCount;
      const links = Array.from({ length: count }, (_, index) => {
        const id = 100 + index;
        return `<a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/${id}/" data-address="Shibuya ${id}, Tokyo">Native Tabelog ${id}</a>`;
      }).join("");
      return page(url, links, count ? "Restaurants" : "No restaurants found", "Tabelog search");
    }
    const tabelogId = parsed.pathname.match(/^\/tokyo\/A1304\/A130401\/(\d+)\/$/)?.[1];
    if (tabelogId) {
      if ((scenario === "TABELOG_ONE_DETAIL_FAILS" && tabelogId === "101") || (scenario === "TABELOG_REOPEN_RETAINS" && tabelogId === "100")) throw Object.assign(new Error("One detail navigation failed"), { code: "BROWSER_TIMEOUT" });
      const name = `Native Tabelog ${tabelogId}`;
      const address = `Shibuya ${tabelogId}, Tokyo`;
      const available = scenario === "TABELOG_DELIVERS" || scenario === "TABELOG_ONE_DETAIL_FAILS" || scenario === "TABELOG_REOPEN_RETAINS"
        || (scenario === "TABELOG_RETRIEVAL_CATEGORY_DELIVERS" && tabelogId === "101")
        || (scenario === "TABELOG_RESULT_PAGES_CONTINUE" && tabelogId === "106")
        || (scenario === "TABELOG_CURRENT_BATCH_DELIVERS" && tabelogId === "100")
        || (scenario === "TABELOG_NONEMPTY_REGION_RECOVERS" && tabelogId === "100")
        || (scenario === "TABELOG_CONTINUES" && tabelogId === "102")
        || (scenario === "NATIVE_PARTIAL" && tabelogId === "101");
      const unknown = (scenario === "TABELOG_CONTINUES" && tabelogId === "101")
        || (scenario === "TABLECHECK_CONTINUES" && tabelogId === "101");
      if (scenario === "NATIVE_FACT_FOLLOWUP_DELIVERS" && tabelogId === "100") {
        // The source document is consistently insufficient for HARD facts but
        // always exposes both its observed menu continuation and current
        // read-only availability controls.  Phase behavior must come from the
        // production facts→availability flow, never an nth navigation.
        return page(url, [
          `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name, address, geo: sourcePoint })}</script>`,
          `<h1>${name}</h1><p class="rstinfo-table__address">${address}</p><a href="/tokyo/A1304/A130401/100/menu/">Menu and courses</a>`,
          `<select name="party"><option value="2" selected>2</option></select><select name="date"><option value="${date}" selected>${date}</option></select>`,
          '<button class="slot is-available" data-time="19:00">19:00</button>',
        ].join(""), `${name}\n${address}\nDinner information\n予約\n19:00`);
      }
      return page(url, [
        `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name, address, geo: scenario === "TABELOG_NONEMPTY_REGION_RECOVERS" && tabelogId === "199" ? { latitude: 35.75, longitude: 139.80 } : sourcePoint })}</script>`,
        `<h1>${name}</h1><p class="rstinfo-table__address">${address}</p>`,
        unknown ? "" : `<select name="party"><option value="2" selected>2</option></select><select name="date"><option value="${date}" selected>${date}</option></select>`,
        available ? '<button class="slot is-available" data-time="19:00">19:00</button>' : unknown ? "" : '<button class="slot is-unavailable" data-time="19:00">19:00</button>',
      ].join(""), `${name}\n${address}\n${unknown ? "" : "予約\n"}${["TABELOG_RETRIEVAL_CATEGORY_DELIVERS", "TABELOG_RESULT_PAGES_CONTINUE", "TABELOG_DELIVERS", "TABELOG_ONE_DETAIL_FAILS", "TABELOG_REOPEN_RETAINS", "TABELOG_CONTINUES", "TABLECHECK_CONTINUES", "TABLECHECK_EARLY_ACTIONS", "NATIVE_PARTIAL", "NATIVE_TRUE_NO_RESULT", "TABELOG_CURRENT_BATCH_DELIVERS", "TABELOG_NONEMPTY_REGION_RECOVERS"].includes(scenario) ? "Omakase course\n" : "Dinner course\n"}2 guests\n${date}\n19:00`);
    }
    if (scenario === "NATIVE_FACT_FOLLOWUP_DELIVERS" && parsed.pathname === "/tokyo/A1304/A130401/100/menu/") {
      return page(url, `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: "Native Tabelog 100", address: "Shibuya 100, Tokyo" })}</script><link rel="canonical" href="/tokyo/A1304/A130401/100/"><h1>Native Tabelog 100</h1><p class="rstinfo-table__address">Shibuya 100, Tokyo</p><main>Omakase course</main>`, "Native Tabelog 100\nShibuya 100, Tokyo\nOmakase course");
    }
    if (parsed.hostname === "www.tablecheck.com" && parsed.pathname === "/en/japan/search") {
      if (scenario === "TABLECHECK_UNPARSED") return page(url, '<a href="/en/search">Search</a>', "Search results loading", "TableCheck search");
      if (scenario === "TABLECHECK_DISCOVERY_RECOVERS") {
        const queryFromSourceUrl = parsed.searchParams.get("search_text")?.trim() ?? "";
        if (queryFromSourceUrl) tableCheckDiscoveryExpectedQuery = queryFromSourceUrl;
        const currentValue = tableCheckDiscoveryExpectedQuery;
        const liveValue = tableCheckDiscoveryInputValue;
        if (tableCheckDiscoveryRevealed) return page(url,
          `<input type="search" name="search_text" aria-label="Search venues" value="${currentValue}" data-live-value="${liveValue}"><a href="/en/native-omakase-1">Native TableCheck 1</a>`,
          "1 venue found", "TableCheck search");
        return page(url,
          `<input type="search" name="search_text" aria-label="Search venues" value="${currentValue}" data-live-value="${liveValue}"><a href="/en/stale-result">Stale venue</a>${liveValue === currentValue ? '<div aria-busy="true">Loading current search</div>' : ''}${options.guardedQuerySubmit ? '<form><button type="submit">Show public venues</button></form>' : '<button type="button">Show public venues</button>'}`,
          liveValue === currentValue ? "Loading current search" : "Search filters ready", "TableCheck search");
      }
      if (scenario === "TABLECHECK_QUERY_READY") return page(url,
        '<input type="search" name="search_text" aria-label="Search venues" value="omakase"><script>const loading = false;</script><div class="is-hidden" aria-busy="true">Loading old results</div><a href="/en/native-omakase-1">Native TableCheck 1</a>',
        "1 venue found", "TableCheck search");
      if (scenario === "TABLECHECK_STALE_REJECTS") return page(url,
        '<input type="search" name="search_text" aria-label="Search venues" value="omakase" data-live-value="old-query"><div aria-busy="true">Loading current search</div><a href="/en/native-omakase-1">Old venue</a><p>No venues found</p>',
        "Loading current search\nNo venues found", "TableCheck search");
      const links = Array.from({ length: tablecheckCount }, (_, index) => `<a href="/en/native-omakase-${index + 1}">Native TableCheck ${index + 1}</a>`).join("");
      return page(url, links, tablecheckCount ? `${tablecheckCount} venues found` : "No venues found", "TableCheck search");
    }
    if (scenario === "TABLECHECK_SCOPED_MENU_DELIVERS" && parsed.pathname === "/en/native-omakase-1") {
      const name = "Native TableCheck 1";
      const address = "Shibuya 1, Tokyo";
      return page(url, [
        `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name, address, geo: sourcePoint, acceptsReservations: "https://www.tablecheck.com/en/shops/native-omakase-1/reserve" })}</script>`,
        `<link rel="canonical" href="/en/native-omakase-1"><h1>${name}</h1><p class="address">${address}</p>`,
        '<main>Introduction only. See the public reservation menu for service-specific courses.</main><a href="/en/shops/native-omakase-1/reserve">Reserve</a>',
      ].join(""), `${name}\n${address}\nIntroduction only`);
    }
    if (scenario === "TABLECHECK_SCOPED_MENU_DELIVERS" && parsed.pathname === "/en/shops/native-omakase-1/reserve") {
      const selected = tableCheckScopedCategory === "sushi";
      const result = selected && tableCheckScopedResultReady
        // Synthetic-only result contract: the real source probe observed the
        // request fields and an unclassified response, never this positive slot.
        ? `<div data-testid="Venue Availability"><a href="https://www.tablecheck.com/en/shops/native-omakase-1/reserve?start_date=${date}&amp;num_people=2&amp;start_time=19:00&amp;service_category=sushi">19:00</a></div>`
        : selected ? '<div data-testid="Venue Availability" aria-busy="true">Loading current availability</div>' : '<div data-testid="Venue Availability" data-availability-state="pending">Choose a service category</div>';
      return page(url, [
        `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: "Native TableCheck 1", address: "Shibuya 1, Tokyo", geo: sourcePoint })}</script>`,
        '<h1>Native TableCheck 1</h1><p class="address">Shibuya 1, Tokyo</p>',
        `<form id="reserve" class="simple_form form-horizontal reserveform" method="post"><input name="reservation[start_date]" value="${date}"><select name="reservation[num_people_adult]"><option value="2" selected>2</option></select><input id="service-sushi" class="radio_buttons optional" type="radio" value="sushi" name="reservation[service_category]"${selected ? " checked" : ""}><label for="service-sushi">Sushi</label><input id="service-bar" class="radio_buttons optional" type="radio" value="bar" name="reservation[service_category]"${tableCheckScopedCategory === "bar" ? " checked" : ""}><label for="service-bar">Bar</label>${result}</form>`,
        '<article class="menu-item"><p>Sushi omakase course</p><div class="menu-item-data" data-service-categories="[&quot;sushi&quot;]"></div></article><article class="menu-item"><p>Bar snacks</p><div class="menu-item-data" data-service-categories="[&quot;bar&quot;]"></div></article>',
      ].join(""), `Native TableCheck 1\nShibuya 1, Tokyo\n${selected ? "Sushi selected\n" : ""}Sushi omakase course\nBar snacks\n${selected && !tableCheckScopedResultReady ? "Loading current availability" : result.includes("19:00") ? "19:00" : "Choose a service category"}`);
    }
    const tablecheckId = parsed.pathname.match(/^\/en\/native-omakase-(\d+)$/)?.[1];
    if (tablecheckId) {
      const name = `Native TableCheck ${tablecheckId}`;
      const address = `Shibuya ${tablecheckId}, Tokyo`;
      const available = scenario === "TABLECHECK_RECOVERS" || scenario === "TABLECHECK_EARLY_ACTIONS" || scenario === "TABLECHECK_DISCOVERY_RECOVERS" || scenario === "TABLECHECK_QUERY_READY" || (scenario === "TABLECHECK_CURRENT_BATCH_DELIVERS" && tablecheckId === "1") || (scenario === "TABLECHECK_CONTINUES" && tablecheckId === "2");
      const availabilityWidget = !available
        ? `<div data-testid="Venue Availability" data-selected-date="${date}" data-pax="2"></div><section data-availability-state="empty" data-date="${date}" data-pax="2"></section>`
        : !tableCheckAvailabilityRevealed.has(tablecheckId)
        ? '<div data-testid="Venue Availability"><button type="button" data-praxis-read-only="true">Show availability</button></div>'
        : `<div data-testid="Venue Availability" data-selected-date="${date}" data-pax="2"><form><input name="reservation[start_date]" value="${date}"><select name="reservation[num_people_adult]"><option value="2" selected>2</option></select><a href="https://www.tablecheck.com/en/shops/native-omakase-${tablecheckId}/reserve?start_date=${date}&amp;num_people=2&amp;start_time=19:00">19:00</a></form></div>`;
      return page(url, [
        `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name, address, geo: sourcePoint })}</script>`,
        `<link rel="canonical" href="${url}"><h1>${name}</h1><p class="address">${address}</p>`,
        availabilityWidget,
      ].join(""), `${name}\n${address}\nOmakase course\n2 guests\n${date}\n19:00`);
    }
    throw new Error(`Unconfigured public source page: ${url}`);
  };
  let reopenFailureInjected = false;
  const runtime: BrowserRuntime = { ...(options.guardedReadBoundary ? { readNetworkBoundaryCapability: "ISOLATED_CONTEXT" as const } : {}), openSession: async () => {
    const sessionId = (sessionsOpened?.length ?? 0) + 1;
    if (scenario === "TABELOG_REOPEN_RETAINS" && sessionId === 2 && !reopenFailureInjected) {
      reopenFailureInjected = true;
      throw Object.assign(new Error("Replacement session unavailable"), { code: "BROWSER_RUNTIME_FAILED" });
    }
    sessionsOpened?.push(sessionId);
    return new NativeFixtureSession(lookup, navigations, sessionId, navigationSessionIds, closedSessionIds,
      (url) => {
        if (scenario === "TABELOG_RESULT_PAGES_CONTINUE" && new URL(url).pathname.endsWith("/sushi/2/")) {
          tabelogSecondPageRevealed = true;
          return;
        }
        if (scenario === "TABLECHECK_DISCOVERY_RECOVERS" && new URL(url).pathname === "/en/japan/search" && tableCheckDiscoveryExpectedQuery !== "" && tableCheckDiscoveryInputValue === tableCheckDiscoveryExpectedQuery) {
          tableCheckDiscoveryRevealed = true;
          return;
        }
        const id = new URL(url).pathname.match(/^\/en\/native-omakase-(\d+)$/)?.[1];
        if (id) tableCheckAvailabilityRevealed.add(id);
      },
      scenario === "TABLECHECK_DISCOVERY_RECOVERS" ? (value) => { tableCheckDiscoveryInputValue = value; } : undefined,
      scenario === "TABLECHECK_SCOPED_MENU_DELIVERS" ? (url, value, checked) => {
        if (new URL(url).pathname === "/en/shops/native-omakase-1/reserve" && checked) {
          tableCheckScopedCategory = value;
          tableCheckScopedResultReady = false;
        }
      } : undefined,
      scenario === "TABLECHECK_SCOPED_MENU_DELIVERS" ? (url) => {
        if (new URL(url).pathname !== "/en/shops/native-omakase-1/reserve" || tableCheckScopedCategory !== "sushi" || tableCheckScopedResultReady) return false;
        tableCheckScopedResultReady = true;
        return true;
      } : undefined,
      options.guardedReadBoundary === true);
  } };
  return runtime;
}

/**
 * A wholly intercepted, local Chromium page used only to prove that the
 * Tabelog adapter can operate a native-detail page whose query starts
 * unresolved.  It deliberately has one provider-shaped outlet and exposes no
 * real network path or booking submission.
 */
export function dynamicTabelogSourcePages(options: { result?: "AVAILABLE" | "UNAVAILABLE" } = {}): BrowserRuntime {
  const detailUrl = "https://tabelog.com/en/tokyo/A1304/A130401/100/";
  const vacancyPath = "/en/booking/calendar/find_vacancy/";
  const result = options.result ?? "AVAILABLE";
  const detailHtml = `<title>Native Dynamic Tabelog 100</title>
    <script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: "Native Dynamic Tabelog 100", address: "Shibuya 100, Tokyo", geo: center })}</script>
    <h1 class="rstinfo-table__name">Native Dynamic Tabelog 100</h1><p class="rstinfo-table__address">Shibuya 100, Tokyo</p>
    <div class="course menu">Omakase course</div><p>Reserve Guests</p>
    <div class="p-booking-calendar"><table class="p-booking-calendar__calendar"><caption><em>Aug 2026</em></caption><tbody><tr>
      <td><p class="js-calendar-day-target is-selectable is-current" data-year="2026" data-month="8" data-day="18" onclick="pickDate(this)"><span class="p-booking-calendar__day-num">18</span></p></td>
      <td><p class="js-calendar-day-target is-selectable" data-year="2026" data-month="8" data-day="19" onclick="pickDate(this)"><span class="p-booking-calendar__day-num">19</span></p></td>
    </tr></tbody></table>
    <button type="button" class="js-people-button is-active" onclick="pickGuests(this)">1</button>
    <button type="button" class="js-people-button" onclick="pickGuests(this)">2</button>
    <input class="js-people-hidden-value" type="hidden" value="1"><div id="availability"></div></div>
    <script>
      let selectedDate='2026-08-18'; let selectedGuests=1;
      function refresh(){ if(selectedDate!=='2026-08-19'||selectedGuests!==2)return;
        fetch('${vacancyPath}?date='+selectedDate+'&member='+selectedGuests).then(r=>r.json()).then(()=>{
          document.querySelector('#availability').innerHTML='${result === "AVAILABLE" ? '<button class="slot is-available" data-time="19:00">19:00</button>' : '<button class="slot is-unavailable" data-time="19:00">19:00</button>'}';
        }); }
      function pickDate(node){document.querySelector('.js-calendar-day-target.is-current').classList.remove('is-current');node.classList.add('is-current');selectedDate='2026-08-'+node.dataset.day;refresh();}
      function pickGuests(node){document.querySelector('.js-people-button.is-active').classList.remove('is-active');node.classList.add('is-active');selectedGuests=Number(node.textContent);document.querySelector('.js-people-hidden-value').value=String(selectedGuests);refresh();}
    </script>`;
  const pages: Record<string, { contentType: string; body: string }> = {
    [detailUrl]: { contentType: "text/html; charset=utf-8", body: detailHtml },
  };
  const browserType = {
    async launch(options: Parameters<typeof chromium.launch>[0]) {
      const browser = await chromium.launch(options);
      const createContext = browser.newContext.bind(browser);
      browser.newContext = async (contextOptions) => {
        const context = await createContext(contextOptions);
        await context.route("**/*", async (route) => {
          const request = new URL(route.request().url());
          if (request.origin === "https://tabelog.com" && request.pathname === "/en/tokyo/rstLst/") {
            // The native search owns the URL shape; the fixture only accepts the
            // frozen HARD criterion and deliberately tolerates parameter order.
            if (request.searchParams.get("sw") !== "omakase") { await route.abort(); return; }
            // Keep the source-shaped class but also meet the native parser's
            // observed name-marker contract.  Otherwise the dynamic page has
            // a raw link but deliberately yields no parsed outlet, which
            // exercises neither the same-source availability path nor the
            // fixed-order continuation it is meant to cover.
            await route.fulfill({ contentType: "text/html; charset=utf-8", body: `<a class="list-rst__rst-name-target restaurant-name" href="${detailUrl}" data-address="Shibuya 100, Tokyo">Native Dynamic Tabelog 100</a>` });
            return;
          }
          if (request.origin === "https://www.tablecheck.com" && request.pathname === "/en/japan/search") {
            // A legal second native source must end as observed no-result, not
            // as an unconfigured browser failure, if the Router reaches it.
            await route.fulfill({ contentType: "text/html; charset=utf-8", body: "<title>TableCheck search</title><main>0 venues found</main>" });
            return;
          }
          if (request.origin === "https://tabelog.com" && request.pathname === vacancyPath) {
            const member = Number(request.searchParams.get("member"));
            const requestedDate = request.searchParams.get("date");
            const exactQuery = member === 2 && requestedDate === "2026-08-19";
            const body = exactQuery
              ? { base_date: { year: 2026, month: 8, day: 19 }, members: 2,
                selection: result === "AVAILABLE"
                  ? { 0: { time: "19:00", url: "/en/booking/form_course/new?rcd=100&member=2&visit_date=20260819&visit_time=1900" } }
                  : [] }
              : { base_date: { year: 2026, month: 8, day: 18 }, members: 1, selection: {} };
            await route.fulfill({ contentType: "application/json; charset=utf-8", body: JSON.stringify(body) });
            return;
          }
          const page = pages[request.toString()];
          if (!page) { await route.abort(); return; }
          await route.fulfill(page);
        });
        return context;
      };
      return browser;
    },
  };
  return new LocalPlaywrightChromium({ browserType });
}
