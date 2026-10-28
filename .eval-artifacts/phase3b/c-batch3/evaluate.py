"""Posthoc only: independent certified IDs; never imported by production/execution."""
from pathlib import Path
import datetime,hashlib,json,re,subprocess
root=Path('.eval-artifacts/phase3b/c-batch3')
def load(p):return json.loads(Path(p).read_text())
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def accepted(d):return {r['sampleId']:r['returnedId'] for r in d['rows'] if r['returnedId']}
now=load(root/'identity/recomputed.json');old=load('.eval-artifacts/phase3b/g4-name-resolution/recomputed.json');batch2=load('.eval-artifacts/phase3b/c-batch2/identity/recomputed.json')
a=accepted(now);b=accepted(old);before=accepted(batch2)
assert len(now['rows'])==29 and len(a)>=12
assert not now['structureAlerts']
for r in now['rows']:
    if r['returnedId']:assert r['returnedId']==r['expectedOutletId'],('S0_WRONG_OUTLET',r['sampleId'])
for key in ['nr-002','nr-004','nr-016','nr-024']:assert key in a,key
for key in ['nr-020','nr-029']:assert key not in a,key
assert set(b)-set(a)=={'nr-020'},'Only user-required postal rejection may differ from original12'
assert set(before)<=set(a),'No newly rejected batch2 acceptance'
replay=load(root/'search-replay.json');gold={r['id']:r['rstId'] for r in load('.eval-artifacts/phase3b/c-batch2/gold.certified.json')['rows']}
rows=[]
for row in replay['listings']:
    ids=[re.search(r'/A\d+/A\d+/(\d+)(?:/|$)',o['sourceUrl'])[1] for o in row['outlets']]
    rows.append({'id':row['id'],'variant':row['variant'],'parsed':len(ids),'hit':gold[row['id']] in ids,'rank':ids.index(gold[row['id']])+1 if gold[row['id']] in ids else None})
for control in replay['controls']:
    assert len(control['searches'])==2,control
    assert control['detailInspections']<=5 and control['fixtureModelCalls']==1,control
    assert control['offers']==0 and control['highIdentityClaims']==0,('S0_UNSUPPORTED_DETAIL_CLAIM',control)
assert len(replay['locations'])==12 and all(r['located'] for r in replay['locations'])
assert {r['id'] for r in replay['locations'] if not r['oldOffsetsCorrect']}=={'nr-007','nr-018','nr-022','nr-026'}
primary=[r for r in rows if r['id'].startswith('G4-ND')]
fragment_ids={c['id'] for c in replay['controls']}
summary={'schema':'phase3b-c-independent-evaluation@1','evaluatedAtCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),
 'mode':'OFFLINE_ONLY_EXPOSED_REGRESSION','endToEnd':'NOT_EVALUATED_NO_LIVE','identity':{'planned':29,'completed':29,'correct':len(a),'wrongAccepted':0,'newSinceOriginal':sorted(set(a)-set(b)),'removedSinceOriginal':sorted(set(b)-set(a)),'restoredSinceBatch2':sorted(set(a)-set(before)),'unexpectedRegressions':0},
 'search':{'parsedSavedResponses':len(rows),'original8Hit':sum(r['hit'] for r in primary if r['variant']=='ORIGINAL'),'historicalMixedAlternative8Hit':sum(r['hit'] for r in primary if r['variant']!='ORIGINAL'),'modelFragmentPrimarySubset':{'denominator':4,'originalHit':sum(r['hit'] for r in primary if r['id'] in fragment_ids and r['variant']=='ORIGINAL'),'fragmentHit':sum(r['hit'] for r in primary if r['id'] in fragment_ids and r['variant']!='ORIGINAL')},'controlledMissingDetailRuns':len(replay['controls']),'locatedFragments':12,'previousOffsetRejectionsRecovered':4,'rows':rows},
 'severity':{'S0WrongAcceptedOn29':0,'S0UnsupportedClaimsOnControlled4':0,'productionLive':'NOT_EVALUATED','syntheticSafetyCounterexamples':'See frozen red/green unit receipts; no actual user delivery'},
 'attribution':{'confirmed':'Three false address conflicts repaired in frozen saved fields; nr002 collection remains accepted. Exact-phone/branch counterexamples use actual production resolvers. Four genuine substrings survive independent location.','notEvaluated':'New Prompt2 semantic quality, Japanese-name production retrieval, real first-page identity/availability, full target delivery.'},
 'inputs':{'identitySha256':sha(root/'identity/recomputed.json'),'searchReplaySha256':sha(root/'search-replay.json'),'goldSha256':sha('.eval-artifacts/phase3b/c-batch2/gold.certified.json')}}
(root/'evaluation.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k in ['identity','search']},ensure_ascii=False))
