"""Record focused contract reds/greens without changing the checkout."""
from pathlib import Path
import datetime, hashlib, json, subprocess, sys, time

mode, target = sys.argv[1], Path(sys.argv[2])
assert mode in ('red', 'green') and not target.exists()
target.mkdir(parents=True)
status = lambda: subprocess.check_output(['git', 'status', '--porcelain'], text=True)
assert not status()
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
command = ['node', '--import', './scripts/test-filesystem-guard.mjs', '--import', 'tsx', '--test', '--test-reporter=tap',
           'src/integrations/restaurant-facts/model-page-question-quality.test.ts']
started = time.monotonic()
run = subprocess.run(command, capture_output=True, timeout=90)
raw = run.stdout + run.stderr
(target / 'focused.log').write_bytes(raw)
text = raw.decode()
assert not status()
parents = [line for line in text.splitlines() if line.startswith('not ok ') and 'G1 quality' in line]
result = {'mode': mode, 'commit': commit, 'command': command, 'exitCode': run.returncode,
          'elapsedSeconds': time.monotonic() - started,
          'recordedAtCET': datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),
          'logSha256': hashlib.sha256(raw).hexdigest(), 'gitStatusBefore': '', 'gitStatusAfter': '', 'failedMechanisms': parents}
result['accepted'] = (run.returncode != 0 and len(parents) == 5 and 'ERR_ASSERTION' in text) if mode == 'red' else run.returncode == 0
(target / 'focused.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
raise SystemExit(not result['accepted'])
