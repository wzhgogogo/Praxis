from pathlib import Path
import hashlib, json

root = Path.cwd()
files = set()
for folder in ('src', 'scripts', 'web-skills'):
    files.update(path for path in (root / folder).rglob('*') if path.is_file())
files.update(root / name for name in ('package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.build.json'))
files.update(Path(__file__).resolve().parent.glob('*.py'))
files.add(root / 'docs/decisions/0047-g3-observed-task-behavior-acceptance.md')
assert all(path.name != '.env' and not path.name.startswith('answers') for path in files)
result = {'mode': 'OFFLINE_STRICT_G2_BASELINE', 'baseMain': 'eb1518f1ad3f4fa8da4469c993b02d1b9f15ccf8',
          'files': {str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(files)}}
target = Path(__file__).resolve().parent / 'input-freeze.json'
target.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'files': len(files), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))
