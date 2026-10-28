"""Frozen serial single-slot launcher. Does not load credentials or reference answers."""
from pathlib import Path
import subprocess,json,hashlib,sys,os
root=Path('.eval-artifacts/phase3b/g1-real-model')
qid,rep=sys.argv[1:3];fixture='--fixture' in sys.argv
assert qid in [f'Q{i:02}' for i in range(1,35)] and rep in ['1','2','3']
freeze=json.loads((root/'inputs-sha256.json').read_text())
for name,sha in freeze['files'].items():assert hashlib.sha256(Path(name).read_bytes()).hexdigest()==sha,name
ref=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
# Previous unassessed slots block real continuation; no automatic retry.
if not fixture:
 for previous in sorted((root/'results').glob('*/evaluation.json')):
  result=json.loads(previous.read_text())
  assert not any((r.get('falseClaimCount') or 0)>0 for r in result['rows']),'S0_STOP'
  review=previous.parent/'independent-review.json'
  assert review.exists(),'PREVIOUS_SLOT_REQUIRES_REVIEW'
  assert json.loads(review.read_text())['falseClaimCount']==0,'INDEPENDENT_S0_STOP'
out=root/('fixture' if fixture else 'results')/f'{qid}-r{rep}';out.mkdir(parents=True,exist_ok=False)
node=['node']+([] if fixture else ['--env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env'])
node+=['--import','./src/harness/browser/fixtures/fact-qa-runner/deny-reference-reads.mjs','--import','tsx','src/eval/restaurant/fact-qa/run-real-question.ts','--question',qid,'--repetition',rep,'--out',str(out),'--code-ref',ref]
if fixture:node+=['--fixture']
with (out/'execution.log').open('w') as log:status=subprocess.run(node,stdout=log,stderr=subprocess.STDOUT).returncode
assert status==0,'EXECUTION_FAILED_SANITIZED_LOG'
score=['node','--import','tsx','src/eval/restaurant/fact-qa/run.ts','--questions',str(root/'inputs'/f'G1-{qid}.json'),'--references','.eval-artifacts/phase3b/g1-qa/answers.reviewed.json','--responses',str(out/'execution/responses.json'),'--reads',str(out/'execution/reads.json'),'--out',str(out/'evaluation.json')]
with (out/'evaluation.log').open('w') as log:code=subprocess.run(score,stdout=log,stderr=subprocess.STDOUT).returncode
assert code in [0,1] and (out/'evaluation.json').exists(),'EVALUATOR_FAILED'
result=json.loads((out/'evaluation.json').read_text());assert len(result['rows'])==1
print(json.dumps({'slot':out.name,'fixture':fixture,'evaluation':result},ensure_ascii=False))
if any((r.get('falseClaimCount') or 0)>0 for r in result['rows']):sys.exit(3)
