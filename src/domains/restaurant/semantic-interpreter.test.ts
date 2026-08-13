import assert from "node:assert/strict";
import { test } from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../core/model/contracts.js";
import { RestaurantSemanticInterpreter } from "./semantic-interpreter.js";

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
    finishReason: "STOP",
    latencyMs: 42,
  };
}

test("Semantic Interpreter requests a closed proposal and never asks for state or tool protocol", async () => {
  const gateway = new QueuedGateway([
    response(
      JSON.stringify({
        schemaVersion: "1",
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
      schemaVersion: "1",
      timezone: "Asia/Tokyo",
      partySize: 2,
      cuisines: [],
      hardConstraints: [],
      softPreferences: [],
      missingRequiredFields: ["date", "timeWindow", "area"],
    },
  });

  assert.equal(result.status, "PROPOSED");
  assert.equal(gateway.calls.length, 1);
  const request = gateway.calls[0]!;
  assert.equal(request.purpose, "restaurant_semantic_interpret");
  assert.equal(request.promptVersion, "v2");
  assert.deepEqual(request.outputSchema, { name: "restaurant-semantic-proposal", version: "1" });
  assert.match(request.messages[0]!.content, /Do not create provider identifiers/);
  assert.match(request.messages[0]!.content, /state patches, events, decisions, commands, tool inputs/);
  assert.equal(
    request.messages[1]!.content,
    'User restaurant message as JSON string: "Make it three."',
  );
});

test("Semantic Interpreter rejects a structurally valid-looking state patch", async () => {
  const gateway = new QueuedGateway([
    response(JSON.stringify({ schemaVersion: "1", facts: [], statePatch: { phase: "SEARCHING" } })),
    response(JSON.stringify({ schemaVersion: "1", facts: [], statePatch: { phase: "SEARCHING" } })),
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
