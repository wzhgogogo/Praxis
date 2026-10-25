from pathlib import Path
import datetime
import hashlib
import json
import subprocess
import sys
import time

base = Path('.eval-artifacts/phase3a-boundary/batch2')
manifest_path = base / 'input-sha256-r2.json'
manifest = json.loads(manifest_path.read_text())
def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()
def clock():
    return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(timespec='seconds')
def verify_inputs():
    for entry in manifest['files']:
        assert hashlib.sha256(Path(entry['path']).read_bytes()).hexdigest() == entry['sha256'], entry['path']

assert not git('status', '--porcelain')
assert git('branch', '--show-current') == 'codex/adr-0044-recommendation-availability-boundary'
verify_inputs()
(base / 'gates-r2').mkdir(exist_ok=True)
record = {
    'sourceCommit': git('rev-parse', 'HEAD'), 'startedAtCET': clock(),
    'inputManifestSha256': hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
    'mode': 'OFFLINE_FIXTURE_ONLY', 'realModelCalls': 0, 'googleRequests': 0,
    'restaurantWebsiteRequests': 0, 'fullLive': 0,
    'node': subprocess.check_output(['node', '--version'], text=True).strip(),
    'npm': subprocess.check_output(['npm', '--version'], text=True).strip(), 'steps': [],
}
steps = [
    ('semantic-fixture', ['node', '--import', 'tsx', str(base / 'run-offline-fixture.mjs')]),
    ('typecheck', ['npm', 'run', 'typecheck']),
    ('arch-check', ['npm', 'run', 'arch:check']),
    ('test', ['npm', 'test']),
    ('build', ['npm', 'run', 'build']),
    ('browser-fixture', ['npm', 'run', 'test:browser:fixture']),
]
for name, command in steps:
    started, tick = clock(), time.monotonic()
    log_path = base / 'gates-r2' / (name + '.log')
    with log_path.open('wb') as output:
        result = subprocess.run(command, stdout=output, stderr=subprocess.STDOUT)
    step = {
        'name': name, 'command': command, 'startedAtCET': started, 'finishedAtCET': clock(),
        'elapsedSeconds': round(time.monotonic() - tick, 3), 'exitCode': result.returncode,
        'log': str(log_path), 'logSha256': hashlib.sha256(log_path.read_bytes()).hexdigest(),
        'gitStatusPorcelainAfter': git('status', '--porcelain'),
    }
    record['steps'].append(step)
    (base / 'verification-r2.json').write_text(json.dumps(record, indent=2) + '\n')
    print(json.dumps(step), flush=True)
    if result.returncode or step['gitStatusPorcelainAfter']:
        sys.exit(1)
    verify_inputs()
record['finishedAtCET'] = clock()
record['status'] = 'PASS'
(base / 'verification-r2.json').write_text(json.dumps(record, indent=2) + '\n')
