from pathlib import Path
import os,subprocess,time,json,hashlib,platform
root=Path.cwd();out=Path('/tmp/g2-scheduling-red-normal');out.mkdir(exist_ok=False)
assert os.cpu_count()==2 and os.sched_getaffinity(0)=={0,1}
assert not subprocess.check_output(['git','status','--porcelain'])
assert '00000000' not in [line.split()[1] for line in Path('/proc/net/route').read_text().splitlines()[1:]]
expected={
'src/harness/browser/dom-change.test.ts':'',
'src/eval/restaurant/dom-change/run.ts':'',
'package.json':''}
receipt={'sourceRef':'b2a3cbd30e6f0c78486cf8b8671e7820a227d550','cpus':os.cpu_count(),'affinity':sorted(os.sched_getaffinity(0)),'platform':platform.platform(),'node':subprocess.check_output(['node','--version'],text=True).strip(),'guestCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'routes':Path('/proc/net/route').read_text(),'cpuMax':Path('/sys/fs/cgroup/cpu.max').read_text() if Path('/sys/fs/cgroup/cpu.max').exists() else 'root max','sourceSha256':{p:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in expected},'mode':'UNMODIFIED_FULL_SUITE_TWO_VCPU_NO_EXTRA_PRESSURE','modelGoogleWebsiteLive':0}
(out/'environment.json').write_text(json.dumps(receipt,indent=2)+'\n');started=time.monotonic()
with (out/'full.log').open('w') as log:
 try:result=subprocess.run(['npm','run','test:browser:fixture'],stdout=log,stderr=subprocess.STDOUT,timeout=600);code=result.returncode
 except subprocess.TimeoutExpired:code=124
text=(out/'full.log').read_text();target='G2 saved pages preserve the frozen reference capability'
red=target in text and ('testTimeoutFailure' in text or 'test timed out after 180000ms' in text)
summary={'seconds':time.monotonic()-started,'exitCode':code,'beforeClean':True,'afterClean':not subprocess.check_output(['git','status','--porcelain']),'targetTimeout180s':red,'fullCompleted':code!=124,'logSha256':hashlib.sha256((out/'full.log').read_bytes()).hexdigest()}
(out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary),flush=True)
