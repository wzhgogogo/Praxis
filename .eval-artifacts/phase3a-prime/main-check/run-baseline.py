from pathlib import Path
import subprocess,time,datetime,json,re,os,signal,hashlib,statistics
baseline=Path('/private/tmp/praxis-phase2c-mainline-integration')
out=Path(__file__).resolve().parent
expected='ac571ca8188082902f2ea20fc10d9dd05cbb2f6a'
def git(*args): return subprocess.check_output(['git','-C',str(baseline),*args])
assert git('rev-parse','HEAD').decode().strip()==expected
assert not git('status','--porcelain').strip(), 'baseline must start clean'
result={'mode':'OFFLINE_LOCAL_FIXTURE','baselineCommit':expected,'cwd':str(baseline),'perCommandTimeoutSeconds':600,'runs':[],'generatedRestorations':[]}
def save(): (out/'gates.json').write_text(json.dumps(result,indent=2)+'\n')
steps=[('typecheck',1,['npm','run','typecheck']),('arch-check',1,['npm','run','arch:check']),('npm-test',1,['npm','test']),('build',1,['npm','run','build']),('browser-fixture',1,['npm','run','test:browser:fixture']),('npm-test',2,['npm','test']),('browser-fixture',2,['npm','run','test:browser:fixture']),('npm-test',3,['npm','test']),('browser-fixture',3,['npm','run','test:browser:fixture'])]
for name,n,cmd in steps:
 assert not git('status','--porcelain').strip(), 'baseline must be clean before each sample'
 start=time.monotonic(); log=out/f'{name}-{n}.log'; row={'gate':name,'sample':n,'command':cmd,'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'log':log.name}
 print('START',name,n,flush=True)
 with log.open('wb') as f:
  p=subprocess.Popen(cmd,cwd=baseline,stdout=f,stderr=subprocess.STDOUT,start_new_session=True)
  try: row['exitCode']=p.wait(timeout=600)
  except subprocess.TimeoutExpired:
   row['timedOut']=True;os.killpg(p.pid,signal.SIGTERM)
   try: p.wait(timeout=10)
   except subprocess.TimeoutExpired: os.killpg(p.pid,signal.SIGKILL);p.wait()
   row['exitCode']=p.returncode
 row['elapsedSeconds']=round(time.monotonic()-start,6)
 text=log.read_text(errors='replace')
 row['summary']={k:int(v) for k,v in re.findall(r'^# (tests|suites|pass|fail|cancelled|skipped|todo) (\d+)$',text,re.M)}
 row['logSha256']=hashlib.sha256(log.read_bytes()).hexdigest()
 changes=git('diff','--name-only','-z').decode().split('\0')
 for path in filter(None,changes):
  if not path.startswith('.eval-artifacts/'): raise RuntimeError('unexpected change '+path)
  target=baseline/path;new=target.read_bytes();old=git('show',f'HEAD:{path}')
  dest=out/'generated'/name/str(n)/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(new)
  result['generatedRestorations'].append({'gate':name,'sample':n,'path':path,'beforeSha256':hashlib.sha256(old).hexdigest(),'afterSha256':hashlib.sha256(new).hexdigest(),'generatedCopy':str(dest.relative_to(out))})
  target.write_bytes(old)
 assert not git('status','--porcelain').strip(), 'unexpected worktree change'
 result['runs'].append(row);save();print('END',name,n,row['exitCode'],row['elapsedSeconds'],row['summary'],flush=True)
 if row['exitCode']!=0:
  result['stopReason']='STOP_POINT_0_GATE_FAILED';save();raise SystemExit(1)
result['medians']={name:statistics.median([r['elapsedSeconds'] for r in result['runs'] if r['gate']==name]) for name in ['npm-test','browser-fixture']}
result['stopReason']=None;save();print('BASELINE COMPLETE',result['medians'],flush=True)
