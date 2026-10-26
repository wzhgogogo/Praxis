import assert from "node:assert/strict";
import test from "node:test";
import type { ModelGateway } from "../../core/model/contracts.js";
import type { RestaurantCandidate, RestaurantReadEvidence, RestaurantSearchIntent } from "../../domains/restaurant/contracts.js";
import { ModelRestaurantFactJudgment } from "./model-fact-judgment.js";

const candidate: RestaurantCandidate = { restaurant: { id: "shown-a", outletName: "Cafe Fixture", address: "1-1 Ginza, Tokyo", sourceIds: {}, provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" };
const intent: RestaurantSearchIntent = { timezone: "Asia/Tokyo", target: { goal: "RECOMMENDATION", query: "cafe" }, area: { query: "Ginza" }, criteria: [] };
const sourceUrl = "https://merchant.example/venue";
const identity: RestaurantReadEvidence = { evidenceId: "identity-a", kind: "ENTITY_MATCH", provider: "RESTAURANT_WEBSITE", candidateId: candidate.restaurant.id, sourceEntityId: "venue-a", sourceUrl, observedAt: "2026-10-26T20:00:00Z", requestFingerprint: "fixture", claims: { outletName: "Cafe Fixture", address: "1-1 Ginza, Tokyo" }, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_NAME_AND_ADDRESS"] } };
const quote = "Credit cards accepted: Visa and MasterCard.";

test("G1 answers a payment question outside the original request conditions with an exact source quotation", async () => {
  const model: ModelGateway = { complete: async () => ({ invocationId: "fixture-question", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS", latencyMs: 0, outputText: JSON.stringify({ sourceSelections: [{ documentId: "page-a", statementIds: ["payment"] }], judgments: [] }) }) };
  const input = { candidate, intent, evidence: [identity], sourceDocuments: [{ id: "page-a", candidateId: candidate.restaurant.id, identityEvidenceId: identity.evidenceId, statements: [{ id: "payment", text: quote }] }], question: "Can I pay by credit card?" };
  const result = await new ModelRestaurantFactJudgment(model).judge(input);
  assert.deepEqual(result.evidence.flatMap(e => e.claims.restaurantTypeFacts ?? []), [quote], "a question outside criteria still needs a grounded quoted answer");
});
