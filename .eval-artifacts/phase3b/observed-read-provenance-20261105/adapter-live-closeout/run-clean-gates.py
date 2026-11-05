#!/usr/bin/env python3
# Offline gates only. Logs are ignored outputs; every gate requires clean Git.
import subprocess,os,json,time
from pathlib import Path
root=Path(__file__).resolve().parent
out=root/'gates';out.mkdir(exist_ok=False)
steps=[('typecheck',['npm','run','typecheck'],{}),('arch',['npm','run','arch:check'],{}),('test',['npm','test'],{}),('build',['npm','run','build'],{}),('browser-and-g6',['npm','run','test:browser:fixture'],{}),('strict-g2',['npm','run','test:dom-change'],{'PRAXIS_G2_REQUIRE_PASS':'1'})]
rows=[]
for name,command,extra in steps:
 before=subprocess.check_output(['git','status','--porcelain'],text=True)
 if before:raise RuntimeError('Dirty tree before '+name+': '+before)
 start=time.monotonic();print('START '+name,flush=True)
 with (out/(name+'.log')).open('w') as log:result=subprocess.run(command,stdout=log,stderr=subprocess.STDOUT,env={**os.environ,**extra})
 after=subprocess.check_output(['git','status','--porcelain'],text=True)
 row={'gate':name,'command':command,'env':extra,'exitCode':result.returncode,'elapsedSeconds':time.monotonic()-start,'before':before,'after':after}
 rows.append(row);(out/'results.json').write_text(json.dumps(rows,indent=2)+'\n');print('END '+name+' '+str(result.returncode),flush=True)
 if result.returncode or after:raise RuntimeError('Gate failed or dirty tree: '+name)
