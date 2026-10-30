from pathlib import Path
import sys,json,hashlib,subprocess,time
root=Path.cwd();item=Path(__file__).resolve().parent;out=Path(sys.argv[1]).resolve();assert not out.is_relative_to(root);out.mkdir(exist_ok=False)
freeze=json.loads((item/'input-freeze-green.json').read_text());git=lambda *x:subprocess.check_output(['git',*x],text=True)
for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
assert not git('status','--porcelain');cmd=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-concurrency=4','src/harness/browser/browser-read-tabelog.test.ts','src/harness/browser/browser-read-tabelog-control-fallback.test.ts','src/harness/browser/browser-read-public-selection.test.ts'];t=time.monotonic();r=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=240);(out/'browser.log').write_bytes(r.stdout);assert not git('status','--porcelain');(out/'receipt.json').write_text(json.dumps({'commit':git('rev-parse','HEAD').strip(),'command':cmd,'exitCode':r.returncode,'seconds':time.monotonic()-t,'gitStatusBefore':'','gitStatusAfter':''},indent=2)+'\n');print('related Chromium',r.returncode)
