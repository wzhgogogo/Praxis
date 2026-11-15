"""Read-only analysis of this batch's frozen decisions, real DOM/HAR and evaluator files."""
from pathlib import Path
from collections import Counter
from urllib.parse import urlparse
from datetime import datetime
import json,hashlib
root=Path(__file__).resolve().parent
read=lambda p:json.loads(p.read_text())
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
result={'sourceSHA':'a66a2edcb2ffe8e3eaa42f4c0e79680382539c9d','runs':{}}
for kind in ('d8',):
    config=read(root/kind/'config.json');slot=Path(config['output'])/'runtime'/config['id']
    ex=read(slot/'execution.result.json');evaluation=read(slot/'evaluation.json');data=read(slot/'evaluation.input.json')
    decisions=[json.loads(line) for line in (slot/'execution.decisions.jsonl').read_text().splitlines() if line.strip()]
    trajectory=[]
    for d in decisions:
        if d['purpose']!='browser_read_decide':continue
        if not d.get('outputText'):
            trajectory.append({'sequence':d['sequence'],'at':d['startedAt'],'action':None,'status':'RECORDED_MODEL_ERROR'});continue
        context=json.loads(d['messages'][-1]['content']);action=json.loads(d['outputText']);observed=context['observation']
        target=next((t for t in observed.get('targets',[]) if t['ref']==action.get('targetRef')),None)
        trajectory.append({'sequence':d['sequence'],'at':d['startedAt'],'latencyMs':d['latencyMs'],'source':context['source'],'stage':context['stage'],'url':observed['url'],'action':action,'target':target,'progress':context.get('progress')})
    (root/kind/'decision-trajectory.json').write_text(json.dumps(trajectory,ensure_ascii=False,indent=2)+'\n')
    events=read(slot/'browser-diagnostics.json')['events'];recording=read(slot/'recording-observation.json');rec=Path(recording['recordingPath'])
    trace=read(slot/'browser-trace.json')['events'];har=read(rec/'replay.har')['log']['entries']
    names={c['restaurant']['id']:c['restaurant']['outletName'] for c in ex['view']['restaurant']['candidates']}
    scopes=[{'sequence':e['sequence'],'at':e['at'],'candidateId':e.get('candidateId'),'name':names.get(e.get('candidateId')),'stage':e['stage'],'elapsedMs':e['lifecycle']['providerElapsedMs'],'modelCalls':e['lifecycle']['providerModelCalls']} for e in events if e['event']=='PROVIDER_FINISHED']
    search=[e for e in trace if e['kind']=='GUARD_TRANSPORT_END' and 'search-v4' in e['detail'].get('url','')]
    recordSearch=[{'sequence':e['sequence'],'at':e['at'],'url':e['detail']['url'],'status':e['detail'].get('status'),'elapsedMs':e['detail'].get('elapsedMs'),'outcome':e['detail'].get('outcome')}for e in search]
    (root/kind/'dynamic-search-responses.json').write_text(json.dumps(recordSearch,ensure_ascii=False,indent=2)+'\n')
    ledger=read(Path(config['budget']))
    supplementary=slot/'evaluation.supplement.json'
    result['runs'][kind]={
        'originalVerdict':evaluation['verdict'],'reviewedVerdict':read(supplementary)['verdict'] if supplementary.exists() else None,
        'nonPassOriginal':[c for c in evaluation['checks']if c['status']!='PASS'],
        'requestBoundary':dict(Counter(c['status']for c in evaluation['checks']if c['rule']=='REQUEST_BOUNDARY')),
        'firstTurn':data['deadline']['turns'][0],'productElapsedMs':data['deadline']['elapsedMs'],
        'providerRejected':sum(bool(d.get('providerRejected')) for d in decisions),
        'deliveries':data['delivered'],'handoffs':data['handoffs'],'postDelivery':[{ 'status':p['status'],'slots':p.get('slots'), 'checkedAt':p.get('receipt',{}).get('checkedAt')} for p in data['postDeliveryChecks']],
        'finalPhase':ex['execution']['finalSnapshot']['domainState']['phase'],'turns':ex['turns'],'providerScopes':scopes,
        'recording':{'qualified':recording['qualifiedPages'],'total':recording['totalPages'],'replay':recording['replayStatus'],'exceptions':[p for p in recording['pages']if not p['qualified']]},
        'HARPrivacy':{'requestHeaders':sum(len(e['request'].get('headers',[]))for e in har),'requestCookies':sum(len(e['request'].get('cookies',[]))for e in har)},
        'searchAPIStatus':[{ 'path':key[0],'status':key[1],'count':value}for key,value in Counter((urlparse(e['detail']['url']).path,e['detail'].get('status'))for e in search).items()],
        'ledger':ledger['cumulative'],'remaining':{k:v-ledger['cumulative'][k]for k,v in ledger['limits'].items()},
        'evidenceSHA256':{name:digest(slot/name) for name in ['evaluation.json','evaluation.input.json','execution.result.json','execution.decisions.jsonl','browser-trace.json','outer-requests.json']}
    }
    if kind=='d02v':
        final=next(e for e in events if e['event']=='PROVIDER_FINISHED' and e.get('candidateId')=='tabelog:en/tokyo/A1319/A131902/13309182')
        previous=[e for e in events if e['sequence']<final['sequence'] and e.get('candidateId')==final['candidateId']]
        lastSnapshot=next(e for e in reversed(previous) if e['event']=='OPERATION_STARTED' and e.get('operation')=='SNAPSHOT')
        suffix=[e for e in previous if e['sequence']>lastSnapshot['sequence']]
        result['runs'][kind]['terminalObserveSkipped']=not any(e.get('operation')=='OBSERVE_CONTROLS' for e in suffix)
        agent=next(d for d in decisions if d['sequence']==37)
        present=next(d for d in decisions if d['sequence']==47)
        result['runs'][kind]['extraAvailabilityAfterEligible']={'decisionSequence':37,'presentSequence':47,'extraModelCalls':10,'secondsBetweenStarts':(datetime.fromisoformat(present['startedAt'].replace('Z','+00:00'))-datetime.fromisoformat(agent['startedAt'].replace('Z','+00:00'))).total_seconds()}
before,after=[read(root/n)for n in ['protected-before.json','protected-after.json']]
result['protectedUnchanged']=before==after
assert result['protectedUnchanged']
result['totalUsed']={k:sum(r['ledger'][k]for r in result['runs'].values())for k in ['fullLive','evaluationPublicGET','realModelCalls','environmentReruns']}
(root/'run-analysis.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'protected':result['protectedUnchanged'],'totalUsed':result['totalUsed'],'boundary':{k:r['requestBoundary']for k,r in result['runs'].items()},'searchAPI':result['runs']['d8']['searchAPIStatus']},ensure_ascii=False))
