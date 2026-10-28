from pathlib import Path
import subprocess,time,json,hashlib,os,platform,datetime
root=Path.cwd();out=Path('/tmp/g1-timing-validation/green');out.mkdir(parents=True,exist_ok=False)
freeze=json.loads((root/'.eval-artifacts/phase3b/browser-fixture-clocks/green-inputs-sha256.json').read_text())
def check():
 assert not subprocess.check_output(['git','status','--porcelain']), 'WORKTREE_DIRTY'
 for name,digest in freeze['files'].items():assert hashlib.sha256((root/name).read_bytes()).hexdigest()==digest,name
check();assert os.cpu_count()==2 and os.sched_getaffinity(0)=={0,1}
(out/'environment.json').write_text(json.dumps({'cpus':os.cpu_count(),'affinity':sorted(os.sched_getaffinity(0)),'platform':platform.platform(),'node':subprocess.check_output(['node','--version'],text=True).strip(),'guestCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'hostFrozenSource':'3970d4b3 + committed verification scripts','atCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),'osNetworkRoutes':Path('/proc/net/route').read_text(),'cpuMaxRoot':Path('/sys/fs/cgroup/cpu.max').read_text().strip(),'cgroup':Path('/proc/self/cgroup').read_text()},indent=2)+'\n')
rows=[]
for n,name in enumerate(['typecheck','arch:check','test','build','test:browser:fixture','test:browser:fixture','test:browser:fixture']):
 check();start=time.monotonic();filename=str(n+1)+'-'+name.replace(':','-')+'.log'
 with (out/filename).open('w') as log:r=subprocess.run(['npm','test'] if name=='test' else ['npm','run',name],stdout=log,stderr=subprocess.STDOUT)
 clean=not subprocess.check_output(['git','status','--porcelain']);row={'command':name,'iteration':1 if n<5 else n-3,'exitCode':r.returncode,'seconds':time.monotonic()-start,'beforeClean':True,'afterClean':clean};rows.append(row);(out/'gates.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(row),flush=True)
 if r.returncode or not clean:raise SystemExit(1)
 check()
(out/'source-check.json').write_text(json.dumps({'frozenFilesVerified':len(freeze['files']),'afterClean':True,'allPass':True},indent=2)+'\n')
