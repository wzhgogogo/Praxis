"""Run A's frozen, unchanged P4 command against this branch's frozen product."""
from pathlib import Path
import datetime,hashlib,json,os,signal,subprocess,sys,time
root=Path.cwd();item=Path(__file__).resolve().parent;phase=sys.argv[1];out=Path(sys.argv[2]).resolve();assert phase in ('red','green') and not out.is_relative_to(root);out.mkdir(parents=True,exist_ok=False)
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip();freezeBytes=(item/('input-freeze-'+phase+'.json')).read_bytes();freeze=json.loads(freezeBytes)
def verify():
 for p,h in freeze['files'].items():assert hashlib.sha256((root/p).read_bytes()).hexdigest()==h,p
verify();assert not git('status','--porcelain');ownCommit=git('rev-parse','HEAD');checkout=out.parent/(out.name+'-checkout');assert not checkout.exists()
subprocess.run(['git','clone','--shared','--no-checkout','--quiet',str(root),str(checkout)],check=True)
def cmd(*a):return subprocess.check_output(['git','-C',str(checkout),*a],text=True).strip()
subprocess.run(['git','-C',str(checkout),'sparse-checkout','set','--no-cone','/src/','/scripts/','/web-skills/','/package.json','/package-lock.json','/tsconfig.json','/tsconfig.build.json','/.gitignore'],check=True)
subprocess.run(['git','-C',str(checkout),'checkout','--quiet','--detach',freeze['ACommit']],check=True)
(checkout/'.git/info/exclude').open('a').write('\n/node_modules\n');(checkout/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
assert not (checkout/'.env').exists() and not (checkout/'.eval-artifacts/phase3b/g1-qa').exists()
productPaths=['src/integrations/restaurant-facts/google-then-website-facts.ts']
for p in productPaths:(checkout/p).write_bytes((root/p).read_bytes())
changed=cmd('diff','--name-only').splitlines();assert all(p in productPaths for p in changed),changed
if changed:subprocess.run(['git','-C',str(checkout),'-c','user.name=Codex offline reproduction','-c','user.email=codex@localhost','commit','--quiet','-am','Apply frozen B page-capture product file only'],check=True)
for p,h in freeze['AInputs'].items():assert hashlib.sha256((checkout/p).read_bytes()).hexdigest()==h,p
assert not cmd('status','--porcelain')
command=['node','--import','tsx','src/eval/restaurant/agent-loop/g6-development-preflight.ts','--out',str(out/'execution'),'--path','P4'];started=time.monotonic()
with (out/'command.log').open('wb') as log:
 proc=subprocess.Popen(command,cwd=checkout,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
 try:code=proc.wait(timeout=180)
 except subprocess.TimeoutExpired:
  os.killpg(proc.pid,signal.SIGTERM)
  try:proc.wait(timeout=5)
  except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait()
  code=proc.returncode
assert not cmd('status','--porcelain');verify();assert not git('status','--porcelain')
artifact=json.loads((out/'execution/preflight.json').read_text());answer=artifact['after']['restaurant']['pageQuestion']['result'];calls=[r for r in artifact['requests'] if r['request']['purpose']=='restaurant_page_question'];source=json.loads((checkout/'src/eval/restaurant/agent-loop/cases/g6-development/source.json').read_text())
if phase=='red':assert code!=0 and artifact['status']=='FAILED' and answer['status']=='UNVERIFIED' and answer['reason']=='NO_BOUND_PAGE' and answer['checkedPages']==[] and len(calls)==0,(code,answer,len(calls))
else:
 assert code==0 and artifact['status']=='PASS' and answer['status']=='ANSWERED' and len(calls)==1,(code,answer,len(calls))
 assert [(r['text'],r['url'],r['readAt']) for r in answer['citations']]==[(source['merchantQuote'],source['pageUrl'],source['referenceTime'])]
receipt={'atCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1),'CET')).isoformat(),'mode':'OFFLINE_LOCAL_CONSTRUCTED_PRODUCTION_COMPOSITION','phase':phase,'BCommit':ownCommit,'ACommit':freeze['ACommit'],'executedCheckoutCommit':cmd('rev-parse','HEAD'),'onlyProductOverlayPaths':changed,'AInputsByteIdentical':True,'command':command,'exitCode':code,'elapsedSeconds':time.monotonic()-started,'answer':answer,'questionModelCalls':len(calls),'realModelCalls':artifact['realModelCalls'],'publicGET':artifact['publicGET'],'gitStatusBefore':'','gitStatusAfter':'','originalCheckoutStatusAfter':'','freezeSha256':hashlib.sha256(freezeBytes).hexdigest(),'orchestrationSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
(out/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'phase':phase,'exitCode':code,'answerStatus':answer['status'],'questionModelCalls':len(calls),'BCommit':ownCommit,'AUnchanged':True}))
