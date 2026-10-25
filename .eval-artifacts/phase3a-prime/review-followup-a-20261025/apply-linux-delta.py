"""Apply a verified Git snapshot delta to the task-owned Linux checkout."""
from pathlib import Path
import argparse, hashlib, json, os, subprocess, tarfile

p = argparse.ArgumentParser()
p.add_argument('--archive', type=Path, required=True)
p.add_argument('--manifest', type=Path, required=True)
p.add_argument('--freeze', required=True)
p.add_argument('--receipt', type=Path, required=True)
a = p.parse_args()
root = Path.home() / 'praxis-followup'; os.chdir(root)
state_path = Path('/tmp/praxis-followup-source-state.json')
state = json.loads(state_path.read_text()); delta = json.loads(a.manifest.read_text())
assert state['hostCommit'] == delta['baseHostCommit']
assert not subprocess.check_output(['git', 'status', '--porcelain'])
def verify(path):
    data = json.loads((root / path).read_text())
    for name, expected in data['files'].items():
        assert hashlib.sha256((root / name).read_bytes()).hexdigest() == expected, name
    return len(data['files'])
verify(state['freeze'])
package = (root / 'package-lock.json').read_bytes()
assert hashlib.sha256(a.archive.read_bytes()).hexdigest() == delta['archiveSha256']
with tarfile.open(a.archive) as archive:
    for member in archive.getmembers():
        assert not Path(member.name).is_absolute() and '..' not in Path(member.name).parts
        assert not member.name.startswith(('.git/', 'node_modules/'))
        assert not member.issym() and not member.islnk()
        target = (root / member.name).resolve()
        assert target == root or root in target.parents
    archive.extractall(root)
for name in delta['deletedFiles']:
    target = (root / name).resolve(); assert root in target.parents
    target.unlink()
for name, expected in delta['updatedFiles'].items():
    assert hashlib.sha256((root / name).read_bytes()).hexdigest() == expected, name
assert package == (root / 'package-lock.json').read_bytes(), 'Dependency lock changed: provision before gates'
count = verify(a.freeze)
subprocess.run(['git', 'add', '-A'], check=True)
if subprocess.run(['git', 'diff', '--cached', '--quiet']).returncode:
    subprocess.run(['git', '-c', 'user.name=Offline fixture', '-c', 'user.email=fixture@localhost', 'commit', '-qm', 'Updated frozen source snapshot'], check=True)
assert not subprocess.check_output(['git', 'status', '--porcelain'])
state_path.write_text(json.dumps({'hostCommit': delta['hostCommit'], 'freeze': a.freeze}) + '\n')
result = {'hostCommit': delta['hostCommit'], 'baseHostCommit': delta['baseHostCommit'],
          'guestSnapshotCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
          'updatedFilesVerified': len(delta['updatedFiles']), 'deletedFiles': delta['deletedFiles'],
          'frozenFilesVerified': count, 'archiveSha256': delta['archiveSha256'], 'gitStatus': '',
          'applierSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
a.receipt.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
