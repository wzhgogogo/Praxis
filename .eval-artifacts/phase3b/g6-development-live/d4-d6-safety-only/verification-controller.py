import pathlib,json,subprocess,time,datetime,hashlib,gzip,re,os,signal
from zoneinfo import ZoneInfo
root=pathlib.Path.cwd();out=pathlib.Path('/private/tmp/praxis-g6-d4-d6-safety-only-gates-20261102');out.mkdir()
frozen=json.loads((root/'.eval-artifacts/phase3b/g6-development-live/d4-d6-safety-only/source-inputs.json').read_text())
def git(*a):return subprocess.check_output(['git',*a],text=True).strip()
def check():
 assert git('status','--porcelain')==''
 for r in frozen['files']:assert hashlib.sha256((root/r['path']).read_bytes()).hexdigest()==r['sha256'],r['path']
check();head=git('rev-parse','HEAD');result={'testedCommit':head,'inputs':len(frozen['files']),'mode':'OFFLINE_FINAL_CANDIDATE','runs':[]}
steps=[('original-terms',['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','src/eval/restaurant/agent-loop/g6-booking-terms-composition.test.ts']),('typecheck',['npm','run','typecheck']),('arch-check',['npm','run','arch:check']),('npm-test',['npm','test']),('build',['npm','run','build']),('browser-fixture',['npm','run','test:browser:fixture']),('strict-g2',['npm','run','test:dom-change'])]
for name,cmd in steps:
 check();assert git('rev-parse','HEAD')==head;start=time.monotonic();at=datetime.datetime.now(ZoneInfo('Europe/Vienna')).isoformat();print('START',name,flush=True)
 env=os.environ.copy()
 if name=='strict-g2':env['PRAXIS_G2_REQUIRE_PASS']='1'
 if name=='browser-fixture':env['PRAXIS_G6_CAPTURE_DIR']='/private/tmp/praxis-g6-d4-d6-safety-only-captures-20261102'
 with (out/(name+'.log')).open('wb') as log:
  proc=subprocess.Popen(cmd,stdout=log,stderr=subprocess.STDOUT,env=env,start_new_session=True)
  try:code=proc.wait(timeout=1320)
  except subprocess.TimeoutExpired:
   os.killpg(proc.pid,signal.SIGTERM)
   try:proc.wait(timeout=10)
   except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait()
   code=124
 raw=(out/(name+'.log')).read_bytes();summary={k:int(v) for k,v in re.findall(r'^(?:#|ℹ) (tests|suites|pass|fail|cancelled|skipped|todo) (\d+)\s*$',raw.decode(errors='replace'),re.M)}
 row={'name':name,'command':cmd,'startCET':at,'exitCode':code,'seconds':round(time.monotonic()-start,3),'summary':summary,'gitStatusBefore':'','gitStatusAfter':git('status','--porcelain'),'logSHA256':hashlib.sha256(raw).hexdigest()};result['runs'].append(row);(out/'gates.json').write_text(json.dumps(result,indent=2)+'\n');print('END',name,code,row['seconds'],summary,flush=True);check()
 if code:raise SystemExit(code)
result['status']='PASS';(out/'gates.json').write_text(json.dumps(result,indent=2)+'\n')
