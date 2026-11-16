"""Read only Git metadata and the designated budget files. Never read private test manifests."""
from pathlib import Path
import hashlib, json, subprocess, sys
here=Path(__file__).resolve().parent
previous=here.parent/'category-guidance-live-20261114'
primary=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing')
candidate=Path('/private/tmp/praxis-premerge-scope-main-20261115')
def git(tree,*args):
    return subprocess.check_output(['git','--no-optional-locks','-C',str(tree),*args])
def digest(value): return hashlib.sha256(value).hexdigest()
protected=set(json.loads((previous/'protected-before.json').read_bytes())['ledgers'])|{str(previous/'active-budget.json')}
protected.update(str(p) for p in primary.parent.glob('active-budget*.json'))
protected.update(str(p) for p in here.parent.rglob('active-budget.json') if here not in p.parents)
protected.update(str(here.parent/'seed-release-qualification-20261115'/kind/'active-budget.json')for kind in ['d02v','d8'])
result={'primaryHEAD':git(primary,'rev-parse','HEAD').decode().strip(),'primaryDiffSHA256':digest(git(primary,'diff','--binary','HEAD')),'primaryStatusSHA256':digest(git(primary,'status','--porcelain=v1','-z')),'candidateHEAD':git(candidate,'rev-parse','HEAD').decode().strip(),'candidateClean':not git(candidate,'status','--porcelain'),'ledgers':{p:(digest(Path(p).read_bytes()) if Path(p).is_file() else None) for p in sorted(protected)}}
with (here/sys.argv[1]).open('x') as f: json.dump(result,f,indent=2);f.write('\n')
