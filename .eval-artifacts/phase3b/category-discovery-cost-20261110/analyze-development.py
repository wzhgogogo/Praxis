# Offline public development outputs only; no supplemental scoring/Live.
import json
from pathlib import Path
from collections import Counter
from datetime import datetime
root=Path(__file__).parent;rows=[]
for case in ['D01','D02']:
 p=root/'runtime'/case/case
 file=p/'execution.result.json'
 if not file.exists():file=p/'failure.json'
 if not file.exists():continue
 result=json.loads(file.read_text());ex=result['execution'];state=ex['finalSnapshot']['domainState'];events=[e['event'] for e in ex['events']];diag=json.loads((p/'browser-diagnostics.json').read_text())['events'];dec=[json.loads(l) for l in (p/'execution.decisions.jsonl').read_text().splitlines()]
 pool={c['restaurant']['id']:c['restaurant'] for e in events if e['type']=='SEARCH_COMPLETED' for c in e['candidates']}
 pool.update({c['restaurant']['id']:c['restaurant'] for c in state['candidates']})
 byid=pool;candidateRows=[]
 allEvidence={e['evidenceId']:e for ev in events for e in ev.get('evidence',[])}
 allEvidence.update({e['evidenceId']:e for e in state['readEvidence']})
 availability={}
 for ev in events:
  if ev['type']=='AVAILABILITY_CHECKED':availability.update(ev.get('availabilityChecks',{}))
 for id,c in byid.items():
  browser=Counter(e['stage'] for e in diag if e['event']=='MODEL_DECISION_STARTED' and e.get('candidateId')==id)
  facts=[]
  for d in dec:
   if d['purpose']!='restaurant_fact_judgment':continue
   inp=json.loads(next(m['content'] for m in d['messages'] if m['role']=='user'))
   if inp['candidate']['name']!=c['outletName']:continue
   facts.append({'sequence':d['sequence'],'citedInputs':[{'evidenceId':o['evidenceId'],'provider':o['provider'],'typeFacts':o['restaurantTypeFacts']} for o in inp['observations']], 'response':json.loads(d['outputText']) if d.get('outputText') else None})
  sourceQuotes=[{'evidenceId':e['evidenceId'],'provider':e['provider'],'quote':q['quote']} for e in allEvidence.values() if e.get('candidateId')==id and e['kind']=='RESTAURANT_FACT' and e.get('entityMatch',{}).get('confidence')=='HIGH' for q in e.get('sourceFieldQuotes',[]) if q['field']=='CATEGORY']
  actual=Counter()
  for d in dec:
   try:inp=json.loads(next(m['content'] for m in d['messages'] if m['role']=='user'))
   except (ValueError,StopIteration):continue
   purpose=d['purpose']
   browserScope=None
   if purpose=='browser_read_decide':
    t=datetime.fromisoformat(d['startedAt'].replace('Z','+00:00'));starts=[v for v in diag if v['event']=='MODEL_DECISION_STARTED' and datetime.fromisoformat(v['at'].replace('Z','+00:00'))<=t]
    if starts:
     v=starts[-1]
     if (t-datetime.fromisoformat(v['at'].replace('Z','+00:00'))).total_seconds()<2:browserScope=v.get('candidateId')
   match=(purpose=='browser_read_decide' and browserScope==id) or (purpose=='restaurant_fact_judgment' and inp.get('candidate',{}).get('name')==c['outletName']) or (purpose=='restaurant_source_facts' and inp.get('sourceDocument',{}).get('candidateId')==id) or (purpose=='restaurant_named_source_query' and inp.get('name')==c['outletName']) or (purpose=='restaurant_page_question' and any(v.get('candidateId')==id for v in inp.get('sourceDocuments',[])))
   if match:actual[purpose]+=1
  candidateRows.append({'id':id,'name':c['outletName'],'source':c['sourceIds'].get('discoverySourceId'),'actualCandidateModelCalls':dict(actual), 'browserCalls':dict(browser),'factJudgmentCalls':len(facts),'factJudgments':facts,'categoryEvidence':sourceQuotes,'availability':availability.get(id),'conditions':result['view']['restaurant'].get('conditionStates',{}).get(id)})
 discovery={}
 for event in diag:
  if event['stage']=='DISCOVERY':
   v=discovery.setdefault(event['source'],{'modelCalls':0,'elapsedMs':0})
   v['modelCalls']+=event['event']=='MODEL_DECISION_STARTED'
   if event['event']=='PROVIDER_FINISHED':v['elapsedMs']+=event.get('lifecycle',{}).get('providerElapsedMs',0)
 searches=[{'sources':Counter(c['restaurant']['sourceIds'].get('discoverySourceId','UNKNOWN') for c in e['candidates']),'count':len(e['candidates']),'metadata':e.get('metadata')} for e in events if e['type']=='SEARCH_COMPLETED']
 rec=json.loads(next((p/'recordings').rglob('recording.json')).read_text());retry=[e for e in rec['entries'] if isinstance(e.get('detail'),dict) and e['detail'].get('event') in ['ZERO_BYTE_TIMEOUT','IDLE_ABORT']]
 evaluation=json.loads((p/'evaluation.json').read_text()) if (p/'evaluation.json').exists() else {'verdict':{'status':'NO_EVALUATION','reason':result.get('failure')}};skips=[s for t in ex['trajectories'] for s in t.get('executionMetadata',{}).get('skippedSources',[])]
 rows.append({'id':case,'resourceUsage':ex.get('resourceUsage'),'modelCalls':len(dec),'modelOutcomes':Counter(d.get('outcome') for d in dec),'discovery':discovery,'searches':searches,'candidates':candidateRows,'categoryEvidenceCandidates':sum(bool(c['categoryEvidence']) for c in candidateRows),'checkedCandidates':len(availability),'turnBudgets':json.loads((p/'user-turns.json').read_text()).get('budgets'),'presented':state.get('presentedResults'),'NO_PROGRESS':sum(e.get('operation')=='NO_PROGRESS' for e in diag),'skippedSources':skips,'retryEvents':retry,'verdict':evaluation['verdict'],'qualificationClaims':json.loads((p/('evaluation.input.json' if (p/'evaluation.input.json').exists() else 'failure.evaluation.input.json')).read_text()).get('qualificationClaims'),'recording':{'pages':len(rec.get('pages',[])),'pageStatuses':Counter(x['status'] for x in rec.get('pages',[]))}})
(root/'analysis.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(json.dumps([{k:v for k,v in r.items() if k not in ['candidates','searches','qualificationClaims','retryEvents','skippedSources']} for r in rows],ensure_ascii=False,indent=2))
