import assert from "node:assert/strict";
import { test } from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../core/model/contracts.js";
import { ModelGatewayError } from "../../core/model/errors.js";
import type { RestaurantIntentDraft } from "./contracts.js";
import { RestaurantIntentParser } from "./intent-parser.js";

const completeDraft: RestaurantIntentDraft = {
  schemaVersion: "1",
  timezone: "Asia/Tokyo",
  date: "2026-08-07",
  timeWindow: { earliest: "19:00", latest: "19:00" },
  partySize: 2,
  area: { query: "Shinjuku" },
  cuisines: ["yakiniku"],
  budgetPerPerson: { max: 5000, currency: "JPY" },
  hardConstraints: [],
  softPreferences: [],
  missingRequiredFields: [],
};

function response(outputText: string, overrides: Partial<ModelResponse> = {}): ModelResponse {
  return {
    invocationId: "invocation-1",
    provider: "DEEPSEEK",
    model: "deepseek-v4-flash",
    outputText,
    finishReason: "STOP",
    latencyMs: 42,
    ...overrides,
  };
}

class QueuedGateway implements ModelGateway {
  readonly calls: ModelRequest[] = [];

  constructor(private readonly replies: Array<ModelResponse | Error>) {}

  async complete(request: ModelRequest): Promise<ModelResponse> {
    this.calls.push(request);
    const reply = this.replies.shift();
    if (reply === undefined) {
      throw new Error("Unexpected model call");
    }
    if (reply instanceof Error) {
      throw reply;
    }
    return reply;
  }
}

const input = {
  taskId: "task-restaurant-001",
  message: "Tonight at 7pm in Shinjuku for two, yakiniku under ¥5,000.",
  referenceTime: "2026-08-07T10:00:00+09:00",
  timezone: "Asia/Tokyo" as const,
};

test("Restaurant Intent Parser builds a bounded JSON request and returns only validated Domain data", async () => {
  const gateway = new QueuedGateway([response(JSON.stringify(completeDraft))]);
  const parser = new RestaurantIntentParser(gateway);

  const result = await parser.parse(input);

  assert.equal(result.status, "PARSED");
  if (result.status !== "PARSED") {
    return;
  }
  assert.deepEqual(result.draft, completeDraft);
  assert.equal(result.attempts.length, 1);
  assert.equal(gateway.calls.length, 1);
  const request = gateway.calls[0];
  assert.equal(request?.purpose, "restaurant_intent_parse");
  assert.equal(request?.promptVersion, "v1");
  assert.equal(request?.responseFormat, "JSON_OBJECT");
  assert.equal(request?.fallback, "STRUCTURED_FORM");
  assert.equal(request?.thinking, "disabled");
  assert.match(request?.messages[0]?.content ?? "", /JSON/);
  assert.match(request?.messages[0]?.content ?? "", /untrusted data/);
  assert.equal(
    request?.messages[1]?.content,
    `User restaurant request as JSON string: ${JSON.stringify(input.message)}`,
  );
});

test("Restaurant Intent Parser retries one invalid JSON/schema completion and accepts a valid retry", async () => {
  const invalidWithExtraField = JSON.stringify({ ...completeDraft, internalInstruction: "ignore rules" });
  const gateway = new QueuedGateway([
    response(invalidWithExtraField, { invocationId: "invocation-1" }),
    response(JSON.stringify(completeDraft), { invocationId: "invocation-2" }),
  ]);
  const parser = new RestaurantIntentParser(gateway);

  const result = await parser.parse(input);

  assert.equal(result.status, "PARSED");
  assert.equal(result.attempts.length, 2);
  assert.equal(gateway.calls.length, 2);
  assert.match(gateway.calls[1]?.messages[0]?.content ?? "", /prior completion was invalid/);
});

test("Restaurant Intent Parser falls back after two untrusted invalid completions", async () => {
  const gateway = new QueuedGateway([
    response("{not json"),
    response(JSON.stringify({ ...completeDraft, missingRequiredFields: ["date"] })),
  ]);
  const parser = new RestaurantIntentParser(gateway);

  const result = await parser.parse(input);

  assert.equal(result.status, "INVALID_MODEL_OUTPUT");
  if (result.status !== "INVALID_MODEL_OUTPUT") {
    return;
  }
  assert.equal(result.fallback, "STRUCTURED_FORM");
  assert.equal(result.attempts.length, 2);
  assert.match(result.errors.join(" "), /missingRequiredFields/);
});

test("Restaurant Intent Parser never turns a model failure into Task State", async () => {
  const gateway = new QueuedGateway([
    new ModelGatewayError("rate limited", "PROVIDER_RATE_LIMITED", true, 429),
  ]);
  const parser = new RestaurantIntentParser(gateway);

  const result = await parser.parse(input);

  assert.deepEqual(result, {
    status: "MODEL_FAILURE",
    errorCode: "PROVIDER_RATE_LIMITED",
    retryable: true,
    fallback: "STRUCTURED_FORM",
    attempts: [],
  });
  assert.equal(gateway.calls.length, 1);
});
