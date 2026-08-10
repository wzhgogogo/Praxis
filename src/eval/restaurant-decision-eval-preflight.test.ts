import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  DecisionEvalDataset,
  DecisionEvalLabeledExpectation,
} from "./restaurant-decision-eval-contract.js";
import { runRestaurantDecisionEvalPreflight } from "./restaurant-decision-eval-preflight.js";
import { restaurantDecisionGoldenSeedV07 as restaurantDecisionGoldenSeedV06 } from "./restaurant-decision-eval-seed.js";

test("Golden Seed structural preflight is ready for evaluator development", () => {
  const report = runRestaurantDecisionEvalPreflight(
    restaurantDecisionGoldenSeedV06,
    "ANNOTATION_DRAFT",
  );

  assert.equal(report.status, "READY_FOR_EVALUATOR");
  assert.equal(report.issues.length, 0);
  assert.equal(report.stats.candidatePools, 7);
  assert.equal(report.stats.candidates, 29);
  assert.equal(report.stats.candidateFacts, 417);
  assert.equal(report.stats.episodes, 7);
  assert.equal(report.stats.turns, 17);
  assert.equal(report.stats.labeledTurns, 17);
  assert.equal(report.stats.pendingTurns, 0);
  assert.deepEqual(report.stats.byInitialClarity, { E1: 3, E2: 2, E3: 2 });
  assert.deepEqual(report.stats.byTargetKind, {
    OPEN: 2,
    CATEGORY: 2,
    BRAND: 2,
    RESTAURANT: 1,
  });
});

test("Golden Seed strict preflight is ready for evaluator development", () => {
  const report = runRestaurantDecisionEvalPreflight(
    restaurantDecisionGoldenSeedV06,
    "REQUIRE_COMPLETE",
  );

  assert.equal(report.status, "READY_FOR_EVALUATOR");
  assert.equal(report.issues.length, 0);
});

test("DGS01 Gold keeps dinner broad while allowing grounded fixture slots", () => {
  const episode = restaurantDecisionGoldenSeedV06.episodes.find(
    (item) => item.id === "DGS01-e1-category-ginza-western",
  );
  const turn = episode?.turns[0];
  assert.ok(turn && turn.expected.annotationStatus === "LABELED");

  assert.deepEqual(turn.expected.accumulatedState.time, {
    date: "2026-08-11",
    precision: "DAYPART",
    daypart: "DINNER",
  });
  assert.deepEqual(turn.expected.accumulatedState.location, {
    kind: "AREA",
    query: "Ginza",
  });
  assert.deepEqual(turn.expected.acceptableNextActions, [{ type: "SHOW_RECOMMENDATIONS" }]);
  assert.equal(turn.expected.forbiddenActionTypes.includes("ASK_CORE_FIELD"), true);
  assert.equal(turn.expected.forbiddenActionTypes.includes("CHECK_AVAILABILITY"), true);
  assert.deepEqual(turn.expected.recommendation?.requiredDiversityAxes, [
    "PRICE_BAND",
    "CUISINE",
  ]);
  assert.deepEqual(turn.expected.recommendation?.forbiddenCandidateIds, [
    "ginza-japanese-kappo-mizu",
  ]);
  assert.equal(
    turn.expected.grounding?.allowedCandidateFactRefs.some((ref) =>
      ref.endsWith(".availability-window"),
    ),
    true,
  );
  assert.equal(
    turn.expected.grounding?.forbiddenClaims.includes(
      "the displayed availability slot matches the user's exact dining time",
    ),
    true,
  );
});

test("DGS02 Gold resolves the requested brand without relaxing constraints", () => {
  const episode = restaurantDecisionGoldenSeedV06.episodes.find(
    (item) => item.id === "DGS02-e1-brand-kinshicho",
  );
  const turn = episode?.turns[0];
  assert.ok(turn && turn.expected.annotationStatus === "LABELED");

  assert.equal(turn.expected.readiness, "AVAILABILITY_READY");
  assert.deepEqual(turn.expected.accumulatedState.time, {
    date: "2026-08-11",
    precision: "EXACT",
    earliest: "19:00",
    latest: "19:00",
  });
  assert.deepEqual(turn.expected.retrieval?.eligibleCandidateIds, [
    "mori-burger-kinshicho-north",
    "mori-burger-olinas",
  ]);
  assert.deepEqual(turn.expected.recommendation?.forbiddenCandidateIds, [
    "mori-burger-kinshicho-south",
    "river-burger-kinshicho",
  ]);
  assert.equal(
    turn.expected.acceptableNextActions.some((action) => action.type === "RESOLVE_BRAND_OUTLET"),
    true,
  );
  assert.equal(
    turn.expected.acceptableNextActions.some((action) => action.type === "PROPOSE_CONSTRAINT_RELAXATION"),
    false,
  );
});

test("DGS03 discovers outlets before availability and preserves approximate time", () => {
  const episode = restaurantDecisionGoldenSeedV06.episodes.find(
    (item) => item.id === "DGS03-e2-restaurant-sora-dining",
  );
  const firstTurn = episode?.turns[0];
  const secondTurn = episode?.turns[1];
  assert.ok(
    firstTurn?.expected.annotationStatus === "LABELED" &&
      secondTurn?.expected.annotationStatus === "LABELED",
  );

  assert.equal(firstTurn.expected.readiness, "NOT_READY");
  assert.deepEqual(firstTurn.expected.outletDiscovery?.candidateIds, [
    "sora-dining-ginza",
    "sora-dining-shinjuku",
  ]);
  assert.equal(firstTurn.expected.retrieval, undefined);
  assert.deepEqual(firstTurn.expected.clarification?.allowedTopics, ["PARTY", "TIME"]);
  assert.deepEqual(secondTurn.visibleOptionIds, [
    "sora-dining-ginza",
    "sora-dining-shinjuku",
  ]);
  assert.deepEqual(secondTurn.expected.accumulatedState.time, {
    date: "2026-08-11",
    precision: "APPROXIMATE",
    preferred: "19:30",
  });
  assert.equal(secondTurn.expected.readiness, "RECOMMENDATION_READY");
  assert.deepEqual(secondTurn.expected.retrieval?.eligibleCandidateIds, [
    "sora-dining-ginza",
    "sora-dining-shinjuku",
  ]);
  assert.deepEqual(secondTurn.expected.recommendation?.forbiddenCandidateIds, [
    "sora-garden-ginza",
  ]);
  assert.equal(secondTurn.expected.forbiddenActionTypes.includes("CHECK_AVAILABILITY"), true);
});

test("Approximate time cannot be silently compiled into a bounded window", () => {
  const dataset = structuredClone(restaurantDecisionGoldenSeedV06);
  const turn = dataset.episodes.find(
    (item) => item.id === "DGS03-e2-restaurant-sora-dining",
  )?.turns[1];
  assert.ok(turn?.expected.annotationStatus === "LABELED" && turn.expected.accumulatedState.time);
  turn.expected.accumulatedState.time.earliest = "19:00";
  turn.expected.accumulatedState.time.latest = "20:00";

  const report = runRestaurantDecisionEvalPreflight(dataset, "ANNOTATION_DRAFT");
  assert.equal(report.status, "INVALID");
  assert.equal(report.issues.some((issue) => issue.rule === "APPROXIMATE_NOT_BOUNDED"), true);
});

test("Date-less DAYPART preserves a known meal period while exact time still requires a date", () => {
  const episode = restaurantDecisionGoldenSeedV06.episodes.find(
    (item) => item.id === "DGS06-e3-friends-correction-allergy",
  );
  const firstTurn = episode?.turns[0];
  assert.ok(firstTurn?.expected.annotationStatus === "LABELED");
  assert.deepEqual(firstTurn.expected.accumulatedState.time, {
    precision: "DAYPART",
    daypart: "DINNER",
  });

  const exactWithoutDate = structuredClone(restaurantDecisionGoldenSeedV06);
  const exactTurn = exactWithoutDate.episodes.find(
    (item) => item.id === "DGS02-e1-brand-kinshicho",
  )?.turns[0];
  assert.ok(exactTurn?.expected.annotationStatus === "LABELED");
  delete exactTurn.expected.statePatch.set?.time?.date;
  delete exactTurn.expected.accumulatedState.time?.date;

  const report = runRestaurantDecisionEvalPreflight(exactWithoutDate, "ANNOTATION_DRAFT");
  assert.equal(report.status, "INVALID");
  assert.equal(report.issues.some((issue) => issue.rule === "PRECISION_REQUIRES_DATE"), true);
});

test("DGS04 waits for core fields, recommends capacity matches, then applies feedback", () => {
  const episode = restaurantDecisionGoldenSeedV06.episodes.find(
    (item) => item.id === "DGS04-e2-team-izakaya",
  );
  const firstTurn = episode?.turns[0];
  const secondTurn = episode?.turns[1];
  const thirdTurn = episode?.turns[2];
  assert.ok(
    firstTurn?.expected.annotationStatus === "LABELED" &&
      secondTurn?.expected.annotationStatus === "LABELED" &&
      thirdTurn?.expected.annotationStatus === "LABELED",
  );

  assert.equal(firstTurn.expected.readiness, "NOT_READY");
  assert.deepEqual(firstTurn.expected.clarification, {
    allowedTopics: ["PARTY", "LOCATION_STRATEGY"],
    maxTopics: 2,
    mustNotAsk: ["DATE", "TIME"],
  });
  assert.equal(firstTurn.expected.retrieval, undefined);

  assert.equal(secondTurn.expected.readiness, "RECOMMENDATION_READY");
  assert.deepEqual(secondTurn.expected.retrieval?.eligibleCandidateIds, [
    "shimbashi-izakaya-kado",
    "shimbashi-izakaya-nagi",
    "shimbashi-izakaya-hachi",
  ]);
  assert.deepEqual(secondTurn.expected.recommendation?.forbiddenCandidateIds, [
    "shimbashi-izakaya-roji",
  ]);

  assert.deepEqual(thirdTurn.expected.statePatch, {
    add: {
      positivePreferences: ["quiet"],
      hardConstraints: ["fully non-smoking"],
    },
  });
  assert.deepEqual(thirdTurn.expected.retrieval?.eligibleCandidateIds, [
    "shimbashi-izakaya-nagi",
    "shimbashi-izakaya-hachi",
  ]);
  assert.deepEqual(thirdTurn.expected.recommendation?.forbiddenCandidateIds, [
    "shimbashi-izakaya-kado",
    "shimbashi-izakaya-roji",
  ]);
  assert.equal(thirdTurn.expected.recommendation?.mustExplainInsufficientCandidates, true);
  assert.equal(
    thirdTurn.expected.grounding?.forbiddenClaims.includes("Hachi is confirmed quiet"),
    true,
  );
});

test("DGS05 recommends after core fields without inventing a food exclusion", () => {
  const episode = restaurantDecisionGoldenSeedV06.episodes.find(
    (item) => item.id === "DGS05-e3-date-ebisu",
  );
  const firstTurn = episode?.turns[0];
  const secondTurn = episode?.turns[1];
  const thirdTurn = episode?.turns[2];
  const fourthTurn = episode?.turns[3];
  assert.ok(
    firstTurn?.expected.annotationStatus === "LABELED" &&
      secondTurn?.expected.annotationStatus === "LABELED" &&
      thirdTurn?.expected.annotationStatus === "LABELED" &&
      fourthTurn?.expected.annotationStatus === "LABELED",
  );

  assert.deepEqual(firstTurn.expected.acceptableNextActions, [
    { type: "ASK_CORE_FIELD", topics: ["DATE", "PARTY"] },
  ]);
  assert.deepEqual(secondTurn.expected.clarification, {
    allowedTopics: ["LOCATION_STRATEGY"],
    maxTopics: 1,
    mustNotAsk: ["DATE", "TIME", "PARTY"],
  });

  assert.equal(thirdTurn.userMessage, "Around Ebisu.");
  assert.equal(thirdTurn.expected.readiness, "RECOMMENDATION_READY");
  assert.deepEqual(thirdTurn.expected.accumulatedState.negativePreferences, []);
  assert.deepEqual(thirdTurn.expected.retrieval?.eligibleCandidateIds, [
    "ebisu-date-lantern-room",
    "ebisu-date-verde-table",
    "ebisu-date-rouge-spice",
    "ebisu-date-atelier-course",
  ]);
  assert.equal(
    thirdTurn.expected.grounding?.forbiddenClaims.includes(
      "the user requested non-spicy food",
    ),
    true,
  );

  assert.deepEqual(fourthTurn.expected.statePatch, {
    add: {
      positivePreferences: ["intimate"],
      negativePreferences: ["tasting menu"],
    },
  });
  assert.deepEqual(fourthTurn.expected.retrieval?.eligibleCandidateIds, [
    "ebisu-date-lantern-room",
  ]);
  assert.equal(fourthTurn.expected.recommendation?.mustExplainInsufficientCandidates, true);
});

test("DGS06 retains a conditional allergy-request option and protects sensitive disclosure", () => {
  const episode = restaurantDecisionGoldenSeedV06.episodes.find(
    (item) => item.id === "DGS06-e3-friends-correction-allergy",
  );
  const firstTurn = episode?.turns[0];
  const secondTurn = episode?.turns[1];
  const thirdTurn = episode?.turns[2];
  const fourthTurn = episode?.turns[3];
  assert.ok(
    firstTurn?.expected.annotationStatus === "LABELED" &&
      secondTurn?.expected.annotationStatus === "LABELED" &&
      thirdTurn?.expected.annotationStatus === "LABELED" &&
      fourthTurn?.expected.annotationStatus === "LABELED",
  );

  assert.deepEqual(firstTurn.expected.acceptableNextActions, [
    { type: "ASK_CORE_FIELD", topics: ["DATE", "PARTY"] },
  ]);
  assert.equal(secondTurn.expected.readiness, "NOT_READY");
  assert.deepEqual(secondTurn.expected.clarification, {
    allowedTopics: ["LOCATION_STRATEGY"],
    maxTopics: 1,
    mustNotAsk: ["DATE", "TIME", "PARTY"],
  });

  assert.deepEqual(thirdTurn.expected.accumulatedState.party, {
    min: 5,
    max: 5,
    precision: "EXACT",
  });
  assert.deepEqual(thirdTurn.expected.accumulatedState.location, {
    kind: "FLEXIBLE",
    scope: "from Ueno",
  });
  assert.deepEqual(thirdTurn.expected.retrieval?.eligibleCandidateIds, [
    "flex-friends-kappo-haru",
    "flex-friends-sakana-table",
    "flex-friends-garden-room",
  ]);
  assert.deepEqual(thirdTurn.expected.recommendation?.forbiddenCandidateIds, [
    "flex-friends-yakitori-matsu",
  ]);
  assert.equal(
    thirdTurn.expected.grounding?.forbiddenClaims.includes(
      "Sakana Table can accommodate severe peanut allergy without restaurant confirmation",
    ),
    true,
  );
  assert.equal(
    thirdTurn.expected.grounding?.forbiddenClaims.includes(
      "a reservation or allergy request may be submitted before the user confirms disclosure of severe peanut allergy",
    ),
    true,
  );
  assert.deepEqual(thirdTurn.expected.grounding?.requiredCandidateDisclosures, [
    {
      candidateId: "flex-friends-kappo-haru",
      type: "ALLERGY_CONFIRMATION_REQUIRED",
      factRef: "flex-friends-kappo-haru.attributes",
    },
    {
      candidateId: "flex-friends-sakana-table",
      type: "ALLERGY_CONFIRMATION_REQUIRED",
      factRef: "flex-friends-sakana-table.attributes",
    },
    {
      candidateId: "flex-friends-garden-room",
      type: "ALLERGY_CONFIRMATION_REQUIRED",
      factRef: "flex-friends-garden-room.attributes",
    },
  ]);

  assert.deepEqual(fourthTurn.expected.statePatch, {
    add: {
      positivePreferences: ["Japanese food"],
      negativePreferences: ["formal"],
    },
  });
  assert.deepEqual(fourthTurn.expected.retrieval?.eligibleCandidateIds, [
    "flex-friends-kappo-haru",
    "flex-friends-sakana-table",
    "flex-friends-garden-room",
  ]);
});

test("DGS07 proposes two single-constraint fallbacks and waits for user choice", () => {
  const episode = restaurantDecisionGoldenSeedV06.episodes.find(
    (item) => item.id === "DGS07-e1-brand-zero-result-relaxation",
  );
  const firstTurn = episode?.turns[0];
  const secondTurn = episode?.turns[1];
  assert.ok(
    firstTurn?.expected.annotationStatus === "LABELED" &&
      secondTurn?.expected.annotationStatus === "LABELED",
  );

  assert.deepEqual(firstTurn.expected.retrieval?.eligibleCandidateIds, []);
  assert.deepEqual(firstTurn.expected.constraintRelaxation, {
    options: [
      { type: "EXPAND_LOCATION", candidateIds: ["fallback-mori-kameido"] },
      {
        type: "RELAX_BRAND_TO_CATEGORY",
        candidateIds: ["fallback-sumida-burger-kinshicho"],
      },
    ],
    requiresUserChoice: true,
  });
  assert.deepEqual(secondTurn.expected.statePatch, {
    set: { location: { kind: "AREA", query: "Kameido" } },
  });
  assert.deepEqual(secondTurn.expected.accumulatedState.target, {
    kind: "BRAND",
    query: "Mori Burger",
  });
  assert.deepEqual(secondTurn.expected.retrieval?.eligibleCandidateIds, [
    "fallback-mori-kameido",
  ]);
});

test("Constraint relaxation fails closed without consent or a strict zero result", () => {
  const withoutConsent = structuredClone(restaurantDecisionGoldenSeedV06);
  const consentTurn = withoutConsent.episodes.find(
    (item) => item.id === "DGS07-e1-brand-zero-result-relaxation",
  )?.turns[0];
  assert.ok(consentTurn?.expected.annotationStatus === "LABELED");
  const relaxation = consentTurn.expected.constraintRelaxation as unknown as {
    requiresUserChoice: boolean;
  };
  relaxation.requiresUserChoice = false;

  const consentReport = runRestaurantDecisionEvalPreflight(withoutConsent, "ANNOTATION_DRAFT");
  assert.equal(consentReport.status, "INVALID");
  assert.equal(consentReport.issues.some((issue) => issue.rule === "RELAXATION_CONSENT"), true);

  const withStrictResult = structuredClone(restaurantDecisionGoldenSeedV06);
  const strictTurn = withStrictResult.episodes.find(
    (item) => item.id === "DGS07-e1-brand-zero-result-relaxation",
  )?.turns[0];
  assert.ok(strictTurn?.expected.annotationStatus === "LABELED" && strictTurn.expected.retrieval);
  strictTurn.expected.retrieval.eligibleCandidateIds = ["fallback-mori-kameido"];

  const strictReport = runRestaurantDecisionEvalPreflight(withStrictResult, "ANNOTATION_DRAFT");
  assert.equal(strictReport.status, "INVALID");
  assert.equal(strictReport.issues.some((issue) => issue.rule === "STRICT_EMPTY_REQUIRED"), true);

  const promotedFallback = structuredClone(restaurantDecisionGoldenSeedV06);
  const promotionTurn = promotedFallback.episodes.find(
    (item) => item.id === "DGS07-e1-brand-zero-result-relaxation",
  )?.turns[0];
  assert.ok(promotionTurn?.expected.annotationStatus === "LABELED");
  promotionTurn.expected.recommendation = {
    minCandidates: 1,
    maxCandidates: 1,
    allowedCandidateIds: ["fallback-mori-kameido"],
    forbiddenCandidateIds: [],
    requiredDiversityAxes: [],
    mustExplainInsufficientCandidates: false,
  };

  const promotionReport = runRestaurantDecisionEvalPreflight(
    promotedFallback,
    "ANNOTATION_DRAFT",
  );
  assert.equal(promotionReport.status, "INVALID");
  assert.equal(
    promotionReport.issues.some(
      (issue) => issue.rule === "RELAXATION_NOT_STRICT_RECOMMENDATION",
    ),
    true,
  );
});

test("Preflight rejects dangling candidate references and duplicate grounding facts", () => {
  const dataset = structuredClone(restaurantDecisionGoldenSeedV06);
  const firstPool = dataset.candidatePools[0];
  const firstCandidate = firstPool?.candidates[0];
  const secondCandidate = firstPool?.candidates[1];
  const firstFact = firstCandidate?.facts[0];
  const secondFact = secondCandidate?.facts[0];
  const feedbackTurn = dataset.episodes[3]?.turns[2];
  assert.ok(firstFact && secondFact && feedbackTurn?.visibleOptionIds);

  firstFact.id = secondFact.id;
  feedbackTurn.visibleOptionIds = ["candidate-that-does-not-exist"];

  const report = runRestaurantDecisionEvalPreflight(dataset, "ANNOTATION_DRAFT");
  assert.equal(report.status, "INVALID");
  assert.equal(report.issues.some((issue) => issue.rule === "UNIQUE_ID"), true);
  assert.equal(report.issues.some((issue) => issue.rule === "VISIBLE_OPTIONS"), true);
});

test("Preflight requires allergy confirmation disclosures to cite the candidate attribute fact", () => {
  const dataset = structuredClone(restaurantDecisionGoldenSeedV06);
  const thirdTurn = dataset.episodes.find(
    (item) => item.id === "DGS06-e3-friends-correction-allergy",
  )?.turns[2];
  assert.ok(thirdTurn?.expected.annotationStatus === "LABELED");
  const disclosure = thirdTurn.expected.grounding?.requiredCandidateDisclosures?.[0];
  assert.ok(disclosure !== undefined);
  disclosure.factRef = "flex-friends-kappo-haru.area";

  const report = runRestaurantDecisionEvalPreflight(dataset, "ANNOTATION_DRAFT");
  assert.equal(report.status, "INVALID");
  assert.equal(report.issues.some((issue) => issue.rule === "ALLERGY_DISCLOSURE_EVIDENCE"), true);
});

test("A fully labeled seed episode passes strict preflight", () => {
  const dataset = structuredClone(restaurantDecisionGoldenSeedV06) as DecisionEvalDataset;
  const episode = dataset.episodes[0];
  const pool = dataset.candidatePools.find((item) => item.id === episode?.candidatePoolRef);
  const turn = episode?.turns[0];
  assert.ok(episode && pool && turn);

  const eligibleCandidateIds = pool.candidates.map((candidate) => candidate.id);
  const accumulatedState = {
    time: {
      date: "2026-08-11",
      precision: "DAYPART" as const,
      daypart: "DINNER" as const,
    },
    party: { min: 4, max: 4, precision: "EXACT" as const },
    location: { kind: "AREA" as const, query: "Ginza" },
    target: { kind: "CATEGORY" as const, query: "Western food" },
    positivePreferences: [],
    negativePreferences: [],
    hardConstraints: [],
  };
  const label: DecisionEvalLabeledExpectation = {
    annotationStatus: "LABELED",
    statePatch: {
      set: {
        time: accumulatedState.time,
        party: accumulatedState.party,
        location: accumulatedState.location,
        target: accumulatedState.target,
      },
    },
    accumulatedState,
    readiness: "RECOMMENDATION_READY",
    acceptableNextActions: [{ type: "SHOW_RECOMMENDATIONS" }],
    forbiddenActionTypes: ["ASK_CORE_FIELD", "CHECK_AVAILABILITY"],
    retrieval: {
      eligibleCandidateIds,
      allowEmpty: false,
      minimumExpected: 3,
    },
    recommendation: {
      minCandidates: 3,
      maxCandidates: 4,
      allowedCandidateIds: eligibleCandidateIds,
      forbiddenCandidateIds: [],
      requiredDiversityAxes: ["PRICE_BAND", "CUISINE"],
      mustExplainInsufficientCandidates: false,
    },
    grounding: {
      allowedStateFactRefs: ["state.time", "state.party", "state.location", "state.target"],
      allowedCandidateFactRefs: pool.candidates.flatMap((candidate) =>
        candidate.facts.map((fact) => fact.id),
      ),
      forbiddenClaims: [
        "the displayed availability slot matches the user's exact dining time",
        "real-world availability verified",
        "availability is guaranteed",
        "booking completed",
      ],
    },
  };
  turn.expected = label;
  dataset.episodes = [episode];

  const report = runRestaurantDecisionEvalPreflight(dataset, "REQUIRE_COMPLETE");
  assert.equal(report.status, "READY_FOR_EVALUATOR");
  assert.deepEqual(report.issues, []);
  assert.equal(report.stats.labeledTurns, 1);
  assert.equal(report.stats.pendingTurns, 0);
});

test("Labeled expectations are checked at runtime instead of trusted from TypeScript", () => {
  const dataset = structuredClone(restaurantDecisionGoldenSeedV06);
  const turn = dataset.episodes[0]?.turns[0];
  assert.ok(turn);
  turn.expected = { annotationStatus: "LABELED" } as unknown as typeof turn.expected;

  const report = runRestaurantDecisionEvalPreflight(dataset, "ANNOTATION_DRAFT");
  assert.equal(report.status, "INVALID");
  assert.equal(report.issues.some((issue) => issue.rule === "STATE_PATCH"), true);
  assert.equal(report.issues.some((issue) => issue.rule === "READINESS"), true);
  assert.equal(report.issues.some((issue) => issue.rule === "ACTIONS_REQUIRED"), true);
});
