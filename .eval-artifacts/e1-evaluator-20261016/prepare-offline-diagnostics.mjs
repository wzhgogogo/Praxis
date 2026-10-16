// Generate automatic calibration inputs through the shared artifact entry.
// Deliberately does not read human labels; compare only after outputs are saved.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { evaluateFrozenCalibrationArtifact } from '../../src/eval/restaurant/agent-loop/runners/run-hybrid-artifact-evaluation.ts';
globalThis.fetch = () => { throw Error('E1_OFFLINE_NETWORK_FORBIDDEN'); };
const directory = process.argv[2];
if (!directory) throw Error('Pass a fresh output directory; historical diagnostics must not be overwritten.');
const manifestPath = '.eval-artifacts/calibration-phase1-20261015/inputs/manifest.json';
const contextPath = '.eval-artifacts/e1-evaluator-20261016/witness-inputs.json';
const sourceContextPath = '.eval-artifacts/e1-evaluator-20261016/calibration-observations.json';
const manifestBytes = await readFile(manifestPath), manifest = JSON.parse(manifestBytes);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', 'src/eval/restaurant/agent-loop', 'docs/skills/eval/SKILL.md',
  contextPath, sourceContextPath, '.eval-artifacts/e1-evaluator-20261016/prepare-offline-diagnostics.mjs'], { stdio: 'pipe' });
const oracleInputs = await Promise.all([
  'src/eval/restaurant/agent-loop/cases/criterion-equivalences.yaml',
  '.eval-artifacts/calibration-phase1-20261015/soft-preference-observations.yaml',
  '.eval-artifacts/calibration-phase1-20261015/labeling-rules.md', contextPath, sourceContextPath,
].map(async path => ({ path, sha256: sha(await readFile(path)) })));
await mkdir(directory); // Must be fresh, including before a partially failed evaluation.
const rows = [];
for (const entry of manifest.entries) {
  const { evaluation, outputPath } = await evaluateFrozenCalibrationArtifact(manifestPath, entry.runId, `${directory}/evaluations`, contextPath, sourceContextPath);
  rows.push({ runId: entry.runId, sourceStatus: entry.status, outputPath, outputSha256: sha(await readFile(outputPath)),
    outcome: evaluation.outcome, severity: evaluation.severity,
    findings: evaluation.findings.map(({ dimension, status }) => ({ dimension, status })),
    pendingCriterionWordings: evaluation.pendingCriterionWordings, unassessedDimensions: evaluation.unassessedDimensions,
    witnessOutlets: evaluation.witnessFunnel.length, criterionEquivalences: evaluation.criterionEquivalences,
    conditionStates: evaluation.conditionStates, softPreferenceObservations: evaluation.softPreferenceObservations,
    evaluatorVersion: evaluation.evaluatorVersion, rubricVersion: evaluation.rubricVersion,
  });
  console.log(JSON.stringify({ runId: entry.runId, type: evaluation.outcome.type, S0: evaluation.severity.S0.status, humanComparison: 'NOT_COMPARED' }));
}
const summary = { status: 'AUTOMATIC_OUTPUTS_FROZEN_NOT_YET_COMPARED_TO_LABELS',
  codeCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  manifest: { path: manifestPath, sha256: sha(manifestBytes) }, oracleInputs,
  prerequisite: 'All automatic outputs saved before reading labels.yaml; a separate final comparison must apply the original acceptance gates. No agreement is inferred here.',
  scope: 'Exposed development inputs, not Clean Baseline; no model, Live, network or replay. Human-label placeholders are report-only, never evaluator inputs.',
  planned: 22, results: 20, interruptedExcluded: 2, automaticOutputs: rows.length,
  humanComparisons: 0, calibrationPassed: null, rows };
await mkdir(directory, { recursive: true });
await writeFile(`${directory}/summary.json`, JSON.stringify(summary, null, 2), { flag: 'wx' });
