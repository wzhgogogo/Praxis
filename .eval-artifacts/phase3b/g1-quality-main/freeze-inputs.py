"""Hash allowed source/configuration and this slice's inputs; never QA answers/.env."""
from pathlib import Path
import hashlib, json, subprocess, sys

root = Path.cwd()
item = Path(__file__).resolve().parent
files = set()
for folder in ('src', 'scripts', 'web-skills'):
    files.update(path for path in (root / folder).rglob('*') if path.is_file())
files.update(root / name for name in ('package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.build.json'))
questions = root / '.eval-artifacts/phase3b/g1-qa/questions.json'
files.add(questions)
for page in json.loads(questions.read_text())['pages']:
    files.add(root / page['pagePath'])
files.update(path for path in item.iterdir() if path.suffix in ('.py', '.ts') or path.name == 'hard-before.json')
files = sorted(files)
assert all(path.name != '.env' and not path.name.startswith('answers') for path in files)
result = {'mode': 'OFFLINE_FROZEN_INPUTS_NO_QA_ANSWERS', 'base': subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip(),
          'files': {str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest() for path in files}}
target = Path(sys.argv[1])
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'files': len(files), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))
