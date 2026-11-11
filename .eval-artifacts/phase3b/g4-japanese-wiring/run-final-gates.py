from pathlib import Path
import datetime,hashlib,json,os,subprocess,sys,time
r=Path('.eval-artifacts/phase3b/g4-japanese-wiring');(r/'final-logs').mkdir(exist_ok=True)
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
def cet():return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
assert not git('status','--porcelain');assert not (r/'final-gates.json').exists()
result={'sourceCommit':git('rev-parse','HEAD'),'startedAtCET':cet(),'steps':[],'realRequests':0}
steps=[('integrity',['python3','-B',str(r/'verify-final.py')],{}),('typecheck',['npm','run','typecheck'],{}),('arch',['npm','run','arch:check'],{}),('test',['npm','test'],{}),('build',['npm','run','build'],{}),('browser-fixture',['npm','run','test:browser:fixture'],{}),('strict-g2',['npm','run','test:dom-change'],{'PRAXIS_G2_REQUIRE_PASS':'1'}),('independent-product',['python3','-B',str(r/'verify-product.py'),'--write'],{}),('request-frontier',['python3','-B',str(r/'materialize-missing.py'),'--write'],{}),('integrity-after',['python3','-B',str(r/'verify-final.py')],{})]
for name,command,environment in steps:
 before=git('status','--porcelain');assert not before
 log=r/'final-logs'/(name+'.log');tick=time.monotonic()
 with log.open('xb') as output:run=subprocess.run(command,stdout=output,stderr=subprocess.STDOUT,env={**os.environ,**environment})
 after=git('status','--porcelain')
 step={'name':name,'command':command,'environment':environment,'exitCode':run.returncode,'seconds':round(time.monotonic()-tick,3),'gitStatusBefore':before,'gitStatusAfter':after,'log':str(log),'sha256':hashlib.sha256(log.read_bytes()).hexdigest()}
 result['steps'].append(step);(r/'final-gates.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(step),flush=True)
 if after:sys.exit(1)
 if run.returncode:
  # This is an explicitly RED result, never a green exception. Continue only
  # independent checks after the already identified, unapproved-scope B1 gap.
  text=log.read_text()
  if name=='test' and 'ordinary startup assembly must supply the source reader' in text and 'japanese-name' in text:
   result['knownUnapprovedGap']='B1_CHECK_SOURCE_PROVIDER_AFTER_FALLBACK';continue
  result.update(status='FAIL',finishedAtCET=cet());(r/'final-gates.json').write_text(json.dumps(result,indent=2)+'\n');sys.exit(1)
result.update(status='FAIL_KNOWN_GAP_PENDING_USER_APPROVAL' if any(s['exitCode'] for s in result['steps']) else 'PASS',finishedAtCET=cet());(r/'final-gates.json').write_text(json.dumps(result,indent=2)+'\n')
sys.exit(1 if any(s['exitCode'] for s in result['steps']) else 0)
