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


test("independent question scopes isolate their own calls and deadline from a depleted search",async()=>{
  let now=100_000,calls=0;
  const provider:ModelGateway={async complete(){calls++;return {invocationId:String(calls),provider:"FIXTURE",model:"fixture",outputText:"{}",finishReason:"STOP",latencyMs:0};}};
  const search=new RunBoundedModelGateway(provider,50,500_000,()=>now);
  await search.run("case",async()=>{for(let n=0;n<49;n++)await search.complete(request);});
  const original=search.usage("case");
  now+=520_000;
  const questions=new RunBoundedModelGateway(search,3,60_000,()=>now);
  for(const id of ["q1","q2"])await questions.run(id,async()=>{
    for(let n=0;n<3;n++)await questions.complete(request);
    await assert.rejects(()=>questions.complete(request),{code:"MODEL_CALL_BUDGET_EXHAUSTED"});
  });
  assert.equal(calls,55,"each question has three provider calls independently of 49 original calls");
  assert.deepEqual(search.usage("case"),original,"question calls never resume or restart the original search");
  const deadline=now+20_000;
  await questions.run("q3",async()=>{
    assert.equal(questions.usage("q3")?.deadlineAt,deadline,"submission deadline includes time before the reader");
    now=deadline+1;
    await assert.rejects(()=>questions.complete(request),{code:"RUN_DEADLINE_EXCEEDED"});
  },deadline);
  assert.equal(calls,55);
});

test("late async work cannot start another model call after its original run closes", async()=>{
  let release!:()=>void; const gate=new Promise<void>(resolve=>{release=resolve;});
  let calls=0; let late!:Promise<unknown>;
  const model:ModelGateway={async complete(){calls++;return {invocationId:"late",provider:"FIXTURE",model:"fixture",outputText:"{}",finishReason:"STOP",latencyMs:0};}};
  const budget=new RunBoundedModelGateway(model,2,10_000);
  await budget.run("case",async()=>{late=gate.then(()=>budget.complete(request));});
  release();await assert.rejects(late,{code:"RUN_DEADLINE_EXCEEDED"});assert.equal(calls,0);
});
