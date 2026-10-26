import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { RestaurantSemanticInterpreter } from "../../../src/domains/restaurant/semantic-interpreter.ts";
import { compileRestaurantSemanticProposal } from "../../../src/domains/restaurant/semantic-compiler.ts";
import { restaurantBookingTaskDefinition } from "../../../src/domains/restaurant/task-definition.ts";
import { InMemoryTaskRuntime } from "../../../src/core/task-runtime/in-memory-task-runtime.ts";
import { FakeClock } from "../../../src/harness/fake-clock.ts";
import { DeepSeekModelGateway } from "../../../src/infrastructure/deepseek/deepseek-model-gateway.ts";
import { restaurantSemanticRegressionProposalFor } from "../../../src/eval/restaurant/semantic/stage-oracles.ts";
import { evaluateRestaurantSemanticGoal, scoreRestaurantSemanticTurn } from "../../../src/eval/restaurant/semantic/scorer.ts";

const base = ".eval-artifacts/phase3a-boundary", out = `${base}/review-correction`;
const load = path => JSON.parse(readFileSync(path, "utf8"));
const hash = value => createHash("sha256").update(value).digest("hex");
const cet = () => new Date(Date.now() + 3600000).toISOString().replace("Z", "+01:00");
const git = (...args) => execFileSync("git", args, { encoding: "utf8", env: { PATH: process.env.PATH, HOME: process.env.HOME, LANG: "C.UTF-8" } }).trim();
class Stop extends Error { constructor(code, detail = {}) { super(code); this.code = code; this.detail = detail; } }
function save(path, value, exclusive = false) {
  const data = JSON.stringify(value, null, 2) + "\n";
  if (process.env.DEEPSEEK_API_KEY && data.includes(process.env.DEEPSEEK_API_KEY)) throw new Stop("S0_CREDENTIAL_RECORDING_REFUSED");
  writeFileSync(path, data, { flag: exclusive ? "wx" : "w" });
}
function verify() {
  for (const item of load(`${out}/freeze.json`).files) {
    if (item.path.includes(".eval-private/") || item.path.split("/").some(part => part.startsWith(".env"))) throw new Stop("INFRASTRUCTURE_FORBIDDEN_INPUT");
    if (hash(readFileSync(item.path)) !== item.sha256) throw new Stop("INFRASTRUCTURE_FROZEN_INPUT_CHANGED", { path: item.path });
  }
}
function nextCount(count) {
  if (!Number.isSafeInteger(count) || count < 84 || count >= 144) throw new Stop("BUDGET_EXHAUSTED");
  return count + 1;
}
function hasBasis(value) {
  return value && typeof value === "object" && (Object.hasOwn(value, "goalBasis") || Object.values(value).some(hasBasis));
}
function projection(draft, gold) {
  if (!draft) return null;
  const result = { criteria: [...new Set(draft.criteria.map(c => JSON.stringify({ text: c.text.trim().toLowerCase(), polarity: c.polarity, strength: c.strength })))].sort() };
  for (const key of ["date", "timeWindow", "permittedAlternativeTimeWindow", "partySize", "area", "budgetPerPerson"]) {
    if (Object.hasOwn(draft, key)) result[key] = draft[key];
  }
  if (gold.target) {
    result.target = {};
    for (const key of ["query", "selectionScope", "requestedResultCount"]) if (Object.hasOwn(gold.target, key) && draft.target?.[key] !== undefined) result.target[key] = draft.target[key];
  }
  return result;
}
function differences(expected, actual, path = "") {
  if (isDeepStrictEqual(expected, actual)) return [];
  if (expected && actual && typeof expected === "object" && typeof actual === "object" && !Array.isArray(expected) && !Array.isArray(actual)) {
    return [...new Set([...Object.keys(expected), ...Object.keys(actual)])].flatMap(key => differences(expected[key], actual[key], path ? `${path}.${key}` : key));
  }
  return [{ path, ...(expected === undefined ? { expectedAbsent: true } : { expected }), ...(actual === undefined ? { actualAbsent: true } : { actual }) }];
}
function createSession(session) {
  const clock = new FakeClock(session.referenceTime); let sequence = 0;
  const taskId = `boundary-review:${session.id}`;
  const runtime = new InMemoryTaskRuntime(restaurantBookingTaskDefinition, clock, prefix => `${prefix}:${++sequence}`);
  runtime.createTask(taskId, {}, { runId: `run:${taskId}` });
  const transitions = [];
  return { taskId, transitions, snapshot: () => runtime.snapshot(taskId), dispatch(event) {
    const before = runtime.snapshot(taskId), id = `event:${session.id}:${++sequence}`;
    const result = runtime.dispatch({ id, taskId, event, occurredAt: clock.now().toISOString(), trace: { schemaVersion: "1", runId: before.runId, correlationId: id, actor: "MODEL" } }, before.version);
    transitions.push({ event, commands: result.commands ?? [], domainState: structuredClone(result.snapshot.domainState) });
    if (result.commands?.length || hasBasis(result.snapshot.domainState.intentDraft)) throw new Stop("S0_SEMANTIC_AUTHORITY_BOUNDARY");
    if (event.type === "SEMANTIC_PROPOSAL_COMPILED" && event.patch.target?.goal && result.snapshot.domainState.intentDraft?.target?.goal !== event.patch.target.goal) throw new Stop("S0_DOWNSTREAM_GOAL_MUTATION");
  } };
}
async function runTurn(session, turn, runtime, interpreter) {
  const transitionStart = runtime.transitions.length;
  const before = runtime.snapshot().domainState.intentDraft;
  const input = { taskId: runtime.taskId, message: turn.message, referenceTime: session.referenceTime, timezone: "Asia/Tokyo", ...(before ? { currentDraft: before } : {}) };
  const interpreted = await interpreter.interpret(input);
  let compilation;
  if (interpreted.status === "PROPOSED") {
    compilation = compileRestaurantSemanticProposal(interpreted.proposal, { referenceTime: input.referenceTime, timezone: input.timezone });
    runtime.dispatch(compilation.status === "COMPILED" ? { type: "SEMANTIC_PROPOSAL_COMPILED", patch: compilation.patch } : { type: "SEMANTIC_CONFLICT_RECORDED", conflict: compilation.conflict });
  } else runtime.dispatch({ type: "SEMANTIC_INTERPRETATION_FAILED", status: interpreted.status, reason: `Interpreter status ${interpreted.status}` });
  const actualDraft = runtime.snapshot().domainState.intentDraft;
  const expectation = { category: turn.category, message: turn.message, ...(before?.target ? { previousGoal: before.target.goal } : {}) };
  const proposal = interpreted.status === "PROPOSED" ? interpreted.proposal : undefined;
  const oracle = restaurantSemanticRegressionProposalFor(turn.message);
  const expectedCompilation = compileRestaurantSemanticProposal(oracle, { referenceTime: input.referenceTime, timezone: input.timezone });
  const goal = evaluateRestaurantSemanticGoal({ ...(proposal ? { proposal } : {}), ...(actualDraft?.target ? { actualGoal: actualDraft.target.goal } : {}), expectation });
  const nonGoalDifferences = actualDraft ? differences(projection(turn.expectedDraft, turn.expectedDraft), projection(actualDraft, turn.expectedDraft)) : [{ path: "draft", actualAbsent: true }];
  const strictScore = scoreRestaurantSemanticTurn({ ...(proposal ? { actualProposal: proposal } : {}), expectedProposal: oracle,
    ...(compilation?.status === "COMPILED" ? { actualCompiledPatch: compilation.patch } : {}),
    ...(expectedCompilation.status === "COMPILED" ? { expectedCompiledPatch: expectedCompilation.patch } : {}),
    actualDraft, expectedDraft: turn.expectedDraft, goalBoundary: expectation });
  return { sessionId: session.id, repetition: session.repetition, turnId: turn.id, input, interpreted, compilation, actualDraft, transitions: runtime.transitions.slice(transitionStart),
    gold: turn.expectedDraft, category: turn.category, evaluation: { goal, nonGoalDifferences, strictScore } };
}
async function selfTest() {
  const sessions = load(`${out}/selected-inputs.json`).sessions;
  for (const defect of ["NONE", "PARTY", "GOAL", "INVALID"]) {
    let count = 0; const rows = [];
    const interpreter = { async interpret(input) {
      count++;
      if (count === 1 && defect === "INVALID") return { status: "INVALID_MODEL_OUTPUT", errors: ["controlled invalid output"], attempts: [] };
      const proposal = restaurantSemanticRegressionProposalFor(input.message);
      if (count === 1 && defect === "PARTY") proposal.facts.find(f => f.field === "PARTY_SIZE").value.value = 99;
      if (count === 1 && defect === "GOAL") proposal.facts.find(f => f.field === "TARGET").value.goal = "RECOMMENDATION";
      return { status: "PROPOSED", proposal, attempts: [] };
    } };
    for (const session of sessions) {
      const runtime = createSession(session);
      for (const turn of session.turns) rows.push(await runTurn(session, turn, runtime, interpreter));
    }
    assert.equal(count, 9);
    if (defect === "NONE") assert(rows.every(r => r.evaluation.goal.status === "SATISFIED" && r.evaluation.nonGoalDifferences.length === 0));
    if (defect === "PARTY") assert(rows[0].evaluation.nonGoalDifferences.length > 0);
    if (defect === "GOAL") assert.equal(rows[0].evaluation.goal.status, "NOT_SATISFIED");
    if (defect === "INVALID") assert.equal(rows[0].interpreted.status, "INVALID_MODEL_OUTPUT");
  }
  assert.equal(nextCount(143), 144); assert.throws(() => nextCount(144), /BUDGET/);
  assert(hasBasis({ target: { goalBasis: {} } }));
  console.log(JSON.stringify({ mode: "OFFLINE", fourNineTurnControls: "PASS", budget: "PASS", realModelCalls: 0 }));
}
async function execute() {
  verify(); assert.equal(git("status", "--porcelain"), "");
  if (!process.env.DEEPSEEK_API_KEY?.trim()) { console.log("未加载"); throw new Stop("INFRASTRUCTURE_CREDENTIAL_NOT_LOADED"); }
  assert.equal(process.env.DEEPSEEK_MODEL, "deepseek-v4-flash"); assert.equal(process.env.PRAXIS_ALLOW_LIVE_MODEL_EVAL, "1"); console.log("已加载");
  const sourceCommit = git("rev-parse", "HEAD"), ledger = load(`${base}/budget.json`), sharedPath = ".eval-artifacts/phase3a-prime/budget.json", shared = load(sharedPath);
  assert.equal(ledger.cumulative.realModelCalls, 84); assert.equal(ledger.limits.realModelCalls, 144);
  const allocation = shared.entries.find(e => e.slice === "phase3a-boundary stop1 independent allocation");
  assert.equal(allocation.chargedToThis400CallBudget, 0);
  const initialPrimeCumulative = structuredClone(shared.cumulative);
  save(`${out}/started.json`, { sourceCommit, startedAtCET: cet(), configuredModel: "deepseek-v4-flash", credentialStatus: "已加载", fileHandlingStatement: "未独立读取文件", priorCalls: 84, logicalTurns: 9, maximumAttempts: 18, ceiling: 144, freezeSha256: hash(readFileSync(`${out}/freeze.json`)) }, true);
  mkdirSync(`${out}/calls`, { recursive: true }); mkdirSync(`${out}/rows`, { recursive: true });
  let total = 84, active, fatal, providerRecords = [];
  const entry = { slice: "stop3 approved no-time booking correction / Prompt25", sourceCommit, realModelCalls: 0, fullLive: 0, googleRequests: 0, restaurantWebsiteRequests: 0, status: "RUNNING" };
  ledger.entries.push(entry);
  const persist = status => {
    entry.status = status; entry.realModelCalls = total - 84; ledger.cumulative.realModelCalls = total; ledger.status = status; ledger.asOf = cet();
    allocation.externalActualRealModelCalls = total; allocation.boundaryStage = status; shared.asOf = ledger.asOf;
    assert.deepEqual(shared.cumulative, initialPrimeCumulative);
    save(`${base}/budget.json`, ledger); save(sharedPath, shared);
  };
  const provider = DeepSeekModelGateway.fromEnvironment(process.env, { observer: { observe(record) { providerRecords.push(record); } } });
  const gateway = { async complete(request) {
    try { verify(); if (total - 84 >= 18) throw new Stop("BUDGET_BATCH_ATTEMPTS"); total = nextCount(total); } catch (error) { fatal = error; throw error; }
    active.attemptNumbers.push(total);
    const prefix = `${out}/calls/${String(total).padStart(3, "0")}`;
    save(`${prefix}.started.json`, { attempt: total, atCET: cet(), sessionId: active.sessionId, turnId: active.turnId, sourceCommit, request }, true);
    persist("RUNNING"); providerRecords = [];
    try {
      const response = await provider.complete(request);
      save(`${prefix}.response.json`, { response, providerRecords, atCET: cet() }, true);
      console.log(JSON.stringify({ event: "attempt", attempt: total, turnId: active.turnId, outcome: "SUCCEEDED" }));
      return response;
    } catch (error) {
      fatal = error instanceof Stop ? error : new Stop("INFRASTRUCTURE_PROVIDER_FAILURE", { errorCode: error?.code ?? "UNKNOWN" });
      save(`${prefix}.failure.json`, { atCET: cet(), errorCode: error?.code ?? "UNKNOWN", providerRecords }, true);
      throw error;
    }
  } };
  const interpreter = new RestaurantSemanticInterpreter(gateway), rows = []; let stop;
  try {
    for (const session of load(`${out}/selected-inputs.json`).sessions) {
      const runtime = createSession(session);
      for (const turn of session.turns) {
        active = { sessionId: session.id, turnId: turn.id, attemptNumbers: [] };
        const row = await runTurn(session, turn, runtime, interpreter);
        row.logicalIndex = rows.length + 1; row.attemptNumbers = active.attemptNumbers;
        save(`${out}/rows/${String(row.logicalIndex).padStart(3, "0")}.json`, row, true); rows.push(row);
        if (fatal) throw fatal;
        if (row.interpreted.status === "MODEL_FAILURE") throw new Stop("INFRASTRUCTURE_MODEL_FAILURE", { errorCode: row.interpreted.errorCode });
        console.log(JSON.stringify({ event: "turn", logical: rows.length, totalPlanned: 9, turnId: row.turnId, goal: row.evaluation.goal.status, nonGoalDifferenceCount: row.evaluation.nonGoalDifferences.length, cumulativeCalls: total }));
      }
    }
    assert.equal(rows.length, 9); verify();
  } catch (error) { stop = { code: error?.code ?? "INFRASTRUCTURE_RUNNER_FAILURE", detail: error?.detail ?? { errorType: error?.name ?? "UNKNOWN" } }; }
  const result = { status: stop ? "STOPPED" : "COMPLETED", sourceCommit, finishedAtCET: cet(), ...(stop ? { stop } : {}), priorRealCalls: 84, cumulativeRealCalls: total, newRealCalls: total - 84, plannedLogicalTurns: 9, completedLogicalTurns: rows.length, configuredModel: "deepseek-v4-flash", promptVersion: "v25", proposalSchema: "4", goldVersion: "4", sidecarVersion: "2", rows, sourceRequests: 0, privateHoldout: "NOT_READ" };
  save(`${out}/execution.json`, result, true); persist(stop ? "STOP_INFRA_BUDGET_OR_S0" : "REVIEW_CORRECTION_RERUN_COMPLETE");
  console.log(JSON.stringify({ status: result.status, completedLogicalTurns: rows.length, newRealCalls: total - 84, cumulativeCalls: total, ...(stop ? { stop } : {}) }));
}

if (process.argv.includes("--self-test")) await selfTest();
else if (process.argv.includes("--execute")) await execute();
else throw new Error("Choose --self-test or authorized --execute");
