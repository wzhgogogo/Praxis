import assert from "node:assert/strict";
import test from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../../core/model/contracts.js";
import { evaluateRestaurantHybridLiveArtifact } from "./diagnostic-evaluator.js";
import { createHybridReadComposition } from "./hybrid-read-composition.js";
import { HIGASHI_GINZA_EVALUATION_LOCATION } from "./live-evaluation-location.js";
import { createCurrentDevelopmentFixedSources } from "./current-development-fixed-sources.js";
import { currentDevelopmentSourceScenario } from "./current-development-source-scenarios.js";
import { assessFixedSourceAcceptance } from "./fixed-source-acceptance.js";
import { executeFixedSourceCase } from "./fixed-source-case-execution.js";
import { fixedSourceCaseRegistration, loadRegisteredFixedSourceCase, validateFixedSourceCaseRegistration } from "./fixed-source-case-registry.js";
import {
  loadFrozenLiveCases,
  RESTAURANT_READ_DEVELOPMENT_CASE_PATH,
} from "./live-case-materializer.js";

type PlannedAction = "SEARCH_RESTAURANTS" | "INVESTIGATE_CANDIDATE_FACTS" | "CHECK_AVAILABILITY" | "PRESENT_RESULTS" | "END_READ";
type Plan = {
  id: string;
  referenceTime: string;
  goal: "RECOMMENDATION" | "AVAILABILITY";
  area: string;
  date: string;
  timeWindow: { earliest: string; latest: string };
  partySize?: number;
  candidateBatchSize?: number;
  facts: Array<Record<string, unknown>>;
  actions: PlannedAction[];
  /** Explicit, cited interpretation outputs for the scripted code-contract boundary only. */
  factJudgments?: Array<{ criterion: string; outcome: "SUPPORTED" | "CONFLICT" | "UNKNOWN" }>;
};

// Scripted model/source rows are deliberately separate from the YAML semantic
// oracle. This is a fixed-path *code-contract* test, not model-quality
// evidence: the real-model fixed-source runner must not consume these actions.
// Neither production code nor a real model boundary receives a case ID.
const PLANS: readonly Plan[] = [
  {
    id: "h001", referenceTime: "2026-08-19T16:20:00+08:00",
    goal: "AVAILABILITY", area: "near Shibuya", date: "2026-08-19", timeWindow: { earliest: "19:00", latest: "19:00" }, partySize: 2,
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "omakase near Shibuya", selectionScope: "OPEN_ENDED" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-19", raw: "tonight" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 PM" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2, source: "EXPLICIT" } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Shibuya" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "omakase", polarity: "POSITIVE", strength: "HARD" } },
    ],
    actions: ["SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS"], candidateBatchSize: 3,
  },
  {
    id: "h002", referenceTime: "2026-08-19T16:22:00+08:00",
    goal: "AVAILABILITY", area: "near Higashi-Ginza", date: "2026-08-22", timeWindow: { earliest: "18:30", latest: "18:30" }, partySize: 2,
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "first date restaurant near Higashi-Ginza", selectionScope: "OPEN_ENDED" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-22", raw: "this Saturday" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "18:30", latest: "18:30", raw: "6:30 PM" } },
      // Closed first-date-party inference, not a rewrite of the source message.
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2, source: "INFERRED_CLOSED_PARTY" } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Higashi-Ginza" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "good for a first date", polarity: "POSITIVE", strength: "UNSPECIFIED" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "around 10,000 yen per person", polarity: "POSITIVE", strength: "SOFT" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "hot pot restaurant", polarity: "NEGATIVE", strength: "HARD" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "Sichuan/Hunan cuisine", polarity: "NEGATIVE", strength: "HARD" } },
    ],
    actions: ["SEARCH_RESTAURANTS", "INVESTIGATE_CANDIDATE_FACTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS"], candidateBatchSize: 3,
    factJudgments: [
      { criterion: "hot pot restaurant", outcome: "SUPPORTED" },
      { criterion: "Sichuan/Hunan cuisine", outcome: "SUPPORTED" },
    ],
  },
  {
    id: "h003", referenceTime: "2026-08-19T16:38:00+08:00",
    goal: "AVAILABILITY", area: "nearby", date: "2026-08-21", timeWindow: { earliest: "17:30", latest: "22:00" }, partySize: 10,
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "team dinner nearby", selectionScope: "OPEN_ENDED" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", weekday: "FRIDAY", raw: "this Friday" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTER_WORK", raw: "after work" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 10, source: "EXPLICIT" } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "around 3,000 yen per person", polarity: "POSITIVE", strength: "SOFT" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "private room", polarity: "POSITIVE", strength: "SOFT" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "team dinner", polarity: "POSITIVE", strength: "UNSPECIFIED" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "good for drinks", polarity: "POSITIVE", strength: "UNSPECIFIED" } },
    ],
    actions: ["SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS"], candidateBatchSize: 3,
  },
  {
    id: "h004", referenceTime: "2026-08-19T12:00:00+08:00",
    goal: "RECOMMENDATION", area: "nearby", date: "2026-08-19", timeWindow: { earliest: "12:00", latest: "17:00" },
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "RECOMMENDATION", query: "cafes nearby", selectionScope: "OPEN_ENDED" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", relativeDay: "TODAY", raw: "this afternoon" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTERNOON", relativeDay: "TODAY", raw: "this afternoon" } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "good for meeting a friend", polarity: "POSITIVE", strength: "UNSPECIFIED" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "cafe", polarity: "POSITIVE", strength: "HARD" } },
    ],
    actions: ["SEARCH_RESTAURANTS", "INVESTIGATE_CANDIDATE_FACTS", "PRESENT_RESULTS"], candidateBatchSize: 3,
  },
  {
    id: "h005", referenceTime: "2026-08-19T16:00:00+08:00",
    goal: "AVAILABILITY", area: "nearby", date: "2026-08-19", timeWindow: { earliest: "17:00", latest: "17:00" }, partySize: 4,
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "open tables nearby", selectionScope: "OPEN_ENDED" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", relativeOffsetMinutes: 0, raw: "right now" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 4, source: "EXPLICIT" } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "local food", polarity: "POSITIVE", strength: "HARD" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "fast food", polarity: "NEGATIVE", strength: "HARD" } },
    ],
    // The preserved original source says only "Tokyo regional cuisine". It
    // cannot be scripted as local-food support merely to make a three-card
    // development control pass.
    actions: ["SEARCH_RESTAURANTS", "INVESTIGATE_CANDIDATE_FACTS", "CHECK_AVAILABILITY", "END_READ"], candidateBatchSize: 3,
    factJudgments: [
      { criterion: "local food", outcome: "UNKNOWN" },
      { criterion: "fast food", outcome: "SUPPORTED" },
    ],
  },
];

/**
 * A post-H001--H005 controlled migration sample.  It is not loaded from the
 * exposed fixed regression YAML and does not receive a special Runner path.
 */
const NEW_VEGETARIAN_LUNCH_PLAN: Plan = {
  id: "new-vegetarian-lunch", referenceTime: "2026-08-19T16:00:00+08:00",
  goal: "AVAILABILITY", area: "near Shibuya", date: "2026-08-20", timeWindow: { earliest: "12:30", latest: "12:30" }, partySize: 3,
  facts: [
    { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "vegetarian lunch near Shibuya" } },
    { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-20", raw: "tomorrow" } },
    { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "12:30", latest: "12:30", raw: "12:30 PM" } },
    { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 3 } },
    { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Shibuya" } },
    { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "vegetarian restaurant", polarity: "POSITIVE", strength: "HARD" } },
    { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "ramen", polarity: "NEGATIVE", strength: "HARD" } },
  ],
  actions: ["SEARCH_RESTAURANTS", "INVESTIGATE_CANDIDATE_FACTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS"],
  factJudgments: [
    { criterion: "vegetarian restaurant", outcome: "SUPPORTED" },
    { criterion: "ramen", outcome: "SUPPORTED" },
  ],
};

function modelResponse(outputText: string, invocationId: string): ModelResponse {
  return { invocationId, provider: "FIXTURE", model: "fixed-independent-boundary", outputText, finishReason: "TOOL_CALLS", latencyMs: 0 };
}

function action(type: PlannedAction, candidateIds: string[] = []): Record<string, unknown> {
  return { type, question: "", relatedFields: [], retrievalHint: "", candidateIds, candidateId: "", offerId: "", decisionSummary: "explicit offline action plan" };
}

class FixedCurrentCaseModel implements ModelGateway {
  readonly requests: ModelRequest[] = [];
  private readonly remainingActions: PlannedAction[];

  constructor(private readonly plan: Plan, private readonly rawContent: string) { this.remainingActions = [...plan.actions]; }

  async complete(request: ModelRequest): Promise<ModelResponse> {
    this.requests.push(request);
    if (request.purpose === "restaurant_semantic_interpret") {
      assert.ok(request.messages.some((message) => message.content.includes(this.rawContent)), "semantic model must receive the exact frozen user message");
      return modelResponse(JSON.stringify({ schemaVersion: "3", facts: this.plan.facts }), `semantic:${this.plan.id}`);
    }
    if (request.purpose === "restaurant_fact_judgment") {
      const payload = JSON.parse(request.messages.find((message) => message.role === "user")!.content) as {
        observations?: Array<{ evidenceId?: string }>;
      };
      const evidenceIds = (payload.observations ?? []).flatMap((item) => typeof item.evidenceId === "string" ? [item.evidenceId] : []);
      assert.ok(evidenceIds.length > 0, "scripted fact judgment must cite an actual source observation");
      return modelResponse(JSON.stringify({
        judgments: (this.plan.factJudgments ?? []).map((judgment) => ({ ...judgment, evidenceIds: [evidenceIds[0]!] })),
      }), `fact-judgment:${this.plan.id}`);
    }
    if (request.purpose !== "restaurant_agent_decide") throw new Error(`Unprepared model purpose: ${request.purpose}`);
    const next = this.remainingActions.shift();
    if (!next) throw new Error(`Unprepared agent decision after the fixed ${this.plan.id} sequence`);
    const payload = JSON.parse(request.messages.find((message) => message.role === "user")!.content) as { context: { candidates?: Array<{ id: string }> } };
    const candidateIds = payload.context.candidates?.map((candidate) => candidate.id) ?? [];
    if (["CHECK_AVAILABILITY", "INVESTIGATE_CANDIDATE_FACTS", "PRESENT_RESULTS"].includes(next)) {
      const expectedBatchSize = this.plan.candidateBatchSize ?? 1;
      if (candidateIds.length !== expectedBatchSize) throw new Error(`${next} requires ${expectedBatchSize} independently grounded candidate(s), got ${candidateIds.length}`);
      return modelResponse(JSON.stringify(action(next, candidateIds)), `agent:${this.plan.id}:${next}`);
    }
    return modelResponse(JSON.stringify(action(next)), `agent:${this.plan.id}:${next}`);
  }

  assertConsumed(): void { assert.deepEqual(this.remainingActions, [], `all fixed ${this.plan.id} actions must execute`); }
}

type StrengthUpgradeControl = "missing-current-hard-evidence" | "current-hard-evidence";

/**
 * Two user turns through the real Hybrid composition. The first turn makes
 * vegetarian a nonblocking condition and presents a result. The second turn
 * makes that exact condition HARD. No State or evidence is filled in by this
 * test: the Runtime reset, Router reads, Validator, Reducer, and evaluator
 * must decide whether the second presentation is legal.
 */
class TwoTurnStrengthUpgradeModel implements ModelGateway {
  readonly requests: ModelRequest[] = [];
  private semanticTurn = 0;
  private readonly actions: PlannedAction[];

  constructor(private readonly control: StrengthUpgradeControl) {
    this.actions = control === "current-hard-evidence"
      ? ["SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS", "SEARCH_RESTAURANTS", "INVESTIGATE_CANDIDATE_FACTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS"]
      : ["SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS", "SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS"];
  }

  async complete(request: ModelRequest): Promise<ModelResponse> {
    this.requests.push(request);
    if (request.purpose === "restaurant_semantic_interpret") {
      this.semanticTurn += 1;
      const facts = this.semanticTurn === 1
        ? [
            { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "vegetarian lunch near Shibuya" } },
            { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-20", raw: "tomorrow" } },
            { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "12:30", latest: "12:30", raw: "12:30 PM" } },
            { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 3, source: "EXPLICIT" } },
            { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Shibuya" } },
            { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "vegetarian restaurant", polarity: "POSITIVE", strength: "UNSPECIFIED" } },
          ]
        : [{ field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "vegetarian restaurant", polarity: "POSITIVE", strength: "HARD" } }];
      return modelResponse(JSON.stringify({ schemaVersion: "3", facts }), `semantic:strength-upgrade:${this.semanticTurn}`);
    }
    if (request.purpose === "restaurant_fact_judgment") {
      assert.equal(this.control, "current-hard-evidence", "only the normal control may request new HARD fact judgment");
      const payload = JSON.parse(request.messages.find((message) => message.role === "user")!.content) as { observations?: Array<{ evidenceId?: string }> };
      const evidenceId = payload.observations?.find((item) => item.evidenceId)?.evidenceId;
      assert.ok(evidenceId, "new HARD judgment must cite a current source observation");
      return modelResponse(JSON.stringify({ judgments: [{ criterion: "vegetarian restaurant", outcome: "SUPPORTED", evidenceIds: [evidenceId] }] }), "fact-judgment:strength-upgrade");
    }
    if (request.purpose !== "restaurant_agent_decide") throw new Error(`Unprepared model purpose: ${request.purpose}`);
    const next = this.actions.shift();
    if (!next) throw new Error("Unexpected agent decision after two-turn strength-upgrade sequence");
    const payload = JSON.parse(request.messages.find((message) => message.role === "user")!.content) as { context: { candidates?: Array<{ id: string }> } };
    const candidateIds = payload.context.candidates?.map((candidate) => candidate.id) ?? [];
    return modelResponse(JSON.stringify(action(next, ["CHECK_AVAILABILITY", "INVESTIGATE_CANDIDATE_FACTS", "PRESENT_RESULTS"].includes(next) ? candidateIds : [])), `agent:strength-upgrade:${next}`);
  }

  assertConsumed(): void { assert.equal(this.semanticTurn, 2, "both user turns must reach the interpreter"); assert.deepEqual(this.actions, [], "the planned user-visible actions must execute or be validator-rejected"); }
}

function strengthUpgradeMaterializedCase() {
  return {
    id: "strength-upgrade", content: "Make vegetarian restaurant a hard requirement.",
    semantic: {
      target: { goal: "AVAILABILITY" }, date: { value: "2026-08-20" }, party_size: 3,
      time: { value: "12:30" }, location: { value: "Shibuya", relation: "NEAR" },
      criteria: [{ value: "vegetarian restaurant", polarity: "POSITIVE", strength: "HARD" }],
    },
  };
}

test("a second-turn HARD upgrade resets the real Runtime and cannot reuse an old nonblocking presentation", async (t) => {
  const referenceTime = "2026-08-19T16:00:00+08:00";
  const observedAt = new Date(referenceTime).toISOString();
  for (const control of ["missing-current-hard-evidence", "current-hard-evidence"] as const) await t.test(control, async () => {
    const taskId = `offline-current:strength-upgrade:${control}`;
    const model = new TwoTurnStrengthUpgradeModel(control);
    const sources = createCurrentDevelopmentFixedSources(currentDevelopmentSourceScenario("new-vegetarian-lunch"), { now: () => observedAt }, model);
    const composition = createHybridReadComposition({
      taskId, runId: `run:${taskId}`, clock: { now: () => new Date(observedAt) }, model,
      search: sources.search, facts: sources.facts, availability: sources.availability,
      // The negative's third action is a deliberately illegal presentation;
      // the bounded loop then stops rather than accepting the old card.
      loop: { maxSteps: control === "current-hard-evidence" ? 4 : 3, timeoutMs: 5_000 },
    });
    const first = await composition.interpretAndDispatch({ taskId, message: "Find a vegetarian lunch near Shibuya tomorrow at 12:30 PM for three.", referenceTime, timezone: "Asia/Tokyo" });
    assert.equal(first.status, "PROPOSED");
    const firstLoop = await composition.coordinator.run(taskId);
    const firstState = composition.runtime.snapshot(taskId).domainState;
    assert.equal(firstLoop.status, "TERMINAL");
    assert.equal(firstState.phase, "PRESENT_RESULTS", "the normal UNSPECIFIED first turn can display an independently available candidate");
    assert.equal(firstState.intentDraft?.criteria.find((criterion) => criterion.text === "vegetarian restaurant")?.strength, "UNSPECIFIED");
    assert.ok(firstState.readEvidence.length > 0, "the first presentation must have actual source observations to invalidate");

    const second = await composition.interpretAndDispatch({ taskId, message: "Make vegetarian restaurant a hard requirement.", referenceTime, timezone: "Asia/Tokyo" });
    assert.equal(second.status, "PROPOSED");
    const afterReset = composition.runtime.snapshot(taskId).domainState;
    assert.equal(afterReset.phase, "UNDERSTANDING");
    assert.equal(afterReset.presentedResults, undefined, "the previous card is not retained after a semantic request change");
    assert.deepEqual(afterReset.readEvidence, [], "the previous request's observations are reset before the second investigation");
    assert.equal(afterReset.investigationRevision, 2, "the second semantic compile produces a distinct request revision");
    assert.equal(afterReset.intentDraft?.criteria.find((criterion) => criterion.text === "vegetarian restaurant")?.strength, "HARD");

    const secondLoop = await composition.coordinator.run(taskId);
    const finalSnapshot = composition.runtime.snapshot(taskId);
    const final = finalSnapshot.domainState;
    const artifact = {
      status: final.phase === "PRESENT_RESULTS" ? "SUCCEEDED" : "FAILED", stage: "AGENT_LOOP", caseId: "strength-upgrade", runId: taskId,
      materializedCase: strengthUpgradeMaterializedCase(), finalSnapshot,
      trajectories: composition.trajectories.steps, loop: secondLoop,
      resourceUsage: { elapsedMs: 0, agentDecisions: composition.trajectories.steps.length, browserModelCalls: 0 },
    };
    const evaluation = evaluateRestaurantHybridLiveArtifact(artifact, { path: `${control}.result.json`, sha256: "fixture" });
    if (control === "missing-current-hard-evidence") {
      assert.equal(secondLoop.status, "STEP_LIMIT");
      assert.notEqual(final.phase, "PRESENT_RESULTS");
      assert.equal(final.presentedResults, undefined);
      const rejectedPresentation = composition.trajectories.steps.find((step) => step.stepOutcome === "REJECTED" && step.agentAction?.type === "PRESENT_RESULTS");
      assert.equal(rejectedPresentation?.actionValidation?.status, "REJECTED");
      assert.equal(rejectedPresentation?.actionValidation?.code, "PRESENTATION_EVIDENCE_MISSING");
      assert.notEqual(evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(evaluation));
      assert.equal(sources.calls.facts, 0, "old first-turn evidence is not silently treated as new HARD support");
    } else {
      assert.equal(secondLoop.status, "TERMINAL");
      assert.equal(final.phase, "PRESENT_RESULTS");
      assert.equal(final.presentedResults?.candidateIds.length, 1);
      assert.ok(final.readEvidence.some((evidence) => evidence.provider === "MODEL_JUDGMENT" && (evidence.claims.verifiedHardCriteria as string[] | undefined)?.includes("vegetarian restaurant")), "the normal control must receive fresh cited HARD evidence through Router/Reducer");
      assert.equal(evaluation.findings.find((item) => item.dimension === "AUTHORITATIVE_CONDITIONS")?.status, "SATISFIED", JSON.stringify(evaluation));
      assert.equal(evaluation.findings.find((item) => item.dimension === "REQUIRED_EVIDENCE")?.status, "SATISFIED", JSON.stringify(evaluation));
      assert.equal(evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(evaluation));
      assert.equal(sources.calls.facts, 1);
    }
    model.assertConsumed();
  });
});

test("current H001-H005 raw requests complete through the real offline Hybrid composition with a scripted code-contract model", async (t) => {
  const frozen = await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH);
  assert.deepEqual(frozen.map((item) => item.id), PLANS.map((plan) => plan.id));
  for (const plan of PLANS) await t.test(plan.id, async () => {
    const sourceCase = frozen.find((item) => item.id === plan.id)!;
    const rawContent = String(sourceCase.content).trimEnd();
    assert.ok(rawContent.length > 0, "the frozen user message is immutable test input");
    const observedAt = new Date(plan.referenceTime).toISOString();
    const model = new FixedCurrentCaseModel(plan, rawContent);
    const sources = createCurrentDevelopmentFixedSources(currentDevelopmentSourceScenario(plan.id), { now: () => observedAt }, model);
    const taskId = `offline-current:${plan.id}`;
    const composition = createHybridReadComposition({
      taskId, runId: `run:${taskId}`, clock: { now: () => new Date(observedAt) }, model,
      search: sources.search, facts: sources.facts, availability: sources.availability,
      loop: { maxSteps: 6, timeoutMs: 5_000 },
    });
    const semantic = await composition.interpretAndDispatch({ taskId, message: String(sourceCase.content), referenceTime: plan.referenceTime, timezone: "Asia/Tokyo" }, plan.area === "nearby" ? HIGASHI_GINZA_EVALUATION_LOCATION : undefined);
    assert.equal(semantic.status, "PROPOSED");
    const loop = await composition.coordinator.run(taskId);
    const state = composition.runtime.snapshot(taskId).domainState;
    const artifact = {
      status: "SUCCEEDED", stage: "AGENT_LOOP", caseId: plan.id, runId: taskId, materializedCase: sourceCase,
      finalSnapshot: composition.runtime.snapshot(taskId), trajectories: composition.trajectories.steps, loop,
      resourceUsage: { elapsedMs: 0, agentDecisions: composition.trajectories.steps.length, browserModelCalls: 0,
        googleRequests: sources.search.googleRequestUsage(`run:${taskId}:investigation:${state.investigationRevision}`) },
    };
    const evaluation = evaluateRestaurantHybridLiveArtifact(artifact, { path: `${plan.id}.mock.result.json`, sha256: "mock" });
    if (plan.id !== "h005") {
      assert.equal(evaluation.findings.find(finding => finding.dimension === "AUTHORITATIVE_CONDITIONS")?.status, "SATISFIED", JSON.stringify(evaluation));
      assert.equal(evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(evaluation));
      assert.equal(evaluation.findings.find(finding => finding.dimension === "COMPLETION_OUTCOME")?.status, "SATISFIED", JSON.stringify(evaluation));
    }
    const acceptance = assessFixedSourceAcceptance({
      expectation: fixedSourceCaseRegistration(plan.id).expectation,
      execution: { status: "SUCCEEDED", loopStatus: loop.status, phase: state.phase },
      ...(state.presentedResults ? {
        presentedResult: {
          candidateIds: state.presentedResults.candidateIds,
          ...(state.selectionSession?.resultBatchTarget ? { resultBatchTarget: state.selectionSession.resultBatchTarget } : {}),
        },
      } : {}),
      evaluation,
    });
    assert.equal(acceptance.acceptance, plan.id === "h005" ? "FAIL" : "PASS", acceptance.reasons.join("\n"));
    t.diagnostic(JSON.stringify({ caseId: plan.id, phase: state.phase, qualified: evaluation.execution.taskProducedQualifiedResult,
      completionDiagnostic: evaluation.findings.find(finding => finding.dimension === "COMPLETION_OUTCOME")?.status,
      sourceCalls: sources.calls }));
    model.assertConsumed();
    assert.equal(sources.calls.search, 1);
    assert.equal(state.intentDraft?.target?.goal, plan.goal);
    assert.equal(state.intentDraft?.date, plan.date);
    assert.deepEqual(state.intentDraft?.timeWindow, plan.timeWindow);
    assert.equal(state.intentDraft?.partySize, plan.partySize);
    if (plan.id === "h003") assert.equal(state.intentDraft?.temporalResolution?.timeWindow?.basis, "DAYPART:AFTER_WORK_BROAD_WINDOW");
    if (plan.id === "h005") {
      assert.equal(state.phase, "NO_VERIFIED_RESULT");
      assert.equal(state.presentedResults, undefined);
    } else {
      assert.deepEqual(state.selectionSession?.resultBatchTarget, { candidateCount: 3, met: true });
      assert.equal(state.presentedResults?.candidateIds.length, 3);
    }
    if (plan.id === "h004") {
      assert.equal(sources.calls.facts, 3); assert.equal(sources.calls.availability, 0);
      assert.equal(loop.status, "TERMINAL"); assert.equal(state.phase, "PRESENT_RESULTS");
    } else {
      assert.equal(sources.calls.facts, ["h002", "h005"].includes(plan.id) ? 3 : 0);
      assert.equal(sources.calls.availability, 3);
    }
    if (plan.id !== "h004" && plan.id !== "h005") {
      assert.equal(state.phase, "PRESENT_RESULTS");
      for (const candidateId of state.presentedResults?.candidateIds ?? []) {
        assert.equal(state.availabilityChecks[candidateId]?.status, "AVAILABLE");
        assert.equal(state.availabilityChecks[candidateId]?.receptionMode, "RESERVATION_SUPPORTED");
        assert.equal(state.availability[candidateId]?.length, 1);
      }
    }
  });
});

test("a new task and new source scenario reuse the fixed Hybrid composition without a case-specific Runner", async () => {
  const plan = NEW_VEGETARIAN_LUNCH_PLAN;
  const observedAt = new Date(plan.referenceTime).toISOString();
  const model = new FixedCurrentCaseModel(plan, "Find a vegetarian restaurant near Shibuya tomorrow at 12:30 PM for three. No ramen.");
  const sources = createCurrentDevelopmentFixedSources(currentDevelopmentSourceScenario("new-vegetarian-lunch"), { now: () => observedAt }, model);
  const taskId = "offline-current:new-vegetarian-lunch";
  const composition = createHybridReadComposition({
    taskId, runId: `run:${taskId}`, clock: { now: () => new Date(observedAt) }, model,
    search: sources.search, facts: sources.facts, availability: sources.availability, loop: { maxSteps: 6, timeoutMs: 5_000 },
  });
  const semantic = await composition.interpretAndDispatch({ taskId, message: "Find a vegetarian restaurant near Shibuya tomorrow at 12:30 PM for three. No ramen.", referenceTime: plan.referenceTime, timezone: "Asia/Tokyo" });
  assert.equal(semantic.status, "PROPOSED");
  const loop = await composition.coordinator.run(taskId);
  const state = composition.runtime.snapshot(taskId).domainState;
  assert.equal(loop.status, "TERMINAL");
  assert.equal(state.phase, "PRESENT_RESULTS");
  assert.equal(state.intentDraft?.date, "2026-08-20");
  assert.equal(state.intentDraft?.partySize, 3);
  assert.deepEqual(state.intentDraft?.timeWindow, { earliest: "12:30", latest: "12:30" });
  assert.equal(sources.calls.search, 1);
  assert.equal(sources.calls.facts, 1);
  assert.equal(sources.calls.availability, 1);
  assert.ok(model.requests.some((request) => request.purpose === "restaurant_fact_judgment"), "non-verbatim HARD evidence must pass through the bounded cited judgment boundary");
  const candidateId = state.presentedResults?.candidateIds[0]!;
  const judgment = state.readEvidence.find((evidence) => evidence.provider === "MODEL_JUDGMENT" && evidence.candidateId === candidateId);
  assert.ok(judgment, "the state must retain the cited judgment evidence rather than a hand-injected eligibility flag");
  assert.deepEqual(judgment.claims.verifiedHardCriteria, ["vegetarian restaurant"]);
  assert.ok((judgment.claims.supportingEvidenceIds as string[]).length > 0, "the judgment must cite a source observation");
  model.assertConsumed();
});

test("registered control cases use the shared execution, evaluator, and acceptance path", async () => {
  const { registration, materializedCase } = await loadRegisteredFixedSourceCase("new-vegetarian-lunch");
  const model = new FixedCurrentCaseModel(NEW_VEGETARIAN_LUNCH_PLAN, String(materializedCase.content));
  const result = await executeFixedSourceCase({ registration, materializedCase, model, taskId: "offline-registered:new-vegetarian" });
  assert.equal(result.execution.status, "SUCCEEDED");
  assert.equal(result.execution.phase, "PRESENT_RESULTS");
  const artifact = {
    status: result.execution.status, stage: "AGENT_LOOP", caseId: registration.id, runId: "offline-registered:new-vegetarian",
    materializedCase, finalSnapshot: result.finalSnapshot, trajectories: result.trajectories, loop: result.loop,
    resourceUsage: { elapsedMs: result.elapsedMs, agentDecisions: result.trajectories.length, browserModelCalls: 0 },
  };
  const accepted = assessFixedSourceAcceptance({ expectation: registration.expectation, execution: result.execution, evaluation: evaluateRestaurantHybridLiveArtifact(artifact, { path: "new-vegetarian.result.json", sha256: "fixture" }) });
  assert.equal(accepted.acceptance, "PASS", accepted.reasons.join("\n"));
  const broken = structuredClone(artifact) as any;
  broken.finalSnapshot.domainState.readEvidence = [];
  const rejected = assessFixedSourceAcceptance({ expectation: registration.expectation, execution: result.execution, evaluation: evaluateRestaurantHybridLiveArtifact(broken, { path: "new-vegetarian.missing-evidence.result.json", sha256: "fixture" }) });
  assert.equal(rejected.acceptance, "FAIL", "a controlled missing-evidence artifact must fail the same acceptance path");
  model.assertConsumed();
});

test("fixed-source registration refuses unknown IDs and missing bindings", () => {
  assert.throws(() => fixedSourceCaseRegistration("not-registered"), { code: "FIXED_SOURCE_CASE_UNREGISTERED" });
  assert.throws(() => validateFixedSourceCaseRegistration({ id: "bad", input: "CONTROL", sourceScenarioId: "" as any, expectation: {} as any }), { code: "FIXED_SOURCE_CASE_INVALID" });
});
