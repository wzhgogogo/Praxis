"""Frozen eval outer: remaining B only, real source-data readiness and bounded pacing/retry."""
from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,subprocess,os,sys,time,gzip
sys.dont_write_bytecode=True
from policy import ORDER,next_index,not_before,retry_signals,after_environment_failure

def can_resume_user(ledger,index,proof,approval,now_epoch):
    last=ledger['attempts'][-1]
    failed=[a for a in proof.get('attempts',[]) if a.get('outcome')=='FAILED']
    return (index==approval['caseIndex']==9 and ledger['completed']==approval['completedIndices']==[0,1,2,3,4,8]
        and ledger['stop']==approval['expectedStop']=={'code':'PREFLIGHT_EVIDENCE_GAP','index':9}
        and ledger['models']==approval['modelsBefore']==31 and ledger['preflightFailures']==approval['preflightFailuresBefore']==6
        and last['index']==9 and last['status']=='ENV_FAILURE' and last.get('models')==0 and last.get('formalProbeStarted') is False
        and last['directory']==approval['priorFailedAttemptDirectory']
        and proof.get('classification')=='ENV_FAILURE' and proof.get('generationModelCalls')==0
        and len(failed)==1 and failed[0].get('sourceId')=='tabelog' and failed[0].get('responseStatus')==429
        and now_epoch>=approval['notBeforeEpoch'])

config=Path(__file__).resolve().parent
load=lambda p:json.loads(Path(p).read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
now=lambda:datetime.now(timezone.utc).isoformat()
freeze=load(config/'freeze.json')
for name,expected in freeze['files'].items(): assert sha(Path(name))==expected,name
plan=load(config/'plan.json');approval=load(config/'approval.json');approval_sha=sha(config/'approval.json')
receipt=load(config/'freeze-commit.json')
assert receipt['freezeSha256']==sha(config/'freeze.json') and receipt['outerSha256']==sha(Path(__file__))
subprocess.check_call(['git','-C',str(config.parents[3]),'merge-base','--is-ancestor',receipt['freezeCommit'],'HEAD'])
assert subprocess.check_output(['git','rev-parse','HEAD']).decode().strip()==plan['productionHead']
assert not subprocess.check_output(['git','status','--porcelain']).strip()
assert len(sys.argv) in [2,3] and (len(sys.argv)==2 or sys.argv[2]=='--retry')
index=int(sys.argv[1]);retry='--retry' in sys.argv[2:]
assert index in ORDER and plan['executionOrder']==ORDER
root=Path('.eval-artifacts/p2-1-discovery-20261016');batch=root/'checkpoint-b-corrected-20261019'
ledger_path=batch/'ledger.json';ledger=load(ledger_path)
assert all(a.get('status')!='STARTING' for a in ledger['attempts'])
assert index==next_index(ledger) and index not in ledger['completed']
own=[a for a in ledger['attempts'] if a.get('outerApprovalSha256')==approval_sha]
prior=[a for a in own if a['index']==index]
assert (not prior and not retry) or (len(prior)==1 and retry and prior[0].get('retrySignals'))
if not own:
    assert sha(ledger_path)==approval['ledgerBeforeSha256']
    assert sha(Path(approval['sourcePreflightResult']))==approval['sourcePreflightSha256']
    assert can_resume_user(ledger,index,load(approval['sourcePreflightResult']),approval,time.time())
elif ledger['stop']:
    assert retry and ledger['stop']['code']=='OUTER_ENV_RETRY_PENDING' and ledger['stop']['index']==index
else: assert not retry
ready=not_before(ledger,index,approval_sha)
if not own:ready=max(ready,approval['notBeforeEpoch'])
if time.time()<ready:
    print(json.dumps({'status':'NOT_BEFORE','index':index,'notBeforeEpoch':ready,'remainingSeconds':ready-time.time()}))
    raise SystemExit(75)
origin=plan['budgetOrigin']
formal_started=sum(a.get('formalProbeStarted') is True for a in ledger['attempts'])
assert origin['formalProbes']+formal_started<plan['limits']['formalProbes']
assert ledger['models']+15<=plan['limits']['checkpointBModelCalls']
assert origin['models']+ledger['models']+15<=plan['limits']['modelCalls']
entry=next(v for v in load(plan['witnesses'])['variants'] if v['caseId']==plan['planned'][index]['caseId'])
assert datetime.fromisoformat(entry['validUntil'].replace('Z','+00:00')).timestamp()>time.time()+240
if ledger['stop']:
    ledger.setdefault('stopHistory',[]).append({'stop':ledger['stop'],'resolution':'USER_REQUESTED_SEVENTH_AFTER_PREFLIGHT_ONLY_429' if not own else 'APPROVED_SINGLE_15_MINUTE_RETRY','approvalSha256':approval_sha,'at':now()})
    ledger['stop']=None
if not own:
    if ledger.get('userResume'):ledger.setdefault('userResumeHistory',[]).append(ledger['userResume'])
    ledger['userResume']={'index':index,'order':ORDER,'approvalSha256':approval_sha,'at':now()}
ledger['activeOuterPolicy']={'approvalSha256':approval_sha,'freezeCommit':receipt['freezeCommit'],'order':ORDER,'networkTargets':plan['networkPreflightTargets'],'spacingSeconds':300,'retrySeconds':900,'maxRetriesPerItem':1}
p=plan['planned'][index]
directory=Path(p['output']).with_name(Path(p['output']).name+'-user-seventh-20261020'+('-retry-1' if retry else ''))
assert not directory.exists()
directory.parent.mkdir(parents=True,exist_ok=True)
a={'index':index,'caseId':p['caseId'],'repeat':p['repeat'],'head':plan['productionHead'],'startedAt':now(),'directory':str(directory),'status':'STARTING','outerApprovalSha256':approval_sha,'outerFreezeCommit':receipt['freezeCommit'],'policyAttempt':len(prior)+1,'notBeforeEpoch':ready}
ledger['attempts'].append(a);ledger_path.write_text(json.dumps(ledger,indent=2)+'\n')
args=['node','--env-file-if-exists='+str(Path(os.environ['PRAXIS_EVAL_ENV_FILE']).resolve()),'--import','tsx',plan['probeEntry'],'--input',p['input'],'--input-sha256',p['inputSha256'],'--witnesses',plan['witnesses'],'--output',str(directory),'--reviewed-reads',plan['reviewedReads'],'--no-proxy','--execute']
env=os.environ.copy();env.update({key:'1' for key in ['PRAXIS_ALLOW_LIVE_RESTAURANT_READ','PRAXIS_ALLOW_BROWSER_RUN','PRAXIS_ALLOW_LIVE_MODEL_EVAL']});env['PRAXIS_BROWSER_ENGINE']='LOCAL_CHROMIUM'
with (directory.parent/(directory.name+'.outer.log')).open('x') as log:
    try:a['exit']=subprocess.run(args,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=240).returncode
    except subprocess.TimeoutExpired:a['exit']=None;ledger['stop']={'code':'PROBE_PROCESS_TIMEOUT','index':index}
preflight=directory/'source-data-preflight.json'
a['preflightGoogle']=load(preflight).get('googleRequests',0) if preflight.exists() else 0
ledger['preflightGoogle']+=a['preflightGoogle']
signals=retry_signals(directory,load);a['retrySignals']=signals
summary=directory/'probe-summary.json'
if summary.exists():
    s=load(summary);models=s['resources']['modelCalls']
    assert 0<=models<=15 and s['decisionCapture']['callsStarted']==s['decisionCapture']['rowsWritten']==models
    ledger['models']+=models;ledger['google']+=s['resources']['google']['total']
    a.update({'status':'ENV_PROBE_RECORDED' if signals else 'PROBE_RECORDED','summary':str(summary),'summarySha256':sha(summary),'models':models,'formalProbeStarted':True,'google':s['resources']['google']['total'],'witnessInListingBySource':s['witnessInListingBySource'],'witnessInFirstBatch':s['witnessInFirstBatch'],'inRadiusParsed':s['inRadiusParsed']})
    if s['stop']:ledger['stop']=s['stop']
    if not signals:ledger['completed'].append(index)
elif (directory/'preflight-failure.json').exists():
    f=load(directory/'preflight-failure.json')
    assert f['classification']=='ENV_FAILURE' and f['modelCalls']==0 and f['formalProbeStarted'] is False
    a.update({'status':'ENV_FAILURE','models':0,'formalProbeStarted':False,'sourceIds':f['sourceIds'],'failureCode':f['failureCode']})
    evidence=load(preflight) if preflight.exists() else {}
    a['preflightEvidence']=evidence.get('attempts',[])
    failed=[x for x in a['preflightEvidence'] if x.get('outcome')=='FAILED']
    a['countsTowardStop']=bool(signals) or bool(failed) and all(x.get('countsTowardStop') is True for x in failed)
    ledger['preflightFailures']+=int(a['countsTowardStop'])
else:
    decisions=directory/'probe.decisions.jsonl';started=decisions.exists()
    a.update({'status':'NO_PROBE_SUMMARY','models':15 if started else 0,'formalProbeStarted':started})
    ledger['models']+=a['models']
    if started:a['modelsUpperBoundCharged']=15;a['decisionRowsObserved']=len(decisions.read_text().splitlines())
    if not signals:ledger['stop']=ledger['stop'] or {'code':'PROBE_NOT_COMPLETED','index':index}
a['finishedAt']=now()
if not ledger['stop'] and (signals or a['status']=='ENV_FAILURE'):
    ledger['stop']=after_environment_failure(index,signals,len(prior)+1,time.time())
ledger['formalProbeAttemptsStarted']=sum(x.get('formalProbeStarted') is True for x in ledger['attempts'])
ledger['compressedBytesEstimate']=sum(len(gzip.compress(path.read_bytes())) for path in root.rglob('*') if path.is_file())
if not ledger['stop'] and ledger['compressedBytesEstimate']>plan['limits']['compressedArtifactsBytes']:
    ledger['stop']={'code':'ARTIFACT_SIZE_CAP','bytes':ledger['compressedBytesEstimate']}
ledger_path.write_text(json.dumps(ledger,indent=2)+'\n')
print(json.dumps({'attempt':a,'models':ledger['models'],'completed':ledger['completed'],'formalProbeAttemptsStarted':ledger['formalProbeAttemptsStarted'],'stop':ledger['stop']},ensure_ascii=False,indent=2))
