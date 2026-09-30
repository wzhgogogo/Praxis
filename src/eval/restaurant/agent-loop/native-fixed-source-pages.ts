import type { BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../../infrastructure/browser/browser-runtime.js";

export const reference = new Date("2026-08-19T07:20:00.000Z");
export const center = { latitude: 35.6619707, longitude: 139.703795 };
export const date = "2026-08-19";

export type SourceScenario = "TABELOG_DELIVERS" | "TABLECHECK_RECOVERS" | "BOTH_BOUNDED_EMPTY" | "OUTSIDE_RADIUS" | "TABELOG_ONE_DETAIL_FAILS" | "EARLY_END_ATTEMPT"
  | "TABELOG_CONTINUES" | "TABLECHECK_CONTINUES" | "NATIVE_PARTIAL" | "NATIVE_TRUE_NO_RESULT" | "TABLECHECK_UNPARSED" | "TABLECHECK_EARLY_ACTIONS";

function page(url: string, html: string, text: string, title = "Restaurant"): BrowserSnapshot { return { url, html, text, title }; }

class NativeFixtureSession implements BrowserSession {
  readonly metadata = { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM" as const, engine: "CHROMIUM" as const, startedAt: reference.toISOString() };
  private current?: BrowserSnapshot;
  private navigationUnusable = false;
  constructor(private readonly lookup: (url: string) => BrowserSnapshot, private readonly navigations: string[],
    private readonly sessionId: number, private readonly navigationSessionIds?: number[], private readonly closedSessionIds?: number[]) {}
  async navigate(url: string): Promise<void> {
    if (this.navigationUnusable) throw Object.assign(new Error("Prior navigation is still unresolved"), { code: "BROWSER_TIMEOUT" });
    this.navigations.push(url);
    this.navigationSessionIds?.push(this.sessionId);
    try { this.current = this.lookup(url); } catch (error) { this.navigationUnusable = true; throw error; }
  }
  async snapshot(): Promise<BrowserSnapshot> { if (!this.current) throw new Error("No source page navigated"); return this.current; }
  async click(): Promise<void> { throw new Error("No model-controlled click is expected in fixed source pages"); }
  async fill(): Promise<void> { throw new Error("No model-controlled fill is expected in fixed source pages"); }
  async select(_target: string, value: string): Promise<string[]> { return [value]; }
  async waitFor(): Promise<void> {}
  async screenshot(): Promise<Uint8Array> { return new Uint8Array(); }
  async close(): Promise<void> { this.closedSessionIds?.push(this.sessionId); }
}

export function sourcePages(scenario: SourceScenario, navigations: string[], sessionsOpened?: number[], navigationSessionIds?: number[], closedSessionIds?: number[]) {
  const tabelogCount = scenario === "TABELOG_DELIVERS" || scenario === "TABELOG_ONE_DETAIL_FAILS" || scenario === "TABELOG_CONTINUES" ? 3
    : scenario === "NATIVE_PARTIAL" || scenario === "TABLECHECK_CONTINUES" || scenario === "NATIVE_TRUE_NO_RESULT" || scenario === "TABLECHECK_EARLY_ACTIONS" ? 2
    : scenario === "TABLECHECK_RECOVERS" || scenario === "OUTSIDE_RADIUS" ? 1 : 0;
  const tablecheckCount = scenario === "TABLECHECK_RECOVERS" ? 3
    : scenario === "TABLECHECK_CONTINUES" || scenario === "TABLECHECK_EARLY_ACTIONS" ? 2 : scenario === "NATIVE_TRUE_NO_RESULT" ? 1
    : scenario === "OUTSIDE_RADIUS" ? 1 : 0;
  const sourcePoint = scenario === "OUTSIDE_RADIUS" ? { latitude: 35.75, longitude: 139.80 } : center;
  const lookup = (url: string): BrowserSnapshot => {
    const parsed = new URL(url);
    if (parsed.hostname === "tabelog.com" && parsed.pathname.includes("/rstLst/")) {
      const links = Array.from({ length: tabelogCount }, (_, index) => {
        const id = 100 + index;
        return `<a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/${id}/" data-address="Shibuya ${id}, Tokyo">Native Tabelog ${id}</a>`;
      }).join("");
      return page(url, links, tabelogCount ? "Restaurants" : "No restaurants found", "Tabelog search");
    }
    const tabelogId = parsed.pathname.match(/^\/tokyo\/A1304\/A130401\/(\d+)\/$/)?.[1];
    if (tabelogId) {
      if (scenario === "TABELOG_ONE_DETAIL_FAILS" && tabelogId === "101") throw Object.assign(new Error("One detail navigation failed"), { code: "BROWSER_TIMEOUT" });
      const name = `Native Tabelog ${tabelogId}`;
      const address = `Shibuya ${tabelogId}, Tokyo`;
      const available = scenario === "TABELOG_DELIVERS" || scenario === "TABELOG_ONE_DETAIL_FAILS"
        || (scenario === "TABELOG_CONTINUES" && tabelogId === "102")
        || (scenario === "NATIVE_PARTIAL" && tabelogId === "101");
      const unknown = (scenario === "TABELOG_CONTINUES" && tabelogId === "101")
        || (scenario === "TABLECHECK_CONTINUES" && tabelogId === "101");
      return page(url, [
        `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name, address, geo: sourcePoint })}</script>`,
        `<h1>${name}</h1><p class="rstinfo-table__address">${address}</p>`,
        unknown ? "" : `<select name="party"><option value="2" selected>2</option></select><select name="date"><option value="${date}" selected>${date}</option></select>`,
        available ? '<button class="slot is-available" data-time="19:00">19:00</button>' : unknown ? "" : '<button class="slot is-unavailable" data-time="19:00">19:00</button>',
      ].join(""), `${name}\n${address}\n${unknown ? "" : "予約\n"}${["TABELOG_DELIVERS", "TABELOG_ONE_DETAIL_FAILS", "TABELOG_CONTINUES", "TABLECHECK_CONTINUES", "TABLECHECK_EARLY_ACTIONS", "NATIVE_PARTIAL", "NATIVE_TRUE_NO_RESULT"].includes(scenario) ? "Omakase course\n" : "Dinner course\n"}2 guests\n${date}\n19:00`);
    }
    if (parsed.hostname === "www.tablecheck.com" && parsed.pathname === "/en/japan/search") {
      if (scenario === "TABLECHECK_UNPARSED") return page(url, '<a href="/en/search">Search</a>', "Search results loading", "TableCheck search");
      const links = Array.from({ length: tablecheckCount }, (_, index) => `<a href="/en/native-omakase-${index + 1}">Native TableCheck ${index + 1}</a>`).join("");
      return page(url, links, tablecheckCount ? `${tablecheckCount} venues found` : "No venues found", "TableCheck search");
    }
    const tablecheckId = parsed.pathname.match(/^\/en\/native-omakase-(\d+)$/)?.[1];
    if (tablecheckId) {
      const name = `Native TableCheck ${tablecheckId}`;
      const address = `Shibuya ${tablecheckId}, Tokyo`;
      const available = scenario === "TABLECHECK_RECOVERS" || scenario === "TABLECHECK_EARLY_ACTIONS" || (scenario === "TABLECHECK_CONTINUES" && tablecheckId === "2");
      return page(url, [
        `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name, address, geo: sourcePoint })}</script>`,
        `<link rel="canonical" href="${url}"><h1>${name}</h1><p class="address">${address}</p>`,
        `<div data-testid="Venue Availability" data-selected-date="${date}" data-pax="2"></div>`,
        available ? '<section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>'
          : `<section data-availability-state="empty" data-date="${date}" data-pax="2"></section>`,
      ].join(""), `${name}\n${address}\nOmakase course\n2 guests\n${date}\n19:00`);
    }
    throw new Error(`Unconfigured public source page: ${url}`);
  };
  const runtime: BrowserRuntime = { openSession: async () => {
    const sessionId = (sessionsOpened?.length ?? 0) + 1;
    sessionsOpened?.push(sessionId);
    return new NativeFixtureSession(lookup, navigations, sessionId, navigationSessionIds, closedSessionIds);
  } };
  return runtime;
}
