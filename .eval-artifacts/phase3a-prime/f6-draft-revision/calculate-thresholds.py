# Offline arithmetic only. Historical evidence is read from one immutable Git blob.
import hashlib,json,pathlib,statistics,subprocess
ref='afd9c4e1aa78a21aaa6a6363089f218cc6d679e3'
path='.eval-artifacts/phase3a-prime/f3/timing-evidence.json'
raw=subprocess.check_output(['git','show',f'{ref}:{path}']); evidence=json.loads(raw)
rows=evidence['completedActionRows']; assert len(rows)==62
result={'mode':'OFFLINE_ARITHMETIC_NOT_RUNTIME','fixedReserveMs':20000,'timingInput':{'git':ref,'path':path,'sha256':hashlib.sha256(raw).hexdigest()},'completedSamples':62,'rightCensoredExcluded':len(evidence['rightCensoredActions']),'actions':{}}
for action in sorted({row['action'] for row in rows}):
 ordered=sorted([r for r in rows if r['action']==action],key=lambda r:r['durationMs']);n=len(ordered)
 middle=ordered[(n-1)//2:n//2+1];median=statistics.median(r['durationMs'] for r in ordered)
 result['actions'][action]={'n':n,'medianMs':median,'admissionMs':20000+median,'middleRows':middle}
result['eventModelInputs']=[]
for p in ['src/application/restaurant-execution-router.ts','src/application/restaurant-agent-loop.ts','src/domains/restaurant/contracts.ts','src/domains/restaurant/task-definition.ts','src/integrations/restaurant-availability/availability-source-resolver.ts','src/integrations/restaurant-search/native-restaurant-search.ts','src/harness/restaurant-execution-router.test.ts']:
 b=subprocess.check_output(['git','show',f'{ref}:{p}']);result['eventModelInputs'].append({'git':ref,'path':p,'sha256':hashlib.sha256(b).hexdigest()})
pathlib.Path('.eval-artifacts/phase3a-prime/f6-draft-revision/thresholds.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
