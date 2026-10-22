import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { SPEC, HERE, loadInputs, makeRequest, grade, schedule, guardBudget, guardEndpoint,
  claimAttempt, runExperiment } from './experiment.mjs';

const input = await loadInputs();
const wire = (ref, action = 'CLICK') => JSON.stringify({ action, targetRef: ref, authoritativeField: 'NONE', requestedState: 'NONE', reason: 'Read-only calendar navigation.' });

test('source-grounded oracle rejects both misleading Next controls; literal reviewed example', () => {
  const answer = input.oracle.get('c-01-d028');
  assert.equal(answer.expectedRef, 'observation:4:target:90');
  assert.equal(grade(wire('observation:4:target:90'), answer).correct, true);
  assert.equal(grade(wire('observation:4:target:131'), answer).category, 'GUEST_PAGER');
  assert.equal(grade(wire('observation:4:target:136'), answer).category, 'TIME_PAGER');
  assert.equal(grade(wire(answer.expectedRef, 'OPEN_LINK'), answer).correct, false);
  assert.equal(grade('{}', answer).category, 'INVALID_SCHEMA');
  assert.equal(grade('not-json', answer).category, 'INVALID_JSON');
});

test('all 69 real month targets already exist, permit CLICK and have source-derived Calendar labels', () => {
  assert.equal(input.seeds.length, 69);
  for (const seed of input.seeds) {
    const answer = input.oracle.get(seed.id);
    const original = JSON.parse(seed.captured.messages.find(m => m.role === 'user').content).observation;
    const actual = original.targets.find(t => t.ref === answer.expectedRef);
    assert.equal(actual.label, '');
    assert.ok(actual.availableActions.includes('CLICK'));
    const augmented = input.v3.get(seed.id).targets.find(t => t.ref === answer.expectedRef);
    assert.equal(augmented.label, 'Next month');
    assert.equal(augmented.controlGroupLabel, 'Calendar');
    for (const [ref, owner] of Object.entries(answer.pagerRefs)) {
      const v3 = input.v3.get(seed.id).targets.find(t => t.ref === ref);
      assert.equal(v3.controlGroupLabel, owner === 'time-select-next' ? 'Time' : 'Guests');
      assert.equal(grade(wire(ref), answer).correct, false);
    }
  }
});

test('V0 is exact captured request; V1 only changes generic skills; V2 only thinking/time/output; V3 only observation', () => {
  for (const seed of input.seeds) {
    const baseline = makeRequest(seed, 'V0', input);
    assert.deepEqual(baseline.messages, seed.captured.messages);
    assert.equal(baseline.timeoutMs, seed.captured.timeoutMs);
    assert.equal(baseline.maxOutputTokens, seed.captured.maxOutputTokens);
    assert.equal(baseline.thinking, 'disabled');
    assert.equal(baseline.temperature, 0);
    for (const variant of ['V1', 'V2', 'V3']) {
      const changed = makeRequest(seed, variant, input);
      const a = structuredClone(baseline), b = structuredClone(changed);
      a.taskId = b.taskId = 'comparison';
      if (variant === 'V2') {
        assert.deepEqual(a.messages, b.messages);
        assert.equal(b.thinking, 'enabled');
        assert.equal(b.timeoutMs, 120000);
        assert.equal(b.maxOutputTokens, 8192);
        b.thinking = a.thinking; b.timeoutMs = a.timeoutMs; b.maxOutputTokens = a.maxOutputTokens;
      } else {
        const ma = a.messages.find(m => m.role === 'user'), mb = b.messages.find(m => m.role === 'user');
        const original = JSON.parse(ma.content), modified = JSON.parse(mb.content);
        if (variant === 'V1') {
          assert.equal(modified.skills.generic, original.skills.generic + input.addendum);
          modified.skills.generic = original.skills.generic;
        } else {
          assert.deepEqual(modified.observation.targets.map(t => t.ref), original.observation.targets.map(t => t.ref));
          assert.equal(modified.observation.displayedCalendarMonth.month, 10);
          const stripped = structuredClone(modified.observation);
          delete stripped.displayedCalendarMonth;
          for (let i = 0; i < stripped.targets.length; i++) {
            const target = stripped.targets[i]; delete target.controlGroupLabel;
            if (target.labelSource) { assert.equal(original.observation.targets[i].label, ''); target.label = ''; delete target.labelSource; }
          }
          assert.deepEqual(stripped, original.observation);
          modified.observation = original.observation;
        }
        assert.deepEqual(modified, original);
        mb.content = ma.content;
      }
      assert.deepEqual(b, a);
      assert.ok(!changed.messages.some(m => /expectedRef|expectedAction|pagerRefs/.test(m.content)));
    }
  }
});

test('276 unique logical requests in cyclic balanced order; hard and phase budgets fail closed', () => {
  const tasks = schedule(input.seeds);
  assert.equal(tasks.length, 276);
  assert.equal(new Set(tasks.map(t => t.id)).size, 276);
  for (const variant of SPEC.variants) assert.equal(tasks.filter(t => t.variant === variant).length, 69);
  assert.deepEqual(tasks.slice(0, 4).map(t => t.variant), ['V0', 'V1', 'V2', 'V3']);
  assert.deepEqual(tasks.slice(4, 8).map(t => t.variant), ['V1', 'V2', 'V3', 'V0']);
  guardBudget(275); guardBudget(299);
  assert.throws(() => guardBudget(300), /BUDGET/);
  assert.throws(() => guardBudget(2282), /BUDGET/);
});

test('website, alternate provider path and wrong-method network attempts are rejected', () => {
  guardEndpoint(SPEC.endpoint, { method: 'POST' });
  for (const url of ['https://tabelog.com/', 'https://www.tablecheck.com/', 'https://api.deepseek.com/chat/completions', SPEC.endpoint + '?x=1']) {
    assert.throws(() => guardEndpoint(url, { method: 'POST' }), /NETWORK_BOUNDARY/);
  }
  assert.throws(() => guardEndpoint(SPEC.endpoint, { method: 'GET' }), /NETWORK_BOUNDARY/);
});

test('started receipt cannot be overwritten or repeated', async () => {
  const tmp = await mkdtemp(resolve(tmpdir(), 'calendar-claim-'));
  try {
    const path = resolve(tmp, 'started.json'); await claimAttempt(path, { id: 'one' });
    await assert.rejects(claimAttempt(path, { id: 'one' }), { code: 'EEXIST' });
  } finally { await rm(tmp, { recursive: true }); }
});

test('scripted transport drives production Gateway -> raw response -> independent score -> report, zero network/model', async () => {
  const seed = input.seeds[0], answer = input.oracle.get(seed.id);
  const tasks = schedule([seed]);
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('OFFLINE_TEST_NETWORK_FORBIDDEN'); };
  let calls = 0;
  try {
    const summary = await runExperiment({ directory: resolve(HERE, 'offline-smoke'), mode: 'SCRIPTED_OFFLINE', input,
      tasks, freeze: { sha256: 'OFFLINE_CONTROL_NOT_A_MODEL_BATCH_FREEZE', files: 0 }, committedSha: 'NOT_APPLICABLE_SCRIPTED',
      providerFetch: async (_url, init, task) => {
        calls++;
        const payload = JSON.parse(init.body);
        assert.equal(payload.thinking.type, task.variant === 'V2' ? 'enabled' : 'disabled');
        const ref = ['V0', 'V1'].includes(task.variant) ? Object.keys(answer.pagerRefs).find(ref => answer.pagerRefs[ref] === (task.variant === 'V0' ? 'headcount-select-next' : 'time-select-next')) : answer.expectedRef;
        return new Response(JSON.stringify({ id: 'offline', model: SPEC.model, choices: [{ finish_reason: 'tool_calls', message: {
          tool_calls: [{ type: 'function', function: { name: 'browser_read_action', arguments: wire(ref) } }],
        } }], usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120, prompt_cache_hit_tokens: 80, prompt_cache_miss_tokens: 20,
          completion_tokens_details: { reasoning_tokens: task.variant === 'V2' ? 10 : 0 } } }), { status: 200 });
      } });
    assert.equal(calls, 4);
    assert.equal(summary.actualModelCalls, 0);
    assert.equal(summary.websiteRequests, 0);
    assert.deepEqual(summary.variants.map(v => v.correct), [0, 0, 1, 1]);
    assert.deepEqual(summary.variants.map(v => v.tokens.total.sum), [120, 120, 120, 120]);
  } finally { globalThis.fetch = nativeFetch; }
});
