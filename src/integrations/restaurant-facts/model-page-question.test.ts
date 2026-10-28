import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { ModelGateway, ModelRequest } from "../../core/model/contracts.js";
import type { RestaurantCandidate, RestaurantCandidateFactRequest, RestaurantReadEvidence } from "../../domains/restaurant/contracts.js";
import type { BrowserRuntime, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { publicPriceText } from "../restaurant-availability/source-price-facts.js";
import type { RestaurantFactPageObservation } from "./fact-source-document.js";
import { GoogleListedWebsiteFactRead } from "./google-listed-website-facts.js";
import { ModelRestaurantFactJudgment } from "./model-fact-judgment.js";
import { NativeSourceFactRead } from "./native-source-facts.js";
import { ModelRestaurantPageQuestion, type RestaurantPageQuestion, type RestaurantQuestionSensitiveCategory } from "./model-page-question.js";

// Inline synthetic merchant, no network. Saved-source fragment is read in place below.
const sourceUrl = "https://merchant.example/venue";
const candidate: RestaurantCandidate = { restaurant: { id: "shown-a", outletName: "Cafe Fixture", address: "1-1 Ginza, Tokyo", sourceIds: { googleWebsiteUri: sourceUrl }, provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" };
const request: RestaurantCandidateFactRequest = { candidateIds: [candidate.restaurant.id], candidates: [candidate], readRunId: "current-run", intent: { timezone: "Asia/Tokyo", target: { goal: "RECOMMENDATION", query: "cafe" }, area: { query: "Ginza" }, criteria: [] } };
const readAt = "2026-10-26T20:00:00Z";
const identity: RestaurantReadEvidence = { evidenceId: "identity-a", kind: "ENTITY_MATCH", provider: "RESTAURANT_WEBSITE", candidateId: candidate.restaurant.id, sourceEntityId: "venue-a", sourceUrl, observedAt: readAt, requestFingerprint: "fixture", claims: { outletName: "Cafe Fixture", address: "1-1 Ginza, Tokyo" }, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_NAME_AND_ADDRESS"] } };
const quote = "Credit cards accepted: Visa and MasterCard.";
const signal = () => new AbortController().signal;
const now = () => "2026-10-26T20:01:00Z";
function page(text = quote): RestaurantFactPageObservation {
  return { readRunId: request.readRunId, requestedSourceUrl: sourceUrl, candidateId: candidate.restaurant.id,
    observedAt: readAt, identity: structuredClone(identity), snapshot: { url: sourceUrl, title: "Cafe Fixture", text, html: "<main>synthetic public merchant</main>", settlement: "SETTLED" } };
}
function question(pages: RestaurantFactPageObservation[] = [page()], text = "Can I pay by credit card?"): RestaurantPageQuestion {
  return { question: text, displayedOutlet: { candidateId: candidate.restaurant.id, sourceUrl },
    readContext: { runId: request.readRunId!, startedAt: "2026-10-26T19:59:00Z" }, cachedPages: pages };
}
type Output = (request: ModelRequest) => unknown;
function fixtureModel(output: Output, calls: ModelRequest[] = []): ModelGateway {
  return { complete: async input => {
    calls.push(input);
    return { invocationId: "fixture-question", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS", latencyMs: 0, outputText: JSON.stringify({ sourceConflict: false, ...output(input) as object }) };
  } };
}
function selected(text: string, answer = "The page states this information.", sensitiveCategory: RestaurantQuestionSensitiveCategory = "NONE"): Output {
  return input => {
    const documents = JSON.parse(input.messages[1]!.content).sourceDocuments;
    for (const document of documents) {
      const statement = document.statements.find((statement: { text: string }) => statement.text === text);
      if (statement) return { status: "ANSWERED", answer, sensitiveCategory, citations: [{ documentId: document.id, statementId: statement.id, quote: text }] };
    }
    assert.fail("test quotation not supplied to model");
  };
}
function runtime(snapshot: BrowserSnapshot, navigated: string[]): BrowserRuntime {
  return { openSession: async () => ({
    metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: readAt },
    navigate: async url => { navigated.push(url); }, snapshot: async () => snapshot, observeControls: async () => [],
    click: async () => {}, fill: async () => {}, select: async () => [], waitFor: async () => {}, waitForSettled: async () => true,
    screenshot: async () => new Uint8Array(), close: async () => {},
  }) };
}
async function readBoundPages(address: string, text: string, navigated: string[]): Promise<RestaurantFactPageObservation[]> {
  const pages: RestaurantFactPageObservation[] = [];
  const html = `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: candidate.restaurant.outletName, address })}</script>`;
  const oldJudgment = new ModelRestaurantFactJudgment(fixtureModel(() => assert.fail("no HARD criterion model invocation")));
  await new GoogleListedWebsiteFactRead(
    { maxAutomaticElapsedMs: 30_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 },
    runtime({ url: sourceUrl, title: "Cafe Fixture", text, html, settlement: "SETTLED" }, navigated), oldJudgment, () => readAt,
    undefined, undefined, undefined, undefined, observed => pages.push(observed),
  ).inspectFacts(request, signal());
  return pages;
}

test("G1 answers a payment question outside the original request conditions with an exact source quotation", async () => {
  const calls: ModelRequest[] = [], navigated: string[] = [];
  const core = new ModelRestaurantPageQuestion(fixtureModel(selected(quote), calls),
    () => readBoundPages(candidate.restaurant.address!, `${candidate.restaurant.outletName}\n${candidate.restaurant.address}\n${quote}`, navigated), now);
  const result = await core.answer(question([]), signal());
  assert.equal(result.status, "ANSWERED");
  assert.deepEqual(result.citations.map(citation => citation.text), [quote], "a question outside criteria still needs a grounded quoted answer");
  assert.deepEqual(result.citations.map(({ url, readAt }) => ({ url, readAt })), [{ url: sourceUrl, readAt }]);
  assert.deepEqual(navigated, [sourceUrl]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.purpose, "restaurant_page_question");
  assert.deepEqual(request.intent.criteria, [], "do not invent a request condition to reuse the HARD-only path");
});

test("G1 reuses current-run bound pages without opening a new session; whitespace is the only quote normalization", async () => {
  const original = "Credit cards accepted:\tVisa and MasterCard.";
  const model = fixtureModel(input => {
    const result = selected(original)(input) as { citations: Array<{ quote: string }> };
    result.citations[0]!.quote = quote;
    return result;
  });
  const result = await new ModelRestaurantPageQuestion(model, async () => assert.fail("current cache must be reused"), now).answer(question([page(original)]), signal());
  assert.ok(result.status === "ANSWERED");
  assert.equal(result.citations[0]!.text, original, "return original source text, never model spelling");
});

test("G1 an asynchronous model reply cannot attach a quotation to a subsequently mutated cache page", async () => {
  const cached = page();
  const model = fixtureModel(asyncInput => {
    const output = selected(quote)(asyncInput);
    // Same effect as a caller refreshing its shared cache while the model is in flight.
    cached.snapshot.url = "https://merchant.example/other-branch";
    cached.identity.sourceUrl = cached.snapshot.url;
    cached.observedAt = "2026-10-26T20:00:45Z";
    return output;
  });
  const result = await new ModelRestaurantPageQuestion(model, undefined, now).answer(question([cached]), signal());
  assert.ok(result.status === "ANSWERED");
  assert.equal(result.citations[0]!.url, sourceUrl, "quote and metadata must use the same immutable read");
  assert.equal(result.citations[0]!.readAt, readAt);
});

test("G1 rejects fabricated, partial, wrong-document and uncited answers, including a page that says nothing about payment", async t => {
  const controls: Array<[string, Output]> = [
    ["fabricated quotation", input => {
      const result = selected(quote)(input) as { citations: Array<{ quote: string }> }; result.citations[0]!.quote = "Cash only."; return result;
    }],
    ["negation removed", input => {
      const result = selected(quote)(input) as { citations: Array<{ quote: string }> }; result.citations[0]!.quote = "Visa"; return result;
    }],
    ["other document", () => ({ status: "ANSWERED", answer: "Visa is accepted.", sensitiveCategory: "NONE", citations: [{ documentId: "other-branch", statementId: "payment", quote }] })],
    ["uncited answer", () => ({ status: "ANSWERED", citations: [], answer: "Yes, Visa accepted", sensitiveCategory: "NONE" })],
    ["URL override", input => ({ ...selected(quote)(input) as object, url: "https://other.example" })],
  ];
  for (const [name, output] of controls) await t.test(name, async () => {
    const result = await new ModelRestaurantPageQuestion(fixtureModel(output), undefined, now).answer(question(), signal());
    assert.equal(result.status, "UNVERIFIED");
    assert.ok(!("answer" in result), "discard the entire unverified answer");
  });
  const input = question([page("Opening hours: 10:00–18:00")]);
  const invented = fixtureModel(input => {
    const document = JSON.parse(input.messages[1]!.content).sourceDocuments[0];
    return { status: "ANSWERED", answer: "Visa is accepted.", sensitiveCategory: "NONE", citations: [{ documentId: document.id, statementId: document.statements[0].id, quote }] };
  });
  assert.equal((await new ModelRestaurantPageQuestion(invented, undefined, now).answer(input, signal())).status, "UNVERIFIED");
  const absent = await new ModelRestaurantPageQuestion(fixtureModel(() => ({ status: "NOT_STATED", answer: null, sensitiveCategory: "NONE", citations: [] })), undefined, now).answer(input, signal());
  assert.ok(absent.status === "NOT_STATED");
  assert.equal(absent.answer, null);
  assert.equal(absent.confirmationRequired, false);
  assert.deepEqual(absent.checkedPages, [{ url: sourceUrl, readAt }]);
});

test("G1 same name is not the same outlet: existing identity reader rejects the other branch before model answering", async () => {
  const navigated: string[] = [], calls: ModelRequest[] = [];
  const result = await new ModelRestaurantPageQuestion(fixtureModel(selected(quote), calls),
    () => readBoundPages("2-2 Shibuya, Tokyo", quote, navigated), now).answer(question([]), signal());
  assert.equal(result.status, "UNVERIFIED");
  assert.equal(calls.length, 0);
  assert.deepEqual(navigated, [sourceUrl]);
});

test("G1 native page observer preserves the old fact result and only emits after existing same-outlet verification", async () => {
  const nativeUrl = "https://tabelog.com/en/tokyo/A1301/A130101/13111111/";
  const outlet = { ...candidate, restaurant: { ...candidate.restaurant, sourceIds: { tabelog: "tokyo/A1301/A130101/13111111", tabelogNativeDetailUri: nativeUrl } } };
  const snapshot = { ...page().snapshot, url: nativeUrl,
    html: `<link rel="canonical" href="${nativeUrl}"><script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: candidate.restaurant.outletName, address: candidate.restaurant.address })}</script>` };
  const pages: RestaurantFactPageObservation[] = [];
  const native = (observe?: (p: RestaurantFactPageObservation) => void) => new NativeSourceFactRead(
    { maxAutomaticElapsedMs: 30_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 },
    runtime(snapshot, []), { judge: async () => ({ evidence: [] }) }, () => readAt,
    undefined, undefined, undefined, undefined, observe);
  const input = { ...request, candidates: [outlet] };
  const old = await native().inspectFacts(input, signal());
  const observed = await native(p => pages.push(p)).inspectFacts(input, signal());
  assert.deepEqual(observed.evidence, old.evidence);
  assert.deepEqual(observed.factChecks, old.factChecks);
  assert.deepEqual(observed.sourceDocuments, old.sourceDocuments);
  assert.ok(pages.length > 0);
  assert.equal(pages[0]!.identity.entityMatch?.confidence, "HIGH");
  assert.equal(pages[0]!.readRunId, request.readRunId);
  const result = await new ModelRestaurantPageQuestion(fixtureModel(selected(quote)), undefined, now)
    .answer({ ...question(pages), displayedOutlet: { candidateId: candidate.restaurant.id, sourceUrl: nativeUrl } }, signal());
  assert.ok(result.status === "ANSWERED");
  assert.equal(result.citations[0]!.url, nativeUrl);
});

test("G1 rejects stale runs, unbound identities, review providers, changed URLs and incomplete snapshots", async t => {
  const changes: Array<[string, (p: RestaurantFactPageObservation) => void, string]> = [
    ["other run", p => { p.readRunId = "previous-run"; }, "NO_BOUND_PAGE"],
    ["old read", p => { p.observedAt = "2026-10-25T20:00:00Z"; }, "NO_BOUND_PAGE"],
    ["old identity", p => { p.identity.observedAt = "2026-10-25T20:00:00Z"; }, "NO_BOUND_PAGE"],
    ["other candidate", p => { p.identity.candidateId = "same-name-other-branch"; }, "NO_BOUND_PAGE"],
    ["weak identity", p => { p.identity.entityMatch!.confidence = "MEDIUM"; }, "NO_BOUND_PAGE"],
    ["unbound source", p => { p.requestedSourceUrl = "https://reviews.example/venue"; }, "NO_BOUND_PAGE"],
    ["non-page provider", p => { p.identity.provider = "GOOGLE_PLACES"; }, "NO_BOUND_PAGE"],
    ["redirect mismatch", p => { p.snapshot.url += "/other-outlet"; }, "NO_BOUND_PAGE"],
    ["loading", p => { p.snapshot.settlement = "PENDING"; }, "INCOMPLETE_PAGE"],
    ["truncated line", p => { p.snapshot.text = "x".repeat(6_001); }, "INCOMPLETE_PAGE"],
  ];
  for (const [name, change, reason] of changes) await t.test(name, async () => {
    const current = page(); change(current);
    const result = await new ModelRestaurantPageQuestion(fixtureModel(() => assert.fail("no model for unverified page")), undefined, now).answer(question([current]), signal());
    assert.ok(result.status === "UNVERIFIED"); assert.equal(result.reason, reason);
  });
});

test("G1 sensitive questions carry model categories and source paraphrases, rejecting yes/no prefixes", async t => {
  const cases: Array<[RestaurantQuestionSensitiveCategory, string]> = [
    ["ALLERGY", "Please notify staff of allergies; traces of nuts may be present."],
    ["RELIGIOUS_DIET", "Vegetarian menu available on request; no halal certification."],
    ["ACCESSIBILITY", "Entrance has three steps. There is no lift."],
  ];
  for (const [category, text] of cases) await t.test(category, async () => {
    const input = question([page(text)], "What does the page state about my needs?");
    const answer = `The page says: ${text}`;
    const good = await new ModelRestaurantPageQuestion(fixtureModel(selected(text, answer, category)), undefined, now).answer(input, signal());
    assert.ok(good.status === "ANSWERED");
    assert.equal(good.answer, answer);
    assert.equal(good.sensitiveCategory, category);
    assert.equal(good.confirmationRequired, true);
    for (const conclusion of ["Yes, suitable.", "No, unsuitable.", "  “ Yes, suitable.”"]) {
      const bad = await new ModelRestaurantPageQuestion(fixtureModel(selected(text, conclusion, category)), undefined, now).answer(input, signal());
      assert.ok(bad.status === "UNVERIFIED");
      assert.equal(bad.reason, "INVALID_MODEL_OUTPUT");
    }
  });
});

test("G1 reception mode comes from explicit source text without inventory; time-sensitive source statements retain read time", async () => {
  for (const text of ["Walk-ins only. Reservations are not accepted.", "Reservations only.", "Walk-ins and reservations are both welcome.",
    "Cancellation: 50% fee after 17:00 the previous day."]) {
    const result = await new ModelRestaurantPageQuestion(fixtureModel(selected(text)), undefined, now).answer(question([page(text)], "What does this page say about reception or cancellation?"), signal());
    assert.ok(result.status === "ANSWERED");
    assert.equal(result.citations[0]!.text, text);
    assert.equal(result.citations[0]!.readAt, readAt);
    assert.equal(result.citations[0]!.url, sourceUrl);
  }
});

test("G1 each quotation keeps its own page and read time; bounded excerpts cannot establish page silence", async () => {
  const cancellation = "Cancellation: 50% fee after 17:00.";
  const terms = page(cancellation);
  terms.snapshot.url = terms.identity.sourceUrl = sourceUrl + "/terms";
  terms.observedAt = terms.identity.observedAt = "2026-10-26T20:00:30Z";
  terms.identity.evidenceId = "identity-terms";
  const output: Output = input => ({ status: "ANSWERED", answer: "The page states the payment and cancellation terms.", sensitiveCategory: "NONE", citations: [quote, cancellation].flatMap(text =>
    (selected(text)(input) as { citations: unknown[] }).citations) });
  const result = await new ModelRestaurantPageQuestion(fixtureModel(output), undefined, now).answer(question([page(), terms]), signal());
  assert.ok(result.status === "ANSWERED");
  assert.deepEqual(result.citations.map(({ text, url, readAt, identityEvidenceId }) => ({ text, url, readAt, identityEvidenceId })), [
    { text: quote, url: sourceUrl, readAt, identityEvidenceId: identity.evidenceId },
    { text: cancellation, url: terms.snapshot.url, readAt: terms.observedAt, identityEvidenceId: terms.identity.evidenceId },
  ]);
  const partial = question([page(quote + "\n" + "not relevant\n".repeat(55))]);
  const answered = await new ModelRestaurantPageQuestion(fixtureModel(selected(quote)), undefined, now).answer(partial, signal());
  assert.ok(answered.status === "ANSWERED", "retained complete source statements are still quotable");
  const silent = await new ModelRestaurantPageQuestion(fixtureModel(() => ({ status: "NOT_STATED", answer: null, sensitiveCategory: "NONE", citations: [] })), undefined, now).answer(partial, signal());
  assert.ok(silent.status === "NOT_STATED", "G1 covers the whole page beyond the former 50-statement cap");
  const oversized = question([page(quote + "\n" + "source paragraph\n".repeat(4_001))]);
  const incomplete = await new ModelRestaurantPageQuestion(fixtureModel(() => assert.fail("oversized pages must not reach the model")), undefined, now).answer(oversized, signal());
  assert.ok(incomplete.status === "UNVERIFIED");
  assert.equal(incomplete.reason, "INCOMPLETE_PAGE", "a truly oversized page cannot establish absence");
});

test("G1 saved merchant fragment is quoted in place with provenance; it is not a live or identity-validation claim", async () => {
  // Existing exposed 2026-10-19 public merchant fragment. No copying or new fixture.
  const path = new URL("../../harness/browser/fixtures/restaurant-prices/aloft-public-20261019.html", import.meta.url);
  const html = await readFile(path, "utf8");
  const provenance = JSON.parse(await readFile(new URL(path.href + ".provenance.json"), "utf8"));
  assert.equal(createHash("sha256").update(html).digest("hex"), provenance.fixtureSha256);
  assert.equal(provenance.capturedOn, "2026-10-19");
  const savedText = publicPriceText(html);
  assert.ok(savedText.includes("Casual dinner 5 courses"));
  const current = page(savedText);
  // Synthetic already-bound envelope: only the historical literal is under test.
  current.snapshot.html = html;
  current.snapshot.url = current.identity.sourceUrl = current.requestedSourceUrl = provenance.sourceUrl;
  const input = question([current], "Which dinner course is written here?");
  input.displayedOutlet.sourceUrl = provenance.sourceUrl;
  const result = await new ModelRestaurantPageQuestion(fixtureModel(selected(savedText)), undefined, now)
    .answer(input, signal());
  assert.ok(result.status === "ANSWERED");
  assert.equal(result.citations[0]!.text, savedText);
});

test("G1 propagates shared model-budget exhaustion and cancellation instead of inventing an answer", async () => {
  const exhausted = Object.assign(new Error("exhausted"), { code: "MODEL_CALL_BUDGET_EXHAUSTED" });
  await assert.rejects(new ModelRestaurantPageQuestion({ complete: async () => { throw exhausted; } }, undefined, now).answer(question(), signal()), error => error === exhausted);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(new ModelRestaurantPageQuestion(fixtureModel(() => assert.fail("aborted")), undefined, now).answer(question(), controller.signal), { name: "AbortError" });
});

test("G1 revision returns a short English answer with Japanese table label and value quotations", async () => {
  const lines = ["お支払い", "クレジットカード可（VISA、Master）"];
  const answer = "Visa and Mastercard are accepted.";
  const calls: ModelRequest[] = [];
  const model = fixtureModel(input => ({ status: "ANSWERED", answer, sensitiveCategory: "NONE", citations: lines.flatMap(text =>
    (selected(text)(input) as { citations: unknown[] }).citations) }), calls);
  const result = await new ModelRestaurantPageQuestion(model, undefined, now).answer(question([page(lines.join("\n"))]), signal());
  assert.equal(result.status, "ANSWERED");
  assert.equal(result.answer, answer);
  assert.deepEqual(result.citations.map(c => c.text), lines);
  assert.equal(calls[0]!.promptVersion, "3");
  assert.equal(calls[0]!.outputSchema.version, "3");
});

test("G1 rejects a customer review quotation using the visible heading outline, independent of private markers", async () => {
  const current = page("Reviews\nCredit cards accepted: Visa and MasterCard.\nRestaurant information\nOpening hours: 10:00–18:00");
  current.snapshot.html = `<h2 class="private-review" data-testid="private-review">Reviews</h2><p>${quote}</p><h2>Restaurant information</h2><p>Opening hours: 10:00–18:00</p>`;
  const result = await new ModelRestaurantPageQuestion(fixtureModel(selected(quote)), undefined, now).answer(question([current]), signal());
  assert.equal(result.status, "UNVERIFIED", "a customer statement cannot be cited as the merchant's fact");
});

test("G1 returns structured absence and confirmation flags without display boilerplate", async () => {
  for (const category of ["NONE", "ALLERGY"] as const) {
    const result = await new ModelRestaurantPageQuestion(fixtureModel(() => ({ status: "NOT_STATED", answer: null, citations: [], sensitiveCategory: category })), undefined, now)
      .answer(question([page("Opening hours: 10:00–18:00")]), signal());
    assert.equal(result.status, "NOT_STATED");
    assert.equal(result.answer, null);
    assert.equal(result.sensitiveCategory, category);
    assert.equal(result.confirmationRequired, category !== "NONE");
    assert.deepEqual(result.checkedPages, [{ url: sourceUrl, readAt }]);
  }
  const normal = await new ModelRestaurantPageQuestion(fixtureModel(selected(quote, "Yes, Visa and Mastercard are accepted.")), undefined, now).answer(question(), signal());
  assert.equal(normal.status, "ANSWERED");
  assert.equal(normal.answer, "Yes, Visa and Mastercard are accepted.");
  assert.equal(normal.confirmationRequired, false);
});

test("G1 source limits are independent of HARD limits and reject genuinely oversized pages", async () => {
  const longStatement = "Source information: " + "a".repeat(1_650);
  const result = await new ModelRestaurantPageQuestion(fixtureModel(selected(longStatement, "The page contains the stated source information.")), undefined, now)
    .answer(question([page(longStatement)]), signal());
  assert.equal(result.status, "ANSWERED");
  assert.equal(result.citations[0]!.text, longStatement);
  const overStatements = question([page(Array.from({ length: 1_201 }, (_, i) => `Line ${i}`).join("\n"))]);
  const rejected = await new ModelRestaurantPageQuestion(fixtureModel(() => assert.fail("not all statements fit")), undefined, now).answer(overStatements, signal());
  assert.ok(rejected.status === "UNVERIFIED");
  assert.equal(rejected.reason, "INCOMPLETE_PAGE");
});

test("G1 rejects missing or invalid model classifications and malformed answer fields", async t => {
  const invalid: Array<[string, (body: any) => void]> = [
    ["missing conflict flag", body => { body.sourceConflict = undefined; }],
    ["non-boolean conflict flag", body => { body.sourceConflict = "true"; }],
    ["missing category", body => { delete body.sensitiveCategory; }],
    ["unknown category", body => { body.sensitiveCategory = "HEALTH"; }],
    ["non-string category", body => { body.sensitiveCategory = ["NONE"]; }],
    ["empty answer", body => { body.answer = "  "; }],
    ["overlong answer", body => { body.answer = "x".repeat(601); }],
  ];
  for (const [name, change] of invalid) await t.test(name, async () => {
    const model = fixtureModel(input => { const output = selected(quote)(input); change(output); return output; });
    const result = await new ModelRestaurantPageQuestion(model, undefined, now).answer(question(), signal());
    assert.ok(result.status === "UNVERIFIED");
    assert.equal(result.reason, "INVALID_MODEL_OUTPUT");
  });
});

test("G1 preserves a model's concise conflict answer and both source quotations", async () => {
  const positive = "Cards accepted.";
  const negative = "Cards are not accepted at the counter.";
  const answer = "The page gives conflicting payment guidance: one statement accepts cards while the counter statement excludes them.";
  const model = fixtureModel(input => ({ status: "ANSWERED", answer, sensitiveCategory: "NONE", citations: [positive, negative].flatMap(text =>
    (selected(text)(input) as { citations: unknown[] }).citations) }));
  const result = await new ModelRestaurantPageQuestion(model, undefined, now).answer(question([page(positive + "\n" + negative)]), signal());
  assert.equal(result.status, "ANSWERED");
  assert.equal(result.answer, answer);
  assert.deepEqual(result.citations.map(citation => citation.text), [positive, negative]);
});

test("G1 review exclusion follows visible headings after private markers are renamed and preserves neighbouring merchant statements", async () => {
  const merchant = "Opening hours: 10:00–18:00";
  for (const marker of ["private-review", "renamed-marker-748"]) {
    const current = page(`Reviews\n${quote}\nRestaurant information\n${merchant}`);
    current.snapshot.html = `<h2 class="${marker}" data-testid="${marker}">Reviews</h2><p>${quote}</p><h2>Restaurant information</h2><p>${merchant}</p>`;
    const denied = await new ModelRestaurantPageQuestion(fixtureModel(selected(quote)), undefined, now).answer(question([current]), signal());
    assert.ok(denied.status === "UNVERIFIED");
    assert.equal(denied.reason, "INVALID_MODEL_OUTPUT");
    const allowed = await new ModelRestaurantPageQuestion(fixtureModel(selected(merchant, "The stated opening hours are 10:00–18:00.")), undefined, now).answer(question([current]), signal());
    assert.equal(allowed.status, "ANSWERED");
    assert.equal(allowed.citations[0]!.text, merchant);
  }
});
