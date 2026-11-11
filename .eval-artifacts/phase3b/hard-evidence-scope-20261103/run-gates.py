from pathlib import Path
import subprocess, json, hashlib, datetime, time, os, sys
from zoneinfo import ZoneInfo
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=False)
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
status=lambda:subprocess.check_output(['git','status','--porcelain'],text=True)
if status():raise RuntimeError('DIRTY_BEFORE_GATES')
steps=[('typecheck',['npm','run','typecheck']),('arch',['npm','run','arch:check']),('default',['npm','test']),('build',['npm','run','build']),('chromium',['npm','run','test:browser:fixture']),('strict-g2',['npm','run','test:dom-change'])]
results=[]
for name,cmd in steps:
 before=status();start=time.monotonic();stamp=datetime.datetime.now(ZoneInfo('Europe/Vienna')).isoformat();env=os.environ.copy()
 if name=='strict-g2':env['PRAXIS_G2_REQUIRE_PASS']='1'
 print(name,'START',stamp,flush=True)
 with (out/(name+'.log')).open('w') as log:
  try:r=subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT,env=env,timeout=720 if name=='chromium' else 300);code=r.returncode
  except subprocess.TimeoutExpired:code=124;log.write('\nOUTER_GATE_TIMEOUT\n')
 after=status();row={'name':name,'command':cmd,'startedAtCET':stamp,'seconds':round(time.monotonic()-start,3),'exitCode':code,'preStatus':before,'postStatus':after,'sha':sha,'logSha256':hashlib.sha256((out/(name+'.log')).read_bytes()).hexdigest()};results.append(row)
 (out/'gates.json').write_text(json.dumps({'sha':sha,'timezone':'Europe/Vienna CET UTC+01:00','results':results},indent=2)+'\n')
 print(name,'DONE',code,row['seconds'],'clean',not after,flush=True)
 if before or after or subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()!=sha:raise RuntimeError('FROZEN_GATE_TREE_CHANGED')
raise SystemExit(1 if any(r['exitCode'] for r in results) else 0)
