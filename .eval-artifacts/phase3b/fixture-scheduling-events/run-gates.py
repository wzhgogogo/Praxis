from pathlib import Path
import datetime, gzip, hashlib, json, os, re, signal, subprocess, sys, time
from zoneinfo import ZoneInfo

root=Path.cwd(); item=Path(__file__).resolve().parent; out=Path(sys.argv[1]).resolve()
assert not out.exists() and not out.is_relative_to(root)
out.mkdir(parents=True)
frozen=json.loads((item/'gate-freeze.json').read_text())
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
def check():
    assert not git('status','--porcelain'), 'clean tree required'
    for path,sha in frozen['files'].items():assert hashlib.sha256((root/path).read_bytes()).hexdigest()==sha,path
check();head=git('rev-parse','HEAD')
receipt={'testedCommit':head,'baseB':frozen['baseB'],'mode':'OFFLINE_FULL_B_PLUS_A_TEST_SYNC',
         'frozenInputs':len(frozen['files']),'realCalls':0,'runs':[],
         'startedAtCET':datetime.datetime.now(datetime.timezone.utc).astimezone(ZoneInfo('Europe/Vienna')).isoformat()}
steps=[('typecheck',['npm','run','typecheck']),('arch-check',['npm','run','arch:check']),('npm-test',['npm','test']),('build',['npm','run','build']),
       ('browser-fixture',['npm','run','test:browser:fixture']),('strict-g2',['npm','run','test:dom-change'])]
for name,cmd in steps:
    check();assert git('rev-parse','HEAD')==head;started=time.monotonic();print('START',name,flush=True)
    env=dict(os.environ)
    if name=='strict-g2':env['PRAXIS_G2_REQUIRE_PASS']='1'
    with (out/(name+'.log')).open('wb') as stream:
        proc=subprocess.Popen(cmd,stdout=stream,stderr=subprocess.STDOUT,env=env,start_new_session=True)
        try:code=proc.wait(timeout=1320)
        except subprocess.TimeoutExpired:
            os.killpg(proc.pid,signal.SIGTERM)
            try:proc.wait(timeout=10)
            except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait()
            code=124
    raw=(out/(name+'.log')).read_bytes();text=raw.decode(errors='replace')
    (out/(name+'.log.gz')).write_bytes(gzip.compress(raw,mtime=0))
    summary={k:int(v) for k,v in re.findall(r'^(?:#|ℹ) (tests|suites|pass|fail|cancelled|skipped|todo) (\d+)\s*$',text,re.M)}
    row={'name':name,'command':cmd,'environmentOverride':{'PRAXIS_G2_REQUIRE_PASS':'1'} if name=='strict-g2' else {},
         'exitCode':code,'status':'PASS' if code==0 else 'FAIL','seconds':round(time.monotonic()-started,3),
         'gitStatusBefore':'','gitStatusAfter':git('status','--porcelain'),'rawLogSha256':hashlib.sha256(raw).hexdigest(),'summary':summary}
    check();receipt['runs'].append(row);(out/'gates.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print('END',name,code,row['seconds'],summary,flush=True);assert code==0,row
    if name in ('npm-test','browser-fixture','strict-g2'):
        expected={'npm-test':1288,'browser-fixture':187,'strict-g2':5}[name]
        assert summary['tests']==summary['pass']==expected and all(summary.get(k)==0 for k in ('fail','cancelled','skipped','todo')),row
    if name=='strict-g2':
        pages=[json.loads(x[2:]) for x in text.splitlines() if x.startswith('# {') and '"classification"' in x]
        assert len(pages)==12 and all(p['classification']=='PASS' for p in pages),pages
        (out/'strict-pages.json').write_text(json.dumps(pages,indent=2)+'\n')
receipt.update(status='PASS',finishedAtCET=datetime.datetime.now(datetime.timezone.utc).astimezone(ZoneInfo('Europe/Vienna')).isoformat(),frozenInputsVerifiedAfter=True)
(out/'gates.json').write_text(json.dumps(receipt,indent=2)+'\n')
