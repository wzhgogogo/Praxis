from pathlib import Path
import datetime, hashlib, json, os, re, subprocess, sys, time

item = Path(__file__).resolve().parent
freeze = json.loads((item / 'input-freeze.json').read_text())
for name, expected in freeze['files'].items():
    assert hashlib.sha256(Path(name).read_bytes()).hexdigest() == expected, name
status = lambda: subprocess.check_output(['git', 'status', '--porcelain'], text=True)
assert not status()
out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=False)
command = ['npm', 'run', 'test:dom-change']
start = time.monotonic()
run = subprocess.run(command, env={**os.environ, 'PRAXIS_G2_REQUIRE_PASS': '1'}, capture_output=True, timeout=240)
raw = run.stdout + run.stderr; text = raw.decode()
(out / 'strict-g2.log').write_bytes(raw)
after = status()
result = {'mode': 'OFFLINE_BASELINE_RED_NO_IMPLEMENTATION', 'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
          'atCET': datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(), 'command': command,
          'environment': {'PRAXIS_G2_REQUIRE_PASS': '1'}, 'exitCode': run.returncode, 'elapsedSeconds': time.monotonic() - start,
          'summary': {k: int(v) for k, v in re.findall(r'^(?:#|ℹ) (tests|pass|fail|cancelled|skipped|todo) (\d+)$', text, re.M)},
          'gitStatusBefore': '', 'gitStatusAfter': after, 'logSha256': hashlib.sha256(raw).hexdigest(),
          'expectedRedObserved': run.returncode != 0 and 'G3 requires PASS' in text, 'realCalls': 0}
for name, expected in freeze['files'].items():
    assert hashlib.sha256(Path(name).read_bytes()).hexdigest() == expected, name
result['inputsUnchanged'] = True
(out / 'strict-g2.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
raise SystemExit(not result['expectedRedObserved'] or bool(after))
