import assert from "node:assert/strict";
import { test } from "node:test";

import type { RestaurantAgentContext } from "./agent-context.js";
import { RESTAURANT_AGENT_DECISION_MAX_OUTPUT_TOKENS, RestaurantAgentDecision } from "./agent-decision.js";
import { RESTAURANT_AGENT_CAPABILITIES } from "./restaurant-capabilities.js";
import { DeepSeekModelGateway } from "../../infrastructure/deepseek/deepseek-model-gateway.js";

const context: RestaurantAgentContext = {
  schemaVersion: "7",
  now: "2026-01-01T00:00:00.000Z",
  phase: "UNDERSTANDING",
  intentDraft: {
    schemaVersion: "3", timezone: "Asia/Tokyo", criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }],
    date: "2026-09-03", timeWindow: { earliest: "19:00", latest: "19:00" }, partySize: 2, area: { query: "near Shibuya" },
  },
  missingBlockingFields: [], candidates: [], availability: {}, availabilityChecks: {}, presentation: [], readCompletion: { allowed: false, investigationRecorded: false, unresolvedCandidateIds: [] }, legalActions: { search: true, investigateCandidateFacts: [], checkAvailability: [], presentResults: [], endRead: false }, searchAvailability: { available: true },
};

test("Restaurant Agent sends a DeepSeek-strict compatible wire schema and restores the canonical action", async () => {
  let endpoint: RequestInfo | URL | undefined;
  let requestBody: Record<string, unknown> | undefined;
  const gateway = new DeepSeekModelGateway({
    apiKey: "test-key", model: "deepseek-v4-flash",
    fetchImplementation: async (input, init) => {
      endpoint = input;
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({
        id: "request-123", model: "deepseek-v4-flash", choices: [{ finish_reason: "tool_calls", message: { tool_calls: [{
          type: "function", function: { name: "restaurant_agent_action", arguments: JSON.stringify({
            type: "SEARCH_RESTAURANTS", question: "", relatedFields: [], retrievalHint: "omakase near Shibuya", candidateIds: [], candidateId: "", offerId: "", decisionSummary: "Search first.",
          }) },
        }] } }],
      }), { status: 200 });
    },
  });

  const result = await new RestaurantAgentDecision(gateway).decide({
    taskId: "task-h001", context, recentExecutionHistory: [], capabilities: RESTAURANT_AGENT_CAPABILITIES,
  });

  assert.equal(endpoint, "https://api.deepseek.com/beta/chat/completions");
  const tools = requestBody?.tools as Array<{ function: { strict: boolean; parameters: Record<string, unknown> } }>;
  assert.equal(tools[0]?.function.strict, true);
  assert.equal(requestBody?.max_tokens, RESTAURANT_AGENT_DECISION_MAX_OUTPUT_TOKENS);
  assert.equal(tools[0]?.function.parameters.additionalProperties, false);
  assert.deepEqual(tools[0]?.function.parameters.required, ["type", "question", "relatedFields", "retrievalHint", "candidateIds", "candidateId", "offerId", "decisionSummary"]);
  assert.equal(result.status, "PROPOSED");
  if (result.status !== "PROPOSED") return;
  assert.deepEqual(result.action, { type: "SEARCH_RESTAURANTS", retrievalHint: "omakase near Shibuya" });
  assert.equal(result.decisionSummary, "Search first.");
  assert.equal(result.modelAttempt.promptVersion, "14");
  assert.equal(result.modelAttempt.providerRequestId, "request-123");
  assert.deepEqual(result.modelAttempt.outputSchema, { name: "restaurant_agent_action", version: "4" });
});

test("Restaurant Agent supplies candidate commercial comparisons only as source-backed notes", async () => {
  let suppliedContext: Record<string, unknown> | undefined;
  const gateway = new DeepSeekModelGateway({
    apiKey: "test-key", model: "deepseek-v4-flash",
    fetchImplementation: async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { messages: Array<{ content: string }> };
      suppliedContext = JSON.parse(body.messages[1]!.content).context as Record<string, unknown>;
      return new Response(JSON.stringify({
        id: "request-commercial", model: "deepseek-v4-flash", choices: [{ finish_reason: "tool_calls", message: { tool_calls: [{
          type: "function", function: { name: "restaurant_agent_action", arguments: JSON.stringify({
            type: "PRESENT_RESULTS", question: "", relatedFields: [], retrievalHint: "", candidateIds: ["restaurant-a"], candidateId: "", offerId: "", decisionSummary: "Compare the sourced course price.",
          }) },
        }] } }],
      }), { status: 200 });
    },
  });
  const commercialContext: RestaurantAgentContext = {
    ...context,
    phase: "SEARCHING",
    candidates: [{
      id: "restaurant-a", outletName: "A", address: "Tokyo", matchReasons: [], warnings: [], executionConfidence: "HIGH",
      observedFacts: {
        verifiedHardCriteria: [], verifiedNegativeCriteria: [], violatedNegativeCriteria: [], openingHoursMatch: false,
        commercialNotes: [{ field: "COURSE_PRICE", value: "8000 JPY (tax included)", source: "RESTAURANT_WEBSITE" }],
      },
      sourceAttempts: [],
    }],
    presentation: [{ candidateId: "restaurant-a", eligible: true }],
    legalActions: { ...context.legalActions, presentResults: ["restaurant-a"] },
  };

  const result = await new RestaurantAgentDecision(gateway).decide({
    taskId: "task-commercial", context: commercialContext, recentExecutionHistory: [], capabilities: RESTAURANT_AGENT_CAPABILITIES,
  });

  assert.deepEqual((suppliedContext?.candidates as Array<Record<string, unknown>>)[0]?.observedFacts, commercialContext.candidates[0]!.observedFacts);
  assert.equal(JSON.stringify(suppliedContext).includes("sourceUrl"), false);
  assert.equal(JSON.stringify(suppliedContext).includes("evidenceId"), false);
  assert.equal(result.status, "PROPOSED");
  if (result.status === "PROPOSED") assert.deepEqual(result.action, { type: "PRESENT_RESULTS", candidateIds: ["restaurant-a"] });
});
