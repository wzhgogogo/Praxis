from pathlib import Path
import datetime,hashlib,json,subprocess
root=Path('.eval-artifacts/phase3b/c-batch2')
def load(p):return json.loads(Path(p).read_text())
def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
freeze=load(root/'gates-freeze.json')
for row in freeze['files']:assert digest(row['path'])==row['sha256'],row['path']
ledger=load('.eval-artifacts/phase3b/budget.json');entries={r['id']:r for r in ledger['entries']}
baseline=json.loads(subprocess.check_output(['git','show','5208d401:.eval-artifacts/phase3b/budget.json'],text=True))
for row in baseline['entries']:assert entries[row['id']]==row
assert len(entries)==len(ledger['entries'])
assert ledger['cumulative']=={'fullLive':0,'realModelCalls':40,'environmentReruns':0,'evaluationPublicGET':18,'googleRequests':11,'restaurantWebsiteRequests':18}
assert digest('src/eval/restaurant/semantic/cases/restaurant-semantic-regression.gold5.json')=='b58c6a1f3ee3833cfa135c4e7a8e3a130d74673f9db6ba51306a582b13e06206'
assert digest('src/eval/restaurant/semantic/cases/restaurant-semantic-regression.gold4.json')=='96a3dbd7c406805e31586a0a6fb472b5bb2dd7458bd3187a3413c6ed2e5f8b66'
assert digest('src/eval/restaurant/semantic/fixtures.ts')=='fa4a8e52a82806af6d507a06f4ba16426e6c28376936363c777c4e981cf3ca72'
protected=['src/domains/restaurant/semantic-interpreter.ts','src/domains/restaurant/semantic-proposal.ts',
 'src/integrations/tabelog/tabelog-contracts.ts','src/integrations/tablecheck/tablecheck-contracts.ts',
 'src/integrations/restaurant-availability/outlet-identity.ts','src/integrations/restaurant-search/source-packs.ts',
 'src/integrations/google/google-places-client.ts','src/integrations/tabelog/tabelog-query-controls.ts',
 'src/integrations/tabelog/tabelog-browser-availability.ts','src/integrations/tablecheck/tablecheck-browser-availability.ts']
for p in protected:assert Path(p).read_bytes()==subprocess.check_output(['git','show','5208d401:'+p]),p
findings=load(root/'review-findings.json');assert findings['semantic']['namedPassed']==24 and findings['semantic']['goalPassed']==15
assert findings['identityReplay']['afterCorrect']==9 and findings['identityReplay']['wrongAccepted']==0
receipts=sorted((root/'search').glob('*.started.json'));assert len(receipts)==18
minimum=None;priorFinished=None
for p in receipts:
    start=load(p);assert start['method']=='GET' and start['cookie'] is False and start['redirect']=='manual' and start['retries']==0
    at=datetime.datetime.fromisoformat(start['atCET'])
    if priorFinished:
        interval=(at-priorFinished).total_seconds();assert interval>=30;minimum=interval if minimum is None else min(minimum,interval)
    result=load(p.with_name(p.name.replace('.started.json','.result.json')))
    priorFinished=datetime.datetime.fromisoformat(result['finishedAtCET']) if 'finishedAtCET' in result else None
result={'schema':'phase3b-c-final-integrity@1','status':'PASS','atCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(timespec='seconds'),
 'frozenFiles':len(freeze['files']),'peerBudgetEntriesUnchanged':len(baseline['entries']),'actualUsage':ledger['cumulative'],
 'protectedSourceFilesUnchanged':protected,'gold3_4_5Unchanged':True,'sourceGETMinimumFinishToStartSeconds':minimum,
 'noMainMerge':True,'qualityStatus':'AWAITING_REVIEW_WITH_KNOWN_FAILURES','newRealCalls':0}
(root/'integrity.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
