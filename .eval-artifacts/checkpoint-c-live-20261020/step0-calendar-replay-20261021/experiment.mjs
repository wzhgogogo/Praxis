import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DeepSeekModelGateway } from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import { BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA } from '../../../src/infrastructure/browser/browser-action-decision.ts';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, '../../..');
export const SPEC = {
  schema: 'checkpoint-c-calendar-experiment@1', evidenceStatus: 'EXPOSED_DEVELOPMENT_REPLAY',
  model: 'deepseek-v4-flash', variants: ['V0', 'V1', 'V2', 'V3'], points: 69, plannedCalls: 276,
  hardCallLimit: 300, baselineModelCalls: 1718, phaseModelLimit: 4000,
  endpoint: 'https://api.deepseek.com/beta/chat/completions',
  thinkingTimeoutMs: 120000, thinkingMaxOutputTokens: 8192,
  automaticRetries: 0, sourceRequestsAllowed: 0, concurrency: 1,
  oracle: 'DOM month navigation node + captured binding, user approved; not positional Next',
};
export const sha = value => createHash('sha256').update(value).digest('hex');
export const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
export const writeJson = async (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const jsonl = async name => (await readFile(resolve(HERE, name), 'utf8')).trim().split('\n').map(JSON.parse);

export async function loadInputs() {
  const [seeds, v3, oracle, addendum] = await Promise.all([
    jsonl('seeds.jsonl'), jsonl('observations-v3.jsonl'), readJson(resolve(HERE, 'oracle.json')),
    readFile(resolve(HERE, 'skills-v1-addendum.md'), 'utf8'),
  ]);
  return { seeds, v3: new Map(v3.map(x => [x.id, x.observation])),
    oracle: new Map(oracle.answers.map(x => [x.id, x])), addendum };
}

export function makeRequest(seed, variant, input) {
  if (!SPEC.variants.includes(variant)) throw new Error('UNKNOWN_VARIANT');
  const row = seed.captured;
  const messages = structuredClone(row.messages);
  if (variant === 'V1' || variant === 'V3') {
    const message = messages.find(m => m.role === 'user');
    const value = JSON.parse(message.content);
    if (variant === 'V1') value.skills.generic += input.addendum;
    else value.observation = structuredClone(input.v3.get(seed.id));
    message.content = JSON.stringify(value);
  }
  return {
    taskId: `checkpoint-c-calendar:${seed.id}:${variant}`, purpose: row.purpose,
    promptVersion: row.promptVersion, messages, responseFormat: row.responseFormat,
    outputSchema: { ...row.outputSchema, jsonSchema: BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA },
    timeoutMs: variant === 'V2' ? SPEC.thinkingTimeoutMs : row.timeoutMs,
    fallback: 'FAIL_CLOSED', maxOutputTokens: variant === 'V2' ? SPEC.thinkingMaxOutputTokens : row.maxOutputTokens,
    temperature: row.temperature, thinking: variant === 'V2' ? 'enabled' : row.thinking,
  };
}

export function schedule(seeds) {
  return seeds.flatMap((seed, i) => SPEC.variants.map((_, j) => ({
    id: `${seed.id}-${SPEC.variants[(i + j) % 4]}`, seedId: seed.id,
    variant: SPEC.variants[(i + j) % 4], runId: seed.runId,
  })));
}

export function grade(outputText, answer) {
  let wire;
  try { wire = JSON.parse(outputText); } catch { return { correct: false, category: 'INVALID_JSON' }; }
  const schema = BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA;
  if (!wire || Array.isArray(wire) || typeof wire !== 'object'
    || Object.keys(wire).sort().join('|') !== [...schema.required].sort().join('|')
    || Object.entries(schema.properties).some(([key, rule]) => typeof wire[key] !== 'string' || rule.enum && !rule.enum.includes(wire[key]))) {
    return { correct: false, category: 'INVALID_SCHEMA' };
  }
  const selectedRef = wire.targetRef;
  const correct = wire.action === answer.expectedAction && selectedRef === answer.expectedRef;
  const pager = answer.pagerRefs[selectedRef];
  const category = correct ? 'CORRECT_MONTH_CONTROL' : pager === 'headcount-select-next' ? 'GUEST_PAGER'
    : pager === 'time-select-next' ? 'TIME_PAGER'
      : answer.calendarPreviousRefs.includes(selectedRef) ? 'CALENDAR_PREVIOUS'
        : selectedRef === answer.expectedRef ? 'MONTH_CONTROL_WRONG_ACTION' : 'OTHER_ACTION';
  return { correct, category, selectedRef, action: wire.action };
}

export function guardEndpoint(url, init) {
  if (String(url) !== SPEC.endpoint || init?.method !== 'POST') throw new Error('MODEL_ONLY_NETWORK_BOUNDARY');
}

export function guardBudget(count) {
  if (count >= SPEC.hardCallLimit || SPEC.baselineModelCalls + count >= SPEC.phaseModelLimit) throw new Error('MODEL_CALL_BUDGET_EXHAUSTED');
}

export async function claimAttempt(path, value) {
  await writeJson(path, value); // wx: never repeat an already-started logical request.
}

export async function verifyFreeze() {
  const manifestBytes = await readFile(resolve(HERE, 'freeze.json'));
  const manifest = JSON.parse(manifestBytes);
  for (const file of manifest.files) {
    if (sha(await readFile(resolve(ROOT, file.path))) !== file.sha256) throw new Error(`FREEZE_MISMATCH:${file.path}`);
  }
  return { sha256: sha(manifestBytes), files: manifest.files.length };
}

export async function runExperiment({ directory, mode, input, tasks, freeze, providerFetch, committedSha }) {
  const scripted = mode === 'SCRIPTED_OFFLINE';
  if (!scripted && process.env.DEEPSEEK_MODEL !== SPEC.model) throw new Error('CONFIGURED_MODEL_MISMATCH');
  if (!scripted && !process.env.DEEPSEEK_API_KEY) throw new Error('MISSING_MODEL_CREDENTIAL');
  await mkdir(directory, { recursive: false }); // one batch, no implicit resume or duplicated calls.
  await mkdir(resolve(directory, 'attempts'));
  await mkdir(resolve(directory, 'results'));
  await writeJson(resolve(directory, 'started.json'), { mode, startedAt: new Date().toISOString(), spec: SPEC,
    planned: tasks.length, freeze, committedSha, sourceRequestsAllowed: 0 });
  const seeds = new Map(input.seeds.map(s => [s.id, s]));
  let attempts = 0, consecutiveErrors = 0, stopped = null;
  const requestManifest = scripted ? null : new Map((await readJson(resolve(HERE, 'request-manifest.json'))).requests.map(r => [r.id, r]));
  for (const task of tasks) {
    guardBudget(attempts);
    const request = makeRequest(seeds.get(task.seedId), task.variant, input);
    const requestSha256 = sha(JSON.stringify(request));
    if (requestManifest && requestManifest.get(task.id)?.sha256 !== requestSha256) throw new Error('REQUEST_FREEZE_MISMATCH');
    const startedAt = new Date().toISOString(), clock = performance.now();
    await claimAttempt(resolve(directory, 'attempts', `${task.id}.json`), { ...task, startedAt, requestSha256 });
    attempts++;
    let provider = null, invocation = null, fetches = 0;
    const transport = async (url, init) => {
      guardEndpoint(url, init);
      if (++fetches !== 1) throw new Error('DUPLICATE_TRANSPORT_ATTEMPT');
      await writeJson(resolve(directory, 'attempts', `${task.id}.transport.json`), {
        method: init.method, endpoint: String(url), requestBodySha256: sha(init.body), startedAt: new Date().toISOString(),
      });
      const response = await providerFetch(url, { ...init, redirect: 'error' }, task);
      // Retain provider usage and structured output, never headers, secrets or reasoning text.
      const bodyText = await response.text();
      let body = null;
      try { body = JSON.parse(bodyText); } catch { /* Gateway will report malformed response. */ }
      provider = { status: response.status, bodySha256: sha(bodyText), id: body?.id ?? null, model: body?.model ?? null,
        usage: body?.usage ?? null, finishReason: body?.choices?.[0]?.finish_reason ?? null,
        toolCalls: body?.choices?.[0]?.message?.tool_calls ?? null,
        errorType: body?.error?.type ?? null, errorCode: body?.error?.code ?? null };
      await writeJson(resolve(directory, 'results', `${task.id}.provider.json`), provider);
      return new Response(bodyText, { status: response.status });
    };
    const gateway = new DeepSeekModelGateway({ apiKey: scripted ? 'offline-fixture-credential' : process.env.DEEPSEEK_API_KEY,
      model: SPEC.model, fetchImplementation: transport, observer: { observe: record => { invocation = record; } } });
    let response = null, error = null;
    try { response = await gateway.complete(request); }
    catch (e) { error = { code: e.code ?? 'UNKNOWN', providerStatus: e.providerStatus ?? null,
      transportCode: e.providerError?.type === 'TRANSPORT' ? e.providerError.code ?? null : null }; }
    const elapsedMs = performance.now() - clock;
    const row = { ...task, mode, requestSha256, startedAt, finishedAt: new Date().toISOString(), elapsedMs,
      fetches, outcome: response ? 'SUCCEEDED' : 'FAILED', response, error, invocation,
      providerUsage: provider?.usage ?? null, providerStatus: provider?.status ?? null, providerModel: provider?.model ?? null };
    await writeJson(resolve(directory, 'results', `${task.id}.json`), row);
    console.log(JSON.stringify({ completed: attempts, planned: tasks.length, id: task.id, outcome: row.outcome, elapsedMs: Math.round(elapsedMs) }));
    consecutiveErrors = error ? consecutiveErrors + 1 : 0;
    if (error && [400, 401, 402, 403].includes(error.providerStatus)) stopped = `PROVIDER_HTTP_${error.providerStatus}`;
    else if (consecutiveErrors >= 3) stopped = 'THREE_CONSECUTIVE_PROVIDER_FAILURES';
    if (stopped) break;
  }
  const frozenAfter = scripted ? freeze : await verifyFreeze();
  await writeJson(resolve(directory, 'finished.json'), { finishedAt: new Date().toISOString(), mode, attempts,
    actualModelCalls: scripted ? 0 : attempts, scriptedRequests: scripted ? attempts : 0,
    sourceRequests: 0, planned: tasks.length, stopped, freezeAfter: frozenAfter });
  return summarize(directory, input, tasks);
}

const sum = values => values.reduce((a, b) => a + b, 0);
const avg = values => values.length ? sum(values) / values.length : null;
export async function summarize(directory, input, tasks) {
  const files = await readdir(resolve(directory, 'results'));
  const rows = await Promise.all(files.filter(f => !f.endsWith('.provider.json')).map(f => readJson(resolve(directory, 'results', f))));
  const byId = new Map(rows.map(r => [r.id, r]));
  const evaluated = tasks.map(task => {
    const row = byId.get(task.id);
    return { ...task, outcome: row?.outcome ?? 'NOT_REACHED',
      ...(row?.response ? grade(row.response.outputText, input.oracle.get(task.seedId)) : { correct: false, category: row ? 'PROVIDER_FAILURE' : 'NOT_REACHED' }) };
  });
  const variants = SPEC.variants.map(variant => {
    const planned = evaluated.filter(r => r.variant === variant);
    const completed = rows.filter(r => r.variant === variant);
    const success = completed.filter(r => r.response);
    const tokens = completed.filter(r => r.providerUsage);
    const token = name => {
      const known = tokens.map(r => name(r.providerUsage)).filter(x => typeof x === 'number');
      return { sum: known.length ? sum(known) : null, reportedCalls: known.length, attemptedCalls: completed.length };
    };
    const correct = planned.filter(r => r.correct).length;
    return { variant, planned: planned.length, attempted: completed.length, succeeded: success.length,
      notReached: planned.length - completed.length, correct,
      accuracyAllPlanned: correct / planned.length, accuracyAttempted: completed.length ? correct / completed.length : null,
      meanElapsedMs: avg(completed.map(r => r.elapsedMs)), meanSucceededElapsedMs: avg(success.map(r => r.elapsedMs)),
      categories: Object.fromEntries([...new Set(planned.map(r => r.category))].map(c => [c, planned.filter(r => r.category === c).length])),
      tokens: { input: token(u => u.prompt_tokens), output: token(u => u.completion_tokens), total: token(u => u.total_tokens),
        reasoning: token(u => u.completion_tokens_details?.reasoning_tokens),
        cacheHit: token(u => u.prompt_cache_hit_tokens), cacheMiss: token(u => u.prompt_cache_miss_tokens) },
      byRun: [...new Set(tasks.map(t => t.runId))].map(runId => ({ runId, planned: planned.filter(r => r.runId === runId).length,
        correct: planned.filter(r => r.runId === runId && r.correct).length })),
      returnedModels: [...new Set(completed.map(r => r.providerModel).filter(Boolean))],
    };
  });
  const paired = SPEC.variants.slice(1).map(variant => {
    const pairs = input.seeds.map(s => ({ a: evaluated.find(r => r.seedId === s.id && r.variant === 'V0'),
      b: evaluated.find(r => r.seedId === s.id && r.variant === variant) })).filter(p => p.a && p.b);
    return { variant, versus: 'V0', pairedPlanned: pairs.length,
      improved: pairs.filter(p => !p.a.correct && p.b.correct).length,
      regressed: pairs.filter(p => p.a.correct && !p.b.correct).length,
      bothCorrect: pairs.filter(p => p.a.correct && p.b.correct).length,
      bothWrongOrNotReached: pairs.filter(p => !p.a.correct && !p.b.correct).length };
  });
  const start = await readJson(resolve(directory, 'started.json'));
  const finish = await readJson(resolve(directory, 'finished.json'));
  const summary = { schema: 'checkpoint-c-calendar-report@1', mode: start.mode, startedAt: start.startedAt,
    finishedAt: finish.finishedAt, freeze: start.freeze, committedSha: start.committedSha, planned: tasks.length,
    attempted: rows.length, actualModelCalls: finish.actualModelCalls, websiteRequests: finish.sourceRequests,
    stopped: finish.stopped, variants, paired, monetaryCost: 'NOT_EVALUATED_NO_FROZEN_UNIT_PRICE',
    endpoint: SPEC.endpoint, noBrowserActionsExecuted: true, productionChanges: 0,
    originalS0: 'c-04 PRESENT retained; no Live reauthorization implied' };
  await writeJson(resolve(directory, 'evaluations.json'), evaluated);
  await writeJson(resolve(directory, 'summary.json'), summary);
  const fmt = n => n === null ? '未报告' : Number(n).toFixed(1);
  const lines = ['# 检查点 C 第 0 步：翻月决策回放', '',
    `Evidence status: exposed development；${summary.mode}。${tasks.length} 计划／${rows.length} 尝试；真实模型 ${finish.actualModelCalls} 次；网站请求 ${finish.sourceRequests}；浏览器动作 0。`, '',
    '## 1 结果', '',
    '这是单步真实翻月控件选择率，按独立 DOM 对应的原 targetRef 和 CLICK 评分。未执行点击，不代表日历实际翻月、库存或交付成功。', '',
    '| 变体 | 正确／计划 | 尝试／完成响应 | 平均耗时 秒（含失败） | 输入 token | 输出 token | 推理 token | 缓存命中／未命中 token |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |'];
  for (const v of variants) lines.push(`| ${v.variant} | ${v.correct}/${v.planned}（${(100*v.accuracyAllPlanned).toFixed(1)}%） | ${v.attempted}/${v.succeeded} | ${fmt(v.meanElapsedMs === null ? null : v.meanElapsedMs/1000)} | ${v.tokens.input.sum ?? '未报告'} | ${v.tokens.output.sum ?? '未报告'} | ${v.tokens.reasoning.sum ?? '未报告'} | ${v.tokens.cacheHit.sum ?? '未报告'} / ${v.tokens.cacheMiss.sum ?? '未报告'} |`);
  lines.push('', 'token 为供应商实际返回的 usage；缺失字段保持未报告，完整覆盖率见 summary.json。未冻结单价，货币费用未评。', '',
    '## 2 逐环节', '',
    '原五次 153 个浏览器决策中 104 点满足宽筛选，选原模型明确点 Next 的 69 点，各变体一次；同店重复不去重。排除 35 点有清单，不把本样本当作全部决策的无偏代表。', '',
    '真实翻月是既有空标签 LINK；位置规则对应 59 个时间 Next、10 个人数 Next，不能作为正确答案。V3 按用户追加授权补语义，不新增控件引用。V0 原消息逐字保留；V1 只追加通用技能；V2 thinking＋120秒／8192输出；V3 只改 observation。', '',
    '逐点动作、错误类型、每原运行分层和成对差异见 evaluations.json / summary.json；provider 响应摘要、原始结构化输出、耗时和 token 见 results/，不可覆盖的调用凭据见 attempts/。', '',
    '## 3 严重程度与资源', '',
    `硬上限 300；实际 ${finish.actualModelCalls}，无自动重试。阶段账本从1718追加实际调用，完整 Live 与正式环境重跑均不增加。停止原因：${finish.stopped ?? '计划完成'}。`, '',
    '只有模型接口可联网；无来源访问或浏览器动作。本步不重新认证历史 S0，c-04 的 S0 越界仍 PRESENT，不解除 Live 阻断。', '',
    '## 4 归因与限制', '',
    '原观察把真实日历导航表示为空标签链接，而两个显式 Next 属于其他控件。成对结果可支持本批单步选择的对比；不能证明执行后月份变化、正常查位、整体交付改善或未暴露任务泛化。V3 包括追加批准的标签补全，不能把收益全部归因于组标签。', '',
    '每点每变体只有一次，且存在上下文聚类、缓存和时间影响；V2 放宽了时间及输出预算，不能声称同成本收益。报告后停下，等待复核者与用户决定采用方案，不进入后续第1–5步。', '',
    `冻结 SHA-256：${start.freeze.sha256}；代码提交：${start.committedSha}。`, '');
  await writeFile(resolve(directory, 'report.md'), lines.join('\n'), { flag: 'wx' });
  return summary;
}

export async function freezeInputs() {
  const input = await loadInputs();
  const tasks = schedule(input.seeds);
  if (tasks.length !== SPEC.plannedCalls) throw new Error('PLAN_COUNT_MISMATCH');
  const requests = tasks.map(t => ({ ...t, sha256: sha(JSON.stringify(makeRequest(input.seeds.find(s => s.id === t.seedId), t.variant, input))) }));
  await writeJson(resolve(HERE, 'request-manifest.json'), { spec: SPEC, requests });
  await writeJson(resolve(HERE, 'schedule.json'), tasks);
  const fileSet = new Set((await readJson(resolve(HERE, 'source-manifest.json'))).files.map(f => f.path));
  const visit = async path => { for (const f of await readdir(path, { withFileTypes: true })) {
    const name = resolve(path, f.name); if (f.isDirectory()) await visit(name); else fileSet.add(relative(ROOT, name));
  } };
  await visit(resolve(ROOT, 'src'));
  for (const f of ['package.json', 'package-lock.json', 'web-skills/browser-read/SKILL.md',
    '.eval-artifacts/checkpoint-c-live-20261020/guarded-continuation-20261021/phase2-ledger-after.json']) fileSet.add(f);
  for (const f of await readdir(HERE)) if (!f.startsWith('offline-') && f !== 'freeze.json') fileSet.add(relative(ROOT, resolve(HERE, f)));
  const files = await Promise.all([...fileSet].sort().map(async path => ({ path, sha256: sha(await readFile(resolve(ROOT, path))) })));
  await writeJson(resolve(HERE, 'freeze.json'), { schema: 'checkpoint-c-calendar-freeze@1', spec: SPEC, files });
  return verifyFreeze();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  if (command === '--freeze') console.log(JSON.stringify(await freezeInputs()));
  else if (command === '--run') {
    const freeze = await verifyFreeze();
    const input = await loadInputs();
    const { execFileSync } = await import('node:child_process');
    if (execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).trim()) throw new Error('WORKTREE_NOT_CLEAN');
    const committedSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
    const nativeFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error('UNSCOPED_NETWORK_DISABLED'); };
    const summary = await runExperiment({ directory: resolve(HERE, 'model-replay'), mode: 'REAL_MODEL_REPLAY', input,
      tasks: await readJson(resolve(HERE, 'schedule.json')), freeze, committedSha,
      providerFetch: (url, init) => nativeFetch(url, init) });
    console.log(JSON.stringify({ finished: true, attempted: summary.attempted, actualModelCalls: summary.actualModelCalls, stopped: summary.stopped }));
  } else throw new Error('EXPECTED_--freeze_OR_--run');
}
