from pathlib import Path
import subprocess,json,hashlib,datetime,time,sys
out=Path(sys.argv[1]);out.mkdir(exist_ok=False)
status=lambda:subprocess.check_output(['git','status','--porcelain'],text=True)
assert not status()
item=Path(__file__).resolve().parent
f=json.loads((item/'input-freeze.json').read_text())
for p,h in f['files'].items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,p
commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
command=['node','--import','tsx',str(item/'check-sen-selection.ts'),str(out/'observation.json')]
start=time.monotonic();r=subprocess.run(command,capture_output=True,timeout=60)
(out/'diagnostic.log').write_bytes(r.stdout+r.stderr)
for p,h in f['files'].items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,p
result={'commit':commit,'timeCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),'command':command,'seconds':time.monotonic()-start,'exitCode':r.returncode,'gitStatusBefore':'','gitStatusAfter':status(),'freezeVerifiedAfter':True,'newRealCalls':0}
(out/'receipt.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result));print(r.stdout.decode());assert not result['gitStatusAfter'];raise SystemExit(r.returncode)
