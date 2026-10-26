"""Isolated contract challenges; never edit a production or counterpart file."""
from pathlib import Path
import argparse, hashlib, json, re, subprocess, datetime

p=argparse.ArgumentParser();p.add_argument('--spec',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
root=Path.cwd();out=a.output.resolve();assert root in out.parents and not out.exists();out.mkdir(parents=True)
sha=lambda data:hashlib.sha256(data).hexdigest()
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();assert not subprocess.check_output(['git','status','--porcelain'])
results=[]
for spec in json.loads(a.spec.read_text()):
 directory=out/spec['id'];directory.mkdir();overrides={};originals={}
 for item in spec.get('sourceMutations',[]):
  name=item['path'];data=(root/name).read_text();originals[name]=sha(data.encode())
  for before,after in item['replacements']:
   assert data.count(before)==1,(name,before);data=data.replace(before,after)
  target=directory/Path(name).name;overrides[(root/name).resolve()]=target
  target.write_text(data)
 test_path=root/spec['testPath'];test=test_path.read_text();originals[spec['testPath']]=sha(test.encode())
 for before,after in spec.get('testReplacements',[]):
  assert test.count(before)==1,before;test=test.replace(before,after)
 def imports(text,origin):
  def replace(match):
   path=(origin.parent/match[2]).resolve();source=path.with_suffix('.ts') if path.suffix=='.js' else path
   return match[1]+overrides.get(source,path).as_uri()+match[3]
  return re.sub(r'''((?:from\s+|import\s*\()?["'])(\.{1,2}/[^"']+)(["'])''',replace,text)
 for name,target in overrides.items():target.write_text(imports(target.read_text(),name))
 generated=directory/'challenge.test.ts';generated.write_text(imports(test,test_path))
 receipt={'id':spec['id'],'sourceCommit':head,'originalSha256':originals,'generatedSha256':{str(f.relative_to(directory)):sha(f.read_bytes()) for f in directory.iterdir() if f.is_file()},'testNamePattern':spec['pattern']}
 (directory/'before-execution.json').write_text(json.dumps(receipt,indent=2)+'\n')
 with (directory/'test.log').open('wb') as log:
  proc=subprocess.run(['node','--import',str(root/'scripts/test-filesystem-guard.mjs'),'--import','tsx','--test','--test-name-pattern='+spec['pattern'],str(generated)],stdout=log,stderr=subprocess.STDOUT,timeout=90)
 text=(directory/'test.log').read_text();valid=proc.returncode!=0 and 'AssertionError' in text and not any(marker in text for marker in ['ERR_MODULE_NOT_FOUND','SyntaxError:','ENOENT:'])
 receipt.update(exitCode=proc.returncode,validContractRed=valid,logSha256=sha(text.encode()));(directory/'result.json').write_text(json.dumps(receipt,indent=2)+'\n');results.append(receipt);print(spec['id'],proc.returncode,'VALID_RED' if valid else 'INVALID',flush=True)
 assert valid,spec['id']
assert not subprocess.check_output(['git','status','--porcelain'])
(out/'summary.json').write_text(json.dumps({'sourceCommit':head,'allValid':True,'results':results},indent=2)+'\n')
