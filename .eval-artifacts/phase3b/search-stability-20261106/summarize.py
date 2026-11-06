"""Offline evidence inventory; never imports or evaluates production policy.

Coverage describes independent audit ownership, not a legality verdict. Original
failed D4 stays NOT_EVALUATED. Query values and request bodies are never emitted.
"""
import collections, hashlib, json, pathlib, re, statistics, urllib.parse

root = pathlib.Path(__file__).parent
source = pathlib.Path('.eval-artifacts/phase3b/observed-read-provenance-20261105/budget-approved-continuation/live/runs/D4/D4/recordings/g6-D4-1793928719238-0/recording.json')
rules = json.loads((root/'reviewed-public-reads.json').read_text())
inventory = {}
non_http = []

def row_for(origin, path, method):
    key = (origin.rstrip('/'), path, method)
    return inventory.setdefault(key, dict(origin=key[0], pathname=path, method=method, browserRequestIds=set(), transportIds=set(), resourceTypes=set(), queryKeys=set(), recordedOutcomes=set(), refs=set()))

for entry in json.loads(source.read_text())['entries']:
    kind, d = entry['kind'], entry.get('detail')
    if kind in ['NETWORK_REQUEST_START', 'GUARD_TRANSPORT_START']:
        u = urllib.parse.urlsplit(d['url'])
        if u.scheme not in ['https','http']:
            if kind=='NETWORK_REQUEST_START': non_http.append(dict(sequence=entry['sequence'],requestId=d['requestId'],method=d['method'],recordedURL=d['url']))
            continue
        row = row_for(u.scheme+'://'+u.netloc, u.path or '/', d['method'])
        row['browserRequestIds' if kind=='NETWORK_REQUEST_START' else 'transportIds'].add(d['requestId' if kind=='NETWORK_REQUEST_START' else 'transportId'])
        row['resourceTypes'].add(d.get('resourceType','?').lower())
        row['queryKeys'].update(k for k,v in urllib.parse.parse_qsl(u.query, keep_blank_values=True))
        row['refs'].add(entry['sequence'])
    if kind=='NETWORK' and isinstance(d,list):
        for request in d:
            if request.get('method') not in ['GET','HEAD','POST','OPTIONS','PUT','PATCH','DELETE']: continue
            row = row_for(request['origin'],request['pathname'],request['method'])
            row['recordedOutcomes'].add(request['outcome'])
            row['queryKeys'].update(request.get('queryKeys',[]))
            row['resourceTypes'].add(request.get('resourceType','?').lower())
            row['refs'].add(entry['sequence'])

def coverage(row):
    o,p,m = row['origin'],row['pathname'],row['method']
    matches = [i+1 for i,r in enumerate(rules) if r['origin']==o and (r.get('pathname')==p or r.get('pathnamePattern') and re.search(r['pathnamePattern'],p)) and (m in r['methods'] or m=='OPTIONS' and r.get('corsPreflight'))]
    if matches:
        return 'INDEPENDENT_RULE', 'reviewed-public-reads.json rules '+','.join(map(str,matches))+('; requires raw preflight origin/method/header names/empty body' if m=='OPTIONS' else '; exact query/body/types required, not endpoint-only PASS')
    if m not in ['GET','HEAD']:
        return 'OUT_OF_SCOPE_DENY', 'Unknown non-read method; actual dispatch would fail independent request-boundary audit'
    if o in ['https://tabelog.com','https://www.tablecheck.com']:
        if o=='https://tabelog.com' and p=='/en/rstLst/':
            return 'INDEPENDENT_FORM_AUDIT', 'auditNativeGetForm: native DOM, authority sources, exact field multiset, same-origin GET; missing evidence EVIDENCE_GAP'
        return 'EXISTING_GET_LOGIC', 'auditReadOnlyTrace: same-source public GET, sensitive path/key checks; no proof of unknown GET side effects'
    if o=='https://tblg.k-img.com' and p.startswith(('/javascripts/','/stylesheets/','/images/','/restaurant/images/')):
        return 'EXISTING_GET_LOGIC', 'evaluation-owned reviewedPublicGet: resource type, path prefix, query-key grammar; blocked nonessential resources are not fetched successes'
    if re.fullmatch(r'https://cdn[0-3]\.tablecheck\.com',o) and p.startswith('/assets/table_check/') or re.fullmatch(r'https://(?:[1-4]\.)?image\.cdn\.tablecheck\.com',o) and p.startswith('/unsafe/'):
        return 'EXISTING_GET_LOGIC', 'evaluation-owned reviewedPublicGet: static type/path/no-query grammar; source image blocking remains'
    return 'OUT_OF_SCOPE_DENY', 'No matching independent read/static scope; attempted/blocked is not source dispatch; actual dispatch must be rejected'

rows=[]
for key,row in sorted(inventory.items()):
    row['coverage'],row['independentCheck']=coverage(row)
    for k,v in list(row.items()):
        if isinstance(v,set): row[k]=sorted(v)
    rows.append(row)
result=dict(status='draft / not integrated; coverage inventory only, original D4 NOT_EVALUATED',source=str(source),sourceSHA256=hashlib.sha256(source.read_bytes()).hexdigest(),nonHTTP=non_http,totalBrowserRequestStarts=len(non_http)+sum(len(r['browserRequestIds']) for r in rows),tupleCount=len(rows),browserRequestCount=sum(len(r['browserRequestIds']) for r in rows),transportCount=sum(len(r['transportIds']) for r in rows),coverageCounts=dict(collections.Counter(r['coverage'] for r in rows)),rows=rows)
(root/'request-coverage.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
lines=['# D4 independent request coverage','',f"Status: draft / not integrated. {len(rows)} unique HTTP origin/path/method tuples, {result['browserRequestCount']} browser request starts, {result['transportCount']} Node transport starts. Plus {len(non_http)} recorded [NON_HTTP] browser image starts without a recoverable HTTP origin/path (listed in JSON, no source-read certification). Cumulative NETWORK arrays are not counted as new requests.",'','Classification is independent of recorded Guard outcomes. The latter and transport IDs are evidence inventory only. Query values, headers and body values are omitted. Endpoint classification alone is never PASS; raw query/body/form/preflight evidence still has to match. Original D4 remains NOT_EVALUATED.','', '| Method | Origin + path | Browser / transport starts | Coverage | Independent check |','|---|---|---:|---|---|']
for r in rows:
    lines.append(f"| {r['method']} | `{r['origin']}{r['pathname']}` | {len(r['browserRequestIds'])} / {len(r['transportIds'])} | {r['coverage']} | {r['independentCheck']} |")
lines+=['','Not observed in this failed D4: /v2/autocomplete, /v2/hub/public_shop_lists, /v2/shop_search, /ai_search, Tabelog initial_vacancy/find_vacancy*. Their approved independent contracts are nevertheless included for the next read. keyword_suggest was observed and is covered by the existing same-source GET audit, not a new site exception.','', 'Calendar provenance: Accepted ADR-0035; contract existed at e90dc94e (2026-10-07), independent G6 literal at ddffe9a0 (2026-11-04). No new 2026-11-06 calendar authorization is claimed.','', 'The next packs project the evaluation-owned reviewed-public-reads.json, plus ADR-0035 calendar key grammars. No production policy generation or Guard verdicts enter the contracts. G6 performs method/body/preflight checks; diagnostic audit additionally checks resources, query multiplicity, sensitive fields and native form provenance. Missing metadata remains EVIDENCE_GAP/NOT_EVALUATED. Existing GET audit does not certify arbitrary GET side effects. Frozen old packs/rules remain historical and unchanged; only the new next packs are current review candidates.']
(root/'request-coverage.md').write_text('\n'.join(lines)+'\n')

attempts=[]
for mode in ['none','snapshot']:
    for n in range(1,21):
        p=root/f'{mode}-{n:02d}.json';x=json.loads(p.read_text())
        events=[e['detail'] for e in x['trace'] if e['kind']=='FORM_EVIDENCE']
        receipts=[e['receipt'] for e in events if e.get('stage')=='SUBMISSION_RECEIPT' and e.get('receipt')]
        click=[e for e in events if e.get('stage')=='CLICK' and e.get('phase') in ['END','ERROR']][-1]
        forwarded=any(f['url']==r['actionOrigin']+r['actionPathname'] and f['method']=='GET' for f in x['fetches'] for r in receipts)
        attempts.append(dict(name=p.stem,forwardingAttemptToArchive=forwarded,receipts=len(receipts),clickTerminal=click['phase'],clickMs=click['elapsedMs'],competition=x.get('competitionResult'),passed=not x.get('error') and forwarded and len(receipts)==1 and click['phase']=='END',raw=str(p)))
summaries={}
for mode in ['none','snapshot']:
    group=[r for r in attempts if r['name'].startswith(mode)]
    ms=[r['clickMs'] for r in group]
    summaries[mode]=dict(attempts=len(group),primaryPassed=sum(r['passed'] for r in group),clickMinMs=min(ms),clickMedianMs=statistics.median(ms),clickMaxMs=max(ms),observerOutcomes=dict(collections.Counter(r.get('competition',{}).get('outcome','NOT_REQUESTED') for r in group)))
(root/'stability-summary.json').write_text(json.dumps(dict(mode='COMPONENT_REAL_RECORDING_REPLAY',scope='Archive forwarding attempt and receipt; original failed Live has no result response, never delivery proof. Concurrent snapshot errors are separate from Search proof.',websiteGET=0,model=0,Google=0,Live=0,summaries=summaries,attempts=attempts),ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'inventory':{k:result[k] for k in ['tupleCount','browserRequestCount','transportCount','coverageCounts']},'stability':summaries},indent=2))
