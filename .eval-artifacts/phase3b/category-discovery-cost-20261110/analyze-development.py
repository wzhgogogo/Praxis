# Offline public development outputs only; no supplemental scoring/Live.
import json
from pathlib import Path
from collections import Counter
root=Path(__file__).parent;rows=[]
for case in ['D01','D02']:
 p=root/'runtime'/case/case
 if not (p/'execution.result.json').exists():continue
 result=json.loads((p/'execution.result.json').read_text());ex=result['execution'];state=ex['finalSnapshot']['domainState'];events=[e['event'] for e in ex['events']];diag=json.loads((p/'browser-diagnostics.json').read_text())['events'];dec=[json.loads(l) for l in (p/'execution.decisions.jsonl').read_text().splitlines()]
 byid={c['restaurant']['id']:c['restaurant'] for c in state['candidates']};candidateRows=[]
 for id,c in byid.items():
  browser=Counter(e['stage'] for e in diag if e['event']=='MODEL_DECISION_STARTED' and e.get('candidateId')==id)
  facts=[]
  for d in dec:
   if d['purpose']!='restaurant_fact_judgment':continue
   inp=json.loads(next(m['content'] for m in d['messages'] if m['role']=='user'))
   if inp['candidate']['name']!=c['outletName']:continue
   facts.append({'sequence':d['sequence'],'citedInputs':[{'evidenceId':o['evidenceId'],'provider':o['provider'],'typeFacts':o['restaurantTypeFacts']} for o in inp['observations']], 'response':json.loads(d['outputText']) if d.get('outputText') else None})
  sourceQuotes=[{'evidenceId':e['evidenceId'],'provider':e['provider'],'quote':q['quote']} for e in state['readEvidence'] if e.get('candidateId')==id and e['kind']=='RESTAURANT_FACT' and e.get('entityMatch',{}).get('confidence')=='HIGH' for q in e.get('sourceFieldQuotes',[]) if q['field']=='CATEGORY']
  candidateRows.append({'id':id,'name':c['outletName'],'source':c['sourceIds'].get('discoverySourceId'), 'browserCalls':dict(browser),'factJudgmentCalls':len(facts),'factJudgments':facts,'categoryEvidence':sourceQuotes,'availability':state.get('availabilityChecks',{}).get(id),'conditions':result['view']['restaurant'].get('conditionStates',{}).get(id)})
 discovery={}
 for event in diag:
  if event['stage']=='DISCOVERY':
   v=discovery.setdefault(event['source'],{'modelCalls':0,'elapsedMs':0})
   v['modelCalls']+=event['event']=='MODEL_DECISION_STARTED'
   if event['event']=='PROVIDER_FINISHED':v['elapsedMs']+=event.get('lifecycle',{}).get('providerElapsedMs',0)
 searches=[{'sources':Counter(c['restaurant']['sourceIds'].get('discoverySourceId','UNKNOWN') for c in e['candidates']),'count':len(e['candidates']),'metadata':e.get('metadata')} for e in events if e['type']=='SEARCH_COMPLETED']
 rec=json.loads(next((p/'recordings').rglob('recording.json')).read_text());retry=[e for e in rec['entries'] if isinstance(e.get('detail'),dict) and e['detail'].get('event') in ['ZERO_BYTE_TIMEOUT','IDLE_ABORT']]
 evaluation=json.loads((p/'evaluation.json').read_text());skips=[s for t in ex['trajectories'] for s in t.get('executionMetadata',{}).get('skippedSources',[])]
 rows.append({'id':case,'resourceUsage':ex.get('resourceUsage'),'modelCalls':len(dec),'modelOutcomes':Counter(d.get('outcome') for d in dec),'discovery':discovery,'searches':searches,'candidates':candidateRows,'categoryEvidenceCandidates':sum(bool(c['categoryEvidence']) for c in candidateRows),'checkedCandidates':len(state.get('availabilityChecks',{})),'presented':state.get('presentedResults'),'NO_PROGRESS':sum(e.get('operation')=='NO_PROGRESS' for e in diag),'skippedSources':skips,'retryEvents':retry,'verdict':evaluation['verdict'],'qualificationClaims':json.loads((p/'evaluation.input.json').read_text()).get('qualificationClaims'),'recording':{'pages':len(rec.get('pages',[])),'pageStatuses':Counter(x['status'] for x in rec.get('pages',[]))}})
(root/'analysis.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(json.dumps([{k:v for k,v in r.items() if k not in ['candidates','searches','qualificationClaims','retryEvents','skippedSources']} for r in rows],ensure_ascii=False,indent=2))
