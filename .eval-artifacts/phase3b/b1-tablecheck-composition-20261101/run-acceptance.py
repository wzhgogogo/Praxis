"""Run the byte-identical A whole-composition regression and retain raw evidence."""
from pathlib import Path
from datetime import datetime,timezone,timedelta
import base64,hashlib,json,os,re,subprocess,sys,time
R=Path('.eval-artifacts/phase3b/b1-tablecheck-composition-20261101');phase=sys.argv[1];assert phase in ['red','green']
load=lambda p:json.loads(Path(p).read_text());git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
assert not git('status','--porcelain')
for f in load(R/(phase+'-freeze.json'))['files']:assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
for f in load(R/'a-imports.json')['files']:assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256']
folder=R/phase;folder.mkdir(exist_ok=False)
env={k:v for k,v in os.environ.items() if k in {'PATH','HOME','TMPDIR','LANG','LC_CTYPE','LC_ALL','TZ'}}
env['PRAXIS_G6_COMPOSITION_CAPTURE']='1'
command=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','src/eval/restaurant/agent-loop/g6-booking-composition.test.ts']
start=datetime.now(timezone(timedelta(hours=1))).isoformat();tick=time.monotonic()
with (folder/'test.log').open('xb') as log:run=subprocess.run(command,stdout=log,stderr=subprocess.STDOUT,env=env,timeout=180)
raw=(folder/'test.log').read_bytes();text=raw.decode();after=git('status','--porcelain');assert not after
result={'phase':phase,'sourceCommit':git('rev-parse','HEAD'),'command':command,'startedAtCET':start,'seconds':round(time.monotonic()-tick,3),'exitCode':run.returncode,'gitStatusBefore':'','gitStatusAfter':after,'logSHA256':hashlib.sha256(raw).hexdigest(),'realExternalCalls':0,'envFileLoaded':False}
if phase=='red':
 match=re.search(r'G6_TABLECHECK_COMPOSITION_RAW ([A-Za-z0-9+/=]+)',text);assert match,'No actual composition failure artifact'
 data=base64.b64decode(match[1]);record=json.loads(data);(folder/'preflight.json').write_bytes(data)
 initial=record['initial'];restaurant=initial['restaurant'];cid=restaurant['presentedCandidateIds'][0]
 assert initial['case']['phase']=='PRESENT_RESULTS' and restaurant['availabilityChecks'][cid]['status']=='AVAILABLE'
 assert restaurant['bookingHandoffs']==[]
 assert record['failure']['message'].startswith('Initial ordinary source cache must produce B1')
 assert run.returncode==1 and 'Initial ordinary source cache must produce B1' in text
 result.update(status='EXPECTED_PRODUCT_RED',actualRecordSHA256=hashlib.sha256(data).hexdigest(),firstFailure=record['failure']['message'])
else:
 assert run.returncode==0,text[-3000:];result.update(status='PASS_UNCHANGED_A_WHOLE_COMPOSITION')
(folder/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
