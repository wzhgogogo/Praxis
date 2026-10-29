from pathlib import Path
import json,subprocess,hashlib,os,time,re,signal,sys
root=Path.cwd();item=Path(__file__).resolve().parent;out=Path(sys.argv[1]).resolve();assert not out.is_relative_to(root);out.mkdir(exist_ok=False)
git=lambda *args,cwd=root:subprocess.check_output(['git',*args],cwd=cwd,text=True).strip()
freeze=json.loads((item/'input-freeze-green.json').read_text())
for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
assert not git('status','--porcelain');base=git('rev-parse','51b0d3de');product='src/domains/restaurant/read-assessment.ts';fixture='src/harness/browser/browser-read-request-binding.test.ts'
clone=out/'baseline-checkout';subprocess.run(['git','clone','--shared','--no-checkout',str(root),str(clone)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
subprocess.run(['git','config','core.sparseCheckout','true'],cwd=clone,check=True);(clone/'.git/info/sparse-checkout').write_text('/*\n!/.eval-artifacts/\n!/.env\n');subprocess.run(['git','checkout','--detach',base],cwd=clone,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
(clone/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
with (clone/'.git/info/exclude').open('a') as f:f.write('\n/node_modules\n')
assert (clone/fixture).read_bytes()==(root/fixture).read_bytes();assert not (clone/'.env').exists()
result={'mode':'LOCAL_CHROMIUM_BASELINE_COMPARISON','BCommit':git('rev-parse','HEAD'),'baselineCommit':base,'fixtureSha256':hashlib.sha256((clone/fixture).read_bytes()).hexdigest(),'runs':[]}
def run(label,cmd,cwd,env=None):
 assert not git('status','--porcelain',cwd=cwd);started=time.monotonic()
 with (out/(label+'.log')).open('wb') as log:
  p=subprocess.Popen(cmd,cwd=cwd,stdout=log,stderr=subprocess.STDOUT,env=env,start_new_session=True)
  try:code=p.wait(timeout=240)
  except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGTERM);code=p.wait(timeout=10)
 assert not git('status','--porcelain',cwd=cwd)
 text=(out/(label+'.log')).read_text();tail=text.split('✖ failing tests:')[-1]
 row={'label':label,'command':cmd,'exitCode':code,'seconds':time.monotonic()-started,'gitStatusBefore':'','gitStatusAfter':'','summary':{k:int(v) for k,v in re.findall(r'^(?:#|ℹ) (tests|pass|fail|cancelled|skipped|todo) (\d+)$',text,re.M)},'failingNames':sorted({re.sub(r'\s+\([\d.]+ms\)$','',line.removeprefix('✖ ')) for line in tail.splitlines() if line.startswith('✖ ')})}
 result['runs'].append(row);(out/'receipt.json').write_text(json.dumps(result,indent=2)+'\n');print(label,code,row['summary'],flush=True)
cmd=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-name-pattern=^native dynamic Tabelog (AVAILABLE|UNAVAILABLE) reaches formal H001',fixture]
run('before',cmd,clone)
(clone/product).write_bytes((root/product).read_bytes());subprocess.run(['git','add',product],cwd=clone,check=True);subprocess.run(['git','-c','user.name=Offline fixture verification','-c','user.email=fixture@invalid.local','commit','-m','Apply frozen evidence-order correction only'],cwd=clone,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
assert git('diff','--name-only',base,'HEAD',cwd=clone)==product
run('after',cmd,clone)
a,b=result['runs'];assert a['summary']['tests']==b['summary']['tests']==2 and a['summary']['fail']==b['summary']['fail']==2 and a['failingNames']==b['failingNames']
result['pairedFinding']='BOTH_BROWSER_FIXTURE_FAILURES_EXIST_ON_51B0D3DE_UNCHANGED_BY_THIS_REPAIR';result['fixtureUnmodified']=True
run('strict-dom-change',['npm','run','test:dom-change'],root,{**os.environ,'PRAXIS_G2_REQUIRE_PASS':'1'})
assert result['runs'][-1]['exitCode']==0
for f,h in freeze['files'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
assert not git('status','--porcelain');result['frozenAfter']=True;(out/'receipt.json').write_text(json.dumps(result,indent=2)+'\n')
