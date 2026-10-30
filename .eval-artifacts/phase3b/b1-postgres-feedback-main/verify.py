from pathlib import Path
import hashlib, json, subprocess

root = Path('.eval-artifacts/phase3b/b1-postgres-feedback-main')
frozen = json.loads((root / 'freeze.json').read_text())
for row in frozen['files']:
    assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest() == row['sha256'], row['path']
subprocess.run(['git', 'merge-base', '--is-ancestor', frozen['baseMain'], 'HEAD'], check=True)
subprocess.run(['git', 'merge-base', '--is-ancestor', frozen['reviewedCommit'], 'HEAD'], check=True)
subprocess.run(['git', 'diff', '--exit-code', frozen['baseMain'], '--', 'src', 'scripts', 'web-skills', 'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.build.json', '.eval-artifacts/phase3b/budget.json'], check=True)
subprocess.run(['git', 'diff', '--exit-code', frozen['reviewedCommit'], '--', '.eval-artifacts/phase3b/b1-postgres-feedback'], check=True)
subprocess.run(['python3', '-B', '.eval-artifacts/phase3b/b1-postgres-feedback/verify.py'], check=True)
print(json.dumps({'status': 'PASS', 'frozenInputs': len(frozen['files']), 'productAndReviewedEvidence': 'UNCHANGED', 'newDatabaseRuns': 0, 'newProviderCalls': 0, 'envRead': False}))
