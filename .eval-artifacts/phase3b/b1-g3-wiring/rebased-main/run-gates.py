from pathlib import Path
import datetime,hashlib,json,os,subprocess,sys,time
r=Path('.eval-artifacts/phase3b/b1-g3-wiring/rebased-main')
(r/'gates').mkdir(exist_ok=True)
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
def cet():return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
assert not git('status','--porcelain')
assert not (r/'gates.json').exists()
result={'sourceCommit':git('rev-parse','HEAD'),'startedAtCET':cet(),'steps':[],'newProviderCalls':0}
steps=[('integrity',['python3','-B',str(r/'verify.py')],{}),('typecheck',['npm','run','typecheck'],{}),('arch',['npm','run','arch:check'],{}),('test',['npm','test'],{}),('build',['npm','run','build'],{}),('browser-fixture',['npm','run','test:browser:fixture'],{}),('strict-g2',['npm','run','test:dom-change'],{'PRAXIS_G2_REQUIRE_PASS':'1'}),('web',['node','--import','tsx',str(r/'verify-web.mjs')],{}),('integrity-after',['python3','-B',str(r/'verify.py')],{})]
for name,command,environment in steps:
    before=git('status','--porcelain');assert not before
    log=r/'gates'/(name+'.log');start,tick=cet(),time.monotonic()
    with log.open('xb') as output:run=subprocess.run(command,stdout=output,stderr=subprocess.STDOUT,env={**os.environ,**environment})
    after=git('status','--porcelain')
    step={'name':name,'command':command,'environment':environment,'startedAtCET':start,'finishedAtCET':cet(),'seconds':round(time.monotonic()-tick,3),'exitCode':run.returncode,'gitStatusBefore':before,'gitStatusAfter':after,'log':str(log),'sha256':hashlib.sha256(log.read_bytes()).hexdigest()}
    result['steps'].append(step);(r/'gates.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(step),flush=True)
    if run.returncode or after:sys.exit(1)
result.update(status='PASS',finishedAtCET=cet());(r/'gates.json').write_text(json.dumps(result,indent=2)+'\n')
