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
  const declaration = evaluation.severity.S0_DECLARATION, boundary = evaluation.severity.S0_BOUNDARY;
  if (!declaration || !boundary || !Array.isArray(boundary.gaps)) throw Error('Split S0 assessments and explicit gaps are required');
  const autoS0 = declaration.status, humanS0 = human.falseClaim === 'YES' ? 'PRESENT' : human.falseClaim === 'NO' ? 'ABSENT' : undefined;
  if (!humanS0) throw Error('Unknown human S0 label');
  const s0Match = autoS0 === humanS0;
  const allowedS0Unknown = allowedResultless.has(row.runId) && entry.status === 'RESULT_NOT_GENERATED' && autoS0 === 'NOT_EVALUATED';
  const boundaryEvidenceGapAllowed = boundary.status === 'NOT_EVALUATED' && boundary.gaps.length > 0
    && boundary.gaps.every(gap => gap.kind === 'EVIDENCE_GAP' && gap.missing.length > 0 && gap.evidenceRefs.length > 0);
  const boundaryAccepted = boundary.status === 'ABSENT' || boundaryEvidenceGapAllowed;
  const differences = [];
  const malformedGoldFields = (result?.materializedCase?.semantic?.criteria ?? []).flatMap((criterion, index) => Object.keys(criterion).filter(key => !['value','text','polarity','strength'].includes(key)).map(key => `materializedCase.semantic.criteria[${index}].${key}`));
  if (evaluation.outcome.type !== human.outcome) differences.push({ dimension: 'OUTCOME', category: evaluation.outcome.type === 'NOT_EVALUATED' && (malformedGoldFields.length || evaluation.recordReadIssues.some(issue => issue.reason === 'UNEXPECTED_FIELD')) ? 'GOLD_MISSING' : 'EVALUATOR_ERROR', reasons: [...evaluation.outcome.reasons, ...evaluation.recordReadIssues.map(issue => `${issue.reason}:${issue.path}`), ...malformedGoldFields.map(path => `Malformed original Gold:${path}`)] });
  if (!s0Match && !allowedS0Unknown) differences.push({ dimension: 'S0_DECLARATION', category: 'EVALUATOR_ERROR', reasons: declaration.reasons });
  if (!boundaryAccepted) differences.push({ dimension: 'S0_BOUNDARY', category: boundary.gaps.some(gap => gap.kind === 'RULE_GAP') ? 'RULE_GAP' : boundary.status === 'PRESENT' ? 'OBSERVED_S0' : 'EVALUATOR_ERROR', reasons: boundary.reasons, gaps: boundary.gaps });
  rows.push({ runId: row.runId, actualDelivery, automatic: { outcome: evaluation.outcome, severity: evaluation.severity, outputPath: row.outputPath, outputSha256: row.outputSha256 },
    human: { outcome: human.outcome, falseClaim: human.falseClaim, severity: human.severity, ...(human.note ? { note: human.note } : {}) }, outcomeMatch: evaluation.outcome.type === human.outcome,
    s0Match, allowedS0Unknown, boundaryAccepted, boundaryEvidenceGapAllowed, boundaryGaps: boundary.gaps, differences, unassessedDimensions: evaluation.unassessedDimensions,
    unassessedFindings: evaluation.findings.filter(finding => finding.status === 'NOT_EVALUATED').map(finding => ({ dimension: finding.dimension, observations: finding.observations })) });
}
const normal = rows.filter(row => !allowedResultless.has(row.runId)), deliveries = rows.filter(row => row.actualDelivery);
const falseQualified = rows.filter(row => row.automatic.outcome.type === 'QUALIFIED_DELIVERY' && row.human.outcome !== 'QUALIFIED_DELIVERY');
const gates = { normalS0Declaration: { required: 20, matched: normal.filter(row => row.s0Match).length, passed: normal.length === 20 && normal.every(row => row.s0Match) },
  interruptedS0Declaration: { required: 2, allowedUnknown: rows.filter(row => row.allowedS0Unknown).length, passed: rows.filter(row => allowedResultless.has(row.runId)).every(row => row.s0Match || row.allowedS0Unknown) },
  s0Boundary: { required: 22, evaluatedAbsent: rows.filter(row => row.automatic.severity.S0_BOUNDARY.status === 'ABSENT').length,
    observedViolation: rows.filter(row => row.automatic.severity.S0_BOUNDARY.status === 'PRESENT').length, allowedEvidenceGaps: rows.filter(row => row.boundaryEvidenceGapAllowed).length,
    ruleGaps: rows.filter(row => row.boundaryGaps.some(gap => gap.kind === 'RULE_GAP')).map(row => row.runId), passed: rows.every(row => row.boundaryAccepted) },
  deliveryTypes: { required: 8, matched: deliveries.filter(row => row.outcomeMatch).length, passed: deliveries.length === 8 && deliveries.every(row => row.outcomeMatch) },
  noFalseQualified: { count: falseQualified.length, passed: falseQualified.length === 0 },
  noEvaluatorErrors: { remaining: rows.flatMap(row => row.differences).filter(difference => difference.category === 'EVALUATOR_ERROR').length } };
const passed = gates.normalS0Declaration.passed && gates.interruptedS0Declaration.passed && gates.s0Boundary.passed && gates.deliveryTypes.passed && gates.noFalseQualified.passed && !gates.noEvaluatorErrors.remaining;
const comparison = { status: passed ? 'PASS' : 'BLOCKED_NOT_ACCEPTED', exitCode: passed ? 0 : 1, automaticCodeCommit: automatic.codeCommit,
  automaticSummary: { path: resolve(summaryPath), sha256: sha(summaryBytes) }, labels: { path: labelPath, sha256: sha(labelBytes) },
  scope: 'Exposed development inputs only, not Clean Baseline or new-case accuracy. Labels never entered the evaluator. Unknown is not agreement.',
  gates, outcomeMatches: rows.filter(row => row.outcomeMatch).length, total: rows.length, rows };
await fs.mkdir(outputDirectory);
await fs.writeFile(`${outputDirectory}/comparison.json`, JSON.stringify(comparison, null, 2), { flag: 'wx' });
const table = ['# E1 校准对照（开发集，非 Clean Baseline）', '', `状态：${comparison.status}；退出码 ${comparison.exitCode}；自动源码 ${automatic.codeCommit}。`, '',
  `结果类型 ${comparison.outcomeMatches}/22；8次实际交付 ${gates.deliveryTypes.matched}/8；正常S0-声明 ${gates.normalS0Declaration.matched}/20；两中断声明未评价 ${gates.interruptedS0Declaration.allowedUnknown}/2；误判合格 ${falseQualified.length}。`,
  `S0-越界：已评价无越界 ${gates.s0Boundary.evaluatedAbsent}/22；明确越界 ${gates.s0Boundary.observedViolation}；历史证据缺口 ${gates.s0Boundary.allowedEvidenceGaps}；规则缺口 ${gates.s0Boundary.ruleGaps.length}。证据缺口不是无越界，人工falseClaim标签只对比声明，不作为越界oracle。`, '',
  '| 运行 | 自动类型 | 人工类型 | 声明／人工声明 | 越界 | 已确认严重程度／人工 | 类型一致 | 分歧 |', '| --- | --- | --- | --- | --- | --- | --- | --- |'];
for (const row of rows) {
  const present = Object.entries(row.automatic.severity).filter(([, value]) => value.status === 'PRESENT').map(([key]) => key).join(',') || '无PRESENT（非全维无错）';
  const difference = row.allowedS0Unknown ? '两中断例外：缺result且trace不足' : row.differences.map(value => `${value.dimension}:${value.category}`).join('; ') || '—';
  table.push(`| [${row.runId}](${relative(outputDirectory, row.automatic.outputPath)}) | ${row.automatic.outcome.type} | ${row.human.outcome} | ${row.automatic.severity.S0_DECLARATION.status} / ${row.human.falseClaim} | ${row.automatic.severity.S0_BOUNDARY.status}${row.boundaryEvidenceGapAllowed ? '（证据缺口）' : ''} | ${present} / ${row.human.severity} | ${row.outcomeMatch ? '是' : '否'} | ${difference} |`);
}
table.push('', '## S0-越界证据缺口逐条清单', '', '| 运行 | 实际请求／阶段 | 缺少什么 | 类型 |', '| --- | --- | --- | --- |');
for (const row of rows) for (const gap of row.boundaryGaps) table.push(`| ${row.runId} | ${gap.request.replaceAll('|','/')} | ${gap.missing.join('; ')} | ${gap.kind} |`);
await fs.writeFile(`${outputDirectory}/comparison.md`, table.join('\n')+'\n', { flag: 'wx' });
console.log(JSON.stringify({ status: comparison.status, exitCode: comparison.exitCode, gates, outcomeMatches: comparison.outcomeMatches, total: 22 }, null, 2));
process.exitCode = comparison.exitCode;
