"""Frozen focused controls; artifact outputs never enter the worktree."""
from pathlib import Path
import datetime,hashlib,json,os,re,signal,subprocess,sys,time
root=Path.cwd();item=Path(__file__).resolve().parent;phase=sys.argv[1];out=Path(sys.argv[2]).resolve();assert phase in ('red','green') and not out.is_relative_to(root);out.mkdir(parents=True,exist_ok=False)
freezePath=item/('input-freeze-controls-red.json' if phase=='red' else 'input-freeze-green.json');freezeBytes=freezePath.read_bytes();freeze=json.loads(freezeBytes);git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
def verify():
 for p,h in freeze['files'].items():assert hashlib.sha256((root/p).read_bytes()).hexdigest()==h,p
verify();assert not git('status','--porcelain');receipt={'atCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1),'CET')).isoformat(),'mode':'OFFLINE_COMPONENT_AND_REAL_LOCAL_CHROMIUM','phase':phase,'commit':git('rev-parse','HEAD'),'freezeSha256':hashlib.sha256(freezeBytes).hexdigest(),'orchestrationSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'runs':[]}
files=['src/integrations/restaurant-facts/page-question-capture.test.ts'] if phase=='red' else sorted(str(p) for p in Path('src/integrations/restaurant-facts').glob('*.test.ts'))
commands=[('unit',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test',*files]),('guard',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','src/harness/browser/page-question-budget.test.ts']),('hard-bytes',['node','--import','tsx','.eval-artifacts/phase3b/g1-revision/check-fact-compatibility.ts','check','.eval-artifacts/phase3b/g3-longrun/hard-before.json'])]
for name,cmd in commands:
 assert not git('status','--porcelain');started=time.monotonic()
 with (out/(name+'.log')).open('wb') as log:
  p=subprocess.Popen(cmd,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
  try:code=p.wait(timeout=180)
  except subprocess.TimeoutExpired:
   os.killpg(p.pid,signal.SIGTERM)
   try:p.wait(timeout=5)
   except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait()
   code=p.returncode
 assert not git('status','--porcelain');verify();raw=(out/(name+'.log')).read_bytes();summary={k:int(v) for k,v in re.findall(r'^(?:#|ℹ) (tests|pass|fail|cancelled|skipped|todo) (\d+)\s*$',raw.decode(errors='replace'),re.M)}
 receipt['runs'].append({'name':name,'command':cmd,'exitCode':code,'seconds':time.monotonic()-started,'summary':summary,'logSha256':hashlib.sha256(raw).hexdigest(),'gitStatusBefore':'','gitStatusAfter':''});(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(name,code,summary,flush=True)
 if phase=='green' and code:raise SystemExit(1)
assert receipt['runs'][2]['exitCode']==0
if phase=='red':assert receipt['runs'][0]['exitCode']!=0 and receipt['runs'][1]['exitCode']!=0
