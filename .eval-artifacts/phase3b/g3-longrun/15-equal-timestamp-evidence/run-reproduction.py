from pathlib import Path
import sys,json,subprocess,hashlib,time,os,signal
root=Path.cwd();item=Path(__file__).resolve().parent;phase=sys.argv[1];out=Path(sys.argv[2]).resolve()
assert phase in ('red','green') and not out.is_relative_to(root);out.mkdir(exist_ok=False)
def git(*args,cwd=root):return subprocess.check_output(['git',*args],cwd=cwd,text=True).strip()
freeze=json.loads((item/('input-freeze-'+phase+'.json')).read_text())
for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
assert not git('status','--porcelain');head=git('rev-parse','HEAD');a_ref=git('rev-parse','cf20522e')
protected=['src/eval/restaurant/agent-loop/'+p for p in ('native-discovery-composition.test.ts','current-development-offline.test.ts','fixed-source-case-execution.test.ts','current-development-fixed-sources.ts')]
receipt={'mode':'OFFLINE_REAL_COMPOSITION_FIXTURE_MODEL','phase':phase,'BCommit':head,'AFrozenCommit':a_ref,'runs':[]}
def run(name,cmd,cwd=root,environment=None):
 assert not git('status','--porcelain',cwd=cwd);started=time.monotonic()
 with (out/(name+'.log')).open('wb') as log:
  proc=subprocess.Popen(cmd,cwd=cwd,stdout=log,stderr=subprocess.STDOUT,env=environment,start_new_session=True)
  try:code=proc.wait(timeout=180)
  except subprocess.TimeoutExpired:
   os.killpg(proc.pid,signal.SIGTERM)
   try:proc.wait(timeout=5)
   except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait()
   code=proc.returncode
 status=git('status','--porcelain',cwd=cwd);assert not status,status
 receipt['runs'].append({'name':name,'command':cmd,'cwd':str(cwd),'exitCode':code,'seconds':time.monotonic()-started,'gitStatusBefore':'','gitStatusAfter':''});(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(name,code,flush=True)
run('domain',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','src/domains/restaurant/read-assessment.test.ts'])
clone=out/'a-frozen-checkout'
subprocess.run(['git','clone','--shared','--no-checkout',str(root),str(clone)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
# Never materialize .env or private QA answer/artifact inputs.
subprocess.run(['git','config','core.sparseCheckout','true'],cwd=clone,check=True)
(clone/'.git/info/sparse-checkout').write_text('/*\n!/.eval-artifacts/\n!/.env\n')
subprocess.run(['git','checkout','--detach',a_ref],cwd=clone,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
(clone/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
with (clone/'.git/info/exclude').open('a') as excluded:excluded.write('\n/node_modules\n')
assert not (clone/'.env').exists() and not (clone/'.eval-artifacts/phase3b/g1-qa').exists()
checks={f:hashlib.sha256((clone/f).read_bytes()).hexdigest() for f in protected}
product='src/domains/restaurant/read-assessment.ts'
if phase=='green':
 (clone/product).write_bytes((root/product).read_bytes())
 subprocess.run(['git','add',product],cwd=clone,check=True)
 subprocess.run(['git','-c','user.name=Offline fixture verification','-c','user.email=fixture@invalid.local','commit','-m','Apply frozen B evidence-order correction only'],cwd=clone,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 assert git('diff','--name-only',a_ref,'HEAD',cwd=clone)==product
else:assert (clone/product).read_bytes()==(root/product).read_bytes()
environment={**os.environ,'PRAXIS_WRITE_NATIVE_STAGE2_ARTIFACTS':'1','PRAXIS_NATIVE_STAGE2_ARTIFACT_DIR':str(out/'a-artifacts')}
run('a-original-case',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-name-pattern=^H001 native first batch presents three source-bound Tabelog results without TableCheck$','src/eval/restaurant/agent-loop/native-discovery-composition.test.ts'],clone,environment)
for f,h in checks.items():assert hashlib.sha256((clone/f).read_bytes()).hexdigest()==h,f
receipt.update(AExecutionCommit=git('rev-parse','HEAD',cwd=clone),AFourFilesSha256=checks,productFileSha256=hashlib.sha256((clone/product).read_bytes()).hexdigest())
# Independently inspect the actual generated presentation against each check.
art=json.loads((out/'a-artifacts/TABELOG_DELIVERS.execution.json').read_text());ev=json.loads((out/'a-artifacts/TABELOG_DELIVERS.evaluation.json').read_text());state=art['finalSnapshot']['domainState'];rows=[]
for cid in state['presentedResults']['candidateIds']:
 check=state['availabilityChecks'][cid];facts=[e for e in state['readEvidence'] if e['evidenceId'] in check['evidenceIds'] and e['kind']=='RESTAURANT_FACT']
 rows.extend({'candidateId':cid,'evidenceId':e['evidenceId'],'observedAt':e['observedAt'],'checkedAt':state['factChecks'][cid]['checkedAt'],'currentCheckReferencesFact':True,'presentationCitesFact':e['evidenceId'] in state['presentedResults']['evidenceIds']} for e in facts)
assert len(rows)==3 and all(r['observedAt']==r['checkedAt'] for r in rows)
receipt['presentationFacts']=rows;receipt['independentCompletion']=ev['execution']['taskProducedQualifiedResult'];receipt['sourceSequence']=[t['action']['type'] for t in art['trajectories'] if 'action' in t]
(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
assert not git('status','--porcelain');print(json.dumps({'completion':receipt['independentCompletion'],'cited':sum(r['presentationCitesFact'] for r in rows)}),flush=True)
