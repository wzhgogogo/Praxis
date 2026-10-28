import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { chromium } from "playwright-core";
import { ModelRestaurantPageQuestion } from "../../../src/integrations/restaurant-facts/model-page-question.js";
import type { RestaurantFactPageObservation } from "../../../src/integrations/restaurant-facts/fact-source-document.js";
import type { ModelGateway, ModelRequest } from "../../../src/core/model/contracts.js";

// Reads questions + their source pages only. No scorer/reference imports.
const dataset = JSON.parse(await readFile(".eval-artifacts/phase3b/g1-qa/questions.json", "utf8"));
const results: unknown[] = [];
let blockedRequests = 0;
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ serviceWorkers: "block" });
  await context.route("**/*", route => { blockedRequests++; return route.abort(); });
  const page = await context.newPage();
  for (const id of ["G1-Q07", "G1-Q33", "G1-Q31", "G1-Q27", "G1-Q26", "G1-Q14"]) {
    const question = dataset.questions.find((row: { id: string }) => row.id === id)!;
    const source = dataset.pages.find((row: { id: string }) => row.id === question.pageId)!;
    const stored = await readFile(source.pagePath);
    assert.equal(createHash("sha256").update(stored).digest("hex"), source.storageSha256);
    const raw = source.storageEncoding === "gzip" ? gunzipSync(stored) : stored;
    assert.equal(createHash("sha256").update(raw).digest("hex"), source.pageSha256);
    await page.setContent(raw.toString(), { waitUntil: "domcontentloaded" });
    const text = await page.locator("body").innerText();
    const given = question.providedPage;
    const bound: RestaurantFactPageObservation = {
      candidateId: given.candidateId, readRunId: given.readRunId, requestedSourceUrl: given.sourceUrl, observedAt: given.observedAt,
      snapshot: { url: given.sourceUrl, html: raw.toString(), text, title: source.outlet.name, settlement: "SETTLED" },
      identity: { evidenceId: given.readId + ":identity", candidateId: given.candidateId, kind: "ENTITY_MATCH", provider: source.site,
        sourceEntityId: source.outlet.id, sourceUrl: given.sourceUrl, observedAt: given.identityObservedAt, requestFingerprint: "LOCAL_CONSTRUCTED_SAVED_PAGE_BINDING",
        claims: { outletName: source.outlet.name }, entityMatch: { confidence: "HIGH", matchedBy: ["LOCAL_CONSTRUCTED_SAVED_PAGE_BINDING"] } },
    };
    const scenarios = id === "G1-Q07" || id === "G1-Q33" ? ["english", "japanese"] : ["fixture"];
    for (const scenario of scenarios) {
      let wire!: ModelRequest;
      const model: ModelGateway = { complete: async input => {
        wire = input;
        const docs = JSON.parse(input.messages[1]!.content).sourceDocuments;
        const citation = (phrase: string, exact = false) => {
          for (const doc of docs) {
            const statement = doc.statements.find((row: { text: string }) => exact ? row.text === phrase : row.text.includes(phrase));
            if (statement) return { documentId: doc.id, statementId: statement.id, quote: statement.text };
          }
          assert.fail("saved-page literal not supplied to fixture model: " + phrase);
        };
        let body: object;
        if (id === "G1-Q07") body = { status: "ANSWERED", answer: scenario === "japanese" ? "当日のキャンセル料は一人につき三千円です。" : "The same-day cancellation fee is listed as 3,000 yen per person.", citations: [citation("On-the-day cancellation (no notice):")] };
        else if (id === "G1-Q33") body = { status: "ANSWERED", answer: scenario === "japanese" ? "ランチコースは三千三百円です。" : "The lunch course is listed at JPY 3,300.", citations: [citation("ランチコース", true), citation("¥3,300", true)] };
        else if (id === "G1-Q31") body = { status: "ANSWERED", answer: "The description states that private rooms are available.", citations: [citation("和モダンな店内には個室も備え、接待や会食、記念日など幅広いシーンでご利用いただけます。", true)] };
        else if (id === "G1-Q26") body = { status: "ANSWERED", answer: "The English and Japanese state conflicting lunch service-charge scopes; the page does not resolve the discrepancy.", sourceConflict: true, citations: [citation("all lunch orders"), citation("ランチ利用時")] };
        else body = { status: "NOT_STATED", answer: null, citations: [] };
        return { invocationId: "saved-page-fixture", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS", latencyMs: 0,
          outputText: JSON.stringify({ sensitiveCategory: "NONE", sourceConflict: false, ...body }) };
      } };
      const outcome = await new ModelRestaurantPageQuestion(model, undefined, () => "2026-10-28T09:00:00+01:00").answer({
        question: question.question, displayedOutlet: question.displayedOutlet, readContext: question.readContext, cachedPages: [bound],
      }, AbortSignal.timeout(10_000));
      assert.equal(outcome.status, scenario === "japanese" ? "UNVERIFIED" : id === "G1-Q14" || id === "G1-Q27" ? "NOT_STATED" : "ANSWERED", id + ":" + scenario);
      if (id === "G1-Q26") { assert.ok(outcome.status === "ANSWERED"); assert.equal(outcome.confirmationRequired, true); }
      assert.equal(wire.promptVersion, "3"); assert.equal(wire.outputSchema.version, "3");
      results.push({ id, scenario, sourcePageSha256: source.pageSha256, visibleCharacters: text.length, raw: outcome });
    }
  }
} finally { await browser.close(); }
const result = { mode: "SAVED_SOURCE_REAL_CHROMIUM_FIXTURE_MODEL", realCalls: 0, sourceTransportCalls: 0, blockedRequests,
  notProven: "real-model language/classification/conflict/NOT_STATED quality; local identity envelopes are assumed bindings",
  results };
await writeFile(process.argv[2]!, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ cases: results.length, realCalls: 0, sourceTransportCalls: 0 }));
