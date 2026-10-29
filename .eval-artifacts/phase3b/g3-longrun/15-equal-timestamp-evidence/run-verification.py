from pathlib import Path
import datetime,hashlib,json,os,re,signal,subprocess,sys,time
root=Path.cwd();item=Path(__file__).resolve().parent;out=Path(sys.argv[1]).resolve();assert not out.is_relative_to(root);out.mkdir(exist_ok=False)
git=lambda *args:subprocess.check_output(['git',*args],text=True).strip()
freeze=json.loads((item/'input-freeze-green.json').read_text())
def verify():
 for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
verify();assert not git('status','--porcelain');head=git('rev-parse','HEAD')
known=json.loads((item.parent/'14-quoted-fact-reads/failed-gate-inventory.json').read_text())
clean_name=lambda name:re.sub(r'\s+\([\d.]+ms\)$','',name.removeprefix('✖ '))
known_names={clean_name(r['name']) for r in known['failingLeafAssertions']}
now=lambda:datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
result={'mode':'OFFLINE_LOCAL_FIXTURE','testedCommit':head,'startedAtCET':now(),'freezeSha256':hashlib.sha256((item/'input-freeze-green.json').read_bytes()).hexdigest(),'orchestrationSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'runs':[],'restorations':0,'gatePolicy':'Known unresolved A fixture failures remain FAIL; continue the matrix only when every failing leaf is already recorded. Any new failure stops verification.'}
steps=[('typecheck',['npm','run','typecheck']),('arch-check',['npm','run','arch:check']),('npm-test',['npm','test']),('build',['npm','run','build']),('browser-fixture',['npm','run','test:browser:fixture']),('dom-change',['npm','run','test:dom-change'])]
for name,command in steps:
 assert git('rev-parse','HEAD')==head and not git('status','--porcelain');started=time.monotonic()
 print('START',name,flush=True)
 environment={**os.environ,'PRAXIS_G2_REQUIRE_PASS':'1'} if name=='dom-change' else None
 with (out/(name+'.log')).open('wb') as log:
  proc=subprocess.Popen(command,stdout=log,stderr=subprocess.STDOUT,start_new_session=True,env=environment)
  try:code=proc.wait(timeout=600)
  except subprocess.TimeoutExpired:
   os.killpg(proc.pid,signal.SIGTERM)
   try:proc.wait(timeout=5)
   except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait()
   code=proc.returncode
 raw=(out/(name+'.log')).read_bytes();text=raw.decode(errors='replace');status=git('status','--porcelain')
 row={'gate':name,'command':command,'exitCode':code,'outcome':'PASS' if code==0 else 'FAIL','seconds':time.monotonic()-started,'gitStatusBefore':'','gitStatusAfter':status,'logSha256':hashlib.sha256(raw).hexdigest(),'summary':{k:int(v) for k,v in re.findall(r'^(?:#|ℹ) (tests|pass|fail|cancelled|skipped|todo) (\d+)$',text,re.M)}}
 if name=='npm-test' and code!=0:
  tail=text.split('✖ failing tests:')[-1]
  actual={clean_name(line) for line in tail.splitlines() if line.startswith('✖ ')}
  row.update(failingLeaves=sorted(actual),knownUnresolvedAFixtures=bool(actual) and actual.issubset(known_names),newFailures=sorted(actual-known_names))
 result['runs'].append(row);(out/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print('END',name,row['outcome'],row['summary'],'clean='+str(not status),flush=True)
 verify()
 if status or code and not row.get('knownUnresolvedAFixtures'):
  result['stopReason']='UNEXPECTED_FAILURE_OR_CHECKOUT_CHANGE';(out/'verification.json').write_text(json.dumps(result,indent=2)+'\n');raise SystemExit(1)
result.update(finishedAtCET=now(),freezeVerifiedAfter=True,overall='PENDING_A_FIXTURE_SYNC' if any(r['outcome']=='FAIL' for r in result['runs']) else 'PASS')
(out/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print('COMPLETE',result['overall'],flush=True)
