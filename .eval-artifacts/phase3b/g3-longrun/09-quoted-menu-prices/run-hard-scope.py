from pathlib import Path
import sys,json,hashlib,subprocess,time
root=Path.cwd();item=Path(__file__).resolve().parent;out=Path(sys.argv[1]).resolve();assert not out.is_relative_to(root);out.mkdir(exist_ok=False)
freeze=json.loads((item/'input-freeze-hard-scope-red.json').read_text());git=lambda *x:subprocess.check_output(['git',*x],text=True)
for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
assert not git('status','--porcelain');cmd=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-name-pattern=G3c Tabelog quotes','src/integrations/tabelog/tabelog-browser-availability.test.ts'];t=time.monotonic();r=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=120);(out/'hard-scope.log').write_bytes(r.stdout);assert not git('status','--porcelain')
text=r.stdout.decode();assert r.returncode!=0 and 'HARD cap' in text and 'NOT_CHECKED' in text and 'MET' in text,text[-2000:]
path='src/domains/restaurant/condition-states.ts';main=subprocess.check_output(['git','show','b2a3cbd3:'+path]);assert (root/path).read_bytes()==main
receipt={'mode':'OFFLINE_REAL_ADAPTER_FIXTURE_MODEL_AND_PRODUCTION_HARD_PROJECTION','commit':git('rev-parse','HEAD').strip(),'command':cmd,'exitCode':r.returncode,'seconds':time.monotonic()-t,'gitStatusBefore':'','gitStatusAfter':'','originalHardConsumerExactMain':True,'hardConsumerSha256':hashlib.sha256(main).hexdigest(),'independentOracle':'literal source says available only for parties of at least 4; requested party 2; no other price proof','expected':'NOT_CHECKED','actual':'MET','sourceOrModelRealCalls':0};(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
