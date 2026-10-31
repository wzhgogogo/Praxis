from pathlib import Path
import datetime,hashlib,json,os,subprocess,sys,time
r=Path('.eval-artifacts/phase3b/g4-japanese-wiring')
(r/'replay-logs').mkdir(exist_ok=True)
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
def cet():return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
assert not git('status','--porcelain');assert not (r/'replay-gates.json').exists()
out={'sourceCommit':git('rev-parse','HEAD'),'startedAtCET':cet(),'steps':[],'newCalls':0}
steps=[('integrity',['python3','-B',str(r/'verify.py')]),('simulation',['node','--import','tsx',str(r/'run-simulation.mjs')]),('score-simulation',['python3','-B',str(r/'score-simulation.py')]),('independent-simulation',['python3','-B',str(r/'verify-results.py'),'--write']),('product-replay',['node','--import','tsx',str(r/'run-product-replay.mjs')]),('score-product',['python3','-B',str(r/'score-product.py')]),('integrity-after',['python3','-B',str(r/'verify.py')])]
for name,command in steps:
 before=git('status','--porcelain');assert not before
 log=r/'replay-logs'/(name+'.log');tick=time.monotonic()
 with log.open('xb') as f:run=subprocess.run(command,stdout=f,stderr=subprocess.STDOUT)
 after=git('status','--porcelain')
 step={'name':name,'command':command,'exitCode':run.returncode,'seconds':round(time.monotonic()-tick,3),'gitStatusBefore':before,'gitStatusAfter':after,'log':str(log),'sha256':hashlib.sha256(log.read_bytes()).hexdigest()}
 out['steps'].append(step);(r/'replay-gates.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(step),flush=True)
 if run.returncode or after:sys.exit(1)
a=json.loads((r/'evaluation.json').read_text());b=json.loads((r/'product-evaluation.json').read_text())
for result in [a,b]:
 assert result['old23']['retained']==23 and result['wrongAccepted']==0
 assert all(row['verdict']=='CORRECT_ACCEPTED' for row in result['focusThree'])
out.update(status='PASS',finishedAtCET=cet());(r/'replay-gates.json').write_text(json.dumps(out,indent=2)+'\n')
