from pathlib import Path
import hashlib,json,os,subprocess,sys,time
r=Path(__file__).parent
config=json.loads((r/sys.argv[1]).read_text());output=r/config['output'];output.mkdir()
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip()
assert not git('status','--porcelain');source=git('rev-parse','HEAD')
for item in config['files']:assert hashlib.sha256(Path(item['path']).read_bytes()).hexdigest()==item['sha256'],item['path']
env={k:v for k,v in os.environ.items() if k in ['PATH','HOME','TMPDIR','LANG','LC_ALL','LC_CTYPE','TZ']}
start=time.monotonic();p=subprocess.run(config['command'],env=env|config.get('environment',{}),stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=120)
(output/'test.log').write_bytes(p.stdout);after=git('status','--porcelain')
(output/'execution.json').write_text(json.dumps({'source':source,'exitCode':p.returncode,'seconds':round(time.monotonic()-start,3),'command':config['command'],'logSha256':hashlib.sha256(p.stdout).hexdigest(),'gitStatusBefore':'','gitStatusAfter':after,'realCalls':0,'envFileLoaded':False},indent=2)+'\n')
print('\n'.join(line for line in p.stdout.decode().splitlines() if 'SAVED_TERMS_RAW ' not in line)[-6500:])
assert not after and git('rev-parse','HEAD')==source
sys.exit(p.returncode)
