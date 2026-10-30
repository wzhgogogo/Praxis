from pathlib import Path
import json,hashlib,subprocess
r=Path('.eval-artifacts/phase3b/g5-b1-main')
subprocess.run(['git','merge-base','--is-ancestor','50a0836148c5b026240a770de89c5d5357091355','HEAD'],check=True)
subprocess.run(['git','diff','--quiet','389747099d2dea94ea28833749917f06ce094638','--','src','scripts','package.json','package-lock.json'],check=True)
subprocess.run(['python3','-B','.eval-artifacts/phase3b/g5-b1-followup/verify-inputs.py'],check=True)
f=json.loads((r/'freeze.json').read_text())
for row in f['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
s=Path('src/server/local-web-server.ts').read_text();boot=s[s.rindex('createLocalWebServer({'):];assert 'bookingHandoffs' not in boot,'ordinary startup must not inject source reader'
print(json.dumps({'status':'PASS','reviewedSource':'38974709','ordinaryReader':'NOT_INJECTED','newCalls':0}))
