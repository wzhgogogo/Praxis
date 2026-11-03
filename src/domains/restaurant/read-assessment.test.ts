import assert from "node:assert/strict";
import test from "node:test";
import type { RestaurantEvent, RestaurantReadEvidence, RestaurantTaskState } from "./contracts.js";
import { restaurantBookingTaskDefinition } from "./task-definition.js";
import { restaurantCurrentFactEvidence, restaurantPresentationEvidenceIds } from "./read-assessment.js";
import { assessRestaurantConditions } from "./condition-states.js";

// Local construction, 2026-10-29: event order and source observations are
// independent inputs; no source, model or wall-clock wait is required.
const at = "2026-08-19T07:20:00.000Z";
const candidateId = "equal-stamp-outlet";
const url = "https://tabelog.com/tokyo/A1304/A130401/100/";
const candidate = { restaurant: { id: candidateId, outletName: "Same Outlet", address: "Tokyo", sourceIds: {}, provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" as const };
const intent = { timezone: "Asia/Tokyo" as const, target: { goal: "AVAILABILITY" as const, query: "omakase" },
  date: "2026-08-19", timeWindow: { earliest: "19:00", latest: "19:00" }, partySize: 2,
  area: { query: "Tokyo" }, criteria: [{ text: "omakase", polarity: "POSITIVE" as const, strength: "HARD" as const }] };
const identity: RestaurantReadEvidence = { evidenceId: "identity", candidateId, sourceEntityId: "source-outlet", sourceUrl: url,
  kind: "ENTITY_MATCH", provider: "TABELOG", observedAt: at, requestFingerprint: "same-outlet", claims: { outletName: "Same Outlet" }, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_NAME_AND_ADDRESS"] } };
const fact = (id: string): RestaurantReadEvidence => {
  const { entityMatch: _identityOnly, ...source } = identity;
  return { ...source, evidenceId: id, kind: "RESTAURANT_FACT", claims: { verifiedHardCriteria: ["omakase"] },
    sourceFieldQuotes: [{ field: "COURSE_DESCRIPTION", quote: "Omakase course", sourceUrl: url }] };
};
const slot: RestaurantReadEvidence = { ...identity, evidenceId: "slot", kind: "AVAILABILITY", displayExpiresAt: "2026-08-19T07:30:00.000Z",
  claims: { date: intent.date, partySize: intent.partySize, visibleSlots: ["19:00"] } };
const base = (): RestaurantTaskState => ({ schemaVersion: "25", phase: "SEARCHING", candidates: [candidate], intentDraft: { ...intent, schemaVersion: "3" },
  availability: {}, availabilityChecks: {}, searchRevision: 1, readEvidence: [{ evidenceId: "area", candidateId, kind: "DISCOVERY", provider: "TABELOG", observedAt: at,
    requestFingerprint: "area", claims: { areaMatch: true, areaQuery: "Tokyo" } }] });
const facts = (unknown = false): RestaurantEvent => ({ type: "CANDIDATE_FACTS_CHECKED", request: { candidateIds: [candidateId], candidates: [candidate], intent },
  evidence: [identity, ...(unknown ? [] : [fact("investigation-fact")])],
  factChecks: { [candidateId]: { status: unknown ? "UNKNOWN" : "COMPLETED", checkedAt: at, sourceProvider: "TABELOG", evidenceIds: unknown ? [identity.evidenceId] : [identity.evidenceId, "investigation-fact"] } },
  metadata: { provider: "TABELOG", route: "GENERIC_BROWSER", latencyMs: 0 } });
const availability: RestaurantEvent = { type: "AVAILABILITY_CHECKED", request: { candidateIds: [candidateId], candidates: [candidate], date: intent.date, timeWindow: intent.timeWindow, partySize: 2, hardCriteria: ["omakase"] },
  evidence: [identity, fact("availability-fact"), slot],
  availabilityChecks: { [candidateId]: { status: "AVAILABLE", checkedAt: at, displayExpiresAt: slot.displayExpiresAt!, evidenceIds: [identity.evidenceId, "availability-fact", slot.evidenceId] } },
  offers: [{ id: "offer", restaurantId: candidateId, source: "TABELOG", dateTime: "2026-08-19T19:00:00+09:00", timezone: "Asia/Tokyo", partySize: 2,
    bookingMode: "INSTANT", executionMode: "BROWSER", checkedAt: at, displayExpiresAt: slot.displayExpiresAt!, expiresAt: slot.displayExpiresAt! }],
  metadata: { provider: "TABELOG", route: "GENERIC_BROWSER", latencyMs: 0 } };
function apply(state: RestaurantTaskState, event: RestaurantEvent) {
  return restaurantBookingTaskDefinition.transition(state, event, { taskId: "equal-stamp", runId: "equal-stamp", now: at, createId: prefix => prefix }).state;
}

test("equal timestamps preserve later availability facts and supersede earlier ones by reducer event order", () => {
  const laterAvailability = apply(apply(base(), facts()), availability);
  const laterInvestigation = apply(apply(base(), availability), facts());
  // Check the negative direction first so the unfixed test also exercises it.
  assert.deepEqual(laterInvestigation.factChecks?.[candidateId]?.supersededEvidenceIds, ["availability-fact"], "the reducer records the later investigation's invalidation independently of the clock");
  assert.deepEqual(restaurantCurrentFactEvidence(laterInvestigation, candidateId).map(e => e.evidenceId), ["investigation-fact"]);
  assert.ok(!restaurantPresentationEvidenceIds(laterInvestigation, candidateId, at)?.includes("availability-fact"), "a still-referenced earlier availability fact must not reappear in presentation");
  assert.deepEqual(laterAvailability.factChecks?.[candidateId]?.supersededEvidenceIds, []);
  assert.deepEqual(restaurantCurrentFactEvidence(laterAvailability, candidateId).map(e => e.evidenceId), ["investigation-fact", "availability-fact"], "a later availability event's quoted fact is current even at the same timestamp");
  assert.ok(restaurantPresentationEvidenceIds(laterAvailability, candidateId, at)?.includes("availability-fact"), "presentation must cite the later check's raw fact");
  const earlierSourceClock = structuredClone(availability);
  earlierSourceClock.evidence.find(e => e.evidenceId === "availability-fact")!.observedAt = "2026-08-19T07:19:59.999Z";
  const laterEvent = apply(apply(base(), facts()), earlierSourceClock);
  assert.ok(restaurantCurrentFactEvidence(laterEvent, candidateId).some(e => e.evidenceId === "availability-fact"), "event order cannot be replaced with an inclusive timestamp comparison");
  const explicitlySuperseded = structuredClone(laterAvailability);
  explicitlySuperseded.factChecks![candidateId]!.supersededEvidenceIds!.push("availability-fact");
  assert.ok(!restaurantCurrentFactEvidence(explicitlySuperseded, candidateId).some(e => e.evidenceId === "availability-fact"), "explicit supersession wins over current check references");
  assert.ok(!restaurantPresentationEvidenceIds(explicitlySuperseded, candidateId, at)?.includes("availability-fact"));
  const unknownInvestigation = apply(apply(base(), availability), facts(true));
  assert.deepEqual(restaurantCurrentFactEvidence(unknownInvestigation, candidateId), [], "a later UNKNOWN read cannot revive earlier qualifying facts");
  assert.equal(restaurantPresentationEvidenceIds(unknownInvestigation, candidateId, at), undefined);
});

for (const row of [
    { name: "merchant Japanese menu", field: "SOURCE_TEXT", quote: "揚げ物メニュー：串カツ、アジフライなど", criterion: "kushikatsu", accepted: true },
    { name: "observed H1", field: "NAME", quote: "Kaga Private rooms to Kaiseki", criterion: "kaiseki restaurant", accepted: true },
    { name: "review title", field: "CUSTOMER_REVIEW", quote: "A wonderful Kaiseki experience", criterion: "kaiseki restaurant", accepted: false },
    { name: "review body", field: "CUSTOMER_REVIEW", quote: "We enjoyed the Kaiseki course.", criterion: "kaiseki restaurant", accepted: false },
    { name: "name lacks requested type", field: "NAME", quote: "Same Outlet", criterion: "kaiseki restaurant", accepted: false },
  ] as const) test(`positive HARD source role: ${row.name}`, () => {
    const state = apply(apply(base(), facts()), availability);
    state.intentDraft!.criteria = [{ text: row.criterion, strength: "HARD", polarity: "POSITIVE" }];
    const source = { ...fact("source"), claims: { restaurantTypeFacts: [row.quote], sourceStatementIds: ["statement:0"] },
      sourceFieldQuotes: [{ field: row.field, quote: row.quote, sourceUrl: url }] };
    const judgment: RestaurantReadEvidence = { ...source, evidenceId: "judgment", provider: "MODEL_JUDGMENT", sourceFieldQuotes: undefined,
      claims: { verifiedHardCriteria: [row.criterion], supportingEvidenceIds: [source.evidenceId] } };
    state.readEvidence = [...state.readEvidence.filter(e => e.kind !== "RESTAURANT_FACT"), source, judgment];
    state.factChecks![candidateId]!.evidenceIds = [identity.evidenceId, source.evidenceId, judgment.evidenceId];
    const check = () => restaurantPresentationEvidenceIds(state, candidateId, at);
    const projected = () => assessRestaurantConditions(state.intentDraft!, restaurantCurrentFactEvidence(state, candidateId), at)[0]!;
    assert.equal(Boolean(check()), row.accepted, row.name);
    assert.equal(projected().status, row.accepted ? "MET" : "NOT_CHECKED", row.name);
    if (!row.accepted) return;
    assert.deepEqual(projected().sources, source.sourceFieldQuotes, row.name);
    if (row.field === "NAME") assert.match(projected().explanation, /outlet name/i);
    source.sourceFieldQuotes[0]!.sourceUrl = "https://other-outlet.example/";
    assert.equal(check(), undefined, "a quotation from another page is not source support");
    source.sourceFieldQuotes[0]!.sourceUrl = url;
    source.candidateId = "another-outlet";
    assert.equal(check(), undefined, "other-outlet evidence is not support");
    source.candidateId = candidateId;
    source.sourceExpiresAt = "2026-08-19T07:19:00.000Z";
    assert.equal(check(), undefined, "an expired supporting page cannot qualify a current judgment");
    assert.equal(projected().status, "NOT_CHECKED");
});
