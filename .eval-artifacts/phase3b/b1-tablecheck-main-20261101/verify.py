from pathlib import Path
import hashlib,json,subprocess
R=Path('.eval-artifacts/phase3b/b1-tablecheck-main-20261101')
git=lambda *a:subprocess.check_output(['git',*a])
f=json.loads((R/'freeze.json').read_text())
for row in f['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
old=json.loads((R/'preserved-artifacts.json').read_text())
for row in old['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
assert not git('diff','--name-only',f['reviewed'],'--','src','scripts','web-skills','package.json','package-lock.json','tsconfig.json','tsconfig.build.json').decode().strip()
for row in json.loads(Path('.eval-artifacts/phase3b/b1-tablecheck-composition-20261101/a-imports.json').read_text())['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256']
b=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text());prior=json.loads(git('show',f['reviewed']+':.eval-artifacts/phase3b/budget.json'))
assert b==prior and len(b['entries'])==507 and b['cumulative']['evaluationPublicGET']==255
print(json.dumps({'status':'PASS','frozenFiles':len(f['files']),'preservedArtifacts':len(old['files']),'productAndConfigIdenticalTo':f['reviewed'],'AImportsUnchanged':5,'budgetRowsUnchanged':507,'newRealCalls':0}))
