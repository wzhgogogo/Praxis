import os, subprocess, pathlib, json, time
root=pathlib.Path.cwd()
out=root/'.eval-artifacts/3c-unified-20261117/round-20'
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
clean=lambda: not subprocess.check_output(['git','--no-optional-locks','status','--porcelain'],text=True)
sandbox=['/usr/bin/sandbox-exec','-p','(version 1)(allow default)(deny network-outbound)(allow network-outbound (remote ip "localhost:*"))']
env={k:os.environ[k] for k in ['PATH','HOME','TMPDIR'] if k in os.environ}
assert all(not (out/p).exists() for p in ('formal','style1','states','visual-driver.json'))
results=[]
for label,selection,command in (
 ('formal',{'PRAXIS_VISUAL_SUBDIR':'round-20/formal'},['node','--import','tsx','.eval-artifacts/3c-unified-20261117/visual-smoke.mjs']),
 ('style1',{'PRAXIS_ROUND6_VISUAL_OUTPUT':str(out/'style1')},['node','--import','tsx','--test','--test-name-pattern=^Round6 Style1','src/harness/browser/web-workspace-round6.test.ts']),
 ('states',{'PRAXIS_ROUND8_VISUAL_OUTPUT':str(out/'states')},['node','--import','tsx','--test','--test-name-pattern=^Round(8|10|11|12|13|14|15|16|17|18|19|20) UI:','src/harness/browser/web-workspace-round6.test.ts','src/harness/browser/web-workspace-round10.test.ts']),
):
 assert clean()
 start=time.monotonic()
 with (out/(label+'-driver.log')).open('w') as log:
  execution=subprocess.run(sandbox+command,env={**env,**selection},stdout=log,stderr=subprocess.STDOUT)
 row={'suite':label,'sha':sha,'exitCode':execution.returncode,'seconds':time.monotonic()-start,
      'command':command,'environment':selection,'cleanBefore':True,'cleanAfter':clean(),'envLoaded':False,'network':'OS outbound denied except loopback'}
 results.append(row)
 (out/'visual-driver.json').write_text(json.dumps(results,indent=2)+'\n')
 print(json.dumps(row),flush=True)
 if execution.returncode or not row['cleanAfter']: raise SystemExit(1)
