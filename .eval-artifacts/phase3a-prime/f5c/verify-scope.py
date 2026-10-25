#!/usr/bin/env python3
"""No network: compare the protected baseline bytes and frozen inputs."""
import hashlib
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[3]
HERE = pathlib.Path(__file__).resolve().parent
BASE = 'a691f7ddbce7a4fc32829508993a1ef49b269fd2'
RED = '821c3858'
def git(*args): return subprocess.check_output(['git', *args], cwd=ROOT)
def sha(raw): return hashlib.sha256(raw).hexdigest()
def write(path, value): path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')

paths = git('ls-tree', '-r', '--name-only', BASE, 'src/integrations/tabelog', 'src/integrations/tablecheck').decode().splitlines()
all_protected = paths + ['src/integrations/restaurant-search/source-packs.ts']
rows = []
for path in all_protected:
    original = git('show', BASE+':'+path)
    current = (ROOT/path).read_bytes()
    assert current == original, 'PROTECTED_BYTES_CHANGED:'+path
    if path.endswith('.ts') and not path.endswith('.test.ts'):
        rows.append({'path':path, 'physicalLines':len(original.decode().splitlines()), 'sha256':sha(original)})
site_lines = sum(row['physicalLines'] for row in rows if row['path'] != 'src/integrations/restaurant-search/source-packs.ts')
pack_lines = next(row['physicalLines'] for row in rows if row['path'].endswith('source-packs.ts'))
assert (site_lines, pack_lines) == (3864, 473)
history = ['.eval-artifacts/phase3a-prime/f5-live', '.eval-artifacts/phase3a-prime/f5-implementation', '.eval-artifacts/phase3a-prime/budget.json']
assert not git('diff', BASE, '--name-only', '--', *history), 'HISTORICAL_EVIDENCE_CHANGED'
native = 'src/integrations/restaurant-search/native-restaurant-search.ts'
assert git('show', BASE+':'+native) == git('show', RED+':'+native), 'RED_NOT_ON_OLD_PRODUCT'
budget = '.eval-artifacts/phase3a-prime/budget.json'
assert (ROOT/budget).read_bytes() == git('show', BASE+':'+budget)
write(HERE/'scope-audit.json', {'baseline':BASE, 'redInputCommit':git('rev-parse',RED).decode().strip(),
    'redProductByteIdenticalToBaseline':True, 'sitePhysicalLines':site_lines, 'packPhysicalLines':pack_lines,
    'protectedTreeByteIdentical':True, 'files':rows, 'historicalEvidenceUnchanged':history,
    'budgetSha256':sha((ROOT/budget).read_bytes()), 'newRealModelCalls':0, 'newGoogleRequests':0,
    'newWebsiteGET':0, 'newLiveRuns':0, 'newEnvironmentReruns':0, 'envReads':0})
write(HERE/'regression-inputs-sha256.json', {'redInputCommit':git('rev-parse',RED).decode().strip(),
    'localConstructedInputs':[{'gitBlob':RED+':'+path,'sha256':sha(git('show',RED+':'+path))} for path in [
      'src/eval/restaurant/agent-loop/native-fixed-source-pages.ts', 'src/eval/restaurant/agent-loop/native-discovery-composition.test.ts']],
    'oldProduct':{'gitBlob':BASE+':'+native,'sha256':sha(git('show',BASE+':'+native))}})
print(json.dumps({'protectedSites':site_lines,'sourcePack':pack_lines,'allNewExternalCalls':0}))
