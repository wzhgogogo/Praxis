from pathlib import Path
import hashlib, json, subprocess
root = Path.cwd()
item = Path(__file__).resolve().parent
paths = set(subprocess.check_output(['git', 'ls-files', '-z', '--', 'src', 'scripts', 'web-skills',
    'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.build.json']).decode().strip('\0').split('\0'))
paths.update(str(p.relative_to(root)) for p in item.iterdir() if p.name in
    ('plan.md', 'source.json', 'reproduce-d4.ts', 'run-gates.py', 'freeze-inputs.py'))
paths.update(['.eval-artifacts/phase3b/g1-revision/check-fact-compatibility.ts',
    '.eval-artifacts/phase3b/g3-longrun/hard-before.json'])
assert all(p and Path(p).name != '.env' and not Path(p).name.startswith('answers') for p in paths)
data = {'mode': 'OFFLINE_HARD_CONDITION_FIX', 'files': {
    p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in sorted(paths)}}
dest = item / 'input-freeze.json'
dest.write_text(json.dumps(data, indent=2) + '\n')
print(json.dumps({'files': len(paths), 'sha256': hashlib.sha256(dest.read_bytes()).hexdigest()}))
