"""Read-only integrity verification; source pages and credentials are never loaded live."""
import collections,datetime,hashlib,json,subprocess
from pathlib import Path
root=Path('.eval-artifacts/phase3b/g4-priority-backfill')
def load(p):return json.loads(Path(p).read_text())
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
frozen=load(root/'freeze.json')
for f in frozen['files']:assert sha(f['path'])==f['sha256'],f['path']
assert subprocess.check_output(['git','diff','375aec6d','--','src','scripts','package.json','package-lock.json'])==b''
old=json.loads(subprocess.check_output(['git','show','375aec6d:.eval-artifacts/phase3b/budget.json']));ledger=load('.eval-artifacts/phase3b/budget.json')
assert ledger['entries'][:len(old['entries'])]==old['entries']
assert len({e['id'] for e in ledger['entries']})==len(ledger['entries'])
for k,n in ledger['cumulative'].items():assert n==sum(e.get(k,e.get('publicGET',0) if k=='evaluationPublicGET' else 0) for e in ledger['entries'])
entries=[e for e in ledger['entries'] if e['id'].startswith('phase3b-c-g4-backfill-get-')]
summary=load(root/'fetch-summary.json');assert len(entries)==summary['attempted']<=25
receipts=[load(root/'responses'/f"{e['id']}.json") for e in entries]
assert [e['url'] for e in entries]==[r['url'] for r in receipts]
assert len({r['url'] for r in receipts})==len(receipts)
queue=load(root/'queue.json')['rows'];assert [r['url'] for r in receipts]==[r['url'] for r in queue[:len(receipts)]]
gaps=[(datetime.datetime.fromisoformat(b['startedAtCET'])-datetime.datetime.fromisoformat(a['finishedAtCET'])).total_seconds() for a,b in zip(receipts,receipts[1:])];assert all(g>=30 for g in gaps)
for r in receipts:
 assert r['cookie'] is False and r['redirect']=='manual' and r['retries']==0
 if r.get('bodyPath'):assert sha(r['bodyPath'])==r['sha256']
for k in ['realModelCalls','googleRequests','fullLive','environmentReruns']:assert ledger['cumulative'][k]==old['cumulative'][k]
assert ledger['cumulative']['evaluationPublicGET']==old['cumulative']['evaluationPublicGET']+len(entries)<=257
if (root/'evaluation-summary.json').exists():
 namespace={};p=Path('.eval-artifacts/phase3b/g4-e2e/score.py');exec(compile(p.read_text().split('\ngold=',1)[0],str(p),'exec'),namespace)
 gold={r['id']:r for r in load('.eval-artifacts/phase3b/g4-e2e/gold.json')['rows']}
 for x in (root/'replay-execution').glob('*.json'):
  actual=load(root/'replay-evaluation'/x.name);expected=namespace['score'](load(x),gold);assert all(actual[k]==v for k,v in expected.items()),x
print(json.dumps({'status':'PASS','frozenSHA':len(frozen['files']),'productUnchangedSince375aec6d':True,'originalLedgerEntriesPreserved':len(old['entries']),'newGET':len(entries),'success':summary['succeeded'],'sourceFailed':summary['failed'],'minGapSeconds':min(gaps) if gaps else None,'newModel':0,'google':0,'live':0,'sharedGET':ledger['cumulative']['evaluationPublicGET'],'noCredentialFileLoaded':True}))
