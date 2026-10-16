"""One frozen planned probe per invocation; no retries, model fallback or product changes."""
from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,subprocess,os,sys,gzip
b=Path('.eval-artifacts/p2-1-discovery-20261016')
now=lambda:datetime.now(timezone.utc).isoformat()
sha=lambda data:hashlib.sha256(data).hexdigest()
index=int(sys.argv[1]);plan=json.loads((b/'baseline-plan.json').read_text());assert 0<=index<len(plan['planned'])
freeze=json.loads((b/'baseline-freeze.json').read_text())
for name,value in freeze['files'].items():assert sha(Path(name).read_bytes())==value,name
assert subprocess.run(['git','diff','--exit-code','HEAD','--','src','scripts','package.json','package-lock.json'],capture_output=True).returncode==0
ledger_path=b/'baseline-ledger.json'
ledger=json.loads(ledger_path.read_text()) if ledger_path.exists() else {'planned':10,'models':0,'google':0,'formalLiveRuns':0,'completed':[],'attempts':[],'stop':None}
if ledger['stop']:raise SystemExit('BATCH_STOPPED: '+str(ledger['stop']))
if index in ledger['completed'] or any(a['index']==index for a in ledger['attempts']):raise SystemExit('DUPLICATE_ATTEMPT_REFUSED')
assert ledger['models']+15<=150
p=plan['planned'][index];directory=Path(p['output']);directory.parent.mkdir(parents=True,exist_ok=True)
assert not directory.exists()
head=subprocess.check_output(['git','rev-parse','HEAD']).decode().strip()
a={'index':index,'caseId':p['caseId'],'repeat':p['repeat'],'head':head,'startedAt':now(),'directory':str(directory),'status':'STARTING'}
ledger['attempts'].append(a);ledger_path.write_text(json.dumps(ledger,indent=2)+'\n')
args=['node','--env-file-if-exists='+str(Path('.env').resolve()),'--import','tsx','src/eval/restaurant/agent-loop/runners/run-discovery-probe.ts','--input',p['input'],'--input-sha256',p['inputSha256'],'--witnesses',str(b/'witnesses.certified.json'),'--output',str(directory),'--reviewed-reads',str(b/'outer/reviewed-reads.json'),'--no-proxy','--execute']
env=os.environ.copy();env.update({k:'1' for k in ['PRAXIS_ALLOW_LIVE_RESTAURANT_READ','PRAXIS_ALLOW_BROWSER_RUN','PRAXIS_ALLOW_LIVE_MODEL_EVAL']});env['PRAXIS_BROWSER_ENGINE']='LOCAL_CHROMIUM'
with (directory.parent/f'attempt-{p["repeat"]}.outer.log').open('x') as log:
 try:
  result=subprocess.run(args,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=240);a['exit']=result.returncode
 except subprocess.TimeoutExpired:
  a['status']='ORCHESTRATION_INTERRUPTED';a['exit']=None;ledger['stop']={'code':'PROBE_PROCESS_TIMEOUT','index':index}
summary_path=directory/'probe-summary.json'
if summary_path.exists():
 s=json.loads(summary_path.read_text());models=s['resources']['modelCalls'];assert 0<=models<=15
 assert s['decisionCapture']['callsStarted']==s['decisionCapture']['rowsWritten']==models
 ledger['models']+=models;ledger['google']+=s['resources']['google']['total'];ledger['completed'].append(index)
 a.update({'status':'PROBE_RECORDED','summary':str(summary_path),'summarySha256':sha(summary_path.read_bytes()),'models':models,'google':s['resources']['google']['total'],'witnessInListing':s['witnessInListing'],'witnessInFirstBatch':s['witnessInFirstBatch'],'inRadiusParsed':s['inRadiusParsed']})
 if s['stop']:ledger['stop']=s['stop']
 # The instruction explicitly requires stopping if the expected discovery bottleneck already changed.
 if p['role']=='TARGET' and s['witnessInListing'] and not ledger['stop']:
  ledger['stop']={'code':'BASELINE_DIFFERS_FROM_EXPECTED_MISS','index':index,'basis':'A certified target witness is already in a source-funnel-bound first-batch listing. Inspect raw attempt before any further runs.'}
else:
 # Never manufacture a probe summary or a zero model count for a started decision stream.
 decisions=directory/'probe.decisions.jsonl'
 if decisions.exists():
  rows=[json.loads(line) for line in decisions.read_text().splitlines() if line.strip()];a['decisionRowsObserved']=len(rows);a['modelsUpperBoundCharged']=15;ledger['models']+=15
 else:a['models']=0
 a['status']=a.get('status') if a.get('status')=='ORCHESTRATION_INTERRUPTED' else 'NO_PROBE_SUMMARY'
 ledger['stop']=ledger['stop'] or {'code':'PROBE_NOT_COMPLETED','index':index,'reviewBeforeRetry':True}
a['finishedAt']=now()
compressed_bytes=sum(len(gzip.compress(path.read_bytes())) for path in b.rglob('*') if path.is_file())
ledger['compressedBytesEstimate']=compressed_bytes
if compressed_bytes>60000000:ledger['stop']={'code':'ARTIFACT_SIZE_CAP','bytes':compressed_bytes}
ledger_path.write_text(json.dumps(ledger,indent=2)+'\n')
print(json.dumps({'attempt':a,'cumulative':{'models':ledger['models'],'google':ledger['google'],'completed':len(ledger['completed']),'formalLiveRuns':0},'stop':ledger['stop']},ensure_ascii=False,indent=2))
