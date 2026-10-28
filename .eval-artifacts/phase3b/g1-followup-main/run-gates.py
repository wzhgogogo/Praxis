"""Reviewed B integration: five strict gates plus the ordinary G2 baseline."""
from pathlib import Path
import argparse, datetime, hashlib, json, os, platform, re, signal, statistics, subprocess, time

p = argparse.ArgumentParser()
p.add_argument('--worktree', type=Path, default=Path.cwd())
p.add_argument('--freeze', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
p.add_argument('--browser-samples', type=int, default=1, choices=(1, 3))
p.add_argument('--median-limit', type=float)
a = p.parse_args()
root, out = a.worktree.resolve(), a.output.resolve()
assert not out.is_relative_to(root)
out.mkdir(parents=True, exist_ok=False)
git = lambda *args: subprocess.check_output(['git', '-C', str(root), *args], text=True)
freeze_path = root / a.freeze
freeze_bytes = freeze_path.read_bytes()
freeze = json.loads(freeze_bytes)
def verify():
    for path, expected in freeze['files'].items():
        assert hashlib.sha256((root / path).read_bytes()).hexdigest() == expected, path
verify()
assert not git('status', '--porcelain')
commit = git('rev-parse', 'HEAD').strip()
now = lambda: datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1), 'CET')).isoformat()
result = {'mode': 'OFFLINE_LOCAL_CHROMIUM_AND_FIXTURE', 'testedCommit': commit,
          'startedAtCET': now(), 'platform': platform.platform(), 'cpuCount': os.cpu_count(),
          'nodeVersion': subprocess.check_output(['node', '--version'], text=True).strip(),
          'orchestrationSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          'freezeSha256': hashlib.sha256(freeze_bytes).hexdigest(), 'runs': [], 'restorations': 0,
          'gatePolicy': 'All five gates must exit zero; existing E1 is not exempt in this slice',
          'chromiumConcurrency': 4, 'g2StrictRequired': False}
def save():
    (out / 'gates.json').write_text(json.dumps(result, indent=2) + '\n')
steps = [('typecheck', 1, ['npm', 'run', 'typecheck']),
         ('arch-check', 1, ['npm', 'run', 'arch:check']),
         ('npm-test', 1, ['npm', 'test']), ('build', 1, ['npm', 'run', 'build']),
         *[('browser-fixture', n, ['npm', 'run', 'test:browser:fixture']) for n in range(1, a.browser_samples + 1)],
         ('dom-change', 1, ['npm', 'run', 'test:dom-change'])]
for name, sample, command in steps:
    assert git('rev-parse', 'HEAD').strip() == commit
    assert not git('status', '--porcelain')
    row = {'gate': name, 'sample': sample, 'command': command, 'startedAtCET': now(),
           'gitStatusBefore': '', 'log': f'{name}-{sample}.log'}
    print('START', name, sample, flush=True)
    started = time.monotonic()
    with (out / row['log']).open('wb') as log:
        environment = {**os.environ, 'PRAXIS_G2_REQUIRE_PASS': '0'} if name == 'dom-change' else None
        proc = subprocess.Popen(command, cwd=root, stdout=log, stderr=subprocess.STDOUT, start_new_session=True, env=environment)
        try:
            row['exitCode'] = proc.wait(timeout=600)
        except subprocess.TimeoutExpired:
            row['timedOut'] = True
            os.killpg(proc.pid, signal.SIGTERM)
            try: proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                os.killpg(proc.pid, signal.SIGKILL); proc.wait()
            row['exitCode'] = proc.returncode
    row['elapsedSeconds'] = round(time.monotonic() - started, 6)
    raw = (out / row['log']).read_bytes(); text = raw.decode(errors='replace')
    row['summary'] = {key: int(value) for key, value in re.findall(r'^(?:#|ℹ) (tests|suites|pass|fail|cancelled|skipped|todo) (\d+)$', text, re.M)}
    row['logSha256'] = hashlib.sha256(raw).hexdigest()
    row['gitStatusAfter'] = git('status', '--porcelain')
    row['outcome'] = 'PASS' if row['exitCode'] == 0 else 'FAIL'
    if name == 'browser-fixture':
        row['healthPassed'] = any(line.startswith('✔ Live source health uses real Guard') for line in text.splitlines())
        assert '--test-concurrency=4' in text
    result['runs'].append(row); save()
    print('END', name, sample, row['outcome'], row['elapsedSeconds'], row['summary'], 'clean=' + str(not row['gitStatusAfter']), flush=True)
    if row['outcome'] == 'FAIL' or row['gitStatusAfter'] or name == 'browser-fixture' and not row['healthPassed']:
        result['stopReason'] = 'UNAPPROVED_GATE_FAILURE_OR_CHECKOUT_CHANGE'; save(); raise SystemExit(1)
verify()
result['freezeVerifiedAfter'] = True
result['browserMedianSeconds'] = statistics.median(x['elapsedSeconds'] for x in result['runs'] if x['gate'] == 'browser-fixture')
result['stopReason'] = 'MEDIAN_EXCEEDED' if a.median_limit is not None and result['browserMedianSeconds'] > a.median_limit else None
result['acceptance'] = 'NOT_SATISFIED' if result['stopReason'] else 'SATISFIED'
result['finishedAtCET'] = now(); save()
print('COMPLETE', result['acceptance'], result['browserMedianSeconds'], flush=True)
raise SystemExit(int(result['stopReason'] is not None))
