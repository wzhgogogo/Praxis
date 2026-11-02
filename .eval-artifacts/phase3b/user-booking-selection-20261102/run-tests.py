from pathlib import Path
import base64,datetime,gzip,hashlib,json,os,re,subprocess,sys
r=Path(__file__).parent;phase=sys.argv[1];out=r/phase;out.mkdir()
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
assert not git('status','--porcelain')
freeze=json.loads((r/(phase+'-freeze.json')).read_text())
for f in freeze['files']:assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
env={k:v for k,v in os.environ.items() if k in {'PATH','HOME','TMPDIR','LANG','LC_CTYPE','LC_ALL','TZ'}}
env['PRAXIS_USER_SELECTION_CAPTURE']='1'
command=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-concurrency=1','src/application/restaurant-user-booking-selection.test.ts']
started=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
p=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=env)
(out/'raw.log.gz').write_bytes(gzip.compress(p.stdout,mtime=0));raw=p.stdout.decode()
for m in re.finditer(r'USER_SELECTION_RAW ([A-Za-z0-9+/=]+)',raw):
 b=base64.b64decode(m[1]);label=json.loads(b)['label'];(out/(label+'.json.gz')).write_bytes(gzip.compress(b,mtime=0))
assert not git('status','--porcelain')
result={'status':'PASS' if p.returncode==0 else 'FAILED','sourceCommit':git('rev-parse','HEAD'),'startedAtCET':started,'exitCode':p.returncode,'command':command,'rawSHA256':hashlib.sha256(p.stdout).hexdigest(),'gitStatusBefore':'','gitStatusAfter':'','realCalls':0,'envFileLoaded':False}
(r/(phase+'-result.json')).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result));print('\n'.join(x for x in raw.splitlines() if 'USER_SELECTION_RAW' not in x)[-18000:])
