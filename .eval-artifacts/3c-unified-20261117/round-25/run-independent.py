import os,subprocess,json,time
from pathlib import Path
root=Path.cwd();batch=Path(__file__).resolve().parent;out=batch/os.environ.get('PRAXIS_ROUND25_BATCH','observations')
assert not out.exists(),str(out)
out.mkdir();(out/'screenshots').mkdir()
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
clean=lambda:not subprocess.check_output(['git','status','--porcelain'],text=True)
if not os.environ.get('PRAXIS_ROUND25_DRY'):assert clean()
env={k:os.environ[k] for k in ['PATH','HOME','TMPDIR'] if k in os.environ};env.update(PRAXIS_ROUND25_OBSERVATIONS=str(out),PRAXIS_ROUND25_VISUAL_OUTPUT=str(out/'screenshots'))
profile='(version 1)(allow default)(deny network-outbound)(allow network-outbound (remote ip "localhost:*"))'
rows=[]
for file in ['collect-preparation.ts','collect-budget.ts','collect-search.mjs','collect-google21.mjs','collect-ui.ts']:
 start=time.monotonic()
 with (out/(file+'.log')).open('w') as log:p=subprocess.run(['/usr/bin/sandbox-exec','-p',profile,'node','--import','tsx',str(batch/file)],env={**env,**({'PRAXIS_ROUND25_COLLECT_ALL':'1'} if file=='collect-google21.mjs' else {})},stdout=log,stderr=subprocess.STDOUT)
 row={'collector':file,'sha':sha,'exitCode':p.returncode,'seconds':time.monotonic()-start,'envLoaded':False,'network':'OS loopback only'};rows.append(row);(out/'manifest.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(row),flush=True)
 if p.returncode:raise SystemExit(1)
required=['preparation.json','budget.json','search.json','google21.json','ui.json']
assert all((out/f).is_file() for f in required)
(out/'collection-complete.json').write_text(json.dumps({'sha':sha,'files':required,'allPresentBeforeAssertion':True,'pngs':len(list((out/'screenshots').glob('*.png')))},indent=2)+'\n')
if not os.environ.get('PRAXIS_ROUND25_DRY'):assert clean()
