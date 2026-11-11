from pathlib import Path
import datetime,hashlib,json,os,signal,subprocess,sys,time
r=Path(__file__).parent
stage=sys.argv[1];assert stage in {'red','green'}
out=r/stage;out.mkdir()
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
assert not git('status','--porcelain')
source=git('rev-parse','HEAD');start=time.monotonic()
env={k:v for k,v in os.environ.items() if k in {'PATH','HOME','TMPDIR','LANG','LC_CTYPE','LC_ALL','TZ'}}
env['PRAXIS_B1_VISIBILITY_CAPTURE']='1'
cmd=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','src/application/restaurant-booking-handoff-visibility.test.ts']
p=subprocess.Popen(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=env,start_new_session=True)
timed=False
try:raw,_=p.communicate(timeout=90)
except subprocess.TimeoutExpired:
 timed=True;os.killpg(p.pid,signal.SIGTERM)
 try:raw,_=p.communicate(timeout=5)
 except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);raw,_=p.communicate(timeout=5)
(out/'test.log').write_bytes(raw)
after=git('status','--porcelain');assert not after
code=124 if timed else p.returncode
result={'sourceCommit':source,'command':cmd,'stage':stage,'exitCode':code,'seconds':round(time.monotonic()-start,3),'gitStatusBefore':'','gitStatusAfter':after,'logSha256':hashlib.sha256(raw).hexdigest(),'realCalls':0,'envFileLoaded':False,'timeCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()}
(out/'execution.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result));print('\n'.join(line for line in raw.decode().splitlines() if 'B1_VISIBILITY_RAW ' not in line))
