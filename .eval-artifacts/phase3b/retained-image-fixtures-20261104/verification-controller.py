import subprocess,time,json,os
from pathlib import Path
out=Path('/tmp/praxis-retained-image-fixtures')
rows=[]
commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
steps=[('typecheck',['npm','run','typecheck']),('arch',['npm','run','arch:check']),('default',['npm','test']),('build',['npm','run','build']),('chromium',['npm','run','test:browser:fixture']),('strict-g2',['npm','run','test:dom-change'])]
for name,cmd in steps:
 pre=subprocess.check_output(['git','status','--porcelain'],text=True)
 if pre: raise RuntimeError('dirty before '+name+': '+pre)
 print('START '+name,flush=True);start=time.monotonic()
 env=dict(os.environ)
 if name=='strict-g2':env['PRAXIS_G2_REQUIRE_PASS']='1'
 with (out/(name+'.log')).open('wb') as f:r=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT,env=env)
 post=subprocess.check_output(['git','status','--porcelain'],text=True)
 row=dict(name=name,command=cmd,exitCode=r.returncode,elapsedSeconds=round(time.monotonic()-start,3),preStatus=pre,postStatus=post)
 rows.append(row);(out/'gates.json').write_text(json.dumps(dict(candidate=commit,steps=rows),indent=2)+'\n')
 print('END '+json.dumps(row),flush=True)
 if r.returncode or post:raise SystemExit(1)
