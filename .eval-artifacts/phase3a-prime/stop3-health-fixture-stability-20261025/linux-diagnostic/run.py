from pathlib import Path
import argparse,concurrent.futures,hashlib,json,os,subprocess,time
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();root=a.root.resolve();out=a.output.resolve();out.mkdir(parents=True,exist_ok=False)
preload='.eval-artifacts/phase3a-prime/stop3-health-fixture-stability-20261025/linux-diagnostic/observer.ts'
test='src/harness/browser/read-network-redirect.test.ts'
command=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--import','./'+preload,'--test','--test-name-pattern','^E1 outer body observer',test]
assert not subprocess.check_output(['git','status','--porcelain'],cwd=root)
def run(n):
 started=time.monotonic();p=subprocess.run(command,cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=40);(out/f'probe-{n}.log').write_bytes(p.stdout)
 return {'sample':n,'exitCode':p.returncode,'elapsedSeconds':round(time.monotonic()-started,6),'logSha256':hashlib.sha256(p.stdout).hexdigest(),'failedRequestEvent':'E1_REQUEST_FAILED' in p.stdout.decode(errors='replace')}
rows=[]
# Fixed two waves of four real processes. Never rerun-until-green.
for wave in range(2):
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows.extend(pool.map(run,range(wave*4+1,wave*4+5)))
assert not subprocess.check_output(['git','status','--porcelain'],cwd=root)
result={'scope':'BOUNDED_DIAGNOSTIC_ONLY_NOT_FULL_SUITE','command':command,'waves':2,'processesPerWave':4,'sourceTestSha256':hashlib.sha256((root/test).read_bytes()).hexdigest(),'observerSha256':hashlib.sha256((root/preload).read_bytes()).hexdigest(),'runnerSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'sourceAndAssertionsChanged':False,'runs':rows,'realCalls':0}
(out/'summary.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
