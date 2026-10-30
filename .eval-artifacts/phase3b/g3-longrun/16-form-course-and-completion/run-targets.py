from pathlib import Path
import sys,json,subprocess,hashlib,time,os,signal
root=Path.cwd();item=Path(__file__).resolve().parent;phase=sys.argv[1];out=Path(sys.argv[2]).resolve();assert phase in ('red','green') and not out.is_relative_to(root);out.mkdir(exist_ok=False)
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip();freeze=json.loads((item/('input-freeze-'+phase+'.json')).read_text())
for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
assert not git('status','--porcelain');receipt={'mode':'OFFLINE_LOCAL_FIXTURE','phase':phase,'commit':git('rev-parse','HEAD'),'runs':[]}
commands=[('target',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','src/integrations/tabelog/tabelog-vacancy-response.test.ts','src/integrations/tabelog/tabelog-public-selection.test.ts'])]
if phase=='green':commands.extend([('related',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','src/integrations/tabelog/tabelog-response-only.test.ts','src/integrations/tabelog/tabelog-browser-availability.test.ts']),('legacy',['node','--import','tsx','.eval-artifacts/phase3b/g3-longrun/11-price-applicability/compare-legacy.ts',str(out/'legacy-state-changes.json')]),('hard-bytes',['node','--import','tsx','.eval-artifacts/phase3b/g1-revision/check-fact-compatibility.ts','check','.eval-artifacts/phase3b/g3-longrun/hard-before.json'])])
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
 assert not git('status','--porcelain');receipt['runs'].append({'name':name,'command':cmd,'exitCode':code,'seconds':time.monotonic()-started,'gitStatusBefore':'','gitStatusAfter':''});(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(name,code,flush=True)
for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
