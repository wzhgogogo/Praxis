/** Model-only component regression. The only network entry is the DeepSeek POST. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DeepSeekModelGateway } from '../../../src/infrastructure/deepseek/deepseek-model-gateway.js';
import { ModelBrowserReadActionDecision, BrowserReadDecisionError, BROWSER_ACTION_DECISION_SCHEMA,
  BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA, BROWSER_READ_DECISION_PROMPT_VERSION } from '../../../src/infrastructure/browser/browser-action-decision.js';
import type { BrowserReadDecisionInput, BrowserReadAction } from '../../../src/infrastructure/browser/browser-action-decision.js';
import type { ModelResponse, ModelRequest } from '../../../src/core/model/contracts.js';
import { loadBrowserReadSkills } from '../../../src/infrastructure/browser/browser-read-skills.js';
import { sourceListingCompletion } from '../../../src/integrations/restaurant-search/native-restaurant-search.js';
import { tabelogDiscoveryPack } from '../../../src/integrations/restaurant-search/source-packs.js';
import { chargeG6 } from '../../../src/eval/restaurant/agent-loop/g6/budget.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const repo = fileURLToPath(new URL('../../../', import.meta.url));
const local = (name: string) => join(root, name);
const hash = (b: Uint8Array | string) => createHash('sha256').update(b).digest('hex');
const git = (...args: string[]) => execFileSync('git', ['--no-optional-locks', ...args], { cwd: repo, maxBuffer: 16 * 1024 * 1024 });
const json = (v: unknown) => JSON.stringify(v, null, 2) + '\n';
type Frame = { id: string; sequence: number; file?: string; sha256?: string;
  provenance: { commit: string; file: string; fileSHA256?: string; document?: string; documentSHA256?: string };
  gold: { action: string; field?: string; targetRef?: string; label?: string } };

const manifest = await readFile(local('frames.json'));
const frames: Frame[] = JSON.parse(manifest.toString());
const ledgerPath = local('active-budget.json');
const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));
assert.equal(hash(await readFile(join(repo, ledger.baseLedger))), ledger.baseLedgerSHA256);
assert.deepEqual(ledger.limits, {realModelCalls: 10, fullLive: 0, evaluationPublicGET: 0, environmentReruns: 0});
assert.equal(ledger.cumulative.realModelCalls, 2);
assert.equal(frames.length, 7);
assert.equal(new Set(frames.map(f => f.id)).size, frames.length);
assert.equal(BROWSER_READ_DECISION_PROMPT_VERSION, '27');
assert.equal(BROWSER_ACTION_DECISION_SCHEMA.version, '16');
const fields = ['action', 'targetRef', 'valueGroupRef', 'authoritativeField', 'requestedState', 'reason'];
const schema = BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA as {
  required: string[]; additionalProperties: boolean; properties: Record<string, {type: string; enum?: readonly string[]}>;
};
assert.deepEqual([...schema.required].sort(), [...fields].sort());
assert.equal(schema.additionalProperties, false);

const objectiveSource = await readFile(join(repo, 'src/integrations/restaurant-search/native-restaurant-search.ts'), 'utf8');
const objectiveLine = objectiveSource.split('\n').find(l => l.trim().startsWith('objective:"Find the current public restaurant list'));
assert.ok(objectiveLine);
const objective = JSON.parse(objectiveLine.trim().slice('objective:'.length, -1));
const prepared = [];
for (const frame of frames) {
  let original: BrowserReadDecisionInput;
  let html = '';
  if (frame.file) {
    const bytes = await readFile(join(repo, frame.file));
    assert.equal(hash(bytes), frame.sha256);
    original = JSON.parse(bytes.toString());
  } else {
    const p = frame.provenance;
    const bytes = git('show', p.commit + ':' + p.file);
    assert.equal(hash(bytes), p.fileSHA256);
    const row = bytes.toString().trimEnd().split('\n').map(l => JSON.parse(l)).find(r => r.sequence === frame.sequence);
    assert.equal(row.purpose, 'browser_read_decide');
    assert.equal(row.browser.recordingSnapshot, 10);
    original = JSON.parse(row.messages.find((m: {role: string}) => m.role === 'user').content);
    const document = git('show', p.commit + ':' + p.document);
    assert.equal(hash(document), p.documentSHA256);
    html = document.toString();
  }
  const path = original.source === 'TABLECHECK' ? 'web-skills/tablecheck/SKILL.md' : 'web-skills/tabelog/SKILL.md';
  const skills = loadBrowserReadSkills(original.source, path);
  const input = { ...original, taskId: 'premerge-scope:' + frame.id, skills,
    ...(original.stage === 'DISCOVERY' ? {objective} : {}) };
  const o = input.observation;
  const expectedTarget = o.targets.find(t => t.ref === frame.gold.targetRef);
  if (frame.gold.targetRef) {
    assert.equal(expectedTarget?.label, frame.gold.label);
    const offered = [frame.gold.action, frame.gold.field].filter(Boolean).join(':');
    assert.ok(expectedTarget?.availableActions?.some(a => a === offered));
    if (frame.gold.field === 'DATE') assert.equal(expectedTarget.value, input.goal.date);
  }
  let scope;
  if (frame.gold.action === 'COMPLETE') {
    assert.ok(input.goal.retrievalExpression);
    const page = { url: o.url, title: o.title, text: o.visibleText, html };
    const outlets = tabelogDiscoveryPack.parseListing(page).outlets;
    if (frame.id === 'D01-scoped-list') {
      assert.equal(new URL(o.url).searchParams.get('sw'), 'Spanish');
      assert.match(o.title, /Takadanobaba/);
      assert.ok(o.visibleText.includes('0 results／0 results'));
      assert.equal(outlets.length, 0);
    } else {
      // Independent scope/count checks on the archived page and observed public controls.
      assert.equal(o.title, 'Best Robatayaki in Nakano | Tabelog');
      assert.ok(html.includes('Best Robatayaki in Nakano'));
      assert.ok(o.visibleText.includes('About sorting 1～2／2'));
      const detailLinks = ['https://tabelog.com/en/tokyo/A1319/A131902/13309182/', 'https://tabelog.com/en/tokyo/A1319/A131902/13000216/'];
      for (const href of detailLinks) {
        assert.ok(o.targets.some(t => t.href === href));
        assert.ok(html.includes(href));
        assert.ok(outlets.some(x => x.sourceUrl === href));
      }
    }
    const result = sourceListingCompletion(tabelogDiscoveryPack, page, [], input.goal.retrievalExpression, input.goal.location);
    assert.equal(result.complete, true);
    assert.equal(result.resultBusy, false);
    scope = {complete: result.complete, busy: result.resultBusy,
      sourceDisplayedCount: frame.id === 'D01-scoped-list' ? 0 : 2, parsedWholeDocumentLinks:outlets.length, url:o.url, title:o.title};
  }
  prepared.push({frame, input, scope, contextSHA256: hash(JSON.stringify(input))});
}

const report = {promptVersion: BROWSER_READ_DECISION_PROMPT_VERSION, schemaVersion: BROWSER_ACTION_DECISION_SCHEMA.version,
  srcTree: git('rev-parse','HEAD:src').toString().trim(), manifestSHA256: hash(manifest),
  skillSHA256: hash(await readFile(join(repo, 'web-skills/tabelog/SKILL.md'))),
  priorCalls: ledger.cumulative.realModelCalls, maximumAdditionalCalls: 8,
  samples: prepared.map(({frame, scope, contextSHA256}) => ({id: frame.id, sequence: frame.sequence, scope, contextSHA256, expected: frame.gold})),
  tablecheck: {DATE: 'D8 #28', PARTY_SIZE: 'UNCOVERED_BY_RETAINED_RECORDINGS', TIME: 'UNCOVERED_BY_RETAINED_RECORDINGS'}};

if (process.argv.includes('--preflight')) {
  process.stdout.write(json(report));
  process.exit(0);
}
const sha = git('rev-parse','HEAD').toString().trim();
assert.equal(process.argv[2], '--source-sha');
assert.equal(process.argv[3], sha);
assert.equal(git('status','--porcelain').toString(), '');
assert.deepEqual(report, JSON.parse(await readFile(local('preflight.json'), 'utf8')));
assert.ok(process.execArgv.some(v => v.startsWith('--env-file=')) && process.env.PRAXIS_RECORDED_SCOPE_MODEL === '1');

const run = local('model-run');
await mkdir(run); // Exclusive batch. A second invocation cannot spend again.
const save = async (name: string, value: unknown) => {
  const text = json(value);
  if (secrets.some(v => text.includes(v))) throw Error('CREDENTIAL_SCAN_FAILED');
  await writeFile(join(run, name), text);
};
const secrets = Object.entries(process.env).filter(([k,v]) => /KEY|SECRET|TOKEN|PASSWORD/i.test(k) && v && v.length >= 8).map(([,v]) => v!);
let activeId = '';
let calls = 0;
const transmissions: {frame: string; method: string; host: string; status?: number}[] = [];
const gateway = DeepSeekModelGateway.fromEnvironment(process.env, {fetchImplementation: async (url, init) => {
  assert.equal(String(url), 'https://api.deepseek.com/beta/chat/completions');
  assert.equal(init?.method, 'POST');
  assert.ok(activeId && !transmissions.some(x => x.frame === activeId) && calls < 8);
  await chargeG6(ledgerPath, 'premerge-scope:' + sha + ':' + activeId, 'realModelCalls', '2026-11-15 CET approved diagnostic continuation, one model-only POST per recorded frame.');
  calls++;
  const receipt = {frame: activeId, method: 'POST', host: 'api.deepseek.com', status: undefined as number | undefined};
  transmissions.push(receipt);
  await save('transport.json', transmissions);
  const response = await fetch(url, {...init, redirect:'error'});
  receipt.status = response.status;
  await save('transport.json', transmissions);
  return response;
}});

function schemaPassed(wire: Record<string, unknown>) {
  return !!wire && typeof wire === 'object' && !Array.isArray(wire) && Object.keys(wire).length === fields.length
    && fields.every(k => typeof wire[k] === 'string')
    && Object.entries(schema.properties).every(([key, spec]) => !spec.enum || spec.enum.includes(String(wire[key])));
}

await save('started.json', {sourceSHA: sha, startedAt: new Date().toISOString(), ...report});
const results = [];
let stopped: string | undefined;
for (const {frame, input, scope} of prepared) {
  activeId = frame.id;
  let response: ModelResponse | undefined;
  let globalSchemaError = false;
  let providerCode: string | undefined;
  const decision = new ModelBrowserReadActionDecision({async complete(request: ModelRequest) {
    if (request.responseFormat !== 'JSON_SCHEMA' || request.outputSchema.version !== '16'
        || JSON.stringify(request.outputSchema.jsonSchema) !== JSON.stringify(schema)) {
      globalSchemaError = true;
      throw Error('GLOBAL_SCHEMA_CONTRACT_MISMATCH');
    }
    await save(frame.id + '.request.json', {purpose: request.purpose, prompt: request.promptVersion, schema: request.outputSchema.version,
      messagesSHA256: hash(JSON.stringify(request.messages)), maxOutputTokens: request.maxOutputTokens});
    try { response = await gateway.complete(request); }
    catch (err) { providerCode = typeof err === 'object' && err && 'code' in err ? String(err.code) : 'TRANSPORT'; throw err; }
    await save(frame.id + '.response.json', {model: response.model, finishReason: response.finishReason,
      outputText: response.outputText, latencyMs: response.latencyMs, usage: response.usage});
    return response;
  }});
  let action: BrowserReadAction | undefined;
  let errorCode: string | undefined;
  const t0 = Date.now();
  try { action = await decision.decide(input); }
  catch (err) {
    errorCode = globalSchemaError ? 'GLOBAL_SCHEMA_CONTRACT_MISMATCH' : providerCode ?? (err instanceof BrowserReadDecisionError ? err.code : 'DIAGNOSTIC_ERROR');
    if (globalSchemaError || providerCode || !(err instanceof BrowserReadDecisionError) || err.code === 'MODEL_FAILURE') stopped = errorCode;
  }
  let wireOK = false;
  if (response?.finishReason === 'TOOL_CALLS') {
    try { wireOK = schemaPassed(JSON.parse(response.outputText)); } catch { /* A single malformed reply is a frame failure. */ }
  }
  const targetRef = action && ('targetRef' in action ? action.targetRef : 'scopeRef' in action ? action.scopeRef : undefined);
  const target = input.observation.targets.find(t => t.ref === targetRef);
  const correct = !!action && action.type === frame.gold.action
    && (!frame.gold.targetRef || target?.ref === frame.gold.targetRef)
    && (!frame.gold.field || ('field' in action && action.field === frame.gold.field))
    && (frame.gold.action !== 'COMPLETE' || scope?.complete === true);
  results.push({id:frame.id, status:wireOK && correct ? 'PASS' : 'FAIL', wireOK, semanticOK:correct, action,
    target: target && {ref:target.ref, label:target.label}, errorCode, usage:response?.usage, latencyMs:Date.now()-t0});
  await save('results.json', {sourceSHA:sha, status:stopped ? 'STOPPED_SYSTEM_FAILURE' : results.length < prepared.length ? 'RUNNING'
    : results.every(r => r.status === 'PASS') ? 'PASS' : 'FAIL', stopped, websiteGET:0, fullLive:0, calls, results});
  console.log(frame.id, results.at(-1)!.status, action?.type ?? errorCode);
  if (stopped) break;
}
await save('credential-scan.json', {exactCredentialHits:0, requestHeadersSaved:false, modelRequestsStoredAsHashes:true});
if (stopped || results.some(r => r.status === 'FAIL')) process.exitCode = 1;
