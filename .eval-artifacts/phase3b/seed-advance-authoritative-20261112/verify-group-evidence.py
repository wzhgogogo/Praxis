"""Checks retained, exposed D02-V decision observations. No browser/network/model."""
from pathlib import Path
import json

root = Path(__file__).parent
data = json.loads((root / 'r1-observations.json').read_text())
first, after = data['frames'][:2]
advance = next(t for t in first['observation']['targets'] if t['ref'] == first['originalAction']['targetRef'])
choice = next(t for t in after['observation']['targets'] if t['ref'] == after['originalAction']['targetRef'])
same_advance = next(t for t in after['observation']['targets'] if t['label'] == advance['label'] and t['kind'] == advance['kind'])
assert advance['controlGroupRef'] == 'observation:1:group:13'
assert same_advance['controlGroupRef'] == 'observation:2:group:13'
assert choice['controlGroupRef'] == 'observation:2:group:1'
assert same_advance['controlGroupLabel'] == choice['controlGroupLabel'] == 'Calendar'
assert same_advance['controlGroupRef'] != choice['controlGroupRef']
print('PASS: original calendar advance and requested date have distinct observed groups; two-real-user precondition is not met.')
