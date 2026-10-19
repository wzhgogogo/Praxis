"""Exactly the 13 approved offline controls; no model, browser or network."""
from pathlib import Path
import ast, copy, json

directory = Path(__file__).resolve().parent
raw = json.loads((directory / 'network-preflight.raw.json').read_text())
ledger = json.loads((directory / 'ledger.before.json').read_text())

def functions(path):
    namespace = {}
    nodes = [node for node in ast.parse(path.read_text()).body if isinstance(node, ast.FunctionDef)]
    exec(compile(ast.Module(body=nodes, type_ignores=[]), str(path), 'exec'), namespace)
    return namespace

old = functions(directory.parent / 'execute.py')
new = functions(directory / 'execute.py')
checks = []

def passed(label):
    checks.append(label)
    print('PASS ' + label)

assert not old['can_resume'](ledger, 5, 0)
passed('old frozen resume rejects PREFLIGHT_EVIDENCE_GAP (reproduced)')
assert new['recoverable_network_stop'](ledger, 5, raw, 0)
passed('actual preflight HTTP503 /0 models/0 formal is recognized')
for label, mutate in [
    ('no HTTP status', lambda v: v['attempts'][-1].pop('status')),
    ('other endpoint', lambda v: v['attempts'][-1]['request'].update(url='https://other.example/')),
    ('non503', lambda v: v['attempts'][-1].update(status=403)),
    ('model used', lambda v: v.update(generationModelCalls=1)),
    ('stage missing', lambda v: v.pop('stage')),
]:
    value = copy.deepcopy(raw)
    mutate(value)
    assert new['network_preflight_evidence'](value) is None
    passed(label + ' rejected')
for label, mutate in [
    ('S0', lambda v: v.update(stop={'code': 'S0_BOUNDARY_VIOLATION', 'index': 5})),
    ('already completed', lambda v: v['completed'].append(5)),
    ('formal started', lambda v: v['attempts'][-1].update(formalProbeStarted=True)),
    ('model used', lambda v: v['attempts'][-1].update(models=1)),
    ('second retry', lambda v: v['attempts'].append(copy.deepcopy(v['attempts'][-1]))),
    ('failure count >2', lambda v: v.update(preflightFailures=2)),
]:
    value = copy.deepcopy(ledger)
    mutate(value)
    assert not new['recoverable_network_stop'](value, 5, raw, 0)
    passed(label + ' resume rejected')
assert len(checks) == 13
(directory / 'offline-controls.approved.json').write_text(json.dumps({
    'status': 'PASS_APPROVED_PATCH', 'checks': checks, 'count': len(checks),
    'productionModified': False, 'models': 0, 'network': 0,
}, indent=2) + '\n')
print('13/13 offline controls PASS; 0 model/network')
