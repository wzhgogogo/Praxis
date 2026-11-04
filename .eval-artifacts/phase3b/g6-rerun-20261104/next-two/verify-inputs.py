from pathlib import Path
import json,hashlib
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
f=json.loads((HERE/'source-inputs.json').read_text())
for row in f['files']:
 p=ROOT/row['path']
 assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'],row['path']
print('Frozen source/input SHA verification PASS:',len(f['files']))
