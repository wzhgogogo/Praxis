import assert from "node:assert/strict";
import { test } from "node:test";

import type { ModelInvocationRecord, ModelRequest } from "../../core/model/contracts.js";
import { ModelGatewayError } from "../../core/model/errors.js";
import { DeepSeekModelGateway } from "./deepseek-model-gateway.js";

const request: ModelRequest = {
  taskId: "task-intent-001",
  purpose: "restaurant_semantic_interpret",
  promptVersion: "v1",
  messages: [
    { role: "system", content: "Return JSON only." },
    { role: "user", content: "Tonight at 7pm in Shinjuku for two." },
  ],
  responseFormat: "JSON_SCHEMA",
  outputSchema: {
    name: "restaurant_semantic_proposal",
    version: "1",
    jsonSchema: {
      type: "object",
      properties: { schemaVersion: { type: "string", enum: ["1"] } },
      required: ["schemaVersion"],
      additionalProperties: false,
    },
  },
  timeoutMs: 100,
  fallback: "STRUCTURED_FORM",
  maxOutputTokens: 256,
  temperature: 0,
  thinking: "disabled",
};

test("DeepSeek gateway sends the complete schema through strict structured output and records redacted metadata", async () => {
  let capturedInput: RequestInfo | URL | undefined;
  let capturedInit: RequestInit | undefined;
  const records: ModelInvocationRecord[] = [];
  const gateway = new DeepSeekModelGateway({
    apiKey: "test-key",
    model: "deepseek-v4-flash",
    now: (() => {
      let current = 100;
      return () => current++;
    })(),
    observer: {
      observe: (record) => {
        records.push(record);
      },
    },
    fetchImplementation: async (input, init) => {
      capturedInput = input;
      capturedInit = init;
      return new Response(
        JSON.stringify({
          id: "chatcmpl-123",
          model: "deepseek-v4-flash",
          choices: [
            {
              finish_reason: "tool_calls",
              message: {
                content: null,
                tool_calls: [
                  {
                    id: "call-1",
                    type: "function",
                    function: {
                      name: "restaurant_semantic_proposal",
                      arguments: '{"schemaVersion":"1"}',
                    },
                  },
                ],
              },
            },
          ],
          usage: {
            prompt_tokens: 12,
            completion_tokens: 8,
            total_tokens: 20,
            completion_tokens_details: { reasoning_tokens: 3 },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    },
  });

  const result = await gateway.complete(request);

  assert.equal(capturedInput, "https://api.deepseek.com/beta/chat/completions");
  assert.equal(new Headers(capturedInit?.headers).get("Authorization"), "Bearer test-key");
  const body = JSON.parse(String(capturedInit?.body)) as Record<string, unknown>;
  assert.deepEqual(body, {
    model: "deepseek-v4-flash",
    messages: request.messages,
    tools: [
      {
        type: "function",
        function: {
          name: "restaurant_semantic_proposal",
          description: "Return restaurant_semantic_proposal schema 1",
          strict: true,
          parameters: request.outputSchema.jsonSchema,
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: "restaurant_semantic_proposal" },
    },
    stream: false,
    max_tokens: 256,
    temperature: 0,
    thinking: { type: "disabled" },
  });
  assert.equal("taskId" in body, false);
  assert.equal(result.provider, "DEEPSEEK");
  assert.equal(result.outputText, '{"schemaVersion":"1"}');
  assert.equal(result.finishReason, "TOOL_CALLS");
  assert.deepEqual(result.usage, {
    inputTokens: 12,
    outputTokens: 8,
    totalTokens: 20,
    reasoningTokens: 3,
  });
  assert.equal(records.length, 1);
  assert.deepEqual(records[0], {
    invocationId: result.invocationId,
    taskId: "task-intent-001",
    purpose: "restaurant_semantic_interpret",
    promptVersion: "v1",
    fallback: "STRUCTURED_FORM",
    provider: "DEEPSEEK",
    model: "deepseek-v4-flash",
    responseFormat: "JSON_SCHEMA",
    outputSchema: { name: "restaurant_semantic_proposal", version: "1" },
    outcome: "SUCCEEDED",
    latencyMs: 1,
    providerStatus: 200,
    usage: result.usage,
    providerRequestId: "chatcmpl-123",
  });
  assert.equal(JSON.stringify(records[0]).includes("Return JSON only."), false);
  assert.equal(JSON.stringify(records[0]).includes("Tonight at 7pm"), false);
  assert.equal(JSON.stringify(records[0]).includes("partySize"), false);
});

test("DeepSeek gateway fails closed when server configuration is incomplete", () => {
  assert.throws(
    () => DeepSeekModelGateway.fromEnvironment({ DEEPSEEK_API_KEY: "configured" }),
    (error: unknown) =>
      error instanceof ModelGatewayError && error.code === "CONFIGURATION" && !error.retryable,
  );
});

test("DeepSeek gateway classifies provider rejection without exposing response body", async () => {
  const records: ModelInvocationRecord[] = [];
  const gateway = new DeepSeekModelGateway({
    apiKey: "test-key",
    model: "deepseek-v4-flash",
    observer: {
      observe: (record) => {
        records.push(record);
      },
    },
    fetchImplementation: async () =>
      new Response(JSON.stringify({ error: { code: "rate_limit", type: "invalid_request", message: "Bearer sk_secret-token must not be retained" } }), {
        status: 429, headers: { "x-request-id": "provider-request-123" },
      }),
  });

  await assert.rejects(
    () => gateway.complete(request),
    (error: unknown) =>
      error instanceof ModelGatewayError &&
      error.code === "PROVIDER_RATE_LIMITED" &&
      error.retryable &&
      error.providerStatus === 429 &&
      error.providerRequestId === "provider-request-123" &&
      error.providerError?.code === "rate_limit" &&
      error.providerError?.type === "invalid_request" &&
      error.providerError?.message === "[redacted] must not be retained" &&
      !error.message.includes("sk_secret-token"),
  );
  assert.equal(records.length, 1);
  assert.equal(records[0]?.outcome, "FAILED");
  assert.equal(records[0]?.errorCode, "PROVIDER_RATE_LIMITED");
  assert.equal(records[0]?.providerStatus, 429);
  assert.equal(records[0]?.providerRequestId, "provider-request-123");
  assert.deepEqual(records[0]?.providerError, {
    code: "rate_limit", type: "invalid_request", message: "[redacted] must not be retained",
  });
});

test("DeepSeek gateway turns an aborted bounded request into a timeout", async () => {
  const gateway = new DeepSeekModelGateway({
    apiKey: "test-key",
    model: "deepseek-v4-flash",
    fetchImplementation: async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("request aborted")));
      }),
  });

  await assert.rejects(
    () => gateway.complete({ ...request, timeoutMs: 1 }),
    (error: unknown) =>
      error instanceof ModelGatewayError && error.code === "TIMEOUT" && error.retryable,
  );
});

test("DeepSeek gateway rejects a malformed provider completion before it reaches a Domain parser", async () => {
  const gateway = new DeepSeekModelGateway({
    apiKey: "test-key",
    model: "deepseek-v4-flash",
    fetchImplementation: async () =>
      new Response(JSON.stringify({ model: "deepseek-v4-flash", choices: [] }), { status: 200 }),
  });

  await assert.rejects(
    () => gateway.complete(request),
    (error: unknown) =>
      error instanceof ModelGatewayError && error.code === "MALFORMED_RESPONSE" && !error.retryable,
  );
});
