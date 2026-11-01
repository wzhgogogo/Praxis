from pathlib import Path
import base64,datetime,gzip,hashlib,json,os,re,subprocess,sys
R=Path(__file__).parent;phase=sys.argv[1];O=R/phase;O.mkdir()
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
assert not git('status','--porcelain')
freeze=json.loads((R/(phase+'-freeze.json')).read_text())
for x in freeze['files']:assert hashlib.sha256(Path(x['path']).read_bytes()).hexdigest()==x['sha256'],x['path']
env={k:v for k,v in os.environ.items() if k in {'PATH','HOME','TMPDIR','LANG','LC_CTYPE','LC_ALL','TZ'}};env['PRAXIS_B1_RESERVE_CAPTURE']='1'
command=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-concurrency=1','src/application/restaurant-booking-terms-reserve.test.ts']
start=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat();p=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=env)
(O/'raw.log.gz').write_bytes(gzip.compress(p.stdout,mtime=0));raw=p.stdout.decode()
for m in re.finditer(r'B1_RESERVE_RAW ([A-Za-z0-9+/=]+)',raw):
 data=base64.b64decode(m[1]);v=json.loads(data);(O/(v['label']+'.json.gz')).write_bytes(gzip.compress(data,mtime=0))
waits=[json.loads(m[1]) for m in re.finditer(r'B1_ASSISTANT_WAIT (\{[^\n]+\})',raw)];(O/'assistant-wait.json').write_text(json.dumps(waits,indent=2)+'\n')
if phase=='red':
 expected=['At 20000ms no source acquisition may begin','No card model starts after crossing into the reserve','Observed translation navigation cannot start in the reserve','Source read must abort at deadline minus the 20 second reserve']
 assert p.returncode!=0 and all(x in raw for x in expected),raw[-5000:]
 status='EXPECTED_FOUR_CONTRACT_REDS'
else:status='PASS' if p.returncode==0 else 'FAILED'
after=git('status','--porcelain');assert not after
(R/(phase+'-result.json')).write_text(json.dumps({'status':status,'commit':git('rev-parse','HEAD'),'startedAtCET':start,'exitCode':p.returncode,'command':command,'gitStatusBefore':'','gitStatusAfter':after,'realCalls':0,'envFileLoaded':False,'rawSHA256':hashlib.sha256(p.stdout).hexdigest()},indent=2)+'\n')
print(json.dumps({'status':status,'exitCode':p.returncode}));print('\n'.join(x for x in raw.splitlines() if 'B1_RESERVE_RAW' not in x)[-9500:])
sys.exit(0 if phase=='red' else p.returncode)
