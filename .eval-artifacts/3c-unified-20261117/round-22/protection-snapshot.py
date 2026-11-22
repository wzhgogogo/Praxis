from pathlib import Path
import subprocess, hashlib, json, sys
h=lambda b:hashlib.sha256(b).hexdigest()
def git(path,*args):
 return subprocess.check_output(['git','--no-optional-locks','-C',str(path),*args])
root=Path.cwd()
batch=root/'.eval-artifacts/3c-unified-20261117'
main=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing')
closeout=Path('/private/tmp/praxis-3c-closeout')
def status(path):
 return {k:h(git(path,*args)) for k,args in [('head',['rev-parse','HEAD']),('status',['status','--porcelain','--untracked-files=all']),('tracked',['diff','HEAD','--binary']),('index',['diff','--cached','--binary'])]}
def closeout_status():
 if (closeout/'.git').exists():return status(closeout)
 entries={}
 for p in sorted(closeout.rglob('*')):
  relative=p.relative_to(closeout)
  if 'node_modules' in relative.parts:continue
  if p.is_symlink():entries[str(relative)]={'symlink':str(p.readlink())}
  elif p.is_file():entries[str(relative)]={'sha256':h(p.read_bytes())}
 registry=git(root,'worktree','list','--porcelain').decode().split('\n\n')
 registration=next((entry for entry in registry if entry.startswith('worktree '+str(closeout)+'\n')),None)
 return {'gitUnavailable':True,'gitFileExists':False,'registration':registration,'materializedFilesExcludingDependencies':entries}
data={'main':status(main),'closeout':closeout_status(),'mainEnv':h((main/'.env').read_bytes()),'priorEvidence':{str(p.relative_to(batch)):h(p.read_bytes()) for p in sorted(batch.rglob('*')) if p.is_file() and p.relative_to(batch).parts[0] not in ('round-22','run-gates.py')},'walkthrough':{str(p.relative_to(root)):h(p.read_bytes()) for p in sorted((root/'.eval-artifacts/restaurant-web-read').rglob('*')) if p.is_file()},'searchIntentFingerprintSource':h((root/'src/domains/restaurant/contracts.ts').read_bytes()),'missingBlockingFieldsSource':h((root/'src/domains/restaurant/intent-state.ts').read_bytes()),'factJudgmentSource':h((root/'src/integrations/restaurant-facts/model-fact-judgment.ts').read_bytes())}
target=batch/'round-22/protection-baseline.json'
if sys.argv[1]=='before':
 target.write_text(json.dumps(data,indent=2)+'\n')
else:
 before=json.loads(target.read_text()); assert data==before, [k for k in data if data[k]!=before[k]]
 print('PASS: main and closeout, main .env, fact judgment source and',len(data['priorEvidence']),'prior evidence files')
