"""Independent offline evidence checks; no browser, provider or credential loading."""
from pathlib import Path
import collections,datetime,gzip,hashlib,json,subprocess

root=Path('.eval-artifacts/phase3b/c-batch2-preparation')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text())
def git(*args):return subprocess.check_output(['git',*args])
def cet():return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(timespec='milliseconds')
def leaves(a,b,path=()):
    if type(a)!=type(b):return [(path,a,b)]
    if isinstance(a,dict):
        assert a.keys()==b.keys(),path
        return [d for k in a for d in leaves(a[k],b[k],path+(k,))]
    if isinstance(a,list):
        assert len(a)==len(b),path
        return [d for i,(x,y) in enumerate(zip(a,b)) for d in leaves(x,y,path+(i,))]
    return [] if a==b else [(path,a,b)]

assert sha('src/eval/restaurant/semantic/fixtures.ts')=='fa4a8e52a82806af6d507a06f4ba16426e6c28376936363c777c4e981cf3ca72'
base='src/eval/restaurant/semantic/cases/'
assert sha(base+'restaurant-semantic-regression.gold4.json')=='96a3dbd7c406805e31586a0a6fb472b5bb2dd7458bd3187a3413c6ed2e5f8b66'
old=read(base+'restaurant-semantic-regression.gold4.json');new=read(base+'restaurant-semantic-regression.gold5.json')
changes=leaves(old,new)
dataChanges=[d for d in changes if d[0][0] not in ('id','version')]
assert len(changes)==20 and len(dataChanges)==18 # Seven windows: three change both bounds.
assert sum(d[0][-1]=='strength' and d[1]=='UNSPECIFIED' and d[2]=='HARD' for d in dataChanges)==8
windows={('SR05-T01','18:00','23:00'),('SR06-T01','12:00','17:00'),('SR08-T01','18:00','23:00'),('SR08-T02','18:00','23:00'),('SR09-T01','18:00','23:00'),('SR09-T02','18:00','23:00'),('SR10-T01','17:30','22:00')}
observed=set()
for sessionBefore,sessionAfter in zip(old['sessions'],new['sessions']):
    for before,after in zip(sessionBefore['turns'],sessionAfter['turns']):
        assert before['message']==after['message']
        if before['expectedDraft'].get('timeWindow')!=after['expectedDraft'].get('timeWindow'):
            w=after['expectedDraft']['timeWindow'];observed.add((after['id'],w['earliest'],w['latest']))
assert observed==windows
side=read(base+'goal-boundary-annotations.json');side2=read(base+'goal-boundary-annotations.v2.json')
assert side['turns']==side2['turns'] and side['source']['sha256']==sha(side['source']['path'])
assert Path(base+'goal-boundary-annotations.v2.json').read_bytes()==git('show','d4862294:'+base+'goal-boundary-annotations.json')
protected=['src/domains/restaurant/semantic-interpreter.ts','src/domains/restaurant/semantic-proposal.ts',
           'src/integrations/tabelog/tabelog-page-parser.ts','src/integrations/tablecheck/tablecheck-page-parser.ts',
           'src/integrations/tabelog/tabelog-entity-resolver.ts','src/integrations/restaurant-availability/availability-source-resolver.ts',
           'src/integrations/google/google-places-client.ts','src/integrations/google/google-places-contracts.ts',
           'src/integrations/restaurant-search/source-packs.ts','src/integrations/tabelog/tabelog-browser-availability.ts',
           'src/eval/restaurant/agent-loop/cases/reviewed-public-reads.json']
for p in protected:assert Path(p).read_bytes()==git('show','d1415814:'+p),p
assert not Path('docs/decisions/0047-phase3b-observed-actions-and-cited-answers.md').exists()

for manifest in ['sample-source-sha256.json','selection-input-sha256.json']:
    for row in read(root/manifest)['files']:
        assert not any(part.startswith('.env') or part=='.eval-private' for part in Path(row['path']).parts)
        assert sha(row['path'])==row['sha256'],row['path']
proposal=read(root/'samples.proposed.json');pool=read(root/'candidate-pool.json');byid={r['googlePlaceId']:r for r in pool['candidates']}
samples=proposal['samples'];assert len(samples)==8 and len({r['googlePlaceId'] for r in samples})==8
assert sum(r['role']=='PRIMARY' for r in samples)==5
assert sum(r['historicalDenganaAnchor'] for r in samples)==1
rawCache={}
for row in samples:
    source=byid[row['googlePlaceId']];assert not source['inOldNameResolutionSamples']
    for key in ['subject','googleWebsiteUri','websiteCategory','provenance']:assert row[key]==source[key]
    assert row['websiteCategory'] in ['OWN_WEBSITE_CANDIDATE','SOCIAL']
    assert row['goldStatus']=='AWAITING_REVIEWER_CERTIFICATION'
    assert not any(k in row for k in ['expectedSourceUrl','expectedSourceEntityId','goldUrl','goldId'])
    # Verify every saved provenance independently of pool construction.
    for refIndex,ref in enumerate(row['provenance']):
        p=ref['path'];assert sha(p)==ref['sha256']
        if p not in rawCache:
            b=Path(p).read_bytes();text=(gzip.decompress(b) if p.endswith('.gz') else b).decode()
            rawCache[p]=[json.loads(s) for s in text.splitlines() if s] if p.endswith('.jsonl') else json.loads(text)
        raw=rawCache[p]
        if ref['record']=='finalSnapshot.domainState.candidates':
            cs=raw['finalSnapshot']['domainState']['candidates'];cs=list(cs.values()) if isinstance(cs,dict) else cs
        else:
            events=raw if isinstance(raw,list) else [e['event'] for e in raw['events']]
            event=events[ref['record']]
            cs=(event['detail']['read'] if event.get('kind')=='SOURCE_FIRST_BATCH' else event)['candidates']
        restaurant=cs[ref['candidateIndex']]['restaurant'];ids=restaurant['sourceIds']
        assert ids['googlePlaces']==row['googlePlaceId']
        if refIndex==0: # Pool preserves the first original record, never merges identity fields.
            assert restaurant['outletName']==row['subject']['name']
            assert restaurant['address']==row['subject']['address'] and ids['phone']==row['subject']['phone']
            assert restaurant['coordinates']==row['subject']['coordinates'] and ids['googleWebsiteUri']==row['googleWebsiteUri']

ledger=read('.eval-artifacts/phase3b/budget.json')
baseline=json.loads(git('show','d1415814:.eval-artifacts/phase3b/budget.json'));entries={r['id']:r for r in ledger['entries']}
for entry in baseline['entries']:assert entries[entry['id']]==entry
assert len(entries)==len(ledger['entries'])
keys=['fullLive','realModelCalls','environmentReruns','evaluationPublicGET','googleRequests','restaurantWebsiteRequests']
for k in keys:
    total=sum(r.get(k,r.get('publicGET',0) if k=='evaluationPublicGET' else 0) for r in ledger['entries'])
    assert ledger['cumulative'][k]==total==0,k
auth=read(root/'authorization.json');assert auth['credentialStatus']=='NOT_LOADED' and auth['independentlyReadCredentialFile'] is False
assert auth['actualUsage']==dict.fromkeys(keys,0)
result={'schema':'phase3b-c-preparation-audit@1','status':'PASS','checkedAtCET':cet(),
        'sourceCommit':git('rev-parse','HEAD').decode().strip(),'goldApprovedUnits':15,'changedGoldScalarFields':18,
        'goldHistoricalBytesUnchanged':True,'sidecarTurnsUnchanged':True,'protectedFilesUnchanged':protected,
        'newSamples':8,'primary':5,'reserves':3,'actualUsage':dict.fromkeys(keys,0),
        'changes':[{'path':list(p),'before':a,'after':b} for p,a,b in changes]}
(root/'audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['changes','protectedFilesUnchanged']},ensure_ascii=False))
