from pathlib import Path
import collections,datetime,gzip,hashlib,json,re

out=Path('.eval-artifacts/phase3b/g4-name-resolution')
inputs=[]
def read(path):
    b=path.read_bytes();inputs.append({'path':str(path),'sha256':hashlib.sha256(b).hexdigest()})
    return json.loads(gzip.decompress(b) if path.suffix=='.gz' else b)
def ms(text):return datetime.datetime.fromisoformat(text.replace('Z','+00:00')).timestamp()*1000
def elapsed(a,b):return round(ms(b)-ms(a))
def brief(text):return re.sub(r'\x1b\[[0-9;]*m','',str(text))[:380]
rows=[]
for folder in ['f5-live','f5-live-rerun']:
    for path in sorted(Path('.eval-artifacts/phase3a-prime',folder,'evidence').glob('*.result.json.gz')):
        a=read(path);state=a['finalSnapshot']['domainState'];candidates=state.get('candidates',{})
        candidates=list(candidates.values()) if isinstance(candidates,dict) else candidates
        candidate=next((c for c in candidates if 'dengana' in c['restaurant']['outletName'].lower()),None)
        row={'artifact':str(path),'caseId':a['caseId'],'startedAt':a['startedAt'],'finishedAt':a['finishedAt'],'runElapsedMs':a.get('latencyMs'),
             'applicability':'DENGANA_FOUND' if candidate else 'OTHER_REQUEST_NO_DENGANA','providers':[]}
        if not candidate:
            rows.append(row);continue
        cid=candidate['restaurant']['id'];row['candidate']=candidate['restaurant']
        trace=[r for r in a['diagnostics'].get('browserTrace',[]) if r.get('detail',{}).get('candidateId')==cid]
        trace.sort(key=lambda r:(ms(r['at']),r.get('sequence',0)))
        row['matchingTraceEvents']=len(trace)
        row['providerAttempts']=[p for t in a['trajectories'] for p in t.get('executionMetadata',{}).get('providerAttempts',[]) if p.get('candidateId')==cid]
        row['trajectories']=[{'stepNumber':t['stepNumber'],'at':t['occurredAt'],'action':t.get('agentAction'),'latencyMs':t.get('executionMetadata',{}).get('latencyMs'),'stepOutcome':t.get('stepOutcome')}
                             for t in a['trajectories'] if cid in t.get('agentAction',{}).get('candidateIds',[])]
        row['tabelogIdentity']=[d for d in a['diagnostics'].get('tabelogIdentity',[]) if d.get('candidateId')==cid]
        row['tablecheckIdentity']=[d for d in a['diagnostics'].get('tablecheckIdentity',[]) if d.get('candidateId')==cid]
        row['candidateFirstObservedAt']=trace[0]['at'] if trace else None
        row['beforeCandidateFirstTraceMs']=elapsed(a['startedAt'],trace[0]['at']) if trace else None
        row['runRemainingAtFirstCandidateTraceMs']=elapsed(trace[0]['at'],a['finishedAt']) if trace else None
        sources=list(dict.fromkeys(r['detail'].get('source') for r in trace))
        for source in sources:
            events=[r for r in trace if r['detail'].get('source')==source]
            starts=[r for r in events if r['detail'].get('event')=='PROVIDER_STARTED'];ends=[r for r in events if r['detail'].get('event')=='PROVIDER_FINISHED']
            start=(starts or events)[0];end=ends[-1] if ends else events[-1]
            stopped=bool(starts) and not bool(ends)
            boundary=a['finishedAt'] if stopped else end['at']
            phases=collections.Counter();operation_stack=[];operations=[];model_start=None;models=[]
            for index,event in enumerate(events):
                d=event['detail'];kind=d.get('event');at=event['at']
                if index+1<len(events) and ms(at)<=ms(boundary):
                    right=min(ms(events[index+1]['at']),ms(boundary));phases[d.get('stage','UNKNOWN')]+=max(0,round(right-ms(at)))
                if kind=='OPERATION_STARTED':operation_stack.append(event)
                if kind=='OPERATION_FINISHED':
                    eligible=[j for j,x in enumerate(operation_stack) if x['detail'].get('detail')==d.get('detail')]
                    if eligible:
                        begin=operation_stack.pop(eligible[-1]);operations.append({'operation':begin['detail'].get('detail'),'stage':begin['detail'].get('stage'),'elapsedMs':elapsed(begin['at'],at),'outcome':'FINISHED'})
                if kind=='OPERATION_FAILED' and operation_stack:
                    begin=operation_stack.pop();operations.append({'operation':begin['detail'].get('detail'),'stage':begin['detail'].get('stage'),'elapsedMs':elapsed(begin['at'],at),'outcome':'FAILED','reason':brief(d.get('detail'))})
                if kind=='MODEL_DECISION_STARTED':model_start=event
                if kind in ['MODEL_DECISION_FINISHED','MODEL_DECISION_FAILED'] and model_start:
                    models.append({'startedAt':model_start['at'],'finishedAt':at,'elapsedMs':elapsed(model_start['at'],at),'outcome':kind});model_start=None
            if stopped and events:phases[events[-1]['detail'].get('stage','UNKNOWN')]+=max(0,elapsed(events[-1]['at'],boundary))
            grouped={}
            for op in operations:
                key=op['operation'];stats=grouped.setdefault(key,{'count':0,'elapsedMs':0,'failed':0});stats['count']+=1;stats['elapsedMs']+=op['elapsedMs'];stats['failed']+=op['outcome']=='FAILED'
            queries=[]
            for event in events:
                d=event['detail']
                if d.get('url') and d['url'] not in queries:queries.append(d['url'])
            row['providers'].append({'source':source,'providerScopeRecorded':bool(starts),'activityOnlyWithoutProviderScope':not bool(starts),
                'startedAt':start['at'],'finishedAt':end['at'] if not stopped else None,
                'recordedProviderElapsedMs':end['detail'].get('lifecycle',{}).get('providerElapsedMs') if ends else None,
                'observedWallMs':elapsed(start['at'],boundary),'rightCensored':stopped,
                'stageWallMsFromEventBoundaries':dict(phases),'completedOperationDurations':grouped,'operations':operations,
                'modelDecisions':models,'unfinishedModel':({'startedAt':model_start['at'],'tailToArtifactEndMs':elapsed(model_start['at'],a['finishedAt']),'interpretation':'Censored tail includes shutdown; not exact completed model latency'} if model_start else None),
                'unfinishedOperations':[{'operation':x['detail'].get('detail'),'startedAt':x['at']} for x in operation_stack],
                'observedUrls':queries,'eventCounts':dict(collections.Counter(x['detail'].get('event') for x in events)),
                'errors':[{'at':x['at'],'event':x['detail'].get('event'),'stage':x['detail'].get('stage'),'reason':brief(x['detail'].get('detail'))} for x in events if x['detail'].get('event') in ['REJECTED','OPERATION_FAILED','MODEL_DECISION_FAILED','METHOD_INCOMPLETE']]})
        rows.append(row)
assert len(rows)==8 and sum(r['applicability']=='DENGANA_FOUND' for r in rows)==6
result={'schema':'phase3b-dengana-retrospective@2','mode':'OFFLINE_IMMUTABLE_LIVE_ARTIFACT_ANALYSIS','newRealCalls':0,
        'runs':8,'applicableDenganaRuns':6,'otherRequestRuns':2,'timingCaveats':'Stage durations use recorded event boundaries. Operation and model durations overlap; do not add to stage totals. An actually started provider without finish is censored; helper WEBSITE events without provider scope are only an observed activity window, not a separate provider or a censored tail. Run end includes termination/cleanup.',
        'witnessIdentity':{'outletId':'13108466','name':'Kushi Katsu Dengana Akabane ten','address':'東京都北区赤羽1-15-1 新仲ビル1F','source':'User supplied and existing certified F5 evidence; never injected into production comparison'},'rows':rows,'inputs':inputs}
(out/'dengana.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
for row in rows:
    print(row['artifact'].split('/')[-1],row['applicability'],[(p['source'],p['observedWallMs'],p['stageWallMsFromEventBoundaries'],p['rightCensored']) for p in row['providers']],row.get('providerAttempts'))
