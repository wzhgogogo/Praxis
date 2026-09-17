import assert from "node:assert/strict";
import { test } from "node:test";

import { restaurantAvailabilityRequestFingerprint, type RestaurantTaskState } from "./contracts.js";
import { MAX_AVAILABILITY_CHECK_BATCH, validateRestaurantAction } from "./action-validator.js";
import { restaurantCurrentFactEvidence, restaurantPresentationEvidenceIds } from "./read-assessment.js";
import { applyRestaurantIntentPatch, missingBlockingFields } from "./intent-state.js";
import { restaurantBookingTaskDefinition } from "./task-definition.js";

const incompleteState: RestaurantTaskState = {
  schemaVersion: "10",
  phase: "UNDERSTANDING",
  candidates: [],
  availability: {},
  availabilityChecks: {},
  readEvidence: [],
  searchRevision: 0,
};

const now = "2026-08-05T09:00:00.000Z";

test("Reducer derives missing fields and accumulates a criterion correction deterministically", () => {
  const first = applyRestaurantIntentPatch(undefined, { schemaVersion: "3", date: "2026-08-05", partySize: 2, addCriteria: [{ text: "yakiniku", polarity: "POSITIVE", strength: "UNSPECIFIED" }] });
  const corrected = applyRestaurantIntentPatch(first, { schemaVersion: "3", partySize: 3, area: { query: "Shibuya" }, timeWindow: { earliest: "19:00", latest: "19:30" }, removeCriteria: [{ text: "YAKINIKU", polarity: "POSITIVE", strength: "UNSPECIFIED" }] });
  assert.deepEqual(missingBlockingFields(first), ["timeWindow", "area"]);
  assert.deepEqual(missingBlockingFields(corrected), []);
  assert.equal(corrected.partySize, 3);
  assert.deepEqual(corrected.criteria, []);
});

test("Action validator binds search to complete authoritative intent", () => {
  assert.deepEqual(
    validateRestaurantAction(incompleteState, { type: "SEARCH_RESTAURANTS" }, now),
    { status: "REJECTED", code: "INTENT_INCOMPLETE", reason: "Restaurant search intent is missing required fields" },
  );
  const draft = applyRestaurantIntentPatch(undefined, { schemaVersion: "3", date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2, area: { query: "Shinjuku" }, addCriteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] });
  const state = { ...incompleteState, intentDraft: draft };
  assert.equal(validateRestaurantAction(state, { type: "SEARCH_RESTAURANTS", retrievalHint: "broaden omakase search" }, now).status, "ALLOWED");
});

test("Availability keeps its delivery goal while candidate discovery waits only for discovery inputs", () => {
  const state: RestaurantTaskState = {
    ...incompleteState,
    intentDraft: applyRestaurantIntentPatch(undefined, {
      schemaVersion: "3",
      target: { goal: "AVAILABILITY", query: "find a team-dinner table" },
      date: "2026-08-07",
      partySize: 10,
      area: { query: "near Shibuya" },
      addCriteria: [{ text: "after work", polarity: "POSITIVE", strength: "HARD" }],
    }),
  };

  assert.equal(
    validateRestaurantAction(state, { type: "SEARCH_RESTAURANTS" }, now).status,
    "ALLOWED",
    "candidate discovery has no current time-window parameter to bind",
  );
  assert.deepEqual(
    validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["unknown"] }, now),
    { status: "REJECTED", code: "INTENT_INCOMPLETE", reason: "Restaurant intent is missing required fields" },
    "a slot read still fails closed until it has its own complete parameters",
  );
});

test("A fact-only cafe request can present opening-hours-grounded results and may optionally investigate availability when parameters are complete", () => {
  const candidateId = "cafe-a";
  const draft = applyRestaurantIntentPatch(undefined, {
    schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "recommend a cafe" }, date: "2026-08-05", timeWindow: { earliest: "12:00", latest: "17:00" }, partySize: 2,
    area: { query: "near Shibuya" }, addCriteria: [{ text: "cafe", polarity: "POSITIVE", strength: "HARD" }],
  });
  const state: RestaurantTaskState = {
    ...incompleteState, phase: "SEARCHING", intentDraft: draft,
    candidates: [{ restaurant: { id: candidateId, outletName: "Cafe A", sourceIds: { googlePlaces: "place-a" }, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" }],
    readEvidence: [
      { evidenceId: "area", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId, sourceEntityId: "place-a", observedAt: now, requestFingerprint: "request", claims: { areaQuery: "near Shibuya", areaMatch: true } },
      { evidenceId: "entity", kind: "ENTITY_MATCH", provider: "GOOGLE_PLACES", candidateId, sourceEntityId: "place-a", observedAt: now, requestFingerprint: "request", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["GOOGLE_PLACE_ID"] } },
      { evidenceId: "facts", kind: "RESTAURANT_FACT", provider: "GOOGLE_PLACES", candidateId, sourceEntityId: "place-a", observedAt: now, requestFingerprint: "request", claims: { verifiedHardCriteria: ["cafe"], openingHoursMatch: true, openingHoursMatchedWindow: ["12:00", "17:00"] } },
    ],
  };
  assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: [candidateId] }, now).status, "ALLOWED");
  assert.deepEqual(validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now), { status: "ALLOWED" });
});

test("an unscheduled recommendation can present place facts without inventing opening hours", () => {
  const candidateId = "cafe-unscheduled";
  const draft = applyRestaurantIntentPatch(undefined, {
    schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "recommend a cafe" }, area: { query: "Ginza" },
    addCriteria: [{ text: "cafe", polarity: "POSITIVE", strength: "HARD" }],
  });
  const state: RestaurantTaskState = {
    ...incompleteState, phase: "SEARCHING", intentDraft: draft,
    candidates: [{ restaurant: { id: candidateId, outletName: "Cafe A", sourceIds: { googlePlaces: "place-a" }, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" }],
    readEvidence: [
      { evidenceId: "area", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId, observedAt: now, requestFingerprint: "request", claims: { areaQuery: "Ginza", areaMatch: true } },
      { evidenceId: "entity", kind: "ENTITY_MATCH", provider: "GOOGLE_PLACES", candidateId, observedAt: now, requestFingerprint: "request", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["GOOGLE_PLACE_ID"] } },
      { evidenceId: "facts", kind: "RESTAURANT_FACT", provider: "GOOGLE_PLACES", candidateId, observedAt: now, requestFingerprint: "request", claims: { verifiedHardCriteria: ["cafe"] } },
    ],
  };
  assert.equal(validateRestaurantAction(state, { type: "SEARCH_RESTAURANTS" }, now).status, "ALLOWED");
  assert.deepEqual(validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now), { status: "ALLOWED" });
});

test("The requested goal, not party size, determines whether availability evidence is required", () => {
  const candidateId = "cafe-a";
  const common = {
    schemaVersion: "3" as const, date: "2026-08-05", timeWindow: { earliest: "12:00", latest: "17:00" }, partySize: 2,
    area: { query: "near Shibuya" }, addCriteria: [{ text: "cafe", polarity: "POSITIVE" as const, strength: "HARD" as const }],
  };
  const state: RestaurantTaskState = {
    ...incompleteState, phase: "SEARCHING",
    candidates: [{ restaurant: { id: candidateId, outletName: "Cafe A", sourceIds: { googlePlaces: "place-a" }, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" }],
    readEvidence: [
      { evidenceId: "area", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId, sourceEntityId: "place-a", observedAt: now, requestFingerprint: "request", claims: { areaQuery: "near Shibuya", areaMatch: true } },
      { evidenceId: "entity", kind: "ENTITY_MATCH", provider: "GOOGLE_PLACES", candidateId, sourceEntityId: "place-a", observedAt: now, requestFingerprint: "request", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["GOOGLE_PLACE_ID"] } },
      { evidenceId: "facts", kind: "RESTAURANT_FACT", provider: "GOOGLE_PLACES", candidateId, sourceEntityId: "place-a", observedAt: now, requestFingerprint: "request", claims: { verifiedHardCriteria: ["cafe"], openingHoursMatch: true } },
    ],
  };
  const recommendation = { ...state, intentDraft: applyRestaurantIntentPatch(undefined, { ...common, target: { goal: "RECOMMENDATION", query: "recommend a cafe" } }) };
  const availability = { ...state, intentDraft: applyRestaurantIntentPatch(undefined, { ...common, target: { goal: "AVAILABILITY", query: "find a bookable cafe" } }) };
  assert.equal(validateRestaurantAction(recommendation, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now).status, "ALLOWED");
  assert.equal(validateRestaurantAction(availability, { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: [candidateId] }, now).status, "ALLOWED");
  assert.deepEqual(validateRestaurantAction(availability, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now), {
    status: "REJECTED", code: "PRESENTATION_EVIDENCE_MISSING", reason: `Candidate ${candidateId} has no HIGH outlet identity evidence associated with its availability source`,
  });
});

test("An availability goal missing party size asks for input rather than searching as a recommendation", () => {
  const draft = applyRestaurantIntentPatch(undefined, {
    schemaVersion: "3", target: { goal: "AVAILABILITY", query: "find a table" }, date: "2026-08-05",
    timeWindow: { earliest: "19:00", latest: "20:00" }, area: { query: "Shinjuku" },
  });
  assert.deepEqual(validateRestaurantAction({ ...incompleteState, intentDraft: draft }, { type: "SEARCH_RESTAURANTS" }, now), {
    status: "REJECTED", code: "INTENT_INCOMPLETE", reason: "Availability requested but party size is missing",
  });
});

test("A depleted Google discovery budget cannot be bypassed by a new retrieval hint", () => {
  const draft = applyRestaurantIntentPatch(undefined, {
    schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "recommend a cafe" }, date: "2026-08-05",
    timeWindow: { earliest: "12:00", latest: "17:00" }, area: { query: "Shinjuku" },
  });
  assert.deepEqual(validateRestaurantAction({ ...incompleteState, intentDraft: draft, failure: { code: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED", message: "budget exhausted" }, sourceReadState: { googlePlacesSearchBudget: "EXHAUSTED" } }, { type: "SEARCH_RESTAURANTS", retrievalHint: "different wording" }, now), {
    status: "REJECTED", code: "DISCOVERY_UNAVAILABLE", reason: "The local per-run Google request budget is exhausted; changing retrieval wording cannot restore it",
  });
});

test("only a source-confirmed named-place ambiguity asks the user to disambiguate", () => {
  const state: RestaurantTaskState = {
    ...incompleteState,
    phase: "SEARCHING",
    intentDraft: applyRestaurantIntentPatch(undefined, { schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "recommend a cafe" }, area: { query: "near Central Station" } }),
  };
  const result = restaurantBookingTaskDefinition.transition(state, {
    type: "SEARCH_FAILED", code: "GOOGLE_LOCATION_AMBIGUOUS", reason: "multiple source places",
  }, { taskId: "task", runId: "run", now, createId: (prefix) => prefix });
  assert.equal(result.state.phase, "NEEDS_INPUT");
  assert.match(result.state.pendingUserQuestion?.question ?? "", /multiple matching locations/);
  assert.equal(result.state.failure?.code, "GOOGLE_LOCATION_AMBIGUOUS");
});

test("candidate fact investigation is bound to known candidates and cannot repeat the same request", () => {
  const draft = applyRestaurantIntentPatch(undefined, {
    schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "recommend a cafe" }, date: "2026-08-05",
    timeWindow: { earliest: "12:00", latest: "17:00" }, area: { query: "Shinjuku" },
  });
  const state: RestaurantTaskState = {
    ...incompleteState,
    phase: "SEARCHING",
    intentDraft: draft,
    candidates: [{ restaurant: { id: "cafe-a", outletName: "Cafe A", sourceIds: { googlePlaces: "place-a" }, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" }],
  };
  assert.equal(validateRestaurantAction(state, { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: ["cafe-a"] }, now).status, "ALLOWED");
  assert.equal(validateRestaurantAction(state, { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: ["missing"] }, now).status, "REJECTED");
  assert.deepEqual(
    validateRestaurantAction({ ...state, factChecks: { "cafe-a": { status: "UNKNOWN", checkedAt: now, evidenceIds: [], reasonCode: "GOOGLE_TIMEOUT" } } }, { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: ["cafe-a"] }, now),
    { status: "REJECTED", code: "FACTS_ALREADY_CHECKED", reason: "Facts were already checked for cafe-a in this request" },
  );
});

test("Action validator blocks unknown candidates, stale offers, and booking schedule mismatches", () => {
  const draft = applyRestaurantIntentPatch(undefined, { schemaVersion: "3", date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2, area: { query: "Shinjuku" } });
  const state: RestaurantTaskState = {
    ...incompleteState,
    phase: "SEARCHING",
    intentDraft: draft,
    candidates: [{ restaurant: { id: "a", outletName: "A", sourceIds: {}, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" }],
    availability: { a: [{ id: "stale", restaurantId: "a", source: "fixture", dateTime: "2026-08-05T19:00:00+09:00", timezone: "Asia/Tokyo", partySize: 2, bookingMode: "INSTANT", executionMode: "API", checkedAt: now, expiresAt: now }] },
  };
  assert.equal(validateRestaurantAction(state, { type: "SELECT_CANDIDATE", candidateId: "missing" }, now).status, "REJECTED");
  assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["missing"] }, now).status, "REJECTED");
  assert.equal(validateRestaurantAction(state, { type: "SELECT_CANDIDATE", candidateId: "a", offerId: "stale" }, now).status, "REJECTED");
  const fresh = { ...state.availability.a![0]!, id: "fresh", expiresAt: "2026-08-05T09:02:00.000Z" };
  const selected = { ...state, selectedCandidateId: "a", selectedOfferId: "fresh" };
  const book = { type: "BOOK_RESERVATION" as const, candidateId: "a", offerId: "fresh" };
  assert.equal(validateRestaurantAction({ ...selected, availability: { a: [fresh] } }, book, now).status, "REQUIRES_AUTHORIZATION");
  for (const [label, patch] of [
    ["wrong date", { dateTime: "2026-08-06T19:00:00+09:00" }],
    ["wrong party", { partySize: 3 }],
    ["too early", { dateTime: "2026-08-05T18:59:00+09:00" }],
    ["too late", { dateTime: "2026-08-05T19:31:00+09:00" }],
  ] as const) {
    const verdict = validateRestaurantAction({ ...selected, availability: { a: [{ ...fresh, ...patch }] } }, book, now);
    assert.equal(verdict.status, "REJECTED", label);
    if (verdict.status === "REJECTED") assert.equal(verdict.code, "SCHEDULE_MISMATCH", label);
  }

});

test("Action validator rejects availability reads that would repeat a candidate already checked for the current search", () => {
  const draft = applyRestaurantIntentPatch(undefined, { schemaVersion: "3", date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2, area: { query: "Shinjuku" } });
  const state: RestaurantTaskState = {
    ...incompleteState,
    phase: "SEARCHING",
    intentDraft: draft,
    candidates: [
      { restaurant: { id: "a", outletName: "A", sourceIds: {}, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "LOW" },
      { restaurant: { id: "b", outletName: "B", sourceIds: {}, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "LOW" },
    ],
    availabilityChecks: { a: { status: "UNKNOWN", checkedAt: now, evidenceIds: [], reasonCode: "ENTITY_MATCH_UNCERTAIN" } },
  };
  assert.deepEqual(
    validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["a"] }, now),
    { status: "REJECTED", code: "AVAILABILITY_ALREADY_CHECKED", reason: "Availability was already checked for a and no expiry or user refresh permits a recheck" },
  );
  assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["b"] }, now).status, "ALLOWED");
  assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["a", "b"] }, now).status, "REJECTED");
});

test("Action validator keeps investigation batches bounded without truncating the candidate pool", () => {
  const draft = applyRestaurantIntentPatch(undefined, { schemaVersion: "3", date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2, area: { query: "Shinjuku" } });
  const state: RestaurantTaskState = {
    ...incompleteState,
    phase: "SEARCHING",
    intentDraft: draft,
    candidates: Array.from({ length: MAX_AVAILABILITY_CHECK_BATCH + 1 }, (_, index) => ({ restaurant: { id: `candidate-${index}`, outletName: `Candidate ${index}`, sourceIds: {}, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "LOW" as const })),
  };
  assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: state.candidates.slice(0, MAX_AVAILABILITY_CHECK_BATCH).map((item) => item.restaurant.id) }, now).status, "ALLOWED");
  assert.deepEqual(
    validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: state.candidates.map((item) => item.restaurant.id) }, now),
    { status: "REJECTED", code: "AVAILABILITY_BATCH_LIMIT", reason: `Availability checks are limited to ${MAX_AVAILABILITY_CHECK_BATCH} candidates per batch` },
  );
});

test("PRESENT_RESULTS fails closed until area, HARD criterion, identity, and availability are evidenced", () => {
  const candidate = { restaurant: { id: "a", outletName: "A", sourceIds: {}, address: "Shinjuku, Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" as const };
  const draft = applyRestaurantIntentPatch(undefined, {
    schemaVersion: "3", target: { goal: "AVAILABILITY", query: "find a table" }, date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2,
    area: { query: "Shinjuku" }, addCriteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }],
  });
  const base: RestaurantTaskState = {
    ...incompleteState, phase: "SEARCHING", intentDraft: draft, candidates: [candidate],
    availability: { a: [{ id: "fresh", restaurantId: "a", source: "TABELOG", dateTime: "2026-08-05T19:00:00+09:00", timezone: "Asia/Tokyo", partySize: 2, bookingMode: "REQUEST", executionMode: "BROWSER", checkedAt: now, expiresAt: "2026-08-05T09:02:00.000Z", displayExpiresAt: "2026-08-05T09:02:00.000Z" }] },
    availabilityChecks: { a: { status: "AVAILABLE", checkedAt: now, evidenceIds: ["fact", "availability"], displayExpiresAt: "2026-08-05T09:02:00.000Z" } },
  };
  assert.equal(validateRestaurantAction(base, { type: "PRESENT_RESULTS", candidateIds: ["a"] }, now).status, "REJECTED");
  const grounded: RestaurantTaskState = {
    ...base,
    readEvidence: [
      { evidenceId: "discovery", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId: "a", observedAt: now, requestFingerprint: "x", claims: { areaQuery: "Shinjuku", areaMatch: true } },
      { evidenceId: "entity", kind: "ENTITY_MATCH", provider: "TABELOG", candidateId: "a", observedAt: now, requestFingerprint: "x", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["NORMALIZED_NAME_AND_ADDRESS"] } },
      { evidenceId: "fact", kind: "RESTAURANT_FACT", provider: "TABELOG", candidateId: "a", observedAt: now, requestFingerprint: "x", claims: { verifiedHardCriteria: ["omakase"] } },
      { evidenceId: "availability", kind: "AVAILABILITY", provider: "TABELOG", candidateId: "a", observedAt: now, expiresAt: "2026-08-05T09:02:00.000Z", displayExpiresAt: "2026-08-05T09:02:00.000Z", requestFingerprint: "x", claims: { date: "2026-08-05", partySize: 2, visibleSlots: ["19:00"] } },
    ],
  };
  assert.deepEqual(validateRestaurantAction(grounded, { type: "PRESENT_RESULTS", candidateIds: ["a"] }, now), { status: "ALLOWED" });
  const timely = validateRestaurantAction(grounded, { type: "CHECK_AVAILABILITY", candidateIds: ["a"] }, now);
  assert.equal(timely.status, "REJECTED");
  if (timely.status === "REJECTED") assert.equal(timely.code, "AVAILABILITY_ALREADY_CHECKED");
  for (const omitted of grounded.readEvidence) {
    const verdict = validateRestaurantAction({ ...grounded, readEvidence: grounded.readEvidence.filter((item) => item !== omitted) }, { type: "PRESENT_RESULTS", candidateIds: ["a"] }, now);
    assert.equal(verdict.status, "REJECTED", `missing ${omitted.kind}`);
    if (verdict.status === "REJECTED") assert.equal(verdict.code, "PRESENTATION_EVIDENCE_MISSING", omitted.kind);
  }

  const transition = restaurantBookingTaskDefinition.transition(grounded, {
    type: "RESULTS_PRESENTED", candidateIds: ["a"], evidenceIds: grounded.readEvidence.map((item) => item.evidenceId),
  }, { taskId: "task", runId: "run", now, createId: (prefix) => prefix });
  assert.equal(transition.state.phase, "PRESENT_RESULTS");
  assert.deepEqual(restaurantBookingTaskDefinition.evaluateOutcome(transition.state), {
    status: "PRESENT_RESULTS", candidateIds: ["a"], evidenceIds: grounded.readEvidence.map((item) => item.evidenceId),
  });
});

test("an immediate availability result cannot be presented after its own validity window", () => {
  const candidateId = "immediate";
  const validNow = "2026-08-05T09:00:30.000Z";
  const state: RestaurantTaskState = {
    ...incompleteState,
    phase: "SEARCHING",
    intentDraft: applyRestaurantIntentPatch(undefined, {
      schemaVersion: "3", target: { goal: "AVAILABILITY", query: "right now" }, area: { query: "Shinjuku" }, date: "2026-08-05", timeWindow: { earliest: "18:00", latest: "18:00" }, partySize: 2,
      temporalResolution: {
        policyVersion: "restaurant-temporal-materialization@5", referenceTime: "2026-08-05T09:00:00.000Z", timezone: "Asia/Tokyo",
        timeWindow: { expression: "right now", resolvedTimeWindow: { earliest: "18:00", latest: "18:00" }, basis: "RELATIVE_OFFSET_MINUTES:0" },
        immediateAvailability: { validUntil: "2026-08-05T09:01:00.000Z", sourceSlotPolicy: "EXACT_ONLY" },
      },
    }),
    candidates: [{ restaurant: { id: candidateId, outletName: "Immediate", sourceIds: {}, address: "Shinjuku, Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" }],
    availability: { [candidateId]: [{ id: "slot", restaurantId: candidateId, source: "TABLECHECK", dateTime: "2026-08-05T18:00:00+09:00", timezone: "Asia/Tokyo", partySize: 2, bookingMode: "REQUEST", executionMode: "BROWSER", checkedAt: validNow, expiresAt: "2026-08-05T09:02:00.000Z", displayExpiresAt: "2026-08-05T09:02:00.000Z" }] },
    availabilityChecks: { [candidateId]: { status: "AVAILABLE", checkedAt: validNow, evidenceIds: ["discovery", "entity", "availability"], displayExpiresAt: "2026-08-05T09:02:00.000Z" } },
    readEvidence: [
      { evidenceId: "discovery", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId, observedAt: validNow, requestFingerprint: "d", claims: { areaQuery: "Shinjuku", areaMatch: true } },
      { evidenceId: "entity", kind: "ENTITY_MATCH", provider: "TABLECHECK", candidateId, observedAt: validNow, requestFingerprint: "e", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["NORMALIZED_NAME_AND_ADDRESS"] } },
      { evidenceId: "availability", kind: "AVAILABILITY", provider: "TABLECHECK", candidateId, observedAt: validNow, requestFingerprint: "a", displayExpiresAt: "2026-08-05T09:02:00.000Z", claims: { date: "2026-08-05", partySize: 2, visibleSlots: ["18:00"] } },
    ],
  };
  assert.equal(validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, validNow).status, "ALLOWED");
  const expired = validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, "2026-08-05T09:01:01.000Z");
  assert.equal(expired.status, "REJECTED");
  if (expired.status === "REJECTED") assert.match(expired.reason, /immediate availability observation has expired/);
});

test("Expired display evidence permits a bounded recheck without extending the prior observation", () => {
  const draft = applyRestaurantIntentPatch(undefined, { schemaVersion: "3", date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2, area: { query: "Shinjuku" } });
  const state: RestaurantTaskState = {
    ...incompleteState,
    phase: "SEARCHING",
    intentDraft: draft,
    candidates: [{ restaurant: { id: "a", outletName: "A", sourceIds: {}, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" }],
    availability: { a: [{ id: "old", restaurantId: "a", source: "TABELOG", dateTime: "2026-08-05T19:00:00+09:00", timezone: "Asia/Tokyo", partySize: 2, bookingMode: "REQUEST", executionMode: "BROWSER", checkedAt: "2026-08-05T08:49:00.000Z", expiresAt: "2026-08-05T08:49:00.000Z", displayExpiresAt: "2026-08-05T08:59:00.000Z" }] },
    availabilityChecks: { a: { status: "AVAILABLE", checkedAt: "2026-08-05T08:49:00.000Z", displayExpiresAt: "2026-08-05T08:59:00.000Z", evidenceIds: ["old-evidence"] } },
  };
  assert.deepEqual(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["a"] }, now), { status: "ALLOWED" });
  assert.equal(state.availability.a![0]!.displayExpiresAt, "2026-08-05T08:59:00.000Z");
});

test("User refresh reopens only displayed candidates and preserves prior evidence", () => {
  const state: RestaurantTaskState = {
    ...incompleteState,
    phase: "PRESENT_RESULTS",
    intentDraft: applyRestaurantIntentPatch(undefined, { schemaVersion: "3", date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2, area: { query: "Shinjuku" } }),
    candidates: [{ restaurant: { id: "a", outletName: "A", sourceIds: {}, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" }],
    availability: { a: [{ id: "old-slot", restaurantId: "a", source: "TABELOG", dateTime: "2026-08-05T19:00:00+09:00", timezone: "Asia/Tokyo", partySize: 2, bookingMode: "REQUEST", executionMode: "BROWSER", checkedAt: now, expiresAt: "2026-08-05T09:02:00.000Z", displayExpiresAt: "2026-08-05T09:02:00.000Z" }] },
    availabilityChecks: { a: { status: "AVAILABLE", checkedAt: now, evidenceIds: ["old-evidence"], displayExpiresAt: "2026-08-05T09:02:00.000Z" } },
    readEvidence: [{ evidenceId: "old-evidence", kind: "AVAILABILITY", provider: "TABELOG", candidateId: "a", observedAt: now, requestFingerprint: "x", claims: {} }],
    presentedResults: { candidateIds: ["a"], evidenceIds: ["old-evidence"], presentedAt: now },
  };
  const next = restaurantBookingTaskDefinition.transition(state, { type: "AVAILABILITY_REFRESH_REQUESTED", candidateIds: ["a"] }, { taskId: "task", runId: "run", now, createId: (prefix) => prefix }).state;
  assert.equal(next.phase, "SEARCHING");
  assert.deepEqual(next.refreshRequestedCandidateIds, ["a"]);
  assert.deepEqual(next.readEvidence.map((item) => item.evidenceId), ["old-evidence"]);
  const verdict = validateRestaurantAction(next, { type: "PRESENT_RESULTS", candidateIds: ["a"] }, now);
  assert.equal(verdict.status, "REJECTED");
  if (verdict.status === "REJECTED") assert.equal(verdict.code, "PRESENTATION_EVIDENCE_MISSING");
  assert.equal(validateRestaurantAction(next, { type: "CHECK_AVAILABILITY", candidateIds: ["a"] }, now).status, "ALLOWED");
  const checked = restaurantBookingTaskDefinition.transition(next, {
    type: "AVAILABILITY_CHECKED",
    request: { candidateIds: ["a"], candidates: [next.candidates[0]!], date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2, hardCriteria: [], recheck: { reason: "USER_REQUESTED_REFRESH", previousEvidenceIds: ["old-evidence"] } },
    offers: [], availabilityChecks: { a: { status: "UNKNOWN", checkedAt: now, evidenceIds: [], reasonCode: "AVAILABILITY_SOURCES_EXHAUSTED" } }, evidence: [], metadata: { provider: "TABELOG", route: "GENERIC_BROWSER", latencyMs: 1 },
  }, { taskId: "task", runId: "run", now, createId: (prefix) => prefix }).state;
  assert.equal(checked.refreshRequestedCandidateIds, undefined);
  assert.equal(checked.availabilityChecks.a?.status, "UNKNOWN");
  assert.deepEqual(checked.availability.a, [], "A failed current refresh must never restore the old displayed slot");
});

test("Recommendation refresh reopens displayed facts without routing through availability", () => {
  const candidate = { restaurant: { id: "a", outletName: "Cafe A", sourceIds: {}, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" as const };
  const state: RestaurantTaskState = {
    ...incompleteState, phase: "PRESENT_RESULTS",
    intentDraft: applyRestaurantIntentPatch(undefined, { schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "recommend a cafe" }, area: { query: "Tokyo" } }),
    candidates: [candidate], presentedResults: { candidateIds: ["a"], evidenceIds: ["old-facts"], presentedAt: now },
    factChecks: { a: { status: "COMPLETED", checkedAt: now, evidenceIds: ["old-facts"] } },
    readEvidence: [{ evidenceId: "old-facts", kind: "RESTAURANT_FACT", provider: "GOOGLE_PLACES", candidateId: "a", observedAt: now, requestFingerprint: "old", claims: { verifiedHardCriteria: ["cafe"] } }],
  };
  const refreshed = restaurantBookingTaskDefinition.transition(state, { type: "CANDIDATE_FACTS_REFRESH_REQUESTED", candidateIds: ["a"] }, { taskId: "task", runId: "run", now, createId: (prefix) => prefix }).state;
  assert.equal(refreshed.phase, "SEARCHING");
  assert.deepEqual(refreshed.factRefreshRequestedCandidateIds, ["a"]);
  assert.equal(validateRestaurantAction(refreshed, { type: "CHECK_AVAILABILITY", candidateIds: ["a"] }, now).status, "REJECTED");
  assert.equal(validateRestaurantAction(refreshed, { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: ["a"] }, now).status, "ALLOWED");
  assert.equal(validateRestaurantAction(refreshed, { type: "PRESENT_RESULTS", candidateIds: ["a"] }, now).status, "REJECTED");
  const completed = restaurantBookingTaskDefinition.transition(refreshed, {
    type: "CANDIDATE_FACTS_CHECKED", request: { candidateIds: ["a"], candidates: [candidate], intent: { timezone: "Asia/Tokyo", target: { goal: "RECOMMENDATION", query: "recommend a cafe" }, area: { query: "Tokyo" }, criteria: [] } },
    factChecks: { a: { status: "UNKNOWN", checkedAt: now, evidenceIds: [], reasonCode: "WEBSITE_FACT_READ_FAILED" } }, evidence: [], metadata: { provider: "RESTAURANT_WEBSITE", route: "GENERIC_BROWSER", latencyMs: 1 },
  }, { taskId: "task", runId: "run", now, createId: (prefix) => prefix }).state;
  assert.equal(completed.factRefreshRequestedCandidateIds, undefined);
  assert.equal(completed.factChecks?.a?.status, "UNKNOWN");
});

test("a requested website-fact refresh replaces only stale same-source commercial terms", () => {
  const candidate = { restaurant: { id: "a", outletName: "Cafe A", sourceIds: {}, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" as const };
  const state: RestaurantTaskState = {
    ...incompleteState, phase: "PRESENT_RESULTS",
    intentDraft: applyRestaurantIntentPatch(undefined, { schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "recommend a cafe with cancellation details" }, area: { query: "Tokyo" } }),
    candidates: [candidate], presentedResults: { candidateIds: ["a"], evidenceIds: ["old-facts"], presentedAt: now },
    factChecks: { a: { status: "COMPLETED", checkedAt: now, evidenceIds: ["old-facts"], sourceProvider: "RESTAURANT_WEBSITE" } },
    readEvidence: [{
      evidenceId: "website-entity", kind: "ENTITY_MATCH", provider: "RESTAURANT_WEBSITE", candidateId: "a", sourceEntityId: "website:a",
      observedAt: now, requestFingerprint: "old", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] },
    }, {
      evidenceId: "old-facts", kind: "RESTAURANT_FACT", provider: "RESTAURANT_WEBSITE", candidateId: "a", sourceEntityId: "website:a",
      observedAt: now, requestFingerprint: "old", claims: { coursePriceYen: 7500, noShowTerms: "No-show: 100% fee." },
    }],
  };
  const refreshed = restaurantBookingTaskDefinition.transition(state, { type: "CANDIDATE_FACTS_REFRESH_REQUESTED", candidateIds: ["a"] }, { taskId: "task", runId: "run", now, createId: (prefix) => prefix }).state;
  const completed = restaurantBookingTaskDefinition.transition(refreshed, {
    type: "CANDIDATE_FACTS_CHECKED",
    request: { candidateIds: ["a"], candidates: [candidate], intent: { timezone: "Asia/Tokyo", target: { goal: "RECOMMENDATION", query: "recommend a cafe with cancellation details" }, area: { query: "Tokyo" }, criteria: [] }, recheck: { reason: "USER_REQUESTED_REFRESH" } },
    factChecks: { a: { status: "COMPLETED", checkedAt: "2026-08-05T10:00:00.000Z", evidenceIds: ["new-facts"], sourceProvider: "RESTAURANT_WEBSITE" } },
    evidence: [{
      evidenceId: "new-facts", kind: "RESTAURANT_FACT", provider: "RESTAURANT_WEBSITE", candidateId: "a", sourceEntityId: "website:a",
      observedAt: "2026-08-05T10:00:00.000Z", requestFingerprint: "new", claims: { coursePriceYen: 8000, cancellationTerms: "Cancellation: no fee until 17:00." },
    }], metadata: { provider: "RESTAURANT_WEBSITE", route: "GENERIC_BROWSER", latencyMs: 1 },
  }, { taskId: "task", runId: "run", now: "2026-08-05T10:00:00.000Z", createId: (prefix) => prefix }).state;

  assert.deepEqual(completed.factChecks?.a?.supersededEvidenceIds, ["old-facts"]);
  assert.deepEqual(restaurantCurrentFactEvidence(completed, "a").map((evidence) => evidence.evidenceId), ["new-facts"]);
  assert.deepEqual(restaurantCurrentFactEvidence(completed, "a")[0]?.claims, { coursePriceYen: 8000, cancellationTerms: "Cancellation: no fee until 17:00." });
  assert.equal(JSON.stringify(restaurantCurrentFactEvidence(completed, "a")).includes("No-show: 100% fee."), false);
});

test("a fresh UNKNOWN fact observation cannot be masked by a historical qualifying fact", () => {
  const candidateId = "a";
  const state: RestaurantTaskState = {
    ...incompleteState,
    phase: "SEARCHING",
    intentDraft: applyRestaurantIntentPatch(undefined, {
      schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "recommend a cafe" }, area: { query: "Tokyo" },
      addCriteria: [{ text: "cafe", polarity: "POSITIVE", strength: "HARD" }],
    }),
    candidates: [{ restaurant: { id: candidateId, outletName: "Cafe A", address: "Tokyo", sourceIds: {}, provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" }],
    factChecks: { [candidateId]: { status: "UNKNOWN", checkedAt: now, evidenceIds: [], reasonCode: "WEBSITE_FACT_READ_FAILED" } },
    readEvidence: [
      { evidenceId: "area", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId, observedAt: now, requestFingerprint: "request", claims: { areaQuery: "Tokyo", areaMatch: true } },
      { evidenceId: "entity", kind: "ENTITY_MATCH", provider: "GOOGLE_PLACES", candidateId, sourceEntityId: "place", observedAt: now, requestFingerprint: "request", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["GOOGLE_PLACE_ID"] } },
      { evidenceId: "historical-positive", kind: "RESTAURANT_FACT", provider: "GOOGLE_PLACES", candidateId, sourceEntityId: "place", observedAt: now, requestFingerprint: "old", claims: { verifiedHardCriteria: ["cafe"] } },
    ],
  };
  assert.equal(validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now).status, "REJECTED");
  const current = { ...state, factChecks: { [candidateId]: { status: "COMPLETED" as const, checkedAt: now, evidenceIds: ["current-positive"] } }, readEvidence: [...state.readEvidence, { evidenceId: "current-positive", kind: "RESTAURANT_FACT" as const, provider: "GOOGLE_PLACES" as const, candidateId, sourceEntityId: "place", observedAt: now, requestFingerprint: "current", claims: { verifiedHardCriteria: ["cafe"] } }] };
  assert.equal(validateRestaurantAction(current, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now).status, "ALLOWED");
});

test("A completed refresh target does not block another target or permit partial presentation", () => {
  const state: RestaurantTaskState = {
    ...incompleteState,
    phase: "SEARCHING",
    intentDraft: applyRestaurantIntentPatch(undefined, { schemaVersion: "3", date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2, area: { query: "Shinjuku" } }),
    candidates: ["a", "b"].map((id) => ({ restaurant: { id, outletName: id.toUpperCase(), sourceIds: {}, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" as const })),
    refreshRequestedCandidateIds: ["b"],
  };
  assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["b"] }, now).status, "ALLOWED");
  const partial = validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: ["a"] }, now);
  assert.equal(partial.status, "REJECTED");
  if (partial.status === "REJECTED") assert.equal(partial.code, "PRESENTATION_EVIDENCE_MISSING");
  assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["a"] }, now).status, "REJECTED");
});

test("a grounded current no-slot observation excludes a recommendation instead of reviving an older opening-hours fact", () => {
  const candidateId = "cafe-no-slot";
  const draft = applyRestaurantIntentPatch(undefined, {
    schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "recommend a cafe" }, date: "2026-08-05", timeWindow: { earliest: "12:00", latest: "17:00" }, partySize: 2,
    area: { query: "Tokyo" }, addCriteria: [{ text: "cafe", polarity: "POSITIVE", strength: "HARD" }],
  });
  const state: RestaurantTaskState = {
    ...incompleteState, phase: "SEARCHING", intentDraft: draft,
    candidates: [{ restaurant: { id: candidateId, outletName: "Cafe", sourceIds: { googlePlaces: "p" }, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" }],
    readEvidence: [
      { evidenceId: "area", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId, sourceEntityId: "p", observedAt: now, requestFingerprint: "search", claims: { areaQuery: "Tokyo", areaMatch: true } },
      { evidenceId: "identity", kind: "ENTITY_MATCH", provider: "GOOGLE_PLACES", candidateId, sourceEntityId: "p", observedAt: now, requestFingerprint: "search", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["GOOGLE_PLACE_ID"] } },
      { evidenceId: "open-before-slot", kind: "RESTAURANT_FACT", provider: "GOOGLE_PLACES", candidateId, sourceEntityId: "p", observedAt: now, requestFingerprint: "facts", claims: { verifiedHardCriteria: ["cafe"], openingHoursMatch: true } },
      { evidenceId: "no-slot", kind: "AVAILABILITY", provider: "TABLECHECK", candidateId, sourceEntityId: "tablecheck:p", observedAt: now, requestFingerprint: "availability", claims: { date: "2026-08-05", partySize: 2, visibleSlots: [] } },
    ],
  };
  const reduced = restaurantBookingTaskDefinition.transition(state, {
    type: "AVAILABILITY_CHECKED",
    request: {
      candidateIds: [candidateId], candidates: state.candidates, date: "2026-08-05",
      timeWindow: { earliest: "12:00", latest: "17:00" }, partySize: 2, hardCriteria: ["cafe"],
    },
    offers: [],
    availabilityChecks: { [candidateId]: { status: "UNAVAILABLE", checkedAt: now, evidenceIds: ["no-slot"], reasonCode: "NO_MATCHING_SLOT" } },
    evidence: [state.readEvidence[3]!],
    metadata: { provider: "TABLECHECK", route: "GENERIC_BROWSER", latencyMs: 1 },
  }, { taskId: "task", runId: "run", now, createId: (prefix) => prefix }).state;
  assert.equal(
    reduced.availabilityChecks[candidateId]?.requestFingerprint,
    restaurantAvailabilityRequestFingerprint({ date: "2026-08-05", timeWindow: { earliest: "12:00", latest: "17:00" }, partySize: 2 }),
  );
  const verdict = validateRestaurantAction(reduced, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now);
  assert.equal(verdict.status, "REJECTED");
  if (verdict.status === "REJECTED") assert.match(verdict.reason, /no-matching-slot/);
});

test("a provider fact from the current availability observation supplements rather than erases the current fact read", () => {
  const candidateId = "provider-fact";
  const draft = applyRestaurantIntentPatch(undefined, {
    schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "recommend omakase" }, area: { query: "Tokyo" },
    addCriteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }],
  });
  const state: RestaurantTaskState = {
    ...incompleteState, phase: "SEARCHING", intentDraft: draft,
    candidates: [{ restaurant: { id: candidateId, outletName: "Sushi", address: "Tokyo", sourceIds: {}, provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" }],
    factChecks: { [candidateId]: { status: "COMPLETED", checkedAt: now, evidenceIds: ["google-fact"] } },
    availabilityChecks: { [candidateId]: { status: "AVAILABLE", checkedAt: now, evidenceIds: ["provider-identity", "provider-fact", "provider-slot"] } },
    readEvidence: [
      { evidenceId: "area", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId, observedAt: now, requestFingerprint: "search", claims: { areaQuery: "Tokyo", areaMatch: true } },
      { evidenceId: "google-identity", kind: "ENTITY_MATCH", provider: "GOOGLE_PLACES", candidateId, observedAt: now, requestFingerprint: "facts", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["GOOGLE_PLACE_ID"] } },
      { evidenceId: "google-fact", kind: "RESTAURANT_FACT", provider: "GOOGLE_PLACES", candidateId, observedAt: now, requestFingerprint: "facts", claims: {} },
      { evidenceId: "provider-identity", kind: "ENTITY_MATCH", provider: "TABLECHECK", candidateId, observedAt: now, requestFingerprint: "availability", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] } },
      { evidenceId: "provider-fact", kind: "RESTAURANT_FACT", provider: "TABLECHECK", candidateId, observedAt: now, requestFingerprint: "availability", claims: { verifiedHardCriteria: ["omakase"] } },
      { evidenceId: "provider-slot", kind: "AVAILABILITY", provider: "TABLECHECK", candidateId, observedAt: now, requestFingerprint: "availability", claims: {} },
    ],
  };
  assert.equal(validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now).status, "ALLOWED");
  assert.ok(restaurantPresentationEvidenceIds(state, candidateId, now)?.includes("provider-fact"));
});
