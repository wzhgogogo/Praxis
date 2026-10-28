"""Post-execution aggregation only; existing evaluations are immutable inputs."""
from pathlib import Path
import json,collections,hashlib,datetime,gzip,shutil
root=Path('.eval-artifacts/phase3b/g1-real-model');results=root/'results'
questions=json.loads(Path('.eval-artifacts/phase3b/g1-qa/questions.json').read_text());references=json.loads(Path('.eval-artifacts/phase3b/g1-qa/answers.reviewed.json').read_text());qm={q['id']:q for q in questions['questions']};rm={a['questionId']:a for a in references['answers']}
rows=[]
for n in range(1,35):
 for repetition in [1,2,3]:
  slot=f'Q{n:02}-r{repetition}';p=results/slot
  core=json.loads((p/'execution/core-results.json').read_text())[0];answer=core['answer'];evaluation=json.loads((p/'evaluation.json').read_text())['rows'][0];review=json.loads((p/'independent-review.json').read_text());run=json.loads((p/'finished.json').read_text());q=qm[core['questionId']];ref=rm[core['questionId']]
  response=json.loads((p/'model-response.json').read_text()) if (p/'model-response.json').exists() else None
  error=json.loads((p/'model-error.json').read_text()) if (p/'model-error.json').exists() else None
  classified=answer['status']!='UNVERIFIED';expected=q.get('sensitiveCategory') or 'NONE'
  rows.append({'slot':slot,'questionId':core['questionId'],'repetition':repetition,'type':q['type'],'question':q['question'],'sourcePageId':q['pageId'],'status':answer['status'],'reason':answer.get('reason'),'answer':answer['answer'],'citations':answer['citations'],'category':answer['sensitiveCategory'],'confirmationRequired':answer['confirmationRequired'],'categoryEvaluable':classified,'categoryCorrect':answer['sensitiveCategory']==expected if classified else None,'confirmationCorrect':answer['confirmationRequired']==(expected!='NONE') if classified else None,'referenceKind':ref['answerKind'],'scorer':evaluation,'agentTriage':review,'calls':run['calls'],'providerModel':response['model'] if response else None,'providerLatencyMs':response['latencyMs'] if response else None,'transportError':error,'startedUTC':run['started'],'finishedUTC':run['finished'],'codeRef':run['run']['codeRef']})
assert len(rows)==102 and sum(r['calls'] for r in rows)==87
assert all(r['agentTriage']['falseClaimCount']==0 for r in rows)
freeze=json.loads((root/'inputs-sha256.json').read_text());assert all(hashlib.sha256(Path(path).read_bytes()).hexdigest()==sha for path,sha in freeze['files'].items())
count=lambda seq:dict(collections.Counter(seq))
absence=[r for r in rows if r['type']=='页面未说明'];sensitive=[r for r in rows if (qm[r['questionId']].get('sensitiveCategory') or 'NONE')!='NONE' and r['categoryEvaluable']]
classified=[r for r in rows if r['categoryEvaluable']]
summary={'mode':'REAL_MODEL_FIXED_SAVED_PAGES_NOT_LIVE','status':'COMPLETED_AWAITING_INDEPENDENT_REVIEW_NOT_G1_ACCEPTANCE','executedTrials':102,'plannedTrials':102,'providerAttempts':87,'providerResponses':85,'transportFailures':2,'transportRetryAttempts':0,'schemaRetries':0,'noModelTrials':15,'model':'deepseek-flash','sourceRequests':0,'googleRequests':0,'live':0,'scores':count(r['scorer']['status'] for r in rows),'coreStatuses':count(r['status'] for r in rows),'unverifiedReasons':count(r['reason'] for r in rows if r['status']=='UNVERIFIED'),'automaticFalseClaimsDetected':sum(r['scorer']['falseClaimCount'] or 0 for r in rows),'automaticFalseClaimTotal':None,'automaticFalseClaimUnassessed':sum(r['scorer']['falseClaimCount'] is None for r in rows),'agentTriageFalseClaims':0,'agentTriageIsFinalIndependentReview':False,'absenceTypedTrials':len(absence),'absenceTypedCorrectStatus':sum(r['status']=='NOT_STATED' for r in absence),'absenceTypedCorrectRate':sum(r['status']=='NOT_STATED' for r in absence)/len(absence),'scorerAbsenceJudgments':count(r['scorer']['notStated'] for r in rows),'classifiedCategoryTrials':len(classified),'correctCategories':sum(r['categoryCorrect'] for r in classified),'correctConfirmationFlags':sum(r['confirmationCorrect'] for r in classified),'sensitiveTrials':len(sensitive),'sensitiveCategoriesCorrect':sum(r['categoryCorrect'] for r in sensitive),'sensitiveConfirmationFlagsCorrect':sum(r['confirmationCorrect'] for r in sensitive),'presentationConfirmationNotices':'NOT_EVALUATED_BOUND_CORE_RUNNER_HAS_NO_DISPLAY_LAYER','failureReasons':count(reason for r in rows for reason in r['scorer']['reasons']),'frozenInputsUnchanged':True,'codeRefs':sorted(set(r['codeRef'] for r in rows))}
(root/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');(root/'per-trial.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
lines=['# G1 real-model per-trial results','', 'Current execution, exposed reviewed development set. Independent reviewer decision pending. Scorer outputs are unchanged; agent triage is a separate provisional sidecar.','', '| Trial | Core | Score | Category / confirmation | Reason | Answer |','|---|---|---|---|---|---|']
for r in rows:
 esc=lambda s:str(s).replace('|','\\|').replace('\n',' ')
 lines.append('| '+' | '.join(map(esc,[r['slot'],r['status'],r['scorer']['status'],f"{r['category']} / {r['confirmationRequired']}",', '.join(r['scorer']['reasons']) or (r['reason'] or ''),r['answer'] or '—']))+' |')
lines+=['','Exact citations, request/response, read metadata, timings and triage bases: [per-trial.json](per-trial.json), or each immutable `results/<slot>/` directory.']
(root/'per-trial.md').write_text('\n'.join(lines)+'\n')
# Archive already-completed, clean-tree gates; no extra test/model calls.
v=root/'verification';v.mkdir(exist_ok=True)
for p in Path('/private/tmp/phase3b-g1-real-gates').iterdir():
 if p.suffix=='.log':(v/(p.name+'.gz')).write_bytes(gzip.compress(p.read_bytes(),mtime=0))
 else:shutil.copyfile(p,v/p.name)
manifest={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(results.rglob('*')) if p.is_file()};(root/'results-sha256.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(summary,indent=2))
