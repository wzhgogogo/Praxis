from pathlib import Path
import hashlib,json,subprocess
r=Path('.eval-artifacts/phase3b/g4-japanese-wiring')
f=json.loads((r/'freeze.json').read_text())
for row in f['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
base=f['mainBase']
subprocess.run(['git','diff','--exit-code',base,'--','src/integrations/tabelog/tabelog-query-controls.ts','src/integrations/tabelog/tabelog-vacancy-response.ts','src/integrations/tabelog/tabelog-entity-resolver.ts','src/integrations/tabelog/tabelog-page-parser.ts','src/integrations/tablecheck','src/integrations/restaurant-availability/outlet-identity.ts','src/infrastructure/browser','src/domains','src/core','src/harness','src/web','web-skills','docs/decisions','scripts','package.json','package-lock.json'],check=True)
subprocess.run(['git','diff','--exit-code','86e1dd9d','--','src/eval/restaurant/search-fixture/named-retrieval-simulation.ts','src/eval/restaurant/search-fixture/named-retrieval-simulation.test.ts','.eval-artifacts/phase3b/g4-japanese-prep'],check=True)
changed=subprocess.check_output(['git','diff','--name-only',base,'--','src/eval'],text=True).splitlines()
assert set(changed)<={'src/eval/restaurant/search-fixture/named-retrieval-simulation.ts','src/eval/restaurant/search-fixture/named-retrieval-simulation.test.ts'},changed
before=json.loads(subprocess.check_output(['git','show',base+':.eval-artifacts/phase3b/budget.json'],text=True));now=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text())
rows={e['id']:e for e in now['entries']};assert len(rows)==len(now['entries'])
for row in before['entries']:assert rows[row['id']]==row,row['id']
assert now['limits']['evaluationPublicGET']==260 and now['cumulative']==before['cumulative']
assert sum(e.get('evaluationPublicGET',e.get('publicGET',0)) for e in now['entries'])==244
print(json.dumps({'status':'PASS','frozenInputs':len(f['files']),'protectedIdentityAvailabilityBindingG2Frontend':'UNCHANGED','previousLedgerEntriesPreserved':len(before['entries']),'siteGETUsed':244,'siteGETCap':260,'newCalls':0}))
