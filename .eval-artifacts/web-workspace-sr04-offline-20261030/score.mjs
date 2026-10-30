import assert from "node:assert/strict";
import {readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {isDeepStrictEqual} from "node:util";
import {InMemoryTaskRuntime} from "../../src/core/task-runtime/in-memory-task-runtime.ts";
import {compileRestaurantSemanticProposal} from "../../src/domains/restaurant/semantic-compiler.ts";
import {restaurantBookingTaskDefinition} from "../../src/domains/restaurant/task-definition.ts";
import {FakeClock} from "../../src/harness/fake-clock.ts";
import {restaurantSemanticGoalAnnotation} from "../../src/eval/restaurant/semantic/goal-boundary.ts";
import {restaurantSemanticRegressionProposalFor} from "../../src/eval/restaurant/semantic/stage-oracles.ts";
import {evaluateRestaurantSemanticGoal, scoreRestaurantSemanticTurn} from "../../src/eval/restaurant/semantic/scorer.ts";

globalThis.fetch = async () => {throw Error("Offline scoring forbids network");};
const folder = resolve(".eval-artifacts/web-workspace-sr04-offline-20261030/execution");
const load = path => JSON.parse(readFileSync(path, "utf8"));
const replay = load(resolve(folder, "unguarded.json"));
const guarded = load(resolve(folder, "guarded.json"));
assert.ok(replay.passed && guarded.passed);
const row = replay.rows.find(row => row.turnId === "SR04-T01");
const proposal = row.interpreted.proposal;
assert.deepEqual(proposal, guarded.rows.find(value => value.turnId === row.turnId).interpreted.proposal);
const old = load(".eval-artifacts/phase3b/c-batch2/semantic/rows/031.json");
assert.equal(old.turnId, row.turnId);
const posthoc = load(".eval-artifacts/phase3b/c-batch2/semantic/posthoc-evaluation.json").rows.find(value => value.cohort === "DEVELOPMENT" && value.turnId === row.turnId);
const dataset = load("src/eval/restaurant/semantic/cases/restaurant-semantic-regression.gold5.json");
const session = dataset.sessions.find(value => value.id === row.sessionId);
const turn = session.turns[0];
assert.equal(old.input.message, turn.message);
assert.equal(old.input.referenceTime, dataset.referenceTime);
assert.deepEqual(old.gold, turn.expectedDraft);
const expectation = restaurantSemanticGoalAnnotation(turn.message, turn.id, session.id);
assert.deepEqual(expectation, posthoc.expectation);
function evaluate(savedProposal, label) {
  const temporalContext = {referenceTime:dataset.referenceTime, timezone:"Asia/Tokyo"};
  const compilation = compileRestaurantSemanticProposal(savedProposal, temporalContext);
  assert.equal(compilation.status, "COMPILED");
  let sequence = 0;
  const runtime = new InMemoryTaskRuntime(restaurantBookingTaskDefinition, new FakeClock(dataset.referenceTime), prefix => `${prefix}:${++sequence}`);
  const taskId = "offline:" + label;
  runtime.createTask(taskId, {}, {runId:taskId});
  const snapshot = runtime.snapshot(taskId);
  const applied = runtime.dispatch({id:taskId + ":compiled", taskId,
    event:{type:"SEMANTIC_PROPOSAL_COMPILED", patch:compilation.patch},
    occurredAt:dataset.referenceTime,
    trace:{schemaVersion:"1", runId:snapshot.runId, correlationId:taskId, actor:"MODEL"},
  }, snapshot.version);
  const draft = applied.snapshot.domainState.intentDraft;
  const goal = evaluateRestaurantSemanticGoal({proposal:savedProposal, actualGoal:draft?.target?.goal, expectation});
  const oracle = restaurantSemanticRegressionProposalFor(turn.message);
  const expectedCompilation = compileRestaurantSemanticProposal(oracle, temporalContext);
  assert.equal(expectedCompilation.status, "COMPILED");
  const strictScore = scoreRestaurantSemanticTurn({actualProposal:savedProposal, expectedProposal:oracle,
    actualCompiledPatch:compilation.patch, expectedCompiledPatch:expectedCompilation.patch,
    actualDraft:draft, expectedDraft:turn.expectedDraft, goalBoundary:expectation});
  return {compilation, draft, goal, strictScore};
}
const current = evaluate(proposal, "v28");
const baseline = evaluate(old.interpreted.proposal, "v26");
assert.deepEqual(baseline.goal, posthoc.goal);
assert.deepEqual(baseline.strictScore, posthoc.strictScore);
const target = value => value.facts.filter(fact => fact.field === "TARGET");
const targetMeaning = value => target(value).map(({value:{goalBasis, ...meaning}}) => meaning);
const checks = {
  bothGoalsSatisfied:current.goal.status === "SATISFIED" && baseline.goal.status === "SATISFIED",
  sameTargetMeaning:isDeepStrictEqual(targetMeaning(proposal), targetMeaning(old.interpreted.proposal)),
  sameTarget:isDeepStrictEqual(target(proposal), target(old.interpreted.proposal)),
  sameFullProposal:isDeepStrictEqual(proposal, old.interpreted.proposal),
  sameCompilation:isDeepStrictEqual(current.compilation, baseline.compilation),
  sameAuthoritativeDraft:isDeepStrictEqual(current.draft, baseline.draft),
  sameGoalEvaluation:isDeepStrictEqual(current.goal, baseline.goal),
  sameStrictScore:isDeepStrictEqual(current.strictScore, baseline.strictScore),
};
// Free-form basis wording and non-target strict failures are diagnostic details,
// not new gates. The user-approved stop rule concerns parsing and target rules.
const passed = checks.bothGoalsSatisfied && checks.sameTargetMeaning;
const result = {schema:"sr04-offline-score@1", turnId:turn.id, realAPIRequests:0,
  expectation, checks, current, baseline, passed,
  attribution:passed ? "TEST_GUARD_OR_TRANSPORT_LAYER" : "STOP_PARSE_OR_TARGET_MISMATCH",
  promptRegression:passed ? false : null,
  limitation:"Saved full-body Response replay cannot reproduce the original live stream, socket, abort timing or missing exception cause; it does not identify guard versus transport."};
writeFileSync(resolve(folder, "score.json"), JSON.stringify(result, null, 2) + "\n", {flag:"wx"});
assert.ok(passed, "SR04 parsing or frozen target differs from v26; stop");
console.log(JSON.stringify({SR04:"SATISFIED", checks, attribution:result.attribution, realAPIRequests:0}));
