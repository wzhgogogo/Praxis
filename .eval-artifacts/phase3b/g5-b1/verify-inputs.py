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

# User-authorized A-owned changes: invert exactly the three approved lines, then
# compare complete files to main. This also protects website-provided links and Gold.
changes={
 'src/harness/browser/browser-read-tablecheck.test.ts':('const reserve = "https://www.tablecheck.com/en/shops/restaurant1/reserve?start_date=2026-09-16&num_people=2&start_time=19%3A00";','const reserve = "https://www.tablecheck.com/en/shops/restaurant1/reserve?start_date=2026-09-16&pax=2";'),
 'src/eval/restaurant/agent-loop/current-development-fixed-sources.ts':('url.searchParams.get("num_people") !== String(inventory.partySize)','url.searchParams.get("pax") !== String(inventory.partySize)'),
 'src/eval/restaurant/agent-loop/current-development-fixed-sources.test.ts':('record.request.includes("num_people=4")','record.request.includes("pax=4")'),
}
for path,(new,old) in changes.items():
    current=Path(path).read_text();assert current.count(new)==1
    assert current.replace(new,old,1)==subprocess.check_output(['git','show','b2a3cbd3:'+path],text=True),path
print(json.dumps({'authorizedAChanges':3,'sourcePageLinksGoldAndScoring':'BYTE_IDENTICAL_EXCEPT_APPROVED_REQUEST_LINES'}))
