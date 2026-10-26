#!/usr/bin/env python3
"""Frozen single-slot control. No parallel batching; next slot needs independent PASS."""
import argparse,datetime as dt,gzip,hashlib,importlib.util,json,os,pathlib,re,signal,subprocess,time,urllib.parse,urllib.request,urllib.error
HERE=pathlib.Path(__file__).resolve().parent;ROOT=HERE.parents[2];CET=dt.timezone(dt.timedelta(hours=1),'CET')
def stamp():return dt.datetime.now(CET).isoformat()
def read(p):return json.loads(pathlib.Path(p).read_text())
def save(p,v):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def sha(raw):return hashlib.sha256(raw).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()
def verify(clean=False):
 f=read(HERE/'freeze.json')
 for path,digest in f['files'].items():
  assert sha((ROOT/path).read_bytes())==digest,'FROZEN_CHANGED:'+path
  assert sha(subprocess.check_output(['git','show','HEAD:'+path],cwd=ROOT))==digest,'NOT_COMMITTED:'+path
 if clean:assert git('status','--porcelain')=='','DIRTY_WORKTREE'
 return f
LEDGER=ROOT/'.eval-artifacts/phase3a-prime/budget.json'
def book(row):
 d=read(LEDGER);assert not any(x.get('id')==row['id'] for x in d['entries']);d['entries'].append(row);recount(d);save(LEDGER,d)
def recount(d):
 keys=set(d['cumulative'])|{'fullLive','realModelCalls','environmentReruns','googleRequests','websiteGET'}
 d['cumulative']={k:sum(r.get(k,0) for r in d['entries']) for k in keys};d['asOf']=stamp()
def finish_book(rowid,values):
 d=read(LEDGER);row=next(x for x in d['entries'] if x.get('id')==rowid);row.update(values);recount(d);save(LEDGER,d)
def casecheck():
 cfg=read(HERE/'config.json');date=dt.datetime.now(CET).date()
 for cid,value in cfg['dates'].items():
  day=dt.date.fromisoformat(value);assert 7<=(day-date).days<=14,'DATE_WINDOW_INVALID'
  template=(HERE/(cid+'.template.txt')).read_text();content=(HERE/(cid+'.content.txt')).read_text();expr=day.strftime('%A, %B ')+str(day.day);assert content==template.replace('{DATE}',expr),'CONTENT_CHANGED'
 code='import{loadFrozenLiveCases,materializeLiveCase}from"./src/eval/restaurant/agent-loop/live-case-materializer.ts";const x=await loadFrozenLiveCases(process.argv[1]);console.log(JSON.stringify(x.map(c=>({id:c.id,content:materializeLiveCase(c,new Date().toISOString()).content}))));'
 actual=json.loads(subprocess.check_output(['node','--import','tsx','--input-type=module','-e',code,cfg['runnerInput']],cwd=ROOT,text=True))
 for item in actual:assert item['content']==(HERE/(item['id']+'.content.txt')).read_text()
 return cfg

def slot(number,credential_file):
 verify(True);cfg=casecheck();assert 1<=number<=6
 if number>1:
  previous=read(HERE/'slots'/str(number-1)/'gate.json');prior=read(HERE/'slots'/str(number-1)/'summary.json');assert previous['passed'] is True and previous['artifactSha256']==prior['artifactSha256'] and previous['S0_DECLARATION']=='ABSENT' and previous['S0_BOUNDARY']=='ABSENT' and previous['fourLayersReviewed'] is True,'PREVIOUS_SLOT_NOT_APPROVED'
 cert=read(ROOT/cfg['certificate']);assert cert['status']=='WITNESS_EXISTS';assert dt.datetime.now(dt.timezone.utc)-dt.datetime.fromisoformat(cert['certifiedAtVienna'])<dt.timedelta(hours=24),'STALE_WITNESS'
 d=read(LEDGER);assert d['cumulative']['fullLive']+1<=d['limits']['fullLive'];assert d['cumulative']['realModelCalls']+50<=d['limits']['realModelCalls']
 used=[r for r in d['entries'] if r.get('kind')=='F5_LIVE_SLOT'];assert sum(r.get('fullLive',0) for r in used)<6;assert sum(r.get('realModelCalls',0) for r in used)+50<=300
 assert not any(r.get('status')=='RUNNING' for r in used),'ACTIVE_SLOT'
 if not credential_file:assert all(os.environ.get(k,'').strip() for k in ['DEEPSEEK_API_KEY','GOOGLE_MAPS_API_KEY','DEEPSEEK_MODEL']),'CREDENTIAL_CONFIGURATION_REQUIRED_WITHOUT_ENV_FILE_ACCESS'
 directory=HERE/'slots'/str(number);directory.mkdir(parents=True,exist_ok=False);item=cfg['slots'][number-1]
 cmd=['node']
 if credential_file:
  # Invoke only after direct human permission for this exact env-file loading.
  cmd+=['--env-file='+str(pathlib.Path(credential_file).resolve())]
 cmd+=['--import','tsx',str(HERE/'slot-child.ts'),'--case-source',cfg['runnerInput'],'--case',item['caseId'],'--timeout-ms','500000','--max-model-calls','50','--max-google-requests','40','--record-decisions','--record-browser','--no-proxy']
 env=dict(os.environ);env.update({'F5_SLOT_DIRECTORY':str(directory),'F5_ENV_RETRIES_REMAINING':str(max(0,2-d['cumulative']['environmentReruns'])),'PRAXIS_ALLOW_LIVE_RESTAURANT_READ':'1','PRAXIS_ALLOW_LIVE_MODEL_EVAL':'1','PRAXIS_ALLOW_BROWSER_RUN':'1','PRAXIS_BROWSER_ENGINE':'LOCAL_CHROMIUM','PRAXIS_LOCAL_CHROMIUM_INTERACTIVE':'0','PRAXIS_EVAL_ALLOW_BROWSER_MANUAL_INTERVENTION':'0','PRAXIS_GOOGLE_API_PROXY_SERVER':'','PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER':''});env.pop('PRAXIS_EVAL_USER_LAT',None);env.pop('PRAXIS_EVAL_USER_LNG',None)
 root=ROOT/'.eval-artifacts/restaurant-hybrid-live-read';before=set(root.glob('*.started.json')) if root.exists() else set();started=time.monotonic();killed=None;formal=None
 rowid=f'f5-live-slot-{number}';book({'id':rowid,'kind':'F5_LIVE_SLOT','slot':number,'caseId':item['caseId'],'status':'RUNNING','fullLive':0,'realModelCalls':0,'googleRequests':0,'environmentReruns':0,'startedAtCET':stamp(),'codeCommit':git('rev-parse','HEAD')})
 save(directory/'started.json',{'command':cmd,'startedAtCET':stamp(),'sourceFreeze':sha((HERE/'freeze.json').read_bytes()),'policy':'SERIAL_SINGLE_CASE; independent gate before next; no retry'})
 with (directory/'stdout.txt').open('w') as out,(directory/'stderr.txt').open('w') as err:
  child=subprocess.Popen(cmd,cwd=ROOT,env=env,stdout=out,stderr=err,start_new_session=True)
  while child.poll() is None:
   news=set(root.glob('*.started.json'))-before if root.exists() else set()
   if news and formal is None:formal=time.monotonic()
   if formal and time.monotonic()-formal>525 or time.monotonic()-started>1250:
    killed='OUTER_CLEANUP_DEADLINE';os.killpg(child.pid,signal.SIGTERM)
    try:child.wait(timeout=15)
    except subprocess.TimeoutExpired:os.killpg(child.pid,signal.SIGKILL)
    break
   time.sleep(.5)
  child.wait()
 news=set(root.glob('*.started.json'))-before if root.exists() else set();results=[p.with_name(p.name.replace('.started.json','.result.json')) for p in news];results=[p for p in results if p.exists()];assert len(results)<=1,'AMBIGUOUS_ARTIFACT'
 usage=read(directory/'transport-usage.json') if (directory/'transport-usage.json').exists() else {}
 if not usage:
  events=[json.loads(l) for l in (directory/'transport-events.jsonl').read_text().splitlines()] if (directory/'transport-events.jsonl').exists() else []
  usage={'modelCallsStarted':sum(e.get('event')=='START' and e.get('kind')=='MODEL' for e in events),'googleRequests':sum(e.get('event')=='START' and e.get('kind')=='GOOGLE' for e in events),'healthRetries':sum(e.get('event')=='HEALTH_RETRY' for e in events)}
 summary={'slot':number,'caseId':item['caseId'],'exitCode':child.returncode,'killed':killed,'elapsedSeconds':time.monotonic()-started,'formalRunStarted':bool(news),'artifactPath':str(results[0]) if results else None,'artifactSha256':sha(results[0].read_bytes()) if results else None,'usage':usage,'finishedAtCET':stamp()};save(directory/'summary.json',summary)
 finish_book(rowid,{'status':'FINISHED','fullLive':int(bool(news)),'realModelCalls':usage.get('modelCallsStarted',0),'googleRequests':usage.get('googleRequests',0),'environmentReruns':usage.get('healthRetries',0),'finishedAtCET':stamp(),'summary':str((directory/'summary.json').relative_to(ROOT))})
 print(json.dumps(summary));return summary

def post_get(number):
 verify();directory=HERE/'slots'/str(number);summary=read(directory/'summary.json');assert summary['artifactPath'];p=pathlib.Path(summary['artifactPath']);assert sha(p.read_bytes())==summary['artifactSha256']
 code='import fs from"node:fs";import{deliveryChecks}from"./.eval-artifacts/p2-1-discovery-20261016/outer/post-delivery.mjs";console.log(JSON.stringify(deliveryChecks(JSON.parse(fs.readFileSync(process.argv[1])))));'
 plans=json.loads(subprocess.check_output(['node','--input-type=module','-e',code,str(p)],cwd=ROOT,text=True));output=directory/'post';output.mkdir(exist_ok=False);rows=[];last=None
 class NoRedirect(urllib.request.HTTPRedirectHandler):
  def redirect_request(self,*args,**kwargs):return None
 opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
 for plan in plans:
  if plan['status']!='TABELOG_READ_PENDING':rows.append({**plan,'independentReview':'RAW_TRACE_REQUIRED'});continue
  if last:time.sleep(max(0,5-(time.monotonic()-last)))
  params=plan['parameters'];assert sorted(params)==['rst_id','svd','svps','svt'];assert all(re.fullmatch(r'\d+',v) for v in params.values());url='https://tabelog.com/en/booking/calendar/find_vacancy/?'+urllib.parse.urlencode(params)
  index=len(rows)+1;stem=output/(str(index)+'-'+params['rst_id']);rid=f'f5-slot-{number}-post-{index}';book({'id':rid,'kind':'F5_POST_DELIVERY_GET','status':'STARTED','websiteGET':1,'fullLive':0,'realModelCalls':0,'googleRequests':0,'environmentReruns':0,'startedAtCET':stamp()});raw=b'';status=None;error=None
  try:
   req=urllib.request.Request(url,method='GET',headers={'User-Agent':'Mozilla/5.0 (compatible; public-read witness check)','Accept-Encoding':'identity','Accept':'application/json'})
   try:response=opener.open(req,timeout=25)
   except urllib.error.HTTPError as e:response=e
   with response:status=response.status;raw=response.read()
  except Exception as e:error=type(e).__name__
  last=time.monotonic();body=stem.with_suffix('.body');body.write_bytes(raw);meta={**plan,'method':'GET','url':url,'httpStatus':status,'bodyPath':str(body),'sha256':sha(raw),'error':error,'finishedAtCET':stamp()}
  try:data=json.loads(raw);selection=data['selection'];times=[s.get('time') for s in (selection.values() if isinstance(selection,dict) else selection)]
  except Exception:data={};times=None
  if status==200 and times is not None:
   missing=[t for t in plan['displayedTimes'] if t not in times];date=data.get('base_date',{});binding=[date.get(k) for k in ['year','month','day']]==[int(params['svd'][:4]),int(params['svd'][4:6]),int(params['svd'][6:])] and data.get('members')==int(params['svps'])
   meta.update({'selectionTimes':times,'missingTimes':missing,'bindingMatches':binding,'S0':'PRESENT' if missing or not binding else 'ABSENT'})
  else:meta['S0']='NOT_EVALUATED'
  save(stem.with_suffix('.metadata.json'),meta);rows.append(meta);finish_book(rid,{'status':'FINISHED','httpStatus':status,'sha256':sha(raw),'finishedAtCET':stamp(),'metadata':str(stem.with_suffix('.metadata.json').relative_to(ROOT))})
  save(output/'post-check.json',{'rows':rows})
  if meta['S0']=='PRESENT':save(HERE/'STOP-S0.json',{'slot':number,'reason':'Displayed slot absent or request binding differs','evidence':str(stem.with_suffix('.metadata.json'))});break
 save(output/'post-check.json',{'rows':rows});print(json.dumps({'rows':len(rows),'S0':[r.get('S0',r.get('independentReview')) for r in rows]}))

parser=argparse.ArgumentParser();parser.add_argument('action',choices=['check','slot','post-get']);parser.add_argument('--slot',type=int);parser.add_argument('--credential-file');args=parser.parse_args()
if args.action=='check':verify();casecheck();print(json.dumps({'status':'OFFLINE_CHECK_PASS','requests':0,'models':0,'Live':0}))
elif args.action=='slot':
 assert not (HERE/'STOP-S0.json').exists(),'BATCH_STOPPED_S0';slot(args.slot,args.credential_file)
else:post_get(args.slot)
