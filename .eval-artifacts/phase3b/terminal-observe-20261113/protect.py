from pathlib import Path
import subprocess,hashlib,json,sys,os
root=Path(__file__).resolve().parent;main=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing');evidence=Path('/private/tmp/praxis-party-category-retry-evidence');h=lambda b:hashlib.sha256(b).hexdigest()
def git(p,*a):return subprocess.check_output(['git','--no-optional-locks','-C',str(p),*a])
ledgers=[Path('/Users/wangzhour/Desktop/Wang/Git')/n for n in ['active-budget-seed-dev-20261111.json','active-budget-seed-dev-r2-20261111.json','active-budget-seed-dev-r3-20261111.json']]+[evidence/'.eval-artifacts/phase3b/party-category-live-retry-20261113/active-budget.json']
files={}
for base,dirs,names in os.walk(evidence):
 dirs[:]=[d for d in dirs if d not in ['node_modules','.git']]
 for n in names:
  p=Path(base)/n
  if n=='.git':continue
  files[str(p.relative_to(evidence))]=h(str(p.readlink()).encode() if p.is_symlink()else p.read_bytes())
d={'primaryHEAD':git(main,'rev-parse','HEAD').decode().strip(),'primaryDiffSHA':h(git(main,'diff','--binary','HEAD')),'primaryStatusSHA':h(git(main,'status','--porcelain=v1','-z')),'ledgers':{str(p):h(p.read_bytes())for p in ledgers},'evidenceHEAD':git(evidence,'rev-parse','HEAD').decode().strip(),'evidenceStatusSHA':h(git(evidence,'status','--porcelain=v1','-z')),'evidenceTree':{'sha256':h(json.dumps(files,sort_keys=True).encode()),'files':len(files)}}
assert d['primaryHEAD']=='13c93a325a80a97eb2c663613c4360776b5afe5d';assert d['evidenceHEAD']=='9856dc67b13813489e24fae853118d2559cdef16';(root/sys.argv[1]).write_text(json.dumps(d,indent=2)+'\n')
if sys.argv[1]=='protected-after.json':assert d==json.loads((root/'protected-before.json').read_text()),'PROTECTION_MISMATCH'
print(sys.argv[1],d['evidenceTree']['files'],'protected evidence files')
