from pathlib import Path
import os,json,subprocess,hashlib,sys
root=Path(__file__).resolve().parent;primary=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing');source=Path('/private/tmp/praxis-category-guidance-recorded');h=lambda b:hashlib.sha256(b).hexdigest()
def git(p,*a):return subprocess.check_output(['git','--no-optional-locks','-C',str(p),*a])
def tree(p):
 files={}
 for base,dirs,names in os.walk(p):
  dirs[:]=[d for d in dirs if d not in ['node_modules','.git']]
  for n in names:
   if n=='.git':continue
   f=Path(base)/n;files[str(f.relative_to(p))]=h(str(f.readlink()).encode()if f.is_symlink()else f.read_bytes())
 return {'sha256':h(json.dumps(files,sort_keys=True).encode()),'files':len(files)}
assert git(source,'rev-parse','HEAD').decode().strip()=='27bdb97a0c69d5c9c43a98ff4fe355deeee66067';assert git(source,'branch','--show-current').decode().strip()=='codex/fix-category-guidance-recorded-decisions';assert not git(source,'status','--porcelain').strip();assert not git(source,'diff','463f9aeb0016e46f699ce6f63d8131c41275cd6e','HEAD','--','src','web-skills').strip()
known=[Path('/private/tmp/praxis-party-category-retry-evidence/.eval-artifacts/phase3b/party-category-live-retry-20261113/active-budget.json'),Path('/private/tmp/praxis-terminal-observe-live-evidence/.eval-artifacts/phase3b/terminal-observe-live-20261113/active-budget.json'),source/'.eval-artifacts/phase3b/category-guidance-recorded-20261113/active-budget.json']
known+=list(Path('/Users/wangzhour/Desktop/Wang/Git').glob('active-budget*.json'))
evidence={}
for name,path,head in [('9856',Path('/private/tmp/praxis-party-category-retry-evidence'),'9856dc67b13813489e24fae853118d2559cdef16'),('9cb',Path('/private/tmp/praxis-terminal-observe-live-evidence'),'9cb426f75534bce6ab8424ce9be4dc2ff73f39b5'),('27b',source,'27bdb97a0c69d5c9c43a98ff4fe355deeee66067')]:
 assert git(path,'rev-parse','HEAD').decode().strip()==head;assert not git(path,'status','--porcelain').strip();evidence[name]={'HEAD':head,'tree':tree(path)}
d={'primaryHEAD':git(primary,'rev-parse','HEAD').decode().strip(),'primaryDiffSHA256':h(git(primary,'diff','--binary','HEAD')),'primaryStatusSHA256':h(git(primary,'status','--porcelain=v1','-z')),'ledgers':{str(p):h(p.read_bytes())for p in known},'sourceClean':True,'sourceCodeAndSkillsEqual463f':True,'protectedTrees':evidence}
if sys.argv[1]=='protected-after.json':assert d==json.loads((root/'protected-before.json').read_text()),'PROTECTION_MISMATCH'
(root/sys.argv[1]).write_text(json.dumps(d,indent=2)+'\n');print(json.dumps({'snapshot':sys.argv[1],'protectedLedgers':len(d['ledgers']),'trees':{k:v['tree']['files']for k,v in evidence.items()},'sourceClean':True}))
