import assert from "node:assert/strict";
import { test } from "node:test";

import type { DecisionState } from "./restaurant-decision-eval-contract.js";
import {
  applyDecisionEvalRelativeTimeToPatch,
  applyDecisionEvalRelativeTimeToState,
  resolveDecisionEvalRelativeTime,
} from "./restaurant-decision-eval-relative-time.js";

const referenceTime = "2026-08-10T10:05:00+09:00";
const emptyState: DecisionState = {
  target: { kind: "OPEN" },
  preferences: [],
  hardConstraints: [],
};

test("relative-time resolver normalizes Tokyo today, tomorrow, tonight, and immediate requests", () => {
  assert.deepEqual(
    resolveDecisionEvalRelativeTime("Find somewhere today.", referenceTime, "Asia/Tokyo"),
    { source: "TODAY", time: { date: "2026-08-10", precision: "DAY" } },
  );
  assert.deepEqual(
    resolveDecisionEvalRelativeTime("Tomorrow evening works.", referenceTime, "Asia/Tokyo"),
    { source: "TOMORROW", time: { date: "2026-08-11", precision: "DAYPART", daypart: "DINNER" } },
  );
  assert.deepEqual(
    resolveDecisionEvalRelativeTime("Tomorrow late night works.", referenceTime, "Asia/Tokyo"),
    { source: "TOMORROW", time: { date: "2026-08-11", precision: "DAYPART", daypart: "LATE_NIGHT" } },
  );
  assert.deepEqual(
    resolveDecisionEvalRelativeTime("Tonight, please.", referenceTime, "Asia/Tokyo"),
    { source: "TONIGHT", time: { date: "2026-08-10", precision: "DAYPART", daypart: "DINNER" } },
  );
  assert.deepEqual(
    resolveDecisionEvalRelativeTime("Can we eat right now?", referenceTime, "Asia/Tokyo"),
    { source: "NOW", time: { date: "2026-08-10", precision: "APPROXIMATE", preferred: "10:05" } },
  );
});

test("relative-time resolver uses Asia/Tokyo rather than the reference timestamp offset", () => {
  assert.deepEqual(
    resolveDecisionEvalRelativeTime("now", "2026-08-10T16:05:00Z", "Asia/Tokyo"),
    { source: "NOW", time: { date: "2026-08-11", precision: "APPROXIMATE", preferred: "01:05" } },
  );
});

test("relative-time resolver refuses ambiguous or conflicting anchors", () => {
  assert.equal(
    resolveDecisionEvalRelativeTime("Today or tomorrow is fine.", referenceTime, "Asia/Tokyo"),
    undefined,
  );
  assert.equal(
    resolveDecisionEvalRelativeTime("Tomorrow, right now.", referenceTime, "Asia/Tokyo"),
    undefined,
  );
  assert.equal(
    resolveDecisionEvalRelativeTime("Lunch or dinner tomorrow.", referenceTime, "Asia/Tokyo"),
    undefined,
  );
  assert.equal(
    resolveDecisionEvalRelativeTime("Not today.", referenceTime, "Asia/Tokyo"),
    undefined,
  );
  assert.equal(
    resolveDecisionEvalRelativeTime("Not right now.", referenceTime, "Asia/Tokyo"),
    undefined,
  );
  assert.deepEqual(
    resolveDecisionEvalRelativeTime("Not today; tomorrow dinner works.", referenceTime, "Asia/Tokyo"),
    { source: "TOMORROW", time: { date: "2026-08-11", precision: "DAYPART", daypart: "DINNER" } },
  );
});

test("relative-time application preserves an existing daypart when a later relative day supplies only the date", () => {
  const tomorrow = resolveDecisionEvalRelativeTime("tomorrow", referenceTime, "Asia/Tokyo");
  const state = applyDecisionEvalRelativeTimeToState(
    { ...emptyState, time: { precision: "DAYPART", daypart: "DINNER" } },
    tomorrow,
  );

  assert.deepEqual(state.time, { date: "2026-08-11", precision: "DAYPART", daypart: "DINNER" });
});

test("relative-time patch composition restores the trusted date on a date-less model daypart", () => {
  const tonight = resolveDecisionEvalRelativeTime("Tonight's dinner.", referenceTime, "Asia/Tokyo");
  const patch = applyDecisionEvalRelativeTimeToPatch(
    emptyState,
    { set: { time: { precision: "DAYPART", daypart: "DINNER" } } },
    tonight,
  );

  assert.deepEqual(patch, {
    set: { time: { date: "2026-08-10", precision: "DAYPART", daypart: "DINNER" } },
  });
});
