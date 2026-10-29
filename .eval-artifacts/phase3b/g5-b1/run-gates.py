from pathlib import Path
import datetime,hashlib,json,subprocess,sys,time
root=Path('.eval-artifacts/phase3b/g5-b1')
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
def cet():return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
assert not git('status','--porcelain')
receipt=root/'gates.json';assert not receipt.exists()
record={'sourceCommit':git('rev-parse','HEAD'),'mode':'OFFLINE_ONLY_NO_ENV_FILE','startedAtCET':cet(),'steps':[],'newRealCalls':0}
(root/'gates').mkdir(exist_ok=True)
steps=[('integrity',['python3','-B',str(root/'verify-inputs.py')]),('typecheck',['npm','run','typecheck']),('arch-check',['npm','run','arch:check']),('test',['npm','test']),('build',['npm','run','build']),('browser-fixture',['npm','run','test:browser:fixture']),('g2',['npm','run','test:dom-change']),('b1-web',['node','--import','tsx',str(root/'verify-web.mjs')]),('b1-web-evaluation',['python3','-B',str(root/'evaluate-web.py')]),('integrity-after',['python3','-B',str(root/'verify-inputs.py')])]
for name,command in steps:
    before=git('status','--porcelain');assert not before
    start,tick=cet(),time.monotonic();log=root/'gates'/(name+'.log')
    with log.open('xb') as stream:result=subprocess.run(command,stdout=stream,stderr=subprocess.STDOUT)
    after=git('status','--porcelain')
    step={'name':name,'command':command,'startedAtCET':start,'finishedAtCET':cet(),'seconds':round(time.monotonic()-tick,3),'exitCode':result.returncode,'gitStatusBefore':before,'gitStatusAfter':after,'log':str(log),'sha256':hashlib.sha256(log.read_bytes()).hexdigest()}
    record['steps'].append(step);receipt.write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(step),flush=True)
    if after:record['status']='DIRTY_TREE';receipt.write_text(json.dumps(record,indent=2)+'\n');sys.exit(1)
    # Keep diagnostics from independent gates if the existing A-owned URL fixture is red.
    if result.returncode and name not in ['browser-fixture']:record['status']='FAIL';receipt.write_text(json.dumps(record,indent=2)+'\n');sys.exit(1)
record.update(status='PASS' if all(s['exitCode']==0 for s in record['steps']) else 'FAIL',finishedAtCET=cet())
receipt.write_text(json.dumps(record,indent=2)+'\n');sys.exit(0 if record['status']=='PASS' else 1)
