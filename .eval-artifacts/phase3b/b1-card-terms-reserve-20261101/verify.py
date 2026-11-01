from pathlib import Path
import hashlib,json,subprocess
R=Path(__file__).parent
for row in json.loads((R/'freeze.json').read_text())['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
for row in json.loads((R/'protected.json').read_text())['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
for row in json.loads((R/'preserved-artifacts.json').read_text())['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
for row in json.loads((R/'merge-preservation.json').read_text())['mainSourceAndConfigUnchanged']:
 p=Path(row['path'])
 if row.get('deletedAsMain'):assert not p.exists()
 else:assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256']
b=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text());by={x['id']:x for x in b['entries']}
assert len(by)==len(b['entries'])==510
for ref in ['5cda89b7','1d65b8e8']:
 old=json.loads(subprocess.check_output(['git','show',ref+':.eval-artifacts/phase3b/budget.json']));assert all(by[x['id']]==x for x in old['entries'])
 assert b['limits']==old['limits'] and b['cumulative']==old['cumulative']
assert not subprocess.check_output(['git','diff','--name-only','1d65b8e8','--','src/eval/assembly-bypass-allowlist.json','scripts/arch-check.ts'])
print(json.dumps({'status':'PASS','freeze':len(json.loads((R/'freeze.json').read_text())['files']),'protectedFiles':len(json.loads((R/'protected.json').read_text())['files']),'preservedArtifacts':len(json.loads((R/'preserved-artifacts.json').read_text())['files']),'budgetRows':510,'realCalls':0}))
