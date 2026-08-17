import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import type { RestaurantIntentDraft } from "../../domains/restaurant/contracts.js";
import {
  RESTAURANT_SEMANTIC_HOLDOUT_DATASET_ID,
  RESTAURANT_SEMANTIC_HOLDOUT_DATASET_VERSION,
  RESTAURANT_SEMANTIC_HOLDOUT_REFERENCE_TIME,
  preflightRestaurantSemanticHoldout,
} from "./holdout.js";
import { scoreRestaurantSemanticTurn } from "./scorer.js";

const completeDraft: RestaurantIntentDraft = {
  schemaVersion: "1",
  timezone: "Asia/Tokyo",
  date: "2026-08-21",
  timeWindow: { earliest: "19:00", latest: "19:30" },
  partySize: 2,
  area: { query: "Shinjuku" },
  cuisines: [],
  hardConstraints: [],
  softPreferences: [],
  missingRequiredFields: [],
};

function dataset() {
  return {
    schemaVersion: "1",
    id: RESTAURANT_SEMANTIC_HOLDOUT_DATASET_ID,
    version: RESTAURANT_SEMANTIC_HOLDOUT_DATASET_VERSION,
    cohort: "HOLDOUT",
    contaminationStatus: "CLEAN_HOLDOUT",
    referenceTime: RESTAURANT_SEMANTIC_HOLDOUT_REFERENCE_TIME,
    timezone: "Asia/Tokyo",
    sessions: [
      {
        id: "SH01",
        turns: [
          {
            id: "SH01-T01",
            message: "A private holdout message",
            expectedDraft: completeDraft,
            expectedDecision: { type: "SEARCH" },
          },
        ],
      },
    ],
  };
}

test("v15 Holdout template contains no exposed sample and complete preflight rejects it", async () => {
  const template = JSON.parse(
    await readFile(new URL("./holdout.template.json", import.meta.url), "utf8"),
  ) as unknown;
  const draft = preflightRestaurantSemanticHoldout(template, {
    mode: "DRAFT",
    datasetPath: "holdout.template.json",
  });
  const complete = preflightRestaurantSemanticHoldout(template, {
    mode: "REQUIRE_COMPLETE",
    datasetPath: "holdout.template.json",
  });

  assert.equal(draft.status, "READY_FOR_ANNOTATION");
  assert.deepEqual(draft.stats, { sessions: 0, turns: 0 });
  assert.equal(complete.status, "NOT_READY");
  assert.deepEqual(complete.issues.map((item) => item.code), ["EMPTY_HOLDOUT"]);
});

test("v15 Holdout preflight accepts a complete labelled dataset with the frozen manifest", () => {
  const report = preflightRestaurantSemanticHoldout(dataset(), {
    mode: "REQUIRE_COMPLETE",
    datasetPath: "private.json",
  });

  assert.equal(report.status, "READY_FOR_BASELINE");
  assert.deepEqual(report.stats, { sessions: 1, turns: 1 });
  assert.equal(report.dataset?.sessions[0]?.turns[0]?.expectedDraft.date, "2026-08-21");
});

test("v15 Holdout preflight rejects duplicates, manifest drift, and inconsistent Gold", () => {
  const invalid = structuredClone(dataset()) as unknown as Record<string, unknown>;
  invalid.model = "unfrozen";
  invalid.referenceTime = "2026-08-22T09:00:00+09:00";
  const sessions = invalid.sessions as Array<{ turns: Array<Record<string, unknown>> }>;
  sessions[0]!.turns.push({
    ...sessions[0]!.turns[0]!,
    expectedDecision: { type: "ASK_USER", missingRequiredFields: ["date"] },
  });
  const report = preflightRestaurantSemanticHoldout(invalid, {
    mode: "REQUIRE_COMPLETE",
    datasetPath: "private.json",
  });

  assert.equal(report.status, "NOT_READY");
  assert.ok(report.issues.some((item) => item.code === "INVALID_DATASET_SHAPE"));
  assert.ok(report.issues.some((item) => item.code === "FROZEN_MANIFEST_MISMATCH"));
  assert.ok(report.issues.some((item) => item.code === "DUPLICATE_ID"));
  assert.ok(report.issues.some((item) => item.code === "INVALID_EXPECTED_DECISION"));
});

test("v15 deterministic scorer attributes Draft mismatch before Kernel mismatch", () => {
  const wrongDraft = { ...completeDraft, partySize: 3 };
  const result = scoreRestaurantSemanticTurn({
    actualDraft: wrongDraft,
    expectedDraft: completeDraft,
    actualDecision: { type: "ASK_USER", missingRequiredFields: ["date"] },
    expectedDecision: { type: "SEARCH" },
  });

  assert.deepEqual(result, {
    status: "FAIL",
    firstFailureStage: "SEMANTIC_RESULT",
    error: "Compiled authoritative draft does not match the labelled semantic result",
  });
});
