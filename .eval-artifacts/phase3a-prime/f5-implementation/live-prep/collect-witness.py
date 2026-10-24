#!/usr/bin/env python3
"""Evaluation-only bounded public GET certification; no browser/model/cookie state."""
import argparse, datetime as dt, hashlib, html, json, math, pathlib, re, subprocess, time, unicodedata
import urllib.error, urllib.parse, urllib.request
from html.parser import HTMLParser
from zoneinfo import ZoneInfo
ROOT=pathlib.Path(__file__).resolve().parents[4]
HERE=pathlib.Path(__file__).resolve().parent
V=ZoneInfo('Europe/Vienna')
def stamp(): return dt.datetime.now(V).isoformat()
def sha(raw): return hashlib.sha256(raw).hexdigest()
def save(path, value): path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def git(*args): return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()
def distance(a,b):
    lat1,lat2=map(math.radians,[a['latitude'],b['latitude']]); dl=math.radians(b['longitude']-a['longitude']); dlat=lat2-lat1
    return 6371000*2*math.asin(min(1,math.sqrt(math.sin(dlat/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin(dl/2)**2)))
def namekey(s): return re.sub(r'\W','',unicodedata.normalize('NFKC',s).casefold())
class Source(HTMLParser):
    def __init__(self): super().__init__(); self.ld=[];self.rows=[];self.active=False;self.row=None;self.buf=[];self.canon=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='script' and a.get('type')=='application/ld+json': self.active=True;self.buf=[]
        if tag=='tr': self.row=[]
        if tag=='link' and a.get('rel')=='canonical':self.canon.append(a.get('href',''))
    def handle_data(self,s):
        if self.active:self.buf.append(s)
        if self.row is not None:self.row.append(s)
    def handle_endtag(self,tag):
        if tag=='script' and self.active:
            self.active=False
            try:self.ld.append(json.loads(''.join(self.buf)))
            except ValueError:pass
        if tag=='tr' and self.row is not None:self.rows.append(' '.join(' '.join(self.row).split()));self.row=None

def nodes(v):
    if isinstance(v,list):
        for x in v:yield from nodes(x)
    elif isinstance(v,dict):
        yield v
        if '@graph' in v:yield from nodes(v['@graph'])
def identity(raw,candidate,config):
    p=Source();p.feed(raw.decode('utf-8',errors='replace'))
    expected=candidate['rst_id']; found=[]
    for n in nodes(p.ld):
        typ=n.get('@type',[]);typ=[typ] if isinstance(typ,str) else typ
        if 'Restaurant' not in typ:continue
        geo=n.get('geo',{})
        try:point={k:float(geo[k]) for k in ['latitude','longitude']}
        except (KeyError,ValueError,TypeError):continue
        if not all(math.isfinite(x) for x in point.values()) or abs(point['latitude'])>90 or abs(point['longitude'])>180:continue
        urls=[n.get('@id',''),n.get('url',''),*p.canon]
        same=any(re.fullmatch(r'https://tabelog\.com/(?:en/)?tokyo/A\d+/A\d+/'+expected+r'/?',u) for u in urls if isinstance(u,str))
        if not same or namekey(n.get('name','')) not in [namekey(x) for x in candidate['names']]:continue
        category=[row for row in p.rows if re.match(r'^Categories\b',row) and re.search(r'kushi.?age|deep.fried skewers|kushikatsu',row,re.I)]
        meters=distance(config['center'],point)
        if category and meters<=1000:found.append({'name':n['name'],'coordinates':point,'distanceMeters':meters,'categoryQuotes':category,'identityUrls':urls})
    return found[0] if len(found)==1 else None

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):return None

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--execute',action='store_true');parser.add_argument('--output',default='certification-stop2');args=parser.parse_args()
    config=json.loads((HERE/'witness-input.json').read_text());freeze=json.loads((HERE/'freeze.json').read_text())
    for path,digest in freeze['files'].items():
        assert sha((ROOT/path).read_bytes())==digest,'FROZEN_CHANGED:'+path
        assert sha(subprocess.check_output(['git','show','HEAD:'+path],cwd=ROOT))==digest,'NOT_COMMITTED:'+path
    assert git('status','--porcelain')=='','WORKTREE_DIRTY'
    assert len(config['candidates'])<=5
    for c in config['candidates']:
        assert re.fullmatch(r'\d{8}',c['rst_id']) and c['historicalCategoryCompatible']
        assert distance(config['center'],c['historicalCoordinates'])<=1000
        assert urllib.parse.urlsplit(c['detailUrl']).netloc=='tabelog.com' and c['detailUrl'].endswith('/'+c['rst_id']+'/')
    if not args.execute:print(json.dumps({'status':'FROZEN_OFFLINE_CHECK_PASS','scriptCommit':git('rev-parse','HEAD'),'candidates':len(config['candidates']),'maxGET':2*len(config['candidates']),'requests':0}));return
    # A distinct output is mandatory for the separately approved pre-Live repeat.
    assert re.fullmatch(r'[a-z0-9-]+',args.output)
    output=HERE/args.output;output.mkdir(exist_ok=False)
    ledgerPath=ROOT/'.eval-artifacts/phase3a-prime/budget.json'
    ledger=json.loads(ledgerPath.read_text());requestRows=[];results=[];lastFinished=None
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
    def get(url,kind,candidate):
        nonlocal lastFinished
        assert len(requestRows)<10
        u=urllib.parse.urlsplit(url);assert u.scheme=='https' and u.netloc=='tabelog.com'
        if kind=='VACANCY':assert u.path=='/en/booking/calendar/find_vacancy/' and sorted(urllib.parse.parse_qs(u.query))==['rst_id','svd','svps','svt']
        else:assert not u.query and url==candidate['detailUrl']
        if lastFinished is not None:time.sleep(max(0,5-(time.monotonic()-lastFinished)))
        n=len(requestRows)+1;prefix=output/f'{n:02d}-{candidate["rst_id"]}-{kind.lower()}'
        row={'sequence':n,'caseId':'p2c-holdout-01','method':'GET','url':url,'kind':kind,'startedAtVienna':stamp(),'collectorCommit':git('rev-parse','HEAD'),'cookieState':'NONE','followRedirects':False}
        requestRows.append(row)
        entry={'id':f'f5-{args.output}-get-{n}','kind':'WITNESS_PUBLIC_GET','startedAtVienna':row['startedAtVienna'],'websiteGET':1,'fullLive':0,'realModelCalls':0,'googleRequests':0,'environmentReruns':0,'requestMetadata':str(prefix.relative_to(ROOT))+'.metadata.json','status':'STARTED'}
        ledger['entries'].append(entry);ledger['cumulative']['websiteGET']=ledger['cumulative'].get('websiteGET',0)+1;ledger['asOf']=stamp();save(ledgerPath,ledger)
        raw=b'';headers={};status=None;error=None
        try:
            request=urllib.request.Request(url,method='GET',headers={'User-Agent':'Mozilla/5.0 (compatible; public-read witness check)','Accept-Encoding':'identity','Accept':'application/json' if kind=='VACANCY' else 'text/html'})
            try:response=opener.open(request,timeout=25)
            except urllib.error.HTTPError as e:response=e
            with response: status=response.status;headers=dict(response.headers.items());raw=response.read()
        except Exception as e:error=type(e).__name__+': '+str(e)
        lastFinished=time.monotonic();row.update({'finishedAtVienna':stamp(),'status':status,'error':error,'bytes':len(raw),'bodyPath':str(prefix.relative_to(ROOT))+'.body','sha256':sha(raw),'responseHeaders':headers})
        prefix.with_suffix('.body').write_bytes(raw);save(prefix.with_suffix('.metadata.json'),row)
        entry.update({'status':'FINISHED','httpStatus':status,'error':error,'sha256':sha(raw),'finishedAtVienna':row['finishedAtVienna']});ledger['asOf']=stamp();save(ledgerPath,ledger);save(output/'requests.json',requestRows)
        return status,raw,row
    for c in config['candidates']:
        status,raw,detail=get(c['detailUrl'],'DETAIL',c);proof=identity(raw,c,config) if status==200 else None
        row={'rst_id':c['rst_id'],'detail':detail,'identityGeographyCategory':proof,'status':'DETAIL_UNVERIFIED'}
        if proof:
            params={'rst_id':c['rst_id'],'svd':config['date'].replace('-',''),'svps':'2','svt':'1900'}
            status,raw,vacancy=get('https://tabelog.com/en/booking/calendar/find_vacancy/?'+urllib.parse.urlencode(params),'VACANCY',c);row['vacancy']=vacancy
            try: data=json.loads(raw) if status==200 else {}
            except ValueError:data={}
            base=data.get('base_date',{});matching=[]
            if [base.get(k) for k in ['year','month','day']]==[int(x) for x in config['date'].split('-')] and data.get('members')==2 and data.get('time')=='19:00':
                selections=data.get('selection',{});selections=selections.values() if isinstance(selections,dict) else selections
                for slot in selections or []:
                    if not isinstance(slot,dict) or slot.get('time')!='19:00':continue
                    q=urllib.parse.parse_qs(urllib.parse.urlsplit(html.unescape(slot.get('url',''))).query)
                    if all(q.get(k)==[v] for k,v in {'rcd':c['rst_id'],'member':'2','visit_date':params['svd'],'visit_time':'1900'}.items()):matching.append('19:00')
            row.update({'matchingSlots':matching,'status':'CERTIFIED_STOP2_ONLY' if matching else 'NO_MATCHING_CURRENT_SLOT'})
        results.append(row)
        save(output/'certificate.json',{'status':'WITNESS_EXISTS' if any(r['status']=='CERTIFIED_STOP2_ONLY' for r in results) else 'WITNESS_NOT_CERTIFIED','purpose':'Stop2 review only; MUST repeat within24h before separately approved Live','date':config['date'],'center':config['center'],'radiusMeters':1000,'GET':len(requestRows),'case03GET':0,'modelCalls':0,'googleCalls':0,'liveRuns':0,'certifiedAtVienna':stamp(),'results':results})
    print(json.dumps({'requests':len(requestRows),'outcomes':[r['status'] for r in results]}))
if __name__=='__main__':main()
