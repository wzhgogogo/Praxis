from pathlib import Path
import json,hashlib,subprocess,os,sys
root=Path(__file__).resolve().parent;c=json.loads((root/'config.json').read_text());old=root.parent/'party-category-live-20261113/protected-after.json';prior=json.loads(old.read_text());h=lambda b:hashlib.sha256(b).hexdigest()
def git(p,*args):return subprocess.check_output(['git','--no-optional-locks','-C',str(p),*args])
def state(p):
 p=Path(p)
 return {'exists':False,'previousSHA256':prior['ledgers'].get(str(p))}if not p.exists()else{'exists':True,'sha256':h(p.read_bytes())}
def tree(p):
 result={}
 for base,dirs,files in os.walk(p):
  dirs[:]=[d for d in dirs if d not in ['node_modules','.git']]
  for f in files:
   x=Path(base)/f
   if f=='.git':continue
   result[str(x.relative_to(p))]=h(str(x.readlink()).encode()if x.is_symlink()else x.read_bytes())
 return {'sha256':h(json.dumps(result,sort_keys=True).encode()),'files':len(result)}
primary='/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing';source=c['sourceRoot'];result={'ledgers':{k:state(k)for k in prior['ledgers']},'oldTemporaryDirectories':{p:Path(p).exists()for p in ['/private/tmp/praxis-party-category-fix','/private/tmp/praxis-party-category-live-evidence','/private/tmp/praxis-browser-strict-live-evidence','/private/tmp/praxis-r2-acceptance-evidence','/private/tmp/praxis-seed-post-fix-evidence-03']},'primaryHEAD':git(primary,'rev-parse','HEAD').decode().strip(),'primaryDiffSHA':h(git(primary,'diff','--binary','HEAD')),'primaryStatusSHA':h(git(primary,'status','--porcelain=v1','-z')),'sourceHEAD':git(source,'rev-parse','HEAD').decode().strip(),'sourceStatusSHA':h(git(source,'status','--porcelain=v1','-z')),'sourceTree':tree(Path(source)),'frozenBranchHEAD':git(source,'rev-parse','refs/heads/codex/fix-seed-party-confirmed-and-category-drilldown').decode().strip(),'previousEvidenceBranchHEAD':git(source,'rev-parse','refs/heads/codex/chore-party-category-live-evidence').decode().strip()}
for path,v in result['ledgers'].items():
 if v['exists']:assert v['sha256']==prior['ledgers'][path],'EXISTING_OLD_LEDGER_CHANGED'
(root/sys.argv[1]).write_text(json.dumps(result,indent=2)+'\n')
if sys.argv[1]=='protected-after.json':assert result==json.loads((root/'protected-before.json').read_text()),'PROTECTION_MISMATCH'
print(json.dumps({'snapshot':sys.argv[1],'existingLedgers':sum(v['exists']for v in result['ledgers'].values()),'missingOldLedgers':sum(not v['exists']for v in result['ledgers'].values()),'sourceClean':not git(source,'status','--porcelain').strip()}))
