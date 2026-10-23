"""Run the unchanged default suite in the prepared clone with local toolchain."""
from pathlib import Path
import datetime,hashlib,json,os,re,subprocess,time
from zoneinfo import ZoneInfo
root=Path(__file__).resolve().parents[3];out=root/'.eval-artifacts/phase3a-prime/f1b'
clone=Path('/private/tmp/praxis-f1b-portable-clone');evidence=Path('/private/tmp/praxis-f1b-portable-final-evidence');evidence.mkdir(exist_ok=False)
manifest=json.loads((out/'portable-browser-runtime.json').read_text());installed=Path(manifest['installedDirectory'])
for p,h in manifest['files'].items():assert hashlib.sha256((installed/p).read_bytes()).hexdigest()==h,p
freeze=json.loads((out/'portable-clone-freeze.json').read_text())
for p,h in freeze['files'].items():assert hashlib.sha256((clone/p).read_bytes()).hexdigest()==h,p
profile=out/'clone-browser-install-failed/clone-isolation.sb'
probe=out/'clone-browser-install-failed/isolation-probe.log';rows=json.loads(probe.read_text());assert all(r['listError']=='EPERM' and r['readError']=='EPERM' for r in rows)
git=lambda *a:subprocess.check_output(['git','-C',str(clone),*a]).decode()
assert not git('status','--porcelain');commit=git('rev-parse','HEAD').strip()
started=time.monotonic();at=datetime.datetime.now(ZoneInfo('Europe/Vienna')).isoformat()
with (evidence/'clone-npm-test.log').open('wb') as log:
 result=subprocess.run(['sandbox-exec','-f',str(profile),'npm','test'],cwd=clone,env={**os.environ,**manifest['environment']},stdout=log,stderr=subprocess.STDOUT,timeout=600)
status=git('status','--porcelain');raw=(evidence/'clone-npm-test.log').read_bytes()
summary={k:int(v) for k,v in re.findall(r'^(?:#|ℹ) (tests|suites|pass|fail|cancelled|skipped|todo) (\d+)$',raw.decode(errors='replace'),re.M)}
row={'startedAt':at,'timezone':'Europe/Vienna','testedCommit':commit,'clone':str(clone),'command':['sandbox-exec','-f',str(profile),'npm','test'],'elapsedSeconds':round(time.monotonic()-started,6),'exitCode':result.returncode,'summary':summary,'gitStatusBefore':'','gitStatusAfter':status,'logSha256':hashlib.sha256(raw).hexdigest(),'runtimeManifestSha256':hashlib.sha256((out/'portable-browser-runtime.json').read_bytes()).hexdigest(),'isolation':'OS denies data reads and directory listings in /Users and all historical worktrees; existence metadata can remain visible; source directories preserved','isolationProbe':rows}
(evidence/'portable-clone.json').write_text(json.dumps(row,indent=2)+'\n')
print(json.dumps(row,indent=2))
assert result.returncode==0 and not status and summary['pass']==1024
for p,h in manifest['files'].items():assert hashlib.sha256((installed/p).read_bytes()).hexdigest()==h,p
for p,h in freeze['files'].items():assert hashlib.sha256((clone/p).read_bytes()).hexdigest()==h,p
