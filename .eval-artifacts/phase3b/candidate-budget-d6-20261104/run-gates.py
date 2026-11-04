"""Run exactly the user-requested offline matrix, retaining clean-tree receipts."""
from datetime import datetime
from zoneinfo import ZoneInfo
import gzip
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time

output = Path(sys.argv[1]).resolve()
output.mkdir(parents=True, exist_ok=True)
steps = [('typecheck', ['npm', 'run', 'typecheck']), ('arch', ['npm', 'run', 'arch:check']),
         ('default', ['npm', 'test']), ('build', ['npm', 'run', 'build']),
         ('chromium-and-g6', ['npm', 'run', 'test:browser:fixture']),
         ('strict-g2', ['env', 'PRAXIS_G2_REQUIRE_PASS=1', 'npm', 'run', 'test:dom-change'])]
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
rows = []
for name, command in steps:
    before = subprocess.check_output(['git', 'status', '--porcelain'], text=True)
    assert not before, (name, 'dirty before', before)
    started = datetime.now(ZoneInfo('Europe/Vienna')).isoformat()
    tick = time.monotonic()
    with (output / (name + '.log')).open('wb') as log:
        process = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT)
    elapsed = time.monotonic() - tick
    after = subprocess.check_output(['git', 'status', '--porcelain'], text=True)
    data = (output / (name + '.log')).read_bytes()
    (output / (name + '.log.gz')).write_bytes(gzip.compress(data, mtime=0))
    rows.append({'name': name, 'command': command, 'head': head, 'startedAtCET': started,
                 'elapsedSeconds': round(elapsed, 3), 'exitCode': process.returncode,
                 'statusBefore': before, 'statusAfter': after, 'logSHA256': hashlib.sha256(data).hexdigest()})
    (output / 'gates.json').write_text(json.dumps(rows, indent=2) + '\n')
    print(json.dumps(rows[-1]), flush=True)
    if after:
        raise RuntimeError('Gate modified repository: ' + after)
    if process.returncode:
        raise SystemExit(process.returncode)
