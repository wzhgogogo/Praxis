import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { RestaurantSemanticInterpreter } from "../../../src/domains/restaurant/semantic-interpreter.ts";
import { compileRestaurantSemanticProposal } from "../../../src/domains/restaurant/semantic-compiler.ts";
import { restaurantBookingTaskDefinition } from "../../../src/domains/restaurant/task-definition.ts";
import { InMemoryTaskRuntime } from "../../../src/core/task-runtime/in-memory-task-runtime.ts";
import { FakeClock } from "../../../src/harness/fake-clock.ts";

const prior = ".eval-artifacts/phase3a-boundary/batch3/continuation/rows", out = ".eval-artifacts/phase3b/named-target";
const captured = ["005", "006"].map(n => JSON.parse(readFileSync(`${prior}/${n}.main.json`, "utf8")));
assert.deepEqual(captured.map(r => r.input.message), ["I want Sushi Dai.", "Tomorrow between 19:00 and 19:30 for two people in Tsukiji."]);
const reference = process.argv.includes("--reference-valid"), proposals = captured.map(r => structuredClone(r.interpreted.proposal));
if (reference) {
  const target = proposals[1].facts.find(f => f.field === "TARGET").value;
  target.query = "Sushi Dai"; target.selectionScope = "SPECIFIC_OUTLET";
}
const requests = []; let cursor = 0;
const gateway = { async complete(request) {
  requests.push(request); const proposal = proposals[cursor++]; assert(proposal);
  return { invocationId: `fixture:${cursor}`, provider: "DEEPSEEK", model: "FIXTURE_NO_NETWORK", outputText: JSON.stringify(proposal), finishReason: "TOOL_CALLS", latencyMs: 0 };
} };
const interpreter = new RestaurantSemanticInterpreter(gateway), clock = new FakeClock("2026-08-05T09:00:00+09:00"); let seq = 0;
const runtime = new InMemoryTaskRuntime(restaurantBookingTaskDefinition, clock, p => `${p}:${++seq}`), taskId = "phase3b:sr03";
runtime.createTask(taskId, {}, { runId: taskId }); const rows = [];
for (const turn of captured) {
  const before = runtime.snapshot(taskId), currentDraft = before.domainState.intentDraft;
  const interpreted = await interpreter.interpret({ taskId, message: turn.input.message, referenceTime: clock.now().toISOString(), timezone: "Asia/Tokyo", ...(currentDraft ? { currentDraft } : {}) });
  assert.equal(interpreted.status, "PROPOSED");
  const compiled = compileRestaurantSemanticProposal(interpreted.proposal, { referenceTime: clock.now().toISOString(), timezone: "Asia/Tokyo" }); assert.equal(compiled.status, "COMPILED");
  const eventId = `event:${++seq}`;
  const result = runtime.dispatch({ id: eventId, taskId, event: { type: "SEMANTIC_PROPOSAL_COMPILED", patch: compiled.patch }, occurredAt: clock.now().toISOString(), trace: { schemaVersion: "1", runId: taskId, correlationId: eventId, actor: "MODEL" } }, before.version);
  rows.push({ message: turn.input.message, currentDraft, interpreted, compiled, actualDraft: result.snapshot.domainState.intentDraft, commands: result.commands });
}
const modelQuery = rows[1].interpreted.proposal.facts.find(f => f.field === "TARGET").value.query;
const finalQuery = rows[1].actualDraft.target.query;
const nameAlreadyInContext = requests[1].messages[0].content.includes('"query":"Sushi Dai"');
assert(nameAlreadyInContext); assert.equal(rows[1].compiled.patch.target.query, modelQuery); assert.equal(finalQuery, modelQuery);
const result = { mode: "FIXTURE_MODEL_PRODUCTION_INTERPRETER_COMPILER_RUNTIME", referenceValidProposal: reference, realModelCalls: 0,
  nameAlreadyInModelContext: nameAlreadyInContext, firstLoss: modelQuery === "Sushi Dai" ? null : "MODEL_PROPOSAL_BEFORE_COMPILER",
  compilerAndReducerFaithfullyApplyProposal: true, expectedQuery: "Sushi Dai", actualQuery: finalQuery, rows, requests,
  limitation: reference ? "Oracle-correct model payload is a downstream counterfactual control, not a product repair or proof of LLM compliance." : "Captured bad proposal remains schema-valid. Independent literal user name supplies the failure oracle." };
writeFileSync(`${out}/${reference ? "reference-control" : "baseline-red"}.json`, JSON.stringify(result, null, 2) + "\n");
assert.equal(finalQuery, "Sushi Dai", "Supplying visit time/party/area must preserve the user's named outlet");
assert.equal(rows[1].actualDraft.target.selectionScope, "SPECIFIC_OUTLET");
console.log(JSON.stringify({ status: "PASS", referenceControlOnly: reference, expectedQuery: "Sushi Dai", actualQuery: finalQuery, realModelCalls: 0 }));
