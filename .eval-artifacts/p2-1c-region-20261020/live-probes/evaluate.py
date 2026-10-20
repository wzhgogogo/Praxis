"""Independent literal URL, trace, budget and control checks; never invokes production code."""
from pathlib import Path
from urllib.parse import urlsplit
import json,hashlib,math
base=Path(__file__).resolve().parent
load=lambda p:json.loads(Path(p).read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
plan=load(base/'plan.json');ledger=load(base/'ledger.json');rows=[]
registry=load(plan['witnesses'])
for p in plan['planned']:
 attempts=[a for a in ledger['attempts'] if a['index']==p['index']];successful=[a for a in attempts if a.get('summary') and not a.get('retrySignals')]
 if not successful:
  rows.append({'index':p['index'],'caseId':p['caseId'],'repeat':p['repeat'],'status':'BLOCKED_BY_UPSTREAM' if attempts else 'NOT_REACHED','reason':attempts[-1]['status'] if attempts else 'not started'});continue
 a=successful[-1];s=load(a['summary']);assert sha(a['summary'])==a['summarySha256'];directory=Path(a['summary']).parent
 trace=[json.loads(l) for l in (directory/'trace.jsonl').read_text().splitlines()];decisions=[json.loads(l) for l in (directory/'probe.decisions.jsonl').read_text().splitlines()]
 assert len(decisions)==s['resources']['modelCalls']==s['decisionCapture']['callsStarted']==s['decisionCapture']['rowsWritten']
 expected=plan['acceptance']['expectedTopRegion'][p['caseId']];source=next((r for r in s['sources'] if r['sourceId']=='tabelog'),{})
 first=((source.get('funnel')or{}).get('directoryRegion')or{}).get('first')or{}
 region_ok=f'/tokyo/{expected}/' in first.get('url','')
 observed=any(r['kind']=='SNAPSHOT' and f'/tokyo/{expected}/' in r['detail'].get('url','') for r in trace)
 no_budget='READ_BUDGET_EXCEEDED' not in s['failureCodes'] and not any('READ_BUDGET_EXCEEDED' in json.dumps(r.get('detail',{})) for r in trace if r['kind'] in ['SOURCE_FAILED','EXECUTOR_DIAGNOSTIC'])
 within=s['resources']['modelCalls']<=15 and s['resources']['elapsedMs']<=180000
 valid_window=s['finishedAt']<plan['witnessCutoff']
 # Read returned candidates from original trace and calculate radius independently, rather than trusting inRadiusParsed.
 input=load(p['input']);loc=input['locationContext'];counts={};distances=[]
 for r in trace:
  if r['kind']!='SOURCE_FIRST_BATCH':continue
  sid=r['detail']['sourceId'];count=0
  for c in r['detail']['read']['candidates']:
   q=c['restaurant'].get('coordinates')
   if not q:continue
   lat1,lat2=map(math.radians,[loc['latitude'],q['lat']]);dy=lat2-lat1;dx=math.radians(q['lng']-loc['longitude']);d=6371000*2*math.asin(min(1,math.sqrt(math.sin(dy/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin(dx/2)**2)))
   if d<=loc['radiusMeters']:count+=1
   if sid in ['tabelog','tablecheck']:distances.append({'sourceId':sid,'candidateId':c['restaurant']['id'],'distanceMeters':d})
  counts[sid]=count
 witness=next(e['witnesses'] for e in registry['variants'] if e['caseId']==p['caseId'])
 ids={w['sourceEntityId'] for w in witness if w['sourceId']=='tabelog'}
 first_witness=any(d['sourceId']=='tabelog' and d['sourceEntityId'] in ids for d in s['firstBatchDetails'])
 listing_witness=any(l['sourceId']=='tabelog' and any(o['sourceEntityId'] in ids for o in l['outlets']) for l in s['listings'])
 control=True
 if p['caseId']=='p2-kf-h001-20261027':control=counts.get('tabelog',0)>=4 and counts.get('tablecheck',0)>=5 and first_witness and listing_witness and not s['failureCodes']
 passed=region_ok and observed and no_budget and within and valid_window and control and s['boundary']['status']=='ABSENT'
 rows.append({'index':p['index'],'caseId':p['caseId'],'repeat':p['repeat'],'status':'SATISFIED' if passed else 'NOT_SATISFIED','region':first.get('url'),'expectedRegion':expected,'regionCorrect':region_ok,'rawSnapshotCorroboratesRegion':observed,'noReadBudgetExceeded':no_budget,'withinOriginalBudget':within,'validWitnessWindow':valid_window,'h001NonRegression':control if p['caseId']=='p2-kf-h001-20261027' else 'NOT_APPLICABLE','parsedInRadiusBySource':counts,'nativeCandidateDistances':distances,'tabelogWitnessInListing':listing_witness,'tabelogWitnessInFirstBatch':first_witness,'modelCalls':s['resources']['modelCalls'],'elapsedMs':s['resources']['elapsedMs'],'failureCodes':s['failureCodes'],'boundary':s['boundary'],'summary':a['summary'],'summarySha256':sha(a['summary']),'traceSha256':sha(directory/'trace.jsonl'),'decisionsSha256':sha(directory/'probe.decisions.jsonl')})
status='PASS' if len(ledger['completed'])==5 and all(r['status']=='SATISFIED' for r in rows) else 'FAIL' if any(r['status']=='NOT_SATISFIED' for r in rows) else 'INCOMPLETE'
out={'status':status,'scope':'LIVE_READ_ONLY_DISCOVERY_DIAGNOSTICS; exposed development; 2+2 targets and one control, no statistical success rate','layers':{'endToEnd':'NOT_EVALUATED: no inventory or final task delivery','stages':'Expected literal region corroborated by raw snapshots; no read budget overrun; h001 parsed-candidate and witness control','severity':'Existing independent read-boundary audit; no delivery claims; HARD/identity/inventory quality not evaluated here','attribution':'Controlled code baseline and fixed input comparison against B; no claim that all improvement is caused by P2-1c alone'},'rows':rows,'ledgerSha256':sha(base/'ledger.json'),'models':ledger['models'],'formalProbes':sum(a.get('formalProbeStarted') is True for a in ledger['attempts']),'stop':ledger['stop']}
with (base/'evaluation.json').open('x') as f:json.dump(out,f,ensure_ascii=False,indent=2);f.write('\n')
print(json.dumps({'status':status,'rows':[{'index':r['index'],'caseId':r['caseId'],'status':r['status'],'region':r.get('region'),'failureCodes':r.get('failureCodes')} for r in rows]},ensure_ascii=False,indent=2))
