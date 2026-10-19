// Batch-specific offline preparation. Never opens a browser or sends a request.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const base = '.eval-artifacts/p2-1-discovery-20261016';
const batch = `${base}/p21a-dom-replay-20261019`;
const old = `${base}/checkpoint-a-corrected-20261019`;
const load = p => JSON.parse(readFileSync(p, 'utf8'));
const save = (p, x) => writeFileSync(p, JSON.stringify(x, null, 2) + '\n');
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const source = p => import(pathToFileURL(join(process.cwd(), p)).href);
const { observedDirectoryCategories } = await source('src/integrations/restaurant-search/native-restaurant-search.ts');
const { tabelogDiscoveryPack: pack } = await source('src/integrations/restaurant-search/source-packs.ts');
const { ModelDiscoveryRetrievalPlanner } = await source('src/integrations/restaurant-search/discovery-retrieval-planner.ts');
const audit = load(`${old}/audit.json`), plan = load(`${old}/plan.json`);
const requests = [], inventory = [], originals = {};
const expected = new Map([
  ['p2-kf-h001-20261027', 5], ['p2-kichijoji-tempura-20261027', 9],
  ['p2-nakameguro-yakiniku-20261030', 9], ['p2-kf-h005-20261029', 0],
]);
for (const run of audit.rows) {
  const docs = load(run.recording).documents;
  const decisions = readFileSync(run.decisions, 'utf8').trim().split('\n').map(JSON.parse);
  const input = load(plan.planned[run.index].input);
  originals[run.recording] = sha(run.recording);
  originals[run.decisions] = sha(run.decisions);
  const extracted = docs.filter(d => expected.has(run.caseId) && pack.browser.directory.isRegionEntrance(d.url)
    && new URL(d.url).searchParams.has('sw')).map(d => {
    const file = join(dirname(run.recording), d.file);
    originals[file] = sha(file);
    const categories = observedDirectoryCategories(pack, { url: d.url, html: readFileSync(file, 'utf8'), text: '', title: '' }, d.url);
    assert.equal(categories.length, expected.get(run.caseId), `${run.caseId} snapshot ${d.snapshot}`);
    return { ...d, file, sha256: sha(file), categories };
  });
  inventory.push({ index: run.index, caseId: run.caseId, extracted });
  const attempted = [];
  for (const row of decisions.filter(d => d.purpose === 'restaurant_discovery_retrieval')) {
    const body = JSON.parse(row.messages.find(m => m.role === 'user').content);
    if (!body.observation) continue;
    assert.deepEqual(body.observation.categories, [], 'Original category context must be unchanged');
    const exact = docs.find(d => d.snapshot === row.browser?.recordingSnapshot && d.url === body.observation.url);
    const fallback = extracted.find(d => pack.browser.directory.isSameObservedRegionHomepage(body.observation.url, d.url)
      || pack.browser.directory.listingRoot(body.observation.url) === pack.browser.directory.listingRoot(d.url));
    const doc = exact ?? fallback;
    let categories = [], provenance = 'EVIDENCE_GAP_NO_SAME_REGION_DOM', file;
    if (doc) {
      file = doc.file.startsWith('.eval-artifacts/') ? doc.file : join(dirname(run.recording), doc.file);
      originals[file] = sha(file);
      categories = observedDirectoryCategories(pack, { url: doc.url, html: readFileSync(file, 'utf8'), text: '', title: '' }, body.observation.url);
      provenance = exact ? 'EXACT_RECORDED_PLANNING_DOM' : 'LATER_SAME_REGION_DOM_COUNTERFACTUAL';
    }
    if (body.current && !body.current.keep) {
      const expression = { keyword: body.current.keyword ?? '', categoryUrl: body.current.categoryUrl ?? '' };
      if (!attempted.some(a => JSON.stringify(a) === JSON.stringify(expression))) attempted.push(expression);
    }
    const next = structuredClone(body);
    next.observation.categories = categories;
    next.attemptedRetrievals = structuredClone(attempted);
    let template;
    const planner = new ModelDiscoveryRetrievalPlanner({ complete: async request => {
      template = request;
      return { outputText: JSON.stringify({ choice: 'GENERAL', keyword: '', criterionRef: '', categoryUrl: '', reason: 'Template capture only.' }) };
    } });
    await planner.decide({ taskId: `p21a-replay-${run.index}-${row.sequence}`, intent: input.intent,
      locationName: body.location, timeoutMs: row.timeoutMs, attemptedRetrievals: attempted, rewrites: body.rewrites });
    const request = { ...template, timeoutMs: row.timeoutMs, maxOutputTokens: row.maxOutputTokens,
      temperature: row.temperature, thinking: row.thinking, responseFormat: row.responseFormat,
      messages: [{ role: 'system', content: template.messages[0].content }, { role: 'user', content: JSON.stringify(next) }] };
    const relevant = categories.filter(c => /\/rstLst\/(sushi|tempura|yakiniku)\/$/.test(new URL(c.url).pathname));
    requests.push({ id: `${run.index}-${row.sequence}`, index: run.index, caseId: run.caseId,
      sourceSequence: row.sequence, sourceDecisions: run.decisions, original: row, request,
      intent: input.intent, locationName: body.location, provenance,
      categoryEvidence: doc ? { file, sha256: sha(file), snapshot: doc.snapshot, url: doc.url } : null,
      relevantCategoryUrls: relevant.filter(c => run.caseId.includes('h001') ? /\/sushi\/$/.test(new URL(c.url).pathname)
        : run.caseId.includes('kichijoji') ? /\/tempura\/$/.test(new URL(c.url).pathname)
        : run.caseId.includes('nakameguro') ? /\/yakiniku\/$/.test(new URL(c.url).pathname) : false).map(c => c.url),
    });
  }
}
assert.equal(requests.length, 14);
assert.equal(requests.filter(r => r.provenance === 'EXACT_RECORDED_PLANNING_DOM').length, 6);
save(`${batch}/categories/production-inventory.json`, { models: 0, network: 0, oldCapturedCategoryCount: 0, rows: inventory });
save(`${batch}/prepared-requests.json`, requests);
save(`${batch}/payload-audit.json`, { destination: 'https://api.deepseek.com/beta/chat/completions',
  allowedCalls: 14, websiteRequests: 0, originalFiles: originals,
  changes: ['System Prompt@3', 'DOM categories from indicated evidence', 'attemptedRetrievals from prior actual current fields'],
  limits: ['Independent single-step counterfactuals; no execution of model proposals',
    '6 exact DOM, 7 later same-region DOM, 1 missing DOM retained empty; never faithful browser replay',
    'All same-region Pack-valid DOM categories; actual counts 5/9/9/0, no CSS gate or numeric-code filter'],
  predeclaredGate: { requiredDistinctCases: 2, cases: ['p2-kf-h001-20261027', 'p2-kichijoji-tempura-20261027', 'p2-nakameguro-yakiniku-20261030'],
    acceptedChoices: ['CATEGORY', 'COMBINED'], categoryMatch: 'Exact supplied sushi/tempura/yakiniku URL for the corresponding case',
    scope: 'Decision feasibility only; no qualification, delivery, or full-browser success claim' },
  budgetsOrigin: { models: 198, modelLimit: 450, probes: 31, probeLimit: 42, google: 79, fullLive: 0 } });
console.log(JSON.stringify({ requests: requests.length, provenance: Object.fromEntries([...new Set(requests.map(r => r.provenance))]
  .map(k => [k, requests.filter(r => r.provenance === k).length])), models: 0, network: 0 }));
