from pathlib import Path
import datetime,hashlib,json,shutil,subprocess,sys,time
ROOT=Path('.eval-artifacts/phase3b/b1-postgres-feedback')
def load(p):return json.loads(Path(p).read_text())
def git(*a):return subprocess.check_output(['git',*a],text=True).strip()
def cet():return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
assert not git('status','--porcelain')
assert not (ROOT/'execution.json').exists()
subprocess.run(['python3','-B',str(ROOT/'verify.py')],check=True)
cluster=load(ROOT/'cluster.json');owned=Path(cluster['root'])
assert owned.parent==Path('/private/tmp') and owned.name.startswith('praxis-b1-pg-')
assert load(owned/'probe-owner.json')['runId']==cluster['runId']
pgctl='/opt/homebrew/bin/pg_ctl'
record={'sourceCommit':git('rev-parse','HEAD'),'startedAtCET':cet(),'steps':[],'newExternalCalls':0}
def run(name,cmd,expected=0):
 before=git('status','--porcelain');assert not before
 start=cet();tick=time.monotonic();p=subprocess.run(cmd,capture_output=True,text=True,timeout=60)
 log=ROOT/(name+'.log');log.write_text(p.stdout+p.stderr)
 after=git('status','--porcelain');assert not after
 row={'name':name,'startedAtCET':start,'finishedAtCET':cet(),'seconds':round(time.monotonic()-tick,3),'command':cmd,'exitCode':p.returncode,'expectedExitCode':expected,'log':str(log),'sha256':hashlib.sha256(log.read_bytes()).hexdigest(),'gitStatusBefore':before,'gitStatusAfter':after}
 record['steps'].append(row);print(json.dumps(row),flush=True)
 assert p.returncode==expected,p.stdout+p.stderr
 return p
failure=None
try:
 run('red',['node','--import','tsx',str(ROOT/'probe.mjs'),'red'],1)
 red=load(ROOT/'red.json');assert red['promptedRows']==2 and not red['indexPresent']
 assert '"code":"ERR_ASSERTION"' in (ROOT/'red.log').read_text()
 run('green',['node','--import','tsx',str(ROOT/'probe.mjs'),'green'])
 run('restart',[pgctl,'-D',str(owned/'data'),'-l',str(owned/'postgres.log'),'-w','-t','15','-m','fast','restart'])
 run('resume',['node','--import','tsx',str(ROOT/'probe.mjs'),'resume'])
 run('integrity-after',['python3','-B',str(ROOT/'verify.py')])
 record['status']='PASS'
except BaseException as error:
 failure=error;record['status']='FAILED';record['failure']={'type':type(error).__name__,'message':str(error)[:1500]}
finally:
 stop=subprocess.run([pgctl,'-D',str(owned/'data'),'-w','-t','15','-m','fast','stop'],capture_output=True,text=True,timeout=20)
 (ROOT/'stop.log').write_text(stop.stdout+stop.stderr)
 if (owned/'postgres.log').exists():shutil.copyfile(owned/'postgres.log',ROOT/'postgres.log')
 deleted=False
 if stop.returncode==0 and load(owned/'probe-owner.json')['runId']==cluster['runId']:
  shutil.rmtree(owned);deleted=True
 cleanup={'atCET':cet(),'stopExitCode':stop.returncode,'ownedDataRemoved':deleted,'root':str(owned),'newExternalCalls':0}
 (ROOT/'cleanup.json').write_text(json.dumps(cleanup,indent=2)+'\n')
 if not deleted:record['status']='FAILED';record['cleanupFailure']=True
 record.update(finishedAtCET=cet(),cleanup=cleanup)
 (ROOT/'execution.json').write_text(json.dumps(record,indent=2)+'\n')
 print(json.dumps({'status':record['status'],'cleaned':deleted,'newExternalCalls':0}),flush=True)
if failure or record['status']!='PASS':sys.exit(1)
