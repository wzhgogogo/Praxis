import assert from "node:assert/strict";
import { test } from "node:test";

import {
  requireRealModelEvalConfiguration,
  summarizeRealModelEval,
} from "./real-model.js";

test("real model Eval requires an explicit paid-network gate and validates optional price inputs", () => {
  assert.throws(
    () => requireRealModelEvalConfiguration({}, 8),
    /PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 is required/,
  );
  assert.throws(
    () =>
      requireRealModelEvalConfiguration(
        {
          PRAXIS_ALLOW_LIVE_MODEL_EVAL: "1",
          PRAXIS_DEEPSEEK_INPUT_USD_PER_MILLION_TOKENS: "0.2",
        },
        8,
      ),
    /Set both PRAXIS_DEEPSEEK_INPUT_USD_PER_MILLION_TOKENS/,
  );
  assert.deepEqual(
    requireRealModelEvalConfiguration(
      {
        PRAXIS_ALLOW_LIVE_MODEL_EVAL: "1",
        PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT: "1",
        PRAXIS_DEEPSEEK_INPUT_USD_PER_MILLION_TOKENS: "0.2",
        PRAXIS_DEEPSEEK_OUTPUT_USD_PER_MILLION_TOKENS: "0.8",
      },
      8,
    ),
    {
      caseLimit: 1,
      pricing: { inputUsdPerMillionTokens: 0.2, outputUsdPerMillionTokens: 0.8 },
    },
  );
});

test("real model Eval metrics retain provider metadata, retries, usage and explicitly estimated cost", () => {
  const metrics = summarizeRealModelEval(
    [
      {
        invocationId: "one",
        taskId: "eval:restaurant:semantic:SH01:T01",
        purpose: "restaurant_semantic_interpret",
        promptVersion: "v2",
        fallback: "STRUCTURED_FORM",
        provider: "DEEPSEEK",
        model: "deepseek-v4-flash",
        responseFormat: "JSON_OBJECT",
        outputSchema: { name: "restaurant-semantic-proposal", version: "1" },
        outcome: "SUCCEEDED",
        latencyMs: 40,
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        providerStatus: 200,
      },
      {
        invocationId: "two",
        taskId: "eval:restaurant:semantic:SH01:T01",
        purpose: "restaurant_semantic_interpret",
        promptVersion: "v2",
        fallback: "STRUCTURED_FORM",
        provider: "DEEPSEEK",
        model: "deepseek-v4-flash",
        responseFormat: "JSON_OBJECT",
        outputSchema: { name: "restaurant-semantic-proposal", version: "1" },
        outcome: "SUCCEEDED",
        latencyMs: 60,
        usage: { inputTokens: 80, outputTokens: 20, totalTokens: 100 },
        providerStatus: 200,
      },
    ],
    1,
    { inputUsdPerMillionTokens: 1, outputUsdPerMillionTokens: 2 },
  );

  assert.deepEqual(metrics, {
    modelCalls: 2,
    successfulCalls: 2,
    failedCalls: 0,
    retryCalls: 1,
    totalLatencyMs: 100,
    providerModels: ["DEEPSEEK:deepseek-v4-flash"],
    usage: {
      reportedByCalls: 2,
      inputTokens: 180,
      outputTokens: 70,
      totalTokens: 250,
    },
    cost: {
      status: "ESTIMATED_FROM_ENV",
      currency: "USD",
      amount: 0.00032,
      inputUsdPerMillionTokens: 1,
      outputUsdPerMillionTokens: 2,
    },
  });
  assert.equal(
    summarizeRealModelEval(
      [
        {
          invocationId: "turn-one",
          taskId: "eval:restaurant:semantic:SH01:T01",
          purpose: "restaurant_semantic_interpret",
          promptVersion: "v2",
          fallback: "FAIL_CLOSED",
          provider: "DEEPSEEK",
          model: "deepseek-v4-flash",
          responseFormat: "JSON_OBJECT",
          outputSchema: { name: "restaurant-semantic-proposal", version: "1" },
          outcome: "SUCCEEDED",
          latencyMs: 1,
        },
        {
          invocationId: "turn-two",
          taskId: "eval:restaurant:semantic:SH01:T02",
          purpose: "restaurant_semantic_interpret",
          promptVersion: "v2",
          fallback: "FAIL_CLOSED",
          provider: "DEEPSEEK",
          model: "deepseek-v4-flash",
          responseFormat: "JSON_OBJECT",
          outputSchema: { name: "restaurant-semantic-proposal", version: "1" },
          outcome: "SUCCEEDED",
          latencyMs: 1,
        },
      ],
      2,
      undefined,
    ).retryCalls,
    0,
  );
});
