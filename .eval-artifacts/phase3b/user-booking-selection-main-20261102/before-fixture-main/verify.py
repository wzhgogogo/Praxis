from pathlib import Path
import hashlib,json,subprocess
r=Path(__file__).parent
freeze=json.loads((r/'freeze.json').read_text())
for f in freeze['files']:
    assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
approved='ec93c249d7525e2c642bc0f0f0058522cf3b3428'
assert not subprocess.check_output(['git','diff',approved,'--','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json'],text=True)
preserved=json.loads((r/'preserved.json').read_text())
for f in preserved['oldArtifacts']:
    assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
assert hashlib.sha256((r/'evaluate.py').read_bytes()).hexdigest()==preserved['evaluationOracleSHA256']
old=json.loads((r/'approved-ledger.snapshot.json').read_text())
ledger=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text());rows={e['id']:e for e in ledger['entries']}
assert len(rows)==len(ledger['entries'])==len(old['entries'])+1
for e in old['entries']:assert rows[e['id']]==e,e['id']
assert ledger['limits']==old['limits'] and ledger['cumulative']==old['cumulative']
own=rows['phase3b-C-user-booking-selection-main-offline-20261102']
for k in ['realModelCalls','evaluationPublicGET','googleRequests','fullLive','environmentReruns','restaurantWebsiteRequests']:assert own[k]==0
for k in ['realModelCalls','googleRequests','fullLive','environmentReruns','restaurantWebsiteRequests']:assert sum(e.get(k,0) for e in rows.values())==ledger['cumulative'][k]
assert sum(e.get('evaluationPublicGET',e.get('publicGET',0)) for e in rows.values())==ledger['cumulative']['evaluationPublicGET']
print(json.dumps({'status':'PASS','approvedProduct':approved,'freeze':len(freeze['files']),'oldArtifacts':len(preserved['oldArtifacts']),'ledgerRows':len(rows),'realCalls':0}))
