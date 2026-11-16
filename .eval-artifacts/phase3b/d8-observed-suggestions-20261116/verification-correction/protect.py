import json,hashlib,pathlib,subprocess,sys
here=pathlib.Path(__file__).resolve().parent
ev=pathlib.Path('/private/tmp/praxis-category-guidance-live-evidence')
src=pathlib.Path('/private/tmp/praxis-premerge-scope-main-20261115')
primary=pathlib.Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing')
sha=lambda b:hashlib.sha256(b).hexdigest()
def git(p,*a):return subprocess.check_output(['git','--no-optional-locks','-C',str(p),*a])
ledgers=[p for name in ['active-budget.json','model-budget.json']for p in (ev/'.eval-artifacts/phase3b').rglob(name)if here not in p.parents and p != ev/'.eval-artifacts/phase3b/d8-observed-suggestions-20261116/verification/model-budget.json']
ledgers+=list(primary.parent.glob('active-budget*.json'))
router=pathlib.Path('/Users/wangzhour/Library/Application Support/v2rayN/binConfigs/config.json')
data={'primaryHEAD':git(primary,'rev-parse','HEAD').decode().strip(),'primaryDiffSHA256':sha(git(primary,'diff','--binary','HEAD')),'primaryStatusSHA256':sha(git(primary,'status','--porcelain=v1','-z')),'sourceHEAD':git(src,'rev-parse','HEAD').decode().strip(),'sourceStatusSHA256':sha(git(src,'status','--porcelain')),'routerSHA256':sha(router.read_bytes()),'ledgers':{str(p):sha(p.read_bytes())for p in ledgers}}
with (here/sys.argv[1]).open('x') as f:json.dump(data,f,indent=2);f.write('\n')
