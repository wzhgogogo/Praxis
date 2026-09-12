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
