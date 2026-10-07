import assert from "node:assert/strict";
import test from "node:test";

import type { ModelGateway } from "../../core/model/contracts.js";
import type { RestaurantCandidate, RestaurantReadEvidence, RestaurantSearchIntent } from "../../domains/restaurant/contracts.js";
import type { RestaurantTaskState } from "../../domains/restaurant/contracts.js";
import { validateRestaurantAction } from "../../domains/restaurant/action-validator.js";
import { applyRestaurantIntentPatch } from "../../domains/restaurant/intent-state.js";
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
    outputText: JSON.stringify({ sourceSelections: [], ...(output as Record<string, unknown>) }), latencyMs: 1,
  }) };
}

test("a cited model type judgment becomes auditable negative-condition evidence", async () => {
  const result = await new ModelRestaurantFactJudgment(model({
    judgments: [{ criterion: "hot pot restaurant", outcome: "SUPPORTED", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: ["source-type"] }],
  }), () => "2026-09-11T00:01:00.000Z").judge({ candidate, intent,
    evidence: [{ ...sourceEvidence[0]!, claims: { restaurantTypeFacts: ["We do not serve hot pot."] } }] });
  assert.deepEqual(result.evidence[0]?.claims.verifiedNegativeCriteria, ["hot pot restaurant"]);
  assert.deepEqual(result.evidence[0]?.claims.supportingEvidenceIds, ["source-type"]);
  assert.equal(result.evidence[0]?.provider, "MODEL_JUDGMENT");
  assert.equal(result.evidence[0]?.sourceEntityId, undefined);
  assert.equal(result.modelUsage?.calls, 1);
});

test("a category conflict from a generic type needs a same-source HIGH grounded entity", async () => {
  const generic = { ...sourceEvidence[0]!, provider: "RESTAURANT_WEBSITE" as const, sourceEntityId: "mcd-a", claims: { restaurantTypeFacts: ["restaurant"] } };
  const identity = { evidenceId: "identity", kind: "ENTITY_MATCH" as const, provider: "RESTAURANT_WEBSITE" as const, candidateId: "a", sourceEntityId: "mcd-a", observedAt: generic.observedAt, requestFingerprint: "source", claims: { outletName: "McDonald's" }, entityMatch: { confidence: "HIGH" as const, matchedBy: ["EXACT_NAME_AND_ADDRESS"] } };
  const result = await new ModelRestaurantFactJudgment(model({ judgments: [{ criterion: "fast food", outcome: "CONFLICT", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: ["source-type"] }] })).judge({ candidate, intent: { ...intent, criteria: [{ text: "fast food", polarity: "NEGATIVE", strength: "HARD" }] }, evidence: [generic, identity] });
  assert.deepEqual(result.evidence[0]?.claims.violatedNegativeCriteria, ["fast food"]);
  const noIdentity = await new ModelRestaurantFactJudgment(model({ judgments: [{ criterion: "fast food", outcome: "CONFLICT", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: ["source-type"] }] })).judge({ candidate, intent: { ...intent, criteria: [{ text: "fast food", polarity: "NEGATIVE", strength: "HARD" }] }, evidence: [generic] });
  assert.deepEqual(noIdentity.evidence, []);
  const opaqueIdentity = await new ModelRestaurantFactJudgment(model({ judgments: [{ criterion: "fast food", outcome: "CONFLICT", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: ["source-type"] }] })).judge({ candidate, intent: { ...intent, criteria: [{ text: "fast food", polarity: "NEGATIVE", strength: "HARD" }] }, evidence: [generic, { ...identity, claims: {} }] });
  assert.deepEqual(opaqueIdentity.evidence, [], "opaque source IDs are not source-stated venue identities");
});

test("a cited concrete type judgment can ground a positive HARD condition", async () => {
  const result = await new ModelRestaurantFactJudgment(model({
    judgments: [{ criterion: "good for drinks", outcome: "SUPPORTED", scope: "UNKNOWN_SCOPE", evidenceIds: ["source-type"] }],
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
      { criterion: "good for drinks", outcome: "SUPPORTED", scope: "UNKNOWN_SCOPE", evidenceIds: ["invented-source"] },
      { criterion: "good for drinks", outcome: "CONFLICT", scope: "UNKNOWN_SCOPE", evidenceIds: ["source-type"] },
    ],
  }));
  const result = await judgment.judge({ candidate, intent: positiveIntent, evidence: [{ ...sourceEvidence[0]!, claims: { restaurantTypeFacts: ["lounge bar"] } }] });
  assert.deepEqual(result.evidence, []);
  assert.equal(result.modelUsage?.calls, 1);
});

test("an uncited model assertion cannot become a negative-condition fact", async () => {
  const result = await new ModelRestaurantFactJudgment(model({
    judgments: [{ criterion: "hot pot restaurant", outcome: "SUPPORTED", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: ["invented-source"] }],
  })).judge({ candidate, intent, evidence: sourceEvidence });
  assert.deepEqual(result.evidence, []);
  assert.equal(result.modelUsage?.calls, 1);
});

test("a broad source type cannot be promoted by the model into exclusion evidence", async () => {
  const result = await new ModelRestaurantFactJudgment(model({
    judgments: [{ criterion: "hot pot restaurant", outcome: "SUPPORTED", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: ["source-type"] }],
  })).judge({ candidate, intent, evidence: [{ ...sourceEvidence[0]!, claims: { restaurantTypeFacts: ["restaurant"] } }] });
  assert.deepEqual(result.evidence, []);
  assert.equal(result.modelUsage?.calls, 1, "broad facts may reach the existing category-scope judgment but cannot support an exclusion claim");
});

test("a cited restaurant-category UNKNOWN is auditable without becoming a verified-negative claim", async () => {
  const categoryIntent = { ...intent, criteria: [{ text: "fast food", polarity: "NEGATIVE" as const, strength: "HARD" as const }] };
  const result = await new ModelRestaurantFactJudgment(model({
    judgments: [{ criterion: "fast food", outcome: "UNKNOWN", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: ["source-type"] }],
  })).judge({ candidate, intent: categoryIntent, evidence: sourceEvidence });
  assert.deepEqual(result.evidence[0]?.claims.categoryUnknownNegativeCriteria, ["fast food"]);
  assert.equal(result.evidence[0]?.claims.verifiedNegativeCriteria, undefined);
  assert.deepEqual(result.evidence[0]?.claims.supportingEvidenceIds, ["source-type"]);
});

test("a generic restaurant fact is sent only for the same negative category judgment and remains UNKNOWN", async () => {
  const calls: Parameters<ModelGateway["complete"]>[0][] = [];
  const gateway: ModelGateway = { async complete(request) {
    calls.push(request);
    return { invocationId: "model", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS", outputText: JSON.stringify({
      sourceSelections: [], judgments: [{ criterion: "fast food", outcome: "UNKNOWN", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: ["source-type"] }],
    }), latencyMs: 1 };
  } };
  const result = await new ModelRestaurantFactJudgment(gateway).judge({
    candidate,
    intent: { ...intent, criteria: [{ text: "fast food", polarity: "NEGATIVE", strength: "HARD" }] },
    evidence: [{ ...sourceEvidence[0]!, claims: { restaurantTypeFacts: ["restaurant"] } }],
  });
  assert.equal(calls.length, 1, "the category scope is learned in the existing cited judgment, not from a prefilter word list");
  assert.deepEqual(result.evidence[0]?.claims.categoryUnknownNegativeCriteria, ["fast food"]);
  assert.equal(result.evidence[0]?.claims.verifiedNegativeCriteria, undefined);
});

test("a venue name alone never becomes a fast-food fact, and non-category UNKNOWN stays fail-closed", async () => {
  let calls = 0;
  const gateway: ModelGateway = { async complete() { calls += 1; throw new Error("name-only evidence must not invoke the judgment"); } };
  const nameOnly = await new ModelRestaurantFactJudgment(gateway).judge({
    candidate: { ...candidate, restaurant: { ...candidate.restaurant, outletName: "Quick Sushi" } },
    intent: { ...intent, criteria: [{ text: "fast food", polarity: "NEGATIVE", strength: "HARD" }] },
    evidence: [{ ...sourceEvidence[0]!, claims: {} }],
  });
  assert.equal(calls, 0);
  assert.deepEqual(nameOnly.evidence, []);
  const safety = await new ModelRestaurantFactJudgment(model({
    judgments: [{ criterion: "peanut contamination", outcome: "UNKNOWN", scope: "OTHER", evidenceIds: ["source-type"] }],
  })).judge({
    candidate,
    intent: { ...intent, criteria: [{ text: "peanut contamination", polarity: "NEGATIVE", strength: "HARD" }] },
    evidence: sourceEvidence,
  });
  assert.deepEqual(safety.evidence, []);
});

test("a locality-cuisine UNKNOWN remains unverified while receiving authoritative locality context", async () => {
  const calls: Parameters<ModelGateway["complete"]>[0][] = [];
  const gateway: ModelGateway = {
    async complete(request) {
      calls.push(request);
      return {
        invocationId: "model", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS",
        outputText: JSON.stringify({ sourceSelections: [], judgments: [{ criterion: "local food", outcome: "UNKNOWN", scope: "UNKNOWN_SCOPE", evidenceIds: ["source-type"] }] }), latencyMs: 1,
      };
    },
  };
  const result = await new ModelRestaurantFactJudgment(gateway).judge({
    candidate,
    intent: { ...intent, criteria: [{ text: "local food", polarity: "POSITIVE", strength: "HARD" }] },
    evidence: [{ ...sourceEvidence[0]!, claims: { restaurantTypeFacts: ["Tokyo regional cuisine restaurant"] } }],
  });
  assert.deepEqual(result.evidence, []);
  assert.equal(calls[0]?.promptVersion, "14");
  assert.match(calls[0]?.messages[0]?.content ?? "", /direct textual entailment/i);
  assert.match(calls[0]?.messages[0]?.content ?? "", /destination's native culinary context/i);
  assert.match(calls[0]?.messages[0]?.content ?? "", /broader national or destination-compatible cuisine does not establish that narrower condition/i);
  assert.match(calls[0]?.messages[0]?.content ?? "", /Never infer restaurant category from candidate\.name/i);
  assert.match(calls[0]?.messages[0]?.content ?? "", /groundedEntity.*source-grounded, HIGH-confidence entity identity/i);
  assert.match(calls[0]?.messages[0]?.content ?? "", /A different cuisine or stated main specialty alone is neither CONFLICT nor SUPPORTED/i);
  const input = JSON.parse(calls[0]?.messages[1]?.content ?? "{}") as { candidate?: { address?: string }; requestContext?: { area?: string } };
  assert.equal(input.candidate?.address, "Tokyo");
  assert.equal(input.requestContext?.area, "Tokyo");
});

test("candidate address and venue name alone never invoke or verify a locality-food criterion", async () => {
  let calls = 0;
  const gateway: ModelGateway = {
    async complete() {
      calls += 1;
      throw new Error("a generic type must be filtered before a model call");
    },
  };
  const result = await new ModelRestaurantFactJudgment(gateway).judge({
    candidate: { ...candidate, restaurant: { ...candidate.restaurant, outletName: "Tokyo Local Kitchen", address: "1 Matrix Lane, Chuo City, Tokyo" } },
    intent: { ...intent, criteria: [{ text: "local food", polarity: "POSITIVE", strength: "HARD" }] },
    evidence: [{ ...sourceEvidence[0]!, claims: { restaurantTypeFacts: ["restaurant"] } }],
  });
  assert.equal(calls, 0);
  assert.deepEqual(result.evidence, []);
});

test("a cited native-cuisine support remains a model judgment rather than a deterministic cuisine mapping", async () => {
  const result = await new ModelRestaurantFactJudgment(model({
    judgments: [{ criterion: "local food", outcome: "SUPPORTED", scope: "UNKNOWN_SCOPE", evidenceIds: ["source-type"] }],
  })).judge({
    candidate,
    intent: { ...intent, criteria: [{ text: "local food", polarity: "POSITIVE", strength: "HARD" }] },
    evidence: [{ ...sourceEvidence[0]!, claims: { restaurantTypeFacts: ["Japanese restaurant"] } }],
  });
  assert.deepEqual(result.evidence[0]?.claims.verifiedHardCriteria, ["local food"]);
  assert.deepEqual(result.evidence[0]?.claims.supportingEvidenceIds, ["source-type"]);
});

test("negative category raw judgments reach conversion and the current presentation gate without changing the source facts", async () => {
  const criterion = "Sichuan/Hunan-style cuisine where spicy food is the main focus";
  const factIntent: RestaurantSearchIntent = { ...intent, criteria: [{ text: criterion, polarity: "NEGATIVE", strength: "HARD" }] };
  const cases = [
    { name: "different potentially overlapping primary cuisine", type: "Cantonese cuisine is our main offering", outcome: "UNKNOWN", claim: "categoryUnknownNegativeCriteria", eligible: true },
    { name: "excluded type explicitly stated", type: "Sichuan and Hunan cuisine, with spicy dishes as the main focus", outcome: "CONFLICT", claim: "violatedNegativeCriteria", eligible: false },
    { name: "excluded type explicitly denied", type: "We do not serve Sichuan or Hunan cuisine and spicy food is not our focus", outcome: "SUPPORTED", claim: "verifiedNegativeCriteria", eligible: true },
    { name: "broad type with no conclusion", type: "chinese restaurant", outcome: "UNKNOWN", claim: "categoryUnknownNegativeCriteria", eligible: true },
  ] as const;
  for (const control of cases) {
    const raw = { judgments: [{ criterion, outcome: control.outcome, scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: ["source-type"] }] };
    const evidence: RestaurantReadEvidence[] = [
      { evidenceId: "area", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId: "a", observedAt: now(), requestFingerprint: "request", claims: { areaQuery: "Tokyo", areaMatch: true } },
      { evidenceId: "identity", kind: "ENTITY_MATCH", provider: "RESTAURANT_WEBSITE", candidateId: "a", sourceEntityId: "venue-a", observedAt: now(), requestFingerprint: "request", claims: { outletName: "Cafe A" }, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_NAME_AND_ADDRESS"] } },
      { evidenceId: "source-type", kind: "RESTAURANT_FACT", provider: "RESTAURANT_WEBSITE", candidateId: "a", sourceEntityId: "venue-a", observedAt: now(), requestFingerprint: "request", claims: { restaurantTypeFacts: [control.type] } },
    ];
    const result = await new ModelRestaurantFactJudgment(model(raw), now).judge({ candidate, intent: factIntent, evidence });
    assert.deepEqual(result.evidence[0]?.claims[control.claim], [criterion], control.name);
    const state: RestaurantTaskState = {
      schemaVersion: "12", phase: "SEARCHING", candidates: [candidate], availability: {}, availabilityChecks: {}, searchRevision: 0,
      intentDraft: applyRestaurantIntentPatch(undefined, { schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "restaurant" }, area: { query: "Tokyo" }, addCriteria: [{ text: criterion, polarity: "NEGATIVE", strength: "HARD" }] }),
      readEvidence: [...evidence, ...result.evidence],
    };
    assert.equal(validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: ["a"] }, now()).status, control.eligible ? "ALLOWED" : "REJECTED", control.name);
  }
});

function now(): string { return "2026-09-24T09:00:00.000Z"; }


test("website judgments preserve selected source statements and reject invented or cross-candidate citations", async () => {
  const identity: RestaurantReadEvidence = {
    evidenceId: "website-identity", kind: "ENTITY_MATCH", provider: "RESTAURANT_WEBSITE", candidateId: "a",
    sourceEntityId: "website-a", sourceUrl: "https://restaurant.example/menu", observedAt: "2026-09-28T00:00:00Z", requestFingerprint: "source",
    claims: { outletName: "Cafe A" }, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] },
  };
  const document = { id: "source-document", candidateId: "a", identityEvidenceId: identity.evidenceId,
    statements: [{ id: "statement-1", text: "旬のつまみからはじまるおまかせコースを提供します。" }] };
  for (const mode of ["valid", "invented", "other-candidate", "statement-as-citation"] as const) {
    const transport = model({
      sourceSelections: [{ documentId: document.id, statementIds: [mode === "invented" ? "not-observed" : "statement-1"] }],
      judgments: [{ criterion: "omakase", outcome: "SUPPORTED", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: [mode === "statement-as-citation" ? "statement-1" : document.id] }],
    });
    let wire: Parameters<ModelGateway["complete"]>[0] | undefined;
    const reader = new ModelRestaurantFactJudgment({ async complete(request) { wire = request; return transport.complete(request); } });
    const read = await reader.judge({ candidate, intent: { ...positiveIntent, criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] },
      evidence: [identity], sourceDocuments: [{ ...document, candidateId: mode === "other-candidate" ? "another-outlet" : "a" }] });
    if (mode === "statement-as-citation") {
      assert.equal(read.evidence.some(e => e.provider === "MODEL_JUDGMENT"), false, "do not guess which source a paragraph number meant");
      continue;
    }
    if (mode !== "valid") { assert.equal(read.evidence.length, 0); continue; }
    // The observed real model confused statement IDs with citation IDs, omitted
    // UNKNOWN citations and selected four statements. Restrict the citation namespace
    // without adding unsupported DeepSeek array-length schema keywords.
    const properties = wire!.outputSchema.jsonSchema!.properties as Record<string, any>;
    const citations = properties.judgments.items.properties.evidenceIds;
    assert.deepEqual(citations.items.enum, [document.id]);
    assert.equal(citations.minItems, undefined);
    assert.equal(properties.sourceSelections.items.properties.statementIds.maxItems, undefined);
    const source = read.evidence.find(e => e.provider === "RESTAURANT_WEBSITE");
    assert.deepEqual(source?.claims.restaurantTypeFacts, [document.statements[0]!.text]);
    assert.equal(source?.sourceEntityId, identity.sourceEntityId);
    assert.equal(source?.claims.verifiedHardCriteria, undefined);
    assert.deepEqual(read.evidence.find(e => e.provider === "MODEL_JUDGMENT")?.claims.supportingEvidenceIds, [document.id]);
  }
});

test("a model fact judgment keeps one cited service scope and rejects mixed scope citations", async () => {
  const scoped = (evidenceId: string, value: string): RestaurantReadEvidence => ({
    ...sourceEvidence[0]!, evidenceId, claims: {
      restaurantTypeFacts: ["omakase restaurant"],
      serviceScopeField: "reservation[service_category]", serviceScopeGroup: "form:reserve|name:reservation[service_category]",
      serviceScopeValue: value, serviceScopeLabel: value,
    },
  });
  const scopedIntent = { ...positiveIntent, criteria: [{ text: "omakase", polarity: "POSITIVE" as const, strength: "HARD" as const }] };
  const single = await new ModelRestaurantFactJudgment(model({
    judgments: [{ criterion: "omakase", outcome: "SUPPORTED", scope: "UNKNOWN_SCOPE", evidenceIds: ["sushi"] }],
  })).judge({ candidate, intent: scopedIntent, evidence: [scoped("sushi", "sushi"), scoped("bar", "bar")] });
  const judgment = single.evidence.find(item => item.provider === "MODEL_JUDGMENT");
  assert.equal(judgment?.claims.serviceScopeValue, "sushi");
  assert.deepEqual(judgment?.claims.supportingEvidenceIds, ["sushi"]);
  const mixed = await new ModelRestaurantFactJudgment(model({
    judgments: [{ criterion: "omakase", outcome: "SUPPORTED", scope: "UNKNOWN_SCOPE", evidenceIds: ["sushi", "bar"] }],
  })).judge({ candidate, intent: scopedIntent, evidence: [scoped("sushi", "sushi"), scoped("bar", "bar")] });
  assert.equal(mixed.evidence.some(item => item.provider === "MODEL_JUDGMENT"), false, "two service scopes cannot be merged into an outlet-wide positive");
  const outletConflict = await new ModelRestaurantFactJudgment(model({
    judgments: [
      { criterion: "omakase", outcome: "SUPPORTED", scope: "UNKNOWN_SCOPE", evidenceIds: ["sushi"] },
      { criterion: "hot pot restaurant", outcome: "CONFLICT", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: ["outlet"] },
    ],
  })).judge({ candidate, intent: { ...scopedIntent, criteria: [...scopedIntent.criteria, { text: "hot pot restaurant", polarity: "NEGATIVE", strength: "HARD" }] }, evidence: [scoped("sushi", "sushi"), { ...sourceEvidence[0]!, evidenceId: "outlet", claims: { restaurantTypeFacts: ["hot pot restaurant"] } }] });
  const scopedPositive = outletConflict.evidence.find(item => item.provider === "MODEL_JUDGMENT" && item.claims.verifiedHardCriteria !== undefined);
  const unscopedConflict = outletConflict.evidence.find(item => item.provider === "MODEL_JUDGMENT" && item.claims.violatedNegativeCriteria !== undefined);
  assert.equal(scopedPositive?.claims.serviceScopeValue, "sushi");
  assert.equal(unscopedConflict?.claims.serviceScopeValue, undefined, "outlet conflict remains an outlet-level fact");
});
