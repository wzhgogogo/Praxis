from pathlib import Path
import argparse,datetime,gzip,hashlib,json,os,platform,re,signal,subprocess,time
from zoneinfo import ZoneInfo

parser=argparse.ArgumentParser()
parser.add_argument('output')
parser.add_argument('--browser-repeats',type=int,default=1)
parser.add_argument('--two-cpu',action='store_true')
args=parser.parse_args()
assert 1<=args.browser_repeats<=5
root=Path.cwd();item=Path(__file__).resolve().parent;out=Path(args.output).resolve()
assert not out.exists() and not out.is_relative_to(root);out.mkdir(parents=True)
frozen=json.loads((item/'inputs-sha256.json').read_text())['files']
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
def check():
    assert not git('status','--porcelain')
    for path,sha in frozen.items():assert hashlib.sha256((root/path).read_bytes()).hexdigest()==sha,path
check();head=git('rev-parse','HEAD')
environment={'platform':platform.platform(),'cpus':os.cpu_count(),'node':subprocess.check_output(['node','--version'],text=True).strip()}
if args.two_cpu:
    assert platform.system()=='Linux' and os.cpu_count()==2 and os.sched_getaffinity(0)=={0,1}
    environment['affinity']=sorted(os.sched_getaffinity(0))
    environment['cpuCgroup']=Path('/proc/self/cgroup').read_text()
    relative=next(line.split('::',1)[1] for line in environment['cpuCgroup'].splitlines() if line.startswith('0::'))
    cgroup_root=Path('/sys/fs/cgroup');group=cgroup_root/relative.lstrip('/')
    quotas={}
    while group==cgroup_root or cgroup_root in group.parents:
        quota=group/'cpu.max'
        if quota.exists():
            quotas[str(quota)]=quota.read_text().strip()
            assert quotas[str(quota)].startswith('max '),quotas
        if group==cgroup_root:break
        group=group.parent
    environment['cpuMaxAncestors']=quotas # A root without cpu.max has no additional quota.
    for family,destination in (('-4','198.51.100.1'),('-6','2001:db8::1')):
        result=subprocess.run(['ip',family,'route','get',destination],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
        assert result.returncode!=0,(family,result.stdout)
        environment[family+'ExternalRouteProbe']=result.stdout.strip()
    environment['ipv4Rules']=subprocess.check_output(['ip','-4','rule','show'],text=True)
    environment['ipv6Rules']=subprocess.check_output(['ip','-6','rule','show'],text=True)
receipt={'testedCommit':head,'mode':'OFFLINE_LOCAL_CHROMIUM_AND_FIXTURE_MODEL','environment':environment,
         'startedAtCET':datetime.datetime.now(datetime.timezone.utc).astimezone(ZoneInfo('Europe/Vienna')).isoformat(),
         'frozenPaths':len(frozen),'newRealCalls':0,'runs':[]}
steps=[('typecheck',['npm','run','typecheck']),('arch-check',['npm','run','arch:check']),('npm-test',['npm','test']),('build',['npm','run','build'])]
steps.extend((f'browser-{i+1}',['npm','run','test:browser:fixture']) for i in range(args.browser_repeats))
expected_files={str(p.relative_to(root)) for p in (root/'src/harness/browser').glob('*.test.ts')}
for name,command in steps:
    check();assert git('rev-parse','HEAD')==head
    start=time.monotonic();print('START',name,flush=True)
    with (out/(name+'.log')).open('wb') as log:
        process=subprocess.Popen(command,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
        try:code=process.wait(timeout=1320)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid,signal.SIGTERM)
            try:process.wait(timeout=10)
            except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);process.wait()
            code=124
    raw=(out/(name+'.log')).read_bytes();text=raw.decode(errors='replace')
    (out/(name+'.log.gz')).write_bytes(gzip.compress(raw,mtime=0))
    row={'name':name,'command':command,'exitCode':code,'elapsedSeconds':round(time.monotonic()-start,3),
         'gitStatusBefore':'','gitStatusAfter':git('status','--porcelain'),'rawLogSha256':hashlib.sha256(raw).hexdigest(),
         'summary':{k:int(v) for k,v in re.findall(r'^(?:#|ℹ) (tests|suites|pass|fail|cancelled|skipped|todo) (\d+)\s*$',text,re.M)}}
    if name.startswith('browser-'):
        events=[json.loads(line[len('[browser fixtures] '):]) for line in text.splitlines() if line.startswith('[browser fixtures] {')]
        starts=[e['file'] for e in events if e['event']=='FILE_START'];ends=[e['file'] for e in events if e['event']=='FILE_END']
        row['lifecycle']={'filesStarted':len(starts),'filesEnded':len(ends),'expectedFiles':len(expected_files),
                          'allFileStartsEndsOnce':set(starts)==set(ends)==expected_files and len(starts)==len(ends)==len(expected_files),
                          'outerTimeout':any(e['event']=='OUTER_TIMEOUT' for e in events),
                          'unfinished':[e for e in events if e['event']=='UNFINISHED'],
                          'slowestFiles':sorted([e for e in events if e['event']=='FILE_END'],key=lambda e:e['elapsedMs'],reverse=True)[:8]}
        (out/(name+'-lifecycle.json')).write_text(json.dumps(events,indent=2)+'\n')
    check()
    row['status']='PASS' if code==0 else 'FAIL'
    receipt['runs'].append(row);(out/'verification.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print('END',name,code,row['elapsedSeconds'],row['summary'],flush=True)
    assert code==0,row
    if name=='npm-test':assert row['summary']=={'tests':1243,'suites':5,'pass':1243,'fail':0,'cancelled':0,'skipped':0,'todo':0},row
    if name.startswith('browser-'):
        assert row['summary']=={'tests':186,'suites':0,'pass':186,'fail':0,'cancelled':0,'skipped':0,'todo':0},row
        assert row['lifecycle']['allFileStartsEndsOnce'] and not row['lifecycle']['outerTimeout'],row
receipt.update(status='PASS',frozenInputsUnchanged=True,finishedAtCET=datetime.datetime.now(datetime.timezone.utc).astimezone(ZoneInfo('Europe/Vienna')).isoformat())
(out/'verification.json').write_text(json.dumps(receipt,indent=2)+'\n')
