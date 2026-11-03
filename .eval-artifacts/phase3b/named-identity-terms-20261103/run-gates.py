from pathlib import Path
import datetime,gzip,hashlib,json,os,signal,subprocess,sys,time
r=Path(__file__).parent;batch=sys.argv[1] if len(sys.argv)>1 else 'gates';logs=r/batch;logs.mkdir()
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
source=git('rev-parse','HEAD');assert not git('status','--porcelain')
env={k:v for k,v in os.environ.items() if k in {'PATH','HOME','TMPDIR','LANG','LC_CTYPE','LC_ALL','TZ'}}
env['npm_config_offline']='true'
steps=[('integrity',['python3','-B',str(r/'verify.py')],{}),('typecheck',['npm','run','typecheck'],{}),
    ('arch',['npm','run','arch:check'],{}),('test',['npm','test'],{}),('build',['npm','run','build'],{}),
    ('browser-fixture',['npm','run','test:browser:fixture'],{}),
    ('strict-g2',['npm','run','test:dom-change'],{'PRAXIS_G2_REQUIRE_PASS':'1'}),
    ('composition',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test',
        'src/application/restaurant-named-identity-prefix.test.ts','src/application/restaurant-saved-booking-terms.test.ts',
        'src/application/restaurant-booking-terms-composition.test.ts','src/application/restaurant-booking-terms-reserve.test.ts'],
        {'PRAXIS_NAMED_PREFIX_CAPTURE':'1','PRAXIS_SAVED_TERMS_CAPTURE':'1','PRAXIS_B1_TERMS_CAPTURE':'1','PRAXIS_B1_RESERVE_CAPTURE':'1'}),
    ('independent',['python3','-B',str(r/'evaluate.py'),str(logs/'composition.log')],{}),
    ('integrity-after',['python3','-B',str(r/'verify.py')],{})]
results={'sourceCommit':source,'startedAtCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),
    'steps':[],'realCalls':0,'envFileLoaded':False,'outerTimeoutSeconds':600,'automaticRetries':0}
for name,cmd,extra in steps:
    before=git('status','--porcelain');assert not before;assert git('rev-parse','HEAD')==source
    start=time.monotonic();timed_out=False
    p=subprocess.Popen(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=env|extra,start_new_session=True)
    try:output,_=p.communicate(timeout=600)
    except subprocess.TimeoutExpired:
        timed_out=True;os.killpg(p.pid,signal.SIGTERM)
        try:output,_=p.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            os.killpg(p.pid,signal.SIGKILL);output,_=p.communicate(timeout=5)
    code=124 if timed_out else p.returncode
    path=logs/(name+'.log');path.write_bytes(output)
    if name in ['test','composition']:(logs/(name+'.log.gz')).write_bytes(gzip.compress(output,mtime=0))
    after=git('status','--porcelain')
    entry={'name':name,'command':cmd,'environment':extra,'exitCode':code,'seconds':round(time.monotonic()-start,3),
        'gitStatusBefore':before,'gitStatusAfter':after,'log':str(path),'sha256':hashlib.sha256(output).hexdigest(),'outerTimeout':timed_out}
    results['steps'].append(entry);(r/(batch+'.json')).write_text(json.dumps(results,indent=2)+'\n');print(json.dumps(entry),flush=True)
    assert not after and git('rev-parse','HEAD')==source
    if code:
        results['status']='ORCHESTRATION_INTERRUPTED' if timed_out else 'FAILED'
        (r/(batch+'.json')).write_text(json.dumps(results,indent=2)+'\n')
        print('\n'.join(line for line in output.decode().splitlines() if '_RAW ' not in line)[-8000:],flush=True);sys.exit(code)
results['status']='PASS';results['finishedAtCET']=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
(r/(batch+'.json')).write_text(json.dumps(results,indent=2)+'\n');print('ALL GATES PASS',flush=True)
