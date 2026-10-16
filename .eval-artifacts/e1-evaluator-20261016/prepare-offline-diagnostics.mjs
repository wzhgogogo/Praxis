// Prepare review evidence through the existing shared artifact entry; not calibration.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { evaluateFrozenCalibrationArtifact } from '../../src/eval/restaurant/agent-loop/runners/run-hybrid-artifact-evaluation.ts';
globalThis.fetch = () => { throw Error('E1_OFFLINE_NETWORK_FORBIDDEN'); };
const directory = process.argv[2] ?? '.eval-artifacts/e1-evaluator-20261016/offline-diagnostics';
const manifestPath = '.eval-artifacts/calibration-phase1-20261015/inputs/manifest.json';
const contextPath = '.eval-artifacts/e1-evaluator-20261016/witness-inputs.json';
const manifestBytes = await readFile(manifestPath), manifest = JSON.parse(manifestBytes);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const rows = [];
for (const entry of manifest.entries) {
  const { evaluation, outputPath } = await evaluateFrozenCalibrationArtifact(manifestPath, entry.runId, `${directory}/evaluations`, contextPath);
  rows.push({ runId: entry.runId, sourceStatus: entry.status, outputPath, outputSha256: sha(await readFile(outputPath)),
    outcome: evaluation.outcome, severity: evaluation.severity,
    findings: evaluation.findings.map(({ dimension, status }) => ({ dimension, status })),
    pendingCriterionWordings: evaluation.pendingCriterionWordings, unassessedDimensions: evaluation.unassessedDimensions,
    witnessOutlets: evaluation.witnessFunnel.length, criterionEquivalences: evaluation.criterionEquivalences,
    humanLabel: 'PENDING_REVIEWER_EXPORT', comparison: 'NOT_COMPARED',
  });
  console.log(JSON.stringify({ runId: entry.runId, type: evaluation.outcome.type, S0: evaluation.severity.S0.status, humanComparison: 'NOT_COMPARED' }));
}
const summary = { status: 'PENDING_REVIEWER_INPUTS_NOT_A_CALIBRATION_RESULT',
  codeCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  manifest: { path: manifestPath, sha256: sha(manifestBytes) },
  prerequisite: 'Reviewer-exported labels.yaml, eight criterion-equivalence conclusions and five Your-call rules are absent. No accuracy, S0 agreement or delivery agreement is reported.',
  scope: 'Exposed development inputs, not Clean Baseline; no model, Live, network or replay. Human-label placeholders are report-only, never evaluator inputs.',
  planned: 22, results: 20, interruptedExcluded: 2, automaticOutputs: rows.length,
  humanComparisons: 0, calibrationPassed: null, rows };
await mkdir(directory, { recursive: true });
await writeFile(`${directory}/summary.json`, JSON.stringify(summary, null, 2), { flag: 'wx' });
