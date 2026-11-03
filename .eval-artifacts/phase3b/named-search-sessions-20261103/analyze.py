from pathlib import Path
import json,subprocess,hashlib,collections,datetime
from urllib.parse import urlparse,parse_qs
r=Path(__file__).parent;manifest=json.loads((r/'inputs.json').read_text());rev=manifest['revision']
def read(path):return subprocess.check_output(['git','show',rev+':'+path])
for item in manifest['files']:assert hashlib.sha256(read(item['path'])).hexdigest()==item['sha256']
allrows=[];summary={};branches=[]
for run in ['D4','D8']:
    root=f'.eval-artifacts/phase3b/g6-supplement-20261103/runs/{run}/{run}/'
    recordPath=next(x['path'] for x in manifest['files'] if x['path'].startswith(root) and x['path'].endswith('/recording.json'))
    record=json.loads(read(recordPath));trace=json.loads(read(root+'browser-trace.json'))['events'];result=json.loads(read(root+'execution.result.json'))
    decisions=[json.loads(line) for line in read(root+'execution.decisions.jsonl').splitlines()]
    candidates={c['restaurant']['id']:c['restaurant'] for c in result['view']['restaurant']['candidates']}
    actions=[t for t in result['execution']['trajectories'] if t['agentAction']['type'] in ['CHECK_AVAILABILITY','INVESTIGATE_CANDIDATE_FACTS']]
    ids=[cid for t in actions for cid in t['agentAction']['candidateIds']]
    opened=[e for e in record['entries'] if e['kind']=='SESSION_OPENED'];assert len(opened)==len(manifest['bindings'][run])
    groups={};session=0;pageOrdinal=0
    traceCalls=[e for e in trace if e['kind']=='SESSION_CALL' and e['detail']['method']=='navigate'];callOrdinal=0
    for e in record['entries']:
        if e['kind']=='SESSION_OPENED':session+=1;groups[session]={'start':e['sequence'],'navigations':[],'snapshots':[],'errors':[],'at':e['detail']['startedAt']}
        if e['kind']=='SESSION_ERROR':groups[session]['errors'].append({'sequence':e['sequence'],'method':e['detail']['method'],'code':e['detail']['error'].get('code')})
        if e['kind']=='SNAPSHOT':pageOrdinal+=1;groups[session]['snapshots'].append({'sequence':e['sequence'],'ordinal':pageOrdinal,'url':next((p.get('url') for p in record['pages'] if p['snapshot']==pageOrdinal),None)})
        if e['kind']=='SESSION_CALL' and e['detail']['method']=='navigate':
            t=traceCalls[callOrdinal];callOrdinal+=1;assert t['detail']['args']==e['detail']['args']
            groups[session]['navigations'].append({'sequence':e['sequence'],'recordedUrl':e['detail']['args'][0],'at':t['at'],'timeoutMs':e['detail']['args'][1].get('timeoutMs')})
    for s,g in groups.items():
        index=manifest['bindings'][run][s-1];cid=ids[index] if index is not None else None;candidate=candidates.get(cid)
        step=next((t['stepNumber'] for t in actions if cid in t['agentAction']['candidateIds']),None)
        if cid is None:step=max(t['stepNumber'] for t in result['execution']['trajectories'] if t['agentAction']['type']=='SEARCH_RESTAURANTS' and t['occurredAt']<=g['at'])
        if index is None:reason='NATIVE_DISCOVERY_SESSION; not a named-source model call'
        elif s==1 or manifest['bindings'][run][s-2]!=index:reason='NEW_SINGLE_CANDIDATE_READ: Router checkpoint creates LiveBrowserAvailability.read executor; previous checkpoint closes it'
        else:reason='REACQUIRE_AFTER_RUNTIME_FAILURE within same candidate; executor retires the failed source session'
        end=opened[s]['detail']['startedAt'] if s<len(opened) else '9999'
        model=[]
        for d in decisions:
            if d['purpose']!='browser_read_decide' or not(g['at']<=d['startedAt']<end):continue
            ctx=json.loads(next(m['content'] for m in d['messages'] if m['role']=='user'))
            if ctx.get('source')=='TABLECHECK' and ctx.get('objective')=='Reveal public TableCheck restaurant search results without submitting a reservation.':model.append({'sequence':d['sequence'],'at':d['startedAt'],'goalName':ctx['goal']['outlet']['name']})
        if run=='D8':
            assert model and candidate and model[0]['goalName']==candidate['outletName']
            tc=[x for x in g['navigations'] if '/japan/search' in x['recordedUrl']];tab=[x for x in g['navigations'] if 'tabelog.com' in x['recordedUrl']]
            assert len(tc)==(1 if s==1 else 2) and tc[-1]['at']<model[-1]['at']<tab[0]['at']
            branches.append({'run':run,'session':s,'candidateId':cid,'name':candidate['outletName'],'exit':'NO_OUTLET_URLS_AFTER_EXPLORATION','classification':'SOURCE_AND_DECISION_PATH_INFERENCE','lastTableCheckNavigate':tc[-1]['sequence'],'browserDecisionWitnesses':model,'nextTabelogNavigate':tab[0]['sequence'],'basis':'Generic discovery model can only run after the initial query gate passes. Last TC navigation precedes a generic model call; no later explicit TC navigate before fallback. Final providerAttempts code is INCOMPLETE. Thus terminal return is the late empty-outlet branch, not initial query mismatch. Post-exploration query mismatch vs absent links still unknown.'})
        occurrence=collections.Counter()
        for nav in g['navigations']:
            path=urlparse(nav['recordedUrl']).path
            if '/rstLst/' not in path and '/japan/search' not in path:continue
            source='TABELOG' if 'tabelog.com' in nav['recordedUrl'] else 'TABLECHECK';occurrence[source]+=1
            nextNav=next((n['sequence'] for n in g['navigations'] if n['sequence']>nav['sequence']),10**9)
            observed=[p for p in g['snapshots'] if nav['sequence']<p['sequence']<nextNav]
            chain='Agent '+('SEARCH_RESTAURANTS -> native discovery' if cid is None else f'{actions[0]["agentAction"]["type"] if run=="D8" else "CHECK_AVAILABILITY"} -> Router candidateCheckpoints(single) -> assembly -> LiveBrowserAvailability.read -> AvailabilitySourceResolver -> '+source+'.check -> executor.acquire -> navigate')
            allrows.append({'run':run,'session':s,'sequence':nav['sequence'],'source':source,'candidateId':cid,'candidateName':candidate['outletName'] if candidate else None,'agentStep':step,'callChain':chain,'sessionCreationReason':reason,'entranceWithinSession':occurrence[source],'entranceReason':'SOURCE_ENTRY' if occurrence[source]==1 else 'REENTRY_SAME_SESSION; alternative/busy/model navigation needs query provenance, not proved identical','recordedUrl':nav['recordedUrl'],'requestedFullQuery':'NOT_RECORDED in SESSION_CALL','observedPages':observed,'timeoutMs':nav['timeoutMs'],'atUTC':nav['at']})
    rows=[x for x in allrows if x['run']==run]
    summary[run]={'sessions':len(groups),'searchEntrances':{source:{'calls':sum(x['source']==source for x in rows),'sessions':len({x['session'] for x in rows if x['source']==source})} for source in ['TABELOG','TABLECHECK']},'namedSourceModelCalls':sum(x['purpose']=='restaurant_named_source_query' for x in decisions),'modelCreatesSessions':False}
output={'mode':'OFFLINE_SAVED_RECORD_DIAGNOSIS','summary':summary,'searchEntrances':allrows,'tablecheckD8Branch':branches,'realExternalCalls':0,'limits':'No waterfall, speedup, duplicate exact-query proof, or new Live rate is inferred.'}
(r/'analysis.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
table=['# Every search-entrance navigation','', '|Run|Seq|Session|Source|Candidate|Agent step|New-session cause|Within-session visit|','|---|---:|---:|---|---|---:|---|---:|']
for x in allrows:table.append('|'+ '|'.join(str(x[k]) for k in ['run','sequence','session','source','candidateName','agentStep','sessionCreationReason','entranceWithinSession'])+'|')
(r/'entrances.md').write_text('\n'.join(table)+'\n')
print(json.dumps({'summary':summary,'rows':len(allrows),'D8Branches':[x['exit'] for x in branches]},indent=2))
