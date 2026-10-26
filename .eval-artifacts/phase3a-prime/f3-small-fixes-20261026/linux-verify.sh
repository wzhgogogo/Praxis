#!/bin/bash
set -euo pipefail
cd "$HOME/praxis-f3-small-fixes"
task_root=.eval-artifacts/phase3a-prime/f3-small-fixes-20261026
task_output=/tmp/praxis-f3-small-fixes-validation
mkdir -p "$task_output"
python3 - <<'PY'
from pathlib import Path
import json,os,platform,subprocess,datetime,hashlib
assert os.cpu_count()==2
source='src/server/local-web-server.test.ts'
receipt={'mode':'OFFLINE_LOCAL_VM','cpus':os.cpu_count(),'platform':platform.platform(),'node':subprocess.check_output(['node','--version'],text=True).strip(),'uid':os.getuid(),'sourceArchiveOrigin':'f7c0ea51','guestInitialCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'beforeSourceSha256':hashlib.sha256(Path(source).read_bytes()).hexdigest(),'utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
Path('/tmp/praxis-f3-small-fixes-validation/environment.json').write_text(json.dumps(receipt,indent=2)+'\n')
PY
# The existing physical-window test is measured before applying the fix.
set +e
unshare -rn sh -c 'ip link set lo up; node --import ./scripts/test-filesystem-guard.mjs --import tsx --test --test-name-pattern="W12 Live Persistent run keeps" src/server/local-web-server.test.ts' > "$task_output/w12-before.log" 2>&1
task_red_code=$?
set -e
python3 - "$task_red_code" <<'PY'
from pathlib import Path
import json,sys
text=Path('/tmp/praxis-f3-small-fixes-validation/w12-before.log').read_text()
Path('/tmp/praxis-f3-small-fixes-validation/w12-before.json').write_text(json.dumps({'exitCode':int(sys.argv[1]),'knownFailureReproduced':'Timed out waiting for W12 source search to start' in text,'status':'RED' if int(sys.argv[1]) else 'NOT_REPRODUCED','notAFiveGateRun':True},indent=2)+'\n')
PY
test -z "$(git status --porcelain)"
git apply --check /tmp/praxis-f3-small-fixes-delta.patch
git apply /tmp/praxis-f3-small-fixes-delta.patch
git add .
git -c user.name='Offline fixture' -c user.email='fixture@localhost' commit -qm 'Apply frozen review fix delta'
python3 - <<'PY'
from pathlib import Path
import json,hashlib,subprocess
root=Path('.eval-artifacts/phase3a-prime/f3-small-fixes-20261026')
freeze=json.loads((root/'corrected-inputs/freeze.json').read_text())
for path,expected in freeze['files'].items():
 assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==expected,path
Path('/tmp/praxis-f3-small-fixes-validation/source-check.json').write_text(json.dumps({'frozenFilesVerified':len(freeze['files']),'guestCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'dirty':subprocess.check_output(['git','status','--porcelain'],text=True),'sourceMatchesHostFreeze':True},indent=2)+'\n')
PY
for task_sample in 1 2 3; do
 unshare -rn sh -c 'ip link set lo up; ip -brief addr; cat /proc/net/route' > "$task_output/network-$task_sample.log"
 unshare -rn sh -c 'ip link set lo up; exec python3 "$1/run-gates.py" --freeze "$1/corrected-inputs/freeze.json" --output "$2"' sh "$task_root" "$task_output/sample-$task_sample"
done
