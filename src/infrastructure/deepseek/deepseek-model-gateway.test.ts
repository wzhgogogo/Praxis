import assert from "node:assert/strict";
import { test } from "node:test";

import type { ModelInvocationRecord, ModelRequest } from "../../core/model/contracts.js";
import { ModelGatewayError } from "../../core/model/errors.js";
import { DeepSeekModelGateway } from "./deepseek-model-gateway.js";

const request: ModelRequest = {
  taskId: "task-intent-001",
  purpose: "restaurant_intent_parse",
  promptVersion: "v1",
  messages: [
    { role: "system", content: "Return JSON only." },
    { role: "user", content: "Tonight at 7pm in Shinjuku for two." },
  ],
  responseFormat: "JSON_OBJECT",
  outputSchema: { name: "restaurant-intent-draft", version: "1" },
  timeoutMs: 100,
  fallback: "STRUCTURED_FORM",
  maxOutputTokens: 256,
  temperature: 0,
  thinking: "disabled",
};

test("DeepSeek gateway sends a bounded server-side JSON completion and records redacted metadata", async () => {
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
              finish_reason: "stop",
              message: { content: '{"partySize":2}' },
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

  assert.equal(capturedInput, "https://api.deepseek.com/chat/completions");
  assert.equal(new Headers(capturedInit?.headers).get("Authorization"), "Bearer test-key");
  const body = JSON.parse(String(capturedInit?.body)) as Record<string, unknown>;
  assert.deepEqual(body, {
    model: "deepseek-v4-flash",
    messages: request.messages,
    response_format: { type: "json_object" },
    stream: false,
    max_tokens: 256,
    temperature: 0,
    thinking: { type: "disabled" },
  });
  assert.equal("taskId" in body, false);
  assert.equal(result.provider, "DEEPSEEK");
  assert.equal(result.outputText, '{"partySize":2}');
  assert.equal(result.finishReason, "STOP");
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
    purpose: "restaurant_intent_parse",
    promptVersion: "v1",
    fallback: "STRUCTURED_FORM",
    provider: "DEEPSEEK",
    model: "deepseek-v4-flash",
    responseFormat: "JSON_OBJECT",
    outputSchema: { name: "restaurant-intent-draft", version: "1" },
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
      new Response(JSON.stringify({ error: { message: "credential detail" } }), { status: 429 }),
  });

  await assert.rejects(
    () => gateway.complete(request),
    (error: unknown) =>
      error instanceof ModelGatewayError &&
      error.code === "PROVIDER_RATE_LIMITED" &&
      error.retryable &&
      error.providerStatus === 429 &&
      !error.message.includes("credential detail"),
  );
  assert.equal(records.length, 1);
  assert.equal(records[0]?.outcome, "FAILED");
  assert.equal(records[0]?.errorCode, "PROVIDER_RATE_LIMITED");
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
