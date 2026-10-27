"""Read saved results only. No source requests, model calls or production parsing."""
from pathlib import Path
import datetime,hashlib,json
root=Path('.eval-artifacts/phase3b/c-batch2')
def load(p):return json.loads(Path(p).read_text())
before=load('.eval-artifacts/phase3b/g4-name-resolution/recomputed.json');after=load(root/'identity/recomputed.json')
old={r['sampleId']:r for r in before['rows']};gains=[];lost=[]
for r in after['rows']:
    if old[r['sampleId']]['snapshotRecomputeVerdict']!=r['snapshotRecomputeVerdict']:
        if r['snapshotRecomputeVerdict']=='CORRECT':gains.append(r['sampleId'])
        else:
            comparisons=[entry for attempt in r['attempts'] for entry in attempt['reparsedPages']['diagnostic']['comparedOutlets'] if r['expectedOutletId'] in entry['sourceUrl']]
            lost.append({'id':r['sampleId'],'google':r['google'],'sourceComparisons':comparisons,
                         'classification':'ADDRESS_COMPARISON_CONFLICT_WITH_EXACT_PHONE_RETAINED',
                         'decision':'NOT_ACCEPTED_WITH_EXISTING_RULES; no fallback to omit complete public address'})
assert gains==['nr-002']
assert [r['id'] for r in lost]==['nr-004','nr-016','nr-020','nr-024']
assert next(r for r in after['rows'] if r['sampleId']=='nr-029')['snapshotRecomputeVerdict']=='NOT_ACCEPTED'
assert not any(r['snapshotRecomputeVerdict']=='WRONG_ACCEPTED' for r in after['rows'])
# Original data were frozen in the previous reviewed checkpoint before this replay.
prior=load('.eval-artifacts/phase3b/c-batch1/post-fix-input-sha256.json');pre={r['path']:r['sha256'] for r in prior['files']}
for r in after['inputs']:assert pre.get(r['path'])==r['sha256'],r['path']
subjects={r['id']:r for r in load(root/'subjects.json')['subjects']};offsets=[]
for r in load(root/'retrieval-inputs/fragment.validation.json')['decisions']:
    if r['status']=='INVALID_FRAGMENT':
        for p in r['proposal']:
            original=subjects[r['id']]['subject'].get(p.get('field'),'')
            offsets.append({'id':r['id'],'proposal':p,'literalSubstringPresent':p.get('fragment','') in original,
                            'classification':'ORCHESTRATION_EXTRA_OFFSET_CONSTRAINT; not a fabricated-name finding'})
ledger=load('.eval-artifacts/phase3b/budget.json');entries=[e for e in ledger['entries'] if e['id'].startswith('phase3b-c-batch2-call-')]
actual={k:sum(e.get(k,0) for e in entries) for k in ['realModelCalls','googleRequests','evaluationPublicGET','fullLive','environmentReruns']}
assert actual=={'realModelCalls':40,'googleRequests':11,'evaluationPublicGET':18,'fullLive':0,'environmentReruns':0}
model_ids=[e['id'] for e in entries if e['kind']=='MODEL'];assert len(set(model_ids))==40
gold=load(root/'gold.certified.json')['rows'];forbidden=[r['rstId'] for r in gold]
for path in sorted((root/'semantic/calls').glob('*.started.json'))+[root/'retrieval-inputs/fragment.request.json']:
    messages=json.dumps(load(path)['request']['messages'],ensure_ascii=False)
    assert not any(rid in messages for rid in forbidden),'Gold ID entered model payload'
for query in load(root/'queries.materialized.json')['queries']:
    assert not any(rid in query.get('query','') for rid in forbidden),'Gold ID entered query'
sem=load(root/'semantic/posthoc-evaluation.json');search=load(root/'search/evaluation.v2.json')
findings={'schema':'phase3b-c-batch2-review-findings@1','atCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(timespec='seconds'),
  'status':'AWAITING_REVIEW_NOT_OVERALL_ACCEPTED','semantic':sem['summary'],'newPrimaryPairs':search['primaryPaired'],
  'identityReplay':{'beforeCorrect':12,'afterCorrect':9,'wrongAccepted':0,'newlyAccepted':gains,'newlyNotAccepted':lost,
                    'nr029StillNotAccepted':True,'priorFrozenInputBindings':len(after['inputs']),
                    'attributionNote':'Raw observer @2 retains the previous coarse failure-stage precedence. These independent records identify current full-address conflicts, not missing phone extraction.'},
  'sourceStop':load(root/'search/execution.json')['stop'],'actualUsage':actual,'offsetRejections':offsets,
  'pendingReview':['Four newly exposed address-comparison denials; changing shared comparator/identity standards is outside this approval',
                   'SR05 smoking double negative; raw strict0/15 and field-level14/15 remain separate',
                   'Old15 comparison incomplete after source timeout; do not retry without a reviewed next slice',
                   'Remove unnecessary model-counted offsets in a later frozen runner; exact substring check suffices'],
  'newRealCallsByThisProgram':0,'privateHoldout':'NOT_READ'}
(root/'review-findings.json').write_text(json.dumps(findings,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':findings['status'],'semantic':sem['summary'],'identityBefore':12,'identityAfter':9,'wrongAccepted':0,'actualUsage':actual}))
