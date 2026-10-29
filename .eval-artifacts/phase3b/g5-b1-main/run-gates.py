from pathlib import Path
import json,subprocess,hashlib,datetime,time,sys
r=Path('.eval-artifacts/phase3b/g5-b1-main');(r/'gates').mkdir(exist_ok=True)
def git(*a):return subprocess.check_output(['git',*a],text=True).strip()
def cet():return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
assert not git('status','--porcelain');assert not (r/'gates.json').exists()
x={'sourceCommit':git('rev-parse','HEAD'),'startedAtCET':cet(),'steps':[],'newCalls':0}
steps=[('integrity',['python3','-B',str(r/'verify.py')]),('typecheck',['npm','run','typecheck']),('arch',['npm','run','arch:check']),('test',['npm','test']),('build',['npm','run','build']),('browser-fixture',['npm','run','test:browser:fixture']),('g2',['npm','run','test:dom-change']),('integrity-after',['python3','-B',str(r/'verify.py')])]
for name,cmd in steps:
 before=git('status','--porcelain');assert not before
 p=r/'gates'/(name+'.log');t=time.monotonic();start=cet()
 with p.open('xb') as output:run=subprocess.run(cmd,stdout=output,stderr=subprocess.STDOUT)
 after=git('status','--porcelain');step={'name':name,'command':cmd,'startedAtCET':start,'finishedAtCET':cet(),'seconds':round(time.monotonic()-t,3),'exitCode':run.returncode,'gitStatusBefore':before,'gitStatusAfter':after,'log':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()};x['steps'].append(step);(r/'gates.json').write_text(json.dumps(x,indent=2)+'\n');print(json.dumps(step),flush=True)
 if run.returncode or after:sys.exit(1)
x.update(status='PASS',finishedAtCET=cet());(r/'gates.json').write_text(json.dumps(x,indent=2)+'\n')
