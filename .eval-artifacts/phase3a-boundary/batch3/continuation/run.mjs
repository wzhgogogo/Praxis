import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { RestaurantSemanticInterpreter } from "../../../../src/domains/restaurant/semantic-interpreter.ts";
import { compileRestaurantSemanticProposal } from "../../../../src/domains/restaurant/semantic-compiler.ts";
import { applyRestaurantIntentPatch } from "../../../../src/domains/restaurant/intent-state.ts";
import { validateRestaurantSemanticProposal } from "../../../../src/domains/restaurant/semantic-proposal.ts";
import { restaurantBookingTaskDefinition } from "../../../../src/domains/restaurant/task-definition.ts";
import { InMemoryTaskRuntime } from "../../../../src/core/task-runtime/in-memory-task-runtime.ts";
import { FakeClock } from "../../../../src/harness/fake-clock.ts";
import { DeepSeekModelGateway } from "../../../../src/infrastructure/deepseek/deepseek-model-gateway.ts";
import { restaurantSemanticRegressionProposalFor } from "../../../../src/eval/restaurant/semantic/stage-oracles.ts";
import { evaluateRestaurantSemanticGoal, scoreRestaurantSemanticTurn, equalRestaurantSemanticProposals } from "../../../../src/eval/restaurant/semantic/scorer.ts";
import { evaluateRestaurantHybridLiveArtifact } from "../../../../src/eval/restaurant/agent-loop/diagnostic-evaluator.ts";
import { buildRestaurantSemanticInterpreterSystemPrompt as oldPrompt } from "./reference/prompt-renderer.ts";
import { RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA as oldJsonSchema, RESTAURANT_SEMANTIC_PROPOSAL_SCHEMA as oldSchema,
  validateRestaurantSemanticProposal as validateOld } from "./reference/proposal-control.ts";

const base = ".eval-artifacts/phase3a-boundary", previous = `${base}/batch3`, out = `${previous}/continuation`;
const load = path => JSON.parse(readFileSync(path, "utf8"));
const hash = value => createHash("sha256").update(value).digest("hex");
const cet = () => new Date(Date.now() + 3600000).toISOString().replace("Z", "+01:00");
const git = (...args) => execFileSync("git", args, { encoding: "utf8", env: { PATH: process.env.PATH, HOME: process.env.HOME, LANG: "C.UTF-8" } }).trim();
class Stop extends Error { constructor(code, detail = {}) { super(code); this.code = code; this.detail = detail; } }
function save(path, value, exclusive = false) {
  const text = JSON.stringify(value, null, 2) + "\n";
  if (process.env.DEEPSEEK_API_KEY && text.includes(process.env.DEEPSEEK_API_KEY)) throw new Stop("S0_CREDENTIAL_RECORDING_REFUSED");
  writeFileSync(path, text, { flag: exclusive ? "wx" : "w" });
}
function verify() {
  for (const item of load(`${out}/freeze.json`).files) {
    if (item.path.includes(".eval-private/") || item.path.split("/").some(part => part.startsWith(".env"))) throw new Stop("INFRASTRUCTURE_FORBIDDEN_INPUT_PATH");
    if (hash(readFileSync(item.path)) !== item.sha256) throw new Stop("INFRASTRUCTURE_FROZEN_INPUT_CHANGED", { path: item.path });
  }
}
function nextCount(count) {
  if (!Number.isSafeInteger(count) || count < 1 || count >= 144) throw new Stop("BUDGET_EXHAUSTED");
  return count + 1;
}
function hasBasisKey(value) {
  return value && typeof value === "object" && (Object.hasOwn(value, "goalBasis") || Object.values(value).some(hasBasisKey));
}
function infrastructureStop(row, pending) {
  return pending ?? (row.interpreted.status === "MODEL_FAILURE" ? new Stop("INFRASTRUCTURE_MODEL_FAILURE", { errorCode: row.interpreted.errorCode }) : undefined);
}
function boundary(turn, previousGoal) {
  return { category: turn.contextCarry || turn.annotation?.contextCarry ? "CONTEXT_CARRY" : turn.category ?? turn.annotation?.category,
    message: turn.message, ...(previousGoal ? { previousGoal } : {}) };
}
function canonicalCriteria(criteria = []) {
  return [...new Set(criteria.map(c => JSON.stringify({ text: c.text.trim().toLowerCase(), polarity: c.polarity, strength: c.strength })))].sort();
}
function view(draft, expected) {
  if (!draft) return undefined;
  const result = { criteria: canonicalCriteria(draft.criteria) };
  for (const key of ["date", "timeWindow", "permittedAlternativeTimeWindow", "partySize", "area", "budgetPerPerson"]) {
    if (Object.hasOwn(draft, key)) result[key] = draft[key];
  }
  if (expected?.target) {
    result.target = {};
    for (const key of ["query", "selectionScope", "requestedResultCount"]) {
      if (Object.hasOwn(expected.target, key) && draft.target?.[key] !== undefined) result.target[key] = draft.target[key];
    }
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
function publicAssessment(turn, draft) {
  if (!turn.originalSemantic || !draft?.target) return { status: "NOT_EVALUATED", reason: turn.gold === false ? "New input has no semantic Gold" : "No compiled Draft" };
  // Non-goal projection only: original Gold remains in turn.originalSemantic.
  // The original goal is projected onto both sides even if actual goal is wrong;
  // the actual goal failure is separately retained, never erased or counted pass.
  const originalGoal = turn.originalSemantic.target?.goal ?? draft.target.goal;
  const projection = { materializedCase: { id: turn.id, content: turn.message, reference_time: turn.referenceTime,
      semantic: structuredClone(turn.originalSemantic) },
    finalSnapshot: { domainState: { intentDraft: { ...draft, target: { ...draft.target, goal: originalGoal } } } } };
  try {
    const evaluation = evaluateRestaurantHybridLiveArtifact(projection, { path: "NON_GOAL_SEMANTIC_PROJECTION", sha256: hash(JSON.stringify(projection)) });
    return { finding: evaluation.findings.find(f => f.dimension === "AUTHORITATIVE_CONDITIONS"),
      status: evaluation.findings.find(f => f.dimension === "AUTHORITATIVE_CONDITIONS")?.status ?? "NOT_EVALUATED",
      actualGoal: draft.target.goal, originalGoal, scope: "Non-goal fields only; no real delivery/source/S0 conclusion" };
  } catch (error) { return { status: "NOT_EVALUATED", reason: "EVALUATOR_FAILURE", errorType: error.name }; }
}
function assess(turn, input, interpreted, compilation, draft, previousGoal) {
  const proposal = interpreted.status === "PROPOSED" ? interpreted.proposal : undefined;
  const proposedGoal = proposal?.facts.find(f => f.value?.kind === "TARGET")?.value.goal ?? previousGoal;
  const goal = evaluateRestaurantSemanticGoal({ ...(proposal ? { proposal } : {}), ...(proposedGoal ? { actualGoal: proposedGoal } : {}), expectation: boundary(turn, previousGoal) });
  const authoritativeGoalCheck = evaluateRestaurantSemanticGoal({ ...(proposal ? { proposal } : {}), ...(draft?.target ? { actualGoal: draft.target.goal } : {}), expectation: boundary(turn, previousGoal) });
  const expected = turn.originalExpectedDraft;
  const result = { goal, authoritativeGoalCheck, nonTargetValueDifferences: [], diagnosticDifferences: [], valueAssessment: "NOT_EVALUATED" };
  if (expected && draft) {
    result.nonTargetValueDifferences = differences(view(expected, expected), view(draft, expected));
    result.valueAssessment = result.nonTargetValueDifferences.length ? "NOT_SATISFIED" : "SATISFIED";
    result.diagnosticDifferences = differences({ partySizeSource: expected.partySizeSource, temporalResolution: expected.temporalResolution },
      { partySizeSource: draft.partySizeSource, temporalResolution: draft.temporalResolution });
    const oracle = restaurantSemanticRegressionProposalFor(input.message);
    if (proposal && oracle) {
      const withoutTarget = p => ({ ...p, facts: p.facts.filter(f => f.field !== "TARGET") });
      result.stageRepresentationEqual = equalRestaurantSemanticProposals(withoutTarget(proposal), withoutTarget(oracle));
      const expectedCompilation = compileRestaurantSemanticProposal(oracle, { referenceTime: input.referenceTime, timezone: input.timezone });
      result.legacyStrictScore = scoreRestaurantSemanticTurn({ actualProposal: proposal, expectedProposal: oracle,
        ...(compilation?.status === "COMPILED" ? { actualCompiledPatch: compilation.patch } : {}),
        ...(expectedCompilation.status === "COMPILED" ? { expectedCompiledPatch: expectedCompilation.patch } : {}),
        actualDraft: draft, expectedDraft: expected, goalBoundary: boundary(turn, previousGoal) });
    }
  } else if (turn.originalSemantic) {
    result.publicAssessment = publicAssessment(turn, draft);
    result.valueAssessment = result.publicAssessment.status;
  }
  if (compilation?.status === "CONFLICT" && compilation.conflict.affectedFields.some(field => field !== "TARGET")) {
    result.nonTargetCompileConflict = compilation.conflict; result.valueAssessment = "NOT_SATISFIED";
  }
  result.controlEligible = Boolean(expected && (result.nonTargetValueDifferences.length || result.nonTargetCompileConflict));
  return result;
}
function createSession(session) {
  const referenceTime = session.referenceTime ?? session.turns[0].referenceTime;
  const clock = new FakeClock(referenceTime); let sequence = 0;
  const taskId = `boundary-continuation:${session.id}`;
  const runtime = new InMemoryTaskRuntime(restaurantBookingTaskDefinition, clock, prefix => `${prefix}:${++sequence}`);
  runtime.createTask(taskId, {}, { runId: `run:${taskId}` });
  return { referenceTime, taskId, snapshot: () => runtime.snapshot(taskId), dispatch(event) {
    const before = runtime.snapshot(taskId), id = `event:${session.id}:${++sequence}`;
    const result = runtime.dispatch({ id, taskId, event, occurredAt: clock.now().toISOString(), trace: { schemaVersion: "1", runId: before.runId, correlationId: id, actor: "MODEL" } }, before.version);
    if (result.commands?.length || hasBasisKey(result.snapshot.domainState.intentDraft)) throw new Stop("S0_SEMANTIC_AUTHORITY_BOUNDARY");
    if (event.type === "SEMANTIC_PROPOSAL_COMPILED" && event.patch.target?.goal && result.snapshot.domainState.intentDraft?.target?.goal !== event.patch.target.goal) throw new Stop("S0_DOWNSTREAM_GOAL_MUTATION");
    return result.snapshot;
  } };
}
async function mainTurn(session, turn, runtime, interpreter, reuse) {
  const before = runtime.snapshot();
  const freshInput = { taskId: runtime.taskId, message: turn.message, referenceTime: runtime.referenceTime, timezone: "Asia/Tokyo",
    ...(before.domainState.intentDraft ? { currentDraft: before.domainState.intentDraft } : {}) };
  const input = reuse ? reuse.input : freshInput;
  if (reuse) {
    assert.equal(reuse.input.message, freshInput.message); assert.equal(reuse.input.referenceTime, freshInput.referenceTime);
    assert.deepEqual(reuse.input.currentDraft, freshInput.currentDraft);
    assert(validateRestaurantSemanticProposal(reuse.result.proposal, input.message).valid);
  }
  const interpreted = reuse ? structuredClone(reuse.result) : await interpreter.interpret(input);
  let compilation;
  if (interpreted.status === "PROPOSED") {
    compilation = compileRestaurantSemanticProposal(interpreted.proposal, { referenceTime: input.referenceTime, timezone: input.timezone });
    runtime.dispatch(compilation.status === "COMPILED" ? { type: "SEMANTIC_PROPOSAL_COMPILED", patch: compilation.patch }
      : { type: "SEMANTIC_CONFLICT_RECORDED", conflict: compilation.conflict });
  } else {
    runtime.dispatch({ type: "SEMANTIC_INTERPRETATION_FAILED", status: interpreted.status, reason: `Interpreter status ${interpreted.status}` });
  }
  const draft = runtime.snapshot().domainState.intentDraft;
  const turnIndex = session.turns.findIndex(item => item.id === turn.id);
  const previousExpected = turnIndex > 0 ? session.turns[turnIndex - 1].originalExpectedDraft : undefined;
  return { sessionId: session.id, cohort: session.cohort, repetition: session.repetition, turnId: turn.id, input, interpreted,
    ...(compilation ? { compilation } : {}), ...(draft ? { actualDraft: draft } : {}),
    evaluation: assess(turn, input, interpreted, compilation, draft, before.domainState.intentDraft?.target?.goal),
    contextValueDifferencesBefore: previousExpected ? differences(view(previousExpected, previousExpected), view(input.currentDraft, previousExpected)) : [],
    reusedPriorRealOutput: Boolean(reuse), rawGold: turn.originalExpectedDraft ?? turn.originalSemantic ?? "UNANNOTATED_NEW_INPUT" };
}
function controlRequest(primary) {
  const request = structuredClone(primary.firstRequest);
  request.promptVersion = "v23"; request.outputSchema = { ...oldSchema, jsonSchema: oldJsonSchema };
  request.messages[0].content = oldPrompt({ referenceTime: primary.input.referenceTime, timezone: primary.input.timezone,
    ...(primary.input.currentDraft ? { currentDraft: primary.input.currentDraft } : {}), retryAttempt: 1 });
  assert.deepEqual(request.messages.slice(1), primary.firstRequest.messages.slice(1));
  return request;
}
function analyzeControl(primary, response) {
  let raw;
  try { raw = JSON.parse(response.outputText); } catch { return { status: "INVALID_CONTROL_JSON" }; }
  const validated = validateOld(raw);
  if (!validated.valid || response.finishReason !== "TOOL_CALLS") return { status: "INVALID_CONTROL_CONTRACT", errors: validated.errors ?? [] };
  const compilation = compileRestaurantSemanticProposal(validated.value, { referenceTime: primary.input.referenceTime, timezone: primary.input.timezone });
  const projected = compilation.status === "COMPILED" ? applyRestaurantIntentPatch(primary.input.currentDraft, compilation.patch) : undefined;
  const expected = primary.rawGold;
  return { status: "CONTROL_ONLY_NOT_IN_PRIMARY_RATE", promptVersion: "v23", schemaVersion: "3", proposal: validated.value, compilation,
    ...(projected ? { analysisProjectedDraft: projected, nonTargetDifferencesVsGold: differences(view(expected, expected), view(projected, expected)),
      nonTargetDifferencesVsPrimary: differences(view(primary.actualDraft, expected), view(projected, expected)) } : {}),
    inputParitySha256: hash(JSON.stringify(primary.input)), limitation: "Single historicalPrompt23/Schema3 package comparison; not causal proof or primary success" };
}
async function selfTest() {
  const selected = load(`${previous}/selected-inputs.json`);
  const sessions = selected.sessions.filter(s => s.cohort === "DEVELOPMENT");
  for (const defect of ["NONE", "PARTY", "GOAL", "INVALID"]) {
    let count = 0, rows = [];
    for (const session of sessions) {
      const runtime = createSession(session);
      const interpreter = { async interpret(input) {
        count++;
        if (count === 1 && defect === "INVALID") return { status: "INVALID_MODEL_OUTPUT", errors: ["control"], attempts: [] };
        const proposal = structuredClone(restaurantSemanticRegressionProposalFor(input.message));
        if (count === 1 && defect === "PARTY") proposal.facts.find(f => f.field === "PARTY_SIZE").value.value = 99;
        if (count === 1 && defect === "GOAL") proposal.facts.find(f => f.field === "TARGET").value.goal = "RECOMMENDATION";
        return { status: "PROPOSED", proposal, attempts: [] };
      } };
      for (const turn of session.turns) rows.push(await mainTurn(session, turn, runtime, interpreter));
    }
    assert.equal(count, 15); assert.equal(rows.length, 15);
    if (defect === "NONE") assert(rows.every(row => !row.evaluation.nonTargetValueDifferences.length));
    if (defect === "PARTY") assert(rows[0].evaluation.controlEligible);
    if (defect === "GOAL") assert.equal(rows[0].evaluation.goal.status, "NOT_SATISFIED");
    if (defect === "INVALID") assert.equal(rows[0].interpreted.status, "INVALID_MODEL_OUTPUT");
  }
  assert.equal(nextCount(143), 144); assert.throws(() => nextCount(144), /BUDGET/);
  const captured = load(`${previous}/sessions/SR01-complete-then-correct-1.interpretation.json`);
  const reused = await mainTurn(sessions[0], sessions[0].turns[0], createSession(sessions[0]), undefined, captured);
  assert(reused.evaluation.controlEligible && reused.actualDraft.partySize === 2);
  reused.firstRequest = load(`${previous}/calls/001.started.json`).request;
  const old = controlRequest(reused);
  assert.equal(old.outputSchema.version, "3"); assert.equal(old.promptVersion, "v23"); assert(!old.messages[0].content.includes("goalBasis"));
  const oldProposal = structuredClone(reused.interpreted.proposal); oldProposal.schemaVersion = "3";
  for (const f of oldProposal.facts) if (f.value?.kind === "TARGET") delete f.value.goalBasis;
  assert(validateOld(oldProposal).valid); assert(!validateRestaurantSemanticProposal(oldProposal).valid);
  assert.equal(analyzeControl(reused, { outputText: JSON.stringify(oldProposal), finishReason: "TOOL_CALLS" }).status, "CONTROL_ONLY_NOT_IN_PRIMARY_RATE");
  assert(!hasBasisKey(reused.actualDraft)); assert(hasBasisKey({ target: { goalBasis: {} } }));
  let networkCount = 0;
  for (const turn of sessions[0].turns) {
    const row = await mainTurn(sessions[0], turn, createSession(sessions[0]), { async interpret() {
      networkCount++; return { status: "MODEL_FAILURE", errorCode: "NETWORK", attempts: [] };
    } });
    if (infrastructureStop(row)) break;
  }
  assert.equal(networkCount, 1);
  console.log(JSON.stringify({ mode: "OFFLINE", controls: "4x15 including semantic differences/goal failure/invalid output all continue", priorReplay: "PASS", networkStops: "PASS", budgetAndS0: "PASS", exactInputOldPrompt: "PASS", oldSchemaIsolated: "PASS", realModelCalls: 0 }));
}
async function execute() {
  verify(); assert.equal(git("status", "--porcelain"), "");
  if (!process.env.DEEPSEEK_API_KEY?.trim()) { console.log("未加载"); throw new Stop("INFRASTRUCTURE_CREDENTIAL_NOT_LOADED"); }
  assert.equal(process.env.DEEPSEEK_MODEL, "deepseek-v4-flash"); assert.equal(process.env.PRAXIS_ALLOW_LIVE_MODEL_EVAL, "1"); console.log("已加载");
  const sourceCommit = git("rev-parse", "HEAD");
  const ledger = load(`${base}/budget.json`), sharedPath = ".eval-artifacts/phase3a-prime/budget.json", shared = load(sharedPath);
  assert.equal(ledger.cumulative.realModelCalls, 1); assert.equal(ledger.limits.realModelCalls, 144);
  const allocation = shared.entries.find(e => e.slice === "phase3a-boundary stop1 independent allocation");
  assert.equal(allocation.chargedToThis400CallBudget, 0);
  save(`${out}/started.json`, { sourceCommit, startedAtCET: cet(), model: "deepseek-v4-flash", credentialStatus: "已加载", fileHandlingStatement: "未独立读取文件",
    reusedPriorCall: "../calls/001.response.json", priorCallCount: 1, plannedPrimaryLogicalTurns: 72, maximumControls: 15, ceiling: 144,
    freezeSha256: hash(readFileSync(`${out}/freeze.json`)) }, true);
  mkdirSync(`${out}/calls`, { recursive: true }); mkdirSync(`${out}/rows`, { recursive: true });
  let total = 1, active, fatal, providerRecords = [];
  const entry = { slice: "batch3 revised-stop continuation and v23 controls", sourceCommit, realModelCalls: 0, primaryNewCalls: 0, controlCalls: 0,
    reusedPriorRealOutputs: 1, fullLive: 0, googleRequests: 0, restaurantWebsiteRequests: 0, status: "RUNNING" };
  ledger.entries.push(entry);
  const persist = status => { entry.status = status; entry.realModelCalls = total - 1; ledger.cumulative.realModelCalls = total; ledger.status = status; ledger.asOf = cet();
    allocation.externalActualRealModelCalls = total; allocation.boundaryStage = status; shared.asOf = ledger.asOf; save(`${base}/budget.json`, ledger); save(sharedPath, shared); };
  const provider = DeepSeekModelGateway.fromEnvironment(process.env, { observer: { observe(record) { providerRecords.push(record); } } });
  const gateway = { async complete(request) {
    try { verify(); total = nextCount(total); } catch (error) { fatal = error; throw error; }
    active.requests.push(structuredClone(request)); active.attempts.push(total);
    const prefix = `${out}/calls/${String(total).padStart(3, "0")}`;
    save(`${prefix}.started.json`, { attempt: total, atCET: cet(), phase: active.phase, sessionId: active.sessionId, turnId: active.turnId, sourceCommit, request }, true);
    if (active.phase === "CONTROL_V23") entry.controlCalls++; else entry.primaryNewCalls++;
    persist("RUNNING"); providerRecords = [];
    try {
      const response = await provider.complete(request);
      save(`${prefix}.response.json`, { response, providerRecords, atCET: cet() }, true);
      console.log(JSON.stringify({ event: "attempt", attempt: total, phase: active.phase, turnId: active.turnId, outcome: "SUCCEEDED" }));
      return response;
    } catch (error) {
      fatal = error instanceof Stop ? error : new Stop("INFRASTRUCTURE_PROVIDER_FAILURE", { errorCode: error?.code ?? "UNKNOWN" });
      save(`${prefix}.failure.json`, { atCET: cet(), errorCode: error?.code ?? "UNKNOWN", providerRecords }, true);
      console.log(JSON.stringify({ event: "attempt", attempt: total, phase: active.phase, outcome: "FAILED" }));
      throw error;
    }
  } };
  const interpreter = new RestaurantSemanticInterpreter(gateway), selected = load(`${previous}/selected-inputs.json`);
  const main = [], controls = []; let stop;
  try {
    for (const session of selected.sessions) {
      const runtime = createSession(session);
      for (const turn of session.turns) {
        const number = main.length + 1;
        active = { phase: "PRIMARY_V24", sessionId: session.id, turnId: turn.id, requests: [], attempts: [] };
        const reuse = number === 1 ? load(`${previous}/sessions/SR01-complete-then-correct-1.interpretation.json`) : undefined;
        const row = await mainTurn(session, turn, runtime, interpreter, reuse);
        row.logicalIndex = number; row.firstRequest = reuse ? load(`${previous}/calls/001.started.json`).request : active.requests[0];
        row.attemptNumbers = reuse ? [1] : active.attempts;
        save(`${out}/rows/${String(number).padStart(3, "0")}.main.json`, row, true); main.push(row);
        const abort = infrastructureStop(row, fatal); if (abort) throw abort;
        console.log(JSON.stringify({ event: "main-turn", logical: number, totalPlanned: 72, turnId: turn.id, goal: row.evaluation.goal.status,
          nonTargetValueDifferenceCount: row.evaluation.nonTargetValueDifferences.length, modelCalls: total }));
      }
    }
    assert.equal(main.length, 72);
    const candidates = main.filter(row => row.cohort === "DEVELOPMENT" && row.evaluation.controlEligible);
    assert(candidates.length <= 15);
    save(`${out}/control-selection.json`, { status: "selected after72 using precommitted value-difference rule", count: candidates.length,
      turnIds: candidates.map(row => row.turnId), primaryRateExcluded: true }, true);
    for (const primary of candidates) {
      active = { phase: "CONTROL_V23", sessionId: primary.sessionId, turnId: primary.turnId, requests: [], attempts: [] };
      const request = controlRequest(primary);
      const response = await gateway.complete(request);
      const result = { turnId: primary.turnId, primaryLogicalIndex: primary.logicalIndex, input: primary.input,
        inputParitySha256: hash(JSON.stringify(primary.input)), attemptNumbers: active.attempts, request, response,
        primaryValueDifferences: primary.evaluation.nonTargetValueDifferences, analysis: analyzeControl(primary, response) };
      save(`${out}/rows/${primary.turnId}.control.json`, result, true); controls.push(result);
    }
  } catch (error) { stop = { code: error?.code ?? "INFRASTRUCTURE_RUNNER_FAILURE", detail: error?.detail ?? { errorType: error?.name ?? "UNKNOWN" } }; }
  const result = { status: stop ? "STOPPED" : "COMPLETED", sourceCommit, finishedAtCET: cet(), ...(stop ? { stop } : {}),
    priorRealCalls: 1, cumulativeRealCalls: total, newRealCalls: total - 1, primaryLogicalCompleted: main.length,
    controlLogicalCompleted: controls.length, controlsExcludedFromPrimaryRate: true, reusedPriorOutputs: 1,
    main, controls, promptChanged: false, goldChanged: false, sourceRequests: 0 };
  save(`${out}/execution.json`, result, true); persist(stop ? "STOP_3_INFRA_BUDGET_OR_S0_REVIEW" : "STOP_3_COMPLETE_REVIEW_REQUIRED");
  console.log(JSON.stringify({ status: result.status, primaryLogicalCompleted: main.length, controls: controls.length, cumulativeCalls: total, ...(stop ? { stop } : {}) }));
}

if (process.argv.includes("--self-test")) await selfTest();
else if (process.argv.includes("--execute")) await execute();
else throw new Error("Choose --self-test or explicitly authorized --execute");
