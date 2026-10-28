import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fixtureCandidates } from "../../harness/restaurant-fixtures.js";
import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { parseTabelogOutletIdentityWithEvidence } from "../tabelog/tabelog-page-parser.js";
import { inspectTabelogEntity } from "../tabelog/tabelog-entity-resolver.js";
import { parseTableCheckOutletIdentityWithEvidence } from "../tablecheck/tablecheck-page-parser.js";
import { inspectTableCheckEntity } from "../tablecheck/tablecheck-entity-resolver.js";

// Minimal faithful identity excerpt of the exposed nr-002 page, captured 2026-10-20:
// https://tabelog.com/en/tokyo/A1317/A131701/13242327/
// .eval-artifacts/name-resolution-benchmark-20261019/live-20261020/method-a/nr-002/artifact.json.gz
// SHA256 745f79065622752e8952074cbba51a2ae76cae4a2840c884d4d7a9a26f68696e.
// The inline excerpt is a unit fixture, not a full-page Replay. No test reads archive files.
const name = "Yakiniku Oonishi Yuutenji ten";
const sourceAddress = "東京都目黒区祐天寺2-6-11";
const address = "2-chōme-6-11 Yūtenji, Meguro City, Tokyo 153-0052, Japan";
const bookingPhone = "050-5456-5059", storePhone = "03-6451-0291";
const body = `<h1>${name}</h1><h3>Restaurant information</h3>
<table class="original-private"><tr><th>Restaurant name</th><td>${name}</td></tr>
<tr><th>Phone number (for reservation and inquiry)</th><td><strong>${bookingPhone}</strong></td></tr>
<tr><th>Address</th><td><p>${sourceAddress}</p><a href="/map/">Show larger map</a></td></tr></table>
<h4>Feature - Related information</h4><table><tr><th>Phone number</th><td>${storePhone}</td></tr></table>
<h3>Related restaurants</h3><aside><table><tr><th>Phone number</th><td>03-9999-0000</td></tr></table></aside>`;
const subject = { ...fixtureCandidates[0]!, restaurant: { ...fixtureCandidates[0]!.restaurant,
  id: "same-detail", outletName: "焼肉おおにし 祐天寺店", address,
  sourceIds: { googlePlaces: "fixture-google-id", phone: bookingPhone },
} };
const variants = [
  { provider: "Tabelog", url: "https://tabelog.com/en/tokyo/A1317/A131701/13242327/", parse: (page: BrowserSnapshot) => parseTabelogOutletIdentityWithEvidence(page, { sourceEntityId: "en/tokyo/A1317/A131701/13242327", sourceUrl: page.url, outletName: name }),
    inspect: (candidate: typeof subject, outlet: { sourceEntityId: string; sourceUrl: string; outletName: string; address?: string; phone?: string }) => inspectTabelogEntity(candidate, [outlet]).resolution },
  { provider: "TableCheck", url: "https://www.tablecheck.com/en/japan/guide/fixture-oonishi", parse: (page: BrowserSnapshot) => parseTableCheckOutletIdentityWithEvidence(page, page.url),
    inspect: (candidate: typeof subject, outlet: { sourceEntityId: string; sourceUrl: string; outletName: string; address?: string; phone?: string }) => inspectTableCheckEntity(candidate, outlet).resolution },
];
function snapshot(url: string, content = body): BrowserSnapshot {
  return { url, title: name, text: content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "), html:
    `<link rel="canonical" href="${url}"><script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", "@id": url, name,
      address: { postalCode: "1530052", addressRegion: "Tokyo", addressLocality: "Yutenji Meguro Tokyo", streetAddress: "" }, telephone: "+81-3-6451-0291" })}</script>${content}` };
}

for (const platform of variants) {
  test(`${platform.provider} matches the observed reservation phone and keeps full visible address after private-marker changes`, () => {
    for (const html of [body, body.replace(/class="[^"]*"/g, 'class="changed" data-testid="new"')]) {
      const extraction = platform.parse(snapshot(platform.url, html)); assert.ok(extraction);
      assert.equal(platform.inspect(subject, extraction.outlet).confidence, "HIGH", "same-store public 050 must not be lost behind the JSON-LD 03 phone");
      assert.equal(extraction.outlet.address, `1530052 ${sourceAddress}`);
      const details = (extraction.outlet as typeof extraction.outlet & { detailIdentity?: { sourceUrl: string; phones: Array<{ value: string; role: string; quote: string }> } }).detailIdentity;
      assert.ok(details); assert.equal(details.sourceUrl, platform.url);
      assert.deepEqual(details.phones.map(p => [p.value, p.role]).sort(), [[storePhone, "STORE"], [bookingPhone, "RESERVATION"]].sort());
      assert.ok(details.phones.every(p => p.quote.includes(p.value)));
      assert.doesNotMatch(JSON.stringify(platform.inspect(subject, extraction.outlet)), /detailIdentity/, "temporary parser evidence must not become the standard resolved outlet");
    }
  });

  test(`${platform.provider} cannot use another restaurant phone, a near phone or conflicting floor/door number`, () => {
    const extraction = platform.parse(snapshot(platform.url)); assert.ok(extraction);
    const { address: _address, ...withoutAddress } = extraction.outlet;
    assert.notEqual(platform.inspect(subject, { ...withoutAddress, sourceUrl: platform.url.replace(/\/$/, "") + "/other-store" }).confidence, "HIGH", "a phone quote cannot be lent to another source outlet");
    for (const phone of ["03-9999-0000", "050-5456-5058"]) {
      const uncertain = { ...subject, restaurant: { ...subject.restaurant, outletName: "Another restaurant", address: "Tokyo", sourceIds: { ...subject.restaurant.sourceIds, phone } } };
      assert.notEqual(platform.inspect(uncertain, extraction.outlet).confidence, "HIGH");
    }
    for (const [source, requested] of [
      [`${sourceAddress} テストビル 1F`, `${address} テストビル 2F`],
      [sourceAddress.replace("2-6-11", "2-6-12"), address],
    ] as const) {
      const other = platform.parse(snapshot(platform.url, body.replace(sourceAddress, source))); assert.ok(other);
      const candidate = { ...subject, restaurant: { ...subject.restaurant, address: requested } };
      assert.notEqual(platform.inspect(candidate, other.outlet).confidence, "HIGH");
    }
  });

  test(`${platform.provider} reports conflicting or ambiguous detail identity instead of silently choosing it`, () => {
    assert.throws(() => platform.parse(snapshot(platform.url, body.replace(sourceAddress, `${sourceAddress}</td></tr><tr><th>Address</th><td>東京都港区六本木1-2-3`))), /SOURCE_IDENTITY_STRUCTURE_CHANGED/);
    assert.throws(() => platform.parse(snapshot(platform.url, body + "<h3>Restaurant information</h3>")), /SOURCE_IDENTITY_STRUCTURE_CHANGED/);
  });
}

test("nr010 saved page keeps the same outlet when JSON-LD encodes its ampersand", () => {
  const html = readFileSync(new URL("./fixtures/nr010-20261028.html", import.meta.url), "utf8");
  assert.equal(createHash("sha256").update(html).digest("hex"), "189c571efe78e6e706a2c9e4e6d24eaa335a74f8b6682067a47d60a6a9e4e036");
  const fixture = JSON.parse(readFileSync(new URL("./fixtures/nr010-20261028.snapshot.json", import.meta.url), "utf8"));
  const page = { ...fixture.snapshot, html } as BrowserSnapshot;
  const original = { ...subject, restaurant: { ...subject.restaurant, outletName: fixture.googleSubject.name, address: fixture.googleSubject.address, sourceIds: { googlePlaces: "original-nr010-google-id", phone: fixture.googleSubject.phone } } };
  const extraction = parseTabelogOutletIdentityWithEvidence(page, { sourceEntityId: "en/tokyo/A1320/A132001/13196218", sourceUrl: page.url, outletName: "Yakitori &amp; Obanzai SAKAMOTO" });
  const inspection = inspectTabelogEntity(original, [extraction.outlet]);
  assert.equal(inspection.resolution.confidence, "HIGH");
  assert.equal(inspection.resolution.outlet?.sourceUrl, "https://tabelog.com/en/tokyo/A1320/A132001/13196218/");
  assert.equal(inspection.diagnostic.comparedOutlets[0]?.comparison.outletName, "MATCH");
  assert.equal(extraction.outlet.outletName, "Yakitori &amp; Obanzai SAKAMOTO", "source spelling remains intact; only comparison decodes");
});

for (const platform of variants) {
  test(`${platform.provider} decodes names without admitting same-name other outlets or conflicting branches`, () => {
    const original = { ...subject, restaurant: { ...subject.restaurant, outletName: "Fish & Chips", address: "東京都新宿区神楽坂2-13-3 テストビル7F", sourceIds: { googlePlaces: "name-test" } } };
    const outlet = { sourceEntityId: "observed", sourceUrl: platform.url, outletName: "Fish &amp; Chips", address: original.restaurant.address };
    assert.equal(platform.inspect(original as typeof subject, outlet).confidence, "HIGH", "decoded name plus full matching address is still the existing rule");
    for (const address of ["東京都中央区銀座2-13-3 テストビル7F", "東京都新宿区神楽坂2-13-8 テストビル7F", "東京都新宿区神楽坂2-13-3 テストビル8F"]) {
      const withPhone = { ...original, restaurant: { ...original.restaurant, sourceIds: { googlePlaces: "name-test", phone: "03-1111-2222" } } };
      assert.notEqual(platform.inspect(withPhone as typeof subject, { ...outlet, address, phone: "03-1111-2222" }).confidence, "HIGH", "decoding cannot erase a location, door or floor conflict, even with the same phone");
    }
    const missing = { ...original, restaurant: { ...original.restaurant, address: "Tokyo" } };
    assert.notEqual(platform.inspect(missing as typeof subject, { ...outlet, address: "Tokyo" }).confidence, "HIGH", "decoded name alone cannot identify the outlet");
    assert.notEqual(platform.inspect(missing as typeof subject, { ...outlet, outletName: "Fish &amp; Chips Other Branch", address: "Tokyo" }).confidence, "HIGH");
  });
}
