"""Exercise the actual frozen-controller stop predicate without executing its CLI."""
import ast
import subprocess, sys
from pathlib import Path

path = Path('.eval-artifacts/p2-1-discovery-20261016/execute-probe.py')
source = subprocess.check_output(["git", "show", "35c5dc2:" + str(path)]).decode() if "--before" in sys.argv else path.read_text()
tree = ast.parse(source)
condition = next(node.test for node in ast.walk(tree) if isinstance(node, ast.If) and any(
    isinstance(child, ast.Constant) and child.value == 'BASELINE_DIFFERS_FROM_EXPECTED_MISS'
    for statement in node.body for child in ast.walk(statement)) and 'TARGET' in ast.unparse(node.test))
functions = [node for node in tree.body if isinstance(node, ast.FunctionDef)]
namespace = {}
exec(compile(ast.Module(body=functions, type_ignores=[]), str(path), 'exec'), namespace)
def stops(by_source):
    return eval(compile(ast.Expression(condition), str(path), 'eval'), namespace, {
        'p': {'role': 'TARGET'}, 'ledger': {'stop': None},
        's': {'witnessInListing': any(by_source.values()), 'witnessInListingBySource': by_source}})
assert not stops({'tabelog': False, 'google-places': True}), 'Known Google exact-ID matches must not masquerade as a changed native bottleneck'
assert stops({'tabelog': True, 'google-places': False}), 'Unexpected native witness must still stop the baseline'
assert not stops({'tabelog': False, 'google-places': False})
print('PASS: known Google match continues; native match stops; missing witness continues. 0 network/model.')
