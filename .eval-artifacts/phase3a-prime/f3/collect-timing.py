"""Offline retrospective measurements from immutable historical Git blobs; never a Runner."""
import subprocess,pathlib,json,gzip,hashlib,datetime as dt,collections,math
REF='e169e606b41e1ef97f408efde834112810dd467d';p=pathlib.Path('.eval-artifacts/phase3a-prime/f3');inputs=[]
def read(path):
 b=subprocess.check_output(['git','show',REF+':'+path]);inputs.append({'ref':REF,'path':path,'sha256':hashlib.sha256(b).hexdigest()});return gzip.decompress(b) if path.endswith('.gz') else b
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',REF,'--','.eval-artifacts/phase3a-prime/f5-live/evidence','.eval-artifacts/phase3a-prime/f5-live-rerun/evidence'],text=True).splitlines();results=[x for x in paths if x.endswith('.result.json.gz')];rows=[];calls=[];closing=[]
ms=lambda text:dt.datetime.fromisoformat(text.replace('Z','+00:00')).timestamp()*1000
for file in results:
 a=json.loads(read(file));decision=file.replace('.result.json.gz','.decisions.jsonl.gz');ds=[json.loads(x) for x in read(decision).decode().splitlines()];run=[]
 for index,t in enumerate(a.get('trajectories',[]),1):
  kind=t.get('agentAction',{}).get('type');duration=t.get('executionMetadata',{}).get('latencyMs')
  if isinstance(duration,(int,float)):rows.append({'artifact':file,'trajectory':index,'action':kind,'durationMs':duration,'stepOutcome':t.get('stepOutcome')})
 for line,d in enumerate(ds,1):
  if d['purpose']!='restaurant_agent_decide':continue
  duration=d.get('latencyMs');
  if isinstance(duration,(int,float)):calls.append({'artifact':file,'decisionLine':line,'latencyMs':duration})
  try:proposal=json.loads(d.get('outputText') or '{}');action=proposal.get('type',proposal.get('action',{}));action=action.get('type') if isinstance(action,dict) else action
  except ValueError:action=None
  if action in ['END_READ','PRESENT_RESULTS'] and d.get('latencyMs') is not None:closing.append({'artifact':file,'decisionLine':line,'action':action,'modelMs':d['latencyMs'],'afterModelUntilArtifactEndMs':round(ms(a['finishedAt'])-(ms(d['startedAt'])+d['latencyMs']))})
def stats(values):
 values=sorted(values);n=len(values);return {'n':n,'minMs':values[0],'medianMs':values[n//2] if n%2 else (values[n//2-1]+values[n//2])/2,'p90NearestRankMs':values[math.ceil(.9*n)-1],'p95NearestRankMs':values[math.ceil(.95*n)-1],'maxMs':values[-1]}
actions={k:stats([x['durationMs'] for x in rows if x['action']==k]) for k in sorted({x['action'] for x in rows})}
rerun=json.loads(read('.eval-artifacts/phase3a-prime/f5-live-rerun/aggregate.json'));censored=[{'slot':s['slot'],'kind':'CHECK_AVAILABILITY','observedTailToArtifactEndMs':s['timeoutAction']['elapsedUntilArtifactEndMs'],'remainingAtActionStartMs':s['timeoutAction']['remainingRunMsAtActionStart'],'decisionLine':s['timeoutAction']['lastRootDecisionLine'],'reason':'Unpersisted/right-censored tail to artifact end; includes cleanup, not a completed action duration or exact operation lower bound.'} for s in rerun['slots']]
output={'kind':'OFFLINE_TIMING_FROM_FIXED_LIVE_BLOBS','runs':len(results),'completedActionLatency':actions,'rootDecisionLatency':stats([x['latencyMs'] for x in calls]),'closingObserved':closing,'completedActionRows':rows,'rootDecisionRows':calls,'rightCensoredActions':censored,'inputs':inputs,'newRealCalls':0};(p/'timing-evidence.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:output[k] for k in ['runs','completedActionLatency','rootDecisionLatency','closingObserved','rightCensoredActions']},ensure_ascii=False))
