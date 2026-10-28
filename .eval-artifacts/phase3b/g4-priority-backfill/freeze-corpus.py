"""Freeze acquired bytes before production-prefix replay; never fetch here."""
import hashlib,json
from pathlib import Path
root=Path('.eval-artifacts/phase3b/g4-priority-backfill');old=Path('.eval-artifacts/phase3b/g4-priority-fragments')
def load(p):return json.loads(Path(p).read_text())
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
summary=load(root/'fetch-summary.json');queue=load(root/'queue.json')['rows']
assert summary['attempted']<=25 and len(summary['ledgerIds'])==summary['attempted']
responses=[load(root/'responses'/f'{i}.json') for i in summary['ledgerIds']]
assert [r['url'] for r in responses]==[r['url'] for r in queue[:len(responses)]]
for r in responses:
 if r.get('bodyPath'):assert sha(r['bodyPath'])==r['sha256']
corpus=load(old/'corpus.json');corpus['responses']+=responses
(root/'corpus.json').write_text(json.dumps(corpus,ensure_ascii=False,indent=2)+'\n')
files={f['path']:f['sha256'] for f in load(root/'fetch-freeze.json')['files']}
for p in [root/'fetch-freeze.json',root/'corpus.json',root/'freeze-corpus.py',root/'verify.py',root/'fetch-summary.json',root/'fetch-started.json']+list((root/'responses').glob('*')):files[str(p)]=sha(p)
for p,h in files.items():assert sha(p)==h,p
(root/'freeze.json').write_text(json.dumps({'captureSourceCommit':summary['sourceCommit'],'productionCommit':'375aec6dc2fac0a5e42de8db627c633d812ca81f','scope':'old188 receipts plus approved backfill; no scoring/production changes','files':[{'path':p,'sha256':h} for p,h in sorted(files.items())]},indent=2)+'\n')
print(json.dumps({'frozenFiles':len(files),'backfillReceipts':len(responses),'sourceFailures':summary['failed'],'corpusReceipts':len(corpus['responses'])}))
