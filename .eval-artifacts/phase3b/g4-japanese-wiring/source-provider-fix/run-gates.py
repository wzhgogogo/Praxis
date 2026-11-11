from pathlib import Path
import datetime,hashlib,json,os,subprocess,sys,time
r=Path('.eval-artifacts/phase3b/g4-japanese-wiring/source-provider-fix');(r/'gates').mkdir(exist_ok=True)
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
def cet():return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
assert not git('status','--porcelain');assert not (r/'gates.json').exists()
out={'sourceCommit':git('rev-parse','HEAD'),'startedAtCET':cet(),'steps':[],'realCalls':0}
steps=[('integrity',['python3','-B',str(r/'verify.py')],{}),('delta',['python3','-B',str(r/'compare-traces.py')],{}),('typecheck',['npm','run','typecheck'],{}),('arch',['npm','run','arch:check'],{}),('test',['npm','test'],{}),('build',['npm','run','build'],{}),('browser-fixture',['npm','run','test:browser:fixture'],{}),('strict-g2',['npm','run','test:dom-change'],{'PRAXIS_G2_REQUIRE_PASS':'1'}),('integrity-after',['python3','-B',str(r/'verify.py')],{})]
for name,cmd,env in steps:
 before=git('status','--porcelain');assert not before
 log=r/'gates'/(name+'.log');tick=time.monotonic();start=cet()
 with log.open('xb') as f:run=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT,env={**os.environ,**env})
 after=git('status','--porcelain')
 row={'name':name,'command':cmd,'environment':env,'exitCode':run.returncode,'seconds':round(time.monotonic()-tick,3),'startedAtCET':start,'finishedAtCET':cet(),'gitStatusBefore':before,'gitStatusAfter':after,'log':str(log),'sha256':hashlib.sha256(log.read_bytes()).hexdigest()}
 out['steps'].append(row);(r/'gates.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(row),flush=True)
 if run.returncode or after:sys.exit(1)
out.update(status='PASS',finishedAtCET=cet());(r/'gates.json').write_text(json.dumps(out,indent=2)+'\n')
