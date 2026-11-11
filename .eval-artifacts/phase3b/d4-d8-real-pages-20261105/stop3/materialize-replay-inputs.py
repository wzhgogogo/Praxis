# Offline only: restore immutable user-referenced D4/D8 Git blobs, never fetch.
import hashlib,json,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parent
for row in json.loads((root/'source-input-provenance.json').read_text())['files']:
 path=root/row['file']
 assert path.resolve().is_relative_to(root)
 raw=path.read_bytes() if path.exists() else subprocess.check_output(['git','show',row['commit']+':'+row['gitPath']])
 assert hashlib.sha256(raw).hexdigest()==row['sha256'],row['file']
 if not path.exists():
  path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
print('Verified immutable D4/D8 replay inputs; external requests: 0')
