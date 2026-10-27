"""Run the frozen current controls against the pre-fix Git source in a temporary archive."""
from pathlib import Path
import argparse,datetime,hashlib,json,os,shutil,subprocess
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
root=Path.cwd();base=a.source.resolve();out=a.output.resolve()
assert not base.is_relative_to(root) and not out.is_relative_to(root) and not base.exists() and not out.exists()
assert not subprocess.check_output(['git','status','--porcelain'],text=True)
base.mkdir();out.mkdir();before='18b2e805'
archive=out/'source.tar'
with archive.open('wb') as f:subprocess.run(['git','archive',before,'src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json','web-skills'],stdout=f,check=True)
subprocess.run(['tar','-xf',str(archive),'-C',str(base)],check=True)
(base/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
outer=Path('.eval-artifacts/phase3b/g1-revision/verify-saved-page.ts');(base/outer).parent.mkdir(parents=True)
shutil.copyfile(root/outer,base/outer)
sha=lambda b:hashlib.sha256(b).hexdigest()
rows=[]
try:
 for control in ['coverage','not-stated','review']:
  command=['node','--import','tsx',str(outer),str(out/control),control,'--baseline-format']
  result=subprocess.run(command,cwd=base,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=45)
  (out/(control+'.log')).write_bytes(result.stdout)
  assert result.returncode==1 and b'AssertionError' in result.stdout and b'TransformError' not in result.stdout,(control,result.returncode,result.stdout[-500:])
  rows.append({'control':control,'command':command,'exitCode':result.returncode,'logSha256':sha(result.stdout),'result':str(Path(control)/'result.json')})
 metadata={'mode':'OFFLINE_PRIOR_GIT_SOURCE_REAL_CHROMIUM_FIXTURE_MODEL','sourceCommit':subprocess.check_output(['git','rev-parse',before],text=True).strip(),'outerScriptSha256':sha((root/outer).read_bytes()),'orchestratorSha256':sha(Path(__file__).read_bytes()),'sourceArchiveSha256':sha(archive.read_bytes()),'coreSha256':sha((base/'src/integrations/restaurant-facts/model-page-question.ts').read_bytes()),'recordedAtCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1),'CET')).isoformat(),'runs':rows,'realCalls':0,'baselineTransport':'Only fixture output uses schema1; page, question, source and assertion are the frozen current control. Product code has no compatibility path.'}
 (out/'red.json').write_text(json.dumps(metadata,indent=2)+'\n')
 print('Prior implementation: three target AssertionError reds; current frozen script unchanged')
finally:
 shutil.rmtree(base)
 archive.unlink()
