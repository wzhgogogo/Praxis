import subprocess,json,hashlib,re,collections,datetime,html
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit,parse_qsl,urlencode
REV='ce6f94af';OUT=Path(__file__).parent
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',REV,'.eval-artifacts/phase3b'],text=True).splitlines(); manifest={}
def raw(p):
 b=subprocess.check_output(['git','show',REV+':'+p]);manifest[p]=hashlib.sha256(b).hexdigest();return b
def load(p):return json.loads(raw(p))
def safe(u):
 a=urlsplit(u);return urlunsplit((a.scheme,a.netloc,a.path,urlencode([(k,v) for k,v in parse_qsl(a.query) if not re.search('key|token|signature|client|secret',k,re.I)]),''))
def kind(u):
 p=urlsplit(u).path
 return 'calendar' if 'vacancy' in p or 'calendar' in p else 'search' if 'rstLst' in p or '/search' in p else 'detail' if re.search(r'/\d{7,}/',p) else 'region'
def time(s):return datetime.datetime.fromisoformat(s.replace('Z','+00:00')).timestamp()
selected=[p for p in paths if p.endswith('/recording.json') and any(x in p for x in ['split-resume-20261102/w1-runs/D1/','d4-d6-safety-only/runs/D4/','g6-supplement-20261103/runs/','named-identity-terms-20261103/raw/runs/D3/'])]
results=[]
for rp in selected:
 a=load(rp);parent=rp.split('/recordings/')[0];tracepath=parent+'/browser-trace.json';trace=load(tracepath)['events'] if tracepath in paths else []
 tc=[e for e in trace if e['kind']=='SESSION_CALL' and e['detail'].get('method')=='navigate'];te=[e for e in trace if e['kind'] in ['SESSION_RETURN','SESSION_ERROR'] and e['detail'].get('method')=='navigate'];rn=[e for e in a['entries'] if e['kind']=='SESSION_CALL' and e['detail'].get('method')=='navigate'];aligned=len(tc)==len(te)==len(rn)
 navs=[];pages=[];prev=[];pending=[];session=0;nav=None;lastmethod=None;responses=[]
 for e in a['entries']:
  d=e.get('detail',{});k=e['kind']
  if k=='SESSION_OPENED':session+=1;prev=[];pending=[];nav=None
  if k=='SESSION_CALL':
   lastmethod=d.get('method')
   if lastmethod=='navigate':
    args=d.get('args',[]);u=args[0] if args else '';opt=args[1] if len(args)>1 else {};i=len(navs)
    nav={'sequence':e['sequence'],'session':session,'url':safe(u),'sanitizedUrlHash':hashlib.sha256(u.encode()).hexdigest(),'type':kind(u),'timeoutMs':opt.get('timeoutMs'),'waitUntil':opt.get('waitUntil','default'),'elapsedMs':round((time(te[i]['at'])-time(tc[i]['at']))*1000,3) if aligned else None,'startedAtCET':datetime.datetime.fromtimestamp(time(tc[i]['at']),datetime.timezone(datetime.timedelta(hours=1))).isoformat() if aligned else None,'error':None,'responsesBeforeTimeout':'NOT_RECORDED: HAR has no real request timestamps; snapshot response samples cannot establish order inside failed goto'};navs.append(nav)
  if k=='SESSION_ERROR' and d.get('method')=='navigate' and nav:
   nav['error']=d.get('error');msg=json.dumps(nav['error'],ensure_ascii=False);m=re.search(r'Timeout (\d+)ms',msg);nav['actualTimeoutMs']=int(m[1]) if m else None
  if k=='NETWORK':
   cur=d if isinstance(d,list) else [];delta=cur[len(prev):] if cur[:len(prev)]==prev else cur;pending+=delta;prev=cur
  if k=='SNAPSHOT':
   n=len(pages)+1;page=next((p for p in a.get('pages',[]) if p['snapshot']==n),{});file=page.get('diagnostic',{}).get('file') or next((p['file'] for p in a.get('documents',[]) if p['snapshot']==n),None);busy=None
   if file:
    fp=rp.rsplit('/',1)[0]+'/'+file
    if fp not in paths:
     file=next((x for x in [next((p['file'] for p in a.get('documents',[]) if p['snapshot']==n),''),f'snapshot-{n:04d}.html'] if rp.rsplit('/',1)[0]+'/'+x in paths),None);fp=rp.rsplit('/',1)[0]+'/'+file if file else ''
    if fp in paths:
     doc=raw(fp).decode();text=html.unescape(re.sub('<[^>]+>',' ',re.sub(r'<(?:script|style)\b[^>]*>[\s\S]*?</(?:script|style)>',' ',doc,flags=re.I)));busy=bool(re.search('現在アクセスが集中しています|アクセスが集中|temporarily busy|service unavailable',text,re.I))
   admitted=[x for x in pending if x.get('outcome')=='ADMITTED'];blocked=[x for x in pending if x.get('outcome')=='BLOCKED'];failed=[x for x in pending if x.get('outcome')=='FAILED'];classes=collections.Counter(x.get('resourceType','unknown') for x in admitted)
   third=[x for x in admitted if re.search(r'analytics|doubleclick|googletag|adservice|sentry|umami',x.get('origin','')+x.get('pathname',''),re.I)]
   pages.append({'snapshot':n,'sequence':e['sequence'],'session':session,'url':d.get('url',page.get('url')),'navigationSequence':nav['sequence'] if nav else None,'resourceCountsSincePreviousSnapshot':dict(classes),'admittedEvents':len(admitted),'blockedEvents':len(blocked),'failedEventsNotExtraRequests':len(failed),'admittedAdAnalyticsPatternEvents':len(third),'busyTextInSavedDOM':busy,'diagnostic':file,'replayStatus':page.get('status'),'replayReason':page.get('reason'),'precedingMethod':lastmethod,'resourceDurationMs':None,'responseSamples':d.get('responses',[])})
   pending=[]
 hp=rp.rsplit('/',1)[0]+'/replay.har';har=load(hp)['log']['entries'] if hp in paths else []
 for nav in navs:
  if nav['error']:nav['recordedDocumentResponsesSamePathWithoutChronology']=[{'url':safe(e['request']['url']),'status':e['response']['status']} for e in har if 'html' in e['response'].get('content',{}).get('mimeType','') and urlsplit(e['request']['url']).path==urlsplit(nav['url']).path]
 groups=collections.defaultdict(list)
 for n in navs:groups[n['url']].append(n)
 dup=[{'url':u,'count':len(ns),'sessions':sorted(set(n['session'] for n in ns)),'sequences':[n['sequence'] for n in ns]} for u,ns in groups.items() if len(ns)>1]
 otherNavigationErrors=[e for e in a['entries'] if e['kind']=='SESSION_ERROR' and e.get('detail',{}).get('method')!='navigate' and re.search('page.goto|waitForLoadState|navigat',json.dumps(e.get('detail',{})),re.I)]
 results.append({'otherNavigationErrors':otherNavigationErrors,'recording':rp,'trace':tracepath if trace else None,'traceNavigationAlignment':aligned,'navigations':navs,'pages':pages,'duplicates':dup,'har':{'entries':len(har),'placeholderTimeEntries':sum(e.get('time')==0 and str(e.get('startedDateTime','')).startswith('1970-') for e in har),'statusCounts':dict(collections.Counter(str(e['response']['status']) for e in har)),'documentResponses':[{'url':safe(e['request']['url']),'status':e['response']['status']} for e in har if 'html' in e['response'].get('content',{}).get('mimeType','')]}})
for p in paths:
 if any(x in p for x in ['g6-supplement-20261103/observations.json','d4-d6-safety-only/observations.json','split-resume-20261102/time-and-resource-observations.json','named-identity-terms-20261103/report.md']):raw(p)
(OUT/'analysis.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n');(OUT/'inputs.json').write_text(json.dumps({'gitRevision':subprocess.check_output(['git','rev-parse',REV],text=True).strip(),'sha256':manifest},ensure_ascii=False,indent=2)+'\n')
for r in results:
 print(r['recording'].split('/phase3b/')[1], 'nav',len(r['navigations']),'errors',[(n['url'],n.get('actualTimeoutMs'),n['elapsedMs']) for n in r['navigations'] if n['error']],'busy',sum(p['busyTextInSavedDOM'] is True for p in r['pages']),'pages',len(r['pages']),'HAR',r['har']['entries'],'placeholder',r['har']['placeholderTimeEntries'])
