import os, subprocess, time, json, pathlib, sys
root=pathlib.Path(__file__).resolve().parents[2]; out=root/'.eval-artifacts/3c-unified-20261117/round-5/gates'; out.mkdir(parents=True, exist_ok=False)
sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
env={k:os.environ[k] for k in ['PATH','HOME','TMPDIR'] if k in os.environ}
profile='(version 1)(allow default)(deny network-outbound)(allow network-outbound (remote ip "localhost:*"))'
results=[]
for label, command in [('typecheck',['npm','run','typecheck']),('arch-check',['npm','run','arch:check']),('test',['npm','test']),('browser-fixture',['npm','run','test:browser:fixture']),('build',['npm','run','build'])]:
 before=subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True)
 if before: raise RuntimeError('Dirty tree before '+label+': '+before)
 start=time.monotonic()
 with (out/(label+'.log')).open('w') as log:
  invocation=command if label=='browser-fixture' else ['/usr/bin/sandbox-exec','-p',profile,*command]
  p=subprocess.run(invocation,cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT)
 elapsed=time.monotonic()-start
 after=subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True)
 row={'gate':label,'command':command,'sha':sha,'exitCode':p.returncode,'seconds':elapsed,'cleanBefore':not before,'cleanAfter':not after,'envLoaded':False,'network':('offline Fixture contracts; runner-replay children apply their own OS outbound denial; no outer sandbox' if label=='browser-fixture' else 'OS outbound denied except loopback'),'invocation':invocation}
 raw=(out/(label+'.log')).read_text(); row['testSummaries']=[{'tests':int(a),'pass':int(b),'fail':int(c)} for a,b,c in __import__('re').findall(r'(?:ℹ |# )tests (\d+).*?(?:ℹ |# )pass (\d+).*?(?:ℹ |# )fail (\d+)',raw,__import__('re').S)]; results.append(row); (out/'manifest.json').write_text(json.dumps(results,indent=2)+'\n'); print(json.dumps(row),flush=True)
 if p.returncode or after: break

sys.exit(0 if len(results)==5 and all(r['exitCode']==0 and r['cleanAfter'] for r in results) else 1)
