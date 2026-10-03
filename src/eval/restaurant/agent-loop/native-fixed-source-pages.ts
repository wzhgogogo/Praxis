import type { BrowserPageControl, BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../../infrastructure/browser/browser-runtime.js";
import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../../infrastructure/browser/local-playwright-chromium.js";

export const reference = new Date("2026-08-19T07:20:00.000Z");
export const center = { latitude: 35.6619707, longitude: 139.703795 };
export const date = "2026-08-19";

export type SourceScenario = "TABELOG_DELIVERS" | "TABLECHECK_RECOVERS" | "BOTH_BOUNDED_EMPTY" | "OUTSIDE_RADIUS" | "TABELOG_ONE_DETAIL_FAILS" | "EARLY_END_ATTEMPT"
  | "TABELOG_CONTINUES" | "TABLECHECK_CONTINUES" | "NATIVE_PARTIAL" | "NATIVE_TRUE_NO_RESULT" | "TABLECHECK_UNPARSED" | "TABLECHECK_EARLY_ACTIONS" | "TABELOG_BATCH_CAP" | "DYNAMIC_TABELOG_DELIVERS" | "TABLECHECK_DISCOVERY_RECOVERS" | "TABELOG_REGION_PRESERVES_QUERY" | "TABELOG_PENDING_RESTORED"
  | "TABELOG_NONEMPTY_REGION_RECOVERS" | "TABELOG_CURRENT_BATCH_DELIVERS" | "TABLECHECK_CURRENT_BATCH_DELIVERS" | "TABELOG_REOPEN_RETAINS" | "TABLECHECK_QUERY_READY" | "TABELOG_STALE_REJECTS" | "TABLECHECK_STALE_REJECTS";

function page(url: string, html: string, text: string, title = "Restaurant"): BrowserSnapshot { return { url, html, text, title }; }

class NativeFixtureSession implements BrowserSession {
  readonly metadata = { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM" as const, engine: "CHROMIUM" as const, startedAt: reference.toISOString() };
  private current?: BrowserSnapshot;
  private navigationUnusable = false;
  constructor(private readonly lookup: (url: string) => BrowserSnapshot, private readonly navigations: string[],
    private readonly sessionId: number, private readonly navigationSessionIds?: number[], private readonly closedSessionIds?: number[],
    private readonly onReadOnlyClick?: (url: string) => void, private readonly onReadOnlyFill?: (value: string) => void) {}
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
    return controls;
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
  async select(_target: string, value: string): Promise<string[]> { return [value]; }
  async waitFor(): Promise<void> {}
  async screenshot(): Promise<Uint8Array> { return new Uint8Array(); }
  async close(): Promise<void> { this.closedSessionIds?.push(this.sessionId); }
}

export function sourcePages(scenario: SourceScenario, navigations: string[], sessionsOpened?: number[], navigationSessionIds?: number[], closedSessionIds?: number[]) {
  let tableCheckDiscoveryRevealed = false;
  let tableCheckDiscoveryInputValue = "stale query";
  let tableCheckDiscoveryExpectedQuery = "";
  const tableCheckAvailabilityRevealed = new Set<string>();
  let tabelogListingVisits = 0;
  const tabelogCount = scenario === "TABELOG_DELIVERS" || scenario === "TABELOG_ONE_DETAIL_FAILS" || scenario === "TABELOG_CONTINUES" ? 3
    : scenario === "TABELOG_BATCH_CAP" || scenario === "TABELOG_PENDING_RESTORED" || scenario === "TABELOG_CURRENT_BATCH_DELIVERS" || scenario === "TABELOG_REOPEN_RETAINS" ? 6
    : scenario === "TABELOG_NONEMPTY_REGION_RECOVERS" || scenario === "TABELOG_REGION_PRESERVES_QUERY" ? 1
    : scenario === "NATIVE_PARTIAL" || scenario === "TABLECHECK_CONTINUES" || scenario === "NATIVE_TRUE_NO_RESULT" || scenario === "TABLECHECK_EARLY_ACTIONS" ? 2
    : scenario === "TABLECHECK_RECOVERS" || scenario === "OUTSIDE_RADIUS" ? 1 : 0;
  const tablecheckCount = scenario === "TABLECHECK_RECOVERS" ? 3
    : scenario === "TABLECHECK_CURRENT_BATCH_DELIVERS" ? 6
    : scenario === "TABLECHECK_CONTINUES" || scenario === "TABLECHECK_EARLY_ACTIONS" ? 2 : scenario === "NATIVE_TRUE_NO_RESULT" ? 1
    : scenario === "OUTSIDE_RADIUS" || scenario === "TABLECHECK_DISCOVERY_RECOVERS" || scenario === "TABLECHECK_QUERY_READY" ? 1 : 0;
  const sourcePoint = scenario === "OUTSIDE_RADIUS" ? { latitude: 35.75, longitude: 139.80 } : center;
  const lookup = (url: string): BrowserSnapshot => {
    const parsed = new URL(url);
    if (parsed.hostname === "tabelog.com" && parsed.pathname.includes("/rstLst/")) {
      tabelogListingVisits += 1;
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
        || (scenario === "TABELOG_CURRENT_BATCH_DELIVERS" && tabelogId === "100")
        || (scenario === "TABELOG_NONEMPTY_REGION_RECOVERS" && tabelogId === "100")
        || (scenario === "TABELOG_CONTINUES" && tabelogId === "102")
        || (scenario === "NATIVE_PARTIAL" && tabelogId === "101");
      const unknown = (scenario === "TABELOG_CONTINUES" && tabelogId === "101")
        || (scenario === "TABLECHECK_CONTINUES" && tabelogId === "101");
      return page(url, [
        `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name, address, geo: scenario === "TABELOG_NONEMPTY_REGION_RECOVERS" && tabelogId === "199" ? { latitude: 35.75, longitude: 139.80 } : sourcePoint })}</script>`,
        `<h1>${name}</h1><p class="rstinfo-table__address">${address}</p>`,
        unknown ? "" : `<select name="party"><option value="2" selected>2</option></select><select name="date"><option value="${date}" selected>${date}</option></select>`,
        available ? '<button class="slot is-available" data-time="19:00">19:00</button>' : unknown ? "" : '<button class="slot is-unavailable" data-time="19:00">19:00</button>',
      ].join(""), `${name}\n${address}\n${unknown ? "" : "予約\n"}${["TABELOG_DELIVERS", "TABELOG_ONE_DETAIL_FAILS", "TABELOG_REOPEN_RETAINS", "TABELOG_CONTINUES", "TABLECHECK_CONTINUES", "TABLECHECK_EARLY_ACTIONS", "NATIVE_PARTIAL", "NATIVE_TRUE_NO_RESULT", "TABELOG_CURRENT_BATCH_DELIVERS", "TABELOG_NONEMPTY_REGION_RECOVERS"].includes(scenario) ? "Omakase course\n" : "Dinner course\n"}2 guests\n${date}\n19:00`);
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
          `<input type="search" name="search_text" aria-label="Search venues" value="${currentValue}" data-live-value="${liveValue}"><a href="/en/stale-result">Stale venue</a>${liveValue === currentValue ? '<div aria-busy="true">Loading current search</div>' : ''}<button type="button">Show public venues</button>`,
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
  const runtime: BrowserRuntime = { openSession: async () => {
    const sessionId = (sessionsOpened?.length ?? 0) + 1;
    if (scenario === "TABELOG_REOPEN_RETAINS" && sessionId === 2 && !reopenFailureInjected) {
      reopenFailureInjected = true;
      throw Object.assign(new Error("Replacement session unavailable"), { code: "BROWSER_RUNTIME_FAILED" });
    }
    sessionsOpened?.push(sessionId);
    return new NativeFixtureSession(lookup, navigations, sessionId, navigationSessionIds, closedSessionIds,
      (url) => {
        if (scenario === "TABLECHECK_DISCOVERY_RECOVERS" && new URL(url).pathname === "/en/japan/search" && tableCheckDiscoveryExpectedQuery !== "" && tableCheckDiscoveryInputValue === tableCheckDiscoveryExpectedQuery) {
          tableCheckDiscoveryRevealed = true;
          return;
        }
        const id = new URL(url).pathname.match(/^\/en\/native-omakase-(\d+)$/)?.[1];
        if (id) tableCheckAvailabilityRevealed.add(id);
      },
      scenario === "TABLECHECK_DISCOVERY_RECOVERS" ? (value) => { tableCheckDiscoveryInputValue = value; } : undefined);
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
