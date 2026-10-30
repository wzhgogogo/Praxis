from pathlib import Path
import subprocess, json, re, time, datetime, sys, hashlib

mode, out = sys.argv[1], Path(sys.argv[2])
assert mode in ('red', 'green') and not out.exists()
out.mkdir(parents=True)
status = lambda: subprocess.check_output(['git', 'status', '--porcelain'], text=True)
assert not status()
result = {'mode': mode, 'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
          'startedAtCET': datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(), 'runs': []}
for name, path in [('unit', 'src/integrations/tabelog/tabelog-observed-list.test.ts'),
                   ('chromium', 'src/harness/browser/browser-read-tabelog-public-list.test.ts')]:
    assert not status()
    command = ['node', '--import', './scripts/test-filesystem-guard.mjs', '--import', 'tsx', '--test', '--test-reporter=tap', path]
    start = time.monotonic()
    run = subprocess.run(command, capture_output=True, timeout=90)
    raw = run.stdout + run.stderr; text = raw.decode()
    (out / (name + '.log')).write_bytes(raw)
    accepted = run.returncode == 0 if mode == 'green' else run.returncode != 0 and 'ERR_ASSERTION' in text and ('public' in text or 'renamed' in text)
    row = {'name': name, 'command': command, 'exitCode': run.returncode, 'accepted': accepted,
           'seconds': time.monotonic() - start, 'gitStatusBefore': '', 'gitStatusAfter': status(),
           'summary': {k: int(v) for k, v in re.findall(r'^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$', text, re.M)},
           'logSha256': hashlib.sha256(raw).hexdigest()}
    result['runs'].append(row)
    (out / 'targeted.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(row), flush=True)
    if not accepted or row['gitStatusAfter']: raise SystemExit(1)
result['allAccepted'] = True
(out / 'targeted.json').write_text(json.dumps(result, indent=2) + '\n')
