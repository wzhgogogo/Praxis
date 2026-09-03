import assert from "node:assert/strict";
import { test } from "node:test";

import {
  RESTAURANT_AGENT_ACTION_STRICT_WIRE_JSON_SCHEMA,
  normalizeRestaurantAgentActionStrictWire,
  validateRestaurantAgentAction,
} from "./agent-action.js";

const searchWire = {
  type: "SEARCH_RESTAURANTS",
  question: "",
  relatedFields: [],
  retrievalHint: "omakase near Shibuya",
  candidateIds: [],
  candidateId: "",
  offerId: "",
  decisionSummary: "Search for matching outlets.",
};

test("strict Agent wire schema requires every provider-facing object property", () => {
  assert.deepEqual(RESTAURANT_AGENT_ACTION_STRICT_WIRE_JSON_SCHEMA.required, [
    "type", "question", "relatedFields", "retrievalHint", "candidateIds", "candidateId", "offerId", "decisionSummary",
  ]);
  assert.equal(RESTAURANT_AGENT_ACTION_STRICT_WIRE_JSON_SCHEMA.additionalProperties, false);
});

test("strict Agent wire output normalizes back into canonical restaurant_agent_action@3", () => {
  const normalized = normalizeRestaurantAgentActionStrictWire(searchWire);
  assert.equal(normalized.valid, true);
  if (!normalized.valid) return;
  assert.deepEqual(validateRestaurantAgentAction(normalized.value), {
    valid: true,
    value: {
      action: { type: "SEARCH_RESTAURANTS", retrievalHint: "omakase near Shibuya" },
      decisionSummary: "Search for matching outlets.",
    },
  });
});

test("strict Agent wire output rejects meaningful fields outside its selected action", () => {
  const normalized = normalizeRestaurantAgentActionStrictWire({ ...searchWire, candidateIds: ["candidate-1"] });
  assert.deepEqual(normalized, { valid: false, errors: ["SEARCH_RESTAURANTS contains non-placeholder fields"] });
});
