from pathlib import Path
import subprocess,os,json,hashlib,time,shutil
root=Path.cwd();out=Path('/private/tmp/praxis-slice2-sync-20261111/gates-after-A-recovery');out.mkdir(exist_ok=True)
env={k:v for k,v in os.environ.items() if k in ['PATH','HOME','TMPDIR','LANG','LC_ALL','PLAYWRIGHT_BROWSERS_PATH']}
env['PRAXIS_WORKSPACE_VISUAL_OUTPUT']=str(out/'screens')
files=[p for p in subprocess.check_output(['git','ls-files','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json'],text=True).splitlines() if Path(p).is_file()]
freeze={p:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in files}
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();result={'sourceSHA':head,'inputs':freeze,'timezone':'CET UTC+1','gates':[]}
commands=[('typecheck',['npm','run','typecheck']),('architecture',['npm','run','arch:check']),('default',['npm','test']),('build',['npm','run','build']),('browser',['npm','run','test:browser:fixture']),('strict-g2',['npm','run','test:dom-change'])]
previous=Path('/private/tmp/praxis-slice2-sync-20261111/gates-after-A')
prior=json.loads((previous/'manifest.json').read_text());assert prior['sourceSHA']==head and prior['inputs']==freeze
result['gates']=prior['gates'][:2];result['reusedTypeArchitectureFrom']=str(previous/'manifest.json')
for n in ['typecheck','architecture']:shutil.copy(previous/(n+'.log'),out/(n+'.log'))
for name,cmd in commands[2:]:
 assert not subprocess.check_output(['git','status','--porcelain'],text=True)
 assert all(hashlib.sha256(Path(p).read_bytes()).hexdigest()==h for p,h in freeze.items())
 e=dict(env)
 if name=='strict-g2':e['PRAXIS_G2_REQUIRE_PASS']='1'
 start=time.monotonic()
 with (out/(name+'.log')).open('w') as f:r=subprocess.run(cmd,env=e,stdout=f,stderr=subprocess.STDOUT,timeout=1200)
 clean=not subprocess.check_output(['git','status','--porcelain'],text=True)
 result['gates'].append({'name':name,'command':cmd,'exitCode':r.returncode,'elapsedMs':round((time.monotonic()-start)*1000),'cleanAfter':clean})
 (out/'manifest.json').write_text(json.dumps(result,indent=2)+'\n')
 print(name,r.returncode,clean,flush=True)
 assert clean
 if r.returncode:break
assert all(hashlib.sha256(Path(p).read_bytes()).hexdigest()==h for p,h in freeze.items())
