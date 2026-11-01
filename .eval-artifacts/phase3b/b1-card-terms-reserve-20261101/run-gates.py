from pathlib import Path
import datetime,gzip,hashlib,json,os,subprocess,sys,time
R=Path(__file__).parent;O=R/'gates';O.mkdir()
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
assert not git('status','--porcelain');assert not (R/'gates.json').exists()
cet=lambda:datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
env={k:v for k,v in os.environ.items() if k in {'PATH','HOME','TMPDIR','LANG','LC_CTYPE','LC_ALL','TZ'}}
env.update(npm_config_offline='true',npm_config_update_notifier='false',npm_config_audit='false',npm_config_fund='false')
steps=[('integrity',['python3','-B',str(R/'verify.py')],{}),('typecheck',['npm','run','typecheck'],{}),('arch',['npm','run','arch:check'],{}),('test',['npm','test'],{'PRAXIS_B1_RESERVE_CAPTURE':'1','PRAXIS_B1_TERMS_CAPTURE':'1'}),('evaluation',['python3','-B',str(R/'evaluate.py')],{}),('build',['npm','run','build'],{}),('browser-fixture',['npm','run','test:browser:fixture'],{}),('strict-g2',['npm','run','test:dom-change'],{'PRAXIS_G2_REQUIRE_PASS':'1'}),('integrity-after',['python3','-B',str(R/'verify.py')],{})]
out={'sourceCommit':git('rev-parse','HEAD'),'startedAtCET':cet(),'steps':[],'realCalls':0,'envFileLoaded':False}
for name,command,extra in steps:
 before=git('status','--porcelain');assert not before
 log=O/(name+'.log');start,tick=cet(),time.monotonic()
 with log.open('xb') as output:run=subprocess.run(command,stdout=output,stderr=subprocess.STDOUT,env={**env,**extra})
 raw=log.read_bytes();stored=log
 if name=='test':stored=log.with_suffix('.log.gz');stored.write_bytes(gzip.compress(raw,mtime=0))
 after=git('status','--porcelain');row={'name':name,'command':command,'environment':extra,'exitCode':run.returncode,'seconds':round(time.monotonic()-tick,3),'startedAtCET':start,'finishedAtCET':cet(),'gitStatusBefore':before,'gitStatusAfter':after,'log':str(stored),'sha256':hashlib.sha256(stored.read_bytes()).hexdigest(),'rawSHA256':hashlib.sha256(raw).hexdigest()}
 out['steps'].append(row);(R/'gates.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(row),flush=True)
 if run.returncode or after:
  out.update(status='STOPPED',failedGate=name,finishedAtCET=cet());(R/'gates.json').write_text(json.dumps(out,indent=2)+'\n');sys.exit(1)
out.update(status='PASS',finishedAtCET=cet());(R/'gates.json').write_text(json.dumps(out,indent=2)+'\n')
