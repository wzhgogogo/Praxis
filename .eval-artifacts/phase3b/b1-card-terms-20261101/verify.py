from pathlib import Path
import hashlib,json,subprocess
R=Path(__file__).parent;f=json.loads((R/'freeze.json').read_text())
for row in f['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
for row in json.loads((R/'a-imports.json').read_text())['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256']
for row in json.loads((R/'protected.json').read_text())['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
a=set(subprocess.check_output(['git','diff','--name-only','74dd2faf','--','src/eval','src/harness','src/integrations/tabelog'],text=True).splitlines())
assert a==set(row['path'] for row in json.loads((R/'a-imports.json').read_text())['files']),a
b=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text());proof=json.loads((R/'budget-preservation.json').read_text());assert len(b['entries'])==proof['mergedRows'] and b['cumulative']==proof['cumulativeUnchanged']
for ref in ['74dd2faf','31ba2a84']:
 prior=json.loads(subprocess.check_output(['git','show',ref+':.eval-artifacts/phase3b/budget.json']));by={x['id']:x for x in b['entries']};assert all(by[x['id']]==x for x in prior['entries'])
print(json.dumps({'status':'PASS','frozenFiles':len(f['files']),'protectedFiles':len(json.loads((R/'protected.json').read_text())['files']),'AOriginalFilesUnchanged':3,'budgetRows':len(b['entries']),'realCalls':0}))
