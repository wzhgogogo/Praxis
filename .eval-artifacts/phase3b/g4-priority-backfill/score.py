"""Independent certified IDs remain posthoc-only. No network or production edits."""
import collections,datetime,json,sys
from pathlib import Path
root=Path('.eval-artifacts/phase3b/g4-priority-backfill');old=Path('.eval-artifacts/phase3b/g4-e2e')
namespace={};exec(compile((old/'score.py').read_text().split('\ngold=',1)[0],str(old/'score.py'),'exec'),namespace)
load=namespace['load'];score=namespace['score'];identity=namespace['identity'];gold={r['id']:r for r in load(old/'gold.json')['rows']}
rows=[]
for subject in load(root/'inputs.json')['rows']:
 path=root/'replay-execution'/f"{subject['key']}.json";execution=load(path);result=score(execution,gold);target=gold[subject['id']]['rstId']
 baseline=load(subject['sourceExecutionPath'].replace('/execution/','/evaluation/'))
 plans=[{'query':p['query'],'originalTargetRank':next((n+1 for n,o in enumerate(p['observed']) if identity(o['sourceUrl'])==target),None),'newTargetRank':next((n+1 for n,o in enumerate(p['ordered']) if identity(o['sourceUrl'])==target),None),'selectedUrls':[o['sourceUrl'] for o in p['selected']]} for p in execution['allRecordedSearchPlans']]
 targetStillSelected=any(any(identity(u)==target for u in p['selectedUrls']) for p in plans)
 evidence='NOT_EVALUATED_MISSING_SOURCE' if execution['environmentFailure']=='REPLAY_SOURCE_MISSING' else 'RECORDED_ENVIRONMENT_FAILURE' if execution['environmentFailure'] else 'COMPLETE_SAVED_SOURCE_PREFIX'
 result.update(key=subject['key'],view=subject['view'],baselineVerdict=baseline['verdict'],evidenceStatus=evidence,plans=plans,targetStillSelected=targetStillSelected)
 assert result['verdict']!='WRONG_ACCEPTED',subject['key']
 if baseline['verdict']=='CORRECT_ACCEPTED':assert targetStillSelected,'previously accepted target dropped from detail plan: '+subject['key']
 (root/'replay-evaluation'/path.name).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');rows.append(result)
prior=[r for r in rows if r['baselineVerdict']=='CORRECT_ACCEPTED']
summary={'schema':'g4-priority-evaluation@1','atCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),'mode':'OFFLINE_PRODUCTION_PREFIX_REPLAY_FIXED_OLD_MODEL_RESPONSE','groups':{c:{'planned':len(group:=[r for r in rows if (r['view']=='RERUN4' if c=='RERUN4' else r['view']=='MAIN37' and r['cohort']==c)]),'verdicts':dict(collections.Counter(r['verdict'] for r in group)),'evidenceStatus':dict(collections.Counter(r['evidenceStatus'] for r in group))} for c in ['OLD29','NEW8','RERUN4']},'wrongAccepted':0,'priorCorrect':{'planned':len(prior),'retainedInFiveDetailPlan':sum(r['targetStillSelected'] for r in prior),'completeReplayCorrect':sum(r['verdict']=='CORRECT_ACCEPTED' for r in prior),'blockedByMissingSource':sum(r['evidenceStatus']=='NOT_EVALUATED_MISSING_SOURCE' for r in prior)},'focusFive':[r for r in rows if r['id'] in ['nr-010','nr-022','nr-026','nr-020','G4-ND-005']],'rows':rows,'limits':'Missing saved pages are not a product rejection or success. A selected certified target is only retrieval progress. Existing identity functions are separately byte-checked unchanged. Old Prompt2 responses are replay transport, not new Prompt3 quality.'}
(root/'evaluation-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k not in ['rows','focusFive']},ensure_ascii=False))
