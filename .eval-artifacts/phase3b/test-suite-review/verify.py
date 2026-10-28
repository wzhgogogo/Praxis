from pathlib import Path
import subprocess,json,time,hashlib,datetime,zoneinfo
root=Path('.eval-artifacts/phase3b/test-suite-review');out=root/'verification';out.mkdir(exist_ok=True)
inputs=json.loads((root/'source-sha256.json').read_text());meta=json.loads((root/'input-freeze.json').read_text())['files']
def clean():return not subprocess.check_output(['git','status','--porcelain'])
def intact():
 for file,sha in {**inputs,**meta}.items():assert hashlib.sha256(Path(file).read_bytes()).hexdigest()==sha,file
summary=[];head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
for script in ['typecheck','arch:check','test','build','test:browser:fixture']:
 assert clean();intact();start=time.monotonic();cmd=['npm','run',script] if script!='test' else ['npm','test']
 log=out/(script.replace(':','-')+'.log');assert not log.exists()
 with log.open('x') as stream:result=subprocess.run(cmd,stdout=stream,stderr=subprocess.STDOUT)
 row={'script':script,'command':cmd,'head':head,'atCET':datetime.datetime.now(zoneinfo.ZoneInfo('Europe/Vienna')).isoformat(),'seconds':time.monotonic()-start,'exitCode':result.returncode,'beforeClean':True,'afterClean':clean()};summary.append(row);(out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(row),flush=True)
 assert result.returncode==0 and row['afterClean'];intact()
assert not subprocess.check_output(['git','diff','ba466eb3','--','src','scripts','package.json','package-lock.json'])
print('FIVE_GATES_PASS_SOURCE_IDENTICAL',flush=True)
