import hashlib,json,re,subprocess
from pathlib import Path
r=Path('.eval-artifacts/phase3b/g5-b1-followup');x=json.loads((r/'freeze.json').read_text())
for f in x['files']:assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
def original(path):return subprocess.check_output(['git','show','50a08361:'+path],text=True)
for path in ['src/domains/restaurant/task-definition.ts','src/domains/restaurant/contracts.ts','src/domains/restaurant/semantic-proposal.ts','src/domains/restaurant/semantic-interpreter.ts','src/domains/restaurant/agent-decision.ts','src/domains/restaurant/agent-action.ts','src/domains/restaurant/agent-context.ts','src/integrations/tabelog/tabelog-browser-availability.ts','src/integrations/tabelog/tabelog-query-controls.ts','scripts/run-browser-fixtures.mjs','src/harness/browser-fixture-scheduling.test.ts','src/harness/browser/dom-change-agent.test.ts','package.json']:
 assert Path(path).read_text()==original(path),path
assert not Path('src/integrations/tabelog/tabelog-vacancy-response.ts').exists(),'G3 source hookup is deferred'
migration=Path('src/infrastructure/postgres/migrations.ts').read_text()
prior,n=re.subn(r'\n  \{\n    id: "0010-restaurant-booking-handoff-feedback",[\s\S]*?\n  \},\n\];','\n];',migration);assert n==1 and prior==original('src/infrastructure/postgres/migrations.ts'),'prior migrations changed'
budget=Path('.eval-artifacts/phase3b/budget.json');resources=json.loads((r/'resources.json').read_text());assert hashlib.sha256(budget.read_bytes()).hexdigest()==resources['ledgerSHA256']
b=json.loads(budget.read_text());old=json.loads(original('.eval-artifacts/phase3b/budget.json'));rows={e['id']:e for e in b['entries']}
assert all(rows[e['id']]==e for e in old['entries']);assert len(b['entries'])==len(old['entries'])+2 and b['cumulative']['evaluationPublicGET']==244
assert resources['newCalls']=={'realModel':0,'google':0,'live':0,'evaluationPublicGET':2}
assert json.loads((r/'robots-decision.json').read_text())['allowed'] is True
for kind in ['robots','help']:
 m=json.loads((r/(kind+'.meta.json')).read_text());assert m['status']==200
 assert hashlib.sha256((r/(kind+'.raw')).read_bytes()).hexdigest()==m['rawSHA256']
 assert hashlib.sha256((r/(kind+'.decoded.txt')).read_bytes()).hexdigest()==m['decodedSHA256']
 assert not any(k.lower()=='set-cookie' for k in m['headers'])
assert 'cancellationConflict' in Path('src/domains/restaurant/booking-handoff.ts').read_text()
assert 'unresolvedCancellationConflict' not in Path('src/domains/restaurant/booking-handoff.ts').read_text()
print(json.dumps({'status':'PASS','frozenFiles':len(x['files']),'G3AndSharedVersions':'UNCHANGED','G2Scheduling':'MAIN50a08361_RETAINED','priorMigrations':'BYTE_IDENTICAL','publicGET':2,'ledgerGET':244}))
