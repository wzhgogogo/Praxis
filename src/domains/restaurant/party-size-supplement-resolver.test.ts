import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../core/model/contracts.js";
import { DeepSeekModelGateway } from "../../infrastructure/deepseek/deepseek-model-gateway.js";
import { RESTAURANT_PARTY_SIZE_SUPPLEMENT_JSON_SCHEMA, RESTAURANT_PARTY_SIZE_SUPPLEMENT_SEMANTIC_ARITY_RULES, RestaurantPartySizeSupplementResolver } from "./party-size-supplement-resolver.js";

function input() {
  return { taskId: "party-test", message: "Find dinner tomorrow for my partner and me.", currentDraft: { schemaVersion: "3" as const, timezone: "Asia/Tokyo" as const, target: { goal: "AVAILABILITY" as const, query: "find a table" }, date: "2026-09-19", timeWindow: { earliest: "19:00", latest: "19:00" }, area: { query: "Shibuya" }, criteria: [] } };
}

test("party supplement uses a non-empty object-root strict DeepSeek wire schema and accepts no extra fields", async () => {
  let body: Record<string, unknown> | undefined;
  const gateway = new DeepSeekModelGateway({
    apiKey: "test", model: "test",
    fetchImplementation: async (_url, init) => {
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({ model: "test", choices: [{ finish_reason: "tool_calls", message: { tool_calls: [{ type: "function", function: { name: "restaurant-party-size-supplement", arguments: '{"status":"RESOLVED","partySize":2}' } }] } }] }), { status: 200 });
    },
  });
  const result = await new RestaurantPartySizeSupplementResolver(gateway).resolve(input());
  assert.deepEqual(result.status === "RESOLVED" ? { status: result.status, partySize: result.partySize } : result, { status: "RESOLVED", partySize: 2 });
  const parameters = (((body?.tools as Array<{ function: { parameters: unknown } }>)[0]?.function.parameters) as Record<string, unknown>);
  assert.deepEqual(parameters, RESTAURANT_PARTY_SIZE_SUPPLEMENT_JSON_SCHEMA);
  assert.equal(parameters.type, "object");
  assert.equal("oneOf" in parameters, false);
  assert.deepEqual(Object.keys(parameters.properties as Record<string, unknown>).sort(), [...(parameters.required as string[])].sort());
  assert.equal(parameters.additionalProperties, false);
  for (const property of Object.values(parameters.properties as Record<string, Record<string, unknown>>)) assert.equal(property.type === "object", false);
});

test("party supplement preserves UNKNOWN and fails closed on extra output", async () => {
  class Queue implements ModelGateway {
    constructor(private readonly reply: string) {}
    async complete(_request: ModelRequest): Promise<ModelResponse> { return { invocationId: "x", provider: "FIXTURE", model: "test", outputText: this.reply, finishReason: "TOOL_CALLS", latencyMs: 0 }; }
  }
  assert.equal((await new RestaurantPartySizeSupplementResolver(new Queue('{"status":"UNKNOWN","partySize":0}')).resolve(input())).status, "UNKNOWN");
  assert.equal((await new RestaurantPartySizeSupplementResolver(new Queue('{"status":"RESOLVED","partySize":2,"extra":true}')).resolve(input())).status, "INVALID_MODEL_OUTPUT");
});

test("party supplement is bounded to one availability request with a missing party and retains v2's generic arity rule", async () => {
  class CountingGateway implements ModelGateway {
    calls = 0;
    request?: ModelRequest;
    async complete(request: ModelRequest): Promise<ModelResponse> {
      this.calls += 1;
      this.request = request;
      return { invocationId: "x", provider: "FIXTURE", model: "test", outputText: '{"status":"UNKNOWN","partySize":0}', finishReason: "TOOL_CALLS", latencyMs: 0 };
    }
  }
  const gateway = new CountingGateway();
  const resolver = new RestaurantPartySizeSupplementResolver(gateway);
  const recommendation = await resolver.resolve({ ...input(), currentDraft: { ...input().currentDraft, target: { goal: "RECOMMENDATION", query: "recommend a cafe" } } });
  const prefilled = await resolver.resolve({ ...input(), currentDraft: { ...input().currentDraft, partySize: 2 } });
  assert.equal(recommendation.status, "INPUT_INVALID");
  assert.equal(prefilled.status, "INPUT_INVALID");
  assert.equal(gateway.calls, 0, "H004/recommendation and primary party sizes do not invoke the supplement");
  await resolver.resolve(input());
  assert.equal(gateway.calls, 1, "one resolve call permits exactly one provider attempt and no retry");
  const prompt = gateway.request?.messages[0]?.content ?? "";
  assert.match(prompt, /lexical semantics fixes the participating roles/i);
  assert.doesNotMatch(prompt, /first date means 2/i);
  assert.match(prompt, /Modifiers can change that structure/i);
});

test("party supplement freezes Prompt@v2 semantic-arity reasoning separately from the transport wire", () => {
  assert.equal(
    createHash("sha256").update(RESTAURANT_PARTY_SIZE_SUPPLEMENT_SEMANTIC_ARITY_RULES).digest("hex"),
    "c61661ca5c0c0819acff1ac5eaf19eb30498341c81e0b309ecf677601a54cd40",
  );
});
