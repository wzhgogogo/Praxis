from pathlib import Path
import json,hashlib,subprocess,sys
root=Path(__file__).resolve().parent
source=Path('/private/tmp/praxis-party-category-fix');primary='/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing'
def sha(b):return hashlib.sha256(b).hexdigest()
def git(p,*a):return subprocess.check_output(['git','-C',str(p),*a])
def tree(path):
 h=hashlib.sha256();count=0;total=0
 for p in sorted(path.rglob('*')):
  rel=p.relative_to(path)
  if any(x in ('node_modules','.git') for x in rel.parts):continue
  if p.is_symlink():data=p.readlink().as_posix().encode()
  elif p.is_file():data=p.read_bytes()
  else:continue
  h.update(str(rel).encode()+b'\0'+hashlib.sha256(data).digest());count+=1;total+=len(data)
 return {'sha256':h.hexdigest(),'files':count,'bytes':total}
prior=Path('/private/tmp/praxis-party-category-fix/.eval-artifacts/phase3b/party-category-20261113/protected-before.json')
ledgers=json.loads(prior.read_text())['ledgers'];ledgerNow={k:sha(Path(k).read_bytes()) for k in ledgers}
assert ledgerNow==ledgers,'PRIOR_LEDGER_CHANGED_BEFORE_DIAGNOSTIC'
historical=[Path('/private/tmp/praxis-browser-strict-live-evidence/.eval-artifacts/phase3b/d02v-strict-acceptance-20261112'),Path('/private/tmp/praxis-r2-acceptance-evidence/.eval-artifacts/phase3b/r2-acceptance-20261112'),Path('/private/tmp/praxis-seed-post-fix-evidence-03/.eval-artifacts/phase3b/seed-d02v-r4-20261112')]
result={'ledgers':ledgerNow,'primaryHEAD':git(primary,'rev-parse','HEAD').decode().strip(),'primaryDiffSHA':sha(git(primary,'diff','--binary','HEAD')),'primaryStatusSHA':sha(git(primary,'status','--porcelain=v1','-z')),'sourceHEAD':git(source,'rev-parse','HEAD').decode().strip(),'sourceStatusSHA':sha(git(source,'status','--porcelain=v1','-z')),'sourceTree':tree(source),'historicalTrees':{str(p):tree(p) for p in historical}}
(root/sys.argv[1]).write_text(json.dumps(result,indent=2)+'\n')
if sys.argv[1]=='protected-after.json':assert result==json.loads((root/'protected-before.json').read_text()),'PROTECTED_CONTENT_CHANGED'
print(json.dumps({'protectionSnapshot':sys.argv[1],'ledgers':len(ledgers),'sourceClean':not git(source,'status','--porcelain').strip(),'equalBefore':sys.argv[1]=='protected-after.json'}))
