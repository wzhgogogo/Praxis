import assert from "node:assert/strict";
import test from "node:test";

import type { ModelGateway } from "../core/model/contracts.js";
import { RunBoundedModelGateway } from "./run-bounded-model-gateway.js";

const request = { taskId: "case", purpose: "fixture", promptVersion: "1", messages: [], responseFormat: "TEXT" as const, outputSchema: { name: "fixture", version: "1" }, timeoutMs: 10_000, fallback: "FAIL_CLOSED" as const };

test("whole-read model budget starts before semantic work, counts failed calls, and isolates concurrent runs", async () => {
  const calls: string[] = [];
  const provider: ModelGateway = { async complete(input) {
    calls.push(input.taskId);
    if (calls.length === 1) throw new Error("provider failure");
    return { invocationId: String(calls.length), provider: "FIXTURE", model: "fixture", outputText: "{}", finishReason: "STOP", latencyMs: 1 };
  } };
  const budget = new RunBoundedModelGateway(provider, 2, 5_000);
  await assert.rejects(() => budget.run("case-a", async () => {
    await assert.rejects(() => budget.complete(request), /provider failure/);
    await budget.complete(request);
    await budget.complete(request);
  }), (error: unknown) => !!error && typeof error === "object" && (error as { code?: string }).code === "MODEL_CALL_BUDGET_EXHAUSTED");
  let releaseA!: () => void;
  let releaseB!: () => void;
  let releaseBarrier!: () => void;
  const barrier = new Promise<void>((resolve) => { releaseBarrier = resolve; });
  const overlappingA = budget.run("case-a", async () => {
    releaseA = budget.hold();
    await barrier;
    await budget.complete(request);
    await budget.complete(request);
    await assert.rejects(() => budget.complete(request), (error: unknown) => !!error && typeof error === "object" && (error as { code?: string }).code === "MODEL_CALL_BUDGET_EXHAUSTED");
  });
  const overlappingB = budget.run("case-b", async () => {
    releaseB = budget.hold();
    await barrier;
    await budget.complete(request);
    await budget.complete(request);
    await assert.rejects(() => budget.complete(request), (error: unknown) => !!error && typeof error === "object" && (error as { code?: string }).code === "MODEL_CALL_BUDGET_EXHAUSTED");
  });
  releaseBarrier();
  await Promise.all([overlappingA, overlappingB]);
  releaseA();
  releaseB();
  assert.equal(calls.length, 6, "each overlapping task owns its own two-call ceiling");
});

test("retained live work observes the original deadline even without another model call", async () => {
  const provider: ModelGateway = { async complete() { throw new Error("not used"); } };
  const budget = new RunBoundedModelGateway(provider, 2, 20);
  let release!: () => void;
  await budget.run("case", async (signal) => {
    release = budget.hold();
    await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve(), { once: true }));
    assert.equal(signal.aborted, true);
  });
  release();
  assert.equal(budget.usage("case")?.calls, 0);
});
