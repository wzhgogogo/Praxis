from pathlib import Path
import sys,json,subprocess,hashlib,time,os,signal
root=Path.cwd();item=Path(__file__).resolve().parent;phase=sys.argv[1];out=Path(sys.argv[2]).resolve()
assert phase in ('red','green') and not out.is_relative_to(root);out.mkdir(exist_ok=False)
freeze=json.loads((item/('input-freeze-'+phase+'.json')).read_text());git=lambda *a:subprocess.check_output(['git',*a],text=True)
for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
assert not git('status','--porcelain');receipt={'commit':git('rev-parse','HEAD').strip(),'phase':phase,'runs':[]}
commands=[('targets',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','src/integrations/restaurant-facts/model-source-facts.test.ts','src/integrations/restaurant-facts/quoted-fact-read.test.ts','src/integrations/restaurant-facts/google-listed-website-facts.test.ts']),('legacy',['node','--import','tsx','.eval-artifacts/phase3b/g3-longrun/11-price-applicability/compare-legacy.ts',str(out/'legacy-state-changes.json')]),('hard-bytes',['node','--import','tsx','.eval-artifacts/phase3b/g1-revision/check-fact-compatibility.ts','check','.eval-artifacts/phase3b/g3-longrun/hard-before.json'])]
if phase=='green':
 commands.insert(1,('corresponding',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test',
 'src/integrations/tabelog/tabelog-browser-availability.test.ts',
 'src/integrations/tablecheck/tablecheck-browser-availability.test.ts',
 'src/integrations/restaurant-availability/native-outlet-continuity.test.ts',
 'src/integrations/restaurant-facts/model-fact-judgment.test.ts',
 'src/integrations/restaurant-facts/page-question-reader.test.ts',
 'src/application/restaurant-presentation-evidence.test.ts']))

for name,cmd in commands:
 for path in cmd:
  if path.endswith(".test.ts"):assert (root/path).is_file(),path
 t=time.monotonic();timed_out=False
 with (out/(name+'.log')).open('wb') as log:
  proc=subprocess.Popen(cmd,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
  try:code=proc.wait(timeout=180)
  except subprocess.TimeoutExpired:
   timed_out=True;os.killpg(proc.pid,signal.SIGTERM)
   try:code=proc.wait(timeout=5)
   except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);code=proc.wait()
 assert not git('status','--porcelain');receipt['runs'].append({'name':name,'command':cmd,'exitCode':code,'timedOut':timed_out,'seconds':time.monotonic()-t,'gitStatusBefore':'','gitStatusAfter':''});(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(name,code,flush=True)
