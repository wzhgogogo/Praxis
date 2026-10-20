"""Reuse the approved outer controls, with no network, browser or model."""
from pathlib import Path
import ast, copy, json

root = Path(__file__).resolve().parent
nodes = [node for node in ast.parse((root/'execute.py').read_text()).body if isinstance(node, ast.FunctionDef)]
ns = {}
exec(compile(ast.Module(body=nodes, type_ignores=[]), 'frozen-outer-functions', 'exec'), ns)
raw = json.loads((root.parent.parent/'checkpoint-a-dom-20261019/recovery/network-preflight.raw.json').read_text())
checks = []
def check(label, result):
    assert result, label
    checks.append(label)
check('actual TableCheck503 with no model/formal work is countable NO_RESPONSE', ns['network_preflight_evidence'](raw)['reason']=='NO_RESPONSE')
for label, mutate in [
    ('missing status rejected', lambda v:v['attempts'][-1].pop('status')),
    ('other endpoint rejected', lambda v:v['attempts'][-1]['request'].update(url='https://other.example/')),
    ('other status rejected', lambda v:v['attempts'][-1].update(status=403)),
    ('generation work rejected', lambda v:v.update(generationModelCalls=1)),
    ('missing phase rejected', lambda v:v.pop('stage')),
]:
    value=copy.deepcopy(raw); mutate(value)
    check(label, ns['network_preflight_evidence'](value) is None)
ledger={'completed':[], 'preflightFailures':1, 'attempts':[{'index':0,'status':'ENV_FAILURE','formalProbeStarted':False,'models':0}], 'stop':{'code':'ENV_PREFLIGHT_RETRYABLE','index':0}}
check('one preflight-only retry uses checkpoint-local count', ns['can_resume'](ledger,0,600))
for label, mutate in [
    ('S0 cannot resume', lambda v:v.update(stop={'code':'S0_BOUNDARY_VIOLATION','index':0})),
    ('completed cannot resume', lambda v:v['completed'].append(0)),
    ('formal start cannot resume', lambda v:v['attempts'][0].update(formalProbeStarted=True)),
    ('model work cannot resume', lambda v:v['attempts'][0].update(models=1)),
    ('second retry rejected', lambda v:v['attempts'].append(copy.deepcopy(v['attempts'][0]))),
    ('checkpoint failure limit rejected', lambda v:v.update(preflightFailures=3)),
]:
    value=copy.deepcopy(ledger); mutate(value)
    check(label, not ns['can_resume'](value,0,600))
deadline_ledger=copy.deepcopy(ledger)
deadline_ledger['stop'].update(retryNotBeforeEpoch=600,recoveryDeadlineEpoch=1800)
check('503 retry before ten minutes rejected', not ns['can_resume'](deadline_ledger,0,599))
check('503 retry at ten minutes admitted', ns['can_resume'](deadline_ledger,0,600))
check('503 retry beyond thirty minutes rejected', not ns['can_resume'](deadline_ledger,0,1801))
check('two failures within this checkpoint still permit the already reserved retry', ns['can_resume']({**ledger,'preflightFailures':2},0,600))
network={'classification':'READY','generationModelCalls':0,'googleRequests':0,'attempts':[{'sourceId':'tablecheck','outcome':'NONEMPTY','count':122,'responseStatus':200}]}
user_ledger={'completed':[],'models':0,'google':0,'preflightGoogle':1,'preflightFailures':4,'userResume':{'priorPreflightAttempts':4},'userResumeHistory':[{'priorPreflightAttempts':2},{'priorPreflightAttempts':3}],
 'attempts':[{'index':0,'status':'ENV_FAILURE','formalProbeStarted':False,'models':0} for _ in range(5)],'stop':{'code':'PREFLIGHT_EVIDENCE_GAP'}}
check('exact user continuation admitted, retaining four failures',ns['can_resume_user'](user_ledger,0,network))
for label,mutate in [
 ('S0 cannot use user recovery',lambda v:v.update(stop={'code':'S0_BOUNDARY_VIOLATION'})),
 ('formal run cannot use zero-call recovery',lambda v:v['completed'].append(0)),
 ('model work cannot use zero-call recovery',lambda v:v.update(models=1)),
 ('repeated user recovery rejected',lambda v:v.update(userResumeHistory=[{'index':0}]*3)),
 ('extra previous failure rejected',lambda v:v.update(preflightFailures=5))]:
 value=copy.deepcopy(user_ledger);mutate(value);check(label,not ns['can_resume_user'](value,0,network))
check('failed network recheck cannot authorize continuation',not ns['can_resume_user'](user_ledger,0,{**network,'classification':'ENV_FAILURE'}))
assert len(checks)==24
(root/'offline-controls.json').write_text(json.dumps({'status':'PASS','count':24,'checks':checks,'network':0,'modelCalls':0},indent=2)+'\n')
print('24/24 PASS; 0 network/model')
