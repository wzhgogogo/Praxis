import subprocess,json,datetime
from pathlib import Path
root=Path('.eval-artifacts/phase3b/d8-positive-slot-20261108/offline-repair/gates');root.mkdir(exist_ok=True)
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
def clean():return subprocess.check_output(['git','status','--porcelain'],text=True)==''
def now():return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
rows=[]
for name,cmd in [('typecheck','npm run typecheck'),('architecture','npm run arch:check'),('default','npm test'),('build','npm run build'),('chromium-g6','npm run test:browser:fixture'),('strict-g2','PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change')]:
 before=clean();start=now()
 if not before:raise RuntimeError('dirty before '+name)
 with (root/(name+'.log')).open('w') as out:r=subprocess.run(cmd,shell=True,stdout=out,stderr=subprocess.STDOUT)
 row={'name':name,'command':cmd,'sha':sha,'startCET':start,'endCET':now(),'exitCode':r.returncode,'cleanBefore':before,'cleanAfter':clean(),'sameSHA':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==sha};rows.append(row);(root/'results.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(row),flush=True)
 if r.returncode or not row['cleanAfter'] or not row['sameSHA']:raise SystemExit(1)
