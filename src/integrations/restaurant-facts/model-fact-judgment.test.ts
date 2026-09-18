import assert from "node:assert/strict";
import test from "node:test";

import type { ModelGateway } from "../../core/model/contracts.js";
import type { RestaurantCandidate, RestaurantReadEvidence, RestaurantSearchIntent } from "../../domains/restaurant/contracts.js";
import { ModelRestaurantFactJudgment } from "./model-fact-judgment.js";

const candidate: RestaurantCandidate = {
  restaurant: { id: "a", outletName: "Cafe A", address: "Tokyo", sourceIds: {}, provenance: {} },
  matchReasons: [], warnings: [], executionConfidence: "LOW",
};
const intent: RestaurantSearchIntent = {
  timezone: "Asia/Tokyo", target: { goal: "RECOMMENDATION", query: "restaurant" }, area: { query: "Tokyo" },
  criteria: [{ text: "hot pot restaurant", polarity: "NEGATIVE", strength: "HARD" }],
};
const positiveIntent: RestaurantSearchIntent = {
  ...intent,
  criteria: [{ text: "good for drinks", polarity: "POSITIVE", strength: "HARD" }],
};
const sourceEvidence: RestaurantReadEvidence[] = [{
  evidenceId: "source-type", kind: "RESTAURANT_FACT", provider: "GOOGLE_PLACES", candidateId: "a",
  observedAt: "2026-09-11T00:00:00.000Z", requestFingerprint: "source", claims: { restaurantTypeFacts: ["Italian restaurant"] },
}];

function model(output: unknown): ModelGateway {
  return { complete: async () => ({
    invocationId: "model", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS",
    outputText: JSON.stringify(output), latencyMs: 1,
  }) };
}

test("a cited model type judgment becomes auditable negative-condition evidence", async () => {
  const result = await new ModelRestaurantFactJudgment(model({
    judgments: [{ criterion: "hot pot restaurant", outcome: "SUPPORTED", evidenceIds: ["source-type"] }],
  }), () => "2026-09-11T00:01:00.000Z").judge({ candidate, intent, evidence: sourceEvidence });
  assert.deepEqual(result.evidence[0]?.claims.verifiedNegativeCriteria, ["hot pot restaurant"]);
  assert.deepEqual(result.evidence[0]?.claims.supportingEvidenceIds, ["source-type"]);
  assert.equal(result.evidence[0]?.provider, "MODEL_JUDGMENT");
  assert.equal(result.evidence[0]?.sourceEntityId, undefined);
  assert.equal(result.modelUsage?.calls, 1);
});

test("a cited concrete type judgment can ground a positive HARD condition", async () => {
  const result = await new ModelRestaurantFactJudgment(model({
    judgments: [{ criterion: "good for drinks", outcome: "SUPPORTED", evidenceIds: ["source-type"] }],
  }), () => "2026-09-11T00:01:00.000Z").judge({
    candidate,
    intent: positiveIntent,
    evidence: [{ ...sourceEvidence[0]!, claims: { restaurantTypeFacts: ["lounge bar"] } }],
  });
  assert.deepEqual(result.evidence[0]?.claims.verifiedHardCriteria, ["good for drinks"]);
  assert.deepEqual(result.evidence[0]?.claims.supportingEvidenceIds, ["source-type"]);
  assert.equal(result.evidence[0]?.provider, "MODEL_JUDGMENT");
});

test("a positive HARD criterion cannot be grounded by an uncited assertion or conflict label", async () => {
  const judgment = new ModelRestaurantFactJudgment(model({
    judgments: [
      { criterion: "good for drinks", outcome: "SUPPORTED", evidenceIds: ["invented-source"] },
      { criterion: "good for drinks", outcome: "CONFLICT", evidenceIds: ["source-type"] },
    ],
  }));
  const result = await judgment.judge({ candidate, intent: positiveIntent, evidence: [{ ...sourceEvidence[0]!, claims: { restaurantTypeFacts: ["lounge bar"] } }] });
  assert.deepEqual(result.evidence, []);
  assert.equal(result.modelUsage?.calls, 1);
});

test("an uncited model assertion cannot become a negative-condition fact", async () => {
  const result = await new ModelRestaurantFactJudgment(model({
    judgments: [{ criterion: "hot pot restaurant", outcome: "SUPPORTED", evidenceIds: ["invented-source"] }],
  })).judge({ candidate, intent, evidence: sourceEvidence });
  assert.deepEqual(result.evidence, []);
  assert.equal(result.modelUsage?.calls, 1);
});

test("a broad source type cannot be promoted by the model into exclusion evidence", async () => {
  const result = await new ModelRestaurantFactJudgment(model({
    judgments: [{ criterion: "hot pot restaurant", outcome: "SUPPORTED", evidenceIds: ["source-type"] }],
  })).judge({ candidate, intent, evidence: [{ ...sourceEvidence[0]!, claims: { restaurantTypeFacts: ["restaurant"] } }] });
  assert.deepEqual(result.evidence, []);
  assert.equal(result.modelUsage, undefined);
});

test("regional-cuisine wording remains UNKNOWN for a locality criterion unless the model has direct support", async () => {
  const calls: Parameters<ModelGateway["complete"]>[0][] = [];
  const gateway: ModelGateway = {
    async complete(request) {
      calls.push(request);
      return {
        invocationId: "model", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS",
        outputText: JSON.stringify({ judgments: [{ criterion: "local food", outcome: "UNKNOWN", evidenceIds: ["source-type"] }] }), latencyMs: 1,
      };
    },
  };
  const result = await new ModelRestaurantFactJudgment(gateway).judge({
    candidate,
    intent: { ...intent, criteria: [{ text: "local food", polarity: "POSITIVE", strength: "HARD" }] },
    evidence: [{ ...sourceEvidence[0]!, claims: { restaurantTypeFacts: ["Tokyo regional cuisine restaurant"] } }],
  });
  assert.deepEqual(result.evidence, []);
  assert.equal(calls[0]?.promptVersion, "3");
  assert.match(calls[0]?.messages[0]?.content ?? "", /direct textual entailment/i);
  assert.match(calls[0]?.messages[0]?.content ?? "", /regional cuisine alone is only thematic association/i);
});
