"""Reuse the unchanged frozen scorer in a separate posthoc process."""
import json,sys
from pathlib import Path
original=Path('.eval-artifacts/phase3b/g4-e2e')
source=(original/'score.py').read_text()
prefix=source.split('\ngold=',1)[0]
exec(compile(prefix,str(original/'score.py'),'exec'))
root=Path('.eval-artifacts/phase3b/g4-e2e-continuation')
gold={r['id']:r for r in load(original/'gold.json')['rows']}
if '--one' in sys.argv:
 row=load(sys.argv[sys.argv.index('--one')+1]);result=score(row,gold);result['attemptKind']=row['attemptKind']
 with (root/'evaluation'/f"{row['id']}.json").open('x') as f:json.dump(result,f,ensure_ascii=False,indent=2);f.write('\n')
 print(json.dumps(result,ensure_ascii=False))
elif '--self-test' in sys.argv:
 control={'id':'fixture','cohort':'OLD29','acceptedUrl':'https://tabelog.com/en/tokyo/A1/A2/22222222/','requests':[],'environmentFailure':None,'stop':None,'productionReason':'HIGH_EXACT_PHONE','diagnostics':[],'modelRecords':[]}
 assert score(control,{'fixture':{'rstId':'11111111'}})['verdict']=='WRONG_ACCEPTED'
 control['acceptedUrl']='https://tabelog.com/en/tokyo/A1/A2/11111111/';assert score(control,{'fixture':{'rstId':'11111111'}})['verdict']=='CORRECT_ACCEPTED'
 control['acceptedUrl']=None;control['environmentFailure']='SOURCE_TIMEOUT';assert score(control,{'fixture':{'rstId':'11111111'}})['verdict']=='ENVIRONMENT_FAILURE'
 print('PASS unchanged oracle wrong/correct/environment controls; 0 calls')
else:raise SystemExit('Use --one or --self-test')
