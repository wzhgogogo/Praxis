import assert from "node:assert/strict";
import { test } from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../core/model/contracts.js";
import { RestaurantSemanticInterpreter } from "./semantic-interpreter.js";
import { RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA } from "./semantic-proposal.js";

class QueuedGateway implements ModelGateway {
  readonly calls: ModelRequest[] = [];

  constructor(private readonly replies: ModelResponse[]) {}

  async complete(request: ModelRequest): Promise<ModelResponse> {
    this.calls.push(request);
    const reply = this.replies.shift();
    if (!reply) throw new Error("Unexpected model call");
    return reply;
  }
}

function response(outputText: string): ModelResponse {
  return {
    invocationId: "semantic-invocation-1",
    provider: "DEEPSEEK",
    model: "deepseek-v4-flash",
    outputText,
    finishReason: "TOOL_CALLS",
    latencyMs: 42,
  };
}

test("Semantic Interpreter sends the proposal schema and separates user data from system context", async () => {
  const gateway = new QueuedGateway([
    response(
      JSON.stringify({
        schemaVersion: "3",
        facts: [
          {
            field: "PARTY_SIZE",
            operation: "CORRECT",
            value: { kind: "PARTY_SIZE", value: 3 },
          },
        ],
      }),
    ),
  ]);
  const interpreter = new RestaurantSemanticInterpreter(gateway);

  const result = await interpreter.interpret({
    taskId: "task-restaurant-001",
    message: "Make it three.",
    referenceTime: "2026-08-05T09:00:00+09:00",
    timezone: "Asia/Tokyo",
    currentDraft: {
      schemaVersion: "3",
      timezone: "Asia/Tokyo",
      partySize: 2,
      criteria: [],
    },
  });

  assert.equal(result.status, "PROPOSED");
  assert.equal(gateway.calls.length, 1);
  const request = gateway.calls[0]!;
  assert.equal(request.purpose, "restaurant_semantic_interpret");
  assert.equal(request.promptVersion, "v8");
  assert.deepEqual(request.outputSchema, {
    name: "restaurant-semantic-proposal",
    version: "3",
    jsonSchema: RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA,
  });
  assert.equal(request.responseFormat, "JSON_SCHEMA");
  assert.deepEqual(request.messages.map((message) => message.role), ["system", "user"]);
  assert.ok(request.messages[0]!.content.includes("2026-08-05T09:00:00+09:00"));
  assert.ok(request.messages[0]!.content.includes(JSON.stringify({ partySize: 2 })));
  assert.ok(!request.messages[0]!.content.includes("Make it three."));
  assert.equal(
    request.messages[1]!.content,
    'User restaurant message as JSON string: "Make it three."',
  );
});

test("Semantic Interpreter rejects a structurally valid-looking state patch", async () => {
  const gateway = new QueuedGateway([
    response(JSON.stringify({ schemaVersion: "3", facts: [], statePatch: { phase: "SEARCHING" } })),
    response(JSON.stringify({ schemaVersion: "3", facts: [], statePatch: { phase: "SEARCHING" } })),
  ]);
  const interpreter = new RestaurantSemanticInterpreter(gateway);

  const result = await interpreter.interpret({
    taskId: "task-restaurant-001",
    message: "Book it.",
    referenceTime: "2026-08-05T09:00:00+09:00",
    timezone: "Asia/Tokyo",
  });

  assert.equal(result.status, "INVALID_MODEL_OUTPUT");
  if (result.status === "INVALID_MODEL_OUTPUT") {
    assert.equal(result.attempts.length, 2);
    assert.match(result.errors.join(" "), /unsupported fields/);
  }
});
