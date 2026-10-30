import assert from "node:assert/strict";
import test from "node:test";
import { parseTabelogSearchOutlets } from "./tabelog-page-parser.js";
import { tabelogNameSearchCompletion, tabelogAvailabilityCompletion } from "./tabelog-browser-availability.js";

const url = "https://tabelog.com/en/tokyo/rstLst/?sw=Public";
const detail = "https://tabelog.com/en/tokyo/A1301/A130101/13123456/";
const snapshot = (html: string) => ({ url, title: "Restaurants", html, text: "Public & Co. 1-1 Ginza, Tokyo Other branch 9-9 Ginza, Tokyo" });

test("G3 public list names, addresses and telephone quotes survive private marker changes", () => {
  for (const marker of ["list-rst__rst-name-target", "renamed-319"]) {
    const page = snapshot(`<main><section aria-label="Search results"><article><h2><a class="${marker}" href="${detail}" data-address="wrong hidden address" data-phone="wrong hidden phone">Public &amp; Co.</a></h2>
      <address>1-1 Ginza, Tokyo</address><a href="tel:03-1111-2222">03-1111-2222</a></article>
      <article><h2><a href="/en/tokyo/A1301/A130101/13123457/">Other branch</a></h2><address>9-9 Ginza, Tokyo</address></article></section></main>`);
    const outlets = parseTabelogSearchOutlets(page);
    assert.equal(outlets.length, 2, "public links remain observable after private class rename");
    assert.equal(outlets[0]?.outletName, "Public & Co.");
    assert.equal(outlets[0]?.address, "1-1 Ginza, Tokyo", "address must be a public quote within this outlet card");
    assert.equal(outlets[0]?.phone, "03-1111-2222");
    assert.equal(outlets[1]?.address, "9-9 Ginza, Tokyo", "never borrow another result's address");
    assert.equal(tabelogNameSearchCompletion(page).complete, true);
  }
});

test("G3 hidden attributes, navigation and invisible result copies are not public outlet evidence", () => {
  const page = snapshot(`<nav><a href="${detail}">Photo</a></nav><a class="list-rst__rst-name-target" href="/en/login/">Sign in</a>
    <article hidden><a class="list-rst__rst-name-target" href="${detail}">Hidden branch</a><address>unobserved</address></article>
    <article><a href="${detail}" data-address="invented address" data-phone="invented phone">Public &amp; Co.</a></article>`);
  assert.deepEqual(parseTabelogSearchOutlets(page), [{ sourceEntityId: "en/tokyo/A1301/A130101/13123456", sourceUrl: detail, outletName: "Public & Co." }]);
});

test("G3 busy result regions use public semantic ownership, excluding unrelated and hidden progress", () => {
  const result = `<article><h2><a href="${detail}">Public &amp; Co.</a></h2></article>`;
  assert.equal(tabelogNameSearchCompletion(snapshot(`<section aria-label="Search results" aria-busy="true">${result}</section>`)).resultBusy, true,
    "public aria-busy results must wait without a private result class");
  assert.equal(tabelogNameSearchCompletion(snapshot(`<section><h2>Search results</h2><div role="progressbar" aria-label="Loading restaurants"></div>${result}</section>`)).resultBusy, true);
  for (const progress of ['<aside aria-label="Photos" aria-busy="true">Photos</aside>', '<div hidden role="progressbar">Loading</div>']) {
    assert.equal(tabelogNameSearchCompletion(snapshot(`<section aria-label="Search results">${result}${progress}</section>`)).resultBusy, false);
  }
  const request = { date: "2026-11-03", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" } };
  assert.equal(tabelogAvailabilityCompletion({ ...snapshot('<section aria-label="Availability" aria-busy="true">Checking availability</section>'), url: detail }, request).resultBusy, true);
});
