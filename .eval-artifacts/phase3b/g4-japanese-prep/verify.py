from pathlib import Path
import hashlib,json,subprocess
ROOT=Path('.eval-artifacts/phase3b/g4-japanese-prep')
freeze=json.loads((ROOT/'freeze.json').read_text())
for row in freeze['files']:
 assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
subprocess.run(['git','diff','--quiet','00519783b3f6a3e48a53a4a0a8b03c9621c8bcf7','--',
 'src/integrations/tabelog','src/integrations/tablecheck','src/infrastructure/browser','src/domains','src/server','src/application','src/core','scripts','package.json','package-lock.json','web-skills','.eval-artifacts/phase3b/budget.json'],check=True)
for row in json.loads(Path('src/integrations/google/fixtures/japanese-place-names.json').read_text()):
 p=Path(row['provenance']['path']);raw=json.loads(p.read_text())
 assert hashlib.sha256(p.read_bytes()).hexdigest()==row['provenance']['sha256']
 assert row['id']==raw['id'] and row['displayName']==raw['displayName']
ledger=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text())
used=sum(e.get('evaluationPublicGET',e.get('publicGET',0)) for e in ledger['entries'])
assert used==244 and ledger['limits']['evaluationPublicGET']==257
print(json.dumps({'status':'PASS','frozenInputs':len(freeze['files']),'protectedPaths':'UNCHANGED_MAIN00519783','newCalls':0,'publicGET':used,'limit':257}))
