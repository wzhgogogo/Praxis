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
  assert.equal(budget.remainingCalls("case-a"), undefined);
  await assert.rejects(() => budget.run("case-a", async () => {
    await assert.rejects(() => budget.complete(request), /provider failure/);
    assert.equal(budget.remainingCalls("case-a"), 1, "failed calls consume the reported reserve");
    await budget.complete(request);
    assert.equal(budget.remainingCalls("case-a"), 0);
    await budget.complete(request);
  }), (error: unknown) => !!error && typeof error === "object" && (error as { code?: string }).code === "MODEL_CALL_BUDGET_EXHAUSTED");
  assert.equal(budget.remainingCalls("case-a"), undefined, "finished runs cannot open a later task's window");
  let releaseA!: () => void;
  let releaseB!: () => void;
  let releaseBarrier!: () => void;
  const barrier = new Promise<void>((resolve) => { releaseBarrier = resolve; });
  const overlappingA = budget.run("case-a", async () => {
    releaseA = budget.hold();
    await barrier;
    await budget.complete(request);
    assert.equal(budget.remainingCalls("case-a"), 1);
    await budget.complete(request);
    assert.equal(budget.remainingCalls("case-a"), 0);
    await assert.rejects(() => budget.complete(request), (error: unknown) => !!error && typeof error === "object" && (error as { code?: string }).code === "MODEL_CALL_BUDGET_EXHAUSTED");
  });
  const overlappingB = budget.run("case-b", async () => {
    releaseB = budget.hold();
    await barrier;
    await budget.complete(request);
    assert.equal(budget.remainingCalls("case-b"), 1);
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


test("displayed-page follow-up resumes original time and failed-call accounting without borrowing another case", async () => {
  let now = 100_000;
  let calls = 0;
  const model: ModelGateway = {async complete() {calls++;return {invocationId:String(calls),provider:"FIXTURE",model:"fixture",outputText:"{}",finishReason:"STOP",latencyMs:0};}};
  const budget = new RunBoundedModelGateway(model,2,10_000,()=>now);
  await budget.run("a",async()=>{await budget.complete(request);});
  const original = budget.usage("a")!;
  now += 1000;
  await budget.run("b",async()=>{await budget.complete(request);});
  await budget.resume("a",async()=>{
    assert.equal(budget.remainingCalls("a"),1);
    assert.equal(budget.usage("a")!.deadlineAt,original.deadlineAt);
    await budget.complete(request);
    await assert.rejects(()=>budget.complete(request),{code:"MODEL_CALL_BUDGET_EXHAUSTED"});
  });
  assert.equal(budget.usage("a")!.calls,2);
  assert.equal(budget.usage("b")!.calls,1);
  await assert.rejects(()=>budget.resume("unknown",async()=>{}),{code:"RUN_BUDGET_UNAVAILABLE"});
  now = budget.usage("b")!.deadlineAt+1;
  await assert.rejects(()=>budget.resume("b",async()=>{await budget.complete(request);}),{code:"RUN_DEADLINE_EXCEEDED"});
  assert.equal(calls,3,"expired or exhausted resumes cannot contact the provider");
});


test("late async work cannot start another model call after its original run closes", async()=>{
  let release!:()=>void; const gate=new Promise<void>(resolve=>{release=resolve;});
  let calls=0; let late!:Promise<unknown>;
  const model:ModelGateway={async complete(){calls++;return {invocationId:"late",provider:"FIXTURE",model:"fixture",outputText:"{}",finishReason:"STOP",latencyMs:0};}};
  const budget=new RunBoundedModelGateway(model,2,10_000);
  await budget.run("case",async()=>{late=gate.then(()=>budget.complete(request));});
  release();await assert.rejects(late,{code:"RUN_DEADLINE_EXCEEDED"});assert.equal(calls,0);
});
