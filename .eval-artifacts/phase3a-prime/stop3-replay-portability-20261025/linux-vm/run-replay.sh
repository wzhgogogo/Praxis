#!/bin/bash
set -euo pipefail
cd "$HOME/praxis-replay"
output="/tmp/praxis-replay-evidence/$1"
mkdir -p "$output"
python3 scripts/replay-network-check.py --output "$output/isolation.json"
python3 - "$output/source-check.json" <<'PY'
from pathlib import Path
import hashlib,json,subprocess,sys
manifest=json.loads(Path('.eval-artifacts/phase3a-prime/stop3-replay-portability-20261025/linux-vm/source-manifest.json').read_text())
for path,expected in manifest['files'].items():
    assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==expected,path
Path(sys.argv[1]).write_text(json.dumps({'status':'PASS','sourceCommit':manifest['sourceCommit'],'checkedFiles':len(manifest['files']),'guestSnapshotCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()},indent=2)+'\n')
PY
set +e
node --import ./scripts/test-filesystem-guard.mjs --import tsx --test src/harness/browser/runner-replay.test.ts > "$output/runner-replay.log" 2>&1
status=$?
set -e
printf '%s\n' "$status" > "$output/exit-code.txt"
cat "$output/runner-replay.log"
test -z "$(git status --porcelain)"
exit "$status"
