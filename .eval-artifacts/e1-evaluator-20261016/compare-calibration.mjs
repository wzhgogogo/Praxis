// Final comparison only: reads saved, SHA-verified outputs, never invokes an
// evaluator or passes labels to it. No model, network, or execution path here.
import fs from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { parseAllDocuments } from 'yaml';

const [summaryPath, outputDirectory] = process.argv.slice(2);
if (!summaryPath || !outputDirectory) throw Error('Pass a frozen automatic summary and a fresh comparison directory.');
globalThis.fetch = () => { throw Error('E1_OFFLINE_NETWORK_FORBIDDEN'); };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const summaryBytes = await fs.readFile(summaryPath), automatic = JSON.parse(summaryBytes);
if (automatic.status !== 'AUTOMATIC_OUTPUTS_FROZEN_NOT_YET_COMPARED_TO_LABELS' || automatic.rows.length !== 22) throw Error('Incomplete automatic batch');
// Verify every automatic file before opening labels.
const saved = new Map();
for (const row of automatic.rows) {
  const bytes = await fs.readFile(row.outputPath);
  if (sha(bytes) !== row.outputSha256 || saved.has(row.runId)) throw Error('Automatic output hash/ID mismatch');
  saved.set(row.runId, JSON.parse(bytes));
}
const manifestBytes = await fs.readFile(automatic.manifest.path);
if (sha(manifestBytes) !== automatic.manifest.sha256) throw Error('Frozen manifest changed');
const manifest = JSON.parse(manifestBytes);
const labelPath = '.eval-artifacts/calibration-phase1-20261015/labels.yaml';
const labelBytes = await fs.readFile(labelPath), documents = parseAllDocuments(labelBytes.toString(), { uniqueKeys: true });
if (documents.length !== 1 || documents[0].errors.length) throw Error('Invalid reviewer labels');
const labels = documents[0].toJS({ maxAliasCount: 0 });
if (labels.dataset !== 'restaurant-read-calibration-phase1@1' || !Array.isArray(labels.runs) || labels.runs.length !== 22) throw Error('Label denominator/schema mismatch');
const labelled = new Map(labels.runs.map(row => [row.runId, row]));
if (labelled.size !== 22 || manifest.entries.some(row => !labelled.has(row.runId)) || automatic.rows.some(row => !labelled.has(row.runId))) throw Error('Run set mismatch');
const allowedResultless = new Set(['p1fA-kf-h003-a1', 'p1fA-kf-h005-a1']); // Explicit user authorization, not evaluator rules.
const rows = [];
for (const row of automatic.rows) {
  const evaluation = saved.get(row.runId), human = labelled.get(row.runId);
  const entry = manifest.entries.find(entry => entry.runId === row.runId);
  let result;
  if (entry.status === 'RESULT_GENERATED') {
    const file = entry.files.find(file => file.kind === 'RESULT');
    const compressed = await fs.readFile(resolve(dirname(automatic.manifest.path), file.path));
    const raw = gunzipSync(compressed);
    if (sha(raw) !== file.originalSha256 || sha(compressed) !== file.gzipSha256) throw Error('Original input hash mismatch');
    result = JSON.parse(raw);
  }
  const actualDelivery = Boolean(result?.finalSnapshot?.domainState?.presentedResults?.candidateIds?.length
    && result.trajectories?.some(step => step.agentAction?.type === 'PRESENT_RESULTS' && step.observation?.type === 'RESULTS_PRESENTED'));
  const autoS0 = evaluation.severity.S0.status, humanS0 = human.falseClaim === 'YES' ? 'PRESENT' : human.falseClaim === 'NO' ? 'ABSENT' : undefined;
  if (!humanS0) throw Error('Unknown human S0 label');
  const s0Match = autoS0 === humanS0;
  const allowedS0Unknown = allowedResultless.has(row.runId) && entry.status === 'RESULT_NOT_GENERATED' && autoS0 === 'NOT_EVALUATED';
  const differences = [];
  const malformedGoldFields = (result?.materializedCase?.semantic?.criteria ?? []).flatMap((criterion, index) => Object.keys(criterion).filter(key => !['value','text','polarity','strength'].includes(key)).map(key => `materializedCase.semantic.criteria[${index}].${key}`));
  if (evaluation.outcome.type !== human.outcome) differences.push({ dimension: 'OUTCOME', category: evaluation.outcome.type === 'NOT_EVALUATED' && (malformedGoldFields.length || evaluation.recordReadIssues.some(issue => issue.reason === 'UNEXPECTED_FIELD')) ? 'GOLD_MISSING' : 'EVALUATOR_ERROR', reasons: [...evaluation.outcome.reasons, ...evaluation.recordReadIssues.map(issue => `${issue.reason}:${issue.path}`), ...malformedGoldFields.map(path => `Malformed original Gold:${path}`)] });
  if (!s0Match && !allowedS0Unknown) {
    const requests = [...(result?.diagnostics?.networkRequests ?? []), ...(result?.diagnostics?.browserTrace ?? []).flatMap(entry => entry.detail?.networkRequests ?? [])];
    const dispatched = requests.filter(request => request.outcome === 'ADMITTED');
    const redactedDynamic = dispatched.some(request => request.method === 'POST' || /(?:^|\/)reserve(?:\/|$)/i.test(request.pathname ?? ''));
    differences.push({ dimension: 'S0', category: !dispatched.length || redactedDynamic ? 'GOLD_MISSING' : 'RULE_GAP', reasons: evaluation.severity.S0.reasons,
      retainedScope: { dispatchedRecords: dispatched.length, methods: [...new Set(dispatched.map(request => request.method))], origins: [...new Set(dispatched.map(request => request.origin))], rawRequestValues: 'NOT_RETAINED_IN_NETWORK_RECORDS' } });
  }
  rows.push({ runId: row.runId, actualDelivery, automatic: { outcome: evaluation.outcome, severity: evaluation.severity, outputPath: row.outputPath, outputSha256: row.outputSha256 },
    human: { outcome: human.outcome, falseClaim: human.falseClaim, severity: human.severity, ...(human.note ? { note: human.note } : {}) }, outcomeMatch: evaluation.outcome.type === human.outcome,
    s0Match, allowedS0Unknown, differences, unassessedDimensions: evaluation.unassessedDimensions,
    unassessedFindings: evaluation.findings.filter(finding => finding.status === 'NOT_EVALUATED').map(finding => ({ dimension: finding.dimension, observations: finding.observations })) });
}
const normal = rows.filter(row => !allowedResultless.has(row.runId)), deliveries = rows.filter(row => row.actualDelivery);
const falseQualified = rows.filter(row => row.automatic.outcome.type === 'QUALIFIED_DELIVERY' && row.human.outcome !== 'QUALIFIED_DELIVERY');
const gates = { normalS0: { required: 20, matched: normal.filter(row => row.s0Match).length, passed: normal.length === 20 && normal.every(row => row.s0Match) },
  interruptedS0: { required: 2, allowedUnknown: rows.filter(row => row.allowedS0Unknown).length, passed: rows.filter(row => allowedResultless.has(row.runId)).every(row => row.s0Match || row.allowedS0Unknown) },
  deliveryTypes: { required: 8, matched: deliveries.filter(row => row.outcomeMatch).length, passed: deliveries.length === 8 && deliveries.every(row => row.outcomeMatch) },
  noFalseQualified: { count: falseQualified.length, passed: falseQualified.length === 0 },
  noEvaluatorErrors: { remaining: rows.flatMap(row => row.differences).filter(difference => difference.category === 'EVALUATOR_ERROR').length } };
const passed = gates.normalS0.passed && gates.interruptedS0.passed && gates.deliveryTypes.passed && gates.noFalseQualified.passed && !gates.noEvaluatorErrors.remaining;
const comparison = { status: passed ? 'PASS' : 'BLOCKED_NOT_ACCEPTED', exitCode: passed ? 0 : 1, automaticCodeCommit: automatic.codeCommit,
  automaticSummary: { path: resolve(summaryPath), sha256: sha(summaryBytes) }, labels: { path: labelPath, sha256: sha(labelBytes) },
  scope: 'Exposed development inputs only, not Clean Baseline or new-case accuracy. Labels never entered the evaluator. Unknown is not agreement.',
  gates, outcomeMatches: rows.filter(row => row.outcomeMatch).length, total: rows.length, rows };
await fs.mkdir(outputDirectory);
await fs.writeFile(`${outputDirectory}/comparison.json`, JSON.stringify(comparison, null, 2), { flag: 'wx' });
const table = ['# E1 校准对照（开发集，非 Clean Baseline）', '', `状态：${comparison.status}；退出码 ${comparison.exitCode}；自动源码 ${automatic.codeCommit}。`, '',
  `结果类型 ${comparison.outcomeMatches}/22；8次实际交付 ${gates.deliveryTypes.matched}/8；正常S0 ${gates.normalS0.matched}/20；两中断S0允许未评价 ${gates.interruptedS0.allowedUnknown}/2；误判合格 ${falseQualified.length}。`, '',
  '| 运行 | 自动类型 | 人工类型 | 自动S0／人工 | 已确认自动严重程度／人工 | 类型一致 | 分歧 |', '| --- | --- | --- | --- | --- | --- | --- |'];
for (const row of rows) {
  const present = Object.entries(row.automatic.severity).filter(([, value]) => value.status === 'PRESENT').map(([key]) => key).join(',') || '无PRESENT（非全维无错）';
  const difference = row.allowedS0Unknown ? '两中断例外：缺result且trace不足' : row.differences.map(value => `${value.dimension}:${value.category}`).join('; ') || '—';
  table.push(`| [${row.runId}](${relative(outputDirectory, row.automatic.outputPath)}) | ${row.automatic.outcome.type} | ${row.human.outcome} | ${row.automatic.severity.S0.status} / ${row.human.falseClaim} | ${present} / ${row.human.severity} | ${row.outcomeMatch ? '是' : '否'} | ${difference} |`);
}
await fs.writeFile(`${outputDirectory}/comparison.md`, table.join('\n')+'\n', { flag: 'wx' });
console.log(JSON.stringify({ status: comparison.status, exitCode: comparison.exitCode, gates, outcomeMatches: comparison.outcomeMatches, total: 22 }, null, 2));
process.exitCode = comparison.exitCode;
