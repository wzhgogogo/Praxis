import assert from "node:assert/strict";
import test from "node:test";

import { validateRestaurantIntentDraft } from "./intent-draft.js";

test("negative criteria do not accept eval-only exclusion payloads", () => {
  const base = {
    schemaVersion: "3", timezone: "Asia/Tokyo", date: "2026-09-10",
    timeWindow: { earliest: "18:00", latest: "19:00" }, area: { query: "nearby" },
  };
  const invalid = validateRestaurantIntentDraft({
    ...base, criteria: [{ text: "hot pot", polarity: "NEGATIVE", strength: "HARD", typeExclusionTerms: ["hot pot", "shabu shabu"] }],
  });
  assert.deepEqual(invalid, { valid: false, errors: ["criteria must be a valid criterion array"] });
});
