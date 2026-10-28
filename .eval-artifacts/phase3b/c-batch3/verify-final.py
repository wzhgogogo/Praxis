from pathlib import Path
import datetime,hashlib,json,subprocess
root=Path('.eval-artifacts/phase3b/c-batch3')
def load(p):return json.loads(Path(p).read_text())
def blob(ref,path):return subprocess.check_output(['git','show',ref+':'+str(path)])
def digest(b):return hashlib.sha256(b).hexdigest()
ledger=load('.eval-artifacts/phase3b/budget.json');entries={r['id']:r for r in ledger['entries']};assert len(entries)==len(ledger['entries'])
old=json.loads(blob('9181eee9','.eval-artifacts/phase3b/budget.json'))
assert all(entries[r['id']]==r for r in old['entries']),'Peer/previous entries must be unchanged'
keys=['fullLive','realModelCalls','environmentReruns','evaluationPublicGET','googleRequests','restaurantWebsiteRequests']
def totals(rows):return {k:sum(r.get(k,r.get('publicGET',0) if k=='evaluationPublicGET' else 0) for r in rows) for k in keys}
assert totals(entries.values())==ledger['cumulative']
batch=totals([r for r in entries.values() if r.get('conversation')=='C' and r.get('batch')==3])
assert batch['realModelCalls']==batch['googleRequests']==batch['fullLive']==batch['environmentReruns']==0
assert batch['evaluationPublicGET']<=12 and ledger['cumulative']['evaluationPublicGET']<=40
baseline='src/harness/browser/fixtures/dom-change/baseline.json';review=load(root/'g2-baseline-review.json')
before=blob('90b464d8',baseline);after=Path(baseline).read_bytes()
assert digest(before)==review['beforeSha256'] and digest(after)==review['afterSha256']
expected=json.loads(before);changes={c['caseId']:c for c in review['changes']};assert len(changes)==2
for case in expected['cases']:
    if case['id'] in changes:
        c=changes[case['id']];assert case['referenceFacts'][c['field']]==c['frozenValue'];case['referenceFacts'][c['field']]=c['proposedValue']
assert json.loads(after)==expected,'Exactly two approved original references, no other fields'
assert not subprocess.check_output(['git','diff','9181eee9','--','src/harness/browser/dom-change.test.ts','src/harness/browser/dom-change-agent.test.ts','src/harness/browser/dom-change-mutation.test.ts','src/eval/restaurant/dom-change'])
execution=load(root/'optional/execution.json');assert len(execution['results'])==batch['evaluationPublicGET']
previous=None
for row in execution['results']:
    start=load(row.get('bodyPath',str(root/'optional'/((row['ledgerId'].rsplit('-',1)[-1])+'-'+row['subjectId']+'.body.html'))).replace('.body.html','.started.json'))
    assert row['ledgerId'] in entries
    assert start['method']=='GET' and start['cookie'] is False and start['redirect']=='manual' and start['retries']==0
    stamp=datetime.datetime.fromisoformat(start['atCET']);assert stamp.utcoffset().total_seconds()==3600
    if previous:assert (stamp-previous).total_seconds()>=30
    previous=datetime.datetime.fromisoformat(row['finishedAtCET'])
    if row.get('bodyPath'):assert digest(Path(row['bodyPath']).read_bytes())==row['sha256']
# The earlier run's source and scripts are immutable Git blobs, even when final tests later advance.
for f in load(root/'optional-freeze.json')['files']:assert digest(blob(execution['sourceCommit'],f['path']))==f['sha256'],f['path']
evaluation=load(root/'after-gate-fix/evaluation.json');assert evaluation['identity']['correct']>=12 and evaluation['identity']['wrongAccepted']==0
assert evaluation['identity']['unexpectedRegressions']==0
identity_source=load(root/'identity-final/recomputed.json')['sourceCommit']
for path in ['src/integrations/restaurant-availability/outlet-identity.ts','src/integrations/tabelog/tabelog-entity-resolver.ts','src/integrations/tablecheck/tablecheck-entity-resolver.ts','src/integrations/restaurant-identity/detail-identity-fields.ts','src/integrations/tabelog/tabelog-page-parser.ts','src/integrations/tablecheck/tablecheck-page-parser.ts']:
    assert Path(path).read_bytes()==blob(identity_source,path),'Identity code differs from the29-page replay'
record={'status':'PASS','preservedParentLedgerEntries':len(old['entries']),'uniqueLedgerEntries':len(entries),'batchUsage':batch,'sharedUsage':ledger['cumulative'],'g2ChangedOriginalReferences':2,'g2ScorerMutationRules':'UNCHANGED','optionalFrozenSourceVerified':execution['sourceCommit'],'identity':evaluation['identity']}
(root/'integrity.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
