from pathlib import Path
import datetime,gzip,hashlib,json,os,signal,subprocess,time,sys
stage=sys.argv[1] if len(sys.argv)>1 else 'runtime-preflight';assert stage in {'runtime-preflight','runtime-contract-check'}
r=Path(__file__).parent/stage;r.mkdir()
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
assert not git('status','--porcelain');source=git('rev-parse','HEAD')
env={k:v for k,v in os.environ.items() if k in {'PATH','HOME','TMPDIR','LANG','LC_CTYPE','LC_ALL','TZ'}}
env['PRAXIS_NAMED_AREA_CAPTURE']='1';env['npm_config_offline']='true'
start=time.monotonic();p=subprocess.Popen(['npm','test'],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=env,start_new_session=True)
timed=False
try:raw,_=p.communicate(timeout=600)
except subprocess.TimeoutExpired:
 timed=True;os.killpg(p.pid,signal.SIGTERM)
 try:raw,_=p.communicate(timeout=5)
 except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);raw,_=p.communicate(timeout=5)
(r/'test.log').write_bytes(raw);(r/'test.log.gz').write_bytes(gzip.compress(raw,mtime=0))
code=124 if timed else p.returncode
after=git('status','--porcelain');assert not after and git('rev-parse','HEAD')==source
result={'sourceCommit':source,'command':['npm','test'],'exitCode':code,'seconds':round(time.monotonic()-start,3),'gitStatusBefore':'','gitStatusAfter':after,'outerTimeout':timed,'sha256':hashlib.sha256(raw).hexdigest(),'realCalls':0,'envFileLoaded':False,'timeCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()}
(r/'execution.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));print('\n'.join(l for l in raw.decode().splitlines() if 'NAMED_AREA_RAW ' not in l)[-15000:])
