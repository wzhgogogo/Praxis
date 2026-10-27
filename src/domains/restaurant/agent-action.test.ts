import assert from "node:assert/strict";
import { test } from "node:test";

import {
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

test("strict Agent wire output normalizes back into canonical restaurant_agent_action@5", () => {
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
  assert.deepEqual(normalized, { valid: false, errors: ["SEARCH_RESTAURANTS contains non-placeholder fields: $.candidateIds"] });
});

test("strict Agent wire permits END_READ only with placeholders and never accepts a model supplied outcome", () => {
  const endWire = { ...searchWire, type: "END_READ", retrievalHint: "", decisionSummary: "No grounded candidate remains." };
  const normalized = normalizeRestaurantAgentActionStrictWire(endWire);
  assert.equal(normalized.valid, true);
  if (!normalized.valid) return;
  assert.deepEqual(validateRestaurantAgentAction(normalized.value), {
    valid: true,
    value: { action: { type: "END_READ" }, decisionSummary: "No grounded candidate remains." },
  });
  assert.deepEqual(
    normalizeRestaurantAgentActionStrictWire({ ...endWire, candidateIds: ["candidate-1"] }),
    { valid: false, errors: ["END_READ contains non-placeholder fields: $.candidateIds"] },
  );
});


test("page question action has no model-owned venue, URL or question arguments", () => {
  assert.equal(validateRestaurantAgentAction({type:"ANSWER_PAGE_QUESTION"}).valid,true);
  for (const fields of [{candidateId:"another"},{url:"https://another.example"},{question:"replace user's question"},{candidateIds:["other"]}]) {
    assert.equal(validateRestaurantAgentAction({type:"ANSWER_PAGE_QUESTION",...fields}).valid,false);
  }
});
