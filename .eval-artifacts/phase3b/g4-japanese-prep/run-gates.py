from pathlib import Path
import subprocess,json,time,datetime,hashlib,sys
ROOT=Path('.eval-artifacts/phase3b/g4-japanese-prep');(ROOT/'gates').mkdir(exist_ok=True)
def git(*a):return subprocess.check_output(['git',*a],text=True).strip()
def cet():return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
assert not git('status','--porcelain');assert not (ROOT/'gates.json').exists()
steps=[('integrity',['python3','-B',str(ROOT/'verify.py')]),('typecheck',['npm','run','typecheck']),('arch',['npm','run','arch:check']),('test',['npm','test']),('build',['npm','run','build']),
 ('simulation',['node','--import','tsx',str(ROOT/'run-simulation.mjs')]),('score',['python3','-B',str(ROOT/'score-simulation.py')]),
 ('browser-fixture',['npm','run','test:browser:fixture']),('g2',['npm','run','test:dom-change']),('integrity-after',['python3','-B',str(ROOT/'verify.py')])]
result={'sourceCommit':git('rev-parse','HEAD'),'startedAtCET':cet(),'steps':[],'newCalls':0}
for name,cmd in steps:
 before=git('status','--porcelain');assert not before
 path=ROOT/'gates'/(name+'.log');start=cet();tick=time.monotonic()
 with path.open('xb') as output:run=subprocess.run(cmd,stdout=output,stderr=subprocess.STDOUT)
 after=git('status','--porcelain')
 row={'name':name,'command':cmd,'startedAtCET':start,'finishedAtCET':cet(),'seconds':round(time.monotonic()-tick,3),'exitCode':run.returncode,'gitStatusBefore':before,'gitStatusAfter':after,'log':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
 result['steps'].append(row);(ROOT/'gates.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(row),flush=True)
 if run.returncode or after:sys.exit(1)
result.update(status='PASS',finishedAtCET=cet());(ROOT/'gates.json').write_text(json.dumps(result,indent=2)+'\n')
