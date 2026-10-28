"""Saved exposed Google candidates only; no provider, browser or HTTP clients."""
from pathlib import Path
import collections,gzip,hashlib,json
from urllib.parse import urlparse

out=Path('.eval-artifacts/phase3b/c-batch2-preparation')
source=Path('.eval-artifacts/name-resolution-benchmark-20261019/source-manifest.json')
manifest=json.loads(source.read_text());inputs=[];pool={};excluded=collections.Counter()
def digest(b):return hashlib.sha256(b).hexdigest()
def category(url):
    host=(urlparse(url).hostname or '').lower().removeprefix('www.')
    if host=='tabelog.com' or host.endswith('.tabelog.com'):return 'DIRECT_TABELOG'
    if host=='tablecheck.com' or host.endswith('.tablecheck.com'):return 'DIRECT_TABLECHECK'
    if any(host==x or host.endswith('.'+x) for x in ['instagram.com','facebook.com','twitter.com','x.com','tiktok.com']):return 'SOCIAL'
    if any(host==x or host.endswith('.'+x) for x in ['gnavi.co.jp','gurunavi.com','hotpepper.jp','hitosara.com','retty.me','ozmall.co.jp','toreta.in','hitosara.com','tripadvisor.com','tripadvisor.jp']):return 'OTHER_PORTAL'
    return 'OWN_WEBSITE_CANDIDATE' if host else 'NO_WEBSITE'
def add(restaurant,ref,record,index,area):
    ids=restaurant.get('sourceIds',{});pid=ids.get('googlePlaces');point=restaurant.get('coordinates',{});website=ids.get('googleWebsiteUri','')
    if not pid:excluded['missingGoogleId']+=1;return
    if not all([restaurant.get('outletName'),restaurant.get('address'),ids.get('phone'),isinstance(point.get('lat'),(int,float)),isinstance(point.get('lng'),(int,float))]):excluded['incomplete']+=1;return
    provenance={'path':ref['path'],'sha256':ref['sha256'],'record':record,'candidateIndex':index,'area':area}
    if pid in pool:
        pool[pid]['provenance'].append(provenance);return
    pool[pid]={'googlePlaceId':pid,'subject':{'name':restaurant['outletName'],'address':restaurant['address'],'phone':ids['phone'],'coordinates':point},
               'googleWebsiteUri':website,'websiteHost':urlparse(website).hostname or '', 'websiteCategory':category(website),
               'nameScript':'JAPANESE' if any('\u3040'<=c<='\u9fff' for c in restaurant['outletName']) else 'LATIN_OR_OTHER',
               'provenance':[provenance]}
for ref in manifest['sources']:
    p=Path(ref['path']);assert '.eval-private/' not in str(p) and not any(x.startswith('.env') for x in p.parts)
    b=p.read_bytes();assert digest(b)==ref['sha256'],str(p);inputs.append(ref)
    text=(gzip.decompress(b) if p.suffix=='.gz' else b).decode()
    rows=[json.loads(line) for line in text.splitlines() if line] if p.suffix=='.jsonl' else [e['event'] for e in json.loads(text)['events']]
    for n,row in enumerate(rows):
        read=row.get('detail',{}).get('read') if row.get('kind')=='SOURCE_FIRST_BATCH' else row if row.get('type')=='SEARCH_COMPLETED' else None
        if not read:continue
        for index,c in enumerate(read.get('candidates',[])):
            add(c.get('restaurant',{}),ref,n,index,row.get('request',{}).get('intent',{}).get('area',{}).get('query','UNRECORDED'))
for p in sorted(Path('.eval-artifacts/phase3a-prime/f5-live/evidence').glob('*.result.json.gz')):
    b=p.read_bytes();ref={'path':str(p),'sha256':digest(b)};inputs.append(ref);a=json.loads(gzip.decompress(b));cs=a['finalSnapshot']['domainState'].get('candidates',{})
    cs=list(cs.values()) if isinstance(cs,dict) else cs
    for index,c in enumerate(cs):add(c.get('restaurant',{}),ref,'finalSnapshot.domainState.candidates',index,a['caseId'])
old=json.loads(Path('.eval-artifacts/name-resolution-benchmark-20261019/samples.json').read_text())
oldids={p['googlePlaceId'] for s in old['samples'] for p in s['provenance']}
for row in pool.values():row['inOldNameResolutionSamples']=row['googlePlaceId'] in oldids
result={'schema':'phase3b-no-direct-candidate-pool@1','status':'DRAFT_EXPOSED_NOT_GOLD','newRealCalls':0,'privateHoldoutRead':False,
        'countsByCategory':dict(collections.Counter(r['websiteCategory'] for r in pool.values())),
        'eligibleNewCounts':dict(collections.Counter(r['websiteCategory'] for r in pool.values() if not r['inOldNameResolutionSamples'])),
        'classificationLimit':'OWN_WEBSITE_CANDIDATE is a hostname-based sampling label, not verified ownership. Source timestamps are historical, not current website claims.',
        'excluded':dict(excluded),'candidates':sorted(pool.values(),key=lambda r:r['googlePlaceId']),'inputs':inputs}
(out/'candidate-pool.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:result[k] for k in ['countsByCategory','eligibleNewCounts','excluded']},ensure_ascii=False))
