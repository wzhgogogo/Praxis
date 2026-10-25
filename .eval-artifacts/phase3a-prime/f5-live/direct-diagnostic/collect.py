#!/usr/bin/env python3
import pathlib,urllib.request,urllib.error,datetime,time,json,hashlib,gzip
P=pathlib.Path(__file__).resolve().parent; B=P.parent.parent/'budget.json'
def stamp():return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
def save(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
d=json.loads(B.read_text());assert not any(r.get('id')=='f5-direct-connectivity-get-1' for r in d['entries']);row={'id':'f5-direct-connectivity-get-1','kind':'USER_REQUESTED_DIRECT_CONNECTIVITY_DIAGNOSTIC','approval':'User: tabelog我网页打开正常，不知道又是什么问题。。。你试试直连或者什么','websiteGET':1,'fullLive':0,'realModelCalls':0,'googleRequests':0,'environmentReruns':0,'status':'STARTED','startedAtCET':stamp()};d['entries'].append(row);d['cumulative']['websiteGET']=sum(r.get('websiteGET',0) for r in d['entries']);save(B,d)
url='https://tabelog.com/en/tokyo/A1301/';started=time.monotonic();raw=b'';status=None;error=None;headers={}
try:
 req=urllib.request.Request(url,method='GET',headers={'User-Agent':'Mozilla/5.0 (compatible; public-read connectivity check)','Accept':'text/html','Accept-Encoding':'identity'});opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
 try:response=opener.open(req,timeout=10)
 except urllib.error.HTTPError as e:response=e
 with response:status=response.status;raw=response.read();headers={k:response.headers.get(k) for k in ['Content-Type','Date','Location'] if response.headers.get(k)}
except Exception as e:error=type(e).__name__
(P/'response.body').write_bytes(raw);(P/'response.body.gz').write_bytes(gzip.compress(raw,mtime=0));meta={'method':'GET','url':url,'proxy':'DISABLED ProxyHandler({})','cookieState':'NONE','followRedirects':False,'status':status,'error':error,'elapsedSeconds':time.monotonic()-started,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'responseHeaders':headers,'finishedAtCET':stamp(),'scope':'HTTP document connectivity only; no JS, Chromium health classification or Live capability assertion'};save(P/'response.metadata.json',meta);row.update({'status':'FINISHED','httpStatus':status,'error':error,'finishedAtCET':stamp(),'sha256':meta['sha256'],'metadata':str(P/'response.metadata.json')});save(B,d);print(json.dumps(meta,ensure_ascii=False))
