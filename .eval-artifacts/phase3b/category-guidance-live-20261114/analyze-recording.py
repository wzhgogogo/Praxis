"""Post-run read-only derivation; no network/model/browser imports. Originals remain unchanged."""
from pathlib import Path
import json,collections,hashlib,urllib.parse,base64,datetime
root=Path(__file__).resolve().parent;config=json.loads((root/'config.json').read_text());slot=Path(config['output'])/'runtime'/config['id'];read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
x=read(slot/'execution.result.json');v=x['view']['restaurant'];ei=read(slot/'evaluation.input.json');ev=read(slot/'evaluation.json');ds=[json.loads(l)for l in (slot/'execution.decisions.jsonl').read_text().splitlines()if l.strip()];events=read(slot/'browser-diagnostics.json')['events'];rec=read(slot/'recording-observation.json');rp=Path(rec['recordingPath']);har=read(rp/'replay.har')['log']['entries'];candidate={c['restaurant']['id']:c['restaurant']for c in v['candidates']}
trajectory=[]
for d in ds:
 if d['purpose']!='browser_read_decide':continue
 u=json.loads(d['messages'][-1]['content']);a=json.loads(d['outputText']);o=u['observation'];t=next((t for t in o.get('targets',[])if t.get('ref')==a.get('targetRef')),None)
 trajectory.append({'sequence':d['sequence'],'startedAtUTC':d['startedAt'],'latencyMs':d['latencyMs'],'source':u['source'],'stage':u['stage'],'url':o['url'],'action':a,'selectedTarget':t,'progress':u.get('progress')})
(root/'decision-trajectory.json').write_text(json.dumps(trajectory,ensure_ascii=False,indent=2)+'\n')
scopes=[];active=None
for e in events:
 if e['event']=='PROVIDER_STARTED':active={'source':e['source'],'candidateId':e.get('candidateId'),'startSequence':e['sequence'],'startedAtUTC':e['at'],'events':[e]};continue
 if active and e.get('candidateId')==active['candidateId'] and e['source']==active['source']:
  active['events'].append(e)
  if e['event']=='PROVIDER_FINISHED':
   phases=collections.Counter();rows=active.pop('events')
   for a,b in zip(rows,rows[1:]):phases[a['stage']]+=max(0,b['lifecycle']['providerElapsedMs']-a['lifecycle']['providerElapsedMs'])
   active.update(endSequence=e['sequence'],finishedAtUTC=e['at'],totalMs=e['lifecycle']['providerElapsedMs'],modelCalls=e['lifecycle']['providerModelCalls'],operations=e['lifecycle']['providerRuntimeOperations'],outcome=e['lifecycle']['outcome'],reason=e['lifecycle'].get('reason'),phaseMs=dict(phases),name=candidate.get(active['candidateId'],{}).get('outletName'))
   scopes.append(active);active=None
purpose=collections.defaultdict(lambda:{'calls':0,'latencyMs':0,'inputTokens':0,'outputTokens':0})
for d in ds:
 row=purpose[d['purpose']];row['calls']+=1;row['latencyMs']+=d.get('latencyMs',0)
 # Token usage is preserved in the original decision file, where available.
 for k in ['inputTokens','outputTokens']:row[k]+=(d.get('usage')or{}).get(k,0)
sumikaId=ei['delivered'][0]['candidateId'];check=v['availabilityChecks'][sumikaId];sc=next(s for s in scopes if s['candidateId']==sumikaId and 'AVAILABILITY'in s['phaseMs']);slice_=[e for e in events if sc['startSequence']<=e['sequence']<=sc['endSequence']];lastSnap=max((e for e in slice_ if e['event']=='OPERATION_FINISHED' and e.get('operation')=='SNAPSHOT'),key=lambda e:e['sequence']);tail=[e for e in slice_ if e['sequence']>=lastSnap['sequence']];terminal={'candidateId':sumikaId,'availabilityStatus':check['status'],'lastSnapshotSequence':lastSnap['sequence'],'lastSnapshotProviderElapsedMs':lastSnap['lifecycle']['providerElapsedMs'],'providerFinishedSequence':sc['endSequence'],'providerTotalMs':sc['totalMs'],'observeControlsAfterLastSnapshot':sum(e['event']=='OPERATION_STARTED'and e.get('operation')=='OBSERVE_CONTROLS' for e in tail),'tail':tail,'recordedSnapshots':[p['snapshot']for p in rec['pages']if p.get('url')=='https://tabelog.com/en/tokyo/A1319/A131902/13309182/']}
raw=[]
for n,e in enumerate(har):
 url=e['request']['url'];u=urllib.parse.urlparse(url);q=urllib.parse.parse_qs(u.query)
 if q.get('rst_id')!=['13309182']or not u.path.endswith('/find_vacancy'):continue
 content=e['response'].get('content',{});text=content.get('text','');text=base64.b64decode(text).decode()if content.get('encoding')=='base64'else text;b=json.loads(text);sel=b.get('selection')or{};choices=sel.values()if isinstance(sel,dict)else sel
 wanted=[z for z in choices if z.get('time')=='20:30'];raw.append({'harIndexZeroBased':n,'url':url,'status':e['response']['status'],'base_date':b.get('base_date'),'members':b.get('members'),'time2030':wanted,'handoffLiteralSourceMatch':any(urllib.parse.urljoin(url,z.get('url',''))==ei['handoffs'][0]['url']for z in wanted),'bodySHA256':hashlib.sha256(text.encode()).hexdigest()})
counts=collections.Counter((c['rule'],c['status'])for c in ev['checks']);facts33=next(d for d in ds if d['sequence']==33);eligible=json.loads(facts33['messages'][-1]['content']);present=next(e for e in x['execution']['events']if e['occurredAt']==max(z['occurredAt']for z in x['execution']['events']));dt=lambda s:datetime.datetime.fromisoformat(s.replace('Z','+00:00'))
qualifiedApplied=next(e['occurredAt']for e in x['execution']['events']if e['event']['type']=='CANDIDATE_FACTS_CHECKED')
additional={'readyContextDecisionSequence':33,'explicitDecision':json.loads(facts33['outputText']),'presentationAtUTC':present['occurredAt'],'factBatchAppliedAtUTC':qualifiedApplied,'additionalSecondsAfterFactBatch':(dt(present['occurredAt'])-dt(qualifiedApplied)).total_seconds(),'note':'Read-only observation: model sought remaining outlets for default3-result batch although Sumika was already eligible; no policy/flow change here.'}
ledger=read(root/'active-budget.json');remaining={k:ledger['limits'][k]-ledger['cumulative'][k]for k in ledger['limits']};health=read(root/'live/network-health.json');requestHeaders=sum(len(e['request'].get('headers',[]))for e in har);cookies=sum(len(e['request'].get('cookies',[]))for e in har)
audit={'sourceSHA':config['sourceSHA'],'sourceCodeSHA':config['sourceCodeSHA'],'outerFreezeSHA':'93e46eb4bdeceb63317f6f6702770ab76aa7c137','verdict':ev['verdict'],'nonPassChecks':[c for c in ev['checks']if c['status']!='PASS'],'delivered':ei['delivered'],'handoffs':ei['handoffs'],'postDeliveryChecks':ei.get('postDeliveryChecks'),'productElapsedMs':ei['deadline']['elapsedMs'],'turnBudgets':ei['deadline']['turns'],'outerElapsedMs':read(root/'live/development-receipt.json')['finishedAtMs']-int(read(root/'live/input-hashes.json')['attemptId'].rsplit(':',1)[1]),'checkCounts':[{'rule':k[0],'status':k[1],'count':n}for k,n in counts.items()],'providerScopes':scopes,'purposeCosts':dict(purpose),'terminalSkip':terminal,'rawVacancyEvidence':raw,'additionalBatchCost':additional,'candidates':[{'id':k,'name':c['outletName'],'nativeUri':c['sourceIds'].get('tabelogNativeDetailUri'),'availability':v['availabilityChecks'].get(k)}for k,c in candidate.items()],'recording':{k:rec[k]for k in ['qualifiedPages','totalPages','replayStatus']},'recordingExceptions':[p for p in rec['pages']if not p['qualified']],'health':health,'ledgerCumulative':ledger['cumulative'],'ledgerRemaining':remaining,'evidenceHashes':{p.name:sha(p)for p in [slot/'evaluation.json',slot/'evaluation.input.json',slot/'execution.result.json',slot/'execution.decisions.jsonl',rp/'replay.har']},'HARprivacy':{'requestHeaderCount':requestHeaders,'requestCookieCount':cookies},'reviewStatus':'PENDING_REVIEW: independent qualification semantic annotation absent. No original evaluation rewritten, no automatic qualification granted.'}
(root/'run-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'providers':[{'name':s['name']or s['source'],'ms':s['totalMs'],'phases':s['phaseMs'],'models':s['modelCalls']}for s in scopes],'terminalSkip':{k:terminal[k]for k in ['lastSnapshotSequence','lastSnapshotProviderElapsedMs','observeControlsAfterLastSnapshot','providerTotalMs','recordedSnapshots']},'raw8':[a for a in raw if a['members']==8],'remaining':remaining,'afterEligibleSeconds':additional['additionalSecondsAfterFactBatch']},ensure_ascii=False))
