import assert from "node:assert/strict";
import { test } from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../core/model/contracts.js";
import type { RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import type { BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { LiveBrowserAvailability } from "./live-browser-availability.js";

class Session implements BrowserSession {
  readonly metadata = { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM" as const, engine: "CHROMIUM" as const, sessionId: "local:shared-live-composition", startedAt: "2026-09-07T00:00:00.000Z" };
  openedPages: string[] = [];
  closed = 0;
  private page = -1;
  constructor(private readonly pages: BrowserSnapshot[]) {}
  async navigate(url: string): Promise<void> { this.openedPages.push(url); this.page = Math.min(this.page + 1, this.pages.length - 1); }
  async snapshot(): Promise<BrowserSnapshot> { return this.pages[this.page]!; }
  async click(): Promise<void> {}
  async fill(): Promise<void> {}
  async select(_selector: string, value: string): Promise<string[]> { return [value]; }
  async waitFor(): Promise<void> {}
  async screenshot(): Promise<Uint8Array> { return new Uint8Array(); }
  async close(): Promise<void> { this.closed += 1; }
}

const neverCalledModel: ModelGateway = {
  async complete(_request: ModelRequest): Promise<ModelResponse> { throw new Error("normal site methods should not invoke the browser model"); },
};

test("Live browser composition keeps TableCheck then Tabelog in one session and closes it after the chain", async () => {
  const candidate = fixtureCandidates[0]!;
  const request: RestaurantAvailabilityRequest = {
    candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date,
    timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, hardCriteria: ["yakiniku"],
  };
  const session = new Session([
    { url: "https://www.tablecheck.com/en/japan/search", title: "Map Search", text: "No venues found", html: "<main>No venues found</main>" },
    { url: "https://tabelog.com/en/rstLst/?sw=Restaurant%201", title: "Tabelog search", text: "Restaurant 1", html: '<a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/123/" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数 19:00", html: '<select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button><div class="genre">yakiniku</div>' },
  ]);
  let opens = 0;
  const runtime: BrowserRuntime = { openSession: async () => { opens += 1; return session; } };
  const result = await new LiveBrowserAvailability(runtime, neverCalledModel).check(request, new AbortController().signal);
  assert.equal(opens, 1);
  assert.equal(session.closed, 1);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
  assert.deepEqual(result.metadata.providerAttempts?.map((attempt) => attempt.provider), ["TABLECHECK", "TABELOG"]);
});
