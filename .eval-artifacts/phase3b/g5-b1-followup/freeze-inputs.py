import hashlib,json,subprocess
from pathlib import Path
r=Path('.eval-artifacts/phase3b/g5-b1-followup')
files=set(subprocess.check_output(['git','ls-files','src','scripts','package.json','package-lock.json'],text=True).splitlines())
files.update(str(r/n) for n in ['plan.md','resources.json','robots-decision.json','robots.raw','robots.decoded.txt','robots.meta.json','help.raw','help.decoded.txt','help.meta.json','fetch-public.mjs','verify-web.mjs','evaluate-web.py','freeze-inputs.py','verify-inputs.py','run-gates.py','live-checklist.md'])
files.add('docs/decisions/0049-source-bound-b1-booking-handoff.md');assert not any(Path(p).name.startswith('.env') or '.eval-private' in p for p in files)
x={'baseMain':'50a0836148c5b026240a770de89c5d5357091355','configurationParent':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'evidenceStatus':'frozen exposed offline regression plus two public help/robots GETs','files':[{'path':p,'sha256':hashlib.sha256(Path(p).read_bytes()).hexdigest()} for p in sorted(files)]}
(r/'freeze.json').write_text(json.dumps(x,indent=2)+'\n');print(json.dumps({'frozenFiles':len(files)}))
