import assert from "node:assert/strict";
import { test } from "node:test";

import { validateRestaurantIntentDraft } from "../domains/restaurant/intent-draft.js";
import {
  restaurantIntentEvalFixtureByMessage,
  restaurantIntentEvalV1,
} from "./restaurant-intent-eval-fixtures.js";
import { evaluateRestaurantIntentParser } from "./restaurant-intent-eval.js";

test("fixture Intent Eval establishes a fully-valid schema baseline", async () => {
  const report = await evaluateRestaurantIntentParser(
    {
      id: "fixture-oracle",
      mode: "FIXTURE",
      async parse(input) {
        return restaurantIntentEvalFixtureByMessage.get(input.message);
      },
    },
    restaurantIntentEvalV1,
  );

  assert.equal(report.totalCases, 8);
  assert.equal(report.validOutputRate, 1);
  assert.equal(report.exactMatchRate, 1);
  assert.equal(report.blockingFieldMissRate, 0);
  assert.equal(report.unnecessaryClarificationRate, 0);
  assert.equal(report.p0Errors, 0);
});

test("Intent Eval identifies a missed blocking field as a P0 error", async () => {
  const report = await evaluateRestaurantIntentParser(
    {
      id: "misses-date",
      mode: "REPLAY",
      async parse(input) {
        const expected = restaurantIntentEvalFixtureByMessage.get(input.message);
        if (!expected) {
          return {};
        }
        return input.message.includes("At 7pm")
          ? { ...expected, missingRequiredFields: [] }
          : expected;
      },
    },
    restaurantIntentEvalV1,
  );

  const missedDate = report.cases.find((item) => item.id === "I02-missing-date");
  assert.deepEqual(missedDate?.missedBlockingFields, ["date"]);
  assert.equal(report.blockingFieldMissRate, 0.25);
  assert.equal(report.p0Errors, 1);
});

test("Intent schema validator rejects malformed model output before it reaches Runtime", () => {
  assert.deepEqual(
    validateRestaurantIntentDraft({
      schemaVersion: "1",
      timezone: "Asia/Tokyo",
      date: "tomorrow",
      timeWindow: { earliest: "19:30", latest: "19:00" },
      partySize: 0,
      cuisines: "yakiniku",
      hardConstraints: [],
      softPreferences: [],
      missingRequiredFields: ["restaurantName"],
    }).valid,
    false,
  );
});
