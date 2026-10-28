from pathlib import Path
import datetime,hashlib,json,subprocess,sys,time
root=Path('.eval-artifacts/phase3b/c-batch3')
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
def cet():return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(timespec='milliseconds')
def verify():
    for f in json.loads((root/'gates-freeze.json').read_text())['files']:assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
assert not git('status','--porcelain');verify();directory=root/'gates';directory.mkdir(exist_ok=True)
record={'sourceCommit':git('rev-parse','HEAD'),'mode':'OFFLINE_ONLY_NO_ENV_FILE','startedAtCET':cet(),'newRealCalls':0,'steps':[]}
steps=[('integrity',['python3','-B',str(root/'verify-final.py')]),
 ('typecheck',['npm','run','typecheck']),('arch-check',['npm','run','arch:check']),('test',['npm','test']),('build',['npm','run','build']),
 ('browser-fixture',['npm','run','test:browser:fixture']),('g2-fixed',['npm','run','test:dom-change']),
 ('semantic-fixture',['npm','run','eval:restaurant:semantic:fixture']),('search-fixture',['npm','run','eval:restaurant:search:fixture'])]
for name,command in steps:
    before=git('status','--porcelain');assert not before;verify();start,tick=cet(),time.monotonic();log=directory/(name+'.log')
    with log.open('wb') as stream:result=subprocess.run(command,stdout=stream,stderr=subprocess.STDOUT)
    after=git('status','--porcelain');step={'name':name,'command':command,'startedAtCET':start,'finishedAtCET':cet(),
      'elapsedSeconds':round(time.monotonic()-tick,3),'exitCode':result.returncode,'gitStatusBefore':before,'gitStatusAfter':after,'log':str(log),'logSha256':hashlib.sha256(log.read_bytes()).hexdigest()}
    record['steps'].append(step);(root/'gates.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(step),flush=True)
    if result.returncode or after:sys.exit(1)
    verify()
record.update(status='PASS',finishedAtCET=cet());(root/'gates.json').write_text(json.dumps(record,indent=2)+'\n')
