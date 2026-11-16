import os, subprocess, time, json, pathlib
root=pathlib.Path(__file__).resolve().parents[2]; out=pathlib.Path(__file__).parent/'gates'
sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
env={k:os.environ[k] for k in ['PATH','HOME','TMPDIR'] if k in os.environ}
profile='(version 1)(allow default)(deny network-outbound)(allow network-outbound (remote ip "localhost:*"))'
results=[]
for label, command in [('typecheck',['npm','run','typecheck']),('arch-check',['npm','run','arch:check']),('test',['npm','test']),('browser-fixture',['npm','run','test:browser:fixture']),('build',['npm','run','build'])]:
 before=subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True)
 if before: raise RuntimeError('Dirty tree before '+label+': '+before)
 start=time.monotonic()
 with (out/(label+'.log')).open('w') as log:
  p=subprocess.run(['/usr/bin/sandbox-exec','-p',profile,*command],cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT)
 elapsed=time.monotonic()-start
 after=subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True)
 row={'gate':label,'command':command,'sha':sha,'exitCode':p.returncode,'seconds':elapsed,'cleanBefore':not before,'cleanAfter':not after,'envLoaded':False,'network':'OS outbound denied except loopback'}
 results.append(row); (out/'manifest.json').write_text(json.dumps(results,indent=2)+'\n'); print(json.dumps(row),flush=True)
 if p.returncode or after: break
