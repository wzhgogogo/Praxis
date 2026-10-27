"""Frozen offline orchestration: execute first under answer-read denial, score later."""
from pathlib import Path
import subprocess,json,hashlib,sys
root=Path('.eval-artifacts/phase3b/g1-runner')
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
assert git('status','--porcelain')=='', 'RUN_REQUIRES_CLEAN_COMMIT'
manifest=json.loads((root/'green-inputs-sha256.json').read_text())
for row in manifest['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
ref=git('rev-parse','HEAD');out=root/'results'/('saved-page-fixture-'+ref[:8]);out.mkdir(parents=True,exist_ok=False)
node=['node','--import','./scripts/test-filesystem-guard.mjs']
questions='.eval-artifacts/phase3b/g1-qa/questions.json'
execution=node+['--import','./src/harness/browser/fixtures/fact-qa-runner/deny-reference-reads.mjs','--import','tsx','src/eval/restaurant/fact-qa/run-bound-questions.ts','--questions',questions,'--out',str(out/'execution'),'--code-ref',ref,'--fixture','not-stated']
with (out/'execution.log').open('w') as log:status=subprocess.run(execution,stdout=log,stderr=subprocess.STDOUT).returncode
assert status==0,'EXECUTION_FAILED_SEE_RETAINED_LOG'
run=json.loads((out/'execution/run.json').read_text());assert set(run['providers']) <= {'FIXTURE'} and run['freshReads']==run['sourceTransportCalls']==0
score=node+['--import','tsx','src/eval/restaurant/fact-qa/run.ts','--questions',questions,'--references',str(root/'evaluator-only/answers.reviewed.json'),'--responses',str(out/'execution/responses.json'),'--reads',str(out/'execution/reads.json'),'--out',str(out/'evaluation.json')]
with (out/'evaluation.log').open('w') as log:evaluation_exit=subprocess.run(score,stdout=log,stderr=subprocess.STDOUT).returncode
assert evaluation_exit in [0,1] and (out/'evaluation.json').exists(),'EVALUATOR_FAILED'
evaluation=json.loads((out/'evaluation.json').read_text());assert len(evaluation.get('rows',[]))==34
summary={'executionGit':ref,'coreGit':run['coreRef'],'mode':'FIXTURE_MODEL_SAVED_PAGES_NOT_REAL_MODEL_EVAL','executionStatus':'PASS','executed':run['executed'],'modelInvocations':run['modelInvocations'],'providers':run['providers'],'coreStatusCounts':run['statusCounts'],'evaluationStatus':evaluation['status'],'evaluationExitCode':evaluation_exit,'rowStatuses':{s:sum(r['status']==s for r in evaluation['rows']) for s in ['PASS','FAIL','NOT_EVALUATED']},'falseClaimCount':evaluation['falseClaimCount'],'categoryClassification':'NOT_SUPPORTED_BY_PINNED_CORE','realModelQuality':'NOT_EVALUATED','realModelCalls':0,'googleRequests':0,'restaurantWebsiteRequests':0,'publicGET':0,'liveCalls':0,'answerReadIsolation':'EXECUTION_UNDER_ENFORCED_DENY_WITH_INDEPENDENT_CANARY','gitStatusAfter':git('status','--porcelain')}
assert summary['gitStatusAfter']==''
(out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps({'output':str(out),**summary}))
