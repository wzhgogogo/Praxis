from pathlib import Path
import hashlib,json,subprocess
r=Path(__file__).parent
for f in json.loads((r/'freeze.json').read_text())['files']:
    assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
protected=json.loads((r/'protected.json').read_text())
for f in protected:assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
ledger=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text());rows={x['id']:x for x in ledger['entries']}
assert len(rows)==len(ledger['entries'])
for name in ['main','a']:
    old=json.loads((r/(name+'-ledger.snapshot.json')).read_text())
    assert ledger['limits']==old['limits']
    for x in old['entries']:assert rows[x['id']]==x,x['id']
for key in ['fullLive','realModelCalls','environmentReruns','googleRequests','restaurantWebsiteRequests']:
    assert sum(x.get(key,0) for x in rows.values())==ledger['cumulative'][key],key
assert sum(x.get('evaluationPublicGET',x.get('publicGET',0)) for x in rows.values())==ledger['cumulative']['evaluationPublicGET']
own=rows['phase3b-C-user-booking-selection-offline-20261102'];assert all(own.get(k,0)==0 for k in ['fullLive','realModelCalls','environmentReruns','publicGET','evaluationPublicGET','googleRequests','restaurantWebsiteRequests'])
for f in json.loads(Path('src/application/fixtures/user-booking-selection/provenance.json').read_text()):
    assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256']
changed=subprocess.check_output(['git','diff','--name-only','efeab254','HEAD','--','src/eval','src/harness/browser'],text=True)
assert not changed,changed
print(json.dumps({'status':'PASS','protected':len(protected),'frozen':len(json.loads((r/'freeze.json').read_text())['files']),'ledgerRows':len(rows),'realCalls':0}))
