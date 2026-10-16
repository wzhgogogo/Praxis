// Outer observation only. Never changes Guard admission, model input, request
// bytes or responses. Values/headers/cookies are not retained, even on mismatch.
import { createHash } from 'node:crypto';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fieldsMatch = (fields, expected) => fields && Object.keys(fields).sort().join() === Object.keys(expected).sort().join()
  && Object.keys(expected).every(key => fields[key] === expected[key]);
function endpoint(request, reviewedBytes) {
  const url = new URL(request.url);
  const rules = JSON.parse(reviewedBytes);
  const ruleIndex = rules.findIndex(rule => rule.methods?.includes('POST') && url.origin === rule.origin && url.pathname === rule.pathname && rule.resourceTypes.includes(request.resourceType));
  return { url, rules, ruleIndex, rule: rules[ruleIndex] };
}
export function inspectReviewedPost(request, reviewedBytes) {
  if (request.method !== 'POST') return { status: 'NOT_REVIEWED' };
  const { url, ruleIndex, rule } = endpoint(request, reviewedBytes);
  if (!rule) return { status: 'NOT_REVIEWED' };
  const base = { origin: url.origin, pathname: url.pathname, method: 'POST', resourceType: request.resourceType,
    queryKeys: [...url.searchParams.keys()], reviewedReadsSha256: sha(reviewedBytes), ruleIndex };
  if (request.body === undefined || request.body === null) return { ...base, status: 'EVIDENCE_GAP', reason: 'REQUEST_BODY_NOT_AVAILABLE' };
  const raw = Buffer.isBuffer(request.body) ? request.body : Buffer.from(request.body);
  const bodyObservation = { bodySha256: sha(raw), contentType: request.contentType ?? '', fieldTypes: {} };
  try {
    const body = JSON.parse(raw.toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error('NOT_FLAT_MAPPING');
    bodyObservation.fieldTypes = Object.fromEntries(Object.entries(body).map(([key, value]) => [key, value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value]));
  } catch { return { ...base, bodyObservation, status: 'MISMATCH', reason: 'INVALID_JSON_BODY' }; }
  const matches = !url.search && /^application\/json(?:;|$)/i.test(bodyObservation.contentType) && rule.bodyFields && fieldsMatch(bodyObservation.fieldTypes, rule.bodyFields);
  return { ...base, bodyObservation, status: matches ? 'MATCH' : 'MISMATCH', reason: matches ? 'EXACT_BODY_FIELDS_AND_TYPES' : 'BODY_OR_QUERY_GRAMMAR_MISMATCH' };
}

export function recordedPostMatches(request, reviewedBytes) {
  if (!request.origin || !request.pathname) return false;
  const { rule } = endpoint({ ...request, url: request.origin.replace(/\/$/, '') + request.pathname }, reviewedBytes);
  const body = request.bodyObservation;
  return Boolean(rule?.bodyFields && !request.queryKeys?.length && body && /^[a-f0-9]{64}$/.test(body.bodySha256 ?? '')
    && /^application\/json(?:;|$)/i.test(body.contentType ?? '') && fieldsMatch(body.fieldTypes, rule.bodyFields));
}

export function postBodyStop(row, reviewedBytes) {
  if (row.kind === 'OUTER_POST_BODY' && row.detail?.status !== 'MATCH') return { code: row.detail?.status === 'MISMATCH' ? 'REVIEWED_POST_BODY_MISMATCH' : 'REVIEWED_POST_BODY_EVIDENCE_GAP', request: row.detail };
  const requests = row.kind === 'NETWORK' ? row.detail : row.detail?.networkRequests;
  for (const request of Array.isArray(requests) ? requests : []) {
    if (request.outcome !== 'ADMITTED' || ['GET','HEAD'].includes(request.method)) continue;
    const { rule } = endpoint({ ...request, url: request.origin.replace(/\/$/, '') + request.pathname }, reviewedBytes);
    if (request.method !== 'POST' || !rule || request.queryKeys?.length) return { code: 'ADMITTED_NON_READ_METHOD', request };
    // NETWORK is the canonical cumulative mirror with outerRequestId/body
    // binding. Other snapshot copies are legacy, value-free duplicates.
    if (row.kind === 'NETWORK' && !recordedPostMatches(request, reviewedBytes)) return { code: request.bodyObservation ? 'REVIEWED_POST_BODY_MISMATCH' : 'REVIEWED_POST_BODY_EVIDENCE_GAP', request };
  }
  return null;
}

export function dryRunReviewedPostAudit(reviewedBytes) {
  const rule = JSON.parse(reviewedBytes).find(rule => rule.methods?.includes('POST'));
  if (!rule?.bodyFields) throw Error('DRY_RUN_POST_RULE_MISSING');
  const body = { locale:'en', start_at:'2026-10-16', shop_id:'DRY_RUN_ONLY', num_people:'2' };
  const request = { url:rule.origin+rule.pathname, method:'POST', resourceType:'fetch', contentType:'application/json', body:Buffer.from(JSON.stringify(body)) };
  const normal = inspectReviewedPost(request, reviewedBytes);
  const invalid = inspectReviewedPost({ ...request, body:Buffer.from(JSON.stringify({...body, email:'NEVER_PERSIST_VALUES'})) }, reviewedBytes);
  const missing = inspectReviewedPost({ ...request, body:undefined }, reviewedBytes);
  if (normal.status !== 'MATCH' || invalid.status !== 'MISMATCH' || missing.status !== 'EVIDENCE_GAP'
    || postBodyStop({kind:'OUTER_POST_BODY',detail:normal},reviewedBytes) || !postBodyStop({kind:'OUTER_POST_BODY',detail:invalid},reviewedBytes)
    || JSON.stringify(invalid).includes('NEVER_PERSIST_VALUES')) throw Error('DRY_RUN_POST_BODY_ASSERTION_FAILED');
  return { status:'PASS', normal, invalid, missing, network:0, models:0, live:0 };
}

/** Public Playwright Route.fetch boundary. Guard pushes the current admission
 * synchronously immediately before fetch; bind by that actual object, not by
 * a restaurant name or a previous POST to the same endpoint. */
export function installReviewedPostObserver(Guard, reviewedBytes, record) {
  const install = Guard.prototype.install, snapshots = Guard.prototype.snapshotRequests;
  const observations = new WeakMap(), contexts = new WeakMap(); let nextContext = 0;
  Guard.prototype.snapshotRequests = function() {
    const context = contexts.get(this);
    return snapshots.call(this).map((request, index) => ({ ...request, outerRequestId: `${context}:${index}`,
      ...(observations.has(request) ? { bodyObservation: observations.get(request).bodyObservation } : {}) }));
  };
  Guard.prototype.install = async function(context, ...args) {
    const guard = this, contextId = ++nextContext, originalRoute = context.route;
    contexts.set(guard, contextId);
    context.route = function(pattern, handler, ...options) {
      return originalRoute.call(this, pattern, (route, request) => handler(new Proxy(route, {
        get(target, property) {
          if (property !== 'fetch') { const value = Reflect.get(target, property); return typeof value === 'function' ? value.bind(target) : value; }
          return async fetchOptions => {
            const rawRequest = target.request();
            if (rawRequest.method() === 'POST') {
              const audit = inspectReviewedPost({ url: rawRequest.url(), method: rawRequest.method(), resourceType: rawRequest.resourceType(), body: rawRequest.postDataBuffer(), contentType: rawRequest.headers()['content-type'] }, reviewedBytes);
              if (audit.status !== 'NOT_REVIEWED') {
                const requests = snapshots.call(guard), current = requests.at(-1);
                const bound = current?.outcome === 'ADMITTED' && current.method === audit.method && new URL(current.origin).origin === audit.origin && current.pathname === audit.pathname;
                if (bound) observations.set(current, audit);
                record({ kind: 'OUTER_POST_BODY', at: new Date().toISOString(), detail: { ...audit, outerRequestId: `${contextId}:${requests.length - 1}`,
                  ...(bound ? {} : { status: 'EVIDENCE_GAP', reason: 'REQUEST_OBSERVATION_BINDING_MISSING' }) } });
              }
            }
            return target.fetch(fetchOptions);
          };
        },
      }), request), ...options);
    };
    try { return await install.call(this, context, ...args); }
    finally { context.route = originalRoute; }
  };
  return () => { Guard.prototype.install = install; Guard.prototype.snapshotRequests = snapshots; };
}
