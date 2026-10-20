from pathlib import Path
import ast,json,copy,sys,time,hashlib
sys.dont_write_bytecode=True
config=Path(__file__).resolve().parent
load=lambda p:json.loads(Path(p).read_text())
tree=ast.parse((config/'execute.py').read_text());definition=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='can_resume_user')
namespace={};exec(compile(ast.Module(body=[definition],type_ignores=[]),'actual-resume-admission','exec'),namespace)
can=namespace['can_resume_user'];ledger=load(config/'ledger-before.json');approval=load(config/'approval.json');proof=load(approval['sourcePreflightResult']);checks=[]
def check(name,result):
    assert result,name
    checks.append({'name':name,'status':'PASS'})
def accepts(l=None,p=None,a=None,index=9,at=None):return can(l or ledger,index,p or proof,a or approval,approval['notBeforeEpoch']+1 if at is None else at)
check('exact-preflight-only429-human-resume',accepts())
check('no-early-start',not accepts(at=approval['notBeforeEpoch']-1))
check('wrong-case-rejected',not accepts(index=8))
for name,mutate in [
 ('completed-item-rejected',lambda d:d['completed'].append(9)),
 ('formal-run-not-rerun',lambda d:d['attempts'][-1].update(formalProbeStarted=True)),
 ('paid-failed-run-not-rerun',lambda d:d['attempts'][-1].update(models=1)),
 ('safety-stop-not-bypassed',lambda d:d.update(stop={'code':'S0_BOUNDARY_VIOLATION','index':9})),
 ('different-budget-rejected',lambda d:d.update(models=32)),
 ('different-counter-rejected',lambda d:d.update(preflightFailures=7)),
 ('wrong-directory-rejected',lambda d:d['attempts'][-1].update(directory='unrelated')),
]:
    d=copy.deepcopy(ledger);mutate(d);check(name,not accepts(l=d))
for name,mutate in [
 ('ready-proof-not-failure',lambda d:d.update(classification='READY')),
 ('paid-proof-rejected',lambda d:d.update(generationModelCalls=1)),
 ('wrong-status-rejected',lambda d:d['attempts'][0].update(responseStatus=503)),
 ('additional-failure-rejected',lambda d:d['attempts'][1].update(outcome='FAILED')),
]:
    d=copy.deepcopy(proof);mutate(d);check(name,not accepts(p=d))
check('old-six-completed-retained',ledger['completed']==[0,1,2,3,4,8])
check('old-failure-counter-not-reset',ledger['preflightFailures']==6)
check('15-model-admission-within450',278+ledger['models']+15<=450)
check('remaining-four-within55',44+len(ledger['completed'])+4<=55)
old=config.parent/'browser-ready-resume-20261020'
check('same-pacing-policy', (config/'policy.py').read_bytes()==(old/'policy.py').read_bytes())
entry=Path(load(config/'plan.json')['probeEntry'])
check('same-probe-entry',hashlib.sha256(entry.read_bytes()).hexdigest()=='47db4b10ba264ceab42e5c66115dc5b4953e67176adc5acbb78beb9e7b5c2bf6')
result={'status':'PASS','count':len(checks),'checks':checks,'reusedOuterControls':44,'reusedPlanOnlyChecks':5,'network':0,'models':0,'scope':'New exact manual admission only; no automatic429 retry added.'}
(config/'offline-controls.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ['status','count','reusedOuterControls','reusedPlanOnlyChecks','network','models']}))
