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
import { restaurantSemanticRegressionV3 as development } from "../../../src/eval/restaurant/semantic/fixtures.ts";
import { RestaurantSemanticRegressionFixtureInterpreter } from "../../../src/eval/restaurant/semantic/fixture-interpreter.ts";
import { restaurantSemanticRegressionProposalFor } from "../../../src/eval/restaurant/semantic/stage-oracles.ts";
import { runRestaurantSemanticRegression } from "../../../src/eval/restaurant/semantic/regression.ts";
import { evaluateRestaurantSemanticGoal } from "../../../src/eval/restaurant/semantic/scorer.ts";
import { evaluateRestaurantHybridLiveArtifact } from "../../../src/eval/restaurant/agent-loop/diagnostic-evaluator.ts";

const base = ".eval-artifacts/phase3a-boundary";
const batch = `${base}/batch3`;
const hash = value => createHash("sha256").update(value).digest("hex");
const read = path => JSON.parse(readFileSync(path, "utf8"));
const cet = () => new Date(Date.now() + 3600000).toISOString().replace("Z", "+01:00");
const git = (...args) => execFileSync("git", args, { encoding: "utf8", env: { PATH: process.env.PATH, HOME: process.env.HOME, LANG: "C.UTF-8" } }).trim();
function save(path, value, exclusive = false) {
  const serialized = JSON.stringify(value, null, 2) + "\n";
  if (process.env.DEEPSEEK_API_KEY && serialized.includes(process.env.DEEPSEEK_API_KEY)) throw new Error("CREDENTIAL_RECORDING_REFUSED");
  writeFileSync(path, serialized, { flag: exclusive ? "wx" : "w" });
}
function verifyFreeze() {
  for (const entry of read(`${batch}/execution-freeze.json`).files) {
    assert(!entry.path.includes(".eval-private/") && !entry.path.split("/").some(part => part.startsWith(".env")));
    assert.equal(hash(readFileSync(entry.path)), entry.sha256, entry.path);
  }
}
function originalSession(selected) {
  if (selected.cohort === "DEVELOPMENT") return development.sessions.find(session => session.id === selected.id);
  if (selected.turns[0].source?.path === "src/eval/restaurant/semantic/fixtures.ts") {
    return development.sessions.find(session => session.turns.some(turn => turn.id === selected.turns[0].id));
  }
}
function proposalGoal(proposal) {
  return proposal?.facts.find(fact => fact.value?.kind === "TARGET")?.value.goal;
}
function boundaryFor(turn, previousGoal) {
  const category = turn.annotation?.contextCarry || turn.contextCarry ? "CONTEXT_CARRY" : turn.annotation?.category ?? turn.category;
  return { category, message: turn.message, ...(previousGoal ? { previousGoal } : {}) };
}
function structuralDifferences(expected, actual, path = "") {
  if (isDeepStrictEqual(expected, actual)) return [];
  if (expected && actual && typeof expected === "object" && typeof actual === "object" && !Array.isArray(expected) && !Array.isArray(actual)) {
    return [...new Set([...Object.keys(expected), ...Object.keys(actual)])].flatMap(key => structuralDifferences(expected[key], actual[key], path ? `${path}.${key}` : key));
  }
  return [{ path, ...(expected === undefined ? { expectedAbsent: true } : { expected }), ...(actual === undefined ? { actualAbsent: true } : { actual }) }];
}
function nonTargetPublicAssessment(turn, draft) {
  if (!turn.originalSemantic) return { status: "NOT_EVALUATED", reason: "New development input has no semantic Gold", stop: false };
  // An evaluation projection applies only the approved goal overlay. Preserve
  // originalSemantic unchanged alongside it; no source file or Gold is edited.
  const semantic = { ...structuredClone(turn.originalSemantic), target: { goal: draft.target.goal } };
  const projection = { materializedCase: { id: turn.id, reference_time: turn.referenceTime, content: turn.message, semantic },
    finalSnapshot: { domainState: { intentDraft: draft } } };
  const evaluation = evaluateRestaurantHybridLiveArtifact(projection, { path: "SEMANTIC_ONLY_PROJECTION", sha256: hash(JSON.stringify(projection)) });
  const finding = evaluation.findings.find(item => item.dimension === "AUTHORITATIVE_CONDITIONS");
  assert(finding);
  return { status: finding.status, stop: finding.status !== "SATISFIED", finding,
    goalOverlay: { original: turn.originalSemantic.target?.goal, effective: draft.target.goal, policy: "ADR-0044 independently checked; only target.goal overlaid" },
    scope: "Semantic field projection only; no delivery/source/S0 conclusion" };
}
async function runAdditionalSession(selected, interpreter) {
  const referenceTime = selected.referenceTime ?? selected.turns[0].referenceTime;
  const clock = new FakeClock(referenceTime);
  let sequence = 0;
  const taskId = `boundary:${selected.id}`;
  const runtime = new InMemoryTaskRuntime(restaurantBookingTaskDefinition, clock, prefix => `${prefix}:${++sequence}`);
  runtime.createTask(taskId, {}, { runId: `run:${taskId}` });
  const turns = [];
  for (const turn of selected.turns) {
    const before = runtime.snapshot(taskId);
    const interpreted = await interpreter.interpret({ taskId, message: turn.message, referenceTime, timezone: "Asia/Tokyo",
      ...(before.domainState.intentDraft ? { currentDraft: before.domainState.intentDraft } : {}) });
    const row = { turnId: turn.id, modelStatus: interpreted.status, interpreted };
    turns.push(row);
    if (interpreted.status !== "PROPOSED") { row.status = "FAIL"; row.firstFailureStage = "SEMANTIC_PROPOSAL_CONTRACT_OR_PROVIDER"; break; }
    row.proposal = interpreted.proposal;
    const compiled = compileRestaurantSemanticProposal(interpreted.proposal, { referenceTime, timezone: "Asia/Tokyo" });
    row.compilation = compiled;
    if (compiled.status !== "COMPILED") { row.status = "FAIL"; row.firstFailureStage = "COMPILER"; break; }
    const id = `event:${selected.id}:${++sequence}`;
    const dispatched = runtime.dispatch({ id, taskId, event: { type: "SEMANTIC_PROPOSAL_COMPILED", patch: compiled.patch }, occurredAt: clock.now().toISOString(),
      trace: { schemaVersion: "1", runId: before.runId, correlationId: id, actor: "MODEL" } }, before.version);
    row.actualDraft = dispatched.snapshot.domainState.intentDraft;
    row.compiledPatch = compiled.patch;
    row.goalBoundary = evaluateRestaurantSemanticGoal({ proposal: interpreted.proposal, actualGoal: row.actualDraft?.target?.goal,
      expectation: boundaryFor(turn, before.domainState.intentDraft?.target?.goal) });
    assert(!JSON.stringify(row.actualDraft).includes("goalBasis"));
    row.nonTargetAssessment = row.goalBoundary.status === "SATISFIED" ? nonTargetPublicAssessment(turn, row.actualDraft)
      : { status: "NOT_EVALUATED", reason: "Goal policy failed; no approved goal overlay applied", stop: false };
    row.status = row.goalBoundary.status === "SATISFIED" && !row.nonTargetAssessment.stop ? "PASS" : "FAIL";
    if (row.status === "FAIL") break;
  }
  return { mode: "REAL_MODEL_SEMANTIC_ONLY", attributionLevel: "ADDITIONAL_PUBLIC_INPUTS", turns };
}
async function runSession(selected, interpreter) {
  const original = originalSession(selected);
  if (!original) return runAdditionalSession(selected, interpreter);
  assert.deepEqual(original.turns.map(turn => turn.message), selected.turns.map(turn => turn.message));
  return runRestaurantSemanticRegression(interpreter, { mode: "REAL_MODEL_MOCK_WORLD", attributionLevel: "DEVELOPMENT_STAGE_ORACLES",
    dataset: { ...development, sessions: [original] } });
}
function diagnostics(selected, report) {
  let previousGoal;
  return report.turns.map(row => {
    const input = selected.turns.find(turn => turn.id === row.turnId);
    const proposal = row.proposal;
    const actualGoal = row.actualDraft?.target?.goal ?? proposalGoal(proposal) ?? previousGoal;
    const boundary = proposal ? evaluateRestaurantSemanticGoal({ proposal, actualGoal, expectation: boundaryFor(input, previousGoal) }) : undefined;
    const expectedProposal = originalSession(selected) ? restaurantSemanticRegressionProposalFor(input.message) : undefined;
    const withoutTarget = p => p?.facts.filter(fact => fact.field !== "TARGET");
    const stageDifferences = proposal && expectedProposal && row.firstFailureStage === "SEMANTIC_INTERPRETER"
      ? structuralDifferences(withoutTarget(expectedProposal), withoutTarget(proposal), "nonTargetProposalFacts") : [];
    if (row.actualDraft?.target) previousGoal = row.actualDraft.target.goal;
    return { turnId: row.turnId, status: row.status, category: boundaryFor(input, previousGoal).category,
      oldGoldGoal: input.originalExpectedDraft?.target?.goal ?? input.originalGoal ?? "UNANNOTATED",
      ...(actualGoal ? { actualGoal } : {}), ...(boundary ? { goalBoundary: boundary } : {}),
      authoritativeDraftStatus: row.actualDraft ? "REACHED" : "NOT_REACHED", stageDifferences,
      ...(row.firstFailureStage ? { firstFailureStage: row.firstFailureStage } : {}),
      ...(row.nonTargetAssessment ? { nonTargetAssessment: row.nonTargetAssessment } : {}) };
  });
}
function stopFor(report) {
  const failure = report.turns.find(row => row.status === "FAIL");
  return failure ? { reason: "FIRST_FAILED_OR_UNASSESSED_SEMANTIC_COMPARISON", turnId: failure.turnId,
    ...(failure.firstFailureStage ? { firstFailureStage: failure.firstFailureStage } : {}) } : undefined;
}
function nextCount(value, limit) {
  assert(Number.isSafeInteger(value) && value >= 0 && limit === 144 && value < limit, "MODEL_BUDGET_EXHAUSTED");
  return value + 1;
}
async function selfTest() {
  const selected = read(`${batch}/selected-inputs.json`);
  const developmentSessions = selected.sessions.filter(session => session.cohort === "DEVELOPMENT");
  let goodTurns = 0;
  for (const session of developmentSessions) {
    const report = await runSession(session, new RestaurantSemanticRegressionFixtureInterpreter());
    assert(!stopFor(report)); goodTurns += report.summary.passedTurns;
  }
  assert.equal(goodTurns, 15);
  for (const defect of ["party", "goal"]) {
    let interpreted = 0;
    let sessionsReached = 0;
    for (const session of developmentSessions) {
      sessionsReached++;
      const report = await runSession(session, { async interpret(input) {
        interpreted++;
        const proposal = structuredClone(restaurantSemanticRegressionProposalFor(input.message));
        const fact = proposal.facts.find(fact => fact.field === (defect === "party" ? "PARTY_SIZE" : "TARGET"));
        if (defect === "party") fact.value.value = 99; else fact.value.goal = "RECOMMENDATION";
        return { status: "PROPOSED", proposal, attempts: [] };
      } });
      if (stopFor(report)) break;
    }
    assert.equal(sessionsReached, 1); assert.equal(interpreted, 1);
  }
  const gray = selected.sessions.find(session => session.cohort === "GRAY_EXTRA" && session.turns[0].id === "SR05-T01");
  for (const goal of ["RECOMMENDATION", "AVAILABILITY"]) {
    const report = await runSession(gray, { async interpret(input) {
      const proposal = structuredClone(restaurantSemanticRegressionProposalFor(input.message));
      proposal.facts.find(fact => fact.field === "TARGET").value.goal = goal;
      return { status: "PROPOSED", proposal, attempts: [] };
    } });
    assert(!stopFor(report));
  }
  assert.equal(nextCount(143, 144), 144); assert.throws(() => nextCount(144, 144));
  const holdout = selected.sessions.find(session => session.cohort === "EXPOSED_HOLDOUT").turns[0];
  const draft = { schemaVersion: "3", timezone: "Asia/Tokyo", target: { goal: "AVAILABILITY", query: "yakitori" }, date: "2026-11-04",
    timeWindow: { earliest: "19:00", latest: "19:00" }, partySize: 3, area: { query: "near Ueno" }, criteria: [{ text: "yakitori", polarity: "POSITIVE", strength: "HARD" }] };
  assert.equal(nonTargetPublicAssessment(holdout, draft).status, "SATISFIED");
  assert.equal(nonTargetPublicAssessment(holdout, { ...draft, partySize: 4 }).status, "NOT_SATISFIED");
  const malformed = selected.sessions.find(session => session.turns[0].id === "p1f-kf-h004-20261027").turns[0];
  assert(Object.hasOwn(malformed.originalSemantic.date, "October 27"));
  assert.notEqual(nonTargetPublicAssessment(malformed, draft).status, "SATISFIED");
  console.log(JSON.stringify({ mode: "OFFLINE_SELF_TEST", developmentTurns: goodTurns, earlyStopControls: 2, grayBothGoals: "PASS", budgetBoundary: "PASS", publicFieldControls: "PASS", malformedGoldPreserved: true, realModelCalls: 0 }));
}
async function execute() {
  verifyFreeze(); assert.equal(git("status", "--porcelain"), "");
  const config = read(`${batch}/execution-config.json`);
  if (!process.env.DEEPSEEK_API_KEY?.trim()) { console.log("未加载"); throw new Error("CREDENTIAL_NOT_LOADED"); }
  assert.equal(process.env.DEEPSEEK_MODEL, config.model);
  assert.equal(process.env.PRAXIS_ALLOW_LIVE_MODEL_EVAL, "1");
  console.log("已加载");
  const selected = read(`${batch}/selected-inputs.json`);
  const sourceCommit = git("rev-parse", "HEAD");
  const ledger = read(`${base}/budget.json`);
  const sharedPath = ".eval-artifacts/phase3a-prime/budget.json";
  const shared = read(sharedPath);
  assert.equal(ledger.limits.realModelCalls, 144); assert.equal(ledger.cumulative.realModelCalls, 0);
  const started = { startedAtCET: cet(), sourceCommit, model: config.model, credentialStatus: "已加载", independentlyReadCredentialFile: false,
    mode: "REAL_MODEL_MOCK_WORLD / SEMANTIC_ONLY", executionFreezeSha256: hash(readFileSync(`${batch}/execution-freeze.json`)),
    logicalTurnsPlanned: 72, hardRealCallCeiling: 144, chargedToPrime400: 0 };
  save(`${batch}/started.json`, started, true);
  mkdirSync(`${batch}/calls`, { recursive: true }); mkdirSync(`${batch}/sessions`, { recursive: true });
  const allocation = shared.entries.find(entry => entry.slice === "phase3a-boundary stop1 independent allocation");
  assert(allocation && allocation.chargedToThis400CallBudget === 0);
  const entry = { slice: "batch3 real semantic regression", sourceCommit, realModelCalls: 0, fullLive: 0, googleRequests: 0, restaurantWebsiteRequests: 0, status: "RUNNING" };
  ledger.entries.push(entry);
  let calls = 0, currentSession;
  const completed = [];
  let providerRecords = [];
  const provider = DeepSeekModelGateway.fromEnvironment(process.env, { observer: { observe(record) { providerRecords.push(record); } } });
  const persistLedger = status => {
    entry.realModelCalls = calls; entry.status = status; ledger.cumulative.realModelCalls = calls; ledger.status = status; ledger.asOf = cet();
    allocation.externalActualRealModelCalls = calls; allocation.boundaryStage = status; shared.asOf = ledger.asOf;
    save(`${base}/budget.json`, ledger); save(sharedPath, shared);
  };
  const gateway = { async complete(request) {
    verifyFreeze(); calls = nextCount(calls, 144);
    const prefix = `${batch}/calls/${String(calls).padStart(3, "0")}`;
    save(`${prefix}.started.json`, { atCET: cet(), sourceCommit, session: currentSession.id, cohort: currentSession.cohort, repetition: currentSession.repetition,
      attempt: calls, request, outcome: "RESERVED_BEFORE_DISPATCH" }, true);
    persistLedger("RUNNING"); providerRecords = [];
    try {
      const response = await provider.complete(request);
      save(`${prefix}.response.json`, { response, providerRecords, completedAtCET: cet() }, true);
      console.log(JSON.stringify({ event: "model-attempt", attempt: calls, outcome: "SUCCEEDED" }));
      return response;
    } catch (error) {
      save(`${prefix}.failure.json`, { errorCode: error?.code ?? "UNCLASSIFIED", retryable: error?.retryable ?? false, providerRecords, completedAtCET: cet() }, true);
      console.log(JSON.stringify({ event: "model-attempt", attempt: calls, outcome: "FAILED" }));
      throw error;
    }
  } };
  const interpreter = new RestaurantSemanticInterpreter(gateway);
  let stop;
  try {
    for (const session of selected.sessions) {
      currentSession = session;
      let sequence = 0;
      const capture = { async interpret(input) {
        const result = await interpreter.interpret(input);
        save(`${batch}/sessions/${session.id}-${++sequence}.interpretation.json`, { sessionId: session.id, input, result }, true);
        return result;
      } };
      const report = await runSession(session, capture);
      save(`${batch}/sessions/${session.id}.execution.json`, { selectedSession: session, report }, true);
      const evaluation = { selectedSessionId: session.id, cohort: session.cohort, repetition: session.repetition, turns: diagnostics(session, report) };
      save(`${batch}/sessions/${session.id}.evaluation.json`, evaluation, true);
      completed.push({ sessionId: session.id, cohort: session.cohort, report, evaluation });
      stop = stopFor(report);
      if (stop) { stop.sessionId = session.id; break; }
    }
  } catch (error) {
    stop = { reason: "EXECUTION_OR_ACCOUNTING_FAILURE", sessionId: currentSession?.id, errorCode: error?.code ?? error?.name ?? "UNKNOWN" };
  }
  const reached = completed.flatMap(session => session.report.turns).filter(turn => turn.status !== "BLOCKED_BY_UPSTREAM").length;
  const artifact = { ...started, finishedAtCET: cet(), status: stop ? "STOPPED" : "COMPLETED", ...(stop ? { stop } : {}), actualModelCalls: calls,
    logicalTurnsReached: reached, logicalTurnsPlanned: 72, sessionsCompleted: completed.length, sessions: completed,
    notReachedSessionIds: selected.sessions.slice(completed.length).map(session => session.id), goldChanged: false, promptChanged: false };
  save(`${batch}/execution.json`, artifact, true); persistLedger(stop ? "STOP_3_REVIEW_REQUIRED" : "STOP_3_COMPLETE_REVIEW_REQUIRED");
  console.log(JSON.stringify({ status: artifact.status, actualModelCalls: calls, logicalTurnsReached: reached, stop: stop ?? "NONE" }));
}

if (process.argv.includes("--self-test")) await selfTest();
else if (process.argv.includes("--execute")) await execute();
else throw new Error("Choose --self-test or explicitly authorized --execute");
