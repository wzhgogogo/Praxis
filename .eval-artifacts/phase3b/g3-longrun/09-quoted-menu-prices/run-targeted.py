from pathlib import Path
import sys,json,hashlib,subprocess,time
phase=sys.argv[1];out=Path(sys.argv[2]).resolve();root=Path.cwd();assert not out.is_relative_to(root);out.mkdir(parents=True,exist_ok=False)
item=Path(__file__).resolve().parent;freeze=json.loads((item/f'input-freeze-{phase}.json').read_text());git=lambda *a:subprocess.check_output(['git',*a],text=True)
def verify():
 for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
verify();assert not git('status','--porcelain');cmd=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-name-pattern=G3c .*quotes','src/integrations/tabelog/tabelog-browser-availability.test.ts','src/integrations/tablecheck/tablecheck-browser-availability.test.ts'];t=time.monotonic();r=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=120);(out/'adapters.log').write_bytes(r.stdout);verify();assert not git('status','--porcelain')
receipt={'phase':phase,'commit':git('rev-parse','HEAD').strip(),'command':cmd,'exitCode':r.returncode,'seconds':time.monotonic()-t,'gitStatusBefore':'','gitStatusAfter':'','freezeVerifiedAfter':True,'newRealCalls':0};(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
if phase=='red':assert r.returncode!=0 and 'AssertionError' in r.stdout.decode(),r.stdout.decode()[-1500:]
else:assert r.returncode==0,r.stdout.decode()[-2000:]
print(json.dumps(receipt))
