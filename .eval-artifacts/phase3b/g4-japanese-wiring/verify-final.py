from pathlib import Path
import json,hashlib,subprocess
r=Path('.eval-artifacts/phase3b/g4-japanese-wiring')
f=json.loads((r/'final-freeze.json').read_text())
for row in f['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
subprocess.run(['python3','-B',str(r/'verify.py')],check=True)
print(json.dumps({'status':'PASS','finalFrozenInputs':len(f['files']),'newCalls':0}))
