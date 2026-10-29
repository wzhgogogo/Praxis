from pathlib import Path
import os,subprocess,time,json,hashlib,platform
root=Path.cwd();out=Path('/tmp/g2-scheduling-red-cohort');out.mkdir(exist_ok=False)
assert os.cpu_count()==2 and os.sched_getaffinity(0)=={0,1}
assert not subprocess.check_output(['git','status','--porcelain'])
assert '00000000' not in [line.split()[1] for line in Path('/proc/net/route').read_text().splitlines()[1:]]
expected={
'src/harness/browser/dom-change.test.ts':'',
'src/eval/restaurant/dom-change/run.ts':'',
'package.json':''}
receipt={'sourceRef':'b2a3cbd30e6f0c78486cf8b8671e7820a227d550','cpus':os.cpu_count(),'affinity':sorted(os.sched_getaffinity(0)),'platform':platform.platform(),'node':subprocess.check_output(['node','--version'],text=True).strip(),'guestCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'routes':Path('/proc/net/route').read_text(),'cpuMax':(Path('/sys/fs/cgroup')/Path('/proc/self/cgroup').read_text().strip().split(':')[-1].lstrip('/')/'cpu.max').read_text(),'sourceSha256':{p:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in expected},'mode':'UNMODIFIED_FOUR_REAL_HEAVY_FILES_TWO_VCPU_CGROUP_25_PERCENT_TOTAL','modelGoogleWebsiteLive':0}
(out/'environment.json').write_text(json.dumps(receipt,indent=2)+'\n');started=time.monotonic()
with (out/'full.log').open('w') as log:
 process=subprocess.Popen(['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-concurrency=4','src/harness/browser/dom-change.test.ts','src/harness/browser/browser-read-category.test.ts','src/harness/browser/browser-read-regions.test.ts','src/harness/browser/browser-read-discovery.test.ts'],stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
 samples=[]
 while process.poll() is None:
  samples.append({'seconds':round(time.monotonic()-started,3),'cpuPressure':Path('/proc/pressure/cpu').read_text(),'memoryPressure':Path('/proc/pressure/memory').read_text()})
  (out/'pressure.json').write_text(json.dumps(samples,indent=2)+'\n')
  if time.monotonic()-started>=360:
   import signal
   os.killpg(process.pid,signal.SIGTERM)
   try:process.wait(timeout=10)
   except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);process.wait()
   code=124;break
  try:process.wait(timeout=10)
  except subprocess.TimeoutExpired:continue
 else:code=process.returncode
text=(out/'full.log').read_text();target='G2 saved pages preserve the frozen reference capability'
red=target in text and ('testTimeoutFailure' in text or 'test timed out after 180000ms' in text)
summary={'seconds':time.monotonic()-started,'exitCode':code,'beforeClean':True,'afterClean':not subprocess.check_output(['git','status','--porcelain']),'targetTimeout180s':red,'fullCompleted':code!=124,'logSha256':hashlib.sha256((out/'full.log').read_bytes()).hexdigest()}
(out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary),flush=True)
