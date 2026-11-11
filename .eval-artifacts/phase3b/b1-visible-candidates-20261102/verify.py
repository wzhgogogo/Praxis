from pathlib import Path
import hashlib,json,subprocess
r=Path(__file__).parent
freeze=json.loads((r/'freeze.json').read_text())
for f in freeze['files']:
    assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
base=freeze['baseMain']
protected=['src/eval','src/harness','src/web','src/server/local-web-server.ts','src/server/local-web-server.test.ts',
 'src/integrations/tabelog/tabelog-browser-availability.ts','src/integrations/tabelog/tabelog-query-controls.ts','src/integrations/tabelog/tabelog-vacancy-response.ts']
assert not subprocess.check_output(['git','diff','--name-only',base,'--',*protected],text=True).strip()
expected={'src/application/fixtures/booking-terms-composition.ts','src/application/restaurant-booking-handoff-visibility.test.ts',
 'src/application/restaurant-booking-handoff.ts','src/domains/restaurant/booking-handoff.ts',
 'src/integrations/restaurant-facts/booking-terms.ts','src/integrations/tablecheck/tablecheck-booking-handoff-reader.test.ts'}
changed=set(subprocess.check_output(['git','diff','--name-only',base,'--','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json'],text=True).splitlines())
assert changed==expected,changed
old=json.loads((r/'budget-before-main.json').read_text());a=json.loads((r/'budget-source-A-f094e034.json').read_text())
ledger=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text());rows={e['id']:e for e in ledger['entries']}
assert len(rows)==len(ledger['entries'])==619
for source in [old,a]:
    for e in source['entries']:assert rows[e['id']]==e,e['id']
assert ledger['limits']==old['limits'] and ledger['cumulative']==a['cumulative']
own=rows['phase3b-C-b1-visible-candidates-offline-20261102']
for k in ['fullLive','realModelCalls','environmentReruns','evaluationPublicGET','googleRequests','restaurantWebsiteRequests']:assert own[k]==0
for k in ['fullLive','realModelCalls','environmentReruns','googleRequests','restaurantWebsiteRequests']:assert sum(e.get(k,0) for e in rows.values())==ledger['cumulative'][k],k
assert sum(e.get('evaluationPublicGET',e.get('publicGET',0)) for e in rows.values())==ledger['cumulative']['evaluationPublicGET']
print(json.dumps({'status':'PASS','baseMain':base,'freeze':len(freeze['files']),'protectedPathsUnchanged':protected,'ledgerRows':len(rows),'realCalls':0}))
