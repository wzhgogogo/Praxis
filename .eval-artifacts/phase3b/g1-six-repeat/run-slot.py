"""Frozen serial one-attempt launcher. Execution and independent scoring stay separate."""
from pathlib import Path
import json,hashlib,subprocess,sys
root=Path('.eval-artifacts/phase3b/g1-six-repeat');qid,rep=sys.argv[1:3];attempt=int(sys.argv[3]) if len(sys.argv)>3 and sys.argv[3].isdigit() else 1;fixture='--fixture' in sys.argv
plan=json.loads((root/'manifest.json').read_text());assert qid in plan['questionIds'] and rep in ['1','2','3'] and attempt in [1,2]
freeze=json.loads((root/'inputs-sha256.json').read_text())
for name,sha in freeze['files'].items():assert hashlib.sha256(Path(name).read_bytes()).hexdigest()==sha,name
if not fixture:
 for previous in sorted((root/'results').glob('*/evaluation.json')):
  result=json.loads(previous.read_text());assert not any((r.get('falseClaimCount') or 0)>0 for r in result['rows']),'S0_STOP'
  review=previous.parent/'triage.json';assert review.exists(),'PREVIOUS_SLOT_REQUIRES_TRIAGE';assert json.loads(review.read_text())['falseClaimCount']==0,'INDEPENDENT_S0_STOP'
 if attempt==2:
  previous=root/'results'/f'{qid}-r{rep}-a1';error=json.loads((previous/'model-error.json').read_text());assert error['code'] in ['NETWORK','TIMEOUT'],'NO_SCHEMA_OR_QUALITY_RETRY'
  assert len(list((root/'results').glob('*-a2')))<2,'RETRY_ALLOWANCE_EXHAUSTED'
out=root/('fixture' if fixture else 'results')/f'{qid}-r{rep}-a{attempt}';out.mkdir(parents=True,exist_ok=False)
ref=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
node=['node']+([] if fixture else ['--env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env'])
node+=['--import','./src/harness/browser/fixtures/fact-qa-runner/deny-reference-reads.mjs','--import','tsx','src/eval/restaurant/fact-qa/run-real-question.ts','--plan',str(root/'manifest.json'),'--question',qid,'--repetition',rep,'--attempt',str(attempt),'--out',str(out),'--code-ref',ref]
if fixture:node+=['--fixture']
with (out/'execution.log').open('w') as log:r=subprocess.run(node,stdout=log,stderr=subprocess.STDOUT)
assert r.returncode==0,'EXECUTION_FAILED_SEE_SANITIZED_RECORDS'
score=['node','--import','tsx','src/eval/restaurant/fact-qa/run.ts','--questions',plan['questionInputs'][qid],'--references',plan['references'],'--responses',str(out/'execution/responses.json'),'--reads',str(out/'execution/reads.json'),'--out',str(out/'evaluation.json')]
with (out/'evaluation.log').open('w') as log:r=subprocess.run(score,stdout=log,stderr=subprocess.STDOUT)
assert r.returncode in [0,1] and (out/'evaluation.json').exists(),'EVALUATOR_FAILED'
r=subprocess.run(['node','--import','tsx',str(root/'check-slot.ts'),qid,str(out)],capture_output=True,text=True);assert r.returncode==0,'SUPPLEMENTAL_CHECK_FAILED'
e=json.loads((out/'evaluation.json').read_text());core=json.loads((out/'execution/core-results.json').read_text())[0]['answer'];extra=json.loads((out/'supplemental-checks.json').read_text());print(json.dumps({'slot':out.name,'fixture':fixture,'evaluation':e,'core':core,'extra':extra},ensure_ascii=False))
if any((r.get('falseClaimCount') or 0)>0 for r in e['rows']):sys.exit(3)
