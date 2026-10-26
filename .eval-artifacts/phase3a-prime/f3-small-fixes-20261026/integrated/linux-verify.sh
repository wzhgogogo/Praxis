#!/bin/bash
set -euo pipefail
cd "$HOME/praxis-f3-small-fixes"
task_root=.eval-artifacts/phase3a-prime/f3-small-fixes-20261026
task_output=/tmp/praxis-f3-small-fixes-current-validation
mkdir -p "$task_output"
python3 - <<'PY'
from pathlib import Path
import json,os,platform,subprocess,datetime,hashlib
assert os.cpu_count()==2
source='src/server/local-web-server.test.ts'
receipt={'mode':'OFFLINE_LOCAL_VM','cpus':os.cpu_count(),'platform':platform.platform(),'node':subprocess.check_output(['node','--version'],text=True).strip(),'uid':os.getuid(),'sourceArchiveOrigin':'Approved concurrent main70a7eb1f plus A review fixes; frozen source hash manifest','guestInitialCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'beforeSourceSha256':hashlib.sha256(Path(source).read_bytes()).hexdigest(),'utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
Path('/tmp/praxis-f3-small-fixes-current-validation/environment.json').write_text(json.dumps(receipt,indent=2)+'\n')
PY
python3 - <<'CHECK'
from pathlib import Path
import json,hashlib,subprocess
root=Path('.eval-artifacts/phase3a-prime/f3-small-fixes-20261026')
freeze=json.loads((root/'integrated/freeze.json').read_text())
for path,expected in freeze['files'].items():
 assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==expected,path
Path('/tmp/praxis-f3-small-fixes-current-validation/source-check.json').write_text(json.dumps({'frozenFilesVerified':len(freeze['files']),'guestCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'dirty':subprocess.check_output(['git','status','--porcelain'],text=True),'sourceMatchesHostFreeze':True},indent=2)+'\n')
CHECK
for task_sample in 1 2 3; do
 unshare -rn sh -c 'ip link set lo up; ip -brief addr; cat /proc/net/route' > "$task_output/network-$task_sample.log"
 unshare -rn sh -c 'ip link set lo up; exec python3 "$1/run-gates.py" --freeze "$1/integrated/freeze.json" --output "$2"' sh "$task_root" "$task_output/sample-$task_sample"
done
