from pathlib import Path
import subprocess,hashlib,json,sys
root=Path.cwd();out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=False)
git=lambda *a:subprocess.check_output(['git',*a],text=True)
assert not git('status','--porcelain')
p=root/'src/application/run-bounded-model-gateway.ts';before=p.read_bytes();source=before.decode()
needle='return this.withScope(taskId, previous, work);';assert source.count(needle)==1
result={'mode':'OFFLINE_COUNTERFACTUAL','commit':git('rev-parse','HEAD').strip(),'mutation':'resume incorrectly starts a fresh read budget','sourceSha256':hashlib.sha256(before).hexdigest()}
try:
 p.write_text(source.replace(needle,'return this.run(taskId, work);',1))
 command=['node','--import','tsx','--test','--test-name-pattern=displayed-page follow-up resumes','src/application/run-bounded-model-gateway.test.ts']
 r=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=30)
 (out/'budget-reset-red.log').write_bytes(r.stdout);result.update({'exitCode':r.returncode,'validRed':r.returncode!=0 and b'AssertionError' in r.stdout and b'2 !== 1' in r.stdout,'command':command})
finally:p.write_bytes(before)
result['sourceRestoredExactly']=p.read_bytes()==before;result['gitStatusAfter']=git('status','--porcelain');(out/'control.json').write_text(json.dumps(result,indent=2)+'\n')
assert result['validRed'] and result['sourceRestoredExactly'] and not result['gitStatusAfter']
print(json.dumps(result))
