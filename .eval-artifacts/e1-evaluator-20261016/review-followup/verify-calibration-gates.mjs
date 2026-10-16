// TEST_ONLY: real evaluator outputs under deliberately missing oracle inputs.
// No score is edited. Originals and the successful 22-run summary are read-only.
import fs from 'node:fs/promises';
import { relative } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { evaluateFrozenCalibrationArtifact } from '../../../src/eval/restaurant/agent-loop/runners/run-hybrid-artifact-evaluation.ts';
globalThis.fetch = () => { throw Error('E1_OFFLINE_NETWORK_FORBIDDEN'); };
const base = '.eval-artifacts/e1-evaluator-20261016';
const baselinePath = `${base}/calibration-20261016-rubric25-review/summary.json`;
const original = await fs.readFile(baselinePath), summary = JSON.parse(original);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const results = [];
for (const [name, runId, sourceContext, corrections] of [
  ['rule-gap','p1g-h003-a2',undefined,`${base}/gold-corrections.json`],
  ['missing-declaration-gold','p1fA-kf-h002-a1',`${base}/calibration-observations.rev2.json`,undefined],
]) {
  const directory = `${base}/review-followup/gate-challenges/${name}`;
  await fs.mkdir(directory,{recursive:true});
  const saved = await evaluateFrozenCalibrationArtifact(summary.manifest.path,runId,`${directory}/evaluations`,`${base}/witness-inputs.json`,sourceContext,corrections);
  const bytes = await fs.readFile(saved.outputPath), challenge = structuredClone(summary);
  const row = challenge.rows.find(row => row.runId === runId);
  Object.assign(row,{outputPath:relative(process.cwd(),saved.outputPath),outputSha256:sha(bytes),outcome:saved.evaluation.outcome.type,declaration:saved.evaluation.severity.S0_DECLARATION.status,boundary:saved.evaluation.severity.S0_BOUNDARY.status});
  await fs.writeFile(`${directory}/summary.json`,JSON.stringify(challenge,null,2),{flag:'wx'});
  const compared = spawnSync(process.execPath,[`${base}/compare-calibration.mjs`,`${directory}/summary.json`,`${directory}/comparison`],{encoding:'utf8'});
  assert.equal(compared.status,1,`Target acceptance must reject ${name}, not crash or pass`);
  const actual = JSON.parse(await fs.readFile(`${directory}/comparison/comparison.json`));
  assert.equal(actual.status,'BLOCKED_NOT_ACCEPTED');
  if (name === 'rule-gap') {
    assert.equal(actual.gates.normalS0Declaration.matched,20);
    assert.ok(actual.gates.s0Boundary.ruleGaps.includes(runId));
    assert.equal(actual.gates.s0Boundary.passed,false);
  } else {
    assert.equal(actual.gates.normalS0Declaration.matched,19);
    assert.equal(actual.gates.normalS0Declaration.passed,false);
  }
  results.push({name,runId,actualExit:compared.status,gates:actual.gates,proof:'ACTUAL_EVALUATOR_THEN_ACTUAL_COMPARISON; no hand-filled score'});
}
assert.deepEqual(await fs.readFile(baselinePath),original);
await fs.writeFile(`${base}/review-followup/gate-challenges/verification.json`,JSON.stringify({status:'PASS',normalControl:'calibration-20261016-rubric25-review/comparison/comparison.json',results,models:0,network:0},null,2),{flag:'wx'});
console.log(JSON.stringify(results,null,2));
