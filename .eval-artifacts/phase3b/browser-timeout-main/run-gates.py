from pathlib import Path
import datetime,gzip,hashlib,json,os,re,signal,subprocess,sys,time
from zoneinfo import ZoneInfo

root=Path.cwd();item=Path(__file__).resolve().parent;out=Path(sys.argv[1]).resolve()
assert not out.exists() and not out.is_relative_to(root);out.mkdir(parents=True)
frozen=json.loads((item/'freeze.json').read_text())
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
def check():
    assert not git('status','--porcelain')
    for path,sha in frozen['files'].items():assert hashlib.sha256((root/path).read_bytes()).hexdigest()==sha,path
check();head=git('rev-parse','HEAD')
expected=json.loads((item/'expected-summaries.json').read_text())['expected']
receipt={'testedCommit':head,'mode':'OFFLINE_MOCK_AND_LOCAL_CHROMIUM','latestMain':frozen['latestMain'],
         'approvedDiagnostic':frozen['approvedDiagnostic'],'frozenInputs':len(frozen['files']),
         'startedAtCET':datetime.datetime.now(datetime.timezone.utc).astimezone(ZoneInfo('Europe/Vienna')).isoformat(),
         'newRealCalls':0,'runs':[]}
steps=[('typecheck',['npm','run','typecheck']),('arch-check',['npm','run','arch:check']),('npm-test',['npm','test']),('build',['npm','run','build']),('browser-fixture',['npm','run','test:browser:fixture'])]
for name,cmd in steps:
    check();assert git('rev-parse','HEAD')==head;started=time.monotonic();print('START',name,flush=True)
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
    row={'name':name,'command':cmd,'exitCode':code,'seconds':round(time.monotonic()-started,3),
         'gitStatusBefore':'','gitStatusAfter':git('status','--porcelain'),
         'rawLogSha256':hashlib.sha256(raw).hexdigest(),
         'summary':{k:int(v) for k,v in re.findall(r'^(?:#|ℹ) (tests|suites|pass|fail|cancelled|skipped|todo) (\d+)\s*$',text,re.M)}}
    if name=='browser-fixture':
        events=[json.loads(line[len('[browser fixtures] '):]) for line in text.splitlines() if line.startswith('[browser fixtures] {')]
        starts=[e['file'] for e in events if e['event']=='FILE_START'];ends=[e['file'] for e in events if e['event']=='FILE_END']
        files={str(p.relative_to(root)) for p in (root/'src/harness/browser').glob('*.test.ts')}
        row['lifecycle']={'files':len(files),'starts':len(starts),'ends':len(ends),
                          'allOnce':set(starts)==set(ends)==files and len(starts)==len(ends)==len(files),
                          'outerTimeouts':sum(e['event']=='OUTER_TIMEOUT' for e in events)}
        (out/'browser-lifecycle.json').write_text(json.dumps(events,indent=2)+'\n')
    check();row['status']='PASS' if code==0 else 'FAIL';receipt['runs'].append(row)
    (out/'gates.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print('END',name,code,row['seconds'],row['summary'],flush=True)
    assert code==0,row
    if name in expected:assert row['summary']==expected[name],row
    if name=='browser-fixture':assert row['lifecycle']['allOnce'] and row['lifecycle']['outerTimeouts']==0,row
receipt.update(status='PASS',frozenInputsVerifiedAfter=True,finishedAtCET=datetime.datetime.now(datetime.timezone.utc).astimezone(ZoneInfo('Europe/Vienna')).isoformat())
(out/'gates.json').write_text(json.dumps(receipt,indent=2)+'\n')
