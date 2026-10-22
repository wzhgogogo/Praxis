import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HERE, ROOT, SPEC, sha, readJson, writeJson, loadInputs, summarize, verifyFreeze } from './experiment.mjs';
import { verifyCompatibilityFreeze } from './compat-resume.mjs';

export async function aggregate() {
  const input = await loadInputs(), tasks = await readJson(resolve(HERE, 'schedule.json'));
  const [originalFreeze, compatFreeze] = await Promise.all([verifyFreeze(), verifyCompatibilityFreeze()]);
  const all = [];
  for (const batch of ['model-replay', 'model-replay-compat-auto']) {
    const dir = resolve(HERE, batch, 'results');
    for (const name of await readdir(dir)) if (!name.endsWith('.provider.json')) {
      const path = resolve(dir, name);
      all.push({ row: await readJson(path), sourcePath: path.slice(ROOT.length + 1), sha256: sha(await readFile(path)) });
    }
  }
  all.sort((a, b) => a.row.startedAt.localeCompare(b.row.startedAt));
  if (all.length > SPEC.hardCallLimit) throw new Error('CUMULATIVE_CALL_CAP_VIOLATED');
  const canonical = new Map();
  for (const value of all) {
    const old = canonical.get(value.row.id);
    if (old && (old.row.response || value.row.id !== 'c-01-d008-V2' || old.row.error?.providerStatus !== 400)) throw new Error('UNAPPROVED_DUPLICATE_DECISION');
    canonical.set(value.row.id, value);
  }
  const directory = resolve(HERE, 'comparison');
  await mkdir(directory);
  await mkdir(resolve(directory, 'results'));
  for (const value of canonical.values()) await writeJson(resolve(directory, 'results', `${value.row.id}.json`), {
    ...value.row, sourcePath: value.sourcePath, sourceSha256: value.sha256,
  });
  const start = await readJson(resolve(HERE, 'model-replay', 'started.json'));
  const resumedStart = await readJson(resolve(HERE, 'model-replay-compat-auto', 'started.json'));
  const end = await readJson(resolve(HERE, 'model-replay-compat-auto', 'finished.json'));
  await writeJson(resolve(directory, 'started.json'), { ...start, freeze: compatFreeze, originalFreeze,
    committedSha: resumedStart.committedSha, originalCommittedSha: start.committedSha });
  await writeJson(resolve(directory, 'finished.json'), { ...end, actualModelCalls: all.length, sourceRequests: 0, planned: tasks.length });
  const base = await summarize(directory, input, tasks);
  const variants = base.variants.map(v => {
    const attempts = all.filter(a => a.row.variant === v.variant).map(a => a.row);
    return { ...v, apiAttempts: attempts.length, apiFailures: attempts.filter(a => !a.response).length,
      meanAllApiElapsedMs: attempts.reduce((s, r) => s + r.elapsedMs, 0) / attempts.length,
      apiCallsWithUsage: attempts.filter(a => a.providerUsage).length,
      apiCallsWithMissingUsage: attempts.filter(a => !a.providerUsage).length };
  });
  const summary = { ...base, variants, apiRequests: all.length, decisionTrialsAttempted: canonical.size,
    wholeExperimentCap: SPEC.hardCallLimit, originalFreeze, compatibilityFreeze: compatFreeze,
    compatibility: { approvedBy: 'USER', field: 'tool_choice', variant: 'V2', value: 'auto', priorFailedAttemptRetained: true,
      interpretation: 'V2 includes thinking + auto tool_choice + expanded timeout/output, not a thinking-only causal contrast' },
    attempts: all.map(({ row, ...ref }) => ({ ...ref, id: row.id, variant: row.variant, outcome: row.outcome, elapsedMs: row.elapsedMs })),
  };
  await writeJson(resolve(directory, 'comparison.json'), summary);
  const ledger = await readJson(resolve(HERE, '../guarded-continuation-20261021/phase2-ledger-after.json'));
  ledger.phase2ModelCalls += all.length;
  ledger.totalModelCalls += all.length;
  ledger.remaining.modelCalls -= all.length;
  ledger.subtotals.checkpointCDecisionReplay = { modelRequests: all.length, fullLiveRuns: 0, sourceRequests: 0 };
  ledger.calendarDecisionReplay = { mode: 'REAL_MODEL_REPLAY', apiRequests: all.length, decisionTrials: canonical.size,
    priorRejectedThinkingForcedToolChoice: 1, compatibility: 'USER_APPROVED_AUTO', report: `${directory.slice(ROOT.length + 1)}/comparison.json` };
  ledger.accountingNotes.push('Checkpoint C step0 calendar replay: all API attempts, including the original HTTP400, are conservatively charged; no full Live or environment rerun added.');
  await writeJson(resolve(directory, 'phase2-ledger-after.json'), ledger);
  const percent = v => `${v.correct}/${v.planned}（${(v.accuracyAllPlanned*100).toFixed(1)}%）`;
  const lines = ['# 第0步：真实翻月控件决策回放', '',
    'Evidence status: exposed development / real model decision replay。0 网站、0 浏览器动作、0 Live；生产代码未修改。报告后停下等待复核和方案选择。', '',
    '## 1 结果', '',
    `69 个决策点 × 4 变体，共276计划试次；${canonical.size} 个试次已尝试，${all.length} 次模型API请求（含1次原协议HTTP400）。`, '',
    '| 变体 | 真实翻月选对率 | 决策试次平均秒 | 全API请求平均秒 | API请求／失败 | 输入token | 输出token | 推理token |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |'];
  for (const v of variants) lines.push(`| ${v.variant} | ${percent(v)} | ${v.meanElapsedMs === null ? '未评' : (v.meanElapsedMs/1000).toFixed(2)} | ${(v.meanAllApiElapsedMs/1000).toFixed(2)} | ${v.apiAttempts}/${v.apiFailures} | ${v.tokens.input.sum ?? '未报告'} | ${v.tokens.output.sum ?? '未报告'} | ${v.tokens.reasoning.sum ?? '未报告'} |`);
  lines.push('', 'token 是供应商实际 usage。推理 token 属于输出明细，不重复相加。缺失 usage 不填0；缓存命中／未命中、每次调用 token 及覆盖率见 comparison.json。无冻结单价，货币成本未评价。选择率分母保留全部69计划点；请求失败与未到达另列，不假装是按钮选择。', '',
    '## 2 逐环节', '',
    '原五次有153个浏览器决策；104点满足“目标11月、观察10月、有Next”，主样本取69个原模型明确点Next的尝试。c-01/02/03/04/05分别19/17/16/1/16。其余35点及排除理由见 inventory.json；重复不去重，是偏向已知失败的诊断样本。', '',
    '独立 HTML 核查纠正了原位置规则：日期格前的Next中，59个属于时间、10个属于人数；真实日历Next是原观察里已存在的空标签链接。c-01 sequence28的正确引用为target90，131人数／136时间均错。最初沟通“未进入观察”不准确；已纠正为语义丢失。答案按保存的DOM及原绑定确定，不按模型理由或生产成功码判断。', '',
    'V0精确回放原消息；V1仅追加通用技能；V2开启thinking并放宽120秒／8192输出，另含用户批准的tool_choice auto兼容差异；V3仅改观察，补控件组、当前月份和已有空标签链接的公开DOM文本。所有真实翻月／人数／时间控件的绑定和组均核对；已脱敏而无法唯一绑定的其他控件显式标为Unlabelled group，不编造所属关系。', '',
    '按原顺序及循环变体顺序串行执行。V0/V1首个已完成结果不重跑，原HTTP400保留，V2新协议生成一次，不按得分挑选结果。逐点动作和错误分类见 evaluations.json；各原运行分层、V1/V2/V3对V0的成对差异见 comparison.json。', '',
    '## 3 严重程度与资源', '',
    `API请求${all.length}/300，阶段累计${ledger.totalModelCalls}/4000，剩余${ledger.remaining.modelCalls}。完整Live仍7/100、正式环境重跑仍0/10；本次无来源访问或外写。停止原因：${end.stopped ?? '计划完成'}。`, '',
    'c-04历史S0越界仍PRESENT。此实验只发模型请求，不能重新认证历史安全、解除Live阻断，亦未执行点击来验证月份改变。', '',
    '## 4 归因与限制', '',
    '本批比较的是“能否选中真实翻月链接”。观察丢失控件语义已有原始DOM支持；是否造成实际查位失败仍需后续执行验证。V3同时补标签、组和月份，不能把效果单独归因于某一字段；V2同时受thinking和供应商兼容协议／更大预算影响。', '',
    '每点每变体一次、同店上下文重复、缓存及时间漂移限制了推论；不作泛化、稳定显著提升或完整交付能力声明。既有S0与全链路缺口保持。尚未采用任何变体，不继续后续第1–5步。', '',
    `原冻结：${originalFreeze.sha256}；兼容冻结：${compatFreeze.sha256}。`, '');
  await writeFile(resolve(directory, 'four-layer-report.md'), lines.join('\n'), { flag: 'wx' });
  console.log(JSON.stringify({ comparison: `${directory}/four-layer-report.md`, apiRequests: all.length,
    variants: variants.map(v => ({ variant: v.variant, correct: v.correct, planned: v.planned,
      averageSeconds: v.meanElapsedMs/1000, inputTokens: v.tokens.input.sum, outputTokens: v.tokens.output.sum })) }));
  return summary;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await aggregate();
