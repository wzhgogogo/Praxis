import assert from "node:assert/strict";
import { test } from "node:test";

import type { RestaurantAgentContext } from "./agent-context.js";
import { RESTAURANT_AGENT_DECISION_MAX_OUTPUT_TOKENS, RestaurantAgentDecision } from "./agent-decision.js";
import { RESTAURANT_AGENT_CAPABILITIES } from "./restaurant-capabilities.js";
import { DeepSeekModelGateway } from "../../infrastructure/deepseek/deepseek-model-gateway.js";

const context: RestaurantAgentContext = {
  schemaVersion: "2",
  phase: "UNDERSTANDING",
  intentDraft: {
    schemaVersion: "3", timezone: "Asia/Tokyo", criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }],
    date: "2026-09-03", timeWindow: { earliest: "19:00", latest: "19:00" }, partySize: 2, area: { query: "near Shibuya" },
  },
  missingBlockingFields: [], candidates: [], availability: {}, availabilityChecks: {},
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
  assert.equal(result.modelAttempt.promptVersion, "6");
  assert.equal(result.modelAttempt.providerRequestId, "request-123");
  assert.deepEqual(result.modelAttempt.outputSchema, { name: "restaurant_agent_action", version: "3" });
});
