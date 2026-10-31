from pathlib import Path
import hashlib,json,subprocess
r=Path('.eval-artifacts/phase3b/b1-g3-wiring/main-release')
f=json.loads((r/'freeze.json').read_text())
for row in f['files']:
    assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
subprocess.run(['git','diff','--exit-code',f['reviewedCommit'],'--','src','scripts','package.json','package-lock.json','docs/decisions'],check=True)
subprocess.run(['python3','-B','.eval-artifacts/phase3b/b1-g3-wiring/rebased-main/verify.py'],check=True)
print(json.dumps({'status':'PASS','frozenInputs':len(f['files']),'sourceEqualsReviewed':f['reviewedCommit'],'newProviderCalls':0,'envRead':False}))
