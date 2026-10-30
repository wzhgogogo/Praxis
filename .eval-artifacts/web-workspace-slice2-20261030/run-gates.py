from pathlib import Path
import hashlib
import json
import os
import subprocess
import time

folder = Path('.eval-artifacts/web-workspace-slice2-20261030')
output = folder / 'gates-continuation'
screens = Path('/private/tmp/praxis-slice2-20261030-approved-screens')
manifest_path = folder / 'gate-freeze-continuation.json'
manifest = json.loads(manifest_path.read_text())

def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()

def verify():
    for item in manifest['files']:
        assert hashlib.sha256(Path(item['path']).read_bytes()).hexdigest() == item['sha256'], item['path']

verify()
assert git('status', '--porcelain') == ''
head = git('rev-parse', 'HEAD')
assert subprocess.run(['git', 'merge-base', '--is-ancestor', manifest['main'], head]).returncode == 0
output.mkdir(exist_ok=True)
env = {key: os.environ[key] for key in ['PATH', 'HOME', 'TMPDIR', 'LANG'] if key in os.environ}
env['PRAXIS_WORKSPACE_VISUAL_OUTPUT'] = str(screens)
rows = []
for name, command in [
    ('empty-continuation-diagnostic', ['node', '--import', 'tsx', str(folder / 'probe-empty-continuation.mjs')]),
    ('typecheck', ['npm', 'run', 'typecheck']),
    ('arch-check', ['npm', 'run', 'arch:check']),
    ('test', ['npm', 'test']),
    ('build', ['npm', 'run', 'build']),
    ('browser-fixture', ['npm', 'run', 'test:browser:fixture']),
]:
    before = git('status', '--porcelain')
    assert before == ''
    print(f'START {name} on {head}', flush=True)
    started = time.monotonic()
    run = subprocess.run(command, env=env, capture_output=True, text=True, timeout=600)
    with (output / (name + '.log')).open('x') as log:
        log.write(run.stdout + run.stderr)
    after = git('status', '--porcelain')
    verify()
    assert git('rev-parse', 'HEAD') == head
    row = {'name': name, 'command': command, 'exitCode': run.returncode,
           'elapsedMs': round((time.monotonic() - started) * 1000),
           'cleanBefore': before == '', 'cleanAfter': after == '', 'HEADUnchanged': True}
    rows.append(row)
    (output / 'gates.json').write_text(json.dumps({'sourceCommit': head,
        'main': manifest['main'],
        'manifestSHA256': hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
        'mode': 'OFFLINE_AND_LOCAL_CHROMIUM_FIXTURE', 'realAPIRequests': 0,
        'Holdout': 'NOT_RUN', 'sourceGET': 0, 'Google': 0, 'externalWrites': 0,
        'screenshotDirectory': str(screens), 'frozenFilesUnchanged': len(manifest['files']),
        'checks': rows}, indent=2) + '\n')
    print(f'END {name}: exit={run.returncode}, cleanAfter={after == ""}, {row["elapsedMs"]}ms', flush=True)
    assert run.returncode == 0 and after == '', name
