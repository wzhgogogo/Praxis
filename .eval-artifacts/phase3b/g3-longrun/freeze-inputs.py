from pathlib import Path
import hashlib, json

root, item = Path.cwd(), Path(__file__).resolve().parent
files = set()
for directory in ('src', 'scripts', 'web-skills'):
    files.update(path for path in (root / directory).rglob('*') if path.is_file())
files.update(root / name for name in ('package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.build.json'))
files.update(path for path in item.iterdir() if path.suffix in ('.py', '.ts') or path.name in ('CODEX-3B-B-G3-LONGRUN.md', 'file-assignment.md', 'hard-before.json', 'c-protected-tests.json'))
assert all(path.name != '.env' and not path.name.startswith('answers') for path in files)
result = {'baseMain': 'ba466eb3eff89cc3f934bafc2134a39c4b6d84ed', 'mode': 'G3_LONGRUN_PREFLIGHT_OFFLINE',
          'files': {str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(files)}}
target = item / 'input-freeze.json'
target.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'files': len(files), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))
