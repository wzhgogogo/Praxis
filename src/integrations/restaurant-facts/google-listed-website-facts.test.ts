import assert from "node:assert/strict";
import { test } from "node:test";

import type { RestaurantCandidateFactRequest } from "../../domains/restaurant/contracts.js";
import type { BrowserRuntime, BrowserSession } from "../../infrastructure/browser/browser-runtime.js";
import { GoogleListedWebsiteFactRead } from "./google-listed-website-facts.js";

const request: RestaurantCandidateFactRequest = {
  candidateIds: ["cafe-a"],
  candidates: [{
    restaurant: {
      id: "cafe-a", outletName: "Cafe A", address: "1 Ginza, Tokyo", sourceIds: { googleWebsiteUri: "https://cafe.example/about?tracking=ignore" }, provenance: {},
    }, matchReasons: [], warnings: [], executionConfidence: "LOW",
  }],
  intent: {
    timezone: "Asia/Tokyo", target: { goal: "RECOMMENDATION", query: "afternoon cafe" }, date: "2026-09-14",
    timeWindow: { earliest: "12:00", latest: "15:00" }, area: { query: "Ginza" }, criteria: [{ text: "cafe", polarity: "POSITIVE", strength: "HARD" }],
  },
};

function runtime(html: string, text = "untrusted visible prose"): BrowserRuntime {
  const session: BrowserSession = {
    metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: "2026-09-11T00:00:00.000Z" },
    navigate: async () => {},
    snapshot: async () => ({ url: "https://cafe.example/about", title: "Cafe A", text, html }),
    click: async () => {}, fill: async () => {}, select: async () => [], waitFor: async () => {}, screenshot: async () => new Uint8Array(), close: async () => {},
  };
  return { openSession: async () => session };
}

function multiCandidateRuntime(pages: Record<string, { html: string; text: string }>, navigated: string[]): BrowserRuntime {
  return {
    openSession: async () => {
      let current = "";
      const session: BrowserSession = {
        metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: "2026-09-11T00:00:00.000Z" },
        navigate: async (url) => { current = url; navigated.push(url); },
        snapshot: async () => ({ url: current, title: "Restaurant facts", ...(pages[current] ?? { html: "", text: "" }) }),
        click: async () => {}, fill: async () => {}, select: async () => [], waitFor: async () => {}, screenshot: async () => new Uint8Array(), close: async () => {},
      };
      return session;
    },
  };
}

function expandableTermsRuntime(): BrowserRuntime {
  return {
    openSession: async () => {
      let expanded = false;
      const structured = `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: "Cafe A", address: "1 Ginza, Tokyo" })}</script>`;
      const session: BrowserSession = {
        metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: "2026-09-11T00:00:00.000Z" },
        navigate: async () => {},
        snapshot: async () => expanded
          ? { url: "https://cafe.example/about", title: "Cafe A terms", html: structured, text: "Cafe A\n1 Ginza, Tokyo\nCafe\nMonday: 10:00 - 18:00\nCourse price: ¥8,000 (tax included)\nPrivate room minimum spend: ¥20,000\nCancellation: 50% fee after 17:00." }
          : { url: "https://cafe.example/about", title: "Cafe A", html: structured, text: "Cafe A\n1 Ginza, Tokyo\nCafe\nMonday: 10:00 - 18:00\nPublic information" },
        observeControls: async () => expanded ? [] : [{ id: "terms", stableKey: "terms", kind: "BUTTON", role: "button", label: "Show terms", type: "button", disabled: false, visible: true }],
        click: async (target) => { assert.equal(target, "terms"); expanded = true; },
        waitForChange: async () => expanded,
        fill: async () => {}, select: async () => [], waitFor: async () => {}, screenshot: async () => new Uint8Array(), close: async () => {},
      };
      return session;
    },
  };
}

test("website facts require candidate-bound structured identity and do not promote visible prose", async () => {
  const html = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "CafeOrCoffeeShop", name: "Cafe A",
    address: { "@type": "PostalAddress", streetAddress: "1 Ginza", addressLocality: "Tokyo" },
    servesCuisine: "Cafe", openingHoursSpecification: { dayOfWeek: "https://schema.org/Monday", opens: "10:00:00", closes: "18:00:00" },
  })}</script><p>We are definitely open forever</p>`;
  const read = await new GoogleListedWebsiteFactRead(runtime(html), () => "2026-09-11T00:00:00.000Z").inspectFacts(request, new AbortController().signal);
  assert.equal(read.factChecks["cafe-a"]?.status, "COMPLETED");
  const facts = read.evidence.find((item) => item.kind === "RESTAURANT_FACT");
  assert.equal(facts?.provider, "RESTAURANT_WEBSITE");
  assert.equal(facts?.sourceUrl, "https://cafe.example/about");
  assert.equal(facts?.claims.openingHoursMatch, true);
  assert.equal(JSON.stringify(read.evidence).includes("open forever"), false);
});

test("website prose without exact structured name and address remains unknown", async () => {
  const html = `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: "Different Cafe", address: "Tokyo" })}</script>`;
  const read = await new GoogleListedWebsiteFactRead(runtime(html)).inspectFacts(request, new AbortController().signal);
  assert.deepEqual(read.factChecks["cafe-a"], {
    status: "UNKNOWN", checkedAt: read.factChecks["cafe-a"]?.checkedAt, evidenceIds: [], reasonCode: "WEBSITE_STRUCTURED_IDENTITY_UNVERIFIED",
  });
  assert.equal(read.evidence.length, 0);
});

test("candidate-bound visible opening hours are grounded when JSON-LD is absent", async () => {
  const read = await new GoogleListedWebsiteFactRead(
    runtime("<main>plain public page</main>", "Cafe A\n1 Ginza, Tokyo\nCafe\nMonday: 10:00 - 18:00"),
    () => "2026-09-11T00:00:00.000Z",
  ).inspectFacts(request, new AbortController().signal);
  const facts = read.evidence.find((item) => item.kind === "RESTAURANT_FACT");
  assert.equal(read.factChecks["cafe-a"]?.status, "COMPLETED");
  assert.equal(facts?.claims.openingHoursMatch, true);
  assert.equal(facts?.artifactRef?.kind, "DOM_EXCERPT");
});

test("a differently punctuated but equivalent numbered address can identify the same outlet", async () => {
  const altered: RestaurantCandidateFactRequest = {
    ...request,
    candidates: [{ ...request.candidates[0]!, restaurant: { ...request.candidates[0]!.restaurant, address: "Tokyo Ginza 1 2" } }],
  };
  const read = await new GoogleListedWebsiteFactRead(
    runtime("<main>plain public page</main>", "Cafe A\nTokyo, Ginza 1-2\nCafe\nMonday: 10:00 - 18:00"),
  ).inspectFacts(altered, new AbortController().signal);
  assert.equal(read.factChecks["cafe-a"]?.status, "COMPLETED");
  assert.equal(read.evidence[0]?.entityMatch?.matchedBy[0], "VISIBLE_WEBSITE_NAME_AND_ADDRESS_COMPONENTS");
});

test("a same-name page without the candidate address does not become an outlet fact", async () => {
  const read = await new GoogleListedWebsiteFactRead(
    runtime("<main>plain public page</main>", "Cafe A\n2 Ginza, Tokyo\nCafe\nMonday: 10:00 - 18:00"),
  ).inspectFacts(request, new AbortController().signal);
  assert.equal(read.factChecks["cafe-a"]?.status, "UNKNOWN");
  assert.equal(read.evidence.length, 0);
});

test("matching street numbers cannot bind same-name outlets in different cities", async () => {
  const read = await new GoogleListedWebsiteFactRead(
    runtime("<main>plain public page</main>", "Cafe A\n1 Ginza, Chiba\nCafe\nMonday: 10:00 - 18:00"),
  ).inspectFacts(request, new AbortController().signal);
  assert.equal(read.factChecks["cafe-a"]?.status, "UNKNOWN");
  assert.equal(read.evidence.length, 0);
});

test("identity-only JSON-LD does not prevent the same page's visible facts from completing a gap", async () => {
  const html = `<script type="application/ld+json">${JSON.stringify({ "@type": "CafeOrCoffeeShop", name: "Cafe A", address: "1 Ginza, Tokyo" })}</script>`;
  const read = await new GoogleListedWebsiteFactRead(
    runtime(html, "Cafe A\n1 Ginza, Tokyo\nCafe\nMonday: 10:00 - 18:00"),
    () => "2026-09-11T00:00:00.000Z",
  ).inspectFacts(request, new AbortController().signal);
  assert.equal(read.factChecks["cafe-a"]?.status, "COMPLETED");
  assert.equal(read.evidence.some((item) => item.kind === "RESTAURANT_FACT" && item.claims.openingHoursMatch === true), true);
});

test("candidate-bound public commercial terms retain price, tax, room minimum, cancellation, and no-show as distinct evidence", async () => {
  const html = `<script type="application/ld+json">${JSON.stringify({
    "@type": "Restaurant", name: "Cafe A", address: "1 Ginza, Tokyo", servesCuisine: "Cafe",
    openingHours: "Monday: 10:00 - 18:00",
  })}</script>`;
  const read = await new GoogleListedWebsiteFactRead(
    runtime(html, [
      "Cafe A", "1 Ginza, Tokyo", "Cafe", "Monday: 10:00 - 18:00",
      "Course price: ¥8,000 (tax included)",
      "Private room minimum spend: ¥20,000",
      "Cancellation: 50% fee after 17:00 on the prior day.",
      "No-show: 100% fee.",
    ].join("\n")),
    () => "2026-09-11T00:00:00.000Z",
  ).inspectFacts(request, new AbortController().signal);
  const facts = read.evidence.find((item) => item.kind === "RESTAURANT_FACT");
  assert.equal(facts?.claims.coursePriceYen, 8000);
  assert.equal(facts?.claims.coursePriceTax, "INCLUDED");
  assert.equal(facts?.claims.privateRoomMinimumYen, 20000);
  assert.equal(facts?.claims.cancellationTerms, "Cancellation: 50% fee after 17:00 on the prior day.");
  assert.equal(facts?.claims.noShowTerms, "No-show: 100% fee.");
});

test("the production website reader expands an observed public terms section before grounding its candidate-bound evidence", async () => {
  const read = await new GoogleListedWebsiteFactRead(
    expandableTermsRuntime(),
    () => "2026-09-11T00:00:00.000Z",
    {
      async decide(input) {
        const terms = input.observation.targets.find((target) => target.label === "Show terms");
        assert.ok(terms, "only the observed public terms control may be selected");
        return { type: "CLICK", targetRef: terms.ref, reason: "Expand the observed public terms section." };
      },
    },
  ).inspectFacts({ ...request, intent: { ...request.intent, criteria: [...request.intent.criteria, { text: "cancellation policy", polarity: "POSITIVE", strength: "HARD" }] } }, new AbortController().signal);
  const facts = read.evidence.find((item) => item.kind === "RESTAURANT_FACT");
  assert.equal(read.factChecks["cafe-a"]?.status, "COMPLETED", JSON.stringify(read));
  assert.equal(facts?.claims.coursePriceYen, 8000);
  assert.equal(facts?.claims.privateRoomMinimumYen, 20000);
  assert.equal(facts?.claims.cancellationTerms, "Cancellation: 50% fee after 17:00.");
});

test("a bare public yen amount does not become a price or room-minimum fact", async () => {
  const html = `<script type="application/ld+json">${JSON.stringify({
    "@type": "Restaurant", name: "Cafe A", address: "1 Ginza, Tokyo", servesCuisine: "Cafe",
    openingHours: "Monday: 10:00 - 18:00",
  })}</script>`;
  const read = await new GoogleListedWebsiteFactRead(
    runtime(html, "Cafe A\n1 Ginza, Tokyo\nCafe\nMonday: 10:00 - 18:00\nAn old poster mentions ¥8,000."),
  ).inspectFacts(request, new AbortController().signal);
  const facts = read.evidence.find((item) => item.kind === "RESTAURANT_FACT");
  assert.equal(facts?.claims.coursePriceYen, undefined);
  assert.equal(facts?.claims.privateRoomMinimumYen, undefined);
});

test("two candidate website reads keep cross-page commercial evidence scoped to its matching restaurant", async () => {
  const beta = {
    id: "cafe-b", outletName: "Cafe B", address: "2 Ginza, Tokyo", sourceIds: { googleWebsiteUri: "https://cafe.example/b" }, provenance: {},
  };
  const comparisonRequest: RestaurantCandidateFactRequest = {
    ...request,
    candidateIds: ["cafe-a", "cafe-b"],
    candidates: [request.candidates[0]!, { restaurant: beta, matchReasons: [], warnings: [], executionConfidence: "LOW" }],
  };
  const structured = (name: string, address: string) => `<script type="application/ld+json">${JSON.stringify({
    "@type": "Restaurant", name, address, servesCuisine: "Cafe", openingHours: "Monday: 10:00 - 18:00",
  })}</script>`;
  const navigated: string[] = [];
  const read = await new GoogleListedWebsiteFactRead(multiCandidateRuntime({
    "https://cafe.example/about": { html: structured("Cafe A", "1 Ginza, Tokyo"), text: "Cafe A\n1 Ginza, Tokyo\nCafe\nMonday: 10:00 - 18:00\nCourse price: ¥8,000 (tax included)" },
    "https://cafe.example/b": { html: structured("Cafe B", "2 Ginza, Tokyo"), text: "Cafe B\n2 Ginza, Tokyo\nCafe\nMonday: 10:00 - 18:00\nPrivate room minimum spend: ¥20,000\nCancellation: no fee until 17:00." },
  }, navigated), () => "2026-09-11T00:00:00.000Z").inspectFacts(comparisonRequest, new AbortController().signal);
  const factsA = read.evidence.find((item) => item.kind === "RESTAURANT_FACT" && item.candidateId === "cafe-a");
  const factsB = read.evidence.find((item) => item.kind === "RESTAURANT_FACT" && item.candidateId === "cafe-b");
  assert.deepEqual(navigated, ["https://cafe.example/about", "https://cafe.example/b"]);
  assert.equal(factsA?.claims.coursePriceYen, 8000);
  assert.equal(factsA?.claims.privateRoomMinimumYen, undefined);
  assert.equal(factsB?.claims.privateRoomMinimumYen, 20000);
  assert.equal(factsB?.claims.coursePriceYen, undefined);
  assert.equal(factsB?.claims.cancellationTerms, "Cancellation: no fee until 17:00.");
});


test("ambiguous amounts and multiple courses are not promoted to a single commercial price", async () => {
  for (const line of [
    "Course price: deposit ¥3,000; full price ¥12,000 (tax included)",
    "Course price: ¥8,000\nCourse price: ¥12,000",
    "Private room minimum: deposit ¥3,000; total ¥20,000",
  ]) {
    const read = await new GoogleListedWebsiteFactRead(runtime("<main></main>", "Cafe A\n1 Ginza, Tokyo\nCafe\nMonday: 10:00 - 18:00\n" + line)).inspectFacts(request, new AbortController().signal);
    const claims = read.evidence.find(item => item.kind === "RESTAURANT_FACT")?.claims;
    assert.equal(claims?.coursePriceYen, undefined, line);
    assert.equal(claims?.privateRoomMinimumYen, undefined, line);
  }
});


test("missing requested cancellation facts remain unknown even when type and hours are known", async () => {
  const read = await new GoogleListedWebsiteFactRead(runtime("<main></main>", "Cafe A\n1 Ginza, Tokyo\nCafe\nMonday: 10:00 - 18:00")).inspectFacts({
    ...request, intent: { ...request.intent, criteria: [...request.intent.criteria, { text: "cancellation policy", polarity: "POSITIVE", strength: "HARD" }] },
  }, new AbortController().signal);
  assert.equal(read.factChecks["cafe-a"]?.status, "UNKNOWN");
  assert.equal(read.factChecks["cafe-a"]?.reasonCode, "WEBSITE_REQUESTED_FACTS_UNCONFIRMED");
  assert.equal(read.evidence.find(item => item.kind === "RESTAURANT_FACT")?.claims.cancellationTerms, undefined);
});

test("commercial information requests continue from Google to a real website fact read without invented hard criteria", async () => {
  const { GoogleThenWebsiteFactRead } = await import("./google-then-website-facts.js");
  const google = { executionRoute: "STRUCTURED_ADAPTER" as const, async inspectFacts() { return { evidence: [], factChecks: { "cafe-a": { status: "COMPLETED" as const, checkedAt: "2026-09-11T00:00:00.000Z", evidenceIds: [] } }, metadata: { provider: "GOOGLE_PLACES" as const, route: "STRUCTURED_ADAPTER" as const, latencyMs: 0 } }; } };
  const website = new GoogleListedWebsiteFactRead(runtime("", "Cafe A\n1 Ginza, Tokyo\nMonday: 10:00 - 18:00\nCancellation: 50% after 17:00."));
  const read = await new GoogleThenWebsiteFactRead(google, website).inspectFacts({ ...request, intent: { ...request.intent, target: { goal: "AVAILABILITY", query: "Compare cancellation policies" }, criteria: [] } }, new AbortController().signal);
  assert.equal(read.evidence.find(item => item.kind === "RESTAURANT_FACT")?.claims.cancellationTerms, "Cancellation: 50% after 17:00.");
});

test("multilingual website facts retain cancellation and complete course cards across pages with separate citations", async () => {
  // Production website reader/Executor/Grounding; only source transport and model choice are fixtures.
  for (const matchingPhone of [true, false]) {
    const phone = matchingPhone ? "03-1111-2222" : "03-9999-8888";
    let current = "https://venue.owst.jp/";
    const cancel = "キャンセル規定: 当日100%。前日は50%。席のみ予約は1人13,000円。";
    const course = "季節のコース 2 ～ 4名 13,000円 (税込) ランチ限定、11:30〜14:00。";
    const sourceRuntime: BrowserRuntime = { async openSession() { return {
      metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM" as const, engine: "CHROMIUM" as const, startedAt: "2026-09-16T00:00:00Z" },
      async navigate(url) { current = url; },
      async snapshot() { return current.endsWith('/courses')
        ? { url: current, title: "コース", text: `食堂一 ${phone}\n${course}`, html: '<a href="/courses/123"><h3 class="courseName">季節のコース</h3><ul><li>2 ～ 4名</li></ul><p class="coursePrice">13,000円 (税込)</p><p>ランチ限定、11:30〜14:00。</p></a>' }
        : { url: current, title: "食堂一", text: `食堂一 ${phone}\nキャンセル規定\n当日100%。前日は50%。席のみ予約は1人13,000円。`, html: '<dl><dt>キャンセル規定</dt><dd>当日100%。前日は50%。席のみ予約は1人13,000円。</dd></dl>' }; },
      async observeControls() { return [{ id: "courses", stableKey: "courses", kind: "LINK" as const, role: "link", label: "コース", href: "https://venue.owst.jp/courses", disabled: false, visible: true }]; },
      async click() {}, async fill() {}, async select() { return []; }, async waitFor() {}, async screenshot() { return new Uint8Array(); }, async close() {},
    }; } };
    const revised: RestaurantCandidateFactRequest = { ...request, candidates: [{ ...request.candidates[0]!, restaurant: { ...request.candidates[0]!.restaurant, sourceIds: { phone: "03-1111-2222", googleWebsiteUri: "https://venue.owst.jp/" } } }], intent: { ...request.intent, target: { goal: "AVAILABILITY", query: "Compare course prices and cancellation policies" }, criteria: [] } };
    const budget = { totalModelCalls: 5, maxModelCalls: 20 };
    const read = await new GoogleListedWebsiteFactRead(sourceRuntime, undefined, { async decide(input) { return input.observation.url.endsWith('/courses') ? { type: "COMPLETE", reason: "No further public page" } : { type: "OPEN_LINK", targetRef: input.observation.targets[0]!.ref, reason: "Read courses" }; } }, budget).inspectFacts(revised, new AbortController().signal);
    const facts = read.evidence.filter(item => item.kind === "RESTAURANT_FACT");
    if (matchingPhone) {
      assert.equal(read.factChecks['cafe-a']?.status, "COMPLETED");
      assert.equal(facts.find(item => item.sourceUrl === "https://venue.owst.jp/")?.claims.cancellationTerms, cancel);
      assert.deepEqual(facts.find(item => item.sourceUrl?.endsWith('/courses'))?.claims.listedCourseDetails, [course]);
      assert.ok(budget.totalModelCalls > 5, "a previous availability read does not exhaust a separate two-call website ceiling");
    } else { assert.equal(read.evidence.length, 0); assert.equal(read.factChecks['cafe-a']?.status, "UNKNOWN"); }
  }
});
