from pathlib import Path
import datetime, hashlib, json, subprocess, sys, time

base = Path('.eval-artifacts/phase3a-boundary/review-correction')
def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()
def cet():
    return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(timespec='seconds')
def verify():
    for item in json.loads((base / 'freeze.json').read_text())['files']:
        assert hashlib.sha256(Path(item['path']).read_bytes()).hexdigest() == item['sha256'], item['path']

assert not git('status', '--porcelain')
verify()
directory = base / 'offline-gates'
directory.mkdir(exist_ok=True)
record = {'sourceCommit': git('rev-parse', 'HEAD'), 'startedAtCET': cet(), 'mode': 'OFFLINE_ONLY_NO_ENV_FILE', 'realModelCalls': 0, 'steps': []}
steps = [('outer-self-test', ['node', '--import', 'tsx', str(base / 'run.mjs'), '--self-test']),
         ('typecheck', ['npm', 'run', 'typecheck']), ('arch-check', ['npm', 'run', 'arch:check']),
         ('test', ['npm', 'test']), ('build', ['npm', 'run', 'build']),
         ('browser-fixture', ['npm', 'run', 'test:browser:fixture'])]
for name, command in steps:
    started, tick = cet(), time.monotonic()
    log = directory / (name + '.log')
    with log.open('wb') as output:
        result = subprocess.run(command, stdout=output, stderr=subprocess.STDOUT)
    step = {'name': name, 'command': command, 'startedAtCET': started, 'finishedAtCET': cet(), 'elapsedSeconds': round(time.monotonic() - tick, 3),
            'exitCode': result.returncode, 'log': str(log), 'logSha256': hashlib.sha256(log.read_bytes()).hexdigest(), 'gitStatusPorcelainAfter': git('status', '--porcelain')}
    record['steps'].append(step)
    (base / 'offline-verification.json').write_text(json.dumps(record, indent=2) + '\n')
    print(json.dumps(step), flush=True)
    if result.returncode or step['gitStatusPorcelainAfter']:
        sys.exit(1)
    verify()
record['status'] = 'PASS'
record['finishedAtCET'] = cet()
(base / 'offline-verification.json').write_text(json.dumps(record, indent=2) + '\n')
