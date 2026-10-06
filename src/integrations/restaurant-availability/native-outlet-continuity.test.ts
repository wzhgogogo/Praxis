import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import type { BrowserRuntime, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { NativeSourceFactRead } from "../restaurant-facts/native-source-facts.js";
import { candidateVisibleObservation } from "../restaurant-facts/google-listed-website-facts.js";
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
      // Keep page-owned restaurant metadata and a matching canonical URL in
      // the error document.  A continuity fallback must not let those stale
      // fields override a real challenge or explicit unavailable page.
      const childUrl = `${sourceUrl.replace(/\/$/, "")}/menu/`;
      const page: BrowserSnapshot = { url: childUrl, title, text: "Verify you are human", html: `<link rel="canonical" href="${sourceUrl}"><h1>Restaurant 1</h1><div class="address">1-1 Shinjuku, Tokyo</div>` };
      if (reason === "PAGE_UNAVAILABLE") { page.text = "This page is unavailable"; page.html = `<link rel="canonical" href="${sourceUrl}"><h1>Restaurant 1</h1><div class="address">1-1 Shinjuku, Tokyo</div>`; }
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

test("native fact read retains each observed source page with its own identity", async () => {
  const sourceUrl = "https://www.tablecheck.com/en/fixture";
  const menuUrl = "https://restaurant.example/menu";
  const candidate = { ...fixtureCandidates[0]!, restaurant: { ...fixtureCandidates[0]!.restaurant,
    sourceIds: { tablecheck: "fixture", tablecheckNativeGuideUri: sourceUrl } } };
  const page = (url: string, text: string): BrowserSnapshot => ({ url, title: "Restaurant 1", text,
    html: `<h1>Restaurant 1</h1><div class="address">1-1 Shinjuku, Tokyo</div>${url === sourceUrl
      ? '<a href="https://restaurant.example/menu">Official Website</a>' : ""}` });
  let current = page(sourceUrl, "Restaurant 1\n1-1 Shinjuku, Tokyo\nIntroduction only");
  const runtime: BrowserRuntime = { openSession: async () => ({
    metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: "2026-10-06T00:00:00.000Z" },
    navigate: async (url) => { current = page(url, current.text); }, snapshot: async () => current,
    observeControls: async () => current.url === sourceUrl ? [{ id: "official", stableKey: "official", kind: "LINK", role: "link", label: "Official Website", visible: true, disabled: false, blockedByActiveLayer: false, href: menuUrl }] : [],
    openLink: async () => { current = page(menuUrl, "Restaurant 1\n1-1 Shinjuku, Tokyo\nOmakase course"); },
    click: async () => undefined, fill: async () => undefined, select: async () => [], setChecked: async () => undefined, press: async () => undefined,
    waitFor: async () => undefined, screenshot: async () => new Uint8Array(), close: async () => undefined,
  }) };
  let judged = 0;
  const judgment = { async judge() {
    judged += 1;
    return judged === 1 ? { evidence: [] } : { evidence: [{ evidenceId: "menu-judgment", kind: "RESTAURANT_FACT" as const, provider: "MODEL_JUDGMENT" as const, candidateId: candidate.restaurant.id,
      observedAt: "2026-10-06T00:00:00.000Z", requestFingerprint: "menu", claims: { verifiedHardCriteria: ["omakase"], supportingEvidenceIds: ["menu"] } }] };
  } };
  const decision = { async decide(input: { observation: { targets: Array<{ ref: string; kind: string }> } }) {
    const link = input.observation.targets.find(target => target.kind === "LINK");
    assert.ok(link, "only the observed menu link is available to the decision");
    return { type: "OPEN_LINK" as const, targetRef: link.ref, reason: "Read the observed menu" };
  } };
  const read = await new NativeSourceFactRead(runtime, judgment, () => "2026-10-06T00:00:00.000Z", decision)
    .inspectFacts({ candidateIds: [candidate.restaurant.id], candidates: [candidate], intent: { ...fixtureIntent, criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] } }, new AbortController().signal);
  assert.equal(read.factChecks[candidate.restaurant.id]?.status, "COMPLETED", JSON.stringify(read));
  assert.equal(judged, 2, "the second judgment follows a newly retained source page, not a type keyword");
  assert.equal(read.sourceDocuments?.length, 2);
  const identityEvidence = read.evidence.filter((item) => item.kind === "ENTITY_MATCH");
  assert.equal(new Set(identityEvidence.map((item) => item.sourceUrl)).size, 2, "each observed page retains its own identity/source URL");
});

test("native fact continuation keeps the prior judgment when no new cited page is retained", async () => {
  const sourceUrl = "https://www.tablecheck.com/en/fixture";
  const candidate = { ...fixtureCandidates[0]!, restaurant: { ...fixtureCandidates[0]!.restaurant,
    sourceIds: { tablecheck: "fixture", tablecheckNativeGuideUri: sourceUrl } } };
  const page: BrowserSnapshot = { url: sourceUrl, title: "Restaurant 1", text: "Restaurant 1\n1-1 Shinjuku, Tokyo\nIntroduction only",
    html: '<link rel="canonical" href="/en/fixture"><h1>Restaurant 1</h1><div class="address">1-1 Shinjuku, Tokyo</div><a href="/en/fixture">Menu</a>' };
  const runtime: BrowserRuntime = { openSession: async () => ({
    metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: "2026-10-06T00:00:00.000Z" },
    navigate: async () => undefined, snapshot: async () => page,
    observeControls: async () => [{ id: "repeat", stableKey: "repeat", kind: "LINK", role: "link", label: "Menu", visible: true, disabled: false, blockedByActiveLayer: false, href: sourceUrl }],
    openLink: async () => undefined, click: async () => undefined, fill: async () => undefined, select: async () => [], setChecked: async () => undefined, press: async () => undefined,
    waitFor: async () => undefined, screenshot: async () => new Uint8Array(), close: async () => undefined,
  }) };
  let judgments = 0;
  const judgment = { async judge() { judgments += 1; return { evidence: [] }; } };
  const decision = { async decide() { return { type: "OPEN_LINK" as const, targetRef: "repeat", reason: "Read the observed menu" }; } };
  const read = await new NativeSourceFactRead(runtime, judgment, () => "2026-10-06T00:00:00.000Z", decision)
    .inspectFacts({ candidateIds: [candidate.restaurant.id], candidates: [candidate], intent: { ...fixtureIntent, criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] } }, new AbortController().signal);
  assert.equal(judgments, 1, "a repeated page is not material for a second cited judgment");
  assert.equal(read.factChecks[candidate.restaurant.id]?.status, "UNKNOWN");
});

test("an observed official page cannot inherit native outlet identity from a shared phone", () => {
  const candidate = { ...fixtureCandidates[0]!, restaurant: { ...fixtureCandidates[0]!.restaurant,
    sourceIds: { ...fixtureCandidates[0]!.restaurant.sourceIds, phone: "03-1111-2222" } } };
  const wrongBranch = "Brand menu\n03-1111-2222\n2-2 Shibuya, Tokyo";
  assert.equal(candidateVisibleObservation(candidate, "https://restaurant.example/menu", "2026-10-06T00:00:00.000Z", wrongBranch, '<a href="tel:03-1111-2222">call</a>', { allowExactSourcePhone: false }), undefined);
});

test("native TableCheck facts read an observed reserve menu as a scoped document without widening its text to the guide", async () => {
  const guideUrl = "https://www.tablecheck.com/en/shops/fixture";
  const reserveUrl = "https://www.tablecheck.com/en/shops/fixture/reserve";
  const candidate = { ...fixtureCandidates[0]!, restaurant: { ...fixtureCandidates[0]!.restaurant,
    sourceIds: { tablecheck: "fixture", tablecheckNativeGuideUri: guideUrl } } };
  const guide: BrowserSnapshot = { url: guideUrl, title: "Restaurant 1", text: "Restaurant 1\n1-1 Shinjuku, Tokyo\nIntroduction only",
    html: '<h1>Restaurant 1</h1><div class="address">1-1 Shinjuku, Tokyo</div><a href="/en/shops/fixture/reserve">Reserve</a>' };
  // Each source paragraph is below the existing 1,600-character statement cap.
  // Preserve these boundaries so the 6,000-character document budget does not
  // discard a whole reserve-page remainder as one flattened line.
  const venueParagraphs = Array.from({ length: 32 }, (_, index) =>
    `Venue policy ${index + 1}: ${index === 17 ? "This venue is hot pot only." : "public dining information."}`);
  const reserve: BrowserSnapshot = { url: reserveUrl, title: "Restaurant 1", text: "Restaurant 1\n1-1 Shinjuku, Tokyo\nSushi omakase course\nBar snacks",
    html: [
      '<h1>Restaurant 1</h1><div class="address">1-1 Shinjuku, Tokyo</div><aside>Venue-wide policy: no fast food.</aside>',
      ...venueParagraphs.map((paragraph) => `<p>${paragraph}</p>`),
      '<form class="simple_form reserveform" method="post"><input type="radio" name="reservation[service_category]" value="sushi"><input type="radio" name="reservation[service_category]" value="bar"></form>',
      '<article class="menu-item"><p>Sushi omakase course</p><div class="menu-item-data" data-service-categories="[&quot;sushi&quot;]"></div></article>',
      '<article class="menu-item"><p>Bar snacks</p><div class="menu-item-data" data-service-categories="[&quot;bar&quot;]"></div></article>',
    ].join("") };
  let current = guide;
  let documents: Array<{ serviceScope?: { value: string }; statements: Array<{ text: string }> }> = [];
  const runtime: BrowserRuntime = { openSession: async () => ({
    metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: "2026-10-07T00:00:00.000Z" },
    navigate: async (url) => { current = url === reserveUrl ? reserve : guide; }, snapshot: async () => current,
    observeControls: async () => current.url === reserveUrl ? [
      { id: "sushi", stableKey: "sushi", kind: "RADIO" as const, role: "radio", label: "Sushi", value: "sushi", checked: false, visible: true, disabled: false, structure: { tag: "INPUT", name: "reservation[service_category]", classes: ["radio_buttons"], dialogLabel: "", formClass: "simple_form reserveform", sliderCount: 0, radioGroupKey: "form:reserve|name:reservation[service_category]" } },
      { id: "bar", stableKey: "bar", kind: "RADIO" as const, role: "radio", label: "Bar", value: "bar", checked: false, visible: true, disabled: false, structure: { tag: "INPUT", name: "reservation[service_category]", classes: ["radio_buttons"], dialogLabel: "", formClass: "simple_form reserveform", sliderCount: 0, radioGroupKey: "form:reserve|name:reservation[service_category]" } },
    ] : [],
    click: async () => undefined, fill: async () => undefined, select: async () => [], setChecked: async () => undefined, press: async () => undefined,
    waitFor: async () => undefined, screenshot: async () => new Uint8Array(), close: async () => undefined,
  }) };
  const judgment = { async judge(input: { sourceDocuments?: typeof documents }) {
    documents = input.sourceDocuments ?? [];
    return { evidence: [] };
  } };
  await new NativeSourceFactRead(runtime, judgment, () => "2026-10-07T00:00:00.000Z")
    .inspectFacts({ candidateIds: [candidate.restaurant.id], candidates: [candidate], intent: { ...fixtureIntent, criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] } }, new AbortController().signal);
  assert.equal(documents.length, 4);
  assert.equal(documents.filter((document) => document.serviceScope === undefined).length, 2, "the guide and reserve remainder remain unscoped but the reserve menu does not duplicate as whole-page text");
  assert.deepEqual(documents.filter((document) => document.serviceScope).map((document) => document.serviceScope!.value).sort(), ["bar", "sushi"]);
  assert.equal(documents.find((document) => document.serviceScope?.value === "sushi")!.statements.some((statement) => /omakase/i.test(statement.text)), true);
  assert.equal(documents.find((document) => document.serviceScope?.value === "bar")!.statements.some((statement) => /omakase/i.test(statement.text)), false, "a sibling category cannot borrow the sushi source text");
  assert.equal(documents.filter((document) => document.serviceScope === undefined).some((document) => document.statements.some((statement) => /no fast food/i.test(statement.text))), true,
    "a venue-wide source statement stays available to the global negative-condition gate");
  const reserveRemainder = documents.find((document) => document.serviceScope === undefined && document.statements.some((statement) => /Venue policy 1:/.test(statement.text)));
  assert.ok(reserveRemainder, "the reserve-page remainder remains a bounded source document");
  assert.deepEqual(reserveRemainder.statements.filter((statement) => /^Venue policy \d+:/.test(statement.text)).map((statement) => statement.text), venueParagraphs,
    "each original short paragraph survives separately, including the venue-wide conflict");
  assert.equal(reserveRemainder.statements.some((statement) => /hot pot only/i.test(statement.text)), true);
});

test("an observed TableCheck reserve entrance cannot turn stale outlet metadata on a challenge page into fact evidence", async () => {
  const guideUrl = "https://www.tablecheck.com/en/shops/fixture";
  const reserveUrl = "https://www.tablecheck.com/en/shops/fixture/reserve";
  const candidate = { ...fixtureCandidates[0]!, restaurant: { ...fixtureCandidates[0]!.restaurant,
    sourceIds: { tablecheck: "fixture", tablecheckNativeGuideUri: guideUrl } } };
  const guide: BrowserSnapshot = { url: guideUrl, title: "Restaurant 1", text: "Restaurant 1\n1-1 Shinjuku, Tokyo\nIntroduction only",
    html: '<h1>Restaurant 1</h1><div class="address">1-1 Shinjuku, Tokyo</div><a href="/en/shops/fixture/reserve">Reserve</a>' };
  const challenge: BrowserSnapshot = { url: reserveUrl, title: "Just a moment", text: "Verify you are human",
    html: '<link rel="canonical" href="/en/shops/fixture"><h1>Restaurant 1</h1><div class="address">1-1 Shinjuku, Tokyo</div>' };
  let current = guide;
  let judgments = 0;
  let documents: Array<{ statements: Array<{ text: string }> }> = [];
  const runtime: BrowserRuntime = { openSession: async () => ({
    metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: "2026-10-07T00:00:00.000Z" },
    navigate: async (url) => { current = url === reserveUrl ? challenge : guide; }, snapshot: async () => current, observeControls: async () => [],
    click: async () => undefined, fill: async () => undefined, select: async () => [], setChecked: async () => undefined, press: async () => undefined,
    waitFor: async () => undefined, screenshot: async () => new Uint8Array(), close: async () => undefined,
  }) };
  const judgment = { async judge(input: { sourceDocuments?: typeof documents }) { judgments += 1; documents = input.sourceDocuments ?? []; return { evidence: [] }; } };
  const read = await new NativeSourceFactRead(runtime, judgment, () => "2026-10-07T00:00:00.000Z")
    .inspectFacts({ candidateIds: [candidate.restaurant.id], candidates: [candidate], intent: { ...fixtureIntent, criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] } }, new AbortController().signal);
  assert.equal(judgments, 1, "the initial guide can be judged once, but the challenged reserve page cannot enter the cited document set");
  assert.equal(documents.some((document) => document.statements.some((statement) => /verify you are human/i.test(statement.text))), false);
  assert.equal(read.factChecks[candidate.restaurant.id]?.status, "UNKNOWN");
});

test("an observed TableCheck reserve entrance rejects a foreign canonical even with matching visible fields", async () => {
  const guideUrl = "https://www.tablecheck.com/en/shops/fixture";
  const reserveUrl = "https://www.tablecheck.com/en/shops/fixture/reserve";
  const candidate = { ...fixtureCandidates[0]!, restaurant: { ...fixtureCandidates[0]!.restaurant,
    sourceIds: { tablecheck: "fixture", tablecheckNativeGuideUri: guideUrl } } };
  const guide: BrowserSnapshot = { url: guideUrl, title: "Restaurant 1", text: "Restaurant 1\n1-1 Shinjuku, Tokyo\nIntroduction only",
    html: '<h1>Restaurant 1</h1><div class="address">1-1 Shinjuku, Tokyo</div><a href="/en/shops/fixture/reserve">Reserve</a>' };
  const foreignCanonical: BrowserSnapshot = { url: reserveUrl, title: "Restaurant 1", text: "Restaurant 1\n1-1 Shinjuku, Tokyo\nSushi omakase course",
    html: '<link rel="canonical" href="/en/shops/other-branch/reserve"><h1>Restaurant 1</h1><div class="address">1-1 Shinjuku, Tokyo</div><p>Sushi omakase course</p>' };
  let current = guide;
  let documents: Array<{ statements: Array<{ text: string }> }> = [];
  const runtime: BrowserRuntime = { openSession: async () => ({
    metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: "2026-10-07T00:00:00.000Z" },
    navigate: async (url) => { current = url === reserveUrl ? foreignCanonical : guide; }, snapshot: async () => current, observeControls: async () => [],
    click: async () => undefined, fill: async () => undefined, select: async () => [], setChecked: async () => undefined, press: async () => undefined,
    waitFor: async () => undefined, screenshot: async () => new Uint8Array(), close: async () => undefined,
  }) };
  const judgment = { async judge(input: { sourceDocuments?: typeof documents }) { documents = input.sourceDocuments ?? []; return { evidence: [] }; } };
  await new NativeSourceFactRead(runtime, judgment, () => "2026-10-07T00:00:00.000Z")
    .inspectFacts({ candidateIds: [candidate.restaurant.id], candidates: [candidate], intent: { ...fixtureIntent, criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] } }, new AbortController().signal);
  assert.equal(documents.some((document) => document.statements.some((statement) => /omakase/i.test(statement.text))), false);
});
