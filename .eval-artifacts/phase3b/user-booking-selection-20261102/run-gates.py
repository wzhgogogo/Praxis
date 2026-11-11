from pathlib import Path
import datetime,gzip,hashlib,json,os,subprocess,sys,time
r=Path(__file__).parent;logs=r/'gates';logs.mkdir()
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
source=git('rev-parse','HEAD');assert not git('status','--porcelain')
env={k:v for k,v in os.environ.items() if k in {'PATH','HOME','TMPDIR','LANG','LC_CTYPE','LC_ALL','TZ'}}
env['npm_config_offline']='true'
steps=[('integrity',['python3','-B',str(r/'verify.py')],{}),('typecheck',['npm','run','typecheck'],{}),('arch',['npm','run','arch:check'],{}),
       ('test',['npm','test'],{'PRAXIS_USER_SELECTION_CAPTURE':'1'}),('independent',['python3','-B',str(r/'evaluate.py')],{}),
       ('build',['npm','run','build'],{}),('browser-fixture',['npm','run','test:browser:fixture'],{}),
       ('strict-g2',['npm','run','test:dom-change'],{'PRAXIS_G2_REQUIRE_PASS':'1'}),('integrity-after',['python3','-B',str(r/'verify.py')],{})]
results={'sourceCommit':source,'startedAtCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),'steps':[],'realCalls':0,'envFileLoaded':False}
for name,cmd,extra in steps:
    before=git('status','--porcelain');assert not before;assert git('rev-parse','HEAD')==source
    start=time.monotonic();p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=env|extra,timeout=600)
    path=logs/(name+'.log');path.write_bytes(p.stdout)
    if name=='test':(logs/'test.log.gz').write_bytes(gzip.compress(p.stdout,mtime=0))
    after=git('status','--porcelain')
    entry={'name':name,'command':cmd,'environment':extra,'exitCode':p.returncode,'seconds':round(time.monotonic()-start,3),
           'gitStatusBefore':before,'gitStatusAfter':after,'log':str(path),'sha256':hashlib.sha256(p.stdout).hexdigest()}
    results['steps'].append(entry);(r/'gates.json').write_text(json.dumps(results,indent=2)+'\n')
    print(json.dumps(entry),flush=True)
    assert not after;assert git('rev-parse','HEAD')==source
    if p.returncode:
        print(p.stdout.decode()[-8000:],flush=True);sys.exit(p.returncode)
results['status']='PASS';results['finishedAtCET']=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
(r/'gates.json').write_text(json.dumps(results,indent=2)+'\n');print('ALL GATES PASS',flush=True)
