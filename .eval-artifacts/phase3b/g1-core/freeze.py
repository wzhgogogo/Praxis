"""Freeze executable inputs and the explicitly supplied per-slice evidence."""
from pathlib import Path
import datetime, hashlib, json, subprocess, sys
root = Path.cwd(); item = Path(sys.argv[1])
shared = Path(__file__).resolve().parent
files = subprocess.check_output(['git', 'ls-files', '-z', '--', 'src', 'scripts', 'web-skills', 'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.build.json'], text=True).split('\0')
files += [str(p.relative_to(root)) for p in (shared / 'freeze.py', shared / 'run-gates.py')]
files += sys.argv[2:]
files = sorted(set(p for p in files if p and (root / p).is_file()))
result = {'status': 'frozen regression; exposed offline inputs',
          'createdAtCET': datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1), 'CET')).isoformat(),
          'parentCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
          'files': {p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in files}}
(item / 'freeze.json').write_text(json.dumps(result, indent=2) + '\n')
print('FROZEN', len(files), 'files')
