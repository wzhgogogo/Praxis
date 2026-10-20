from pathlib import Path
from datetime import datetime,timezone
import os,sys,json,hashlib,subprocess,time,signal,gzip
sys.dont_write_bytecode=True
from policy import epoch,next_index,not_before,retry_signals
config=Path(__file__).resolve().parent
load=lambda p:json.loads(Path(p).read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
now=lambda:datetime.now(timezone.utc).isoformat()
freeze=load(config/'freeze.json');plan=load(config/'plan.json');receipt=load(config/'freeze-commit.json')
for path,expected in freeze['files'].items():assert sha(path)==expected,path
assert receipt['freezeSha256']==sha(config/'freeze.json')
subprocess.check_call(['git','merge-base','--is-ancestor',receipt['freezeCommit'],'HEAD'])
assert not subprocess.check_output(['git','diff','--name-only','HEAD','--','src','scripts','package.json','package-lock.json']).strip()
assert len(sys.argv) in [2,3] and (len(sys.argv)==2 or sys.argv[2]=='--retry')
index=int(sys.argv[1]);retry='--retry' in sys.argv[2:]
ledger=load(config/'ledger.json');assert not any(a['status']=='STARTING' for a in ledger['attempts'])
assert index==next_index(ledger) and plan['planned'][index]['index']==index
prior=[a for a in ledger['attempts'] if a['index']==index]
assert (not prior and not retry and ledger['stop'] is None) or (len(prior)==1 and retry and ledger['stop']['code']=='ENVIRONMENT_RETRY_PENDING' and prior[0]['retrySignals'])
ready=not_before(ledger,index)
if time.time()<ready:
 print(json.dumps({'status':'NOT_BEFORE','notBeforeEpoch':ready,'remainingSeconds':ready-time.time()}));raise SystemExit(75)
# Expiry and every attempt, including environment/capability failures, retain their budget charge.
if time.time()+plan['limits']['outerProcessTimeoutSeconds']>=epoch(plan['witnessCutoff']):
 ledger['stop']={'code':'WITNESS_EXPIRED_OR_INSUFFICIENT_WINDOW','index':index};(config/'ledger.json').write_text(json.dumps(ledger,indent=2)+'\n');print(json.dumps(ledger['stop']));raise SystemExit(2)
origin=plan['budgetOrigin'];formal=sum(a.get('formalProbeStarted') is True for a in ledger['attempts'])
assert origin['formalProbes']+formal<plan['limits']['formalProbes']
assert origin['models']+ledger['models']+15<=plan['limits']['modelCalls']
p=plan['planned'][index];directory=Path(p['output']+('-retry-1' if retry else ''));assert not directory.exists()
directory.parent.mkdir(parents=True,exist_ok=True)
if retry:ledger.setdefault('stopHistory',[]).append({'stop':ledger['stop'],'at':now(),'resolution':'APPROVED_SINGLE_15_MINUTE_RETRY'});ledger['stop']=None
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
a={'index':index,'caseId':p['caseId'],'repeat':p['repeat'],'directory':str(directory),'head':head,'startedAt':now(),'policyAttempt':len(prior)+1,'status':'STARTING','notBeforeEpoch':ready};ledger['attempts'].append(a)
(config/'ledger.json').write_text(json.dumps(ledger,indent=2)+'\n')
args=['node','--env-file='+os.environ['PRAXIS_EVAL_ENV_FILE'],'--import','tsx',str(config/'probe-entry.ts'),'--input',p['input'],'--input-sha256',p['inputSha256'],'--witnesses',plan['witnesses'],'--output',str(directory),'--reviewed-reads',plan['reviewedReads'],'--no-proxy','--execute']
env={**os.environ,**{key:'1' for key in ['PRAXIS_ALLOW_LIVE_RESTAURANT_READ','PRAXIS_ALLOW_BROWSER_RUN','PRAXIS_ALLOW_LIVE_MODEL_EVAL']},'PRAXIS_BROWSER_ENGINE':'LOCAL_CHROMIUM'}
with Path(str(directory)+'.outer.log').open('x') as log:
 process=subprocess.Popen(args,env=env,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
 try:a['exitCode']=process.wait(timeout=plan['limits']['outerProcessTimeoutSeconds'])
 except subprocess.TimeoutExpired:
  os.killpg(process.pid,signal.SIGTERM)
  try:process.wait(timeout=2)
  except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);process.wait()
  a['exitCode']=None;ledger['stop']={'code':'PROCESS_TIMEOUT','index':index}
preflight=directory/'source-data-preflight.json';a['preflightGoogle']=load(preflight).get('googleRequests',0) if preflight.exists() else 0;ledger['preflightGoogle']+=a['preflightGoogle']
a['retrySignals']=retry_signals(directory,load)
a['formalProbeStarted']=(directory/'formal-started.json').exists();summary=directory/'probe-summary.json'
if summary.exists():
 s=load(summary);models=s['resources']['modelCalls'];assert 0<=models<=15 and s['decisionCapture']['callsStarted']==s['decisionCapture']['rowsWritten']==models
 a.update({'status':'PROBE_RECORDED','models':models,'google':s['resources']['google']['total'],'summary':str(summary),'summarySha256':sha(summary),'failureCodes':s['failureCodes'],'boundary':s['boundary']['status']})
 ledger['models']+=models;ledger['google']+=a['google']
 if s['stop']:ledger['stop']=s['stop']
 if not a['retrySignals']:ledger['completed'].append(index)
elif (directory/'preflight-failure.json').exists():
 f=load(directory/'preflight-failure.json');assert f['modelCalls']==0 and f['formalProbeStarted'] is False
 a.update({'status':'ENV_FAILURE','models':0,'sourceIds':f['sourceIds']})
else:
 a.update({'status':'NO_PROBE_SUMMARY','models':15 if a['formalProbeStarted'] else 0})
 if a['formalProbeStarted']:ledger['models']+=15;a['modelsUpperBoundCharged']=True
 if not a['retrySignals']:ledger['stop']=ledger['stop'] or {'code':'PROBE_NOT_COMPLETED','index':index}
a['finishedAt']=now()
if not ledger['stop'] and (a['retrySignals'] or a['status']=='ENV_FAILURE'):
 ledger['stop']={'code':'ENVIRONMENT_RETRY_PENDING' if a['retrySignals'] and len(prior)==0 else 'ENVIRONMENT_RETRY_FAILED' if a['retrySignals'] else 'PREFLIGHT_EVIDENCE_GAP','index':index}
 if ledger['stop']['code']=='ENVIRONMENT_RETRY_PENDING':ledger['stop']['notBeforeEpoch']=time.time()+900
ledger['cumulative']={'models':origin['models']+ledger['models'],'formalProbes':origin['formalProbes']+sum(x.get('formalProbeStarted') is True for x in ledger['attempts']),'google':origin['google']+ledger['google']+ledger['preflightGoogle']}
ledger['compressedBytesEstimate']=plan['historicalCompressedBytes']+sum(len(gzip.compress(path.read_bytes())) for path in config.rglob('*') if path.is_file())
if ledger['compressedBytesEstimate']>plan['limits']['compressedArtifactsBytes']:ledger['stop']={'code':'ARTIFACT_SIZE_CAP','bytes':ledger['compressedBytesEstimate']}
if time.time()>=epoch(plan['witnessCutoff']):ledger['stop']={'code':'WITNESS_EXPIRED','index':index}
(config/'ledger.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'attempt':a,'completed':ledger['completed'],'cumulative':ledger['cumulative'],'stop':ledger['stop']},ensure_ascii=False,indent=2))
