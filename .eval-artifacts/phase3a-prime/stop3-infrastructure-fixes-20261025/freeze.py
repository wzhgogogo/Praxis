"""Freeze current source/configuration and per-item orchestration before gates."""
from pathlib import Path
import hashlib,json,subprocess,sys
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
root=Path.cwd();item=Path(sys.argv[1]);extra=sys.argv[2:]
files=subprocess.check_output(['git','ls-files','-z','--','src','scripts','web-skills','package.json','package-lock.json','tsconfig.json','tsconfig.build.json']).decode().split('\0')
files += ['.eval-artifacts/phase3a-prime/stop3-infrastructure-fixes-20261025/freeze.py','.eval-artifacts/phase3a-prime/stop3-infrastructure-fixes-20261025/run-gates.py',*extra]
files=sorted(set(p for p in files if p and (root/p).is_file()))
result={'status':'frozen regression; exposed offline inputs','createdAt':datetime.now(timezone(timedelta(hours=1), 'CET')).isoformat(),'parentCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'files':{p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in files}}
(item/'freeze.json').write_text(json.dumps(result,indent=2)+'\n')
print('FROZEN',len(files),'files')
