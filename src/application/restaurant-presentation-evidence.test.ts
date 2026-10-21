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
  assert.equal(shown.presentedResults!.conditionStates[candidateId]![0]!.status, "MET");
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
