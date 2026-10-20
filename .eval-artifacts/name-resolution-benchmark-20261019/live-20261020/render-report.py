import json,gzip,statistics,collections,hashlib
from pathlib import Path
b=Path('.eval-artifacts/name-resolution-benchmark-20261019/live-20261020');base=b.parent
read=lambda p:json.loads(Path(p).read_text());h=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
s=read(b/'method-a/summary.json');audit=read(b/'audit-summary.json');ledger=read(b/'ledger.json');cert=read(b/'verify/certified-summary.json');samples=read(base/'samples.json')['samples'];subjects=[x for x in samples if x['platform']=='TABELOG'];byid={x['id']:x for x in subjects};out={r['sampleId']:r for r in s['rows']};m=s['evaluation']['methods'][0];boundary=read(b/'independent-boundary-audit.json');configuration=ledger['methodAConfiguration'];checks=read(b/'method-a-freeze-commit.json')
assert len(audit['methodA']['rows'])==s['finished']
esc=lambda x:str(x).replace('|','\\|').replace('\n',' ')
rows=[];details=[]
for sample in subjects:
 i=sample['id'];r=out.get(i);c=next((c for c in cert['rows']if c['sampleId']==i),None);status=c['status']if c else'CONTROL'
 if r and 'observation'in r:
  o=r['observation'];e=r['evaluation'];record=read_gz=json.loads(gzip.decompress((b/'method-a'/i/'observations.json.gz').read_bytes()));art=json.loads(gzip.decompress((b/'method-a'/i/'artifact.json.gz').read_bytes()));qs=[d['url']for d in record['documents']if '/rstLst/'in d['url']]
  vals=[i,sample['subject']['name'],status,e['verdict'],o.get('returnedUrl','—'),o['elapsedMs'],o['modelCalls'],o.get('failure','—')]
  details.append({'sampleId':i,'name':sample['subject']['name'],'groups':sample['groups'],'certification':status,'observation':o,'evaluation':e,'searchDocumentUrls':qs,'allDocuments':record['documents'],'searchDiagnostics':[d.get('search') for d in art['diagnostics'] if d.get('search')],'identityDiagnostics':art['diagnostics'],'resultPath':str(b/'method-a'/i/'result.json'),'artifactPath':str(b/'method-a'/i/'artifact.json.gz'),'rawPath':str(b/'method-a'/i/'observations.json.gz')})
 else:vals=[i,sample['subject']['name'],status,'EXCLUDED'if status=='DROPPED'else'NOT_REACHED','—','—','—','—']
 rows.append('| '+' | '.join(esc(v)for v in vals)+' |')
(b/'per-case-details.json').write_text(json.dumps(details,ensure_ascii=False,indent=2)+'\n')
group=lambda key: '\n'.join('| '+' | '.join(str(x.get(k,'—'))for k in [key,'goldStarted','controls','correct','uncertain','notFound','environment','notEvaluated','modelCalls','medianMs','maxMs'])+' |'for x in m['areas'if key=='area'else'nameShapes'])
counts=dict(collections.Counter(r.get('observation',{}).get('failure','NONE')for r in s['rows']))
home_redirects=[{'sampleId':d['sampleId'],'search':search} for d in details for search in d['searchDiagnostics'] if '/rstLst/' in search.get('requestedUrl','') and '/rstLst/' not in search.get('finalUrl','')];
min_gap=audit['cadence']['minimumSeconds'];source_blocks=len(ledger['sourceBlocks']);phone=sum(r.get('observation',{}).get('failure')=='KNOWN_PHONE_CONFLICT'for r in s['rows']);accepted=sum(r.get('observation',{}).get('accepted',False)for r in s['rows']);end=f'''

## Method A final execution (2026-10-20)

- Status: **{s['status']}**, {s['finished']}/{s['planned']} planned methods finished. Stop: `{json.dumps(s['stop'],ensure_ascii=False)}`.
- Frozen execution commit: `{configuration['codeCommit']}`. MethodA outer SHA-256 `{checks['outerSha256']}`; freeze `{checks['freezeSha256']}` ({audit['frozenFilesVerified']} files). Prior Gold commit2260cc8: {audit['historicalGoldFilesVerified']} historical source/config SHAs verified separately. Latest parallel remote production commits were not loaded during this execution.
- Gold certification:30 once-only public reads; automatic28VERIFIED/2DROPPED retained, final29VERIFIED/1DROPPED with disclosed nr-029 manual full-address match before methods. nr-023 excluded and not visited by methodA.5 controls excluded from correctness denominator; accepted controls remain REVIEW_REQUIRED.7 TableCheck subjects deferred.
- Models: methodA **{len(ledger['modelCalls'])}/150**, ≤3/subject; selection5, batch **{5+len(ledger['modelCalls'])}**. Google0; full Live0; methodB0. Tabelog logical attempts30 certification +{s['finished']} methods. Finish-to-next-start minimum **{min_gap:.3f}s**; {source_blocks} source cooldown events. Every source attempt and paid request is in ledger.json. No completed attempt repeated.
- Gates: typecheck,arch:check,default972/972,build,Chromium121/121 PASS. Identity regression: boundary-red.log2 underlying selects and strengthened identity-stop-test-red.log fails onselect; same existing cases green, actual Chromium identity test retains HIGH without controls. Approved eval proxy stops actual execution after identity (production/Prompt/Schema/State unchanged).

### Four-layer evaluation

1. **Result (identity benchmark only):** verified Gold started{m['goldStarted']}, evaluated{m['goldEvaluated']}; CORRECT{m['correct']}, WRONG_ACCEPTED{m['wrongAccepted']}, UNCERTAIN{m['uncertain']}, NOT_FOUND{m['notFound']}, ENV_FAILURE{m['environment']}, NOT_EVALUATED{m['notEvaluated']}. Frozen metric correctRate={m['correctRate']}, wrongRate={m['wrongRate']}, uncertainRate={m['uncertainRate']}, notFoundRate={m['notFoundRate']}. Existing metric denominator includes evaluated environment failures and reports them separately; controls are excluded. Median{m['medianMs']}ms/max{m['maxMs']}ms are per-method source+model work, excluding mandatory gaps. No availability, qualification, delivery or booking claim.
2. **Stages:** per-case-details.json preserves search document URLs, observed outlet URLs, identity diagnostics/failure codes, returned and selected raw page. Correctness compares literal independent expected/returned/raw IDs, not production identity labels alone. KNOWN_PHONE_CONFLICT occurred{phone} times; failure histogram `{json.dumps(counts,ensure_ascii=False)}`. Raw certification and method observations are separate.
3. **Severity:** independent ID comparison finds{m['wrongAccepted']} wrong Gold acceptances. Controls lack labels, accepted controls require reviewer inspection. Independent response audit finds{len(boundary['violations'])} recorded violations but network S0 remains NOT_EVALUATED ({boundary['gaps']} response sets have incomplete session/request evidence); no full-Live S0 certificate. Guard ALLOWED labels are not the oracle. Raw GET side effects/multi-hop limitations remain.
4. **Attribution:** no intervention or methodB comparison; failure codes and search presence are observations, not causal proof. All scored Gold were independently verified on Tabelog, so bounded NOT_FOUND cannot establish absence from that platform. Search diagnostics record{len(home_redirects)} method cases whose rstLst request finished outside rstLst (including region-home redirects); these explain repeated irrelevant lists as an observed stage, not phone-rule quality. Known-phone conflicts must be interpreted against the actual returned outlet. No identity rule was relaxed.

### Each method / exclusion

| ID | Google name | Gold certification | Verdict | Returned page | ms | models | Failure |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
'''+'\n'.join(rows)+'''

### Area groups

Groups can overlap; do not add their denominators.

| Area | Gold started | controls | correct | uncertain | notFound | ENV | notEval | models | median ms | max ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
'''+group('area')+'''

### Name-shape groups

| Shape | Gold started | controls | correct | uncertain | notFound | ENV | notEval | models | median ms | max ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
'''+group('shape')+'''

### Evidence and limits

- Selection: ../../checkpoint-c-integration-20261020/selection-recheck/report.md;5 requests/results, all ACCEPTABLE,13/13 direct. These exposed historical turns have no retained price fact; this is not proof for nonempty price contexts or long-run model performance.
- Gold: verify/<id>/result.json + observations.json.gz, original verify/summary.json, manual-address-verification.json and certified-summary.json.
- MethodA: method-a/<id>/result.json, artifact.json.gz, observations.json.gz; model-N.request.json/response.json only when a model was called. Aggregate method-a/summary.json, ledger.json, audit-summary.json and per-case-details.json; SHA inventory artifact-manifest.json.
- Approval and freeze: identity-stop-approval.json, model-approval.json, model-payload-boundary.json, method-a-plan.json, method-a-freeze.json. Freeze was committed before source/model work; optional shell process check falsely matched its own command and the single Node command continued. The outer independently verified390 SHA and recorded its committed configuration before the first attempt. The separate method-a-freeze-commit.json receipt is explicitly post-start; one Node process was confirmed and no restart occurred.
- Earlier standalone Chromium debug probes failed fixture interception and are not authoritative red/green or zero-network evidence. Current real Chromium acceptance uses the existing wholly intercepted fixture; all unrelated traffic is aborted.

### What this says about name resolution

This is a single exposed Tabelog-only run. Reported rates measure the existing bounded search/identity pipeline on independently verified Gold, not whether restaurants exist online. Exact-ID false acceptance is separately zero-tolerance; accepted unlabeled controls remain unscored. TableCheck difficulty is not measured here. The saved search/identity diagnostics identify where to inspect normalization, language/search strategy and contact extraction, but their relative benefit needs a separately approved intervention; no benefit is claimed and methodB was not enabled.
'''
(b/'search-final-url-observations.json').write_text(json.dumps(home_redirects,ensure_ascii=False,indent=2)+'\n')
p=b/'report.md';old=p.read_text();marker='\n\n## Method A final execution (2026-10-20)';old=old.split(marker)[0];old=old.replace('# Tabelog name-resolution benchmark — execution preparation','# Tabelog name-resolution benchmark — results',1).replace('Current status: READY_FOR_GOLD_VERIFICATION.','Historical preparation status at2260cc8: READY_FOR_GOLD_VERIFICATION.',1).replace('Status: METHOD_A_FROZEN_PENDING_EXECUTION.','Historical pre-launch status at1b4cfda: METHOD_A_FROZEN_PENDING_EXECUTION.',1);p.write_text(old+end)
print(json.dumps({'status':s['status'],'methods':s['finished'],'goldCorrect':m['correct'],'goldStarted':m['goldStarted'],'models':len(ledger['modelCalls']),'batchModels':5+len(ledger['modelCalls'])}))
