import subprocess,pathlib,json,datetime,time,sys,os
root=pathlib.Path.cwd();out=pathlib.Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
receipt={'candidate':git('rev-parse','HEAD'),'branch':git('branch','--show-current'),'mode':'OFFLINE_ONLY','timeCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),'gates':[]}
for name in ['typecheck','arch:check','test','build','test:browser:fixture']:
 before=git('status','--porcelain');assert before=='',before
 start=time.monotonic()
 with (out/(name.replace(':','-')+'.log')).open('w') as f:
  done=subprocess.run(['npm','run',name],stdout=f,stderr=subprocess.STDOUT)
 after=git('status','--porcelain')
 row={'command':'npm run '+name,'exitCode':done.returncode,'elapsedSeconds':round(time.monotonic()-start,3),'statusBefore':before,'statusAfter':after,'log':name.replace(':','-')+'.log'}
 receipt['gates'].append(row);(out/'gates.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(row),flush=True)
 if done.returncode or after:sys.exit(1)
receipt['result']='PASS';receipt['finalStatus']=git('status','--porcelain');(out/'gates.json').write_text(json.dumps(receipt,indent=2)+'\n')
