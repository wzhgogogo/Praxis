import os,subprocess,pathlib,json,time
root=pathlib.Path.cwd();out=root/'.eval-artifacts/3c-unified-20261117/round-25';logs=out/'acceptance';logs.mkdir(exist_ok=False)
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();source=subprocess.check_output(['git','rev-parse','HEAD:src'],text=True).strip()
env={k:os.environ[k] for k in ['PATH','HOME','TMPDIR'] if k in os.environ}
sandbox=['/usr/bin/sandbox-exec','-p','(version 1)(allow default)(deny network-outbound)(allow network-outbound (remote ip "localhost:*"))'];clean=lambda:not subprocess.check_output(['git','status','--porcelain'],text=True)
rows=[]
(out/'history').mkdir(exist_ok=False)
tasks=[('gates',['python3','.eval-artifacts/3c-unified-20261117/run-gates.py'],{'PRAXIS_GATES_SUBDIR':'round-25/gates'},False),('c1-built',['python3',str(out/'run-c1-built.py')],{},False),('graph',['python3',str(out/'inspect-browser-graph.py')],{},False),('assets',['node','--import','tsx',str(out/'verify-build-assets.mjs')],{},True),('independent-collect',['python3',str(out/'run-independent.py')],{},False),('independent-assert',['node',str(out/'assert-observations.mjs')],{},True),('manual-user-routes',['node','--import','tsx',str(out/'manual-user-routes-current.mjs')],{'PRAXIS_REVIEW_EXPECT_SOURCE':source},True),('reported-front-end-paths',['node','--import','tsx',str(out/'reported-front-end-paths.mjs')],{'PRAXIS_REVIEW_EXPECT_SOURCE':source},True),('visual',['python3',str(out/'run-visual.py')],{},False),('visual-inventory',['python3',str(out/'verify-visual-inventory.py')],{},False)]
for name,cmd,extra,isolated in tasks:
 assert clean();t=time.monotonic();print('START',name,sha,flush=True)
 with (logs/(name+'.log')).open('w') as log:
  try:r=subprocess.run((sandbox if isolated else [])+cmd,env={**env,**extra},stdout=log,stderr=subprocess.STDOUT,timeout=3600);code=r.returncode
  except subprocess.TimeoutExpired:code=124
 row={'name':name,'sha':sha,'sourceTree':source,'command':cmd,'extraEnvironment':extra,'exitCode':code,'seconds':time.monotonic()-t,'cleanBefore':True,'cleanAfter':clean(),'envLoaded':False,'network':'OS outbound denied except loopback; browser gate Replay children own their OS isolation'}
 rows.append(row);(logs/'manifest.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(row),flush=True)
 if code or not row['cleanAfter']:raise SystemExit(1)
