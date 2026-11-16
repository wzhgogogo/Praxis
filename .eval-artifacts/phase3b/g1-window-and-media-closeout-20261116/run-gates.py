import subprocess,json,time
from pathlib import Path
root=Path('/private/tmp/praxis-premerge-scope-main-20261115')
out=Path(__file__).resolve().parent
sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
assert not subprocess.check_output(['git','status','--porcelain'],cwd=root)
commands=[['npm','run','typecheck'],['npm','run','arch:check'],['npm','test'],['npm','run','build'],['npm','run','test:browser:fixture']]
rows=[]
for i,command in enumerate(commands,1):
    start=time.time();log=f'gate-{i}.log'
    with (out/log).open('x') as f: code=subprocess.run(command,cwd=root,stdout=f,stderr=subprocess.STDOUT).returncode
    status=subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True)
    row={'command':command,'exitCode':code,'elapsedMs':round((time.time()-start)*1000),'log':log,'cleanAfter':not status,'sourceSHA':sha}
    rows.append(row);(out/'gates.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(row),flush=True)
    if code or status: raise SystemExit(1)
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()==sha
