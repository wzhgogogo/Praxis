"""Five gate groups; three consecutive four-worker Chromium samples; fail immediately."""
from pathlib import Path
import argparse, datetime, hashlib, json, os, re, signal, statistics, subprocess, time, platform
from zoneinfo import ZoneInfo

parser = argparse.ArgumentParser()
parser.add_argument('--worktree', type=Path, default=Path.cwd())
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--freeze', type=Path, required=True)
args = parser.parse_args()
root, out = args.worktree.resolve(), args.output.resolve()
assert not out.is_relative_to(root), 'gate output must be outside the tested checkout'
out.mkdir(parents=True, exist_ok=False)
git = lambda *a: subprocess.check_output(['git', '-C', str(root), *a]).decode()
commit = git('rev-parse', 'HEAD').strip()
freeze_path = root / args.freeze
freeze_bytes = freeze_path.read_bytes()
freeze = json.loads(freeze_bytes)
def verify_freeze():
    for path, expected in freeze['files'].items():
        assert hashlib.sha256((root / path).read_bytes()).hexdigest() == expected, 'FROZEN_CHANGED:' + path
verify_freeze()
assert not git('status', '--porcelain'), 'checkout must start clean'
result = {'mode': 'OFFLINE_LOCAL_CHROMIUM_AND_FIXTURE', 'testedCommit': commit,
          'startedAt': datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1), 'CET')).isoformat(),
          'platform': platform.platform(), 'cpuCount': os.cpu_count(), 'nodeVersion': subprocess.check_output(['node','--version'],text=True).strip(), 'timezone': 'CET UTC+01:00 (user review)' , 'orchestrationSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'freezeSha256': hashlib.sha256(freeze_bytes).hexdigest(),
          'perCommandTimeoutSeconds': 600, 'runs': [], 'restorations': 0}
def save():
    (out / 'gates.json').write_text(json.dumps(result, indent=2) + '\n')
steps = [('typecheck', 1, ['npm', 'run', 'typecheck']),
         ('arch-check', 1, ['npm', 'run', 'arch:check']),
         ('npm-test', 1, ['npm', 'test']),
         ('build', 1, ['npm', 'run', 'build']),
         *[('browser-fixture', n, ['npm', 'run', 'test:browser:fixture']) for n in range(1,4)]]
for name, sample, command in steps:
    assert git('rev-parse', 'HEAD').strip() == commit
    assert not git('status', '--porcelain'), 'dirty before ' + name
    row = {'gate': name, 'sample': sample, 'command': command,
           'startedAt': datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1), 'CET')).isoformat(),
           'gitStatusBefore': '', 'log': f'{name}-{sample}.log'}
    print('START', name, sample, flush=True)
    started = time.monotonic()
    with (out / row['log']).open('wb') as log:
        process = subprocess.Popen(command, cwd=root, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            row['exitCode'] = process.wait(timeout=600)
        except subprocess.TimeoutExpired:
            row['timedOut'] = True
            os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()
            row['exitCode'] = process.returncode
    row['elapsedSeconds'] = round(time.monotonic() - started, 6)
    log_bytes = (out / row['log']).read_bytes()
    row['summary'] = {key: int(value) for key, value in re.findall(r'^(?:#|ℹ) (tests|suites|pass|fail|cancelled|skipped|todo) (\d+)$', log_bytes.decode(errors='replace'), re.M)}
    row['logSha256'] = hashlib.sha256(log_bytes).hexdigest()
    # Preserve the actual status before doing anything else. Never git restore,
    # git checkout, delete generated files, or exempt an artifact here.
    row['gitStatusAfter'] = git('status', '--porcelain')
    result['runs'].append(row)
    save()
    print('END', name, sample, row['exitCode'], row['elapsedSeconds'], row['summary'], 'clean=' + str(not row['gitStatusAfter']), flush=True)
    if row['exitCode'] != 0 or row['gitStatusAfter']:
        result['stopReason'] = 'GATE_FAILED' if row['exitCode'] != 0 else 'GATE_CHANGED_CHECKOUT'
        save()
        raise SystemExit(1)
verify_freeze()
result['freezeVerifiedAfter'] = True
result['elapsedSecondsByGate'] = {name: [row['elapsedSeconds'] for row in result['runs'] if row['gate']==name] for name in dict.fromkeys(row['gate'] for row in result['runs'])}
result['sampling'] = 'FOUR_ONCE; CHROMIUM_THREE_CONSECUTIVE_WITH_FOUR_WORKERS'
result['browserMedianSeconds'] = statistics.median(row['elapsedSeconds'] for row in result['runs'] if row['gate']=='browser-fixture')
result['stopReason'] = None
result['chromiumConcurrency'] = 4
save()
print('COMPLETE', result['elapsedSecondsByGate'], flush=True)
raise SystemExit(int(result['stopReason'] is not None))
