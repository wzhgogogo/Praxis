from pathlib import Path
import json,subprocess,sys,hashlib,time
root=Path.cwd();item=Path(__file__).resolve().parent;out=Path(sys.argv[1]).resolve();assert not out.is_relative_to(root);out.mkdir(parents=True,exist_ok=False)
freeze=json.loads((item/'input-freeze-green.json').read_text());git=lambda *x:subprocess.check_output(['git',*x],text=True)
for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
assert not git('status','--porcelain');result={'commit':git('rev-parse','HEAD').strip(),'runs':[]}
steps=[('native',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','src/integrations/tabelog/tabelog-browser-availability.test.ts','src/integrations/tabelog/tabelog-public-selection.test.ts','src/infrastructure/browser/control-selected-state.test.ts']),('chromium',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-concurrency=4','src/harness/browser/browser-read-calendar-controls.test.ts','src/harness/browser/browser-read-tabelog.test.ts','src/harness/browser/browser-read-tabelog-control-fallback.test.ts']),('typecheck',['npm','run','typecheck'])]
for name,cmd in steps:
 started=time.monotonic();r=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=240);(out/(name+'.log')).write_bytes(r.stdout)
 result['runs'].append({'name':name,'command':cmd,'exitCode':r.returncode,'seconds':time.monotonic()-started,'gitStatusBefore':'','gitStatusAfter':git('status','--porcelain')});assert not result['runs'][-1]['gitStatusAfter']
 (out/'receipt.json').write_text(json.dumps(result,indent=2)+'\n');print(name,r.returncode,flush=True)
