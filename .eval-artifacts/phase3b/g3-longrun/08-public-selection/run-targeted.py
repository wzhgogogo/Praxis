from pathlib import Path
import sys,json,subprocess,hashlib,time,datetime
phase=sys.argv[1];out=Path(sys.argv[2]).resolve();out.mkdir(parents=True,exist_ok=False);root=Path.cwd();assert not out.is_relative_to(root)
item=Path(__file__).resolve().parent;freeze=json.loads((item/f'input-freeze-{phase}.json').read_text())
git=lambda *x:subprocess.check_output(['git',*x],text=True)
def verify():
 for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
verify();assert not git('status','--porcelain')
rows=[];result={'phase':phase,'commit':git('rev-parse','HEAD').strip(),'timeCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),'runs':rows,'gitStatusBefore':''}
for name,paths in [('native',['src/infrastructure/browser/control-selected-state.test.ts','src/integrations/tabelog/tabelog-public-selection.test.ts']),('chromium',['src/harness/browser/browser-read-public-selection.test.ts'])]:
 cmd=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test',*paths];started=time.monotonic();r=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=120)
 (out/(name+'.log')).write_bytes(r.stdout);rows.append({'name':name,'command':cmd,'exitCode':r.returncode,'seconds':time.monotonic()-started,'gitStatusAfter':git('status','--porcelain')});(out/'receipt.json').write_text(json.dumps(result,indent=2)+'\n')
 assert not rows[-1]['gitStatusAfter'];verify()
 if phase=='red':assert r.returncode!=0 and 'AssertionError' in r.stdout.decode(),r.stdout.decode()[-1500:]
 else:assert r.returncode==0,r.stdout.decode()[-1500:]
 print(name,r.returncode,flush=True)
result.update({'gitStatusAfter':'','freezeVerifiedAfter':True,'realCalls':0});(out/'receipt.json').write_text(json.dumps(result,indent=2)+'\n')
