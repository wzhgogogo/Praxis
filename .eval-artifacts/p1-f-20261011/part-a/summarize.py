import json, pathlib, hashlib, math
root=pathlib.Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing')
batch=root/'.eval-artifacts/p1-f-20261011'
rows=[]
for v in json.loads((batch/'witnesses.p1f-20261011.json').read_text())['variants']:
 cid=v['variantId'];directory=batch/'part-a'/cid
 finishes=sorted(directory.glob('attempt-*.finish.json'))
 if not finishes: rows.append({'caseId':cid,'status':'NOT_RUN'});continue
 for fp in finishes:
  f=json.loads(fp.read_text());row={'caseId':cid,'attempt':f['attempt'],'orchestration':str(fp),'stop':f.get('stop'),'resultPaths':f['results'],'witnessRaw':f['witness']}
  if not f['results']:
   partialPath=directory/f"attempt-{f['attempt']}.interruption.json"
   partial=json.loads(partialPath.read_text()) if partialPath.exists() else {}
   row.update(status=partial.get('status','NO_FORMAL_RESULT'),wallMs=f['wallMs'],models=partial.get('modelCallsCaptured',0),google=None,partial=partial)
   ilog=directory/'interrupted-started-evaluator.log'
   if ilog.exists():
    ie=json.loads(ilog.read_text());row.update(evaluationPath=ie['outputPath'],evaluation=ie['execution'],evaluatorInputKind='STARTED_ONLY_NOT_FORMAL_RESULT')
   rows.append(row);continue
  ap=pathlib.Path(f['results'][0]);a=json.loads(ap.read_text());s=a.get('finalSnapshot',{}).get('domainState',{});u=a.get('resourceUsage',{})
  ep=directory/'postrun-evaluator.log'
  if ep.exists() and ep.stat().st_size:
   epath=json.loads(ep.read_text())['outputPath']
  else:
   es=sorted(ap.parent.glob(ap.stem+'.evaluation.27-*.json'));epath=str(es[-1]) if es else None
  e=json.loads(pathlib.Path(epath).read_text()) if epath else {}
  if epath:assert e['evaluatorVersion']=='restaurant-hybrid-read-diagnostic-evaluator@27', e['evaluatorVersion']
  if epath:assert e['sourceArtifact']['sha256']==hashlib.sha256(ap.read_bytes()).hexdigest()
  dc=a.get('decisionCapture',{});dpath=dc.get('path');ds=[json.loads(x)for x in pathlib.Path(dpath).read_text().splitlines()]if dpath else []
  checkedCalls=u.get('modelCallsStarted',len(a.get('modelInvocations',[])))
  ids=s.get('presentedResults',{}).get('candidateIds',[]);evidence=s.get('readEvidence',[]);center=s.get('searchContinuation',{}).get('locationContext')
  locationEvidence=[ev for ev in evidence if 'locationResolutionQuery' in ev.get('claims',{})]
  deliveries=[]
  for cid2 in ids:
   c=next(c for c in s['candidates'] if c['restaurant']['id']==cid2);r=c['restaurant'];evs=[ev for ev in evidence if ev.get('candidateId')==cid2]
   distances=[ev['claims']['distanceMeters'] for ev in evs if 'distanceMeters' in ev.get('claims',{})]
   deliveries.append({'candidateId':cid2,'name':r['outletName'],'providers':sorted(set(ev['provider']for ev in evs)),'sourceIds':r.get('sourceIds',{}),'coordinates':r.get('coordinates'),'distanceMeters':distances[-1]if distances else None,'distanceBasis':'Observed discovery evidence claims.distanceMeters'})
  timeouts=[]
  def walk(obj,path=''):
   if isinstance(obj,dict):
    for k,vv in obj.items():
     p=path+'.'+k
     if k in ('code','failureCode','reasonCode','errorCode')and isinstance(vv,str)and 'TIMEOUT'in vv:timeouts.append({'path':p,'code':vv})
     else:walk(vv,p)
   elif isinstance(obj,list):
    for i,vv in enumerate(obj):walk(vv,path+f'[{i}]')
  walk({'diagnostics':a.get('diagnostics'),'trajectories':a.get('trajectories'),'termination':a.get('termination'),'failureCode':a.get('failureCode')})
  wait=u.get('postActionWaitTotalMs',0);elapsed=u.get('elapsedMs',a.get('latencyMs'))
  row.update(status=a.get('status'),phase=s.get('phase'),failureCode=a.get('failureCode'),termination=a.get('termination'),cohort=a['runtimeContext']['dataset']['cohort'],commitSha=a['runtimeContext']['commitSha'],worktree=a['runtimeContext']['worktree'],deliveryCount=len(ids),deliveries=deliveries,locationContext=center,locationResolutionEvidence=locationEvidence,googlePlaceTypes='NOT_RETAINED_BY_FROZEN_RUNNER',elapsedMs=elapsed,models=checkedCalls,google=u.get('googleRequests',{}).get('total',0),googleBreakdown=u.get('googleRequests'),waitMs=wait,waitPercent=round(100*wait/elapsed,2)if elapsed else None,browserTimeout=any(t["code"]=="BROWSER_TIMEOUT" for t in timeouts),timeoutReferences=timeouts,evaluationPath=epath,evaluation=e.get('execution'),evaluatorFindings=e.get('findings'),decisionsPath=dpath,decisionCount=len(ds),decisionCountMatchesModelCalls=len(ds)==checkedCalls,recording=a.get('browserRecording'),resourceUsage=u)
  rows.append(row)


summary={'frozenCommit':'73bfca588ad5007a4a9326c8c13a958718898f1c','rows':rows,'batchModelCalls':sum(r.get('models',0)for r in rows),'batchGoogleRequests':sum((r.get('google') or 0)for r in rows),'modelCallsCumulative':416+sum(r.get('models',0)for r in rows),'wholeLiveCumulative':17+sum(r.get('status')!='NOT_RUN'for r in rows),'environmentRetriesUsed':sum(r.get('attempt',1)-1 for r in rows if r.get('attempt',1)>1),'googleTotalIsComplete':all(r.get('google') is not None for r in rows if r.get('status')!='NOT_RUN'),'independentAttribution':'PENDING'}
(batch/'part-a/summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items()if k!='rows'}))
