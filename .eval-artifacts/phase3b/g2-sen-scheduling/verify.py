from pathlib import Path
import argparse,subprocess,time,json,hashlib,os,platform,re
parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--host-ref',required=True);parser.add_argument('--two-cpu',action='store_true');args=parser.parse_args()
root=Path.cwd();out=Path(args.output);out.mkdir(parents=True,exist_ok=False)
freeze=json.loads((root/'.eval-artifacts/phase3b/g2-sen-scheduling/verification-inputs-sha256.json').read_text())['files']
def check():
 assert not subprocess.check_output(['git','status','--porcelain']), 'DIRTY_WORKTREE'
 for file,sha in freeze.items():assert hashlib.sha256(Path(file).read_bytes()).hexdigest()==sha,file
check()
environment={'platform':platform.platform(),'node':subprocess.check_output(['node','--version'],text=True).strip(),'cpus':os.cpu_count(),'hostFrozenRef':args.host_ref,'guestOrHostCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'newModelGoogleWebsiteLive':0}
if args.two_cpu:
 assert os.cpu_count()==2 and os.sched_getaffinity(0)=={0,1}
 assert subprocess.run(['ip','route','get','203.0.113.1'],stdout=subprocess.PIPE,stderr=subprocess.PIPE).returncode!=0
 assert subprocess.run(['ip','-6','route','get','2001:db8::1'],stdout=subprocess.PIPE,stderr=subprocess.PIPE).returncode!=0
 environment.update(affinity=sorted(os.sched_getaffinity(0)),ipRules=subprocess.check_output(['ip','rule','show'],text=True),ip6Rules=subprocess.check_output(['ip','-6','rule','show'],text=True),cpuCgroup=Path('/proc/self/cgroup').read_text(),pressure='Ordinary2CPU, no extra quota',routes=Path('/proc/net/route').read_text())
(out/'environment.json').write_text(json.dumps(environment,indent=2)+'\n')
commands=['typecheck','arch:check','test','build','test:browser:fixture']+(['test:browser:fixture','test:browser:fixture'] if args.two_cpu else ['test:dom-change']);rows=[]
for i,script in enumerate(commands,1):
 check();cmd=['npm','test'] if script=='test' else ['npm','run',script];start=time.monotonic();log=out/(str(i)+'-'+script.replace(':','-')+'.log')
 with log.open('w') as stream:
  try:r=subprocess.run(cmd,stdout=stream,stderr=subprocess.STDOUT,timeout=600);code=r.returncode
  except subprocess.TimeoutExpired:code=124
 text=log.read_text();counts={key:int(found[-1]) if (found:=re.findall(r'^ℹ '+key+r' (\d+)\s*$',text,re.M)) else None for key in ['tests','pass','fail','cancelled','skipped','todo']}
 clean=not subprocess.check_output(['git','status','--porcelain']);row={'script':script,'command':cmd,'iteration':max(1,i-4) if script=='test:browser:fixture' else 1,'seconds':round(time.monotonic()-start,3),'exitCode':code,'beforeClean':True,'afterClean':clean,'counts':counts,'logSha256':hashlib.sha256(log.read_bytes()).hexdigest()};rows.append(row);(out/'gates.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(row),flush=True)
 assert code==0 and clean,(script,row)
 if script in ['test','test:browser:fixture','test:dom-change']:assert counts['tests'] and counts['pass']==counts['tests'] and all(counts[k]==0 for k in ['fail','cancelled','skipped','todo']),counts
 check()
(out/'source-check.json').write_text(json.dumps({'frozenInputs':len(freeze),'afterClean':True,'allPass':True},indent=2)+'\n');print('ALL_REQUIRED_GATES_AND_REQUESTED_REPETITIONS_PASS',flush=True)
