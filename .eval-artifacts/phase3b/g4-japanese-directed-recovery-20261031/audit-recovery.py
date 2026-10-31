"""Post-execution audit only; file/Git reads, no replay or source requests."""
from pathlib import Path
from datetime import datetime, timezone, timedelta
from urllib.parse import urlsplit
from collections import Counter
import hashlib, json, re, subprocess

R=Path('.eval-artifacts/phase3b/g4-japanese-directed-20261031')
S=Path('.eval-artifacts/phase3b/g4-japanese-directed-recovery-20261031')
def load(p):return json.loads(Path(p).read_text())
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def git(*args):return subprocess.check_output(['git',*args])
def when(s):return datetime.fromisoformat(s)
def digest(b):return hashlib.sha256(b).hexdigest()
inputs=load(S/'inputs.json');original=load(R/'inputs.json')
for f in inputs['frozenOriginalPacket']:assert sha(f['path'])==f['sha256'],f['path']
frozen=load(S/'freeze.json')['files']
for f in frozen:assert sha(f['path'])==f['sha256'],f['path']
assert git('diff','--name-only',original['productionCommit'],'--','src','scripts','web-skills','package.json','package-lock.json').decode().strip()==''
before=json.loads(git('show',inputs['resumedFrom']+':.eval-artifacts/phase3b/budget.json'))
ledger=load('.eval-artifacts/phase3b/budget.json');by_id={e['id']:e for e in ledger['entries']}
assert len(by_id)==len(ledger['entries'])
for row in before['entries']:assert by_id[row['id']]==row,row['id']
new=[e for e in ledger['entries'] if e['id'] not in {x['id'] for x in before['entries']}]
assert len(new)<=8 and all(e['batch']==inputs['batchId'] for e in new)
totals={k:sum(e.get(k,e.get('publicGET',0) if k=='evaluationPublicGET' else 0) for e in ledger['entries']) for k in ledger['cumulative']}
assert totals==ledger['cumulative']
assert sum(e['googleRequests'] for e in new)==sum(e['realModelCalls'] for e in new)==sum(e['fullLive'] for e in new)==0
assert totals['evaluationPublicGET']<=260
state=load(S/'state.json');rows=state['results'];prior=load(R/'state.json')['results']
assert len(rows)==len(new)==len(list((S/'requests').glob('*.started.json')))==len(list((S/'requests').glob('*.result.json')))
expected={x['id']:x for x in inputs['knownDetails']}
requests=[];previous=when(prior[-1]['finishedAtCET'])
for row in rows:
    prefix=S/'requests'/row['id'];started=load(str(prefix)+'.started.json');headers=load(str(prefix)+'.headers.json') if Path(str(prefix)+'.headers.json').exists() else None
    assert load(str(prefix)+'.result.json')==row
    planned=expected[row['knownId']]
    assert planned['url']==row['url']==by_id[row['ledgerId']]['url']
    assert planned['subjectId']==row['subjectId']
    u=urlsplit(row['url']);assert u.scheme=='https' and u.netloc=='tabelog.com' and re.fullmatch(r'/en/[a-z-]+/A\d+/A\d+/\d+/',u.path) and not u.query and not u.fragment
    assert row['kind']=='DETAIL' and row['method']=='GET' and row['redirect']=='manual' and row['cookie'] is False and row['retries']==0 and row['timeoutMs']==20000
    assert sha(row['bodyPath'])==row['sha256'] and Path(row['bodyPath']).stat().st_size==row['bytesReceived']
    manifest=Path(started['manifestPath']);assert sha(manifest)==started['manifestSha256']
    assert digest(git('show',started['frozenCommit']+':'+str(manifest)))==sha(manifest)
    assert subprocess.run(['git','merge-base','--is-ancestor',started['frozenCommit'],'HEAD']).returncode==0
    assert when(by_id[row['ledgerId']]['recordedAtCET'])<=when(started['atCET'])<=when(row['startedAtCET'])
    for f in load(manifest).get('basis',[]):assert sha(f['path'])==f['sha256'] and digest(git('show',started['frozenCommit']+':'+f['path']))==f['sha256']
    start=when(row['startedAtCET']);gap=(start-previous).total_seconds();assert gap>=30;previous=when(row['finishedAtCET'])
    assert when(git('show','-s','--format=%cI',started['frozenCommit']).decode().strip())<start
    if headers:assert headers['headersAtCET']==row['headersAtCET'] and headers['status']==row['status']
    requests.append({**row,'manifestCommit':started['frozenCommit'],'previousFinishToStartSeconds':round(gap,3),'chargedBeforeSend':True})

cases=[]
for subject in original['cases']:
    sid=subject['id'];exe=load(S/'execution'/f'{sid}.json');ev=load(S/'evaluation'/f'{sid}.json')
    assert exe['modelCalls']==exe['modelAttempts']==exe['sourceNetworkCalls']==exe['unexpectedFetchAttempts']==0
    assert exe['modelPortInjected'] is False and exe['browserClosed'] is True
    assert [x['phase'] for x in exe['guardCheckpoints']]==['BEFORE_CHECK','FINALLY','BEFORE_SAVE']
    assert all(c['modelCalls']==c['modelAttempts']==c['sourceNetworkCalls']==0 for c in exe['guardCheckpoints'])
    assert len(exe['details'])<=5 and exe['diagnostic'] is not None
    for read in exe['reads']:
        if read.get('bodyPath'):assert sha(read['bodyPath'])==read['sha256']
    assert ev['verdict'] not in ['WRONG_ACCEPTED','UNSUPPORTED_ACCEPTANCE_S0']
    acquired=[r for r in [*prior,*rows] if r.get('subjectId')==sid and r['kind']=='DETAIL']
    cases.append({'id':sid,'name':subject['subject']['name'],'verdict':ev['verdict'],'acceptedURL':exe['observedAcceptedUrl'],
      'reason':exe['productionReason'],'resolution':exe['diagnostic']['resolution'],'queries':ev['queries'],
      'details':exe['details'],'cumulativeDetailCount':len(exe['details']),'cap':5,
      'thirdTermContributedAcceptance':ev['thirdTermContributedAcceptance'],'causalScope':ev['thirdTermCausalScope'],
      'uncertainties':exe['uncertainties'],'environmentFailures':exe['environmentFailures'],
      'modelCalls':exe['modelCalls'],'sourceNetworkCallsInReplay':exe['sourceNetworkCalls'],
      'publicDetailGETsThisRecovery':sum(r['subjectId']==sid for r in rows),
      'publicDetailAcquisitionsThisDirectedBatch':[{'url':r['url'],'status':r['status'],'sha256':r['sha256']} for r in acquired]})

summary=dict(Counter(c['verdict'] for c in cases));wrong=sum(c['verdict'] in ['WRONG_ACCEPTED','UNSUPPORTED_ACCEPTANCE_S0'] for c in cases)
accepted=sum(c['verdict']=='CORRECT_ACCEPTED' for c in cases)
out={'status':'PASS','scope':'FOUR_TARGETED_PUBLIC_DETAIL_GETS_PLUS_FROZEN_PREFIX_REPLAY_NOT_NEW37_RATE',
 'recordedAtCET':datetime.now(timezone(timedelta(hours=1))).isoformat(),
 'originalPacketFilesUnchanged':len(inputs['frozenOriginalPacket']),'frozenFilesUnchanged':len(frozen),'productChanges':[],
 'oldLedgerEntriesUnchanged':len(before['entries']),'newLedgerEntries':len(new),'cumulative':totals,
 'recoveryCalls':{'websiteGET':len(rows),'google':0,'realModel':0,'Live':0,'robots':0,'BeefRequests':0},
 'directedBatchCallsIncludingPrior':{'websiteGETExcludingRobots':len(rows)+2,'robots':1,'google':1,'realModel':0,'Live':0},
 'requests':requests,'networkFailures':sum(bool(r['networkFailure']) for r in rows),
 'timing':{'requestSeconds':round(sum(r['elapsedMs'] for r in rows)/1000,3),
    'firstRecoveryStartToLastFinishSeconds':round((when(rows[-1]['finishedAtCET'])-when(rows[0]['startedAtCET'])).total_seconds(),3) if rows else 0,
    'betweenRecoveryRequestsSeconds':round(sum(r['previousFinishToStartSeconds'] for r in requests[1:]),3)},
 'cases':cases,'summary':summary,'actualAcceptedCount':accepted,'wrongAcceptedCount':wrong,
 'thirdTermAcceptedCount':sum(c['thirdTermContributedAcceptance'] for c in cases),
 'claimSafety':'NO_WRONG_OR_UNSUPPORTED_ACCEPTANCE_AMONG_ACTUAL_RECORDED_ACCEPTANCES',
 'TFullRegression':'NOT_EVALUATED_UNRECORDED_FRAGMENT; observed bounded-path safety separately assessed; no invented model response',
 'inventoryEvaluated':False}
(S/'audit-recovery.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:out[k] for k in ['status','summary','actualAcceptedCount','wrongAcceptedCount','thirdTermAcceptedCount','networkFailures','cumulative','timing']}))
