from pathlib import Path
import datetime,hashlib,json,subprocess,sys,time
phase=sys.argv[1];out=Path(sys.argv[2]).resolve();assert phase in ('red','green')
root=Path.cwd();assert not out.is_relative_to(root);out.mkdir(parents=True,exist_ok=False)
item=Path(__file__).resolve().parent
freeze=json.loads((item/f'input-freeze-{phase}.json').read_text())
def verify():
 for p,h in freeze['files'].items():assert hashlib.sha256((root/p).read_bytes()).hexdigest()==h,p
git=lambda *a:subprocess.check_output(['git',*a],text=True)
verify();assert not git('status','--porcelain')
result={'phase':phase,'commit':git('rev-parse','HEAD').strip(),'startedAtCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),'runs':[]}
commands=[('fixture',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test',*(['--test-name-pattern=G1 preserves parent IDs for unsplit lines'] if phase=='red' else []),'src/integrations/restaurant-facts/model-page-question.test.ts'])]
hard=out/'hard-before.json' if phase=='red' else Path(sys.argv[3]).resolve()
commands.append(('hard',['node','--import','tsx','.eval-artifacts/phase3b/g1-revision/check-fact-compatibility.ts','record' if phase=='red' else 'check',str(hard)]))
for name,cmd in commands:
 assert not git('status','--porcelain');started=time.monotonic()
 completed=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=120)
 (out/(name+'.log')).write_bytes(completed.stdout)
 row={'name':name,'command':cmd,'exitCode':completed.returncode,'seconds':time.monotonic()-started,'gitStatusAfter':git('status','--porcelain')};result['runs'].append(row)
 (out/'receipt.json').write_text(json.dumps(result,indent=2)+'\n')
 assert not row['gitStatusAfter'];verify()
 text=completed.stdout.decode(errors='replace')
 if phase=='red' and name=='fixture':
  assert completed.returncode!=0 and 'UNVERIFIED' in text and 'ANSWERED' in text,text[-500:]
 else:assert completed.returncode==0,text[-1000:]
 print(name,completed.returncode,round(row['seconds'],3),flush=True)
result['gitStatusBefore']='';result['gitStatusAfter']='';result['freezeVerifiedAfter']=True;result['newRealCalls']=0
(out/'receipt.json').write_text(json.dumps(result,indent=2)+'\n')
