from pathlib import Path
import sys,json,subprocess,hashlib,time
root=Path.cwd();item=Path(__file__).resolve().parent;out=Path(sys.argv[1]).resolve();assert not out.is_relative_to(root);out.mkdir(exist_ok=False)
freeze=json.loads((item/'input-freeze-green.json').read_text());git=lambda *a:subprocess.check_output(['git',*a],text=True)
for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
assert not git('status','--porcelain');result={'commit':git('rev-parse','HEAD').strip(),'runs':[]}
commands=[('typecheck',['npm','run','typecheck']),('native',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','src/infrastructure/browser/browser-source-model-budget.test.ts','src/integrations/restaurant-facts/model-page-question.test.ts','src/integrations/restaurant-facts/model-source-facts.test.ts','src/integrations/tabelog/tabelog-browser-availability.test.ts','src/integrations/tablecheck/tablecheck-browser-availability.test.ts','src/integrations/restaurant-availability/live-browser-availability.test.ts']),('hard',['node','--import','tsx','.eval-artifacts/phase3b/g1-revision/check-fact-compatibility.ts','check','.eval-artifacts/phase3b/g3-longrun/hard-before.json'])]
for name,cmd in commands:
 t=time.monotonic();r=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=240);(out/(name+'.log')).write_bytes(r.stdout)
 result['runs'].append({'name':name,'command':cmd,'exitCode':r.returncode,'seconds':time.monotonic()-t,'gitStatusBefore':'','gitStatusAfter':git('status','--porcelain')});assert not result['runs'][-1]['gitStatusAfter'];(out/'receipt.json').write_text(json.dumps(result,indent=2)+'\n');print(name,r.returncode,flush=True)
