from pathlib import Path
import sys,json,subprocess,hashlib,time
root=Path.cwd();item=Path(__file__).resolve().parent;phase=sys.argv[1];out=Path(sys.argv[2]).resolve()
assert phase in ('red','green') and not out.is_relative_to(root);out.mkdir(exist_ok=False)
freeze=json.loads((item/('input-freeze-'+phase+'.json')).read_text());git=lambda *a:subprocess.check_output(['git',*a],text=True)
for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
assert not git('status','--porcelain');receipt={'commit':git('rev-parse','HEAD').strip(),'phase':phase,'runs':[]}
commands=[('targets',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','src/domains/restaurant/condition-states.test.ts','src/integrations/tabelog/tabelog-browser-availability.test.ts']),('legacy',['node','--import','tsx',str(item/'compare-legacy.ts'),str(out/'legacy-state-changes.json')]),('hard-bytes',['node','--import','tsx','.eval-artifacts/phase3b/g1-revision/check-fact-compatibility.ts','check','.eval-artifacts/phase3b/g3-longrun/hard-before.json'])]
for name,cmd in commands:
 t=time.monotonic();r=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=120);(out/(name+'.log')).write_bytes(r.stdout)
 assert not git('status','--porcelain');receipt['runs'].append({'name':name,'command':cmd,'exitCode':r.returncode,'seconds':time.monotonic()-t,'gitStatusBefore':'','gitStatusAfter':''});(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(name,r.returncode,flush=True)
