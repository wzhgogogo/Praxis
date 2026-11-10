# Read-only analysis of completed, public development outputs. No private input.
import json
from pathlib import Path
r=Path(__file__).parent;rows=[]
for name in ['D01','D02']:
 p=r/'runtime'/name/name
 if not (p/'execution.result.json').exists():continue
 d=json.loads((p/'execution.result.json').read_text());ex=d['execution'];diag=json.loads((p/'browser-diagnostics.json').read_text())['events'];stage={}
 for e in diag:
  if e['stage']=='DISCOVERY' and e['source'] in ['DIRECTORY','VENUE_SEARCH']:
   v=stage.setdefault(e['source'],{'modelCalls':0,'elapsedMs':0,'candidates':0})
   v['modelCalls']+=e['event']=='MODEL_DECISION_STARTED'
   if e['event']=='PROVIDER_FINISHED':v['elapsedMs']+=e.get('lifecycle',{}).get('providerElapsedMs',0)
 for e in ex['events']:
  ev=e['event'];s=ev.get('metadata',{}).get('nativeDiscoveryFunnel',{}).get('source')
  if ev['type']=='SEARCH_COMPLETED' and s:
   k={'TABELOG':'DIRECTORY','TABLECHECK':'VENUE_SEARCH'}.get(s,s)
   stage.setdefault(k,{'modelCalls':0,'elapsedMs':0,'candidates':0})['candidates']+=len(ev['candidates'])
 checks={};skips=[]
 for t in ex['trajectories']:skips+=t.get('executionMetadata',{}).get('skippedSources',[])
 for e in ex['events']:
  if e['event']['type']=='AVAILABILITY_CHECKED':checks.update(e['event'].get('availabilityChecks',{}))
 trace=json.loads((p/'browser-trace.json').read_text())['events'];retry=[e for e in trace if e['kind']=='ENTRY_NAVIGATION' and e['detail'].get('event') in ['ZERO_BYTE_TIMEOUT','IDLE_ABORT']]
 ev=json.loads((p/'evaluation.json').read_text());dec=[json.loads(l) for l in (p/'execution.decisions.jsonl').read_text().splitlines()]
 rows.append({'id':name,'discovery':stage,'checkedCandidates':{k:v['status'] for k,v in checks.items()},'skippedSources':len(skips),'NO_PROGRESS':sum(e.get('detail')=='NO_PROGRESS' for e in diag),'retryEvents':retry,'modelCalls':len(dec),'resourceUsage':ex.get('resourceUsage'),'resourceAccounting':ex.get('resourceAccounting'),'presented':ex['finalSnapshot']['domainState'].get('presentedResults'),'verdict':ev['verdict']})
(r/'analysis.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(rows,ensure_ascii=False,indent=2))
