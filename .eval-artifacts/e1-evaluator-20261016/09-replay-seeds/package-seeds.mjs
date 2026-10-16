// Mechanical extraction only: emits an apply_patch; never dispatches a model.
import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const resultPath = '.eval-artifacts/calibration-phase1-20261015/inputs/p20-h001-a1.result.json.gz';
const resultBytes = gunzipSync(fs.readFileSync(resultPath));
assert.equal(hash(resultBytes), 'b5a1f0c3b091c5b89628dec6864d2a17e759b92e66820616d56624b5410dfefc');
const artifact = JSON.parse(resultBytes), captureBytes = fs.readFileSync(artifact.decisionCapture.path);
assert.equal(hash(captureBytes), artifact.decisionCapture.sha256);
const lines = captureBytes.toString().trimEnd().split('\n');
const selected = [4, 28].map(sequence => lines.find(line => JSON.parse(line).sequence === sequence));
assert.ok(selected.every(Boolean));
const packaged = selected.join('\n') + '\n';
const packagedPath = '.eval-artifacts/phase1-replay/inputs/p20-h001-a1.e1.decisions.jsonl';
if (fs.existsSync(packagedPath) || fs.existsSync('.eval-artifacts/e1-evaluator-20261016/09-replay-seeds/input-provenance.json')) throw Error('FROZEN_SEED_INPUT_EXISTS; never overwrite a committed extraction');
const baseBytes = fs.readFileSync('.eval-artifacts/phase1-replay/seeds.v6.json');
const proposals = [
  [
    { type: 'CHECK_AVAILABILITY', when: 'Select a nonempty subset of currently observed candidates with a supported read-only source path for the unchanged request. A native source ID permits investigation, not automatic identity, HARD or slot success.' },
    { type: 'INVESTIGATE_CANDIDATE_FACTS', when: 'Obtain missing same-outlet identity, area or HARD facts from an observed supported source path. Facts and availability have no mandatory ordering.' },
    { type: 'SEARCH_RESTAURANTS', when: 'Use another supported discovery source or a materially different scoped query while the singleton does not exhaust the open-ended request. Preserve every explicit condition.' },
  ],
  [
    { type: 'CHECK_AVAILABILITY', when: 'Select a nonempty subset that can be investigated through a supported source: an observed source link or bounded same-outlet source resolution must justify the path. Proximity or a production legal-action/eligible label alone is not that proof; no particular shop is required.' },
    { type: 'INVESTIGATE_CANDIDATE_FACTS', when: 'Resolve missing identity, HARD facts or an observed booking-entry lead for a candidate with a supported source path; unknown suitability stays unknown until observed. This is an alternative, not a fixed facts-before-slots protocol.' },
    { type: 'SEARCH_RESTAURANTS', when: 'A materially new supported source/query may seek the still-missing source path. Repeating unchanged failed discovery is not justified by the existence of many uninvestigated names.' },
  ],
];
const seeds = selected.map((line, index) => {
  const row = JSON.parse(line), stepNumber = [2, 8][index];
  const step = artifact.trajectories.find(step => step.stepNumber === stepNumber);
  assert.deepEqual(JSON.parse(row.messages.find(message => message.role === 'user').content).context, step.decisionContext);
  assert.ok(Date.parse(row.startedAt) <= Date.parse(step.occurredAt));
  const seed = {
    seedId: `p1-seed-${String(133 + index).padStart(4, '0')}`,
    level: 'AGENT', subCause: index === 0 ? 'POST_SINGLE_SOURCE_DISCOVERY' : 'SUPPORTED_SOURCE_CANDIDATE_SELECTION',
    labelStatus: 'PROPOSED', labeledBy: 'IMPLEMENTER_PROPOSAL; PENDING_INDEPENDENT_ANNOTATION', frozenAt: '2026-10-16',
    origin: { run: 'p20-h001-a1', runArtifact: packagedPath, decisionIndex: row.sequence, stepNumber,
      originalRunArtifact: artifact.decisionCapture.path, originalCaptureSha256: artifact.decisionCapture.sha256,
      originalRowSha256: hash(line), packagedCaptureSha256: hash(packaged),
      resultArtifact: resultPath, resultArtifactSha256: hash(resultBytes),
      recordingDir: artifact.browserRecording.path },
    recordedAction: step.agentAction, acceptableActions: [], proposedAcceptableActions: proposals[index],
    labelBasis: '待独立标注。条件式动作提议，尚未成为可评分标签；现有匹配器不能把这些条件悄悄降为仅动作类型匹配。保持全部原始消息、Gold和观察，不要求任何指定店。',
    scoring: { status: 'NOT_EVALUATED_PENDING_INDEPENDENT_ANNOTATION', includedInPassRate: false },
    annotationInputs: { precedingStep: stepNumber - 1, newlyDiscovered: index === 0 ? 1 : 37,
      totalCandidates: step.decisionContext.candidates.length,
      evidenceBasis: 'Frozen request plus source observations recorded no later than this captured decision; legalActions, checkableCandidateIds and production eligibility are not the annotation oracle.',
      limitations: 'Raw AGENT message replay only; this does not make the UNSAFE_DOCUMENT browser recording replayable. No model replay executed in E1.' },
  };
  return seed;
});
let patch = '*** Begin Patch\n';
function add(path, text) { patch += `*** Add File: ${path}\n${text.trimEnd().split('\n').map(line => '+' + line).join('\n')}\n`; }
add(packagedPath, packaged);
patch += '*** Update File: .eval-artifacts/phase1-replay/seeds.v7.json\n@@\n-  }\n- ],\n- "supersedes": {\n+  },\n';
patch += seeds.map(seed => JSON.stringify(seed, null, 1).split('\n').map(line => '+' + '  ' + line).join('\n')).join(',\n');
// The comma belongs to the preceding added JSON line, not to patch syntax.
patch += '\n+ ],\n+ "supersedes": {\n';
patch += `@@\n  "parent": {\n-  "file": "seeds.v5.json",\n-  "sha256": "e98d4a989f4cf73cdc8bbe86501047d80f40efaf962db837824f57b9f8643958"\n+  "file": "seeds.v6.json",\n+  "sha256": "${hash(baseBytes)}"\n  }\n`;
add('.eval-artifacts/e1-evaluator-20261016/09-replay-seeds/input-provenance.json', JSON.stringify({
  schemaVersion: '1', status: 'EXPOSED_DEVELOPMENT_REGRESSION_PENDING_INDEPENDENT_ANNOTATION',
  originalCapture: { path: artifact.decisionCapture.path, sha256: hash(captureBytes), bytes: captureBytes.length },
  result: { path: resultPath, uncompressedSha256: hash(resultBytes) },
  packagedCapture: { path: packagedPath, sha256: hash(packaged), bytes: Buffer.byteLength(packaged), rows: seeds.map(seed => ({ sequence: seed.origin.decisionIndex, stepNumber: seed.origin.stepNumber, originalRowSha256: seed.origin.originalRowSha256 })) },
  modelCalls: 0, executedReplays: 0, includedNewSeedsInPassRate: 0,
}, null, 2));
console.log(patch + '*** End Patch');
