"""Predetermined paired diagnostic; both original tests run, no filters or retries."""
from pathlib import Path
import datetime,hashlib,json,os,re,signal,subprocess,sys,time
root=Path.cwd();item=Path(__file__).resolve().parent;out=Path(sys.argv[1]).resolve();assert not out.is_relative_to(root);out.mkdir(parents=True,exist_ok=False)
git=lambda *a:subprocess.check_output(['git',*a],text=True).strip();specBytes=(item/'reference-freeze.json').read_bytes();spec=json.loads(specBytes);assert not git('status','--porcelain');outerCommit=git('rev-parse','HEAD')
assert hashlib.sha256(Path(__file__).read_bytes()).hexdigest()==spec['orchestrationSha256']
clones={};target='browser outer guard identifies unfinished files and retains buffered output'
for label,revision in spec['revisions'].items():
 checkout=out.parent/(out.name+'-'+label+'-checkout');assert not checkout.exists();subprocess.run(['git','clone','--shared','--no-checkout','--quiet',str(root),str(checkout)],check=True)
 subprocess.run(['git','-C',str(checkout),'sparse-checkout','set','--no-cone',*['/'+p for p in spec['files'][label]]],check=True)
 subprocess.run(['git','-C',str(checkout),'checkout','--quiet','--detach',revision],check=True)
 (checkout/'.git/info/exclude').open('a').write('\n/node_modules\n');(checkout/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
 assert not (checkout/'.env').exists() and not (checkout/'.eval-artifacts').exists() and not (checkout/'src/integrations').exists()
 for p,h in spec['files'][label].items():assert hashlib.sha256((checkout/p).read_bytes()).hexdigest()==h,(label,p)
 assert not subprocess.check_output(['git','-C',str(checkout),'status','--porcelain'],text=True).strip();clones[label]=checkout
now=lambda:datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1),'CET')).isoformat();result={'mode':'ISOLATED_ORIGINAL_TEST_AND_SCRIPT_CLOSURE','startedAtCET':now(),'outerCommit':outerCommit,'referenceFreezeSha256':hashlib.sha256(specBytes).hexdigest(),'revisions':spec['revisions'],'runsPerRevision':spec['runsPerRevision'],'selection':'Entire file, both tests, no name/skip filter','G1ProductionCodeMaterialized':False,'sameTestScriptsAndConfiguration':spec['identicalClosures'],'nodeVersion':subprocess.check_output(['node','--version'],text=True).strip(),'runs':[]}
command=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-reporter=spec','src/harness/browser-fixture-scheduling.test.ts']
for sample in range(1,spec['runsPerRevision']+1):
 for label,checkout in clones.items():
  assert not git('status','--porcelain');assert git('rev-parse','HEAD')==outerCommit;assert not subprocess.check_output(['git','-C',str(checkout),'status','--porcelain'],text=True).strip()
  name=f'{label}-{sample:02d}.log';started=time.monotonic();environment={**os.environ};environment.pop('NODE_TEST_CONTEXT',None)
  with (out/name).open('wb') as log:
   p=subprocess.Popen(command,cwd=checkout,env=environment,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
   try:code=p.wait(timeout=95)
   except subprocess.TimeoutExpired:
    os.killpg(p.pid,signal.SIGTERM)
    try:p.wait(timeout=7)
    except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait()
    code=p.returncode
  raw=(out/name).read_bytes();text=re.sub(r'\x1b\[[0-9;]*m','',raw.decode(errors='replace'));summary={k:int(v) for k,v in re.findall(r'^(?:#|ℹ) (tests|pass|fail|cancelled|skipped|todo) (\d+)\s*$',text,re.M)}
  outcome='PASS' if re.search(r'^✔ '+re.escape(target)+r' \(',text,re.M) else 'FAIL' if re.search(r'^✖ '+re.escape(target)+r' \(',text,re.M) else 'NOT_OBSERVED'
  row={'revisionLabel':label,'sample':sample,'atCET':now(),'command':command,'exitCode':code,'seconds':time.monotonic()-started,'summary':summary,'targetOutcome':outcome,'fileOutcome':'PASS' if code==0 else 'FAIL','log':name,'logSha256':hashlib.sha256(raw).hexdigest(),'gitStatusBefore':'','gitStatusAfter':''}
  assert not subprocess.check_output(['git','-C',str(checkout),'status','--porcelain'],text=True).strip();assert not git('status','--porcelain')
  for f,h in spec['files'][label].items():assert hashlib.sha256((checkout/f).read_bytes()).hexdigest()==h,(label,f)
  result['runs'].append(row);(out/'results.json').write_text(json.dumps(result,indent=2)+'\n');print(label,sample,code,summary,'target='+outcome,flush=True)
  assert summary.get('tests')==2 and all(summary.get(k)==0 for k in ('cancelled','skipped','todo')) and outcome!='NOT_OBSERVED','Unexpected diagnostic environment/selection failure; preserve raw result'
result['totals']={label:{'filePass':sum(r['fileOutcome']=='PASS' for r in result['runs'] if r['revisionLabel']==label),'fileFail':sum(r['fileOutcome']=='FAIL' for r in result['runs'] if r['revisionLabel']==label),'targetPass':sum(r['targetOutcome']=='PASS' for r in result['runs'] if r['revisionLabel']==label),'targetFail':sum(r['targetOutcome']=='FAIL' for r in result['runs'] if r['revisionLabel']==label)} for label in clones};result['finishedAtCET']=now();result['closureHashesVerifiedAfter']=True
(out/'results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'totals':result['totals'],'knownFailureNotReclassifiedAsFixed':True}),flush=True)
