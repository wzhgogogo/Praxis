"""Verify this delivery's frozen inputs/logs/scope; no model or network work."""
from pathlib import Path
import datetime, hashlib, json, re, subprocess

root = Path.cwd()
artifacts = Path(__file__).resolve().parent
git = lambda *args: subprocess.check_output(['git', *args])
requests, runs = {}, {}
for item, directory in [('health', artifacts / 'health'),
                        ('recording-initial', artifacts / 'recording'),
                        ('recording', artifacts / 'recording/final-candidate')]:
    gates = json.loads((directory / 'gates/gates.json').read_text())
    assert len(gates['runs']) == 5 and gates['restorations'] == 0 and gates['freezeVerifiedAfter']
    for row in gates['runs']:
        assert row['exitCode'] == 0 and not row['gitStatusBefore'] and not row['gitStatusAfter']
        assert hashlib.sha256((directory / 'gates' / row['log']).read_bytes()).hexdigest() == row['logSha256']
    freeze = json.loads((directory / 'freeze.json').read_text())
    assert hashlib.sha256((directory / 'freeze.json').read_bytes()).hexdigest() == gates['freezeSha256']
    for path, digest in freeze['files'].items():
        requests[gates['testedCommit'] + ':' + path] = digest
    runs[item] = {'testedCommit': gates['testedCommit'], 'frozenFiles': len(freeze['files']), 'gates': 5,
                  'cleanAfterEach': True, 'restorations': 0}
# Check each old freeze against its own tested commit, never silently updating
# the first item's freeze when the second item changes shared eval source.
objects = subprocess.run(
    ['git', 'cat-file', '--batch'], input=('\n'.join(requests) + '\n').encode(), stdout=subprocess.PIPE, check=True).stdout
position = 0
for path, digest in requests.items():
    end = objects.index(b'\n', position)
    header = objects[position:end].decode().split()
    assert header[1] == 'blob', (path, header)
    length = int(header[2]); position = end + 1
    assert hashlib.sha256(objects[position:position + length]).hexdigest() == digest, path
    position += length + 1
assert position == len(objects)
last_freeze = json.loads((artifacts / 'recording/final-candidate/freeze.json').read_text())
for path, digest in last_freeze['files'].items():
    assert hashlib.sha256((root / path).read_bytes()).hexdigest() == digest, path
protected = ['src/application', 'src/core', 'src/domains', 'src/infrastructure', 'src/integrations', 'src/server', 'web-skills']
assert not git('diff', '4d927958', '--name-only', '--', *protected).strip()
source_changes = git('diff', '4d927958', '--name-only', '--', 'src').decode().splitlines()
assert all(path.startswith(('src/eval/restaurant/agent-loop/', 'src/harness/browser/')) for path in source_changes)
scanner = 'src/eval/restaurant/agent-loop/runners/google-places-recording.ts'
old, current = git('show', '4d927958:' + scanner).decode(), (root / scanner).read_text()
for name in ['keyPattern', 'keyField']:
    pattern = r'^const ' + name + r' =.*$'
    assert re.search(pattern, old, re.M)[0] == re.search(pattern, current, re.M)[0]
counter = json.loads((artifacts / 'adapter-lines.json').read_text())['snapshots'][-1]
assert counter['totals']['adapter-source'] == 3864
for row in counter['files']:
    assert hashlib.sha256((root / row['path']).read_bytes()).hexdigest() == row['sha256']
assert len((root / 'src/integrations/restaurant-search/source-packs.ts').read_text().splitlines()) == 473
validation = json.loads((artifacts / 'recording/validation-manifest.json').read_text())
for path, digest in validation['files'].items():
    assert hashlib.sha256((artifacts / 'recording' / path).read_bytes()).hexdigest() == digest
for path in (artifacts / 'recording/validation/recording').rglob('*'):
    if path.is_file():
        assert not re.search(rb'\bAIza[0-9A-Za-z_-]{30,}', path.read_bytes()), path
        assert not path.name.endswith('.pending')
json_files = list(artifacts.rglob('*.json'))
for path in json_files:
    json.loads(path.read_text())
links = 0
for path in [*artifacts.rglob('*.md'), root / 'src/harness/browser/fixtures/PAGES.md']:
    for target in re.findall(r'\]\(([^)]+)\)', path.read_text()):
        if target.startswith(('http:', 'https:', '#')): continue
        relative = target.split('#', 1)[0].strip('<>')
        assert (path.parent / relative).exists(), (path, relative)
        links += 1
result = {'status': 'PASS', 'checkedAt': datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1), 'CET')).isoformat(),
          'runs': runs, 'frozenBlobChecks': len(requests), 'protectedDiff': [], 'adapterLines': 3864, 'sourcePackLines': 473,
          'scanExpressions': 'UNCHANGED', 'validationOutputs': len(validation['files']), 'jsonFiles': len(json_files),
          'markdownLinks': links, 'frozenFilesUnchangedAfterFinalGates': True,
          'realCalls': {'model': 0, 'google': 0, 'website': 0, 'live': 0, 'environmentRerun': 0}}
(artifacts / 'delivery-verification.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
