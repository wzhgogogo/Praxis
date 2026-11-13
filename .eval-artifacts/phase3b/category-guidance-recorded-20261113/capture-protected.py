from pathlib import Path
import json,subprocess,hashlib,sys,os
root=Path(__file__).resolve().parent;source=Path('/private/tmp/praxis-terminal-observe-fix');evidence=Path('/private/tmp/praxis-party-category-retry-evidence');primary=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing');h=lambda b:hashlib.sha256(b).hexdigest()
def git(p,*a):return subprocess.check_output(['git','--no-optional-locks','-C',str(p),*a])
def tree(p):
 files={}
 for base,dirs,names in os.walk(p):
  dirs[:]=[d for d in dirs if d not in ['node_modules','.git']]
  for n in names:
   f=Path(base)/n
   if n=='.git':continue
   files[str(f.relative_to(p))]=h(str(f.readlink()).encode()if f.is_symlink()else f.read_bytes())
 return {'sha256':h(json.dumps(files,sort_keys=True).encode()),'files':len(files)}
previous=json.loads((source/'.eval-artifacts/phase3b/terminal-observe-20261113/protected-after.json').read_text());ledgers={p:h(Path(p).read_bytes())for p in previous['ledgers']};assert ledgers==previous['ledgers'],'OLD_LEDGER_CHANGED'
assert git(source,'rev-parse','HEAD').decode().strip()=='5f8e01f18da6e48a2bf26c1fba78e260c2547bf0';assert not git(source,'status','--porcelain').strip();assert not git(source,'diff','67a949d702f17a4f6ed10e9b869882d707711cc7','HEAD','--','src','web-skills').strip()
d={'latestEvidenceTree':tree(Path('/private/tmp/praxis-terminal-observe-live-evidence')), 'primaryHEAD':git(primary,'rev-parse','HEAD').decode().strip(),'primaryDiffSHA':h(git(primary,'diff','--binary','HEAD')),'primaryStatusSHA':h(git(primary,'status','--porcelain=v1','-z')),'ledgers':ledgers,'evidenceHEAD':git(evidence,'rev-parse','HEAD').decode().strip(),'evidenceStatusSHA':h(git(evidence,'status','--porcelain=v1','-z')),'evidenceTree':tree(evidence),'sourceHEAD':git(source,'rev-parse','HEAD').decode().strip(),'sourceStatusSHA':h(git(source,'status','--porcelain=v1','-z')),'sourceTrees':{p:tree(source/p)for p in ['src','web-skills','docs','scripts']},'sourcePriorVerification':tree(source/'.eval-artifacts/phase3b/terminal-observe-20261113')}
assert d['primaryHEAD']==previous['primaryHEAD'];assert d['evidenceHEAD']==previous['evidenceHEAD'];assert d['evidenceTree']==previous['evidenceTree'];(root/sys.argv[1]).write_text(json.dumps(d,indent=2)+'\n')
if sys.argv[1]=='protected-after.json':assert d==json.loads((root/'protected-before.json').read_text()),'PROTECTION_MISMATCH'
print(json.dumps({'snapshot':sys.argv[1],'protectedLedgers':len(ledgers),'evidenceFiles':d['evidenceTree']['files'],'sourceClean':True}))
