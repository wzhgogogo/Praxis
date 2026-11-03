import assert from "node:assert/strict";
import test from "node:test";
import type { RestaurantReadEvidence, RestaurantTaskState } from "./contracts.js";
import { assessRestaurantConditions } from "./condition-states.js";
import { restaurantCurrentFactEvidence, restaurantPresentationEvidenceIds } from "./read-assessment.js";
import { restaurantBookingTaskDefinition } from "./task-definition.js";

// Minimal construction from D4's saved merchant quotation (2026-11-02).
// Original: 76976645, d4-d6-safety-only/runs/D4/execution.result.json,
// SHA256 d74f901dfa54b5a42e9bfd8823da291b23ecb16c08dd132602e9a11f229eaa18.
// The outer frozen regression checks that original; no historical run is copied.
const id = "outlet", at = "2026-11-02T16:28:47.738Z", expiry = "2026-11-02T16:35:34.467Z";
const url = "https://www.1bangai.org/daioh", quote = "揚げ物メニュー：串カツ、アジフライなど";
function scenario(): RestaurantTaskState {
  const identity: RestaurantReadEvidence = { evidenceId: "identity", candidateId: id, kind: "ENTITY_MATCH", provider: "RESTAURANT_WEBSITE",
    sourceEntityId: "merchant", sourceUrl: url, observedAt: at, requestFingerprint: "identity", claims: {},
    entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_NAME_AND_ADDRESS"] } };
  const source: RestaurantReadEvidence = { ...identity, evidenceId: "document", kind: "RESTAURANT_FACT", requestFingerprint: "page",
    claims: { restaurantTypeFacts: [quote] }, sourceFieldQuotes: [{ field: "CATEGORY", quote, sourceUrl: url }] };
  const judgment: RestaurantReadEvidence = { evidenceId: "judgment", candidateId: id, provider: "MODEL_JUDGMENT", kind: "RESTAURANT_FACT", observedAt: at,
    requestFingerprint: "judgment", claims: { verifiedHardCriteria: ["kushikatsu"], supportingEvidenceIds: [source.evidenceId] } };
  const slotIdentity: RestaurantReadEvidence = { ...identity, evidenceId: "slot-identity", provider: "TABELOG", sourceEntityId: "13173601",
    sourceUrl: "https://tabelog.com/en/tokyo/A1323/A132305/13173601/" };
  const slot: RestaurantReadEvidence = { ...slotIdentity, evidenceId: "slot", kind: "AVAILABILITY", displayExpiresAt: expiry,
    claims: { date: "2026-11-11", partySize: 2, visibleSlots: ["19:00"] } };
  return { schemaVersion: "24", phase: "SEARCHING", searchRevision: 1,
    candidates: [{ restaurant: { id, outletName: "やきとん大王 赤羽店", address: "赤羽", sourceIds: {}, provenance: {} },
      matchReasons: [], warnings: [], executionConfidence: "HIGH" }],
    intentDraft: { schemaVersion: "3", timezone: "Asia/Tokyo", target: { goal: "AVAILABILITY", query: "kushikatsu" }, area: { query: "Akabane" },
      date: "2026-11-11", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" },
      criteria: [{ text: "kushikatsu", polarity: "POSITIVE", strength: "HARD" }] },
    readEvidence: [{ evidenceId: "area", candidateId: id, kind: "DISCOVERY", provider: "RESTAURANT_WEBSITE", observedAt: at,
      requestFingerprint: "area", claims: { areaMatch: true, areaQuery: "Akabane" } }, identity, source, judgment, slotIdentity, slot],
    factChecks: { [id]: { status: "COMPLETED", checkedAt: at, sourceProvider: "RESTAURANT_WEBSITE", evidenceIds: ["identity", "document", "judgment"] } },
    availabilityChecks: { [id]: { status: "AVAILABLE", checkedAt: at, displayExpiresAt: expiry, evidenceIds: ["slot-identity", "slot"] } },
    availability: { [id]: [{ id: "offer", restaurantId: id, source: "TABELOG", dateTime: "2026-11-11T19:00:00+09:00", timezone: "Asia/Tokyo",
      partySize: 2, bookingMode: "INSTANT", executionMode: "BROWSER", checkedAt: at, displayExpiresAt: expiry, expiresAt: expiry }] } };
}
const evidence = (state: RestaurantTaskState, key: string) => state.readEvidence.find(item => item.evidenceId === key)!;
const conditions = (state: RestaurantTaskState) => assessRestaurantConditions(state.intentDraft!, restaurantCurrentFactEvidence(state, id), at);

test("accepted Japanese menu evidence qualifies and persists MET with the original quotation", () => {
  const state = scenario(), ids = restaurantPresentationEvidenceIds(state, id, at);
  assert.ok(ids); assert.ok(ids.includes("judgment"));
  const presented = restaurantBookingTaskDefinition.transition(state, { type: "RESULTS_PRESENTED", candidateIds: [id], evidenceIds: ids },
    { taskId: "task", runId: "run", now: at, createId: prefix => prefix }).state;
  const row = presented.presentedResults!.conditionStates![id]![0]!;
  assert.equal(row.status, "MET");
  assert.deepEqual(row.sources, [{ field: "CATEGORY", quote, sourceUrl: url }]);
  assert.deepEqual(row, conditions(state)[0]);
  assert.doesNotMatch(row.explanation, /speciali[sz](?:e|t)/i);
});

test("unaccepted, foreign, expired and superseded citations cannot project MET or qualify", () => {
  const cases: Array<[string, (state: RestaurantTaskState) => void]> = [
    ["no accepted judgment", state => { evidence(state, "judgment").claims.verifiedHardCriteria = []; }],
    ["foreign outlet", state => { evidence(state, "document").candidateId = "different-outlet"; }],
    ["foreign quote URL", state => { evidence(state, "document").sourceFieldQuotes![0]!.sourceUrl = "https://example.test/other-outlet"; }],
    ["missing supporting page", state => { evidence(state, "judgment").claims.supportingEvidenceIds = ["document", "missing"]; }],
    ["expired page", state => { evidence(state, "document").sourceExpiresAt = "2026-11-02T16:28:47.737Z"; }],
    ["expired judgment", state => { evidence(state, "judgment").expiresAt = "2026-11-02T16:28:47.737Z"; }],
    ["superseded page", state => { state.factChecks![id]!.supersededEvidenceIds = ["document"]; }],
    ["merchant name only", state => { evidence(state, "document").sourceFieldQuotes![0]!.field = "NAME"; }],
    ["customer review only", state => { evidence(state, "document").sourceFieldQuotes![0]!.field = "CUSTOMER_REVIEW"; }],
  ];
  for (const [name, change] of cases) {
    const state = scenario(); change(state);
    assert.equal(conditions(state)[0]?.status, "NOT_CHECKED", name);
    assert.equal(restaurantPresentationEvidenceIds(state, id, at), undefined, name);
  }
});

test("positive menu judgment cannot bypass quoted prices, negative conflicts or service scope", () => {
  const priced = scenario();
  priced.intentDraft!.budgetPerPerson = { max: 6000, currency: "JPY" };
  evidence(priced, "document").priceFacts = { schemaVersion: "restaurant-price-facts@1", listedCoursePricesYen: [
    { kind: "MEAL", meal: "DINNER", amount: 7000, tax: "INCLUDED", quote: "Dinner course JPY 7000", sourceUrl: url },
  ] };
  evidence(priced, "judgment").claims.verifiedHardCriteria = ["kushikatsu", "at most 6000 yen per person"];
  assert.deepEqual(conditions(priced).map(row => row.status), ["MET", "NOT_MET"]);
  assert.equal(restaurantPresentationEvidenceIds(priced, id, at), undefined);

  const negative = scenario();
  negative.intentDraft!.criteria.push({ text: "high-end sushi", polarity: "NEGATIVE", strength: "HARD" });
  evidence(negative, "judgment").claims.categoryUnknownNegativeCriteria = ["high-end sushi"];
  assert.deepEqual(conditions(negative).map(row => row.status), ["MET", "NOT_CHECKED"]);
  assert.ok(restaurantPresentationEvidenceIds(negative, id, at), "the unchanged category-unknown exception is qualification only");
  evidence(negative, "judgment").claims.violatedNegativeCriteria = ["high-end sushi"];
  assert.equal(restaurantPresentationEvidenceIds(negative, id, at), undefined);

  const scoped = scenario();
  for (const key of ["document", "judgment"]) Object.assign(evidence(scoped, key).claims,
    { serviceScopeField: "category", serviceScopeGroup: "service", serviceScopeValue: "private-room" });
  assert.equal(restaurantPresentationEvidenceIds(scoped, id, at), undefined, "venue or another service's menu cannot qualify an unbound offer");
});
