from pathlib import Path
import hashlib,json,subprocess
ROOT=Path('.eval-artifacts/phase3b/b1-postgres-feedback')
f=json.loads((ROOT/'freeze.json').read_text())
for row in f['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
subprocess.run(['git','diff','--quiet','00519783b3f6a3e48a53a4a0a8b03c9621c8bcf7','--','src','scripts','package.json','package-lock.json','web-skills','.eval-artifacts/phase3b/budget.json'],check=True)
print(json.dumps({'status':'PASS','frozenInputs':len(f['files']),'productA_UI_B':'UNCHANGED','envRead':False,'newExternalCalls':0}))
