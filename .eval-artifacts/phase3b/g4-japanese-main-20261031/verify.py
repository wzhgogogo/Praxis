"""Release file/Git integrity check only; no external calls or replay."""
from pathlib import Path
import hashlib,json,subprocess
R=Path('.eval-artifacts/phase3b/g4-japanese-main-20261031')
def git(*args):return subprocess.check_output(['git',*args])
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
frozen=json.loads((R/'freeze.json').read_text())
for f in frozen['files']:assert sha(f['path'])==f['sha256'],f['path']
protection=json.loads((R/'preserved-artifacts.json').read_text())
for f in protection['files']:assert sha(f['path'])==f['sha256'],f['path']
source=('src','scripts','web-skills','package.json','package-lock.json','tsconfig.json','tsconfig.build.json')
changed=git('diff','--name-only',frozen['reviewedC'],'--',*source).decode().splitlines()
assert sorted(changed)==sorted(frozen['inheritedMainSourceFiles']),changed
for p in changed:assert Path(p).read_bytes()==git('show',frozen['main']+':'+p),p
b=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text())
old=json.loads(git('show',frozen['reviewedC']+':.eval-artifacts/phase3b/budget.json'))
entries={e['id']:e for e in b['entries']};assert len(entries)==len(b['entries'])==500
for e in old['entries']:assert entries[e['id']]==e,e['id']
assert b['cumulative']==old['cumulative']
assert b['cumulative']['evaluationPublicGET']==255 and b['limits']['evaluationPublicGET']==260
print(json.dumps({'status':'PASS','frozenFiles':len(frozen['files']),'preservedCArtifacts':len(protection['files']),'sourceDelta':'Only three exact main A diagnostic files','ledgerRows':len(entries),'newRealCalls':0}))
