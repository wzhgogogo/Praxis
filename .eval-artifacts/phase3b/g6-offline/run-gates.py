from pathlib import Path
import datetime, gzip, hashlib, json, os, re, signal, subprocess, sys, time
from zoneinfo import ZoneInfo

root=Path.cwd(); item=Path(__file__).resolve().parent; out=Path(sys.argv[1]).resolve()
assert not out.exists() and not out.is_relative_to(root)
out.mkdir(parents=True)
frozen=json.loads((item/'inputs-sha256.json').read_text())
git=lambda *args:subprocess.check_output(['git',*args],text=True).strip()
def check():
    assert not git('status','--porcelain'), 'Gate requires a clean tree'
    for row in frozen['inputs']:
        assert hashlib.sha256((root/row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
check();head=git('rev-parse','HEAD')
receipt={'testedCommit':head,'mode':'OFFLINE_PACKAGING_ONLY_PRODUCT_P4_STILL_RED',
         'frozenInputs':len(frozen['inputs']),'newRealCalls':0,'runs':[],
         'startedAtCET':datetime.datetime.now(datetime.timezone.utc).astimezone(ZoneInfo('Europe/Vienna')).isoformat()}
steps=[('typecheck',['npm','run','typecheck']),('arch-check',['npm','run','arch:check']),
       ('npm-test',['npm','test']),('build',['npm','run','build']),('browser-fixture',['npm','run','test:browser:fixture'])]
for name,cmd in steps:
    check();assert git('rev-parse','HEAD')==head
    started=time.monotonic();print('START',name,flush=True)
    with (out/(name+'.log')).open('wb') as stream:
        proc=subprocess.Popen(cmd,stdout=stream,stderr=subprocess.STDOUT,start_new_session=True)
        try:code=proc.wait(timeout=1320)
        except subprocess.TimeoutExpired:
            os.killpg(proc.pid,signal.SIGTERM)
            try:proc.wait(timeout=10)
            except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait()
            code=124
    raw=(out/(name+'.log')).read_bytes();text=raw.decode(errors='replace')
    (out/(name+'.log.gz')).write_bytes(gzip.compress(raw,mtime=0))
    summary={k:int(v) for k,v in re.findall(r'^(?:#|ℹ) (tests|suites|pass|fail|cancelled|skipped|todo) (\d+)\s*$',text,re.M)}
    row={'name':name,'command':cmd,'exitCode':code,'seconds':round(time.monotonic()-started,3),
         'status':'PASS' if code==0 else 'FAIL','gitStatusBefore':'','gitStatusAfter':git('status','--porcelain'),
         'rawLogSha256':hashlib.sha256(raw).hexdigest(),'summary':summary}
    receipt['runs'].append(row)
    check();(out/'gates.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print('END',name,code,row['seconds'],summary,flush=True)
    assert code==0,row
    if name in ('npm-test','browser-fixture'):
        expected=1274 if name=='npm-test' else 186  # main1272 + two independent checksum controls
        assert summary['tests']==summary['pass']==expected and all(summary.get(k)==0 for k in ('fail','cancelled','skipped','todo')),row
receipt.update(status='PASS',frozenInputsVerifiedAfter=True,finishedAtCET=datetime.datetime.now(datetime.timezone.utc).astimezone(ZoneInfo('Europe/Vienna')).isoformat())
(out/'gates.json').write_text(json.dumps(receipt,indent=2)+'\n')
