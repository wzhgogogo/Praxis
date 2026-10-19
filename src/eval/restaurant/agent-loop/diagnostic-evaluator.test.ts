import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

import { fixtureIntent } from "../../../harness/restaurant-fixtures.js";

import { startDiagnosticRun } from "../../shared/diagnostic-run.js";
import { compileRestaurantSemanticProposal } from "../../../domains/restaurant/semantic-compiler.js";
import type { RestaurantIntentDraft } from "../../../domains/restaurant/contracts.js";
import { applyRestaurantIntentPatch } from "../../../domains/restaurant/intent-state.js";
import { validateRestaurantSemanticProposal } from "../../../domains/restaurant/semantic-proposal.js";
import { evaluateArtifactAfterFinish, evaluateRestaurantHybridLiveArtifact } from "./diagnostic-evaluator.js";
import { snapshotRecord } from "./runners/browser-case-slice-evidence.js";
import { readDiagnosticRun } from "./diagnostic-evaluator-record.js";
import { loadCriterionEquivalences, parseCriterionEquivalences } from "./criterion-equivalences.js";
import { evaluateSourceOpeningHours, loadPostDeliveryTabelogObservation } from "./diagnostic-evaluator-grounding.js";
import { evaluatorImportViolation } from "../../shared/evaluator-import-rule.js";
import { loadFrozenCalibrationInput, loadCalibrationObservations, loadApprovedGoldCorrection } from "./calibration-inputs.js";
import { evaluateFrozenCalibrationArtifact } from "./runners/run-hybrid-artifact-evaluation.js";
import { loadWitnessOracle, loadWitnessContext } from "./diagnostic-evaluator-witness.js";
import type { WitnessOracle } from "./diagnostic-evaluator-witness.js";
import { loadSoftPreferenceObservations, parseSoftPreferenceObservations } from "./diagnostic-evaluator-preferences.js";
import { auditReadOnlyTrace, parseReviewedReads } from "./diagnostic-evaluator-network.js";

// Frozen exposed runs, never regenerated from the request or the evaluator.
async function calibrationArtifact(runId: string): Promise<any> {
  return JSON.parse(gunzipSync(await readFile(new URL(`../../../../.eval-artifacts/calibration-phase1-20261015/inputs/${runId}.result.json.gz`, import.meta.url))).toString("utf8"));
}
function testEquivalences(entries: unknown[] = []) {
  return parseCriterionEquivalences(JSON.stringify({ schema: "criterion-equivalences@1", revision: 1, status: "TEST_ONLY", rule: "Only listed pairs", entries }), "TEST_ONLY");
}

test("E1 review approved rev2 Gold repairs every rev1 Part A result without changing its bytes", async () => {
  const manifest = ".eval-artifacts/calibration-phase1-20261015/inputs/manifest.json";
  const corrections = ".eval-artifacts/e1-evaluator-20261016/gold-corrections.json";
  const directory = await mkdtemp(join(tmpdir(), "e1-approved-gold-"));
  try {
    const input = await loadFrozenCalibrationInput(manifest, "p1fA-kf-h002-a1");
    const original = await readFile(input.sourceArtifact.path);
    assert.equal(evaluateRestaurantHybridLiveArtifact(input.artifact, input.sourceArtifact, input.options).outcome.type, "NOT_EVALUATED", "original damaged Gold stays visible without the approved correction");
    const { evaluation } = await evaluateFrozenCalibrationArtifact(manifest, "p1fA-kf-h002-a1", directory, undefined, undefined, corrections);
    assert.equal(evaluation.outcome.type, "QUALIFIED_DELIVERY", "approved independent rev2 Gold must actually enter evaluation");
    assert.equal(finding(evaluation, "AUTHORITATIVE_CONDITIONS").status, "SATISFIED");
    const budget = evaluation.conditionStates[0]?.criteria.find(row => row.text === "around 10,000 yen per person");
    assert.equal(budget?.status, "MET");
    assert.deepEqual(await readFile(input.sourceArtifact.path), original);
    assert.equal((input.artifact as any).materializedCase.semantic.criteria[1].value, "around 10", "never repair the original artifact in place");
    for (const runId of ["p1fA-kf-h001-a1", "p1fA-kf-h004-a1", "p1fA-kagurazaka-a1", "p1fA-nakameguro-a1"]) {
      const { evaluation } = await evaluateFrozenCalibrationArtifact(manifest, runId, directory, undefined, undefined, corrections);
      assert.ok(evaluation.goldCorrection?.applied, `${runId}: correction applies to all rev1 results, not only the malformed budget`);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("E1 review Gold correction binds all affected originals and both source SHAs, not a case-name exception", async () => {
  const manifestPath = ".eval-artifacts/calibration-phase1-20261015/inputs/manifest.json";
  const corrections = ".eval-artifacts/e1-evaluator-20261016/gold-corrections.json";
  const record = JSON.parse(await readFile(corrections, "utf8"));
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const affected: string[] = [];
  for (const entry of manifest.entries) {
    const file = entry.files.find((file: any) => ["RESULT", "STARTED"].includes(file.kind));
    const artifact = JSON.parse(gunzipSync(await readFile(new URL(`../../../../.eval-artifacts/calibration-phase1-20261015/inputs/${file.path}`, import.meta.url))).toString());
    if (artifact.runtimeContext.dataset.sha256 !== "447aaf3992014be8bb29736c179cb511aff31d0a69fad022f1c659ac5760ff27") continue;
    affected.push(entry.runId);
    assert.deepEqual(record.entries.find((row: any) => row.runId === entry.runId), { runId: entry.runId, kind: file.kind, caseId: artifact.caseId, artifactSha256: file.originalSha256 });
  }
  assert.equal(affected.length, 7, "five results and two interrupted started records used rev1");
  assert.deepEqual(record.entries.map((row: any) => row.runId).sort(), affected.sort());
  const input = await loadFrozenCalibrationInput(manifestPath, "p1fA-kf-h002-a1");
  const correction = await loadApprovedGoldCorrection(corrections, input.runId, input.artifact, input.sourceArtifact.sha256);
  assert.ok(correction);
  await assert.rejects(loadApprovedGoldCorrection(corrections, input.runId, input.artifact, "0".repeat(64)), /different original/);
  assert.throws(() => evaluateRestaurantHybridLiveArtifact(input.artifact, { ...input.sourceArtifact, sha256: "0".repeat(64) }, { goldCorrection: correction }), /different original/);
  const directory = await mkdtemp(join(tmpdir(), "e1-gold-integrity-"));
  try {
    await copyFile(".eval-artifacts/p1-f-20261011/variants.yaml", join(directory, "rev1.yaml"));
    await copyFile(".eval-artifacts/p1-f-20261011/variants.rev2.yaml", join(directory, "rev2.yaml"));
    record.rev1.path = "rev1.yaml"; record.rev2.path = "rev2.yaml";
    const path = join(directory, "corrections.json");
    for (const mutate of [
      (value: any) => { value.rev1.sha256 = "0".repeat(64); },
      (value: any) => { value.rev2.sha256 = "0".repeat(64); },
      (value: any) => { value.entries = value.entries.filter((row: any) => row.runId !== input.runId); },
      (value: any) => { value.entries.find((row: any) => row.runId === input.runId).artifactSha256 = "0".repeat(64); },
    ]) {
      const wrong = structuredClone(record); mutate(wrong);
      await writeFile(path, JSON.stringify(wrong));
      await assert.rejects(loadApprovedGoldCorrection(path, input.runId, input.artifact, input.sourceArtifact.sha256), /SHA mismatch|Missing binding|different original/);
    }
    const normal = await loadFrozenCalibrationInput(manifestPath, "p20-h002-a1");
    assert.equal(await loadApprovedGoldCorrection(corrections, normal.runId, normal.artifact, normal.sourceArtifact.sha256), undefined, "other revisions are untouched");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("E1 supplement loads the actual reviewer schema without rewriting its decisions", () => {
  const table = loadCriterionEquivalences();
  assert.equal(table.entries.length, 8);
  assert.equal(table.sha256, "9880c47f54540947ea73d06dd8e530241cbce46f377f9a6f325bd6e7c8271440");
  assert.deepEqual(table.entries.map(entry => [entry.goldText, entry.systemText, entry.polarity, entry.conclusion]), [
    ["good for a first date", "first-date restaurant", "POSITIVE", "SAME"],
    ["good for a first date", "suitable for a first date", "POSITIVE", "SAME"],
    ["hot pot restaurant", "hot-pot restaurants", "NEGATIVE", "SAME"],
    ["kaiseki", "kaiseki restaurant", "POSITIVE", "SAME"],
    ["good for meeting a friend", "suitable for meeting up with a friend", "POSITIVE", "SAME"],
    ["sichuan/hunan cuisine", "sichuan/hunan-style cuisine where spicy food is the main focus", "NEGATIVE", "SAME"],
    ["team dinner", "suitable for a team dinner", "POSITIVE", "SAME"],
    ["tempura", "tempura restaurant", "POSITIVE", "SAME"],
  ]);
});

test("E1 R2 actual h003 deliveries report every preference and reject independently unmet budgets", async () => {
  for (const runId of ["p1fA-kf-h003-a2", "p1g-h003-a2"]) {
    const input = await loadFrozenCalibrationInput(".eval-artifacts/calibration-phase1-20261015/inputs/manifest.json", runId);
    const result = evaluateRestaurantHybridLiveArtifact(input.artifact, input.sourceArtifact, input.options);
    assert.equal(result.outcome.type, "DELIVERED_UNQUALIFIED", "observed unmet SOFT budget is not qualified merely because a slot exists");
    assert.equal(result.severity.S1.status, "PRESENT");
    assert.equal(result.outcome.userGoalComplete, "NO");
    assert.equal(finding(result, "FINAL_CLAIM").status, "SATISFIED", "an unmet preference is not a fabricated availability claim");
    const matrix = (result as any).conditionStates;
    assert.equal(matrix.length, runId === "p1g-h003-a2" ? 1 : 3);
    for (const row of matrix) {
      assert.equal(row.criteria.length, 4, "HARD/SOFT/UNSPECIFIED all remain visible");
      assert.equal(row.criteria.find((c: any) => c.text === "around 3,000 yen per person").status, "NOT_MET");
      assert.equal(row.criteria.find((c: any) => c.text === "private room").status, "NOT_CHECKED");
      assert.ok(row.criteria.every((c: any) => c.basis.length && c.evidenceRefs.length));
    }
  }
});

test("E1 R2 budget Gold is candidate/request bound; unknown preferences do not become failures", async () => {
  const input = await loadFrozenCalibrationInput(".eval-artifacts/calibration-phase1-20261015/inputs/manifest.json", "p20-h002-a1");
  const accepted = evaluateRestaurantHybridLiveArtifact(input.artifact, input.sourceArtifact, input.options);
  assert.equal(accepted.outcome.type, "QUALIFIED_DELIVERY");
  const budget = (result: any) => result.conditionStates[0].criteria.find((c: any) => c.text === "around 10,000 yen per person");
  assert.ok(Array.isArray(accepted.conditionStates), "every delivered outlet must expose user-condition states");
  assert.equal(budget(accepted).status, "MET");
  assert.match(budget(accepted).basis.join(" "), /9,800/);
  for (const mutate of [
    (copy: any) => { copy.finalSnapshot.domainState.candidates.find((c: any) => c.restaurant.id.endsWith("13295658")).restaurant.sourceIds.tabelog = "en/tokyo/A1301/A130101/00000000"; },
    (copy: any) => { copy.materializedCase.semantic.date.value = "2026-10-18"; },
  ]) {
    const copy = structuredClone(input.artifact); mutate(copy);
    const result = evaluateRestaurantHybridLiveArtifact(copy, { ...input.sourceArtifact, sha256: "TEST_ONLY_CHANGED_BYTES" }, input.options);
    assert.equal(budget(result).status, "NOT_CHECKED", "Gold for different original bytes must not follow an unbound run name");
  }
  const noContext = evaluateRestaurantHybridLiveArtifact(input.artifact, input.sourceArtifact);
  assert.equal(budget(noContext).status, "NOT_CHECKED", "no budget tolerance is inferred from menus or category");
  assert.equal(noContext.outcome.type, "QUALIFIED_DELIVERY", "NOT_CHECKED is disclosed, not a fabricated conflict");
});

test("E1 R2 source observation table is strict independent Gold, not a hidden outcome label", () => {
  const actual = loadSoftPreferenceObservations();
  assert.equal(actual.sha256, "39226c3b079b265789d354158f09fa52e3ae7fa821eedc10e2f3606eea84c7ce");
  assert.deepEqual(actual.observations.map(row => [row.criterion, row.status]), [
    ["around 10,000 yen per person", "MET"], ["around 3,000 yen per person", "NOT_MET"], ["around 3,000 yen per person", "NOT_MET"],
  ]);
  const fixture = { schema: "soft-preference-observations@1", status: "TEST_ONLY", observedBy: "TEST_ONLY", observedOn: "2026-10-16", use: "TEST_ONLY", observations: [
    { runIds: ["test-original"], restaurant: "Test Shop (tablecheck test-shop)", criterion: "around X yen", status: "MET", evidence: "TEST_ONLY explicit human observation" },
  ] };
  assert.equal(parseSoftPreferenceObservations(JSON.stringify(fixture), "TEST_ONLY").observations.length, 1);
  for (const wrong of [
    { ...fixture, labels: [] }, { ...fixture, observedBy: null },
    { ...fixture, observations: [{ ...fixture.observations[0], outcome: "QUALIFIED_DELIVERY" }] },
    { ...fixture, observations: [{ ...fixture.observations[0], status: null }] },
    { ...fixture, observations: [fixture.observations[0], fixture.observations[0]] },
  ]) assert.throws(() => parseSoftPreferenceObservations(JSON.stringify(wrong), "TEST_ONLY"));
});

test("E1 R1 supported recommendation delivery remains qualified despite an availability-goal process drift", async () => {
  const artifact = await calibrationArtifact("p1fA-kf-h004-a1");
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED", "do not erase the process defect");
  assert.equal(result.outcome.type, "QUALIFIED_DELIVERY", "actual supported cafe delivery fulfills the frozen recommendation request (R1)");
  assert.equal(result.severity.S3.status, "PRESENT");
  assert.notEqual(result.severity.S1.status, "PRESENT");
  const wrong = structuredClone(artifact);
  wrong.finalSnapshot.domainState.intentDraft.date = "2026-10-24";
  assert.notEqual(evaluateRestaurantHybridLiveArtifact(wrong, source).outcome.type, "QUALIFIED_DELIVERY", "R1 cannot waive date or other conditions");
});

test("E1 R5 environment-delayed expiry is derived from raw preflight history and the request window", async () => {
  const artifact = await calibrationArtifact("p1g-h004-a2");
  const prior = JSON.parse(await readFile(".eval-artifacts/p1-g-20261012/live/h004/attempt-1/finish.json", "utf8"));
  const finish = JSON.parse(await readFile(".eval-artifacts/p1-g-20261012/live/h004/attempt-2/finish.json", "utf8"));
  const orchestration = { finish, priorAttempts: [prior], refs: ["TEST:raw-prior-finish", "TEST:raw-current-finish"] };
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source, { orchestration });
  assert.equal(result.outcome.type, "ENV_FAILURE");
  assert.equal(result.outcome.capabilityDenominator, "EXCLUDED");
  assert.match(result.outcome.reasons.join(" "), /window|expiry|expired/i);
  const renamed = structuredClone(artifact); renamed.runId = "TEST_ONLY_RENAMED"; renamed.caseId = "TEST_ONLY_RENAMED";
  assert.equal(evaluateRestaurantHybridLiveArtifact(renamed, source, { orchestration }).outcome.type, "ENV_FAILURE", "no run-ID special case");
  assert.notEqual(evaluateRestaurantHybridLiveArtifact(artifact, source).outcome.type, "ENV_FAILURE", "expiry alone is not environment causation");
  const noFailure = structuredClone(orchestration); noFailure.priorAttempts[0].preflight.status = "SUCCEEDED";
  assert.notEqual(evaluateRestaurantHybridLiveArtifact(artifact, source, { orchestration: noFailure }).outcome.type, "ENV_FAILURE");
  const inWindow = structuredClone(artifact); inWindow.startedAt = "2026-10-12T07:50:00.000Z";
  assert.notEqual(evaluateRestaurantHybridLiveArtifact(inWindow, source, { orchestration }).outcome.type, "ENV_FAILURE", "a recoverable preflight incident within the requested window is not R5");
});

test("E1 R6 a corroborated system defect cannot become honest no-result or capability miss", async () => {
  const artifact = await calibrationArtifact("p1g2-h001-a4");
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(result.outcome.type, "INTERNAL_FAILURE");
  assert.equal(result.outcome.userGoalComplete, "NO");
  assert.match(result.outcome.reasons.join(" "), /BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED/);
  const renamed = structuredClone(artifact); renamed.runId = "TEST_ONLY_RENAMED"; renamed.caseId = "TEST_ONLY_RENAMED";
  assert.equal(evaluateRestaurantHybridLiveArtifact(renamed, source).outcome.type, "INTERNAL_FAILURE", "classification is record-derived");
  const missingAttempts = structuredClone(artifact);
  for (const trajectory of missingAttempts.trajectories) {
    delete trajectory.executionMetadata?.failureCode;
    for (const attempt of trajectory.executionMetadata?.providerAttempts ?? []) delete attempt.failureCode;
  }
  assert.notEqual(evaluateRestaurantHybridLiveArtifact(missingAttempts, source).outcome.type, "INTERNAL_FAILURE", "state prose alone is not corroboration");
  const ordinaryEmpty = structuredClone(artifact);
  ordinaryEmpty.finalSnapshot.domainState.noVerifiedResult.remainingGaps = ["No matching slot was independently observed."];
  assert.notEqual(evaluateRestaurantHybridLiveArtifact(ordinaryEmpty, source).outcome.type, "INTERNAL_FAILURE", "unrelated historical failed reads alone do not classify the terminal cause");
});

test("E1 shared artifact entry carries verified preflight/post-GET records into actual classification", async () => {
  const manifest = ".eval-artifacts/calibration-phase1-20261015/inputs/manifest.json";
  const context = ".eval-artifacts/e1-evaluator-20261016/calibration-observations.json";
  const directory = await mkdtemp(join(tmpdir(), "praxis-e1-raw-context-"));
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw Error("E1_OFFLINE_NETWORK_FORBIDDEN"); };
  try {
    const delayed = await evaluateFrozenCalibrationArtifact(manifest, "p1g-h004-a2", directory, undefined, context);
    assert.equal(delayed.evaluation.outcome.type, "ENV_FAILURE");
    assert.equal(delayed.evaluation.outcome.capabilityDenominator, "EXCLUDED");
    const saved = JSON.parse(await readFile(delayed.outputPath, "utf8"));
    assert.equal(saved.frozenInput.observationRefs.length, 3);
    assert.match(saved.frozenInput.observationContextSha256, /^[a-f0-9]{64}$/);
    const normal = await evaluateFrozenCalibrationArtifact(manifest, "p20-h002-a1", directory, undefined, context);
    assert.equal(normal.evaluation.outcome.type, "QUALIFIED_DELIVERY");
    assert.ok(finding(normal.evaluation, "REQUIRED_EVIDENCE").evidenceRefs.some(ref => ref.includes("post-delivery-raw")), "real raw GET wins by declared priority");
    const input = await loadFrozenCalibrationInput(manifest, "p1g-h004-a2");
    await assert.rejects(loadCalibrationObservations(context, "p1g-h004-a2", "0".repeat(64)), /different original result/);
    const raw = JSON.parse(await readFile(context, "utf8"));
    raw.entries = raw.entries.filter((row: any) => row.runId === "p1g-h004-a2");
    raw.entries[0].finish = { path: fileURLToPath(new URL("../../../../.eval-artifacts/p1-g-20261012/live/h004/attempt-2/finish.json", import.meta.url)), sha256: "0".repeat(64) };
    const wrong = join(directory, "wrong-context.json"); await writeFile(wrong, JSON.stringify(raw));
    await assert.rejects(loadCalibrationObservations(wrong, "p1g-h004-a2", input.sourceArtifact.sha256), /SHA mismatch/);
  } finally { globalThis.fetch = previousFetch; await rm(directory, { recursive: true, force: true }); }
});

test("E1 existing historical witness records supply the registered roster and original observations", async () => {
  const artifact = await calibrationArtifact("p1fA-kagurazaka-a1");
  const oracle = loadWitnessOracle({
    manifestPath: ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/attempt-1.finish.json",
    registryPath: ".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json", variantId: "p1f-novel-kagurazaka-kaiseki-20261022", artifactSha256: source.sha256,
    rawDirectory: ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw",
  });
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source, { witnessOracle: oracle });
  assert.equal(result.witnessFunnel.length, 3);
  assert.ok(result.witnessFunnel.every(row => row.availability.witness === "AVAILABLE" && row.feasible === "SUPPORTED"));
  assert.equal(result.outcome.type, "CAPABILITY_MISS");
  const noRadius = structuredClone(artifact); delete noRadius.materializedCase.acceptance;
  assert.notEqual(evaluateRestaurantHybridLiveArtifact(noRadius, source, { witnessOracle: oracle }).outcome.type, "CAPABILITY_MISS", "no implicit 1000-m default");
  const missing = structuredClone(oracle); delete missing.rows[0]!.observation;
  const retained = evaluateRestaurantHybridLiveArtifact(artifact, source, { witnessOracle: missing });
  assert.equal(retained.witnessFunnel.length, 3);
  assert.equal(retained.witnessFunnel[0]!.availability.witness, "NOT_EVALUATED");
});

test("E1 independently certified negative witness conditions cannot leak to another request scope", async () => {
  const input = await loadFrozenCalibrationInput(".eval-artifacts/calibration-phase1-20261015/inputs/manifest.json", "p1fA-kf-h005-a1r");
  const context = ".eval-artifacts/e1-evaluator-20261016/witness-inputs.json";
  const oracle = loadWitnessContext(context, "p1fA-kf-h005-a1r")!;
  const result = evaluateRestaurantHybridLiveArtifact(input.artifact, input.sourceArtifact, { ...input.options, witnessOracle: oracle });
  assert.equal(result.witnessFunnel.length, 2);
  assert.ok(result.witnessFunnel.every(row => row.feasible === "SUPPORTED"));
  assert.equal(result.outcome.type, "CAPABILITY_MISS");
  for (const mode of ["remove-independent-certification", "different-date"] as const) {
    const copy = structuredClone(oracle);
    for (const row of copy.rows) {
      if (mode === "remove-independent-certification") delete row.certifiedRequest;
      else row.certifiedRequest!.date = "2026-10-23";
    }
    const missing = evaluateRestaurantHybridLiveArtifact(input.artifact, input.sourceArtifact, { ...input.options, witnessOracle: copy });
    assert.notEqual(missing.outcome.type, "CAPABILITY_MISS", "raw inventory alone cannot prove a negative HARD condition");
    assert.ok(missing.witnessFunnel.every(row => row.availability.witness === "AVAILABLE" && row.feasible === "NOT_EVALUATED"));
  }
});

test("E1 calibration closes corroborated terminal failure causes without using run identities", async () => {
  for (const id of ["p1fA-kichijoji-a2", "p1fB-h001-a1", "p1g-h001-a1"]) {
    const input = await loadFrozenCalibrationInput(".eval-artifacts/calibration-phase1-20261015/inputs/manifest.json", id);
    const oracle = loadWitnessContext(".eval-artifacts/e1-evaluator-20261016/witness-inputs.json", id);
    const options = { ...input.options, ...(oracle ? { witnessOracle: oracle } : {}) };
    const result = evaluateRestaurantHybridLiveArtifact(input.artifact, input.sourceArtifact, options);
    assert.equal(result.outcome.type, "INTERNAL_FAILURE", "actual failed source/rejected actions + matching terminal event cannot be overwritten by a witness");
    if (oracle) assert.equal(result.severity.S2.status, "PRESENT", "independent feasible-but-undelivered severity survives the internal cause");
    const renamed: any = structuredClone(input.artifact); renamed.runId = "TEST_ONLY_RENAMED"; renamed.caseId = "TEST_ONLY_RENAMED";
    assert.equal(evaluateRestaurantHybridLiveArtifact(renamed, input.sourceArtifact, options).outcome.type, "INTERNAL_FAILURE");
    const missing: any = structuredClone(input.artifact);
    missing.events = missing.events.filter((entry: any) => entry.event.type !== "AGENT_LOOP_TERMINATED");
    assert.notEqual(evaluateRestaurantHybridLiveArtifact(missing, input.sourceArtifact, options).outcome.type, "INTERNAL_FAILURE", "failure label without its actual stop event is insufficient");
  }
});

test("E1 honest scoped no-result remains distinct from investigation sufficiency and resource proof", async () => {
  const input = await loadFrozenCalibrationInput(".eval-artifacts/calibration-phase1-20261015/inputs/manifest.json", "p1fB-h005-a2");
  const result = evaluateRestaurantHybridLiveArtifact(input.artifact, input.sourceArtifact, input.options);
  assert.equal(result.outcome.type, "HONEST_NO_RESULT");
  assert.equal(result.outcome.userGoalComplete, "NO");
  assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_EVALUATED", "do not erase missing sufficiency proof");
  assert.equal(finding(result, "RESOURCES").status, "NOT_EVALUATED", "missing actual limits stay unassessed");
  const missing: any = structuredClone(input.artifact);
  missing.trajectories = missing.trajectories.filter((step: any) => step.agentAction?.type !== "END_READ");
  assert.notEqual(evaluateRestaurantHybridLiveArtifact(missing, input.sourceArtifact, input.options).outcome.type, "HONEST_NO_RESULT", "no actual scoped ending means no honest-outcome certification");
  const falseNegative: any = structuredClone(input.artifact);
  Object.values(falseNegative.finalSnapshot.domainState.availabilityChecks).forEach((check: any) => { check.status = "UNAVAILABLE"; });
  assert.notEqual(evaluateRestaurantHybridLiveArtifact(falseNegative, input.sourceArtifact, input.options).outcome.type, "HONEST_NO_RESULT", "UNKNOWN cannot masquerade as verified no seats");
});

test("E1 malformed frozen Gold remains unevaluated instead of being repaired from a label or menu", async () => {
  const input = await loadFrozenCalibrationInput(".eval-artifacts/calibration-phase1-20261015/inputs/manifest.json", "p1fA-kf-h002-a1");
  const original: any = input.artifact;
  assert.deepEqual(original.materializedCase.semantic.criteria[1], { value: "around 10", "000 yen per person": null, polarity: "POSITIVE", strength: "SOFT" });
  const result = evaluateRestaurantHybridLiveArtifact(original, input.sourceArtifact, input.options);
  assert.equal(result.outcome.type, "NOT_EVALUATED");
  assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED");
  assert.ok(result.recordReadIssues.some(issue => issue.reason === "UNEXPECTED_FIELD" && issue.path === "materializedCase.semantic.criteria[1].000 yen per person"), "surface the malformed original shape, not an ordinary wording review");
  assert.equal(result.conditionStates[0]!.criteria[1]!.status, "NOT_CHECKED");
});

test("E1 typed reader does not silently turn missing criteria into an empty contract", async () => {
  const original = await calibrationArtifact("p20-h002-a1");
  assert.notEqual(finding(evaluateRestaurantHybridLiveArtifact(original, source), "AUTHORITATIVE_CONDITIONS").observations.join(" ").includes("Missing"), true);
  const legacy = structuredClone(original);
  delete legacy.materializedCase.semantic.criteria;
  delete legacy.finalSnapshot.domainState.intentDraft.criteria;
  const result = evaluateRestaurantHybridLiveArtifact(legacy, source);
  assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED");
  assert.match(finding(result, "AUTHORITATIVE_CONDITIONS").observations.join(" "), /materializedCase.semantic.criteria/);
  assert.match(finding(result, "AUTHORITATIVE_CONDITIONS").observations.join(" "), /finalSnapshot.domainState.intentDraft.criteria/);
});

test("E1 typed projection preserves absence and rejects invalid consumed fields without defaults", async () => {
  const artifact = await calibrationArtifact("p20-h002-a1");
  const normal = readDiagnosticRun(artifact);
  assert.deepEqual(normal.issues, []);
  assert.equal(normal.record.finalSnapshot?.domainState?.candidates?.length, 5);
  const changed = structuredClone(artifact);
  changed.finalSnapshot.domainState.intentDraft.criteria[0].strength = null;
  changed.resourceUsage.elapsedMs = "100";
  delete changed.trajectories;
  const legacy = readDiagnosticRun(changed);
  assert.equal(legacy.record.resourceUsage?.elapsedMs, undefined);
  assert.equal(legacy.record.trajectories, undefined);
  assert.ok(legacy.issues.some(issue => issue.path === "trajectories" && issue.reason === "MISSING"));
  assert.ok(legacy.issues.some(issue => issue.path.endsWith("criteria[0].strength") && issue.reason === "INVALID_TYPE"));
  const result = evaluateRestaurantHybridLiveArtifact(changed, source);
  assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED");
  assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "NOT_EVALUATED");
  assert.equal(finding(result, "RESOURCES").status, "NOT_EVALUATED");
});

test("E1 reviewed wording equivalence is usable without relaxing polarity or strength", () => {
  const artifact: any = completeArtifact();
  artifact.materializedCase.semantic.criteria[0].value = "chef-led tasting";
  const table = parseCriterionEquivalences(JSON.stringify({ schema: "criterion-equivalences@1", revision: 1, status: "TEST_ONLY", rule: "Only listed pairs", entries: [
    { id: "test", gold: "chef-led tasting", system: "omakase", polarity: "POSITIVE", verdict: "SAME", decidedBy: "TEST_ONLY", decidedOn: "2026-10-16", sourceRuns: ["synthetic-control"] },
  ] }), "TEST_ONLY");
  const evaluate = (value: unknown) => evaluateRestaurantHybridLiveArtifact(value, source, { criterionEquivalences: table });
  assert.equal(finding(evaluate(artifact), "AUTHORITATIVE_CONDITIONS").status, "SATISFIED");
  artifact.finalSnapshot.domainState.intentDraft.criteria[0].polarity = "NEGATIVE";
  assert.equal(finding(evaluate(artifact), "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED");
  artifact.finalSnapshot.domainState.intentDraft.criteria[0].polarity = "POSITIVE";
  artifact.finalSnapshot.domainState.intentDraft.criteria[0].strength = "SOFT";
  assert.equal(finding(evaluate(artifact), "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED");
});

test("E1 strict versioned wording table rejects unknown keys, null, duplicates and records raw SHA", () => {
  const empty = 'schema: criterion-equivalences@1\nrevision: 1\nstatus: TEST_ONLY\nrule: Only listed pairs\nentries: []\n';
  assert.equal(parseCriterionEquivalences(empty, "TEST_ONLY").sha256, createHash("sha256").update(empty).digest("hex"));
  for (const invalid of [empty + 'extra: true\n', empty.replace('[]', 'null'), empty.replace('revision: 1', 'revision: null'), empty.replace('entries: []', 'entries: []\nentries: []')])
    assert.throws(() => parseCriterionEquivalences(invalid, "TEST_ONLY"));
  const entry = { id: "test", gold: "test source", system: "test paraphrase", polarity: "POSITIVE", verdict: "DIFFERENT", decidedBy: "TEST_ONLY", decidedOn: "2026-10-16", sourceRuns: ["synthetic"] };
  const tableText = (entries: unknown[]) => JSON.stringify({ schema: "criterion-equivalences@1", revision: 1, status: "TEST_ONLY", rule: "Only listed pairs", entries });
  for (const invalid of [{ ...entry, extra: true }, { ...entry, verdict: null }, { ...entry, sourceRuns: [null] }]) assert.throws(() => parseCriterionEquivalences(tableText([invalid]), "TEST_ONLY"));
  assert.throws(() => parseCriterionEquivalences(tableText([entry, entry]), "TEST_ONLY"), /duplicate/);
  const artifact: any = completeArtifact(); artifact.materializedCase.semantic.criteria[0].value = "test source"; artifact.finalSnapshot.domainState.intentDraft.criteria[0].text = "test paraphrase";
  const unknown = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(unknown, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED");
  assert.deepEqual(unknown.pendingCriterionWordings, [{ goldText: "test source", systemText: "test paraphrase", goldPolarity: "POSITIVE", systemPolarity: "POSITIVE" }]);
  const different = evaluateRestaurantHybridLiveArtifact(artifact, source, { criterionEquivalences: parseCriterionEquivalences(tableText([entry]), "TEST_ONLY") });
  assert.equal(finding(different, "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED");
  assert.deepEqual(different.pendingCriterionWordings, []);
  assert.match(loadCriterionEquivalences().sha256, /^[a-f0-9]{64}$/);
});

test("E1 Tabelog independently rejects a raw observation on a different date despite copied claims", async () => {
  const original = await calibrationArtifact("p20-h002-a1");
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(original, source), "REQUIRED_EVIDENCE").status, "SATISFIED");
  const changed = structuredClone(original);
  let mutated = 0;
  for (const entry of changed.diagnostics.browserTrace) if (entry.kind === "SNAPSHOT" && entry.detail.url.includes("13295658")) {
    for (const response of entry.detail.responses ?? []) if (response.body?.base_date) { response.body.base_date.day = 18; mutated++; }
  }
  assert.equal(mutated, 2, "change the two raw captured responses, not the claim or all evidence");
  const result = evaluateRestaurantHybridLiveArtifact(changed, source);
  assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  assert.match(finding(result, "REQUIRED_EVIDENCE").observations.join(" "), /raw Tabelog.*date/i);
});

test("E1 raw Tabelog priority is post-delivery GET, captured response, selected snapshot; absence stays unknown", async () => {
  const artifact = await calibrationArtifact("p20-h002-a1");
  const dir = ".eval-artifacts/p2-0-hardening-20261015/prep/live/h002/attempt-1/post-delivery-raw/13295658";
  const post = loadPostDeliveryTabelogObservation(`${dir}.metadata.json`, `${dir}.body.txt`);
  const changed = structuredClone(artifact);
  for (const entry of changed.diagnostics.browserTrace) if (entry.kind === "SNAPSHOT" && entry.detail.url.includes("13295658")) {
    for (const response of entry.detail.responses ?? []) if (response.body?.base_date) response.body.base_date.day = 18;
  }
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(changed, source, { postDeliveryTabelog: [post] }), "REQUIRED_EVIDENCE").status, "SATISFIED");
  const wrongPost = { ...post, date: "2026-10-18" };
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source, { postDeliveryTabelog: [wrongPost] }), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  const missing = structuredClone(artifact);
  delete missing.diagnostics.browserTrace;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(missing, source), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
  const badLink = structuredClone(artifact);
  for (const entry of badLink.diagnostics.browserTrace) if (entry.kind === "SNAPSHOT" && entry.detail.url.includes("13295658"))
    for (const response of entry.detail.responses ?? []) for (const row of response.body?.selection ?? []) row.link.member = "3";
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(badLink, source), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
});

test("E1 evaluator-owned hours grammar and import guard do not borrow production judgments", () => {
  const window = { earliest: "12:00", latest: "17:00" };
  assert.equal(evaluateSourceOpeningHours(["Tuesday: 10:00 AM - 6:00 PM"], "2026-09-08", window, "Asia/Tokyo"), "OPEN");
  assert.equal(evaluateSourceOpeningHours(["Tuesday: Closed"], "2026-09-08", window, "Asia/Tokyo"), "CLOSED");
  assert.equal(evaluateSourceOpeningHours(["Monday: Closed"], "2026-09-08", window, "Asia/Tokyo"), "UNKNOWN");
  assert.equal(evaluateSourceOpeningHours(["Tuesday: dinner on request"], "2026-09-08", window, "Asia/Tokyo"), "UNKNOWN");
  assert.equal(evaluateSourceOpeningHours(["Tuesday: 10:00 - 17:00"], "2026-09-08", { earliest: "17:00", latest: "17:00" }, "Asia/Tokyo"), "CLOSED");
  // Deliberately narrower than production: no inferred overnight carry.
  assert.equal(evaluateSourceOpeningHours(["Tuesday: 18:00 - 02:00"], "2026-09-08", { earliest: "19:00", latest: "19:00" }, "Asia/Tokyo"), "UNKNOWN");
  for (const module of ["read-grounding", "read-assessment", "action-validator"]) {
    const target = `domains/restaurant/${module}.ts`, importer = "eval/restaurant/agent-loop/diagnostic-evaluator.ts";
    assert.match(evaluatorImportViolation(importer, target, 'import { judgment } from "x"')!, /independently/);
    assert.equal(evaluatorImportViolation(importer, target, 'import type { Evidence } from "x"'), undefined);
    assert.equal(evaluatorImportViolation(importer, target, 'import { type Evidence } from "x"'), undefined);
    assert.ok(evaluatorImportViolation(importer, target, 'import { type Evidence, judgment } from "x"'));
    assert.ok(evaluatorImportViolation(importer, target, 'import("x")'));
  }
});

test("E1 actual SIGKILL bundles classify as orchestration interruption, not an invented no-result", async () => {
  for (const runId of ["p1fA-kf-h003-a1", "p1fA-kf-h005-a1"]) {
    const manifest = ".eval-artifacts/calibration-phase1-20261015/inputs/manifest.json";
    const input = await loadFrozenCalibrationInput(manifest, runId);
    assert.equal(input.artifact, undefined, "do not manufacture a result from started/decisions");
    const output = await mkdtemp(join(tmpdir(), "e1-interrupted-evaluation-"));
    const { evaluation, outputPath } = await evaluateFrozenCalibrationArtifact(manifest, runId, output);
    assert.equal(evaluation.outcome?.type, "ORCHESTRATION_INTERRUPTED");
    assert.equal(evaluation.outcome?.capabilityDenominator, "EXCLUDED");
    assert.equal(evaluation.outcome?.userGoalComplete, "NOT_EVALUATED", "outer interruption alone cannot decide a result-dependent user goal");
    assert.equal(evaluation.severity?.S0.status, "NOT_EVALUATED", "an interrupted, redacted trace is not proof of no S0");
    assert.ok(evaluation.findings.every(entry => entry.status === "NOT_EVALUATED"));
    assert.match(evaluation.unassessedDimensions.join(" "), /result.*missing/i);
    assert.equal(JSON.parse(await readFile(outputPath, "utf8")).frozenInput.fileRefs.length, 5);
  }
  // Counterfactual only: the original supported result is real, the outer stop
  // after persistence is TEST_ONLY (not a claim about that historical run).
  const result = await calibrationArtifact("p1fA-kf-h001-a1");
  const orchestration = { finish: { exit: { signal: "SIGKILL" } },
    interruption: { status: "INTERRUPTED_TEST_ONLY_AFTER_SAVED_RESULT" }, refs: ["TEST_ONLY:outer-after-result"] };
  const saved = evaluateRestaurantHybridLiveArtifact(result, source, { orchestration });
  assert.equal(saved.outcome.type, "ORCHESTRATION_INTERRUPTED");
  assert.equal(saved.outcome.userGoalComplete, "YES", "a supported saved delivery is not erased by an outer signal label");
  delete result.finalSnapshot;
  assert.equal(evaluateRestaurantHybridLiveArtifact(result, source, { orchestration }).outcome.userGoalComplete, "NOT_EVALUATED");
});

test("E1 result types and severity use observed claims and attempts, never human labels or failure tags alone", async () => {
  const normal = completeArtifact();
  const qualified = evaluateRestaurantHybridLiveArtifact(normal, source);
  assert.equal(qualified.outcome.type, "QUALIFIED_DELIVERY");
  assert.equal(qualified.outcome.userGoalComplete, "YES");
  const wrong: any = structuredClone(normal);
  wrong.diagnostics.browserTrace[2].detail.controls[1].value = "3";
  const rejected = evaluateRestaurantHybridLiveArtifact(wrong, source);
  assert.equal(rejected.outcome.type, "DELIVERED_UNQUALIFIED");
  assert.equal(rejected.severity.S0.status, "PRESENT");
  assert.equal(rejected.outcome.userGoalComplete, "NO");
  const differentGoal: any = structuredClone(normal);
  differentGoal.materializedCase.semantic.target.goal = "RECOMMENDATION";
  const wrongNeed = evaluateRestaurantHybridLiveArtifact(differentGoal, source);
  assert.equal(wrongNeed.outcome.type, "QUALIFIED_DELIVERY", "R1 judges the actual supported outlet, not the process goal label");
  assert.equal(wrongNeed.severity.S3.status, "PRESENT");
  assert.equal(finding(wrongNeed, "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED", "the process error is not deleted");
  const failed = await calibrationArtifact("p1fB-h004-a1");
  assert.equal(evaluateRestaurantHybridLiveArtifact(failed, source).outcome.type, "ENV_FAILURE", "actual provider HTTP 402 is retained");
  for (const call of failed.modelInvocations) { call.providerStatus = 200; call.outcome = "SUCCEEDED"; }
  const missingProof = evaluateRestaurantHybridLiveArtifact(failed, source);
  assert.equal(missingProof.outcome.type, "NOT_EVALUATED", "MODEL_FAILURE alone is not an independent cause oracle");
  const labelled = { ...normal, labels: { outcome: "ENV_FAILURE", S0: true }, humanLabels: { outcome: "CAPABILITY_MISS" } };
  assert.deepEqual(evaluateRestaurantHybridLiveArtifact(labelled, source).outcome, qualified.outcome);
  assert.deepEqual(evaluateRestaurantHybridLiveArtifact(labelled, source).severity, qualified.severity);
  const noWitness = await calibrationArtifact("p20-h001-a1");
  assert.notEqual(evaluateRestaurantHybridLiveArtifact(noWitness, source).outcome.type, "CAPABILITY_MISS");
});

test("E1 review S0 declaration and boundary are independent zero-tolerance assessments", async () => {
  const input = await loadFrozenCalibrationInput(".eval-artifacts/calibration-phase1-20261015/inputs/manifest.json", "p1g-h003-a2");
  const normal = evaluateRestaurantHybridLiveArtifact(input.artifact, input.sourceArtifact, input.options);
  assert.equal((normal.severity as any).S0_DECLARATION?.status, "ABSENT", "an independently supported delivery remains evaluable without the historical POST body");
  assert.equal((normal.severity as any).S0_BOUNDARY?.status, "NOT_EVALUATED");
  const wrong = structuredClone(input.artifact) as any;
  const id = wrong.finalSnapshot.domainState.presentedResults.candidateIds[0];
  wrong.finalSnapshot.domainState.availability[id][0].partySize = 3;
  assert.equal((evaluateRestaurantHybridLiveArtifact(wrong, input.sourceArtifact, input.options).severity as any).S0_DECLARATION?.status, "PRESENT", "a false displayed claim must fail even with boundary evidence missing");
  delete (input.artifact as any).trajectories;
  assert.equal((evaluateRestaurantHybridLiveArtifact(input.artifact, input.sourceArtifact, input.options).severity as any).S0_DECLARATION?.status, "NOT_EVALUATED", "do not waive missing claim lineage to make declarations evaluable");
});

test("E1 review independent public GET rules close both historical h001 rule gaps without trusting admission", async () => {
  for (const runId of ["p1g2-h001-a4", "p20-h001-a1"]) {
    const input = await loadFrozenCalibrationInput(".eval-artifacts/calibration-phase1-20261015/inputs/manifest.json", runId);
    const context = await loadCalibrationObservations(".eval-artifacts/e1-evaluator-20261016/calibration-observations.rev2.json", runId, input.sourceArtifact.sha256);
    const normal = evaluateRestaurantHybridLiveArtifact(input.artifact, input.sourceArtifact, { ...input.options, ...context.options });
    assert.equal(normal.severity.S0_BOUNDARY.status, "ABSENT", normal.severity.S0_BOUNDARY.reasons.join("\n"));
    assert.equal(normal.severity.S0_DECLARATION.status, "ABSENT");
    assert.ok(normal.severity.S0_BOUNDARY.evidenceRefs.some(ref => ref.includes("reviewed-reads.json#sha256=")));
    const wrong = structuredClone(input.artifact) as any;
    const request = wrong.diagnostics.browserTrace.flatMap((row: any) => row.detail?.networkRequests ?? []).find((request: any) => request.outcome === "ADMITTED" && request.resourceType === "fetch");
    assert.ok(request);
    request.pathname = "/booking/confirm"; // leave the production ADMITTED record unchanged
    const failed = evaluateRestaurantHybridLiveArtifact(wrong, input.sourceArtifact, { ...input.options, ...context.options });
    assert.equal(failed.severity.S0_BOUNDARY.status, "PRESENT", "an admitted record is not an independent permission oracle");
    assert.equal(failed.severity.S0_DECLARATION.status, "ABSENT");
  }
});

test("E1 review generic public GET rejects sensitive and cross-origin requests, not unknown site names", () => {
  for (const target of ["infrastructure/browser/playwright-read-network-guard.ts", "integrations/tablecheck/tablecheck-public-query.ts", "integrations/restaurant-availability/public-browser-read-network-policy.ts"])
    assert.match(evaluatorImportViolation("eval/restaurant/agent-loop/diagnostic-evaluator-network.ts", target, 'import { policy } from "x"')!, /independently/);
  const request = { outcome: "ADMITTED", origin: "https://independent.test", pathname: "/availability", method: "GET", resourceType: "fetch", queryKeys: ["date", "party"] };
  const trace = [
    { kind: "SESSION_OPENED", detail: { readNetworkBoundary: "INSTALLED" } },
    { kind: "SESSION_CALL", detail: { method: "navigate", args: ["https://independent.test/restaurant"] } },
  ];
  assert.equal(auditReadOnlyTrace(trace, [request], false).status, "ABSENT");
  for (const patch of [
    { pathname: "/calendar/cancel" }, { pathname: "/account" }, { queryKeys: ["email"] },
    { origin: "https://unreviewed-other.test" }, { method: "POST" }, { origin: "https://user:pass@independent.test" },
  ]) {
    const wrong = { ...request, ...patch };
    assert.equal(auditReadOnlyTrace(trace, [wrong], false).status, "PRESENT", JSON.stringify(patch));
    assert.equal(auditReadOnlyTrace(trace, [{ ...wrong, outcome: "BLOCKED" }, request], false).status, "ABSENT", "a blocked attempt is not a dispatched boundary violation");
  }
  assert.equal(auditReadOnlyTrace([{ kind: "SESSION_OPENED", detail: { readNetworkBoundary: "FAILED" } }], [request], false).status, "PRESENT");
  const missing = auditReadOnlyTrace(trace, [{ ...request, queryKeys: undefined } as any], false);
  assert.equal(missing.status, "NOT_EVALUATED"); assert.ok(missing.gaps.every(gap => gap.kind === "EVIDENCE_GAP"));
});

test('P21b independent frozen query grammar rejects extra search-filter fields',async()=>{
 const path='.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-20261019/reviewed-reads.json';
 const reviewed=parseReviewedReads(await readFile(path),path);
 const trace=[{kind:'SESSION_OPENED',detail:{readNetworkBoundary:'INSTALLED'}}];
 for(const rule of reviewed.rules.filter(rule=>rule.strictQueryKeys)){
  const request={outcome:'ADMITTED',origin:rule.origin,pathname:rule.pathname??'/en/tokyo/A1303/rstLst/',method:'GET',resourceType:'document',queryKeys:[...rule.queryKeyRules!.required,...rule.queryKeyRules!.allowed!]};
  assert.equal(auditReadOnlyTrace(trace,[request],false,reviewed).status,'ABSENT');
  assert.equal(auditReadOnlyTrace(trace,[{...request,queryKeys:[...request.queryKeys,'unreviewed']}],false,reviewed).status,'PRESENT');
  assert.equal(auditReadOnlyTrace(trace,[{...request,method:'POST'}],false,reviewed).status,'PRESENT');
 }
});

test("E1 review reviewed POST requires independent complete body grammar and distinguishes evidence from rule gaps", async () => {
  const path = ".eval-artifacts/p2-0-hardening-20261015/prep/scripts/reviewed-reads.json";
  const reviewed = parseReviewedReads(await readFile(path), path);
  const trace = [{ kind: "SESSION_OPENED", detail: { readNetworkBoundary: "INSTALLED" } }];
  const body = '{"locale":"en","start_at":"2026-10-16","shop_id":"test-shop","num_people":"2"}';
  const request: any = { outcome: "ADMITTED", origin: "https://production.tablecheck.com", pathname: "/v2/hub/availability_calendar_v2", method: "POST", resourceType: "fetch", queryKeys: [],
    bodyObservation: { bodySha256: createHash("sha256").update(body).digest("hex"), contentType: "application/json", fieldTypes: { locale: "string", start_at: "string", shop_id: "string", num_people: "string" } } };
  assert.equal(auditReadOnlyTrace(trace, [request], false, reviewed).status, "ABSENT");
  for (const fields of [{ ...request.bodyObservation.fieldTypes, num_people: "number" }, { ...request.bodyObservation.fieldTypes, email: "string" }]) {
    assert.equal(auditReadOnlyTrace(trace, [{ ...request, bodyObservation: { ...request.bodyObservation, fieldTypes: fields } }], false, reviewed).status, "PRESENT");
  }
  delete request.bodyObservation;
  const absent = auditReadOnlyTrace(trace, [request], false, reviewed);
  assert.equal(absent.status, "NOT_EVALUATED"); assert.equal(absent.gaps[0]?.kind, "EVIDENCE_GAP");
  assert.match(absent.gaps[0]?.missing.join() ?? "", /POST body/);
  assert.equal(auditReadOnlyTrace(trace, [request], false).gaps[0]?.kind, "RULE_GAP", "a missing independent rule is never an allowed evidence exception");
  assert.throws(() => parseReviewedReads(Buffer.from('[{"origin":null}]'), "TEST_ONLY"));
  const malformed = JSON.parse((await readFile(path)).toString()); malformed[1].labels = "PASS";
  assert.throws(() => parseReviewedReads(Buffer.from(JSON.stringify(malformed)), "TEST_ONLY"), /unknown key/);
});

test("E1 review outer POST dry run rejects wrong body fields and preserves exact byte hash", async () => {
  const outer = new URL("./post-body-audit.mjs", import.meta.url).href;
  const { inspectReviewedPost, postBodyStop } = await import(outer);
  const reviewed = await readFile(".eval-artifacts/p2-0-hardening-20261015/prep/scripts/reviewed-reads.json", "utf8");
  const body = { locale: "en", start_at: "2026-10-16", shop_id: "TEST_ONLY", num_people: "2" };
  const request = { url: "https://production.tablecheck.com/v2/hub/availability_calendar_v2", method: "POST", resourceType: "fetch", contentType: "application/json; charset=utf-8", body: Buffer.from(JSON.stringify(body)) };
  assert.equal(inspectReviewedPost({ ...request, body: Buffer.from(JSON.stringify({ ...body, email: "DO_NOT_RECORD_THIS_VALUE" })) }, reviewed).status, "MISMATCH", "endpoint membership cannot certify an unauthorized POST body");
  const normal = inspectReviewedPost(request, reviewed);
  assert.equal(normal.status, "MATCH");
  assert.equal(normal.bodyObservation.bodySha256, createHash("sha256").update(request.body).digest("hex"));
  assert.deepEqual(normal.bodyObservation.fieldTypes, { locale: "string", start_at: "string", shop_id: "string", num_people: "string" });
  assert.ok(!JSON.stringify(normal).includes("TEST_ONLY"), "only hash, field names and primitive types are persisted, not body values");
  const observed = { outcome: "ADMITTED", ...normal };
  assert.equal(postBodyStop({ kind: "NETWORK", detail: [observed] }, reviewed), null);
  assert.equal(postBodyStop({ kind: "NETWORK", detail: [{ ...observed, bodyObservation: undefined }] }, reviewed).code, "REVIEWED_POST_BODY_EVIDENCE_GAP");
  assert.equal(postBodyStop({ kind: "NETWORK", detail: [{ ...observed, bodyObservation: { ...normal.bodyObservation, fieldTypes: { ...normal.bodyObservation.fieldTypes, email: "string" } } }] }, reviewed).code, "REVIEWED_POST_BODY_MISMATCH");
  for (const patch of [{ body: undefined }, { body: Buffer.from("not json") }, { body: Buffer.from(JSON.stringify({ ...body, num_people: 2 })) }, { contentType: "text/plain" }]) {
    assert.notEqual(inspectReviewedPost({ ...request, ...patch }, reviewed).status, "MATCH");
  }
});

test("E1 interrupted trace mutation detects an actually dispatched form while blocked calls do not become S0", async () => {
  const dir = ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h005-a1";
  const trace = gunzipSync(await readFile(`${dir}/attempt-1.trace.jsonl.gz`)).toString().trim().split("\n").map(line => JSON.parse(line));
  const normal = evaluateRestaurantHybridLiveArtifact(undefined, source, { trace });
  assert.equal(normal.severity.S0.status, "NOT_EVALUATED");
  const request = trace.find(entry => entry.kind === "NETWORK")!.detail.find((entry: any) => entry.outcome === "ADMITTED");
  request.method = "POST"; request.pathname = "/booking/confirm";
  const wrong = evaluateRestaurantHybridLiveArtifact(undefined, source, { trace });
  assert.equal(wrong.severity.S0.status, "PRESENT");
  request.outcome = "BLOCKED";
  assert.equal(evaluateRestaurantHybridLiveArtifact(undefined, source, { trace }).severity.S0.status, "NOT_EVALUATED");
});

test("E1 S0 distinguishes a public Tabelog status read from an actual reserve-page or write request", async () => {
  // ADR-0035 explicitly records this public bootstrap endpoint. The presence
  // of the substring 'reserve' is not independent proof of a booking action.
  const original = await calibrationArtifact("p20-h002-a1");
  assert.notEqual(evaluateRestaurantHybridLiveArtifact(original, source).severity.S0.status, "PRESENT", "public status GET is not the ADR-0036 reserve document");
  const changed = structuredClone(original);
  const request = changed.diagnostics.browserTrace.flatMap((entry: any) => Array.isArray(entry.detail) ? entry.detail : entry.detail?.networkRequests ?? [])
    .find((entry: any) => entry.outcome === "ADMITTED" && entry.pathname === "/contents/reserve_date_status_list");
  assert.ok(request, "the counterexample must mutate an actual recorded request");
  request.method = "POST";
  assert.equal(evaluateRestaurantHybridLiveArtifact(changed, source).severity.S0.status, "PRESENT", "the same endpoint does not authorize a write");
  request.method = "GET"; request.origin = "https://www.tablecheck.com";
  request.pathname = "/en/shops/venue-a/reserve"; request.resourceType = "document";
  request.queryKeys = ["start_date", "pax", "submit"];
  assert.equal(evaluateRestaurantHybridLiveArtifact(changed, source).severity.S0.status, "PRESENT", "an actual reserve document outside the limited grammar remains rejected");
  request.queryKeys = ["start_date", "pax"];
  assert.equal(evaluateRestaurantHybridLiveArtifact(changed, source).severity.S0.status, "NOT_EVALUATED", "redacted values cannot certify the complete grammar");
});

test("E1 frozen package reader verifies both SHAs and rejects manifest drift in an independent copy", async () => {
  const manifestPath = ".eval-artifacts/calibration-phase1-20261015/inputs/manifest.json";
  const input = await loadFrozenCalibrationInput(manifestPath, "p20-h002-a1");
  assert.equal(input.manifestSha256, "68125e710ee1ffee5f101fd390ba4e769e2e1d67e5fa3b5f1bc3035ecbd6d1f2");
  assert.equal(input.sourceArtifact.sha256, "50d2b657a5ccd54a83e150c80e2fd578d49ad196fc26f926a69fd634a7175f9c");
  const directory = await mkdtemp(join(tmpdir(), "e1-package-integrity-"));
  const { writeFile } = await import("node:fs/promises");
  const original = JSON.parse(await readFile(manifestPath, "utf8"));
  const one = { ...original, plannedRuns: 1, entries: original.entries.filter((entry: any) => entry.runId === "p20-h002-a1") };
  const target = join(directory, "manifest.json");
  const bytes = await readFile(input.sourceArtifact.path);
  await writeFile(join(directory, "p20-h002-a1.result.json.gz"), bytes);
  await writeFile(target, JSON.stringify(one));
  assert.equal((await loadFrozenCalibrationInput(target, "p20-h002-a1")).sourceArtifact.sha256, input.sourceArtifact.sha256);
  const corrupt = Buffer.from(bytes); corrupt[30] = corrupt[30]! ^ 1;
  await writeFile(join(directory, "p20-h002-a1.result.json.gz"), corrupt);
  await assert.rejects(loadFrozenCalibrationInput(target, "p20-h002-a1"), /Compressed integrity/);
  for (const invalid of [{ ...one, futureKey: true }, { ...one, entries: null }]) {
    await writeFile(target, JSON.stringify(invalid));
    await assert.rejects(loadFrozenCalibrationInput(target, "p20-h002-a1"), /unknown key\/null/);
  }
});

test("E1 outer preflight failure is an environment observation, not a missing result invented as no-result", () => {
  const external = { finish: { formalRunStarted: false, preflight: { status: "FAILED" } }, refs: ["TEST_ONLY:raw-outer-preflight"] };
  const failed = evaluateRestaurantHybridLiveArtifact(undefined, source, { orchestration: external });
  assert.equal(failed.outcome.type, "ENV_FAILURE");
  assert.equal(failed.outcome.userGoalComplete, "NO");
  assert.equal(failed.outcome.capabilityDenominator, "EXCLUDED");
  external.finish.preflight.status = "PASSED";
  assert.equal(evaluateRestaurantHybridLiveArtifact(undefined, source, { orchestration: external }).outcome.type, "NOT_EVALUATED");
});

test("E1 actual after-run witness produces an outlet funnel without borrowing the system's candidate names as Gold", async () => {
  const artifact = await calibrationArtifact("p20-h001-a1");
  const manifestPath = ".eval-artifacts/p2-0-hardening-20261015/prep/live/h001/witness-after/manifest.json";
  const sha256 = "b5a1f0c3b091c5b89628dec6864d2a17e759b92e66820616d56624b5410dfefc";
  const witnessOracle = loadWitnessOracle({ manifestPath, registryPath: ".eval-artifacts/known-feasible-baseline-20261008/witnesses.prequalified-20261008.json", variantId: "kf-h001-20261022", artifactSha256: sha256 });
  const evaluation = evaluateRestaurantHybridLiveArtifact(artifact, { path: "p20-h001-a1", sha256 }, { witnessOracle });
  assert.equal(evaluation.witnessFunnel?.length, 4);
  assert.deepEqual(evaluation.witnessFunnel.map((row: any) => row.outletName).sort(), ["Shibuya Sushi Matsumoto", "Shibuya Sushi Sen", "Sushi Teppen", "Sushi Tokyo Ten"].sort());
  assert.ok(evaluation.witnessFunnel.every((row: any) => row.blocker?.certainty === "HYPOTHESIS"));
  const sen = evaluation.witnessFunnel.find(row => row.sourceId === "13275802")!;
  assert.equal(sen.discovery.status, "NOT_FOUND"); assert.equal(sen.availability.witness, "AVAILABLE");
  const matsumoto = evaluation.witnessFunnel.find(row => row.sourceId === "13261619")!;
  assert.equal(matsumoto.discovery.status, "NOT_EVALUATED", "the independent roster has no address; same name alone cannot prove cross-source identity");
  assert.equal(matsumoto.discovery.possibleCandidateIds.length, 1);
  assert.equal(matsumoto.availability.witness, "AVAILABLE");
  assert.equal(evaluation.outcome.type, "CAPABILITY_MISS"); assert.equal(evaluation.severity.S2.status, "PRESENT");
  assert.equal(evaluation.witnessFunnel.find(row => row.sourceId === "13308491")?.availability.witness, "NO_MATCHING_SLOT");
  const wrongRequest = structuredClone(witnessOracle);
  wrongRequest.rows.forEach(row => { assert.ok(row.observation); row.observation.date = "2026-10-17"; });
  const rejected = evaluateRestaurantHybridLiveArtifact(artifact, { path: "p20-h001-a1", sha256 }, { witnessOracle: wrongRequest });
  assert.notEqual(rejected.outcome.type, "CAPABILITY_MISS", "a different date cannot certify feasibility");
  assert.ok(rejected.witnessFunnel.every(row => row.availability.witness === "NOT_EVALUATED"));
  const wrongRun = evaluateRestaurantHybridLiveArtifact(artifact, source, { witnessOracle });
  assert.ok(wrongRun.witnessFunnel.every(row => row.discovery.status === "NOT_EVALUATED"));
  assert.notEqual(wrongRun.outcome.type, "CAPABILITY_MISS");
  assert.ok(loadWitnessContext(".eval-artifacts/e1-evaluator-20261016/witness-inputs.json", "p20-h001-a1"));
  assert.equal(loadWitnessContext(".eval-artifacts/e1-evaluator-20261016/witness-inputs.json", "p20-h002-a1"), undefined);
  const expired = structuredClone(witnessOracle);
  // Independent explicit certification window, not request-expiry policy or a label.
  expired.validUntil = "2026-10-12T17:20:00+09:00";
  expired.rows.forEach(row => { assert.ok(row.observation); row.observation.observedAt = "2026-10-11T08:00:00Z"; });
  const invalid = evaluateRestaurantHybridLiveArtifact(artifact, { path: "p20-h001-a1", sha256 }, { witnessOracle: expired });
  assert.equal(invalid.outcome.type, "NOT_A_VALID_SAMPLE");
  assert.equal(invalid.outcome.capabilityDenominator, "EXCLUDED");
});

test("E1 a missing raw recheck cannot erase a pre-registered witness or invent its inventory", async () => {
  const artifact = await calibrationArtifact("p20-h001-a1");
  const originalPath = ".eval-artifacts/p2-0-hardening-20261015/prep/live/h001/witness-after/manifest.json";
  const originalBytes = await readFile(originalPath), manifest = JSON.parse(originalBytes.toString());
  const directory = await mkdtemp(join(tmpdir(), "e1-witness-missing-row-"));
  try {
    // Independent artifact copy: remove only Sen's observation, not all raw
    // evidence or the registered roster. Other three observations stay intact.
    for (const row of manifest.rows) {
      await copyFile(resolve(dirname(originalPath), basename(row.metadataPath)), join(directory, basename(row.metadataPath)));
      await copyFile(resolve(dirname(originalPath), basename(row.bodyPath)), join(directory, basename(row.bodyPath)));
      row.metadataPath = basename(row.metadataPath);
      row.bodyPath = basename(row.bodyPath);
    }
    manifest.rows = manifest.rows.filter((row: any) => row.parameters.rst_id !== "13275802");
    await writeFile(join(directory, "manifest.json"), JSON.stringify(manifest));
    const oracle = loadWitnessOracle({ manifestPath: join(directory, "manifest.json"),
      registryPath: ".eval-artifacts/known-feasible-baseline-20261008/witnesses.prequalified-20261008.json",
      variantId: "kf-h001-20261022", artifactSha256: source.sha256 });
    const evaluated = evaluateRestaurantHybridLiveArtifact(artifact, source, { witnessOracle: oracle });
    assert.equal(evaluated.witnessFunnel.length, 4, "expected outlets come from the independent roster, not only the surviving recheck rows");
    const missing = evaluated.witnessFunnel.find(row => row.sourceId === "13275802")!;
    assert.equal(missing.availability.witness, "NOT_EVALUATED");
    assert.equal(missing.availability.observedAt, null, "do not manufacture an observation time or use stale roster inventory");
    assert.equal(missing.feasible, "NOT_EVALUATED");
    assert.equal(missing.blocker.stage, "NOT_EVALUATED");
    assert.equal(evaluated.witnessFunnel.find(row => row.sourceId === "13261619")?.availability.witness, "AVAILABLE", "unrelated raw evidence survives");
    assert.deepEqual(await readFile(originalPath), originalBytes, "the historical witness is never overwritten");
    const registry = JSON.parse(await readFile(".eval-artifacts/known-feasible-baseline-20261008/witnesses.prequalified-20261008.json", "utf8"));
    delete registry.variants[0].witnesses.find((row: any) => row.sourceUrl.includes("13261619")).hardEvidence;
    const registryCopy = join(directory, "registry-with-missing-hard-gold.json");
    await writeFile(registryCopy, JSON.stringify(registry));
    const missingHard = loadWitnessOracle({ manifestPath: originalPath, registryPath: registryCopy,
      variantId: "kf-h001-20261022", artifactSha256: source.sha256 });
    const withoutHardGold = evaluateRestaurantHybridLiveArtifact(artifact, source, { witnessOracle: missingHard }).witnessFunnel.find(row => row.sourceId === "13261619")!;
    assert.equal(withoutHardGold.availability.witness, "AVAILABLE");
    assert.equal(withoutHardGold.feasible, "NOT_EVALUATED", "observed seats cannot fill a missing HARD oracle");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("E1 review witness inputs resolve relative to the relocated manifest, including raw subdirectories", async () => {
  const originalPath = ".eval-artifacts/p2-0-hardening-20261015/prep/live/h001/witness-after/manifest.json";
  const original = await readFile(originalPath), manifest = JSON.parse(original.toString());
  const directory = await mkdtemp(join(tmpdir(), "e1-relocated-witness-"));
  try {
    await mkdir(join(directory, "raw"));
    for (const row of manifest.rows) {
      for (const field of ["metadataPath", "bodyPath"]) {
        await copyFile(resolve(dirname(originalPath), basename(row[field])), join(directory, "raw", basename(row[field])));
        row[field] = `raw/${basename(row[field])}`;
      }
    }
    await writeFile(join(directory, "manifest.json"), JSON.stringify(manifest));
    let failure: unknown, oracle: WitnessOracle | undefined;
    try { oracle = loadWitnessOracle({ manifestPath: join(directory, "manifest.json"), registryPath: ".eval-artifacts/known-feasible-baseline-20261008/witnesses.prequalified-20261008.json", variantId: "kf-h001-20261022", artifactSha256: source.sha256 }); }
    catch (error) { failure = error; }
    assert.equal(failure, undefined, "a valid manifest-relative raw path must work after relocation; the recorder's old machine path is not an input");
    assert.equal(oracle?.rows.length, 4);
    assert.ok(oracle?.rows.every(row => row.observation?.complete));
    assert.deepEqual(await readFile(originalPath), original);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("E1 witness cross-source identity needs independent name AND full address; floor conflict and missing reads stay visible", async () => {
  // Real record structure, independent miniature witness labels because the
  // historical roster does not contain cross-source address Gold. This does
  // not certify any real shop's identity or model understanding.
  const original = await calibrationArtifact("p20-h002-a1");
  const oldId = original.finalSnapshot.domainState.presentedResults.candidateIds[0];
  const artifact = JSON.parse(JSON.stringify(original).replaceAll(oldId, "google:TEST_ONLY"));
  const candidate = artifact.finalSnapshot.domainState.candidates.find((entry: any) => entry.restaurant.id === "google:TEST_ONLY");
  candidate.restaurant.outletName = "Sora Sushi"; candidate.restaurant.address = "1-2 Main Town, 2F";
  const prefix = ".eval-artifacts/p2-0-hardening-20261015/prep/live/h002/attempt-1/post-delivery-raw/13295658";
  const observation = loadPostDeliveryTabelogObservation(`${prefix}.metadata.json`, `${prefix}.body.txt`);
  const oracle: WitnessOracle = { applicableArtifactSha256: source.sha256, radiusMeters: 1000, sourceRef: "TEST_ONLY", rows: [{
    outletName: "Sushi Sora", address: "1 2 Main Town 2F", sourceId: "13295658", distanceMeters: 100,
    hardEvidence: [], observation, refs: ["TEST_ONLY:independent-miniature-address"] } ] };
  const evaluate = () => evaluateRestaurantHybridLiveArtifact(artifact, source, { witnessOracle: oracle }).witnessFunnel[0]!;
  assert.equal(evaluate().discovery.status, "FOUND");
  assert.equal(evaluate().presented, "YES");
  const presentation = artifact.trajectories.find((step: any) => step.agentAction?.type === "PRESENT_RESULTS");
  artifact.trajectories = artifact.trajectories.filter((step: any) => step !== presentation);
  assert.equal(evaluate().presented, "NOT_EVALUATED", "completion label cannot replace an executed presentation");
  artifact.trajectories.push(presentation);
  candidate.restaurant.address = "1-2 Main Town, 3F";
  assert.equal(evaluate().discovery.status, "NOT_FOUND");
  candidate.restaurant.address = "1-2 Main Town, 2F";
  delete oracle.rows[0]!.address;
  assert.equal(evaluate().discovery.status, "NOT_EVALUATED");
  oracle.rows[0]!.address = "1 2 Main Town 2F";
  artifact.trajectories = artifact.trajectories.filter((step: any) => step.observation?.type !== "DISCOVERY");
  assert.equal(evaluate().discovery.status, "NOT_EVALUATED", "final candidate labels cannot replace actual discovery records");
});

test("E1 after-GET scope comes from its raw response, never the four request parameters", async () => {
  const base = ".eval-artifacts/p2-0-hardening-20261015/prep/live/h002/attempt-1/post-delivery-raw/13295658";
  const original = loadPostDeliveryTabelogObservation(`${base}.metadata.json`, `${base}.body.txt`);
  assert.equal(original.date, "2026-10-17"); assert.equal(original.party, 2);
  const directory = await mkdtemp(join(tmpdir(), "e1-post-raw-scope-"));
  const { writeFile } = await import("node:fs/promises");
  const body = JSON.parse(await readFile(`${base}.body.txt`, "utf8"));
  body.base_date.day = 18; body.members = 3;
  const raw = JSON.stringify(body);
  const metadata = JSON.parse(await readFile(`${base}.metadata.json`, "utf8"));
  metadata.sha256 = createHash("sha256").update(raw).digest("hex"); // preserve integrity, only scope is wrong
  await writeFile(join(directory, "body.json"), raw);
  await writeFile(join(directory, "metadata.json"), JSON.stringify(metadata));
  const changed = loadPostDeliveryTabelogObservation(join(directory, "metadata.json"), join(directory, "body.json"));
  assert.equal(changed.date, "2026-10-18"); assert.equal(changed.party, 3);
  const artifact = await calibrationArtifact("p20-h002-a1");
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source, { postDeliveryTabelog: [changed] }), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
});

test("E1 real no-progress loops fail investigation and same-term steps 4-6 are reported", async () => {
  const loop = evaluateRestaurantHybridLiveArtifact(await calibrationArtifact("p1g2-h001-a4"), source);
  assert.equal(finding(loop, "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED");
  const repeated = evaluateRestaurantHybridLiveArtifact(await calibrationArtifact("p20-h001-a1"), source) as any;
  assert.ok(repeated.investigationMetrics?.sameTermRuns.some((run: any) => run.steps.slice(0, 3).join(",") === "4,5,6"));
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(completeArtifact(), source), "INVESTIGATION_BEHAVIOR").status, "SATISFIED");
});

test("E1 progress thresholds reject repeated failures but do not erase a genuinely supported delivery", () => {
  const original: any = completeArtifact();
  const evaluate = (count: number, mode: "rejected" | "failure") => {
    const artifact = structuredClone(original);
    artifact.trajectories = [...Array.from({ length: count }, (_, index) => ({ stepNumber: index + 1,
      stepOutcome: mode === "rejected" ? "REJECTED" : "EXECUTION_FAILURE", agentAction: { type: "SEARCH_RESTAURANTS", retrievalHint: "independent query" },
      decisionContext: original.trajectories[0].decisionContext,
      executionMetadata: { provider: "TABELOG", failureCode: "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" },
    })), ...artifact.trajectories];
    return evaluateRestaurantHybridLiveArtifact(artifact, source);
  };
  for (const mode of ["rejected", "failure"] as const) {
    assert.equal(finding(evaluate(3, mode), "INVESTIGATION_BEHAVIOR").status, "SATISFIED");
    const exceeded = evaluate(4, mode);
    assert.equal(finding(exceeded, "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED");
    assert.equal(exceeded.execution.taskProducedQualifiedResult, "YES", "bad investigation is not proof that a true displayed result became false");
    assert.equal(exceeded.outcome.type, "QUALIFIED_DELIVERY");
    assert.equal(exceeded.execution.systemBehavior, "NOT_SUPPORTED");
  }
});

test("E1 exact URL reload counter distinguishes real query variation and unavailable redacted history", () => {
  const artifact: any = completeArtifact();
  const url = "https://example.test/public?date=20261016";
  artifact.sourceTrace = { navigations: Array(6).fill(url) };
  let result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(result.investigationMetrics.urls.status, "OBSERVED");
  assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "SATISFIED");
  artifact.sourceTrace.navigations.push(url);
  result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED");
  assert.match(result.investigationMetrics.violations.join(" "), /exactUrlReloads=6>5/);
  artifact.sourceTrace.navigations = Array.from({ length: 7 }, (_, index) => `https://example.test/public?date=202610${10 + index}`);
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "INVESTIGATION_BEHAVIOR").status, "SATISFIED");
  delete artifact.sourceTrace;
  assert.equal(evaluateRestaurantHybridLiveArtifact(artifact, source).investigationMetrics.urls.status, "NOT_EVALUATED");
});

test("E1 resources honor actual executor limits, and missing effectiveLimits stays unevaluated", async () => {
  const original = await calibrationArtifact("p20-h002-a1");
  const control = evaluateRestaurantHybridLiveArtifact(original, source);
  assert.equal(finding(control, "RESOURCES").status, "SATISFIED", "the original recorded counters fit their actual limits");
  assert.match(control.effectiveResources.declarationDifferences.join(" "), /FACTS.*maxBrowserModelCallsPerCandidate=20.*maxModelCallsPerCandidate=4/);
  assert.match(control.effectiveResources.unassessed.join(" "), /elapsed-time limit not retained/);
  const changed = structuredClone(original);
  for (const diagnostic of changed.diagnostics.browserExecution) if (diagnostic.effectiveLimits) diagnostic.effectiveLimits.maxModelCallsTotal = 1;
  const exceeded = evaluateRestaurantHybridLiveArtifact(changed, source);
  assert.equal(finding(exceeded, "RESOURCES").status, "NOT_SATISFIED", "runCeilings=120 must not conceal actual limit=1");
  assert.match(finding(exceeded, "RESOURCES").observations.join(" "), /effective.*maxModelCallsTotal/i);
  const legacy = structuredClone(original);
  for (const diagnostic of legacy.diagnostics.browserExecution) delete diagnostic.effectiveLimits;
  for (const entry of legacy.diagnostics.browserTrace) if (entry.kind === "EXECUTOR_DIAGNOSTIC") delete entry.detail.effectiveLimits;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(legacy, source), "RESOURCES").status, "NOT_EVALUATED");
  for (const [counter, limit] of [["candidateModelCalls", "maxModelCallsPerCandidate"], ["candidateRuntimeOperations", "maxOperationsPerCandidate"]] as const) {
    const overage = structuredClone(original);
    const recorded = overage.diagnostics.browserExecution.find((entry: any) => entry.stage === "FACTS" && entry.effectiveLimits && entry.lifecycle)!;
    recorded.lifecycle[counter] = recorded.effectiveLimits[limit] + 1;
    const result = evaluateRestaurantHybridLiveArtifact(overage, source);
    assert.equal(finding(result, "RESOURCES").status, "NOT_SATISFIED", `${counter} must use the actual FACTS limit`);
    assert.ok(result.effectiveResources.violations.some(value => value.includes(counter)));
  }
});

test("E1 outer post-run check captures each registered witness once for an actual zero-delivery run", async (t) => {
  t.mock.method(globalThis, "fetch", () => { throw Error("OFFLINE_TEST_NETWORK_FORBIDDEN"); });
  const artifact = await calibrationArtifact("p1g-kichijoji-a2");
  const registryPath = fileURLToPath(new URL("../../../../.eval-artifacts/p1-g-20261012/witnesses.p1g.json", import.meta.url));
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  assert.equal(artifact.materializedCase.id, "p1f-novel-kichijoji-tempura-20261020");
  assert.equal(artifact.finalSnapshot.domainState.presentedResults?.candidateIds?.length ?? 0, 0);
  const outerPath = new URL("../../../../.eval-artifacts/p2-0-hardening-20261015/prep/scripts/post-delivery.mjs", import.meta.url).href;
  const { verifyDeliveries } = await import(outerPath);
  const directory = await mkdtemp(join(tmpdir(), "e1-zero-witness-"));
  const requests: URL[] = [];
  try {
    const checked = await verifyDeliveries(artifact, directory, async (url: URL, options: RequestInit) => {
      requests.push(new URL(url));
      assert.equal(options.method, "GET"); assert.equal(options.redirect, "error");
      // This checks outer I/O, not availability correctness. No generated
      // "all conditions met" evidence or evaluator scores enter the fixture.
      return new Response('{"members":2,"base_date":{"year":2026,"month":10,"day":20},"selection":{}}', { status: 200 });
    }, registry);
    assert.equal(requests.length, 3, "zero delivery must recheck the three pre-registered witnesses, not silently skip them");
    const expectedIds = registry.variants[0].witnesses.map((w: any) => new URL(w.sourceUrl).pathname.split("/").filter(Boolean).at(-1)).sort();
    assert.deepEqual(requests.map(url => url.searchParams.get("rst_id")).sort(), expectedIds);
    assert.equal(new Set(requests.map(url => url.toString())).size, 3, "no retries or discovered-candidate targets");
    for (const url of requests) {
      assert.equal(url.origin + url.pathname, "https://tabelog.com/en/booking/calendar/find_vacancy/");
      assert.deepEqual([...url.searchParams.keys()].sort(), ["rst_id", "svd", "svps", "svt"]);
      assert.equal(url.searchParams.get("svd"), "20261020");
      assert.equal(url.searchParams.get("svps"), "2"); assert.equal(url.searchParams.get("svt"), "1800");
    }
    assert.equal(checked.witnessRaw.length, 3);
    for (const raw of checked.witnessRaw) {
      assert.equal(createHash("sha256").update(await readFile(raw.bodyPath)).digest("hex"), raw.sha256);
      assert.equal(JSON.parse(await readFile(raw.metadataPath, "utf8")).method, "GET");
    }
    const oracle = loadWitnessOracle({ manifestPath: checked.witnessManifestPath, registryPath,
      variantId: artifact.materializedCase.id, artifactSha256: source.sha256 });
    const evaluated = evaluateRestaurantHybridLiveArtifact(artifact, source, { witnessOracle: oracle });
    assert.equal(evaluated.witnessFunnel.length, 3, "outer raw files are consumable by the actual evaluator");
    assert.ok(evaluated.witnessFunnel.every(row => row.availability.witness === "NO_MATCHING_SLOT"));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("E1 outer witness scope skips deliveries and unregistered cases, and blocks request/source drift", async (t) => {
  t.mock.method(globalThis, "fetch", () => { throw Error("OFFLINE_TEST_NETWORK_FORBIDDEN"); });
  const artifact = await calibrationArtifact("p1g-kichijoji-a2");
  const registry = JSON.parse(await readFile(new URL("../../../../.eval-artifacts/p1-g-20261012/witnesses.p1g.json", import.meta.url), "utf8"));
  const outerPath = new URL("../../../../.eval-artifacts/p2-0-hardening-20261015/prep/scripts/post-delivery.mjs", import.meta.url).href;
  const { zeroDeliveryWitnessChecks, verifyDeliveries } = await import(outerPath);
  assert.equal(zeroDeliveryWitnessChecks(await calibrationArtifact("p20-h002-a1"), registry).status, "SKIP_DELIVERED");
  const drift = structuredClone(artifact); drift.materializedCase.semantic.date.value = "2026-10-21";
  const unknownShop = structuredClone(registry); unknownShop.variants[0].witnesses[0].sourceUrl = "https://unregistered.test/13282321/";
  let requests = 0;
  const forbiddenTransport = async () => { requests++; throw Error("NO_REQUEST_ALLOWED"); };
  for (const [input, roster, status] of [
    [await calibrationArtifact("p20-h001-a1"), registry, "SKIP_NO_REGISTERED_WITNESS"],
    [undefined, registry, "SKIP_MISSING_RESULT"],
    [drift, registry, "BLOCKED_REGISTERED_REQUEST_MISMATCH"],
    [artifact, unknownShop, "BLOCKED_UNAPPROVED_WITNESS"],
  ] as const) {
    const result = await verifyDeliveries(input, "/UNUSED_NO_WRITES_EXPECTED", forbiddenTransport, roster);
    assert.equal(result.witnessPlan.status, status);
    assert.deepEqual(result.witnessRaw, []);
    assert.equal(!!result.stop, status.startsWith("BLOCKED"));
  }
  assert.equal(requests, 0);
  const duplicate = structuredClone(registry); duplicate.variants[0].witnesses.push(duplicate.variants[0].witnesses[0]);
  assert.equal(zeroDeliveryWitnessChecks(artifact, duplicate).plans.length, 3, "one GET per registered outlet, even when roster aliases repeat");
});

const source = { path: "/tmp/availability-fixture.result.json", sha256: "a".repeat(64) };
const finding = (result: ReturnType<typeof evaluateRestaurantHybridLiveArtifact>, dimension: string) => result.findings.find((item) => item.dimension === dimension)!;

/** Synthetic availability contract, not current H001 Gold. Attempts use the actual runner shape. */
function completeArtifact() {
  const candidateId = "candidate-a";
  const intentDraft = { timezone: fixtureIntent.timezone, target: { goal: "AVAILABILITY", query: "find a table" }, date: "2026-09-08", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, area: { query: "near Shibuya" }, criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] };
  return {
    status: "SUCCEEDED", stage: "AGENT_LOOP", caseId: "availability-fixture", runId: "run:availability-fixture", finishedAt: "2026-09-08T07:45:37.000Z",
    limits: { maxSteps: 30, maxBrowserModelCallsTotal: 120 },
    materializedCase: { semantic: { target: { goal: "AVAILABILITY" }, date: { value: "2026-09-08" }, party_size: 2, time: { value: "19:00" }, location: { value: "Shibuya", relation: "NEAR" }, criteria: [{ value: "omakase", polarity: "POSITIVE", strength: "HARD" }] } },
    loop: { maxSteps: 12, maxRejectedActions: 3, timeoutMs: 30_000,  status: "TERMINAL" }, resourceUsage: { elapsedMs: 100, agentDecisions: 3, browserModelCalls: 2 },
    trajectories: [{ stateHashBefore: "request-v1", stepOutcome: "EXECUTED", agentAction: { type: "CHECK_AVAILABILITY", candidateIds: [candidateId] }, decisionContext: { intentDraft }, observation: { type: "AVAILABILITY", candidateIds: [candidateId], evidenceIds: ["discovery-a", "identity-a", "hard-a", "availability-a"] }, executionMetadata: { providerAttempts: [{ candidateId, provider: "TABLECHECK", outcome: "AVAILABLE" }] } }],
    diagnostics: { browserExecution: [{ source: "TABLECHECK", stage: "AVAILABILITY", candidateId, elapsedMs: 100,
      effectiveLimits: { maxModelCallsPerCandidate: 20, maxModelCallsTotal: 120, maxOperationsPerCandidate: 80, maxAutomaticElapsedMs: 30_000 },
      lifecycle: { candidateModelCalls: 2, runModelCalls: 2, candidateRuntimeOperations: 3 } }], browserTrace: [
      { sequence: 1, at: "2026-09-08T07:44:58.000Z", kind: "EXECUTOR_DIAGNOSTIC", detail: { stage: "AVAILABILITY", candidateId, event: "OPERATION_STARTED", detail: "SNAPSHOT" } },
      { sequence: 2, at: "2026-09-08T07:44:59.000Z", kind: "SNAPSHOT", detail: { stage: "AVAILABILITY", candidateId: "candidate-a", url: "https://www.tablecheck.com/en/shops/outlet-a/reserve", queryRegions: [{ markup: '<section data-testid="Venue Availability"><a data-reservation-source="/en/shops/outlet-a/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="19:00">19:00</a></section>', truncated: false, ancestorMarkupHidden: false }] } },
      { sequence: 3, at: "2026-09-08T07:44:59.100Z", kind: "CONTROLS", detail: { snapshotSequence: 2, controls: [
        { kind: "INPUT", label: "2026-09-08", value: "2026-09-08", visible: true, disabled: false, structure: { name: "reservation[start_date]" } },
        { kind: "SELECT", label: "2", value: "2", visible: true, disabled: false, structure: { name: "reservation[num_people_adult]" } },
        { kind: "LINK", label: "19:00", visible: true, disabled: false },
      ] } },
    ] },
    finalSnapshot: { domainState: {
      phase: "PRESENT_RESULTS", intentDraft,
      candidates: [{ restaurant: { id: candidateId, outletName: "A" } }],
      availabilityChecks: { [candidateId]: { status: "AVAILABLE", evidenceIds: ["discovery-a", "identity-a", "hard-a", "availability-a"] } },
      availability: { [candidateId]: [{ id: "offer-a", restaurantId: candidateId, source: "TABLECHECK", dateTime: "2026-09-08T19:00:00+09:00", partySize: 2, checkedAt: "2026-09-08T07:45:00.000Z", expiresAt: "2026-09-08T07:47:00.000Z" }] },
      presentedResults: { candidateIds: [candidateId], evidenceIds: ["discovery-a", "identity-a", "hard-a", "availability-a"], presentedAt: "2026-09-08T07:45:37.000Z", conditionStates: {} },
      readEvidence: [
        { evidenceId: "discovery-a", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId, observedAt: "2026-09-08T07:41:00.000Z", requestFingerprint: "discovery", claims: { areaMatch: true, areaQuery: "near Shibuya" } },
        { evidenceId: "identity-a", kind: "ENTITY_MATCH", provider: "TABLECHECK", candidateId, sourceEntityId: "outlet-a", observedAt: "2026-09-08T07:45:00.000Z", requestFingerprint: "identity", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] } },
        { evidenceId: "hard-a", kind: "RESTAURANT_FACT", provider: "TABLECHECK", candidateId, sourceEntityId: "outlet-a", observedAt: "2026-09-08T07:45:00.000Z", requestFingerprint: "hard", claims: { verifiedHardCriteria: ["omakase"] }, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] } },
        { evidenceId: "availability-a", kind: "AVAILABILITY", provider: "TABLECHECK", candidateId, sourceEntityId: "outlet-a", observedAt: "2026-09-08T07:45:00.000Z", expiresAt: "2026-09-08T07:47:00.000Z", requestFingerprint: "availability", claims: { date: "2026-09-08", partySize: 2, visibleSlots: ["19:00"] }, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] } },
      ],
    } },
  };
}

test("diagnostic evaluator independently accepts current-runner-shaped grounded evidence", () => {
  const result = evaluateRestaurantHybridLiveArtifact(completeArtifact(), source);
  assert.equal(result.execution.taskProducedQualifiedResult, "YES");
  assert.equal(result.execution.systemBehavior, "SUPPORTED_BY_EVIDENCE");
  assert.equal(result.execution.completion, "PRESENTATION_RECORDED");
  assert.deepEqual(result.candidateSummaries[0]?.providers, ["TABLECHECK"]);
  assert.match(result.candidateSummaries[0]?.providerAttempts[0]?.evidenceRef ?? "", /trajectories\[0\]/);
  assert.ok(result.findings.every((item) => item.status === "SATISFIED"));
});

test("E1 binds a slot to its availability snapshot before evidence, excluding later facts", async (t) => {
  for (const mode of ["later-facts", "slot-only-in-facts", "future-availability"] as const) await t.test(mode, () => {
    const artifact: any = completeArtifact();
    const snapshot = artifact.diagnostics.browserTrace[1];
    snapshot.at = "2026-09-08T07:44:59.000Z";
    snapshot.detail.stage = "AVAILABILITY"; snapshot.detail.candidateId = "candidate-a";
    if (mode === "slot-only-in-facts") snapshot.detail.queryRegions[0].markup = snapshot.detail.queryRegions[0].markup.replace('>19:00</a>', '><button disabled>19:00</button></a>');
    const later = structuredClone(snapshot);
    later.sequence = 5; later.at = "2026-09-08T07:45:20.000Z";
    later.detail.stage = mode === "future-availability" ? "AVAILABILITY" : "FACTS";
    if (mode !== "slot-only-in-facts") later.detail.queryRegions = [];
    else later.detail.queryRegions[0].markup = later.detail.queryRegions[0].markup.replace('<button disabled>19:00</button>', '19:00');
    artifact.diagnostics.browserTrace.push(later, { sequence: 6, at: later.at, kind: "CONTROLS", detail: { snapshotSequence: 5, controls: structuredClone(artifact.diagnostics.browserTrace[2].detail.controls) } });
    const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
    const expected = mode === "slot-only-in-facts" ? "NOT_SATISFIED" : "SATISFIED";
    assert.equal(finding(result, "REQUIRED_EVIDENCE").status, expected);
    assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, expected);
  });
});

test("raw TableCheck trace requires a current request-bound settled result", async (t) => {
  const evaluate = (artifact: any) => evaluateRestaurantHybridLiveArtifact(artifact, source);
  const sushiScope = { field: "reservation[service_category]", group: "form:reservation-form|name:reservation[service_category]", value: "sushi", label: "Sushi" };
  const scopedArtifact = (): any => {
    const artifact: any = completeArtifact();
    // Each mutation below must be isolated. Reusing this scope object let the
    // wrong-offer control rewrite the later normal negative-scope fixture.
    const scope = { ...sushiScope };
    artifact.finalSnapshot.domainState.availability["candidate-a"][0].serviceScope = scope;
    // This is a synthetic evaluator contract only.  The real TableCheck
    // category-result binding remains unconfirmed by the source probe.
    artifact.provenance = "SYNTHETIC_CONTROL";
    Object.assign(artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a").claims, {
      serviceScopeField: scope.field, serviceScopeGroup: scope.group, serviceScopeValue: scope.value, serviceScopeLabel: scope.label,
    });
    Object.assign(artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "availability-a").claims, {
      serviceScopeField: scope.field, serviceScopeGroup: scope.group, serviceScopeValue: scope.value, serviceScopeLabel: scope.label,
    });
    artifact.diagnostics.browserTrace[1].detail.queryRegions[0].markup = '<section data-testid="Venue Availability"><a data-reservation-source="/en/shops/outlet-a/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="19:00" data-reservation-service-category="sushi">19:00</a></section>';
    artifact.diagnostics.browserTrace[2].detail.controls.push({ kind: "RADIO", label: "Sushi", value: "sushi", checked: true, visible: true, disabled: false, structure: { name: scope.field, radioGroupKey: scope.group } });
    return artifact;
  };
  await t.test("enabled public reservation link supports the presented result", () => {
    assert.equal(finding(evaluate(completeArtifact()), "REQUIRED_EVIDENCE").status, "SATISFIED");
  });
  await t.test("a synthetic scoped offer requires matching source scope, checked raw radio, scope-bound slot, and HARD support", () => {
    assert.equal(finding(evaluate(scopedArtifact()), "REQUIRED_EVIDENCE").status, "SATISFIED");
    const unrelatedRadio = scopedArtifact(); unrelatedRadio.diagnostics.browserTrace[2].detail.controls.push({ kind: "RADIO", label: "Newsletter", value: "yes", checked: true, visible: true, disabled: false, structure: { name: "newsletter", radioGroupKey: "form:newsletter|name:newsletter" } });
    assert.equal(finding(evaluate(unrelatedRadio), "REQUIRED_EVIDENCE").status, "SATISFIED");
    const wrongOffer = scopedArtifact(); wrongOffer.finalSnapshot.domainState.availability["candidate-a"][0].serviceScope.value = "bar";
    assert.equal(finding(evaluate(wrongOffer), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
    const wrongHardFact = scopedArtifact(); wrongHardFact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a").claims.serviceScopeValue = "bar";
    assert.equal(finding(evaluate(wrongHardFact), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
    const unscopedHardFact = scopedArtifact();
    for (const key of ["serviceScopeField", "serviceScopeGroup", "serviceScopeValue", "serviceScopeLabel"]) delete unscopedHardFact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a").claims[key];
    assert.equal(finding(evaluate(unscopedHardFact), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
    const scopedNegative = scopedArtifact();
    const negative = { value: "bar", polarity: "NEGATIVE", strength: "HARD" };
    scopedNegative.materializedCase.semantic.criteria.push(negative);
    scopedNegative.finalSnapshot.domainState.intentDraft.criteria.push({ text: "bar", polarity: "NEGATIVE", strength: "HARD" });
    scopedNegative.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a").claims.verifiedNegativeCriteria = ["bar"];
    assert.equal(finding(evaluate(scopedNegative), "REQUIRED_EVIDENCE").status, "SATISFIED");
    const wrongNegativeFact = scopedNegative;
    wrongNegativeFact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a").claims.serviceScopeValue = "bar";
    assert.equal(finding(evaluate(wrongNegativeFact), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
    const mismatchedModelSupport = scopedArtifact();
    const raw = mismatchedModelSupport.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a");
    raw.claims = { restaurantTypeFacts: ["Omakase counter"], serviceScopeField: sushiScope.field, serviceScopeGroup: sushiScope.group, serviceScopeValue: "bar", serviceScopeLabel: "Bar" };
    const judgment = { evidenceId: "judgment-a", kind: "RESTAURANT_FACT", provider: "MODEL_JUDGMENT", candidateId: "candidate-a", observedAt: raw.observedAt, requestFingerprint: "facts", claims: { verifiedHardCriteria: ["omakase"], supportingEvidenceIds: ["hard-a"], serviceScopeField: sushiScope.field, serviceScopeGroup: sushiScope.group, serviceScopeValue: sushiScope.value, serviceScopeLabel: sushiScope.label } };
    mismatchedModelSupport.finalSnapshot.domainState.readEvidence.push(judgment);
    mismatchedModelSupport.finalSnapshot.domainState.availabilityChecks["candidate-a"].evidenceIds.push("judgment-a");
    mismatchedModelSupport.finalSnapshot.domainState.presentedResults.evidenceIds.push("judgment-a");
    mismatchedModelSupport.trajectories[0].observation.evidenceIds.push("judgment-a");
    assert.equal(finding(evaluate(mismatchedModelSupport), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
    const twoCheckedSameGroup = scopedArtifact(); twoCheckedSameGroup.diagnostics.browserTrace[2].detail.controls.push({ kind: "RADIO", label: "Bar", value: "bar", checked: true, visible: true, disabled: false, structure: { name: "reservation[service_category]", radioGroupKey: "form:reservation-form|name:reservation[service_category]" } });
    assert.equal(finding(evaluate(twoCheckedSameGroup), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
    const missingRadio = scopedArtifact(); missingRadio.diagnostics.browserTrace[2].detail.controls.pop();
    assert.equal(finding(evaluate(missingRadio), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
    const staleAfterSetChecked = scopedArtifact(); staleAfterSetChecked.diagnostics.browserTrace.push({ sequence: 4, kind: "SESSION_CALL", detail: { method: "setChecked", args: ["scope", "sushi"] } });
    assert.equal(finding(evaluate(staleAfterSetChecked), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
    const omittedProductionScope = scopedArtifact(); delete omittedProductionScope.finalSnapshot.domainState.availability["candidate-a"][0].serviceScope;
    for (const evidence of omittedProductionScope.finalSnapshot.domainState.readEvidence) if (evidence.claims) {
      delete evidence.claims.serviceScopeField; delete evidence.claims.serviceScopeGroup; delete evidence.claims.serviceScopeValue; delete evidence.claims.serviceScopeLabel;
    }
    assert.equal(finding(evaluate(omittedProductionScope), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  });
  await t.test("disabled child vetoes a same-time enabled-looking result", () => {
    const artifact: any = completeArtifact();
    artifact.diagnostics.browserTrace[1].detail.queryRegions[0].markup = '<section data-testid="Venue Availability"><a data-reservation-source="/en/shops/outlet-a/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="19:00"><button disabled>19:00</button></a></section>';
    const result = evaluate(artifact);
    assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
    assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED");
  });
  await t.test("a selected different party is a request conflict", () => {
    const artifact: any = completeArtifact(); artifact.diagnostics.browserTrace[2].detail.controls[1].value = "3";
    assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  });
  await t.test("a later matching snapshot invalidates an earlier available slot", () => {
    const artifact: any = completeArtifact();
    artifact.diagnostics.browserTrace.push(
      { sequence: 4, kind: "SESSION_CALL", detail: { method: "select", args: ["date", "2026-09-08"] } },
      { sequence: 5, at: "2026-09-08T07:44:59.500Z", kind: "SNAPSHOT", detail: { stage: "AVAILABILITY", candidateId: "candidate-a", url: "https://www.tablecheck.com/en/shops/outlet-a/reserve", queryRegions: [{ markup: '<section data-testid="Venue Availability"><a data-reservation-source="/en/shops/outlet-a/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="19:00"><button disabled>19:00</button></a></section>', truncated: false, ancestorMarkupHidden: false }] } },
      { sequence: 6, kind: "CONTROLS", detail: { snapshotSequence: 5, controls: structuredClone(artifact.diagnostics.browserTrace[2].detail.controls) } },
    );
    assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  });
  for (const variant of [
    { name: "stale control snapshot", mutate: (artifact: any) => { artifact.diagnostics.browserTrace[1].detail.queryRegions = [{ markup: '<section data-testid="Venue Availability"></section>', truncated: false, ancestorMarkupHidden: false }]; artifact.diagnostics.browserTrace[2].detail.snapshotSequence = 1; } },
    { name: "loading region", mutate: (artifact: any) => { artifact.diagnostics.browserTrace[1].detail.queryRegions = [{ markup: '<section data-testid="Venue Availability">Loading</section>', truncated: false, ancestorMarkupHidden: false }]; } },
    { name: "missing trace", mutate: (artifact: any) => { delete artifact.diagnostics; } },
  ]) await t.test(`${variant.name} remains not evaluated`, () => {
    const artifact: any = completeArtifact(); variant.mutate(artifact);
    const result = evaluate(artifact);
    assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
    assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "NOT_EVALUATED");
  });
  for (const variant of [
    { name: "neighbor outlet link", markup: '<section data-testid="Venue Availability"><a data-reservation-source="/en/shops/outlet-b/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="19:00">19:00</a></section>' },
    { name: "hidden descendant link", markup: '<section data-testid="Venue Availability"><div data-markup-hidden="true"><a data-reservation-source="/en/shops/outlet-a/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="19:00">19:00</a></div></section>' },
    { name: "hidden availability region", markup: '<section data-testid="Venue Availability" data-markup-hidden="true"><a data-reservation-source="/en/shops/outlet-a/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="19:00">19:00</a></section>' },
  ]) await t.test(`${variant.name} cannot support availability`, () => {
    const artifact: any = completeArtifact(); artifact.diagnostics.browserTrace[1].detail.queryRegions[0].markup = variant.markup;
    assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
  });
  await t.test("a hidden sibling does not erase a visible same-source slot", () => {
    const artifact: any = completeArtifact();
    artifact.diagnostics.browserTrace[1].detail.queryRegions[0].markup = '<section data-testid="Venue Availability"><div data-markup-hidden="true"><a data-reservation-source="/en/shops/outlet-b/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="19:00">19:00</a></div><a data-reservation-source="/en/shops/outlet-a/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="19:00">19:00</a></section>';
    assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "SATISFIED");
  });
  await t.test("snapshotRecord hides a nested same-tag subtree but retains a visible sibling", () => {
    const artifact: any = completeArtifact();
    const captured = snapshotRecord({
      url: "https://www.tablecheck.com/en/shops/outlet-a/reserve",
      title: "A", text: "Book", html: '<section data-testid="Venue Availability"><div hidden><div>Nested heading</div><a href="https://www.tablecheck.com/en/shops/outlet-a/reserve?start_date=2026-09-08&amp;start_time=19:00&amp;num_people=2">19:00</a></div><a href="https://www.tablecheck.com/en/shops/outlet-a/reserve?start_date=2026-09-08&amp;start_time=19:00&amp;num_people=2">19:00</a></section>',
    });
    artifact.diagnostics.browserTrace[1].detail = captured;
    assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "SATISFIED");
    const hiddenOnly: any = completeArtifact();
    hiddenOnly.diagnostics.browserTrace[1].detail = snapshotRecord({
      url: "https://www.tablecheck.com/en/shops/outlet-a/reserve",
      title: "A", text: "Book", html: '<section data-testid="Venue Availability"><div hidden><div>Nested heading</div><a href="https://www.tablecheck.com/en/shops/outlet-a/reserve?start_date=2026-09-08&amp;start_time=19:00&amp;num_people=2">19:00</a></div></section>',
    });
    assert.equal(finding(evaluate(hiddenOnly), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
  });
  await t.test("snapshotRecord preserves a false data-disabled flag but rejects an actual disabled slot", () => {
    const availability = (slot: string) => snapshotRecord({
      url: "https://www.tablecheck.com/en/shops/outlet-a/reserve",
      title: "A", text: "Book", html: `<section data-testid="Venue Availability"><a href="https://www.tablecheck.com/en/shops/outlet-a/reserve?start_date=2026-09-08&amp;start_time=19:00&amp;num_people=2"><button ${slot}>19:00</button></a></section>`,
    });
    const enabled: any = completeArtifact(); enabled.diagnostics.browserTrace[1].detail = availability('data-is-disabled="false"');
    assert.equal(finding(evaluate(enabled), "REQUIRED_EVIDENCE").status, "SATISFIED");
    const disabled: any = completeArtifact(); disabled.diagnostics.browserTrace[1].detail = availability("disabled");
    assert.equal(finding(evaluate(disabled), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  });
  await t.test("a mutation after the last source snapshot leaves the current result unknown", () => {
    const artifact: any = completeArtifact(); artifact.diagnostics.browserTrace.push({ sequence: 4, kind: "SESSION_CALL", detail: { method: "select", args: ["party", "3"] } });
    assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
  });
  await t.test("each presented offer time needs its own raw enabled slot", () => {
    const artifact: any = completeArtifact();
    artifact.materializedCase.semantic.time = { start: "18:30", end: "20:00" }; artifact.finalSnapshot.domainState.intentDraft.timeWindow = { earliest: "18:30", latest: "20:00" };
    artifact.diagnostics.browserTrace[1].detail.queryRegions[0].markup = '<section data-testid="Venue Availability"><a data-reservation-source="/en/shops/outlet-a/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="18:30">18:30</a></section>';
    assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
  });
  await t.test("one raw slot cannot support only part of a multi-offer presentation", () => {
    const artifact: any = completeArtifact(); const domain = artifact.finalSnapshot.domainState;
    artifact.materializedCase.semantic.time = { start: "18:30", end: "20:00" }; domain.intentDraft.timeWindow = { earliest: "18:30", latest: "20:00" };
    domain.availability["candidate-a"].push({ ...domain.availability["candidate-a"][0], id: "offer-b", dateTime: "2026-09-08T19:30:00+09:00" });
    domain.readEvidence.find((item: any) => item.evidenceId === "availability-a").claims.visibleSlots.push("19:30");
    assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
  });
  await t.test("every presented offer passes when every raw slot is enabled", () => {
    const artifact: any = completeArtifact(); const domain = artifact.finalSnapshot.domainState;
    artifact.materializedCase.semantic.time = { start: "18:30", end: "20:00" }; domain.intentDraft.timeWindow = { earliest: "18:30", latest: "20:00" };
    domain.availability["candidate-a"].push({ ...domain.availability["candidate-a"][0], id: "offer-b", dateTime: "2026-09-08T19:30:00+09:00" });
    domain.readEvidence.find((item: any) => item.evidenceId === "availability-a").claims.visibleSlots.push("19:30");
    artifact.diagnostics.browserTrace[1].detail.queryRegions[0].markup = '<section data-testid="Venue Availability"><a data-reservation-source="/en/shops/outlet-a/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="19:00">19:00</a><a data-reservation-source="/en/shops/outlet-a/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="19:30">19:30</a></section>';
    assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "SATISFIED");
  });
  await t.test("a disabled different time does not erase the enabled presented offer", () => {
    const artifact: any = completeArtifact();
    artifact.materializedCase.semantic.time = { start: "18:30", end: "20:00" }; artifact.finalSnapshot.domainState.intentDraft.timeWindow = { earliest: "18:30", latest: "20:00" };
    artifact.diagnostics.browserTrace[1].detail.queryRegions[0].markup = '<section data-testid="Venue Availability"><a data-reservation-source="/en/shops/outlet-a/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="18:30"><button disabled>18:30</button></a><a data-reservation-source="/en/shops/outlet-a/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="19:00">19:00</a></section>';
    assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "SATISFIED");
  });
});

test("a raw matching settled TableCheck empty result is distinct from an unsupported negative", () => {
  const artifact: any = unknownAvailabilityNoResultArtifact(); const domain = artifact.finalSnapshot.domainState;
  domain.availabilityChecks["candidate-a"] = { status: "UNAVAILABLE", evidenceIds: ["negative-a"] };
  domain.readEvidence.push({ evidenceId: "negative-a", kind: "AVAILABILITY", provider: "TABLECHECK", candidateId: "candidate-a", sourceEntityId: "outlet-a", observedAt: artifact.finishedAt, requestFingerprint: "negative", claims: { date: "2026-09-08", partySize: 2, visibleSlots: [], inventoryStatus: "UNAVAILABLE" } });
  artifact.diagnostics.browserTrace[1].detail.queryRegions[0].markup = '<section data-testid="Venue Availability"><section data-reservation-empty-date="2026-09-08" data-reservation-empty-party="2"></section></section>';
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_EVALUATED", JSON.stringify(result));
  assert.doesNotMatch(finding(result, "COMPLETION_OUTCOME").observations.join(" "), /Unsupported explicit no-availability conclusion/);
});

function artifactWithSameSourceFactRefresh(options: { citeSuperseded?: boolean; retainSupersededInRefresh?: boolean; currentFactSatisfiesHardCriterion?: boolean } = {}) {
  const artifact: any = completeArtifact();
  const domain = artifact.finalSnapshot.domainState;
  const currentFact = structuredClone(domain.readEvidence.find((item: any) => item.evidenceId === "hard-a"));
  currentFact.evidenceId = "hard-b";
  currentFact.observedAt = "2026-09-08T07:45:20.000Z";
  currentFact.requestFingerprint = "hard-refresh";
  currentFact.claims = { verifiedHardCriteria: options.currentFactSatisfiesHardCriterion === false ? [] : ["omakase"] };
  domain.readEvidence.push(currentFact);
  domain.presentedResults.evidenceIds = ["discovery-a", "identity-a", "hard-b", "availability-a"];
  if (options.citeSuperseded) domain.presentedResults.evidenceIds.push("hard-a");
  artifact.trajectories.push({
    stateHashBefore: "request-v1", stepOutcome: "EXECUTED",
    agentAction: { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: ["candidate-a"] },
    decisionContext: { intentDraft: domain.intentDraft },
    observation: {
      type: "CANDIDATE_FACTS", candidateIds: ["candidate-a"],
      evidenceIds: options.retainSupersededInRefresh ? ["identity-a", "hard-a", "hard-b"] : ["identity-a", "hard-b"],
      factSourceAttempts: [{ candidateId: "candidate-a", source: "TABLECHECK" }],
    },
  });
  return artifact;
}

test("diagnostic evaluator retires an availability-read source fact only when the later same-source read replaces it", () => {
  const accepted = evaluateRestaurantHybridLiveArtifact(artifactWithSameSourceFactRefresh(), source);
  assert.equal(accepted.execution.taskProducedQualifiedResult, "YES", JSON.stringify(accepted.findings));

  const citedOldFact = evaluateRestaurantHybridLiveArtifact(artifactWithSameSourceFactRefresh({ citeSuperseded: true }), source);
  assert.equal(citedOldFact.execution.taskProducedQualifiedResult, "NO");
  assert.match(finding(citedOldFact, "REQUIRED_EVIDENCE").observations.join(" "), /cited fact hard-a was superseded/);

  const retainedOldFact = evaluateRestaurantHybridLiveArtifact(artifactWithSameSourceFactRefresh({ retainSupersededInRefresh: true }), source);
  assert.equal(retainedOldFact.execution.taskProducedQualifiedResult, "NO");
  assert.match(finding(retainedOldFact, "REQUIRED_EVIDENCE").observations.join(" "), /check evidence hard-a was not cited/);

  const conflictingCurrentFact = evaluateRestaurantHybridLiveArtifact(artifactWithSameSourceFactRefresh({ currentFactSatisfiesHardCriterion: false }), source);
  assert.notEqual(conflictingCurrentFact.execution.taskProducedQualifiedResult, "YES");
  assert.notEqual(finding(conflictingCurrentFact, "FINAL_CLAIM").status, "SATISFIED");
});

test("diagnostic evaluator independently verifies cited category UNKNOWN eligibility without treating it as verified-negative", () => {
  const artifact: any = completeArtifact();
  const domain = artifact.finalSnapshot.domainState;
  const negative = { text: "fast food", polarity: "NEGATIVE", strength: "HARD" };
  artifact.materializedCase.semantic.criteria.push({ value: "fast food", polarity: "NEGATIVE", strength: "HARD" });
  domain.intentDraft.criteria.push(negative);
  domain.readEvidence.push(
    { evidenceId: "raw-category-a", kind: "RESTAURANT_FACT", provider: "TABLECHECK", candidateId: "candidate-a", sourceEntityId: "outlet-a", observedAt: "2026-09-08T07:45:00.000Z", requestFingerprint: "facts", claims: { restaurantTypeFacts: ["restaurant"] } },
    { evidenceId: "category-unknown-a", kind: "RESTAURANT_FACT", provider: "MODEL_JUDGMENT", candidateId: "candidate-a", observedAt: "2026-09-08T07:45:00.000Z", requestFingerprint: "facts", claims: { categoryUnknownNegativeCriteria: ["fast food"], supportingEvidenceIds: ["raw-category-a"] } },
  );
  domain.availabilityChecks["candidate-a"].evidenceIds.push("raw-category-a", "category-unknown-a");
  domain.presentedResults.evidenceIds.push("raw-category-a", "category-unknown-a");
  artifact.trajectories[0].observation.evidenceIds.push("raw-category-a", "category-unknown-a");
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(result.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result));
  for (const restaurantTypeFacts of [undefined, [], ["  "], [42]]) {
    const invalidTypes = structuredClone(artifact);
    invalidTypes.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "raw-category-a").claims = restaurantTypeFacts === undefined ? {} : { restaurantTypeFacts };
    const rejected = evaluateRestaurantHybridLiveArtifact(invalidTypes, source);
    assert.notEqual(rejected.execution.taskProducedQualifiedResult, "YES", `invalid raw type facts: ${JSON.stringify(restaurantTypeFacts)}`);
    assert.notEqual(finding(rejected, "REQUIRED_EVIDENCE").status, "SATISFIED");
  }
  const unsupported = structuredClone(artifact);
  delete unsupported.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "category-unknown-a").claims.categoryUnknownNegativeCriteria;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(unsupported, source), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
});

/**
 * Public, source-shaped artifact mutations.  Each starts from a fresh copy of
 * the passing control above: these are not edits to a historical artifact and
 * they do not borrow the production eligibility/read-completion functions.
 */
test("diagnostic evaluator distinguishes paired artifact controls from bounded contract mutations", async (t) => {
  const boundedEmptyArtifact = () => {
    const artifact: any = noResultArtifact();
    const domain = artifact.finalSnapshot.domainState;
    domain.candidates = []; domain.availability = {}; domain.availabilityChecks = {}; domain.readEvidence = [];
    domain.noVerifiedResult = { endedAt: artifact.finishedAt, investigatedCandidateIds: [], unresolvedCandidateIds: [], remainingGaps: [] };
    artifact.trajectories = [
      { agentAction: { type: "SEARCH_RESTAURANTS" }, stepOutcome: "EXECUTED", occurredAt: artifact.finishedAt,
        decisionContext: { intentDraft: domain.intentDraft }, observation: { type: "DISCOVERY", candidateIds: [] }, executionMetadata: { provider: "GOOGLE_PLACES", route: "STRUCTURED_ADAPTER" } },
      { agentAction: { type: "END_READ" }, stepOutcome: "EXECUTED", occurredAt: artifact.finishedAt,
        decisionContext: { intentDraft: domain.intentDraft }, observation: { type: "READ_ENDED", candidateIds: [], unresolvedCandidateIds: [] } },
    ];
    return artifact;
  };

  const controls = [
    { name: "qualified presentation", artifact: completeArtifact(), expected: "YES" },
    { name: "bounded empty discovery", artifact: boundedEmptyArtifact(), expected: "NO" },
  ] as const;
  for (const control of controls) await t.test(`control: ${control.name}`, () => {
    const result = evaluateRestaurantHybridLiveArtifact(structuredClone(control.artifact), source);
    assert.equal(result.execution.taskProducedQualifiedResult, control.expected, JSON.stringify(result));
    assert.equal(result.execution.systemBehavior, "SUPPORTED_BY_EVIDENCE", JSON.stringify(result));
  });

  const mutations: Array<{
    name: string;
    artifact: () => any;
    assertCaught: (result: ReturnType<typeof evaluateRestaurantHybridLiveArtifact>) => void;
  }> = [
    {
      name: "M01 explicit party-size field is dropped",
      artifact: () => { const artifact: any = completeArtifact(); delete artifact.finalSnapshot.domainState.intentDraft.partySize; return artifact; },
      assertCaught: (result) => assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED"),
    },
    {
      name: "M03 a second presented candidate borrows A's evidence references",
      artifact: () => {
        const artifact: any = completeArtifact(); const domain = artifact.finalSnapshot.domainState;
        domain.candidates.push({ restaurant: { id: "candidate-b", outletName: "B" } });
        domain.availabilityChecks["candidate-b"] = { status: "AVAILABLE", evidenceIds: ["identity-a", "hard-a", "availability-a"] };
        domain.availability["candidate-b"] = [{ ...domain.availability["candidate-a"][0], id: "offer-b", restaurantId: "candidate-b" }];
        domain.presentedResults.candidateIds.push("candidate-b");
        return artifact;
      },
      assertCaught: (result) => assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_EVALUATED"),
    },
    {
      name: "M04 candidate-scoped availability evidence loses its candidate ID",
      artifact: () => {
        const artifact: any = completeArtifact();
        const availability = artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "availability-a");
        delete availability.candidateId;
        return artifact;
      },
      assertCaught: (result) => assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_EVALUATED"),
    },
    {
      name: "M05 an UNKNOWN availability result is relabelled UNAVAILABLE without negative evidence",
      artifact: () => { const artifact: any = unknownAvailabilityNoResultArtifact(); artifact.finalSnapshot.domainState.availabilityChecks["candidate-a"].status = "UNAVAILABLE"; return artifact; },
      assertCaught: (result) => {
        assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_SATISFIED");
        assert.match(finding(result, "COMPLETION_OUTCOME").observations.join(" "), /Unsupported explicit no-availability conclusion/);
      },
    },
    {
      name: "M05b a no-slot record for a different party cannot support this request",
      artifact: () => {
        const artifact: any = unknownAvailabilityNoResultArtifact(); const domain = artifact.finalSnapshot.domainState;
        domain.availabilityChecks["candidate-a"] = { status: "UNAVAILABLE", evidenceIds: ["negative-a"] };
        domain.readEvidence.push({ evidenceId: "negative-a", kind: "AVAILABILITY", provider: "TABLECHECK", candidateId: "candidate-a", sourceEntityId: "outlet-a", observedAt: artifact.finishedAt, requestFingerprint: "negative", claims: { date: "2026-09-08", partySize: 3, visibleSlots: [], inventoryStatus: "UNAVAILABLE", receptionMode: "UNKNOWN" } });
        return artifact;
      },
      assertCaught: (result) => assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_EVALUATED"),
    },
    {
      name: "M06 expired availability evidence is retained for presentation",
      artifact: () => {
        const artifact: any = completeArtifact(); const domain = artifact.finalSnapshot.domainState;
        domain.availability["candidate-a"][0].expiresAt = "2026-09-08T07:45:00.000Z";
        domain.readEvidence.find((item: any) => item.evidenceId === "availability-a").expiresAt = "2026-09-08T07:45:00.000Z";
        return artifact;
      },
      assertCaught: (result) => assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED"),
    },
    {
      name: "M07 completion tag remains after actual execution records are deleted",
      artifact: () => { const artifact: any = completeArtifact(); artifact.trajectories = []; return artifact; },
      assertCaught: (result) => {
        assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
        assert.equal(finding(result, "FINAL_CLAIM").status, "NOT_SATISFIED");
      },
    },
    {
      name: "M08 normal end is recorded despite a still-present qualified result",
      artifact: () => noResultArtifact(),
      assertCaught: (result) => assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_SATISFIED"),
    },
  ];
  for (const mutation of mutations) await t.test(mutation.name, () => {
    const result = evaluateRestaurantHybridLiveArtifact(mutation.artifact(), source);
    mutation.assertCaught(result);
    assert.notEqual(result.execution.systemBehavior, "SUPPORTED_BY_EVIDENCE", JSON.stringify(result));
  });
});

/** Independent final-claim mutation: do not alter the supporting source evidence. */
function noResultArtifact(): any {
  const artifact: any = completeArtifact();
  artifact.finalSnapshot.domainState.phase = "NO_VERIFIED_RESULT";
  artifact.finalSnapshot.domainState.noVerifiedResult = { endedAt: artifact.finishedAt, investigatedCandidateIds: ["candidate-a"], unresolvedCandidateIds: ["candidate-a"], remainingGaps: ["No fresh slot"] };
  delete artifact.finalSnapshot.domainState.presentedResults;
  return artifact;
}

/** Starts at UNKNOWN with no offer or negative evidence; it is not a positive-slot control in disguise. */
function unknownAvailabilityNoResultArtifact(): any {
  const artifact: any = noResultArtifact();
  const domain = artifact.finalSnapshot.domainState;
  domain.availability = {};
  domain.availabilityChecks["candidate-a"] = { status: "UNKNOWN", evidenceIds: [] };
  domain.noVerifiedResult.unresolvedCandidateIds = ["candidate-a"];
  return artifact;
}

test("executed observation lineage rejects a different candidate or request date", async (t) => {
  for (const mutation of [
    {
      name: "candidate changed",
      mutate: (artifact: any) => {
        const step = artifact.trajectories[0];
        step.agentAction.candidateIds = ["candidate-b"];
        step.observation.candidateIds = ["candidate-b"];
        step.executionMetadata.providerAttempts[0].candidateId = "candidate-b";
      },
    },
    {
      name: "request date changed",
      mutate: (artifact: any) => {
        const step = artifact.trajectories[0];
        step.decisionContext.intentDraft = { ...step.decisionContext.intentDraft, date: "2026-09-09" };
      },
    },
  ] as const) await t.test(mutation.name, () => {
    const artifact: any = completeArtifact();
    mutation.mutate(artifact);
    const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
    assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED", JSON.stringify(result));
    assert.equal(finding(result, "FINAL_CLAIM").status, "NOT_SATISFIED", JSON.stringify(result));
  });
});

test("search-only source evidence can support a fact recommendation", () => {
  const artifact: any = completeArtifact();
  const domain = artifact.finalSnapshot.domainState;
  artifact.materializedCase.semantic.target.goal = "RECOMMENDATION";
  domain.intentDraft.target.goal = "RECOMMENDATION";
  domain.readEvidence.find((item: any) => item.evidenceId === "hard-a").claims = {
    verifiedHardCriteria: ["omakase"], openingHoursMatch: true,
    regularOpeningHours: ["Tuesday: 10:00 AM – 10:00 PM"],
  };
  domain.presentedResults.evidenceIds = ["discovery-a", "identity-a", "hard-a"];
  artifact.trajectories = [{
    ...artifact.trajectories[0],
    decisionContext: { intentDraft: domain.intentDraft },
    observation: { type: "DISCOVERY", candidateIds: ["candidate-a"], evidenceIds: ["discovery-a", "identity-a", "hard-a"] },
  }];
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "SATISFIED", JSON.stringify(result));
  assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "SATISFIED", JSON.stringify(result));
  assert.equal(result.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result));
});

test("a no-result label cannot conceal an independently supported candidate", () => {
  const artifact = noResultArtifact();
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(result.execution.completion, "NO_VERIFIED_RESULT");
  assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_SATISFIED");
  assert.equal(result.execution.systemBehavior, "NOT_SUPPORTED");
  assert.match(finding(result, "COMPLETION_OUTCOME").observations.join(" "), /candidate-a/);
});

test("empty or incomplete investigation records cannot certify no-result completion", async (t) => {
  for (const mode of ["empty", "missing-scope", "proposal-only", "old-request"] as const) {
    await t.test(mode, () => {
      const artifact = noResultArtifact();
      const domain = artifact.finalSnapshot.domainState;
      domain.availability = {}; domain.availabilityChecks = {}; domain.readEvidence = [];
      artifact.trajectories = [];
      if (mode === "empty") { domain.candidates = []; domain.noVerifiedResult = {}; }
      if (mode === "missing-scope") delete domain.noVerifiedResult;
      if (mode === "proposal-only" || mode === "old-request") {
        artifact.trajectories = [{ agentAction: { type: "SEARCH_RESTAURANTS" }, stepOutcome: mode === "proposal-only" ? "REJECTED" : "EXECUTED",
          occurredAt: artifact.finishedAt, decisionContext: { intentDraft: { ...domain.intentDraft, ...(mode === "old-request" ? { date: "2000-01-01" } : {}) } },
          observation: { type: "DISCOVERY", candidateIds: [] }, executionMetadata: { provider: "GOOGLE_PLACES" } }];
      }
      const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
      assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_EVALUATED");
      assert.notEqual(result.execution.systemBehavior, "SUPPORTED_BY_EVIDENCE");
    });
  }
});

test("a recorded current empty search supports only its bounded empty-result scope", () => {
  const artifact = noResultArtifact();
  const domain = artifact.finalSnapshot.domainState;
  domain.candidates = []; domain.availability = {}; domain.availabilityChecks = {}; domain.readEvidence = [];
  domain.noVerifiedResult = { endedAt: artifact.finishedAt, investigatedCandidateIds: [], unresolvedCandidateIds: [], remainingGaps: [] };
  artifact.trajectories = [
    { agentAction: { type: "SEARCH_RESTAURANTS" }, stepOutcome: "EXECUTED", occurredAt: artifact.finishedAt,
      decisionContext: { intentDraft: domain.intentDraft }, observation: { type: "DISCOVERY", candidateIds: [] }, executionMetadata: { provider: "GOOGLE_PLACES", route: "STRUCTURED_ADAPTER" } },
    { agentAction: { type: "END_READ" }, stepOutcome: "TERMINAL", occurredAt: artifact.finishedAt,
      decisionContext: { intentDraft: domain.intentDraft }, observation: { type: "READ_ENDED", candidateIds: [], unresolvedCandidateIds: [] } },
  ];
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "COMPLETION_OUTCOME").status, "SATISFIED");
  assert.equal(result.execution.taskProducedQualifiedResult, "NO");
  assert.ok(result.unassessedDimensions.some(d => /investigation sufficiency/i.test(d)));
  const softPending: any = structuredClone(artifact);
  softPending.materializedCase.semantic.criteria.push({ value: "quiet setting", polarity: "POSITIVE", strength: "SOFT" });
  softPending.finalSnapshot.domainState.intentDraft.criteria.push({ text: "calm atmosphere", polarity: "POSITIVE", strength: "SOFT" });
  const pendingEvaluation = evaluateRestaurantHybridLiveArtifact(softPending, source);
  assert.equal(finding(pendingEvaluation, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED");
  assert.equal(finding(pendingEvaluation, "COMPLETION_OUTCOME").status, "NOT_EVALUATED");
  assert.ok(!finding(pendingEvaluation, "COMPLETION_OUTCOME").observations.some(item => item.includes("No executed")));
  assert.notEqual(pendingEvaluation.execution.taskProducedQualifiedResult, "YES");
  const unfinished = structuredClone(artifact);
  unfinished.loop.status = "STEP_LIMIT";
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(unfinished, source), "COMPLETION_OUTCOME").status, "NOT_SATISFIED", "An old no-result phase must not certify an unfinished execution");
  const orphaned = structuredClone(artifact);
  orphaned.finalSnapshot.domainState.availabilityChecks = { "orphan-candidate": { status: "UNKNOWN", evidenceIds: [] } };
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(orphaned, source), "COMPLETION_OUTCOME").status, "NOT_SATISFIED", "An empty scope cannot conceal current candidate checks");
  // Same claimed ending, but the source actually returned a candidate: contradictory scope must fail.
  artifact.trajectories[0].observation.candidateIds = ["omitted-candidate"];
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "COMPLETION_OUTCOME").status, "NOT_SATISFIED");
});

test("UNKNOWN without independently checkable remaining gaps is not a certified no-result", () => {
  const artifact = noResultArtifact();
  const domain = artifact.finalSnapshot.domainState;
  domain.availability = {};
  domain.availabilityChecks["candidate-a"] = { status: "UNKNOWN", evidenceIds: [], reasonCode: "AVAILABILITY_SOURCES_EXHAUSTED" };
  artifact.trajectories[0].executionMetadata.providerAttempts[0].outcome = "PROVIDER_FAILURE";
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_EVALUATED");
  const internal: any = structuredClone(artifact);
  internal.status = "EXECUTION_FAILURE";
  internal.loop.status = "EXECUTION_FAILURE";
  internal.finalSnapshot.domainState.failure = { code: "AGENT_EXECUTION_FAILED", message: "Router invariant failed." };
  const internalEvaluation = evaluateRestaurantHybridLiveArtifact(internal, source);
  assert.equal(internalEvaluation.execution.completion, "INTERNAL_EXECUTION_FAILURE");
  assert.equal(finding(internalEvaluation, "COMPLETION_OUTCOME").status, "NOT_SATISFIED");
});

test("diagnostic evaluator rejects wrong request values, LOW identity, and evidence expired at presentation", () => {
  const artifact: any = completeArtifact();
  const domain = artifact.finalSnapshot.domainState;
  domain.availability["candidate-a"][0].dateTime = "2000-01-01T03:00:00+09:00";
  domain.availability["candidate-a"][0].partySize = 99;
  domain.availability["candidate-a"][0].expiresAt = "2026-09-08T07:45:00.000Z";
  domain.readEvidence.find((item: any) => item.evidenceId === "availability-a").claims = { date: "2000-01-01", partySize: 99, visibleSlots: ["03:00"] };
  domain.readEvidence.find((item: any) => item.evidenceId === "availability-a").expiresAt = "2026-09-08T07:45:00.000Z";
  domain.readEvidence.find((item: any) => item.evidenceId === "identity-a").entityMatch.confidence = "LOW";
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  assert.equal(finding(result, "FINAL_CLAIM").status, "NOT_SATISFIED");
  assert.equal(result.execution.taskProducedQualifiedResult, "NO");
});

test("candidate evidence cannot be borrowed from another presented candidate", () => {
  const artifact: any = completeArtifact();
  const domain = artifact.finalSnapshot.domainState;
  domain.candidates.push({ restaurant: { id: "candidate-b", outletName: "B" } });
  domain.availabilityChecks["candidate-b"] = { status: "AVAILABLE", evidenceIds: ["identity-a", "hard-a", "availability-a"] };
  domain.availability["candidate-b"] = [{ ...domain.availability["candidate-a"][0], id: "offer-b", restaurantId: "candidate-b" }];
  domain.presentedResults.candidateIds.push("candidate-b");
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
  assert.equal(result.execution.systemBehavior, "NOT_EVALUATED");
});

test("missing trajectory and empty resource object remain not evaluated", () => {
  const artifact: any = completeArtifact();
  delete artifact.trajectories;
  artifact.resourceUsage = {};
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "NOT_EVALUATED");
  assert.equal(finding(result, "RESOURCES").status, "NOT_EVALUATED");
  assert.equal(result.execution.systemBehavior, "NOT_EVALUATED");
});

test("current runner resource ceilings are required and reject over-budget work", () => {
  const artifact: any = completeArtifact();
  delete artifact.limits;
  artifact.runCeilings = { maxAutomaticBrowserMs: 300, maxAgentSteps: 30, maxBrowserModelCallsTotal: 120, maxModelCalls: 50 };
  artifact.resourceUsage.modelCallsStarted = 2;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "SATISFIED");
  artifact.resourceUsage.elapsedMs = 301;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "NOT_SATISFIED");
  artifact.resourceUsage.elapsedMs = 100;
  for (const [field, over] of [["agentDecisions", 31], ["browserModelCalls", 121]] as const) {
    const original = artifact.resourceUsage[field];
    artifact.resourceUsage[field] = over;
    assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "NOT_SATISFIED", field);
    artifact.resourceUsage[field] = original;
  }
  delete artifact.runCeilings.maxAgentSteps;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "NOT_EVALUATED");
  delete artifact.runCeilings;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "NOT_EVALUATED");
});

test("current Runner model-call ceiling counts started attempts and known overages outrank missing limits", () => {
  const artifact: any = completeArtifact();
  delete artifact.limits;
  artifact.runCeilings = { maxAutomaticBrowserMs: 300, maxAgentSteps: 30, maxBrowserModelCallsTotal: 120, maxModelCalls: 1 };
  artifact.modelInvocations = [
    { purpose: "restaurant_agent_decide", outcome: "SUCCEEDED" },
    { purpose: "restaurant_agent_decide", outcome: "TIMEOUT" },
  ];
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "NOT_SATISFIED", "two recorded starts exceed one permitted call");
  delete artifact.runCeilings.maxAgentSteps;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "NOT_SATISFIED", "a known overage survives another missing ceiling");
  artifact.runCeilings.maxAgentSteps = 30;
  artifact.runCeilings.maxModelCalls = 3;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "NOT_EVALUATED", "records alone may omit an in-flight started call");
  artifact.resourceUsage.modelCallsStarted = 2;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "SATISFIED");
  artifact.resourceUsage.modelCallsStarted = 4;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "NOT_SATISFIED", "failed or incomplete attempts still count at start");
});

test("a changed request version can legitimately recheck a candidate", () => {
  const artifact: any = completeArtifact();
  artifact.trajectories.push({ stateHashBefore: "request-v2", stepOutcome: "EXECUTED", agentAction: { type: "CHECK_AVAILABILITY", candidateIds: ["candidate-a"] }, executionMetadata: { providerAttempts: [{ candidateId: "candidate-a", provider: "TABLECHECK", outcome: "AVAILABLE" }] } });
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "SATISFIED");
});

test("the same authoritative request with two executed reads is a duplicate", () => {
  const artifact: any = completeArtifact();
  const intent = { date: "2026-09-08", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" } };
  artifact.trajectories[0].decisionContext = { intent };
  artifact.trajectories.push({ stateHashBefore: "different-state", stepOutcome: "EXECUTED", decisionContext: { intent }, agentAction: { type: "CHECK_AVAILABILITY", candidateIds: ["candidate-a"] }, executionMetadata: { providerAttempts: [{ candidateId: "candidate-a", provider: "TABLECHECK", outcome: "AVAILABLE" }] } });
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED");
});

test("a recorded user refresh is a legal recheck of the same authoritative request", () => {
  const artifact: any = completeArtifact();
  const intent = { date: "2026-09-08", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" } };
  artifact.trajectories[0].decisionContext = { intent };
  artifact.trajectories.push({ stateHashBefore: "same-request-after-refresh", stepOutcome: "EXECUTED", decisionContext: { intent }, agentAction: { type: "CHECK_AVAILABILITY", candidateIds: ["candidate-a"] }, executionMetadata: { recheckReason: "USER_REQUESTED_REFRESH", providerAttempts: [{ candidateId: "candidate-a", provider: "TABLECHECK", outcome: "AVAILABLE" }] } });
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "INVESTIGATION_BEHAVIOR").status, "SATISFIED");
});

test("an arbitrary recheck label does not exempt a duplicate availability read", () => {
  const artifact: any = completeArtifact();
  const intent = { date: "2026-09-08", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" } };
  artifact.trajectories[0].decisionContext = { intent };
  artifact.trajectories.push({ stateHashBefore: "same-request", stepOutcome: "EXECUTED", decisionContext: { intent }, agentAction: { type: "CHECK_AVAILABILITY", candidateIds: ["candidate-a"] }, executionMetadata: { recheckReason: "because-model-said-so", providerAttempts: [{ candidateId: "candidate-a", provider: "TABLECHECK", outcome: "AVAILABLE" }] } });
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED");
});

test("fact investigation is subject to the same duplicate check as availability", () => {
  const artifact: any = completeArtifact();
  const intent = { target: { goal: "RECOMMENDATION" }, area: { query: "near Shibuya" } };
  artifact.trajectories = [
    { stateHashBefore: "request-v1", stepOutcome: "EXECUTED", decisionContext: { intent }, agentAction: { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: ["candidate-a"] }, executionMetadata: {} },
    { stateHashBefore: "request-v2", stepOutcome: "EXECUTED", decisionContext: { intent }, agentAction: { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: ["candidate-a"] }, executionMetadata: {} },
  ];
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED");
  artifact.trajectories[1].executionMetadata.recheckReason = "USER_REQUESTED_REFRESH";
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "INVESTIGATION_BEHAVIOR").status, "SATISFIED");
});

test("a derived restaurant fact needs its cited candidate-bound source evidence", () => {
  const artifact: any = completeArtifact();
  const domain = artifact.finalSnapshot.domainState;
  domain.materializedCase = undefined;
  domain.readEvidence.push({ evidenceId: "judgment-a", kind: "RESTAURANT_FACT", provider: "MODEL_JUDGMENT", candidateId: "candidate-a", observedAt: "2026-09-08T07:45:00.000Z", requestFingerprint: "judgment", claims: { verifiedHardCriteria: ["omakase"], supportingEvidenceIds: ["hard-a"] } });
  domain.presentedResults.evidenceIds.push("judgment-a");
  artifact.trajectories[0].observation.evidenceIds.push("judgment-a");
  const accepted = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(accepted, "REQUIRED_EVIDENCE").status, "SATISFIED");
  domain.readEvidence.find((item: any) => item.evidenceId === "judgment-a").claims.supportingEvidenceIds = ["not-a-source"];
  const rejected = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(rejected, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
});

test("complete availability time windows are evaluated without H001 exact-time assumptions", () => {
  const artifact: any = completeArtifact();
  artifact.materializedCase.semantic.time = { start: "18:00", end: "20:00" };
  artifact.finalSnapshot.domainState.intentDraft.timeWindow = { earliest: "18:00", latest: "20:00" };
  artifact.finalSnapshot.domainState.availability["candidate-a"][0].dateTime = "2026-09-08T19:30:00+09:00";
  artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "availability-a").claims = { date: "2026-09-08", partySize: 2, visibleSlots: ["19:30"] };
  artifact.diagnostics.browserTrace[1].detail.queryRegions[0].markup = '<section data-testid="Venue Availability"><a data-reservation-source="/en/shops/outlet-a/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="19:30">19:30</a></section>';
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "SATISFIED");
  assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "SATISFIED");
});

test("H004 fact-only presentation requires applicable opening hours, not an availability offer", () => {
  const artifact: any = completeArtifact();
  artifact.caseId = "h004";
  artifact.materializedCase.id = "h004";
  artifact.materializedCase.semantic = {
    target: { goal: "RECOMMENDATION" },
    date: { value: "2026-09-08" },
    time: { start: "12:00", end: "17:00" },
    location: { value: "nearby", relation: "NEAR_USER" },
    criteria: [{ value: "cafe", polarity: "POSITIVE", strength: "HARD" }, { value: "good for meeting a friend", polarity: "POSITIVE", strength: "SOFT" }],
  };
  const domain = artifact.finalSnapshot.domainState;
  domain.intentDraft = { timezone: fixtureIntent.timezone, target: { goal: "RECOMMENDATION", query: "recommend a cafe" }, date: "2026-09-08", timeWindow: { earliest: "12:00", latest: "17:00" }, area: { query: "near Higashi-Ginza" }, criteria: [{ text: "cafe", polarity: "POSITIVE", strength: "HARD" }, { text: "good for meeting a friend", polarity: "POSITIVE", strength: "SOFT" }] };
  domain.availabilityChecks = {};
  domain.availability = {};
  domain.presentedResults = { candidateIds: ["candidate-a"], evidenceIds: ["discovery-a", "identity-a", "hard-a"], presentedAt: "2026-09-08T07:45:37.000Z" };
  domain.readEvidence = domain.readEvidence.filter((item: any) => item.evidenceId !== "availability-a");
  domain.readEvidence.find((item: any) => item.evidenceId === "discovery-a").claims = { areaMatch: true, areaQuery: "nearby", areaMatchBasis: "EVALUATION_LOCATION_RADIUS", evaluationLocationLabel: "Higashi-Ginza public evaluation point" };
  const identity = domain.readEvidence.find((item: any) => item.evidenceId === "identity-a");
  identity.provider = "GOOGLE_PLACES";
  identity.sourceEntityId = "google-place-a";
  const facts = domain.readEvidence.find((item: any) => item.evidenceId === "hard-a");
  facts.provider = "GOOGLE_PLACES";
  facts.sourceEntityId = "google-place-a";
  facts.claims = { verifiedHardCriteria: ["cafe"], regularOpeningHours: ["Tuesday: 10:00 AM - 6:00 PM"], openingHoursMatch: true, openingHoursMatchedWindow: "12:00-17:00" };
  artifact.trajectories[0].decisionContext = { intentDraft: domain.intentDraft };
  const accepted = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(accepted, "REQUIRED_EVIDENCE").status, "SATISFIED", JSON.stringify(finding(accepted, "REQUIRED_EVIDENCE").observations));
  assert.equal(finding(accepted, "FINAL_CLAIM").status, "SATISFIED");
  domain.intentDraft.criteria[1].text = "suitable for meeting up with a friend";
  const softRewrite = evaluateRestaurantHybridLiveArtifact(artifact, source, { criterionEquivalences: testEquivalences() });
  assert.equal(finding(softRewrite, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED");
  assert.match(finding(softRewrite, "AUTHORITATIVE_CONDITIONS").directCause, /independent semantic review/);
  assert.ok(softRewrite.unassessedDimensions.some((item) => item.includes("Criterion text differs")));
  // A pending SOFT semantic review must not erase independently supported facts.
  assert.equal(finding(softRewrite, "REQUIRED_EVIDENCE").status, "SATISFIED");
  assert.equal(finding(softRewrite, "FINAL_CLAIM").status, "NOT_EVALUATED");
  assert.notEqual(softRewrite.execution.taskProducedQualifiedResult, "YES");
  for (const corrupt of [
    (copy: any) => { copy.finalSnapshot.domainState.readEvidence.find((e: any) => e.evidenceId === "hard-a").claims.verifiedHardCriteria = []; },
    (copy: any) => { copy.finalSnapshot.domainState.readEvidence.find((e: any) => e.evidenceId === "hard-a").candidateId = "wrong-candidate"; },
    (copy: any) => { copy.trajectories[0].decisionContext.intentDraft.timeWindow = { earliest: "19:00", latest: "19:00" }; },
  ]) {
    const copy = structuredClone(artifact);
    corrupt(copy);
    const rejected = evaluateRestaurantHybridLiveArtifact(copy, source);
    assert.notEqual(finding(rejected, "REQUIRED_EVIDENCE").status, "SATISFIED");
    assert.notEqual(rejected.execution.taskProducedQualifiedResult, "YES");
  }
  delete facts.claims.openingHoursMatch;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
});

test("UNSPECIFIED is nonblocking while a HARD strength mismatch remains material", () => {
  const artifact: any = completeArtifact();
  artifact.materializedCase.semantic.criteria = [{ value: "quiet", polarity: "POSITIVE", strength: "UNSPECIFIED" }];
  artifact.finalSnapshot.domainState.intentDraft.criteria = [{ text: "quiet", polarity: "POSITIVE", strength: "UNSPECIFIED" }];
  artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a").claims = { verifiedHardCriteria: [] };
  const unspecified = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(unspecified, "REQUIRED_EVIDENCE").status, "SATISFIED", "UNSPECIFIED does not demand fact evidence");
  artifact.finalSnapshot.domainState.intentDraft.criteria[0].strength = "SOFT";
  const semanticReview = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(semanticReview, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED", "UNSPECIFIED↔SOFT remains semantic review");
  artifact.finalSnapshot.domainState.intentDraft.criteria[0].strength = "HARD";
  const hardMismatch = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(hardMismatch, "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED", "UNSPECIFIED→HARD is not a nonblocking rewrite");
});

test("criterion comparison preserves text-plus-polarity identities as a multiset", () => {
  // This is the independent-review reproducer: a Map keyed only by text
  // collapsed these two valid criteria and invented a polarity conflict.
  const artifact: any = completeArtifact();
  const completeCriteria = [
    { value: "quiet", polarity: "POSITIVE", strength: "UNSPECIFIED" },
    { value: "quiet", polarity: "NEGATIVE", strength: "HARD" },
  ];
  artifact.materializedCase.semantic.criteria = completeCriteria;
  artifact.finalSnapshot.domainState.intentDraft.criteria = completeCriteria.map(({ value, ...criterion }: any) => ({ text: value, ...criterion }));
  artifact.trajectories[0].decisionContext = { intentDraft: artifact.finalSnapshot.domainState.intentDraft };
  artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a").claims = {
    verifiedNegativeCriteria: ["quiet"],
  };
  const identical = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(identical, "AUTHORITATIVE_CONDITIONS").status, "SATISFIED", JSON.stringify(finding(identical, "AUTHORITATIVE_CONDITIONS")));

  // Retain the meaningful exact-text polarity mutation: POSITIVE and NEGATIVE
  // are separate identities, so removing one and adding the other must fail.
  artifact.finalSnapshot.domainState.intentDraft.criteria = [
    { text: "quiet", polarity: "NEGATIVE", strength: "HARD" },
    { text: "quiet", polarity: "NEGATIVE", strength: "HARD" },
  ];
  const polarityChanged = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(polarityChanged, "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED");
  assert.match(finding(polarityChanged, "AUTHORITATIVE_CONDITIONS").observations.join(" "), /criteria polarity=quiet/);
});

test("grounding follows the actual authoritative criterion while textual Gold differences remain independently unresolved", () => {
  // H002-shaped label control: the source fact names the Runtime criterion,
  // while the older Gold label is shorter. This must not fabricate a missing
  // evidence/lineage failure, nor turn the semantic difference into AUTO_PASS.
  const artifact: any = completeArtifact();
  artifact.materializedCase.semantic.criteria = [{ value: "hot pot restaurant", polarity: "NEGATIVE", strength: "HARD" }];
  artifact.finalSnapshot.domainState.intentDraft.criteria = [{ text: "hot-pot restaurants", polarity: "NEGATIVE", strength: "HARD" }];
  artifact.trajectories[0].decisionContext = { intentDraft: artifact.finalSnapshot.domainState.intentDraft };
  artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a").claims = {
    verifiedNegativeCriteria: ["hot-pot restaurants"],
  };
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source, { criterionEquivalences: testEquivalences() });
  assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED");
  assert.match(finding(result, "AUTHORITATIVE_CONDITIONS").directCause, /independent semantic review/);
  assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "SATISFIED");
  assert.equal(finding(result, "FINAL_CLAIM").status, "NOT_EVALUATED");

  artifact.finalSnapshot.domainState.intentDraft.criteria[0] = { text: "hot pot restaurant", polarity: "POSITIVE", strength: "HARD" };
  const polarityConflict = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(polarityConflict, "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED");
  assert.match(finding(polarityConflict, "AUTHORITATIVE_CONDITIONS").observations.join(" "), /criteria polarity/);
});

test("a later HARD criterion cannot reuse an old UNSPECIFIED observation", () => {
  // Actual Proposal -> validation -> Compiler -> Reducer. The later user turn
  // changes only quiet's strength, retaining the unrelated omakase condition.
  const initial = {
    schemaVersion: "3" as const,
    timezone: "Asia/Tokyo" as const,
    target: { goal: "AVAILABILITY" as const, query: "find a table" },
    date: "2026-09-08",
    partySize: 2,
    timeWindow: { earliest: "19:00", latest: "19:00" },
    area: { query: "near Shibuya" },
    criteria: [{ text: "omakase", polarity: "POSITIVE" as const, strength: "HARD" as const }],
  };
  const applyProposal = (current: RestaurantIntentDraft, strength: "UNSPECIFIED" | "HARD") => {
    const parsed = validateRestaurantSemanticProposal({ schemaVersion: "3", facts: [{
      field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "quiet", polarity: "POSITIVE", strength },
    }] });
    assert.equal(parsed.valid, true);
    if (!parsed.valid) throw new Error("criterion proposal was unexpectedly invalid");
    const compiled = compileRestaurantSemanticProposal(parsed.value);
    assert.equal(compiled.status, "COMPILED");
    if (compiled.status !== "COMPILED") throw new Error("criterion proposal was unexpectedly conflicting");
    return applyRestaurantIntentPatch(current, compiled.patch);
  };
  const beforeUpgrade = applyProposal(initial, "UNSPECIFIED");
  const finalIntent = applyProposal(beforeUpgrade, "HARD");
  assert.deepEqual(finalIntent.criteria, [
    { text: "omakase", polarity: "POSITIVE", strength: "HARD" },
    { text: "quiet", polarity: "POSITIVE", strength: "HARD" },
  ]);

  const accepted: any = completeArtifact();
  accepted.materializedCase.semantic.criteria = [
    { value: "omakase", polarity: "POSITIVE", strength: "HARD" },
    { value: "quiet", polarity: "POSITIVE", strength: "HARD" },
  ];
  accepted.finalSnapshot.domainState.intentDraft = finalIntent;
  accepted.trajectories[0].decisionContext = { intentDraft: finalIntent };
  accepted.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a").claims = {
    verifiedHardCriteria: ["omakase", "quiet"],
  };
  const control = evaluateRestaurantHybridLiveArtifact(accepted, source);
  assert.equal(finding(control, "AUTHORITATIVE_CONDITIONS").status, "SATISFIED");
  assert.equal(finding(control, "REQUIRED_EVIDENCE").status, "SATISFIED");
  assert.equal(finding(control, "FINAL_CLAIM").status, "SATISFIED");

  // Negative control: source evidence is unchanged, but its executed context
  // predates the HARD upgrade. The old UNSPECIFIED observation must no longer
  // be accepted as a current-request lineage for the presented result.
  const stale: any = structuredClone(accepted);
  stale.trajectories[0].decisionContext = { intentDraft: beforeUpgrade };
  const rejected = evaluateRestaurantHybridLiveArtifact(stale, source);
  assert.equal(finding(rejected, "AUTHORITATIVE_CONDITIONS").status, "SATISFIED");
  assert.equal(finding(rejected, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  assert.equal(finding(rejected, "FINAL_CLAIM").status, "NOT_SATISFIED");
  assert.match(finding(rejected, "REQUIRED_EVIDENCE").observations.join(" "), /lacks an executed same-candidate applicable-request observation/);
});

test("generic negative HARD criteria require a cited source judgment and preserve a conflict", () => {
  const artifact: any = completeArtifact();
  artifact.materializedCase.semantic.criteria = [{ value: "hot pot restaurant", polarity: "NEGATIVE", strength: "HARD" }];
  artifact.finalSnapshot.domainState.intentDraft.criteria = [{ text: "hot pot restaurant", polarity: "NEGATIVE", strength: "HARD" }];
  const facts = artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a");
  facts.claims = { verifiedNegativeCriteria: ["hot pot restaurant"] };
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "REQUIRED_EVIDENCE").status, "SATISFIED");
  facts.claims = { violatedNegativeCriteria: ["hot pot restaurant"] };
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  facts.claims = { restaurantTypeFacts: ["restaurant"] };
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
});

test("fact-only evaluation rejects a derived opening claim contradicted by raw hours", () => {
  const artifact: any = completeArtifact();
  artifact.materializedCase.semantic.target = { goal: "RECOMMENDATION" };
  artifact.materializedCase.semantic.time = { start: "19:00", end: "19:00" };
  artifact.finalSnapshot.domainState.intentDraft.target = { goal: "RECOMMENDATION", query: "cafe" };
  artifact.finalSnapshot.domainState.intentDraft.timeWindow = { earliest: "19:00", latest: "19:00" };
  artifact.finalSnapshot.domainState.availabilityChecks = {}; artifact.finalSnapshot.domainState.availability = {};
  artifact.finalSnapshot.domainState.presentedResults.evidenceIds = ["discovery-a", "identity-a", "hard-a"];
  artifact.finalSnapshot.domainState.readEvidence = artifact.finalSnapshot.domainState.readEvidence.filter((item: any) => item.evidenceId !== "availability-a");
  const facts = artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a");
  facts.claims = { verifiedHardCriteria: ["yakiniku"], regularOpeningHours: ["Tuesday: Closed"], openingHoursMatch: true };
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
});

test("an offer inside a time window must be one of the cited availability slots", () => {
  const artifact: any = completeArtifact();
  artifact.materializedCase.semantic.time = { start: "18:00", end: "20:00" };
  artifact.finalSnapshot.domainState.intentDraft.timeWindow = { earliest: "18:00", latest: "20:00" };
  artifact.finalSnapshot.domainState.availability["candidate-a"][0].dateTime = "2026-09-08T19:00:00+09:00";
  artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "availability-a").claims.visibleSlots = ["18:00"];
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  assert.match(finding(result, "REQUIRED_EVIDENCE").observations.join("\n"), /offer time is not present/);
});

test("evidence observed after presentation is a conflict while a missing observation is not evaluated", () => {
  const future: any = completeArtifact();
  future.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "availability-a").observedAt = "2099-01-01T00:00:00.000Z";
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(future, source), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  const missing: any = completeArtifact();
  delete missing.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "availability-a").observedAt;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(missing, source), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
});

test("a missing final authoritative intentDraft is not evidence of a condition conflict", () => {
  const artifact: any = completeArtifact();
  delete artifact.finalSnapshot.domainState.intentDraft;
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED");
  assert.equal(finding(result, "FINAL_CLAIM").status, "NOT_EVALUATED");
  assert.match(finding(result, "AUTHORITATIVE_CONDITIONS").directCause, /lacks a required authority record/);
});

test("evaluation failure creates a separate immutable failure sidecar", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-eval-"));
  const artifactPath = join(directory, "run.result.json");
  const outcome = await evaluateArtifactAfterFinish(artifactPath, async () => { throw Object.assign(new Error("nope"), { code: "EVAL_BAD" }); });
  assert.equal(outcome.evaluationFailure, "EVAL_BAD");
  assert.ok(outcome.failurePath);
  assert.equal(JSON.parse(await readFile(outcome.failurePath!, "utf8")).status, "EVALUATION_FAILED");
});

test("a saved exception artifact remains intact when post-finish evaluation fails", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-eval-finish-"));
  const journal = await startDiagnosticRun(directory, { mode: "HYBRID_LIVE_READ" });
  await journal.finish({ status: "FAILED", stage: "AGENT_LOOP", failureCode: "MODEL_FAILURE" });
  const before = await readFile(journal.resultPath, "utf8");
  const outcome = await evaluateArtifactAfterFinish(journal.resultPath, async () => { throw new Error("evaluator unavailable"); });
  assert.equal(outcome.evaluationFailure, "EVALUATION_FAILED");
  assert.equal(await readFile(journal.resultPath, "utf8"), before);
});

test("explicit alternative permission and equivalent area labels are independently checked", () => {
  const artifact: any = completeArtifact();
  const domain = artifact.finalSnapshot.domainState;
  artifact.materializedCase.semantic.permittedAlternativeTimeWindow = {earliest:'18:30',latest:'19:30'};
  domain.intentDraft.permittedAlternativeTimeWindow = {earliest:'18:30',latest:'19:30'};
  domain.intentDraft.area.query = 'Shibuya';
  domain.readEvidence.find((e: any)=>e.kind==='DISCOVERY').claims.areaQuery = 'Shibuya';
  const offer = domain.availability['candidate-a'][0];
  offer.dateTime = '2026-09-08T18:30:00+09:00'; offer.alternativeToRequestedTime = true;
  domain.readEvidence.find((e:any)=>e.kind==='AVAILABILITY').claims.visibleSlots = ['18:30'];
  artifact.diagnostics.browserTrace[1].detail.queryRegions[0].markup = '<section data-testid="Venue Availability"><a data-reservation-source="/en/shops/outlet-a/reserve" data-reservation-date="2026-09-08" data-reservation-party="2" data-reservation-time="18:30">18:30</a></section>';
  assert.equal(evaluateRestaurantHybridLiveArtifact(artifact,source).execution.taskProducedQualifiedResult,'YES');
  for (const mutate of [
    (a:any)=>{delete a.materializedCase.semantic.permittedAlternativeTimeWindow},
    (a:any)=>{a.finalSnapshot.domainState.intentDraft.permittedAlternativeTimeWindow.latest='20:00'},
    (a:any)=>{a.finalSnapshot.domainState.availability['candidate-a'][0].dateTime='2026-09-08T20:00:00+09:00'},
    (a:any)=>{delete a.finalSnapshot.domainState.availability['candidate-a'][0].alternativeToRequestedTime},
    (a:any)=>{a.finalSnapshot.domainState.readEvidence.find((e:any)=>e.kind==='DISCOVERY').claims.areaQuery='Shinjuku'},
  ]) {
    const changed=structuredClone(artifact);mutate(changed);
    assert.equal(evaluateRestaurantHybridLiveArtifact(changed,source).execution.taskProducedQualifiedResult,'NO');
  }
});


test("E2 checks actual reads separately from discovered unresolved and unread scope", () => {
  const artifact:any=unknownAvailabilityNoResultArtifact();const domain=artifact.finalSnapshot.domainState;
  domain.candidates.push({restaurant:{id:"candidate-b",outletName:"B"}});
  domain.noVerifiedResult.remainingGaps=["A: availability UNKNOWN (SOURCE_LIMIT); facts NOT_CHECKED","B: availability NOT_CHECKED; facts NOT_CHECKED"];
  domain.noVerifiedResult.unresolvedCandidateIds=["candidate-a","candidate-b"];
  artifact.trajectories[0].occurredAt=artifact.finishedAt;
  artifact.trajectories.unshift({agentAction:{type:"SEARCH_RESTAURANTS"},stepOutcome:"EXECUTED",occurredAt:artifact.finishedAt,decisionContext:{intentDraft:domain.intentDraft},observation:{type:"DISCOVERY",candidateIds:["candidate-a","candidate-b"]},executionMetadata:{provider:"GOOGLE_PLACES"}});
  artifact.trajectories.push({agentAction:{type:"END_READ"},stepOutcome:"TERMINAL",occurredAt:artifact.finishedAt,decisionContext:{intentDraft:domain.intentDraft},observation:{type:"READ_ENDED",candidateIds:["candidate-a"],unresolvedCandidateIds:["candidate-a","candidate-b"],remainingGaps:domain.noVerifiedResult.remainingGaps}});
  assert.notEqual(finding(evaluateRestaurantHybridLiveArtifact(artifact,source),"COMPLETION_OUTCOME").status,"NOT_SATISFIED");
  const factsOnly=structuredClone(artifact);
  factsOnly.trajectories[1].agentAction.type="INVESTIGATE_CANDIDATE_FACTS";
  factsOnly.trajectories[1].observation.type="CANDIDATE_FACTS_UNKNOWN";
  assert.notEqual(finding(evaluateRestaurantHybridLiveArtifact(factsOnly,source),"COMPLETION_OUTCOME").status,"NOT_SATISFIED","production fact reading observation is an investigated record");
  const fabricated=structuredClone(artifact);
  fabricated.finalSnapshot.domainState.noVerifiedResult.investigatedCandidateIds.push("candidate-b");
  fabricated.trajectories.at(-1).observation.candidateIds.push("candidate-b");
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(fabricated,source),"COMPLETION_OUTCOME").status,"NOT_SATISFIED","a declared read without executed reading remains false");
  const missingGap=structuredClone(artifact);missingGap.finalSnapshot.domainState.noVerifiedResult.remainingGaps.pop();missingGap.trajectories.at(-1).observation.remainingGaps=missingGap.finalSnapshot.domainState.noVerifiedResult.remainingGaps;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(missingGap,source),"COMPLETION_OUTCOME").status,"NOT_SATISFIED","unread discovered candidate must be disclosed");
});

function systemBoundedArtifact(): any {
  const artifact=noResultArtifact(), domain=artifact.finalSnapshot.domainState;
  domain.candidates=[];domain.availability={};domain.availabilityChecks={};domain.factChecks={};domain.readEvidence=[];
  const termination={type:"TIMEOUT",reasonCode:"AGENT_LOOP_TIMEOUT",isSystemReason:false,initiator:"SYSTEM"};
  domain.noVerifiedResult={endedAt:artifact.finishedAt,investigatedCandidateIds:[],unresolvedCandidateIds:[],remainingGaps:["No source completed before bounded timeout"],termination};
  artifact.trajectories=[{stepOutcome:"TERMINAL",occurredAt:artifact.finishedAt,stateVersionAfter:artifact.finalSnapshot.version,observation:{type:"READ_ENDED",candidateIds:[],unresolvedCandidateIds:[],termination}}];
  artifact.events=[{trace:{actor:"SYSTEM"},occurredAt:artifact.finishedAt,event:{type:"AGENT_LOOP_TERMINATED",termination:"TIMEOUT",reasonCode:"AGENT_LOOP_TIMEOUT",reason:"Bounded deadline"}}];
  return artifact;
}
test("P2-0 evaluator audits structured system READ_ENDED as a bounded outcome",()=>{
  const result=evaluateRestaurantHybridLiveArtifact(systemBoundedArtifact(),source);
  assert.equal(finding(result,"COMPLETION_OUTCOME").status,"SATISFIED");
  assert.equal(result.execution.taskProducedQualifiedResult,"NO");
});

for (const mode of ["system-cause", "forged-provider-cause", "different-observation", "missing-event", "invented-investigation"] as const) test(`P2-0 structured ending rejects ${mode}`,()=>{
  const a=systemBoundedArtifact();
  if(mode==="system-cause")a.finalSnapshot.domainState.noVerifiedResult.termination.isSystemReason=true;
  if(mode==="forged-provider-cause")a.finalSnapshot.domainState.noVerifiedResult.termination.reasonCode="PROVIDER_REJECTED";
  if(mode==="different-observation")a.trajectories[0].observation.termination={...a.trajectories[0].observation.termination,type:"STEP_LIMIT"};
  if(mode==="missing-event")a.events=[];
  if(mode==="invented-investigation")a.finalSnapshot.domainState.noVerifiedResult.investigatedCandidateIds=["invented"];
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(a,source),"COMPLETION_OUTCOME").status,"NOT_SATISFIED");
});

test('frozen public GET review is checked independently including its query grammar',()=>{
 const origin='https://public-search.example';
 const rule={origin,pathname:'/search/',methods:['GET'],resourceTypes:['fetch'],queryKeyRules:{required:['queryProfile','hits'],allowed:['scope']}};
 const reviewed=parseReviewedReads(Buffer.from(JSON.stringify([rule])),'TEST_ONLY/reviewed-reads.json');
 const request={outcome:'ADMITTED',origin,pathname:'/search/',method:'GET',resourceType:'fetch',queryKeys:['queryProfile','hits']};
 const audit=(patch:Record<string,unknown>={})=>auditReadOnlyTrace([{kind:'SESSION_OPENED',detail:{readNetworkBoundary:'INSTALLED'}},{kind:'NETWORK',networkRequests:[{...request,...patch}]}] as any,[],false,reviewed);
 assert.equal(audit().status,'ABSENT','explicit frozen public GET declaration must be honored');
 for(const patch of [{queryKeys:['queryProfile','hits','unknown']},{queryKeys:['queryProfile']},{method:'POST'},{origin:'https://other.example'},{pathname:'/other/'},{resourceType:'document'}])assert.equal(audit(patch).status,'PRESENT',JSON.stringify(patch));
});


test("S0 independently binds browser GET preflight to frozen review and protocol facts", () => {
  const origin = "https://public-search.example", requestOrigin = "https://public-page.example";
  const rule = { origin, pathname: "/search/", methods: ["GET"], resourceTypes: ["fetch"],
    queryKeyRules: { required: ["queryProfile", "hits"] }, corsPreflight: { requestOrigin, requestedHeaderNames: ["x-api-key"] } };
  const reviewed = parseReviewedReads(Buffer.from(JSON.stringify([rule])), "TEST_ONLY/cors-review.json");
  const request = { outcome: "ADMITTED", origin, pathname: "/search/", method: "OPTIONS", resourceType: "other", queryKeys: ["queryProfile", "hits"],
    corsPreflight: { initiator: "BROWSER_PREFLIGHT", secFetchMode: "cors", requestOrigin, requestedMethod: "GET", requestedHeaderNames: ["x-api-key"], bodyBytes: 0 } };
  const audit = (patch: Record<string, unknown> = {}, review = reviewed) => auditReadOnlyTrace([{ kind: "SESSION_OPENED", detail: { readNetworkBoundary: "INSTALLED" } }, { kind: "NETWORK", networkRequests: [{ ...request, ...patch }] }] as any, [], false, review);
  assert.equal(audit().status, "ABSENT");
  assert.equal(audit({ resourceType: "xhr" }).status, "ABSENT", "Chromium also labels actual browser preflight XHR");
  const decoded = readDiagnosticRun({ diagnostics: { browserTrace: [{ kind: "SESSION_OPENED", detail: { readNetworkBoundary: "INSTALLED" } }, { kind: "NETWORK", detail: [request] }] } });
  assert.equal(auditReadOnlyTrace(decoded.record.diagnostics!.browserTrace!, [], false, reviewed).status, "ABSENT", "actual evaluator decoder must preserve handshake evidence");
  for (const patch of [{ pathname: "/other/" }, { origin: "https://unreviewed.example" }, { queryKeys: ["queryProfile", "hits", "unreviewed"] },
    ...[{ requestedMethod: "POST" }, { requestedHeaderNames: ["x-api-key", "x-unreviewed"] }, { bodyBytes: 1 }, { initiator: "SCRIPT" }, { secFetchMode: "no-cors" }, { requestOrigin: "https://unreviewed.example" }].map(facts => ({ corsPreflight: { ...request.corsPreflight, ...facts } }))]) assert.equal(audit(patch).status, "PRESENT", JSON.stringify(patch));
  assert.equal(audit({ corsPreflight: undefined }).status, "NOT_EVALUATED", "missing handshake facts cannot count as no boundary violation");
  assert.equal(audit({}, parseReviewedReads(Buffer.from("[]"), "TEST_ONLY/no-get.json")).status, "PRESENT", "a standalone OPTIONS cannot borrow nonexistent GET review");
  for (const bad of [{ ...rule, methods: ["POST"], bodyFields: {} }, { ...rule, corsPreflight: { ...rule.corsPreflight, unknown: true } }]) assert.throws(() => parseReviewedReads(Buffer.from(JSON.stringify([bad])), "TEST_ONLY/invalid.json"));
});

test("independent price oracle reads raw menus, detects false MET, and does not mistake missing raw evidence for S0", async () => {
  const { captureRawPriceRegions, readRawPrices } = await import("./diagnostic-evaluator-prices.js");
  const html = await readFile(new URL("../../../harness/browser/fixtures/restaurant-prices/tablecheck-recorded-menu.html", import.meta.url), "utf8");
  const visible = html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const regions = captureRawPriceRegions(html, visible);
  assert.deepEqual(readRawPrices(regions, "original").map(row => row.low), [5500, 8250, 11000, 3300]);
  assert.equal(readRawPrices([{ markup: '<div data-testid="Menu Item Card"><p>BBQ Free Flow optional menu; reservations consisting solely of the optional menu cannot be accepted.</p><span data-price="3300.0">¥3,300</span></div>', visibleTextIncluded: true, truncated: false }], "synthetic-add-on").length, 0);
  const artifact: any = completeArtifact();
  const condition = { value: "around 3,000 yen per person", polarity: "POSITIVE", strength: "SOFT" };
  artifact.materializedCase.semantic.criteria.push(condition);
  artifact.finalSnapshot.domainState.intentDraft.criteria.push({ text: condition.value, polarity: condition.polarity, strength: condition.strength });
  const url = artifact.diagnostics.browserTrace[1].detail.url;
  artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a").sourceUrl = url;
  artifact.finalSnapshot.domainState.presentedResults.conditionStates = { "candidate-a": [{ text: condition.value, polarity: "POSITIVE", strength: "SOFT", status: "MET" }] };
  artifact.diagnostics.browserTrace[1].detail.priceRegions = regions;
  const wrong = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(wrong.conditionStates[0]?.criteria.find(row => row.text === condition.value)?.status, "NOT_MET", "lunch3300 must not qualify a dinner budget");
  assert.equal(wrong.severity.S0_DECLARATION.status, "PRESENT");
  assert.equal(wrong.conditionStateComparisons.find(row => row.text === condition.value)?.assessment, "S0_DECLARATION");
  delete artifact.diagnostics.browserTrace[1].detail.priceRegions;
  const missing = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.notEqual(missing.severity.S0_DECLARATION.status, "PRESENT", "lack of independent raw price is not a false-claim oracle");
  assert.equal(missing.severity.S1.status, "PRESENT");
  artifact.finalSnapshot.domainState.presentedResults.conditionStates["candidate-a"][0].status = "NOT_CHECKED";
  artifact.diagnostics.browserTrace[1].detail.priceRegions = regions;
  assert.equal(evaluateRestaurantHybridLiveArtifact(artifact, source).conditionStateComparisons.find(row => row.text === condition.value)?.assessment, "MISSED_KNOWN_CONDITION");
  for (const target of ["domains/restaurant/condition-states.ts", "integrations/tabelog/tabelog-page-parser.ts", "integrations/restaurant-availability/source-price-facts.ts"]) assert.ok(evaluatorImportViolation("eval/restaurant/agent-loop/diagnostic-evaluator-prices.ts", target, 'import { parse } from "x"'));
});
