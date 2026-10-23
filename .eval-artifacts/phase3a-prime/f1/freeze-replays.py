from pathlib import Path
import subprocess,json,hashlib
root=Path.cwd();out=Path('.eval-artifacts/phase3a-prime/f1')
old=json.loads(Path('.eval-artifacts/near-and-condition-display-merge-20261023/replay-freeze.json').read_text());files={};changes=[];removed=[]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
for path,before in old['files'].items():
 if not Path(path).exists():
  assert path=='src/infrastructure/browser/browser-completion-contract.test.ts',path;removed.append(path);continue
 current=sha(path)
 if current!=before:
  assert path.startswith('docs/') or path.endswith('.test.ts'),f'Frozen production/input drift: {path}'
  changes.append({'path':path,'beforeSha256':before,'currentSha256':current})
 files[path]=current
for p in subprocess.check_output(['git','ls-files','-z','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json']).decode().split('\0'):
 if p:files[p]=sha(p)
for p in [out/'regressions/run-cached-replays.mjs',out/'regressions/run-calibration.mjs']:files[str(p)]=sha(p)
result={'schema':'f1-offline-replay-freeze@1','codeCommit':subprocess.check_output(['git','rev-parse','HEAD']).decode().strip(),'priorFreezePath':'.eval-artifacts/near-and-condition-display-merge-20261023/replay-freeze.json','mode':'OFFLINE_NO_NEW_MODEL_OR_NETWORK','permittedChanges':'reviewed documentation + F1 tests/compile fixture only; prior Gold/variants/witnesses/cached responses remain byte-identical','changesFromPreviousFreeze':changes,'retiredCompileOnlyFile':removed,'files':files}
p=out/'replay-freeze.json';assert not p.exists();p.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'files':len(files),'changedDocumentationOrTests':len(changes),'sha256':sha(p)}))
