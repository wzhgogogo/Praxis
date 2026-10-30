import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { inspectTabelogVacancyResponse } from '../../../src/integrations/tabelog/tabelog-vacancy-response.ts';

// No browser, provider, database or source navigation is instantiated.
globalThis.fetch = async () => { throw new Error('External access forbidden in offline dependency probe'); };
const directory = new URL('./', import.meta.url);
const input = JSON.parse(await readFile(new URL('input.json', directory), 'utf8'));
const strings = value => typeof value === 'string' ? [value]
  : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];
const cases = input.originalLinks.map(originalUrl => {
  const snapshot = structuredClone(input.snapshot);
  snapshot.responses[0].body.selection[0].url = originalUrl;
  const observation = inspectTabelogVacancyResponse(snapshot, input.request.date, input.request.partySize);
  assert.equal(observation.status, 'OBSERVED', 'control must be a valid admitted vacancy response');
  assert.deepEqual(observation.availableSlots, ['19:00']);
  return { originalUrl, observation, originalUrlRetained: strings(observation).includes(originalUrl) };
});
assert.notEqual(cases[0].originalUrl, cases[1].originalUrl);
assert.deepEqual(cases[0].observation, cases[1].observation, 'distinct original URL bytes currently collapse to identical output');
await writeFile(new URL('red.json', directory), JSON.stringify({
  mode: 'OFFLINE_CONSTRUCTED_PROTOCOL_INTERFACE_PROBE',
  checkedAtCET: new Date().toLocaleString('sv-SE', { timeZone: 'Etc/GMT-1' }) + ' CET (UTC+1)',
  cases,
  startupButtonTest: 'NOT_RUN_DEPENDENCY_BLOCKED',
  newExternalCalls: 0,
}, null, 2) + '\n');
assert.ok(cases.every(row => row.originalUrlRetained), 'B1_EXACT_SOURCE_LINK_OUTPUT_MISSING: admitted output must retain the source original URL');
