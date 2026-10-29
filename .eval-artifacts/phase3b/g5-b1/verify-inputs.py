import hashlib,json,subprocess
from pathlib import Path
root=Path('.eval-artifacts/phase3b/g5-b1');frozen=json.loads((root/'freeze.json').read_text())
for item in frozen['files']:assert hashlib.sha256(Path(item['path']).read_bytes()).hexdigest()==item['sha256'],item['path']
for path,sha in frozen['protectedPaths'].items():
    if sha=='ABSENT_AT_BASE':assert not Path(path).exists()
    else:assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==sha
resources=json.loads((root/'resources.json').read_text())
assert hashlib.sha256(Path('.eval-artifacts/phase3b/budget.json').read_bytes()).hexdigest()==resources['sharedLedgerUnchangedSHA256']
assert all(value==0 for value in resources['newCalls'].values())
# Shared persistent/action versions must not change anywhere in this pre-approval slice.
protected=['src/domains/restaurant/task-definition.ts','src/domains/restaurant/semantic-proposal.ts','src/domains/restaurant/semantic-interpreter.ts','src/domains/restaurant/agent-action.ts','src/domains/restaurant/agent-decision.ts','src/domains/restaurant/agent-context.ts','src/integrations/restaurant-facts/page-question-core.ts']
for path in protected:
    old=subprocess.run(['git','show','b2a3cbd3:'+path],capture_output=True)
    if old.returncode==0:assert Path(path).read_bytes()==old.stdout,path
print(json.dumps({'status':'PASS','frozenFiles':len(frozen['files']),'protectedG3AndSharedVersions':'UNCHANGED','ledger':'UNCHANGED','newRealCalls':0}))
