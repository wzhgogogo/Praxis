import assert from "node:assert/strict";
import { test } from "node:test";
import type { RestaurantCandidate } from "../../../domains/restaurant/contracts.js";
import type { BrowserSnapshot } from "../../../infrastructure/browser/browser-runtime.js";
import { simulateNamedRetrieval } from "./named-retrieval-simulation.js";

const candidate: RestaurantCandidate = {
  restaurant: { id: "test", outletName: "Source Restaurant Tokyo", address: "1-1 Shinjuku Tokyo", sourceIds: { googlePlaces: "same-place", phone: "03-1111-2222" }, provenance: {} },
  matchReasons: [], warnings: [], executionConfidence: "LOW",
};
const url = (n: number) => `https://tabelog.com/en/tokyo/A1301/A130101/${n}/`;
const listing = (ids: number[]): BrowserSnapshot => ({ url: "https://tabelog.com/en/tokyo/rstLst/", title: "Search", text: "Search",
  html: ids.map(n => `<a data-address="Tokyo" href="${url(n)}">Source Restaurant Tokyo</a>`).join("") });
const detail = (n: number): BrowserSnapshot => ({ url: url(n), title: "Detail", text: "Public restaurant identity",
  html: `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: n === 5 ? candidate.restaurant.outletName : "Other shop", telephone: n === 5 ? "03-1111-2222" : "03-9999-8888", address: n === 5 ? candidate.restaurant.address : "9-9 Shibuya Tokyo" })}</script>` });
const base = {
  candidate, fragmentRecorded: true, fragmentProposal: { field: "name", fragment: "Source Restaurant" }, japaneseRecorded: true,
  readSearch: async (_query: string) => ({ page: listing([1, 2, 3, 4, 5]) }),
  readDetail: async (outlet: { sourceUrl: string }) => ({ page: detail(Number(outlet.sourceUrl.split("/").at(-2))) }),
};

test("4+1 returns the unused Japanese slot to the fifth original candidate without repeating details", async () => {
  const result = await simulateNamedRetrieval({ ...base, japaneseName: { placeId: "same-place", text: candidate.restaurant.outletName, languageCode: "en" } });
  assert.deepEqual(result.searches.map(s => s.kind), ["ORIGINAL", "FRAGMENT"]);
  assert.deepEqual(result.details.map(d => d.url), [1, 2, 3, 4, 5].map(url));
  assert.equal(result.details.at(-1)?.phase, "RETURNED_FIFTH");
  assert.equal(result.status, "MATCH"); assert.equal(result.acceptedUrl, url(5));
});

test("4+1 exposes when a new Japanese candidate displaces the previously correct fifth detail", async () => {
  const result = await simulateNamedRetrieval({ ...base, japaneseName: { placeId: "same-place", text: "Source Japanese name", languageCode: "ja" },
    readSearch: async query => ({ page: listing(query === "Source Japanese name" ? [6] : [1, 2, 3, 4, 5]) }) });
  assert.deepEqual(result.searches.map(s => s.kind), ["ORIGINAL", "FRAGMENT", "JAPANESE"]);
  assert.deepEqual(result.details.map(d => d.url), [1, 2, 3, 4, 6].map(url));
  assert.equal(result.status, "NO_MATCH"); assert.equal(result.acceptedUrl, null);
  assert.ok(result.deferred.includes(url(5)));
});

test("missing pages or unrecorded proposals cannot be reported as a verified identity match", async () => {
  const result = await simulateNamedRetrieval({ ...base, fragmentRecorded: false,
    readDetail: async outlet => outlet.sourceUrl === url(2) ? { problem: "MISSING_SAVED_PAGE" } : base.readDetail(outlet) });
  assert.equal(result.status, "NOT_EVALUATED"); assert.equal(result.acceptedUrl, null);
  assert.ok(result.uncertainties.includes("UNRECORDED_FRAGMENT_PROPOSAL"));
  assert.ok(result.uncertainties.some(reason => reason.includes("MISSING_SAVED_PAGE")));
  assert.equal(result.bounds.details, 5);
});
