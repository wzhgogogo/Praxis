from pathlib import Path
import base64,datetime,hashlib,json,os,re,subprocess
R=Path('.eval-artifacts/phase3b/b1-card-terms-20261101');(R/'red').mkdir()
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
assert not git('status','--porcelain')
f=json.loads((R/'red-freeze.json').read_text())
for x in f['files']:assert hashlib.sha256(Path(x['path']).read_bytes()).hexdigest()==x['sha256']
env={k:v for k,v in os.environ.items() if k in {'PATH','HOME','TMPDIR','LANG','LC_CTYPE','LC_ALL','TZ'}}
env['PRAXIS_G6_COMPOSITION_CAPTURE']='1'
command=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','src/eval/restaurant/agent-loop/g6-booking-terms-composition.test.ts']
start=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
p=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=env)
(R/'red/raw.log').write_bytes(p.stdout)
raw=p.stdout.decode();match=re.search(r'G6_TERMS_COMPOSITION_RAW ([A-Za-z0-9+/=]+)',raw)
assert match,raw[-4000:]
data=base64.b64decode(match[1]);(R/'red/preflight.json').write_bytes(data)
expected='B1 must carry the already admitted same-outlet same-channel G1 cancellation answer and source quote'
assert p.returncode!=0 and expected in raw
assert not git('status','--porcelain')
result={'status':'EXPECTED_CONTRACT_RED','commit':git('rev-parse','HEAD'),'startedAtCET':start,'exitCode':p.returncode,'assertion':expected,'command':command,'gitStatusBefore':'','gitStatusAfter':'','realCalls':0,'envFileLoaded':False,'logs':[{'path':str(x),'sha256':hashlib.sha256(x.read_bytes()).hexdigest()} for x in [R/'red/raw.log',R/'red/preflight.json']]}
(R/'red/result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
