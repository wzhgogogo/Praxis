import hashlib,json,subprocess
from pathlib import Path
root=Path('.eval-artifacts/phase3b/g5-b1')
files=set(subprocess.check_output(['git','ls-files','src','scripts','package.json','package-lock.json'],text=True).splitlines())
files.update(str(p) for p in (root/'inputs').rglob('*') if p.is_file())
files.update(str(root/name) for name in ['plan.md','resources.json','verify-web.mjs','evaluate-web.py','freeze-inputs.py','verify-inputs.py','run-gates.py','cross-ownership.json'])
files.add('docs/decisions/0048-source-bound-b1-booking-handoff.md')
assert not any(Path(p).name.startswith('.env') or '.eval-private' in p for p in files)
record={'evidenceStatus':'frozen exposed regression / synthetic local controls','baseMain':'b2a3cbd30e6f0c78486cf8b8671e7820a227d550','configurationParent':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'files':[{'path':p,'sha256':hashlib.sha256(Path(p).read_bytes()).hexdigest()} for p in sorted(files)],'protectedPaths':{},'newRealCalls':0}
for p in ['src/integrations/tabelog/tabelog-browser-availability.ts','src/integrations/tabelog/tabelog-query-controls.ts','src/integrations/tabelog/tabelog-vacancy-response.ts']:
    content=subprocess.run(['git','show','b2a3cbd3:'+p],capture_output=True)
    if content.returncode: assert not Path(p).exists();record['protectedPaths'][p]='ABSENT_AT_BASE'
    else: assert content.stdout==Path(p).read_bytes();record['protectedPaths'][p]=hashlib.sha256(content.stdout).hexdigest()
(root/'freeze.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps({'frozenFiles':len(files),'newRealCalls':0}))
