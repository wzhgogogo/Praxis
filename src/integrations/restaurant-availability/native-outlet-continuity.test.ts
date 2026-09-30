import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import type { BrowserRuntime, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { NativeSourceFactRead } from "../restaurant-facts/native-source-facts.js";
import { inspectNativeOutletContinuity } from "./native-outlet-continuity.js";

test("Tabelog native outlet continuity accepts a language canonical for the same source ID", () => {
  const expected = "https://tabelog.com/en/tokyo/A1303/A130301/13308491/";
  const canonical = "https://tabelog.com/tokyo/A1303/A130301/13308491/";
  const page = { url: expected, title: "Sushi Teppen", text: "Sushi Teppen", html: "" };
  const result = inspectNativeOutletContinuity({ provider: "TABELOG", sourceEntityId: "en/tokyo/A1303/A130301/13308491", sourceUrl: expected }, page, {
    sourceEntityId: "tokyo/A1303/A130301/13308491", sourceUrl: canonical, canonicalUrl: canonical,
    pageOwnedName: true, pageOwnedAddress: true,
  });
  assert.equal(result.confirmed, true);
  assert.equal(result.observedSourceEntityId, "tokyo/A1303/A130301/13308491");
  assert.equal(inspectNativeOutletContinuity({ provider: "TABELOG", sourceEntityId: "en/tokyo/A1303/A130301/13308491", sourceUrl: expected },
    { ...page, url: expected.replace("13308491", "13308492") }, {
      sourceEntityId: "tokyo/A1303/A130301/13308492", sourceUrl: canonical.replace("13308491", "13308492"),
      pageOwnedName: true, pageOwnedAddress: true,
    }).reason, "OUTLET_CHANGED");
  assert.equal(inspectNativeOutletContinuity({ provider: "TABELOG", sourceEntityId: "en/tokyo/A1303/A130301/13308491", sourceUrl: expected },
    { ...page, url: "https://tabelog.com/tokyo/A1304/A130401/13308491/" }, {
      sourceEntityId: "tokyo/A1304/A130401/13308491", sourceUrl: "https://tabelog.com/tokyo/A1304/A130401/13308491/",
      pageOwnedName: true, pageOwnedAddress: true,
    }).reason, "OUTLET_CHANGED", "a repeated numeric suffix in a different area path is not the same outlet");
});

test("native fact reads never pass a same-URL challenge or explicit error page to judgment", async () => {
  let judgments = 0;
  const judge = { async judge() { judgments += 1; return { evidence: [] }; } };
  for (const [provider, sourceId, sourceUrl] of [
    ["TABLECHECK", "example-shop", "https://www.tablecheck.com/en/example-shop"],
    ["TABELOG", "tokyo/A1304/A130401/123", "https://tabelog.com/tokyo/A1304/A130401/123/"],
  ] as const) {
    const candidate = { ...fixtureCandidates[0]!, restaurant: { ...fixtureCandidates[0]!.restaurant,
      sourceIds: provider === "TABLECHECK" ? { tablecheck: sourceId, tablecheckNativeGuideUri: sourceUrl }
        : { tabelog: sourceId, tabelogNativeDetailUri: sourceUrl } } };
    for (const [title, reason] of [["Just a moment", "BOT_CHALLENGE"], ["404 Not Found", "PAGE_UNAVAILABLE"]] as const) {
      const page: BrowserSnapshot = { url: sourceUrl, title, text: "Verify you are human", html: "<h1>Verify you are human</h1>" };
      if (reason === "PAGE_UNAVAILABLE") { page.text = "This page is unavailable"; page.html = "<h1>404 Not Found</h1>"; }
      const runtime: BrowserRuntime = { openSession: async () => ({
        metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: "2026-08-05T09:00:00.000Z" },
        navigate: async () => undefined, snapshot: async () => page, click: async () => undefined, fill: async () => undefined,
        select: async () => [], waitFor: async () => undefined, screenshot: async () => new Uint8Array(), close: async () => undefined,
      }) };
      const read = await new NativeSourceFactRead(runtime, judge, () => "2026-08-05T09:00:00.000Z")
        .inspectFacts({ candidateIds: [candidate.restaurant.id], candidates: [candidate], intent: fixtureIntent }, new AbortController().signal);
      assert.equal(read.evidence.length, 0);
      assert.equal(read.factChecks[candidate.restaurant.id]?.status, "UNKNOWN");
      assert.equal(read.metadata.nativeContinuity?.[0]?.reason, reason);
    }
  }
  assert.equal(judgments, 0);
});
