from pathlib import Path
import json,hashlib,subprocess,sys,time
phase=sys.argv[1];root=Path.cwd();item=Path(__file__).resolve().parent;out=Path(sys.argv[2]).resolve();assert not out.is_relative_to(root);out.mkdir(exist_ok=False)
freeze=json.loads((item/('input-freeze-core-scope-red.json' if phase=='scope-red' else 'input-freeze-core-red.json' if phase=='red' else 'input-freeze-green.json')).read_text());git=lambda *x:subprocess.check_output(['git',*x],text=True)
for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
assert not git('status','--porcelain');cmd=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','src/integrations/restaurant-facts/model-source-facts.test.ts','src/integrations/restaurant-facts/model-page-question.test.ts'];t=time.monotonic();r=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=120);(out/'core.log').write_bytes(r.stdout);assert not git('status','--porcelain')
receipt={'phase':phase,'commit':git('rev-parse','HEAD').strip(),'command':cmd,'exitCode':r.returncode,'seconds':time.monotonic()-t,'gitStatusBefore':'','gitStatusAfter':''};(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
if phase.endswith('red'):assert r.returncode!=0 and 'refreshed mutable cache' in r.stdout.decode(),r.stdout.decode()[-1500:]
else:assert r.returncode==0,r.stdout.decode()[-1800:]
print(json.dumps(receipt))
