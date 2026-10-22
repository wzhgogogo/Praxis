import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { RestaurantTaskState } from "../domains/restaurant/contracts.js";
import { restaurantCurrentFactEvidence } from "../domains/restaurant/read-assessment.js";
import { restaurantBookingTaskDefinition } from "../domains/restaurant/task-definition.js";
import { RestaurantExecutionRouter } from "./restaurant-execution-router.js";

const raw = new URL("../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-05-attempt-1/runner/2026-10-21T11-17-13-039Z-654604aa-9a39-4005-9962-00f1a79c827c.result.json", import.meta.url);
const candidateId = "tabelog:en/tokyo/A1309/A130905/13048623";
const laterFact = "evidence:restaurant:tabelog-hard-criteria:90f76d3a50b0f0b768e8fa1f";

test("c05 Kaga Router to Reducer retains the later availability-read source fact", async () => {
  const artifact = JSON.parse(await readFile(raw, "utf8"));
  const original: RestaurantTaskState = artifact.finalSnapshot.domainState;
  const now = original.presentedResults!.presentedAt;
  const candidateIds = [...original.presentedResults!.candidateIds];
  assert.ok(!original.presentedResults!.evidenceIds.includes(laterFact), "preserve the historical red-light observation");
  let state = restaurantBookingTaskDefinition.create({}, { taskId: "saved-c05", runId: "saved-c05", now: artifact.startedAt, createId: p => p });
  for (const envelope of artifact.events) {
    if (envelope.event.type === "RESULTS_PRESENTED") break;
    state = restaurantBookingTaskDefinition.transition(state, envelope.event, { taskId: "saved-c05", runId: "saved-c05", now: envelope.occurredAt, createId: p => p }).state;
  }
  assert.equal(state.phase, "SEARCHING");
  assert.ok(state.availabilityChecks[candidateId]!.evidenceIds.includes(laterFact));
  assert.ok(state.factChecks![candidateId]!.checkedAt < state.readEvidence.find(e => e.evidenceId === laterFact)!.observedAt);
  let reads = 0;
  const router = new RestaurantExecutionRouter(
    { executionRoute: "STRUCTURED_ADAPTER", async search() { reads++; throw Error("NO_SOURCE_READS"); } },
    { executionRoute: "STRUCTURED_ADAPTER", async check() { reads++; throw Error("NO_SOURCE_READS"); } },
    { structuredReadTimeoutMs: 1000, browserReadTimeoutMs: 1000 },
  );
  const execution = await router.execute({ type: "PRESENT_RESULTS", candidateIds }, state, now);
  assert.equal(execution.event?.type, "RESULTS_PRESENTED");
  assert.ok(execution.event?.type === "RESULTS_PRESENTED" && execution.event.evidenceIds.includes(laterFact), "the newer source fact must reach the presentation event");
  const shown = restaurantBookingTaskDefinition.transition(state, execution.event!, { taskId: "saved-c05", runId: "saved-c05", now, createId: p => p }).state;
  assert.ok(shown.presentedResults!.evidenceIds.includes(laterFact));
  assert.equal(shown.presentedResults!.conditionStates[candidateId]![0]!.status, "NOT_CHECKED", "merchant name and customer-review title alone must not display HARD MET");
  assert.equal(shown.presentedResults!.conditionStates[candidateId]![0]!.criterionRef, "criterion:0");
  assert.equal(reads, 0);
  assert.throws(() => restaurantBookingTaskDefinition.transition(state, { ...execution.event!, type: "RESULTS_PRESENTED", candidateIds, evidenceIds: shown.presentedResults!.evidenceIds.filter(id => id !== laterFact) },
    { taskId: "saved-c05", runId: "saved-c05", now, createId: p => p }), /omitted current required evidence/);


  const refreshed = structuredClone(state);
  refreshed.factChecks![candidateId]!.checkedAt = now;
  assert.ok(!restaurantCurrentFactEvidence(refreshed, candidateId).some(e => e.evidenceId === laterFact), "a later completed same-source fact read must not revive an earlier omitted fact");
  const superseded = structuredClone(state);
  superseded.factChecks![candidateId]!.supersededEvidenceIds = [laterFact];
  assert.ok(!restaurantCurrentFactEvidence(superseded, candidateId).some(e => e.evidenceId === laterFact));
  const wrongCandidate = structuredClone(state);
  wrongCandidate.readEvidence.find(e => e.evidenceId === laterFact)!.candidateId = "another-outlet";
  assert.ok(!restaurantCurrentFactEvidence(wrongCandidate, candidateId).some(e => e.evidenceId === laterFact));
});

// C18 H002: a newer fact read superseded the priced availability fact. Its
// own saved page still contains the budget; preserve that fresh metadata.
test("C18 H002 current fact document carries same-page prices through judgment and Router to Reducer", async () => {
  const { createHash } = await import("node:crypto");
  const { parseTabelogPriceFacts } = await import("../integrations/tabelog/tabelog-page-parser.js");
  const { NativeSourceFactRead } = await import("../integrations/restaurant-facts/native-source-facts.js");
  const { ModelRestaurantFactJudgment } = await import("../integrations/restaurant-facts/model-fact-judgment.js");
  const root = new URL("../../", import.meta.url);
  const dir = new URL(".eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/", root);
  const inputs = JSON.parse(await readFile(new URL("c18-inputs.json", dir), "utf8"));
  const hard = JSON.parse(await readFile(new URL("hard-evidence.json", dir), "utf8"));
  let checked = 0;
  for (const runId of ["c-12", "c-16"]) {
    const row = inputs.runs.find((r: any) => r.runId === runId);
    const bytes = await readFile(new URL(row.artifactPath, root));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), row.artifactSha256);
    const artifact = JSON.parse(bytes.toString());
    const snapshots = hard.runs.find((r: any) => r.artifactSha256 === row.artifactSha256).snapshots;
    const context = (at: string) => ({ taskId: artifact.runId, runId: artifact.runId, now: at, createId: (p: string) => p });
    let state = restaurantBookingTaskDefinition.create({}, context(artifact.startedAt));
    for (const envelope of artifact.events) {
      if (envelope.event.type === "RESULTS_PRESENTED") break;
      state = restaurantBookingTaskDefinition.transition(state, envelope.event, context(envelope.occurredAt)).state;
    }
    const shownAt = artifact.finalSnapshot.domainState.presentedResults.presentedAt;
    for (const id of artifact.finalSnapshot.domainState.presentedResults.candidateIds) {
      if (!id.endsWith("13292459") && !id.endsWith("13295658")) continue;
      const check = state.factChecks![id]!;
      const current = state.readEvidence.find(e => check.evidenceIds.includes(e.evidenceId) && e.kind === "RESTAURANT_FACT" && e.provider === "TABELOG")!;
      assert.ok(current && !current.priceFacts);
      const binding = snapshots.find((s: any) => s.evidenceId === current.evidenceId);
      const html = await readFile(new URL(binding.path, dir), "utf8");
      assert.equal(createHash("sha256").update(html).digest("hex"), binding.sha256);
      const prices = parseTabelogPriceFacts({ url: current.sourceUrl!, html, text: "", title: "" });
      assert.deepEqual([prices?.dinnerBudgetRangeYen?.min, prices?.dinnerBudgetRangeYen?.max], [8000, 9999]);
      const identity = state.readEvidence.find(e => check.evidenceIds.includes(e.evidenceId) && e.kind === "ENTITY_MATCH" && e.sourceUrl === current.sourceUrl)!;
      const statements = (current.claims.restaurantTypeFacts as string[]).map((text, i) => ({ id: `statement:${i}`, text }));
      const outlet = state.candidates.find(c => c.restaurant.id === id)!;
      const page = { url: current.sourceUrl!, html, title: outlet.restaurant.outletName,
        text: [outlet.restaurant.outletName, outlet.restaurant.address, ...statements.map(s => s.text)].join("\n") };
      const source = await new NativeSourceFactRead(
        { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 },
        { openSession: async () => ({
          metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: current.observedAt },
          navigate: async () => undefined, snapshot: async () => page, observeControls: async () => [],
          click: async () => undefined, fill: async () => undefined, select: async () => [],
          waitFor: async () => undefined, screenshot: async () => new Uint8Array(), close: async () => undefined,
        }) }, { async judge() { return { evidence: [] }; } }, () => current.observedAt,
      ).inspectFacts({ candidateIds: [id], candidates: [outlet], intent: state.intent! }, new AbortController().signal);
      const freshPrices = source.sourceDocuments?.find(d => d.candidateId === id)?.priceFacts;
      assert.deepEqual(freshPrices?.dinnerBudgetRangeYen, prices!.dinnerBudgetRangeYen, "native source producer retains same-page prices");
      assert.ok(freshPrices);
      const document = { id: current.evidenceId, candidateId: id, identityEvidenceId: identity.evidenceId, statements, priceFacts: freshPrices };
      let wire: any;
      const judgment = new ModelRestaurantFactJudgment({ async complete(request) {
        wire = JSON.parse(request.messages.find(m => m.role === "user")!.content);
        // Existing model input/output contracts do not gain parser metadata.
        return { invocationId: "offline-scripted", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS", latencyMs: 0,
          outputText: JSON.stringify({ sourceSelections: [{ documentId: document.id, statementIds: statements.map(s => s.id) }], judgments: [] }) };
      } });
      const read = await judgment.judge({ candidate: state.candidates.find(c => c.restaurant.id === id)!, intent: state.intent!, evidence: [identity], sourceDocuments: [document] });
      const fresh = read.evidence.find(e => e.evidenceId === current.evidenceId)!;
      assert.deepEqual(fresh.priceFacts?.dinnerBudgetRangeYen, prices!.dinnerBudgetRangeYen, `${runId}:${id}: current document price metadata must survive judgment`);
      assert.equal(wire.sourceDocuments[0].priceFacts, undefined, "structured prices stay private, preserving the model contract");
      state.readEvidence = state.readEvidence.map(e => e.evidenceId === current.evidenceId ? fresh : e);
      assert.ok(check.supersededEvidenceIds?.some(old => state.readEvidence.find(e => e.evidenceId === old)?.priceFacts), "older priced fact remains superseded");
      checked++;
    }
    let reads = 0;
    const router = new RestaurantExecutionRouter(
      { executionRoute: "STRUCTURED_ADAPTER", async search() { reads++; throw Error("NO_SOURCE_READS"); } },
      { executionRoute: "STRUCTURED_ADAPTER", async check() { reads++; throw Error("NO_SOURCE_READS"); } },
      { structuredReadTimeoutMs: 1000, browserReadTimeoutMs: 1000 },
    );
    const execution = await router.execute({ type: "PRESENT_RESULTS", candidateIds: artifact.finalSnapshot.domainState.presentedResults.candidateIds }, state, shownAt);
    assert.equal(execution.event?.type, "RESULTS_PRESENTED");
    const shown = restaurantBookingTaskDefinition.transition(state, execution.event!, context(shownAt)).state.presentedResults!;
    for (const id of shown.candidateIds) if (id.endsWith("13292459") || id.endsWith("13295658")) {
      const condition = shown.conditionStates[id]!.find(c => c.criterionRef === "criterion:0")!;
      assert.equal(condition.status, "MET", `${runId}:${id}: price must reach actual presentation`);
      assert.ok(condition.sources.some(s => s.field === "PRICE" && /8,000/.test(s.quote)));
      assert.ok(condition.evidenceIds.every(e => !state.factChecks![id]!.supersededEvidenceIds?.includes(e)));
    }
    assert.equal(reads, 0);
  }
  assert.equal(checked, 3);
});
