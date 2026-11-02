import pathlib,subprocess,json,os,sys,time,signal,hashlib,platform,re
from datetime import datetime
from zoneinfo import ZoneInfo
out=pathlib.Path(sys.argv[1]);out.mkdir();assert platform.system()=='Linux' and os.cpu_count()==2 and os.sched_getaffinity(0)=={0,1};assert not pathlib.Path('.env').exists()
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();result={'mode':'FIXED_TWO_NORMAL_AND_LATE_DISPATCH_2_VCPU','platform':platform.platform(),'cpus':os.cpu_count(),'affinity':sorted(os.sched_getaffinity(0)),'node':subprocess.check_output(['node','--version'],text=True).strip(),'guestGit':head,'sourceSHA256':{p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest() for p in ['src/harness/browser/browser-read-tabelog.test.ts','src/harness/browser/browser-read-test-fixtures.ts']},'runs':[]}
cmd=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-name-pattern=retires a real Chromium session','src/harness/browser/browser-read-tabelog.test.ts']
for n in range(1,int(sys.argv[2])+1):
 start=time.monotonic();print('START',n,flush=True)
 with (out/f'run-{n:02}.log').open('wb') as f:
  p=subprocess.Popen(cmd,stdout=f,stderr=subprocess.STDOUT,start_new_session=True)
  try:code=p.wait(timeout=90)
  except subprocess.TimeoutExpired:
   (out/f'run-{n:02}-processes.log').write_bytes(subprocess.check_output(['ps','-eo','pid,ppid,pgid,etime,stat,args']))
   os.killpg(p.pid,signal.SIGTERM)
   try:p.wait(timeout=5)
   except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait()
   code=124
 data=(out/f'run-{n:02}.log').read_bytes();row={'run':n,'exitCode':code,'seconds':round(time.monotonic()-start,3),'logSHA256':hashlib.sha256(data).hexdigest(),'summary':{k:int(v) for k,v in re.findall(r'^(?:#|ℹ) (tests|pass|fail|cancelled|skipped) (\d+)\s*$',data.decode(errors='replace'),re.M)}};result['runs'].append(row);(out/'result.json').write_text(json.dumps(result,indent=2)+'\n');print('END',n,code,row['seconds'],flush=True)
 if code:break
result['status']='PASS_NOT_REPRODUCED' if all(r['exitCode']==0 for r in result['runs']) else 'FAILED_OR_DIAGNOSTIC_TIMEOUT';result['timeCET']=datetime.now(ZoneInfo('Europe/Vienna')).isoformat();(out/'result.json').write_text(json.dumps(result,indent=2)+'\n')
