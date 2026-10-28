import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { ModelGateway, ModelRequest } from "../../core/model/contracts.js";
import type { RestaurantFactPageObservation } from "./fact-source-document.js";
import { ModelRestaurantPageQuestion } from "./model-page-question.js";

const fixtureUrl = new URL("./fixtures/g1-answer-quality/merchant-excerpts.json", import.meta.url);
const bytes = await readFile(fixtureUrl);
const provenance = JSON.parse(await readFile(new URL(fixtureUrl.href + ".provenance.json"), "utf8"));
assert.equal(createHash("sha256").update(bytes).digest("hex"), provenance.fixtureSha256);
const sources: Record<string, { sourceUrl: string; capturedOn: string; fragments: string[] }> = JSON.parse(bytes.toString());
const readAt = "2026-10-28T09:00:00+01:00";
type WireDocument = { id: string; statements: Array<{ id: string; text: string; sourceRole: string }> };
function sourcePage(id: string, text = sources[id]!.fragments.join("\n")): RestaurantFactPageObservation {
  const url = sources[id]!.sourceUrl;
  return { candidateId: id, readRunId: "question-run", requestedSourceUrl: url, observedAt: readAt,
    identity: { evidenceId: `identity:${id}`, candidateId: id, kind: "ENTITY_MATCH", provider: id === "alaska" || id === "nakamata" ? "TABLECHECK" : "TABELOG",
      sourceEntityId: id, sourceUrl: url, observedAt: readAt, requestFingerprint: "LOCAL_CONSTRUCTED_BINDING",
      claims: { outletName: id }, entityMatch: { confidence: "HIGH", matchedBy: ["LOCAL_CONSTRUCTED_BINDING"] } },
    snapshot: { url, title: id, text, html: "<main>Exact saved-source excerpts; local page envelope</main>", settlement: "SETTLED" } };
}
function wireCitation(request: ModelRequest, quote: string) {
  const documents: WireDocument[] = JSON.parse(request.messages[1]!.content).sourceDocuments;
  for (const document of documents) {
    // Before the fix the sentence is inside a larger source statement. Preserve
    // that id for the red; do not pre-split input on behalf of production code.
    const statement = document.statements.find(row => row.text === quote) ?? document.statements.find(row => row.text.includes(quote));
    if (statement) return { documentId: document.id, statementId: statement.id, quote };
  }
  assert.fail("fixture quotation must exist in the source document");
}
async function answer(page: RestaurantFactPageObservation, question: string, output: (request: ModelRequest) => object) {
  const calls: ModelRequest[] = [];
  const model: ModelGateway = { complete: async request => {
    calls.push(request);
    const body = output(request) as Record<string, unknown>;
    // A fixture transport answers the requested schema. This lets the red
    // isolate behaviour instead of failing solely on the new required key.
    const hasConflict = Object.hasOwn(request.outputSchema.jsonSchema.properties as object, "sourceConflict");
    const { sourceConflict = false, ...rest } = body;
    return { invocationId: "quality-fixture", provider: "FIXTURE", model: "fixture", latencyMs: 0, finishReason: "TOOL_CALLS",
      outputText: JSON.stringify({ ...rest, ...(hasConflict ? { sourceConflict } : {}) }) };
  } };
  const result = await new ModelRestaurantPageQuestion(model, undefined, () => "2026-10-28T09:00:01+01:00").answer({
    question, displayedOutlet: { candidateId: page.candidateId, sourceUrl: page.requestedSourceUrl },
    readContext: { runId: "question-run", startedAt: readAt }, cachedPages: [page],
  }, new AbortController().signal);
  return { result, request: calls[0]! };
}

test("G1 quality language: Q07/Q33 reject predominantly Japanese answers to Latin questions", async t => {
  for (const row of [
    { id: "nishi", question: "What cancellation fee does the Nishiikebukuro branch list for a cancellation on the day?", quotes: sources.nishi!.fragments.slice(0, 1), bad: "当日のキャンセル料は一人につき三千円です。", good: "The listed same-day cancellation fee is 3,000 yen per person." },
    { id: "alaska", question: "How much is the lunch course?", quotes: ["ランチコース", "¥3,300"], bad: "ランチコースは三千三百円です。", good: "The lunch course is listed at JPY 3,300." },
  ]) await t.test(row.id, async () => {
    const output = (text: string) => (request: ModelRequest) => ({ status: "ANSWERED", answer: text, sensitiveCategory: "NONE", citations: row.quotes.map(quote => wireCitation(request, quote)) });
    const rejected = await answer(sourcePage(row.id), row.question, output(row.bad));
    assert.equal(rejected.result.status, "UNVERIFIED", "Japanese answer to an English question must be discarded");
    assert.ok(rejected.result.status === "UNVERIFIED", "language mismatch has no usable answer");
    assert.equal(rejected.result.reason, "INVALID_MODEL_OUTPUT");
    const allowed = await answer(sourcePage(row.id), row.question, output(row.good));
    assert.equal(allowed.result.status, "ANSWERED", "English answer may cite Japanese source text");
    const japanese = await answer(sourcePage(row.id), "ページにはどのように書かれていますか？", output(row.bad));
    assert.equal(japanese.result.status, "ANSWERED", "Japanese questions can still receive Japanese answers");
  });
});

test("G1 quality sentence: Q31 quotes a complete sentence within the saved 186-character paragraph", async () => {
  const paragraph = sources.nakamata!.fragments[0]!;
  const sentence = "和モダンな店内には個室も備え、接待や会食、記念日など幅広いシーンでご利用いただけます。";
  assert.equal(paragraph.length, 186, "retain the unsplit original paragraph that exposed the failure");
  const { result } = await answer(sourcePage("nakamata"), "Does the restaurant have private rooms?", request => ({
    status: "ANSWERED", answer: "The description states that private rooms are available.", sensitiveCategory: "NONE", citations: [wireCitation(request, sentence)],
  }));
  assert.equal(result.status, "ANSWERED", "a whole sentence inside the original paragraph is a valid citation");
  assert.ok(result.status === "ANSWERED", "retain the verbatim sentence");
  assert.equal(result.citations[0]!.text, sentence);
  const partial = await answer(sourcePage("nakamata"), "Does the restaurant have private rooms?", request => ({
    status: "ANSWERED", answer: "The description mentions private rooms.", sensitiveCategory: "NONE", citations: [wireCitation(request, "個室も備え")],
  }));
  assert.equal(partial.result.status, "UNVERIFIED", "an arbitrary substring is still not a complete source sentence");
});

test("G1 quality reviews: Q27 prompt directs review-only information to NOT_STATED and comments remain uncitable", async () => {
  const review = sources.sen!.fragments.find(text => text.includes("3,980"))!;
  const current = sourcePage("sen", `Reviews\n${review}\nRestaurant information\nShibuya Sushi Sen`);
  current.snapshot.html = `<h2>Reviews</h2><p>${review}</p><h2>Restaurant information</h2><p>Shibuya Sushi Sen</p>`;
  const denied = await answer(current, "Can a review price be treated as the current bookable menu?", request => ({
    status: "ANSWERED", answer: "The review describes a JPY 3,980 lunch.", sensitiveCategory: "NONE", citations: [wireCitation(request, review.split("\n").map(line => line.trim()).find(line => line.includes("3,980"))!)],
  }));
  assert.equal(denied.result.status, "UNVERIFIED", "even an attributed customer review must not enter a merchant answer");
  const absent = await answer(current, "Can the JPY 3,980 lunch mentioned in a review be treated as a price on the restaurant's current bookable menu?", () => ({
    status: "NOT_STATED", answer: null, sensitiveCategory: "NONE", citations: [],
  }));
  assert.equal(absent.result.status, "NOT_STATED");
  assert.match(absent.request.messages[0]!.content, /only customer reviews[\s\S]*?NOT_STATED/u,
    "the fixture proves the review-only absence instruction reaches the model, not that a real model follows it");
});

test("G1 quality conflict: Q26 model-reported source conflict derives confirmation without sensitive classification", async () => {
  const { result, request } = await answer(sourcePage("matsumoto"), "Is the 10% service charge also added to lunch orders that are not a course? Please check both the English and the original Japanese.", input => ({
    status: "ANSWERED", answer: "The English and Japanese give conflicting lunch service-charge scopes; the page does not resolve the discrepancy.",
    sourceConflict: true, sensitiveCategory: "NONE", citations: ["all lunch orders", "ランチ利用時"].map(phrase => {
      const documents: WireDocument[] = JSON.parse(input.messages[1]!.content).sourceDocuments;
      const statement = documents.flatMap(document => document.statements).find(row => row.text.includes(phrase))!;
      return wireCitation(input, statement.text);
    }),
  }));
  assert.equal(result.status, "ANSWERED");
  assert.ok(result.status === "ANSWERED", "both sides of the source conflict remain cited");
  assert.equal(result.confirmationRequired, true, "source conflict needs confirmation even for a non-sensitive question");
  assert.equal(result.sensitiveCategory, "NONE");
  assert.equal(result.citations.length, 2);
  assert.match(request.messages[0]!.content, /do not resolve[\s\S]*?conflict/iu);
});

test("G1 quality dietary preferences: Q14 prompt keeps vegan preferences in NONE unless allergies are involved", async () => {
  const { result, request } = await answer(sourcePage("sen", "Restaurant information\nShibuya Sushi Sen"), "Do they offer a vegan course with no egg, dairy, or fish stock?", () => ({
    status: "NOT_STATED", answer: null, sensitiveCategory: "NONE", citations: [],
  }));
  assert.equal(result.status, "NOT_STATED");
  assert.ok(result.status === "NOT_STATED", "unknown dietary preference remains a bounded absence");
  assert.equal(result.sensitiveCategory, "NONE");
  assert.equal(result.confirmationRequired, false);
  assert.match(request.messages[0]!.content, /vegetarian[\s\S]*?vegan[\s\S]*?gluten-free[\s\S]*?NONE[\s\S]*?allerg/iu,
    "classification guidance reaches the model; code does not classify questions by keywords");
});
