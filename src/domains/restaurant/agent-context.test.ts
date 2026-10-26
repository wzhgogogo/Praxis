import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureCandidates, fixtureIntent, fixtureOffers } from "../../harness/restaurant-fixtures.js";
import type { RestaurantTaskState } from "./contracts.js";
import { observedCandidateAvailabilityPath } from "./candidate-read-observations.js";
import { projectRestaurantAgentContext } from "./agent-context.js";

test("Restaurant Agent context retains bounded observations and action scope while excluding execution authority and raw provider artifacts", () => {
  const state: RestaurantTaskState = {
    schemaVersion: "23",
    phase: "SEARCHING",
    intentDraft: { ...fixtureIntent, schemaVersion: "3" },
    intent: fixtureIntent,
    candidates: fixtureCandidates,
    availability: { [fixtureCandidates[0]!.restaurant.id]: [fixtureOffers[0]!] },
    availabilityChecks: { [fixtureCandidates[0]!.restaurant.id]: { status: "AVAILABLE", checkedAt: "2026-08-05T09:00:00.000Z", evidenceIds: [] } },
    readEvidence: [],
    searchRevision: 1,
    selectedCandidateId: fixtureCandidates[0]!.restaurant.id,
    selectedOfferId: fixtureOffers[0]!.id,
    proposal: {
      id: "proposal:private",
      taskId: "task-1",
      actionType: "BOOK",
      target: { type: "RESTAURANT_OUTLET", id: fixtureCandidates[0]!.restaurant.id },
      termsHash: "private-terms-hash",
      risk: "LOW",
      reversible: true,
    },
    authorization: {
      id: "authorization:private",
      proposalId: "proposal:private",
      scope: "ONE_TIME",
      approvedAt: "2026-08-05T09:00:00.000Z",
      expiresAt: "2026-08-05T09:05:00.000Z",
    },
    activeAttemptId: "attempt:private",
    lastExecutionResult: { status: "SUBMITTED", attemptId: "attempt:private", providerReference: "private-provider-reference", submittedAt: "2026-08-05T09:00:00.000Z" },
    evidence: {
      evidenceId: "evidence:private",
      attemptId: "attempt:private",
      strength: "STRONG",
      source: "MOCK_PROVIDER",
      observedAt: "2026-08-05T09:00:00.000Z",
      artifactRef: { kind: "MOCK", reference: "mock://private" },
      claims: {
        status: "CONFIRMED",
        providerReference: "private-provider-reference",
        restaurantId: fixtureCandidates[0]!.restaurant.id,
        dateTime: fixtureOffers[0]!.dateTime,
        partySize: fixtureOffers[0]!.partySize,
      },
      matchedFields: [],
      missingFields: [],
      conflictingFields: [],
    },
    reservation: {
      providerReference: "private-provider-reference",
      restaurantId: fixtureCandidates[0]!.restaurant.id,
      dateTime: fixtureOffers[0]!.dateTime,
      partySize: fixtureOffers[0]!.partySize,
    },
    failure: { code: "SEARCH_FAILED", message: "private provider diagnostic" },
  };

  const context = projectRestaurantAgentContext(state);

  assert.deepEqual(context.missingBlockingFields, []);
  assert.equal(context.schemaVersion, "16");
  assert.deepEqual(context.searchAvailability, { available: true });
  assert.deepEqual(context.failure, { code: "SEARCH_FAILED" });
  assert.deepEqual(context.availabilityChecks, {
    [fixtureCandidates[0]!.restaurant.id]: { status: "AVAILABLE", receptionMode: "UNKNOWN" },
  });
  assert.deepEqual(context.candidates[0], {
    id: fixtureCandidates[0]!.restaurant.id,
    outletName: fixtureCandidates[0]!.restaurant.outletName,
    address: fixtureCandidates[0]!.restaurant.address,
    sourceCategories: [],
    availabilityPath: "NONE",
    matchReasons: fixtureCandidates[0]!.matchReasons,
    warnings: fixtureCandidates[0]!.warnings,
    executionConfidence: fixtureCandidates[0]!.executionConfidence,
    observedFacts: {
      verifiedHardCriteria: [],
      verifiedNegativeCriteria: [],
      violatedNegativeCriteria: [],
      openingHoursMatch: false,
      commercialNotes: [],
    },
    sourceAttempts: [],
  });
  assert.deepEqual(context.legalActions.presentResults, []);
  assert.equal(JSON.stringify(context).includes("private-provider-reference"), false);
  assert.equal("proposal" in context, false);
  assert.equal("authorization" in context, false);
  assert.equal("activeAttemptId" in context, false);
  assert.equal("evidence" in context, false);
  assert.equal("reservation" in context, false);
  assert.equal(JSON.stringify(context).includes("mock://private"), false);
});

test("availability path uses the latest observed claim without reusing stale or future direct hints", () => {
  const evidence: RestaurantTaskState["readEvidence"] = [
    { evidenceId: "old-direct", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId: "a", observedAt: "2026-10-10T10:00:00Z", requestFingerprint: "old", claims: { availabilityPath: "DIRECT_SOURCE_PAGE" } },
    { evidenceId: "new-name", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId: "a", observedAt: "2026-10-10T10:01:00Z", requestFingerprint: "new", claims: { availabilityPath: "NAME_RESOLUTION" } },
    { evidenceId: "future-direct", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId: "a", observedAt: "2026-10-10T10:03:00Z", requestFingerprint: "future", claims: { availabilityPath: "DIRECT_SOURCE_PAGE" } },
  ];
  assert.equal(observedCandidateAvailabilityPath(evidence, "a", "2026-10-10T10:02:00Z"), "NAME_RESOLUTION");
  assert.equal(observedCandidateAvailabilityPath(evidence, "a", "2026-10-10T09:59:00Z"), "NONE");
  assert.equal(observedCandidateAvailabilityPath(evidence, "b", "2026-10-10T10:02:00Z"), "NONE");
});

test("Restaurant Agent context exposes a stable exhausted-discovery state without provider internals", () => {
  const context = projectRestaurantAgentContext({
    schemaVersion: "23", phase: "SEARCHING", candidates: [], availability: {}, availabilityChecks: {}, readEvidence: [], searchRevision: 1,
    failure: { code: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED", message: "provider-specific private detail" },
    sourceReadState: { googlePlacesSearchBudget: "EXHAUSTED" },
  });
  assert.deepEqual(context.searchAvailability, { available: false, reason: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" });
  assert.equal(context.legalActions.search, false);
  assert.equal(JSON.stringify(context).includes("provider-specific private detail"), false);
});

test("current identity-bound negative HARD conflict removes an outlet from costly fact and availability reads", () => {
  const candidateId = fixtureCandidates[0]!.restaurant.id;
  const criteria = [{ text: "hot pot restaurant", polarity: "NEGATIVE" as const, strength: "HARD" as const }];
  const context = projectRestaurantAgentContext({
    schemaVersion: "23", phase: "SEARCHING", intentDraft: { ...fixtureIntent, schemaVersion: "3", criteria },
    intent: { ...fixtureIntent, criteria }, candidates: [fixtureCandidates[0]!], availability: {}, availabilityChecks: {}, searchRevision: 1,
    readEvidence: [{ evidenceId: "identity", kind: "ENTITY_MATCH", provider: "GOOGLE_PLACES", candidateId, sourceEntityId: "place-1",
      observedAt: "2026-08-05T09:00:00.000Z", requestFingerprint: "request", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["GOOGLE_PLACE_ID"] } },
    { evidenceId: "hotpot", kind: "RESTAURANT_FACT", provider: "GOOGLE_PLACES", candidateId, sourceEntityId: "place-1",
      observedAt: "2026-08-05T09:00:00.000Z", requestFingerprint: "request", claims: { violatedNegativeCriteria: ["hot pot restaurant"], restaurantTypeFacts: ["hot pot restaurant"] } }],
  });
  assert.equal(context.candidates[0]?.observedFacts.violatedNegativeCriteria.includes("hot pot restaurant"), true);
  assert.equal(context.legalActions.checkAvailability.includes(candidateId), false);
  assert.equal(context.legalActions.investigateCandidateFacts.includes(candidateId), false);
});

test("missing negative HARD evidence stays UNKNOWN and leaves a legal read path", () => {
  const candidateId = fixtureCandidates[0]!.restaurant.id;
  const criteria = [{ text: "hot pot restaurant", polarity: "NEGATIVE" as const, strength: "HARD" as const }];
  const context = projectRestaurantAgentContext({
    schemaVersion: "23", phase: "SEARCHING", intentDraft: { ...fixtureIntent, schemaVersion: "3", criteria },
    intent: { ...fixtureIntent, criteria }, candidates: [fixtureCandidates[0]!], availability: {}, availabilityChecks: {}, readEvidence: [], searchRevision: 1,
  });
  assert.equal(context.candidates[0]?.observedFacts.violatedNegativeCriteria.length, 0);
  assert.equal(context.legalActions.checkAvailability.includes(candidateId), true);
});

test("Restaurant Agent context exposes bounded candidate facts, provider attempts, reception and code-derived next actions", () => {
  const candidateId = fixtureCandidates[0]!.restaurant.id;
  const context = projectRestaurantAgentContext({
    schemaVersion: "23", phase: "SEARCHING", intentDraft: { ...fixtureIntent, schemaVersion: "3" }, intent: fixtureIntent,
    candidates: fixtureCandidates, availability: {}, searchRevision: 1,
    availabilityChecks: {
      [candidateId]: {
        status: "UNAVAILABLE", receptionMode: "WALK_IN_SUPPORTED", checkedAt: "2026-08-05T09:00:00.000Z", evidenceIds: ["fact-a"],
        sourceAttempts: [{ source: "TABLECHECK", outcome: "FAILED", reasonCode: "NO_MATCHING_SLOT" }],
      },
    },
    factChecks: { [candidateId]: { status: "COMPLETED", checkedAt: "2026-08-05T09:00:00.000Z", evidenceIds: ["fact-a"], sourceProvider: "RESTAURANT_WEBSITE" } },
    readEvidence: [{
      evidenceId: "entity-a", kind: "ENTITY_MATCH", provider: "RESTAURANT_WEBSITE", candidateId, sourceEntityId: "official-a",
      observedAt: "2026-08-05T09:00:00.000Z", requestFingerprint: "request-a", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] },
    }, {
      evidenceId: "fact-a", kind: "RESTAURANT_FACT", provider: "RESTAURANT_WEBSITE", candidateId, sourceEntityId: "official-a",
      observedAt: "2026-08-05T09:00:00.000Z", requestFingerprint: "request-a",
      claims: { verifiedHardCriteria: ["yakiniku"], verifiedNegativeCriteria: ["not all-you-can-eat"], openingHoursMatch: true },
    }],
  });
  assert.deepEqual(context.candidates[0]?.observedFacts, {
    verifiedHardCriteria: ["yakiniku"], verifiedNegativeCriteria: ["not all-you-can-eat"], violatedNegativeCriteria: [], openingHoursMatch: true, commercialNotes: [],
  });
  assert.deepEqual(context.candidates[0]?.sourceAttempts, [
    { source: "RESTAURANT_WEBSITE", outcome: "COMPLETED" },
    { source: "TABLECHECK", outcome: "FAILED", reasonCode: "NO_MATCHING_SLOT" },
  ]);
  assert.deepEqual(context.availabilityChecks[candidateId], { status: "UNAVAILABLE", receptionMode: "WALK_IN_SUPPORTED" });
  assert.equal(context.legalActions.endRead, true);
});

test("Restaurant Agent context exposes only current candidate-bound commercial notes with their evidence source", () => {
  const candidateId = fixtureCandidates[0]!.restaurant.id;
  const context = projectRestaurantAgentContext({
    schemaVersion: "23", phase: "SEARCHING", intentDraft: { ...fixtureIntent, schemaVersion: "3" }, intent: fixtureIntent,
    candidates: fixtureCandidates, availability: {}, availabilityChecks: {}, searchRevision: 1,
    factChecks: {
      [candidateId]: {
        status: "COMPLETED", checkedAt: "2026-08-05T09:00:00.000Z", evidenceIds: ["website-current"], sourceProvider: "RESTAURANT_WEBSITE",
        supersededEvidenceIds: ["website-old"],
      },
    },
    readEvidence: [{
      evidenceId: "website-entity", kind: "ENTITY_MATCH", provider: "RESTAURANT_WEBSITE", candidateId, sourceEntityId: "official-a",
      observedAt: "2026-08-05T09:00:00.000Z", requestFingerprint: "entity", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] },
    }, {
      evidenceId: "website-old", kind: "RESTAURANT_FACT", provider: "RESTAURANT_WEBSITE", candidateId, sourceEntityId: "official-a",
      observedAt: "2026-08-05T09:00:00.000Z", requestFingerprint: "old", claims: { noShowTerms: "No-show: 100% fee." },
    }, {
      evidenceId: "website-current", kind: "RESTAURANT_FACT", provider: "RESTAURANT_WEBSITE", candidateId, sourceEntityId: "official-a",
      observedAt: "2026-08-05T10:00:00.000Z", requestFingerprint: "current",
      claims: { listedCourseDetails: ["Lunch course: JPY 6000, tax included; lunch only."], coursePriceYen: 8000, coursePriceTax: "INCLUDED", privateRoomMinimumYen: 20000, cancellationTerms: "Cancellation: no fee until 17:00." },
    }],
  });

  assert.deepEqual(context.candidates[0]?.observedFacts.commercialNotes, [
    { field: "COURSE_DETAILS", value: "Lunch course: JPY 6000, tax included; lunch only.", source: "RESTAURANT_WEBSITE" },
    { field: "COURSE_PRICE", value: "8000 JPY (tax included)", source: "RESTAURANT_WEBSITE" },
    { field: "PRIVATE_ROOM_MINIMUM", value: "20000 JPY", source: "RESTAURANT_WEBSITE" },
    { field: "CANCELLATION", value: "Cancellation: no fee until 17:00.", source: "RESTAURANT_WEBSITE" },
  ]);
  assert.equal(JSON.stringify(context).includes("No-show: 100% fee."), false, "superseded website facts must not reach the Agent");
  assert.equal(JSON.stringify(context).includes("official-a"), false, "source entity ids are evidence internals, not model context");
});

test("C8 source categories remain advisory and source-attributed without changing legal candidates", () => {
  const candidateId=fixtureCandidates[0]!.restaurant.id;
  const state:RestaurantTaskState={schemaVersion:'23',phase:'SEARCHING',intentDraft:{...fixtureIntent,schemaVersion:'3'},intent:fixtureIntent,candidates:[fixtureCandidates[0]!],availability:{},availabilityChecks:{},readEvidence:[],searchRevision:1};
  const before=projectRestaurantAgentContext(state);
  state.readEvidence=[{evidenceId:'discovery-types',kind:'DISCOVERY',provider:'GOOGLE_PLACES',candidateId,sourceEntityId:'place-a',observedAt:'2026-10-10T00:00:00Z',requestFingerprint:'request',claims:{types:['italian_restaurant','restaurant']}},
    {evidenceId:'listing-categories',kind:'DISCOVERY',provider:'TABELOG',candidateId,sourceEntityId:'outlet-a',observedAt:'2026-10-10T00:00:00Z',requestFingerprint:'request',claims:{sourceCategories:['Italian cuisine']}}];
  const after=projectRestaurantAgentContext(state,'2026-10-10T01:00:00Z');
  assert.deepEqual(after.candidates[0]!.sourceCategories,[{source:'GOOGLE_PLACES',values:['italian_restaurant','restaurant']},{source:'TABELOG',values:['Italian cuisine']}]);
  assert.deepEqual(after.legalActions.checkAvailability,before.legalActions.checkAvailability);
  assert.deepEqual(after.presentation,before.presentation);
  assert.deepEqual(after.candidates[0]!.observedFacts.verifiedHardCriteria,[]);
});


test("candidate distance is a bounded source observation without changing legal presentation", () => {
  const candidate = fixtureCandidates[0]!;
  const state: RestaurantTaskState = { schemaVersion: "23", phase: "SEARCHING", intent: fixtureIntent, candidates: [candidate], availability: {}, availabilityChecks: {}, readEvidence: [], searchRevision: 1 };
  const before = projectRestaurantAgentContext(state, "2026-10-11T00:00:00Z");
  state.readEvidence.push({ evidenceId: "distance", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId: candidate.restaurant.id, observedAt: "2026-10-10T00:00:00Z", requestFingerprint: "current", claims: { areaMatch: true, areaMatchBasis: "TASK_LOCATION_RADIUS", distanceMeters: 999.4 } });
  const after = projectRestaurantAgentContext(state, "2026-10-11T00:00:00Z");
  assert.deepEqual((after.candidates[0] as unknown as { distanceObservation?: unknown }).distanceObservation, { meters: 999, centerBasis: "TASK_LOCATION_RADIUS", source: "GOOGLE_PLACES" });
  assert.deepEqual(after.legalActions, before.legalActions);
  assert.deepEqual(after.presentation, before.presentation);
});

test("approved price tolerance compares meals, keeps unknown and distinguishes soft from hard", async () => {
  const { assessRestaurantConditions } = await import("./condition-states.js");
  const { readFileSync } = await import("node:fs");
  const policy = JSON.parse(readFileSync(new URL("./condition-policy.json", import.meta.url), "utf8"));
  assert.equal(policy.aroundPriceTolerance, 0.2, "independent user-approved literal");
  const make = (amount: number, kind: "MEAL" | "ADD_ON" = "MEAL", meal: "DINNER" | "LUNCH" = "DINNER") => ({ evidenceId: "quoted", kind: "RESTAURANT_FACT" as const, provider: "TABELOG" as const, candidateId: "a", sourceUrl: "https://tabelog.com/en/tokyo/A1301/A130101/13295658/", observedAt: "2026-10-19T00:00:00Z", requestFingerprint: "r", claims: {}, priceFacts: { schemaVersion: "restaurant-price-facts@1" as const, listedCoursePricesYen: [{ amount, kind, meal, tax: "INCLUDED" as const, quote: `Dinner course JPY ${amount} tax included`, sourceUrl: "https://tabelog.com/en/tokyo/A1301/A130101/13295658/" }] } });
  const request = { criteria: [{ text: "around 3,000 yen per person", polarity: "POSITIVE" as const, strength: "SOFT" as const }], timeWindow: { earliest: "19:00", latest: "19:00" } };
  for (const [amount, expected] of [[2400, "MET"], [3600, "MET"], [4000, "NOT_MET"]] as const) assert.equal(assessRestaurantConditions(request, [make(amount)])[0]?.status, expected);
  assert.equal(assessRestaurantConditions(request, [make(3300, "ADD_ON")])[0]?.status, "NOT_CHECKED");
  assert.equal(assessRestaurantConditions(request, [make(3300, "MEAL", "LUNCH")])[0]?.status, "NOT_CHECKED");
  assert.equal(assessRestaurantConditions(request, [make(4000), make(3300, "ADD_ON")])[0]?.status, "NOT_MET", "a drink add-on cannot make an expensive meal fit");
  assert.equal(assessRestaurantConditions(request, [])[0]?.status, "NOT_CHECKED");
  const under = { ...request, criteria: [{ ...request.criteria[0]!, text: "no more than 3,000 yen per person" }] };
  assert.equal(assessRestaurantConditions(under, [make(3000)])[0]?.status, "MET");
  assert.equal(assessRestaurantConditions(under, [make(3001)])[0]?.status, "NOT_MET");
});
