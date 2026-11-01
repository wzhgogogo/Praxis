from pathlib import Path
import base64,datetime,gzip,hashlib,json,os,re,subprocess,sys
R=Path('.eval-artifacts/phase3b/b1-card-terms-20261101');O=R/sys.argv[1];O.mkdir()
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
assert not git('status','--porcelain')
f=json.loads((R/(sys.argv[1]+'-freeze.json')).read_text())
for x in f['files']:assert hashlib.sha256(Path(x['path']).read_bytes()).hexdigest()==x['sha256']
env={k:v for k,v in os.environ.items() if k in {'PATH','HOME','TMPDIR','LANG','LC_CTYPE','LC_ALL','TZ'}}
env.update(PRAXIS_B1_TERMS_CAPTURE='1',PRAXIS_G6_COMPOSITION_CAPTURE='1')
command=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-concurrency=1','src/eval/restaurant/agent-loop/g6-booking-terms-composition.test.ts','src/application/restaurant-booking-terms-composition.test.ts']
start=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat();p=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=env)
(O/'raw.log.gz').write_bytes(gzip.compress(p.stdout,mtime=0));raw=p.stdout.decode()
for match in re.finditer(r'B1_TERMS_COMPOSITION_RAW ([A-Za-z0-9+/=]+)',raw):
 data=base64.b64decode(match[1]);value=json.loads(data);(O/(value['label']+'.json.gz')).write_bytes(gzip.compress(data,mtime=0))
result={'status':'PASS' if p.returncode==0 else 'FAILED','commit':git('rev-parse','HEAD'),'startedAtCET':start,'exitCode':p.returncode,'command':command,'gitStatusBefore':'','gitStatusAfter':git('status','--porcelain'),'realCalls':0,'envFileLoaded':False}
(O/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));print('\n'.join(line for line in raw.splitlines() if 'COMPOSITION_RAW' not in line)[-10000:]);sys.exit(p.returncode)
