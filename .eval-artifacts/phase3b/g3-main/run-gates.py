"""Reviewed G3 main integration: stop on any failure; five gates, strict G2, frozen controls."""
from pathlib import Path
import datetime,hashlib,json,os,platform,re,signal,subprocess,sys,time
root=Path.cwd();item=Path(__file__).resolve().parent;out=Path(sys.argv[1]).resolve()
assert not out.is_relative_to(root);out.mkdir(parents=True,exist_ok=False)
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
freeze_path=item/'input-freeze-gates.json';freeze_bytes=freeze_path.read_bytes();freeze=json.loads(freeze_bytes)
now=lambda:datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1),'CET')).isoformat()
def verify():
 for path,expected in freeze['files'].items():assert hashlib.sha256((root/path).read_bytes()).hexdigest()==expected,path
verify();assert not git('status','--porcelain');commit=git('rev-parse','HEAD')
result={'mode':'OFFLINE_MOCK_AND_LOCAL_CHROMIUM','testedCommit':commit,'startedAtCET':now(),'platform':platform.platform(),'nodeVersion':subprocess.check_output(['node','--version'],text=True).strip(),'orchestrationSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'freezeSha256':hashlib.sha256(freeze_bytes).hexdigest(),'frozenPaths':len(freeze['files']),'restorations':0,'gatePolicy':'Stop on any failure; no fixes, retries, or main publication on red','runs':[]}
steps=[('typecheck',['npm','run','typecheck']),('arch-check',['npm','run','arch:check']),('npm-test',['npm','test']),('build',['npm','run','build']),('browser-fixture',['npm','run','test:browser:fixture']),('strict-dom-change',['npm','run','test:dom-change']),('legacy-states',['node','--import','tsx','.eval-artifacts/phase3b/g3-longrun/11-price-applicability/compare-legacy.ts',str(out/'legacy-state-changes.json')]),('hard-bytes',['node','--import','tsx','.eval-artifacts/phase3b/g1-revision/check-fact-compatibility.ts','check','.eval-artifacts/phase3b/g3-longrun/hard-before.json'])]
for name,cmd in steps:
 verify();assert git('rev-parse','HEAD')==commit;assert not git('status','--porcelain')
 row={'gate':name,'command':cmd,'startedAtCET':now(),'gitStatusBefore':'','log':name+'.log'};started=time.monotonic();print('START',name,flush=True)
 with (out/row['log']).open('wb') as log:
  env={**os.environ,'PRAXIS_G2_REQUIRE_PASS':'1'} if name=='strict-dom-change' else None
  proc=subprocess.Popen(cmd,stdout=log,stderr=subprocess.STDOUT,start_new_session=True,env=env)
  try:row['exitCode']=proc.wait(timeout=600)
  except subprocess.TimeoutExpired:
   row['timedOut']=True;os.killpg(proc.pid,signal.SIGTERM)
   try:proc.wait(timeout=5)
   except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait()
   row['exitCode']=proc.returncode
 row['elapsedSeconds']=round(time.monotonic()-started,6);raw=(out/row['log']).read_bytes();txt=raw.decode(errors='replace')
 row['summary']={k:int(v) for k,v in re.findall(r'^(?:#|ℹ) (tests|suites|pass|fail|cancelled|skipped|todo) (\d+)\s*$',txt,re.M)}
 row['logSha256']=hashlib.sha256(raw).hexdigest();row['gitStatusAfter']=git('status','--porcelain');row['outcome']='PASS' if row['exitCode']==0 and not row['gitStatusAfter'] else 'FAIL'
 if name=='browser-fixture' and row['outcome']=='PASS':
  assert '[browser fixtures] combined summary' in txt
  assert re.search(r'G2 \(exclusive\): \d+ files, concurrency 1',txt)
  assert re.search(r'remaining fixtures: \d+ files, concurrency 4',txt)
 if name=='legacy-states' and row['outcome']=='PASS':
  data=json.loads((out/'legacy-state-changes.json').read_text());assert (data['calls'],data['states'],data['changedStates'])==(367,481,1)
  change=data['changes'][0];assert (change['oldStatus'],change['newStatus'],change['intent']['partySize'])==('MET','NOT_CHECKED',2)
 verify();result['runs'].append(row);(out/'gates.json').write_text(json.dumps(result,indent=2)+'\n');print('END',name,row['outcome'],row['elapsedSeconds'],row['summary'],flush=True)
 if row['outcome']!='PASS':result['stopReason']='GATE_FAILURE_OR_CHECKOUT_CHANGE';(out/'gates.json').write_text(json.dumps(result,indent=2)+'\n');raise SystemExit(1)
result.update(acceptance='SATISFIED',finishedAtCET=now(),freezeVerifiedAfter=True)
(out/'gates.json').write_text(json.dumps(result,indent=2)+'\n');print('COMPLETE SATISFIED',flush=True)
