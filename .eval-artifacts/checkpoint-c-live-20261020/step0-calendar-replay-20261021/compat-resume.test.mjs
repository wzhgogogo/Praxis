import test from 'node:test';
import assert from 'node:assert/strict';
import { compatibleInit, priorAndRemaining } from './compat-resume.mjs';
import { DeepSeekModelGateway } from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import { SPEC, loadInputs, makeRequest } from './experiment.mjs';

test('only V2 wire tool_choice changes; other variant payloads retain exact bytes', () => {
  const payload = { model: SPEC.model, tools: [{ type: 'function', function: { name: 'browser_read_action', strict: true, parameters: { type: 'object' } } }],
    tool_choice: { type: 'function', function: { name: 'browser_read_action' } }, thinking: { type: 'enabled' }, max_tokens: 8192 };
  const init = { method: 'POST', body: JSON.stringify(payload), redirect: 'error' };
  const result = compatibleInit(init, 'V2'), changed = JSON.parse(result.body);
  assert.equal(changed.tool_choice, 'auto'); changed.tool_choice = payload.tool_choice;
  assert.deepEqual(changed, payload);
  for (const v of ['V0', 'V1', 'V3']) assert.equal(compatibleInit(init, v), init);
  assert.throws(() => compatibleInit({ body: '{}' }, 'V2'), /UNEXPECTED_V2/);
});

test('resume preserves successful V0/V1, retains the prior failed V2 and charges 277 requests', async () => {
  const prior = await priorAndRemaining();
  assert.equal(prior.priorCalls, 3);
  assert.equal(prior.tasks.length, 274);
  assert.ok(!prior.tasks.some(t => t.id === 'c-01-d008-V0' || t.id === 'c-01-d008-V1'));
  assert.equal(prior.tasks[0].id, 'c-01-d008-V2');
  assert.equal(prior.priorCalls + prior.tasks.length, 277);
});

test('real production Gateway accepts thinking + strict tool schema + auto through scripted transport; 0 network', async () => {
  const input = await loadInputs();
  const request = makeRequest(input.seeds[0], 'V2', input);
  let calls = 0;
  const gateway = new DeepSeekModelGateway({ apiKey: 'offline-fixture-credential', model: SPEC.model,
    fetchImplementation: async (_url, init) => {
      calls++;
      const body = JSON.parse(compatibleInit(init, 'V2').body);
      assert.equal(body.tool_choice, 'auto'); assert.equal(body.tools[0].function.strict, true);
      assert.equal(body.thinking.type, 'enabled');
      return new Response(JSON.stringify({ id: 'scripted-compat', model: SPEC.model, choices: [{ finish_reason: 'tool_calls', message: {
        tool_calls: [{ type: 'function', function: { name: 'browser_read_action', arguments: '{}' } }],
      } }] }), { status: 200 });
    } });
  assert.equal((await gateway.complete(request)).outputText, '{}');
  assert.equal(calls, 1);
});
