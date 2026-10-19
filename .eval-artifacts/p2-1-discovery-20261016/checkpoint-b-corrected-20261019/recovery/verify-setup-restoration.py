"""Exercise only the approved setup admission block; never execute a probe."""
from pathlib import Path
import ast, copy, hashlib, json

root = Path(__file__).resolve().parent.parent
tree = ast.parse((root/'execute.py').read_text())
node = next(n for n in tree.body if isinstance(n, ast.If) and isinstance(n.test, ast.Name) and n.test.id == 'resume_setup')
code = compile(ast.Module(body=[node], type_ignores=[]), 'setup-restoration-controls', 'exec')
ledger = json.loads((root/'recovery/ledger-before.json').read_text())
plan = json.loads((root/'plan.json').read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

def admitted(value, index=0, head=None):
    ns = {'Path':Path, 'json':json, 'config':root, 'sha':sha, 'now':lambda:'OFFLINE_CONTROL',
          'resume_setup':True, 'resume':False, 'ledger':value,
          'plan':{**plan, **({'productionHead':head} if head else {})}, 'index':index}
    try:
        exec(code, ns)
        return value['stop'] is None and value['attempts'][0].get('approvedSetupRestoration') is True
    except AssertionError:
        return False

checks = []
def check(name, result):
    assert result, name
    checks.append(name)

check('actual zero-call setup failure admitted', admitted(copy.deepcopy(ledger)))
for name, mutate in [
    ('completed formal run rejected', lambda v:v['completed'].append(0)),
    ('charged model rejected', lambda v:v.update(models=1)),
    ('charged Google rejected', lambda v:v.update(google=1)),
    ('charged preflight Google rejected', lambda v:v.update(preflightGoogle=1)),
    ('formal start rejected', lambda v:v['attempts'][0].update(formalProbeStarted=True)),
    ('other stop rejected', lambda v:v.update(stop={'code':'S0_BOUNDARY_VIOLATION','index':0})),
    ('multiple attempts rejected', lambda v:v['attempts'].append(copy.deepcopy(v['attempts'][0]))),
]:
    value = copy.deepcopy(ledger)
    mutate(value)
    check(name, not admitted(value))
check('other index rejected', not admitted(copy.deepcopy(ledger), index=1))
check('other production head rejected', not admitted(copy.deepcopy(ledger), head='different'))
(root/'recovery/setup-controls.applied.json').write_text(json.dumps({
    'status':'PASS', 'count':len(checks), 'checks':checks, 'modelCalls':0, 'networkRequests':0,
    'appliedOuterSha256':sha(root/'execute.py'),
}, indent=2)+'\n')
print('10/10 approved setup controls PASS; 0 network/model')
