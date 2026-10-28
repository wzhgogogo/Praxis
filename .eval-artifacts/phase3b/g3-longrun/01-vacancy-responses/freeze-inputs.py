from pathlib import Path
import hashlib, json, sys

root, item = Path.cwd(), Path(__file__).resolve().parent
files = set()
for directory in ('src', 'scripts', 'web-skills'):
    files.update(path for path in (root / directory).rglob('*') if path.is_file())
files.update(root / name for name in ('package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.build.json'))
files.update(item.glob('*.py'))
files.add(item / 'plan.md')
files.add(root / 'docs/decisions/0048-tabelog-calendar-response-evidence.md')
assert all(path.name != '.env' and not path.name.startswith('answers') for path in files)
result = {'mode': 'OFFLINE_G3_GROUP01_VACANCY', 'files': {str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(files)}}
target = Path(sys.argv[1]); target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'files': len(files), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))
