# coding: utf-8
import pathlib,json,hashlib,subprocess,re,math,datetime,collections,sys
D=pathlib.Path('.eval-artifacts/phase2c-holdout/witness-certification-20261023');B=D.parent
get=lambda p:json.load(open(p));sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest();ref=lambda p:{'path':str(p),'sha256':sha(p)}
def put(name,value):
 if '--verify-only' in sys.argv:return
 p=D/name;assert not p.exists(),name;p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def dt(s):return datetime.datetime.fromisoformat(s.replace('Z','+00:00'))
def bj(s):return dt(s).astimezone(datetime.timezone(datetime.timedelta(hours=8))).isoformat(timespec='milliseconds')
def meters(a,b):
 x,y,dx,dy=map(math.radians,[a['latitude'],float(b['latitude']),float(b['latitude'])-a['latitude'],float(b['longitude'])-a['longitude']]);v=math.sin(dx/2)**2+math.cos(x)*math.cos(y)*math.sin(dy/2)**2;return 6371000*2*math.atan2(math.sqrt(v),math.sqrt(max(0,1-v)))
# Recheck promise against independent literal bytes, rather than YAML loader output.
c=get(B/'commitment.json');raw=(B/'holdout.yaml').read_bytes();assert hashlib.sha256(raw).hexdigest()=='1602ca7a5ff860130b81235553db8e77d7d9c25d261801c38330db0a97171a1e'==c['fileSha256'];assert (B/'commitment.json').read_bytes()==subprocess.check_output(['git','show','398d2e12:.eval-artifacts/phase2c-holdout/commitment.json']);case_hashes=[]
for p in re.split(r'^---$',raw.decode(),flags=re.M):
 m=re.search(r'^id: "([^"]+)"$',p,re.M)
 if m:
  h=hashlib.sha256((p.strip('\n')+'\n').encode()).hexdigest();assert h==c['caseSha256'][m[1]];case_hashes.append({'caseId':m[1],'sha256':h})
assert len(case_hashes)==6
frozen=[]
for p in [D/'certification-inputs-freeze.json',*sorted((D/'jobs').glob('*.freeze.json'))]:
 f=get(p)
 for k,h in f['files'].items():assert sha(k)==h,('FROZEN_CHANGED',k)
 frozen.append({'manifest':ref(p),'files':len(f['files'])})
rows=[json.loads(s) for s in (D/'requests.jsonl').read_text().splitlines()];assert len(rows)==42;last={};gaps=collections.defaultdict(list);google=collections.Counter();kinds=collections.Counter();observations=[]
for x in rows:
 from urllib.parse import urlparse,parse_qs,urljoin
 u=urlparse(x['url']);assert x['status']==200 and x['attempt']==1 and x.get('error') is None
 assert u.netloc in ['tabelog.com','places.googleapis.com']
 if x['kind']=='GOOGLE':assert x['method']=='POST' and u.path=='/v1/places:searchText';google[x['caseId']]+=1
 else:
  assert x['method']=='GET' and not re.search(r'/(reserve|form_course|reservation)(/|$)',u.path,re.I)
  if '/booking/' in u.path:assert u.path=='/en/booking/calendar/find_vacancy/' and sorted(parse_qs(u.query))==['rst_id','svd','svps','svt']
 if u.netloc in last:
  ms=(dt(x['requestedAt'])-dt(last[u.netloc])).total_seconds()*1000;assert ms>=30000,(u.netloc,ms);gaps[u.netloc].append(ms)
 last[u.netloc]=x['finishedAt'];meta=get(x['metadataPath']);assert meta['sha256']==x['sha256']
 if x.get('bodyPath'):assert sha(x['bodyPath'])==x['sha256']
 if x.get('sourcePath'):
  p=get(x['sourcePath']);assert p['responseSha256']==x['sha256'] and p['url']==x['url']
  for f in p['profile']['sourceFragments']+p['profile']['jsonLd']:assert hashlib.sha256(f['raw'].encode()).hexdigest()==f['sha256']
 kinds[x['kind']]+=1;observations.append({'caseId':x['caseId'],'kind':x['kind'],'requestedAt':x['requestedAt'],'observedAt':x['finishedAt'],'status':x['status'],'metadata':ref(x['metadataPath']),'responseSha256':x['sha256']})
reg=get(D/'registry.json');plan=get(D/'witness-search-plan.json');review=get(D/'certification-review.json');assert sha(D/'certification-review.json')==get(D/'certification-review-ref.json')['sha256'];assert reg['status']=='CERTIFIED_WITH_ONE_PREAPPROVED_EXCLUSION';assert len(reg['variants'])==6
certified=[];times=[]
for v in reg['variants']:
 rv=next(q for q in review['variants'] if q['caseId']==v['caseId']);center=get(rv['center']['response']['path']);meta=get(rv['center']['metadata']['path']);assert meta['status']==200 and meta['sha256']==rv['center']['response']['sha256'];assert rv['center']['requestedAt']==meta['requestedAt'];p=next(q for q in center['places'] if q['id']==v['center']['placeId']);assert p['location']=={k:v['center'][k] for k in ['latitude','longitude']}
 original=next(q for q in plan['variants'] if q['caseId']==v['caseId']);assert v['usedPlace'] in [original['place'],original['fallbackPlace']];assert v['date']==get(B/'exit-dates.json')['cases'][v['caseId']]['date']
 for w in v['witnesses']:
  page=get(w['pageSource']['path']);business=next(json.loads(q['raw']) for q in page['profile']['jsonLd'] if json.loads(q['raw']).get('@id')==w['sourceUrl']);assert business['name']==w['outletName'];distance=meters(v['center'],business['geo']);assert distance<=1000 and abs(distance-w['distanceMeters'])<0.001
  assert len(w['hardCriteria'])==len([q for q in original['criteria'] if q['strength']=='HARD'])
  for h in w['hardCriteria']:
   gold=original['criteria'][h['goldIndex']];assert all(h[k]==gold[k] for k in ['value','polarity','strength']);assert h['status']=='SUPPORTED';assert any(f['role']==h['role'] and h['quote'] in f['text'] for f in page['profile']['sourceFragments'])
  category=next(f['text'] for f in page['profile']['sourceFragments'] if f['role']=='CATEGORY')
  literal={'p2c-holdout-01':'Kushi-age','p2c-holdout-02':'Korean','p2c-holdout-04':'Chanko-nabe','p2c-holdout-05':'Steak','p2c-holdout-06':'Motsu-nabe'}[v['caseId']];assert literal in category
  if v['caseId']=='p2c-holdout-05':assert not re.search(r'hamburg|hambagu|ハンバーグ',category,re.I)
  inventory=get(w['inventory']['body']['path']);m=get(w['inventory']['metadata']['path']);assert sha(w['inventory']['body']['path'])==m['sha256'];date=inventory['base_date'];assert f"{date['year']:04}-{date['month']:02}-{date['day']:02}"==v['date'];assert inventory['members']==v['partySize'];valid=[]
  for s in inventory['selection'].values():
   u=urlparse(urljoin('https://tabelog.com',s['url']));q=parse_qs(u.query);t=s['time'];to_min=lambda t:int(t[:2])*60+int(t[3:]);
   if to_min(v['earliest'])<=to_min(t)<=to_min(v['latest']) and u.netloc=='tabelog.com' and q.get('rcd')==[w['rst_id']] and q.get('visit_date')==[v['date'].replace('-','')] and q.get('member')==[str(v['partySize'])] and q.get('visit_time')==[t.replace(':','')]:valid.append(t)
  assert valid==w['matchingSlots'] and valid
  times.extend([rv['center']['requestedAt'],get(w['pageMetadata']['path'])['requestedAt'],m['requestedAt']]);certified.append({'caseId':v['caseId'],'outletName':w['outletName'],'usedPlace':v['usedPlace'],'distanceMeters':distance,'matchingSlots':valid})
assert len(certified)==5 and [v['caseId'] for v in reg['variants'] if not v['witnesses']]==['p2c-holdout-03'];assert min(map(dt,times))==dt(reg['earliestWitnessObservedAt']);assert dt(reg['validUntil'])-dt(reg['earliestWitnessObservedAt'])==datetime.timedelta(hours=24)
# Show independent raw search facts for the single exclusion; do not infer global impossibility.
casesearch=[];centerprimary=get(D/'reads/01-centers-and-listings/center-03.attempt-1.body.json')['places'][0]['location'];centerfallback=get(D/'reads/09-fallback-fugu-discovery/fallback-center-03.attempt-1.body.json')['places'][0]['location']
for x in rows:
 if x['caseId']!='p2c-holdout-03' or x['kind']!='GOOGLE' or 'center' in x['metadataPath']:continue
 center=centerfallback if 'fallback' in x['metadataPath'] else centerprimary;places=[{'name':p['displayName']['text'],'placeId':p['id'],'distanceMeters':meters(center,p['location']),'websiteUri':p.get('websiteUri')} for p in get(x['bodyPath']).get('places',[])];casesearch.append({'query':get(x['metadataPath'])['query'],'usedPlace':'Kudanshita' if center==centerfallback else 'Ichigaya','body':ref(x['bodyPath']),'places':places,'within1000m':sum(p['distanceMeters']<=1000 for p in places)})
shiose=get(D/'reads/08-primary-shiose-dinner/shiose-03.attempt-1.source.json');sg=json.loads(shiose['profile']['jsonLd'][0]['raw'])['geo'];assert meters(centerprimary,sg)>1000
obu=get(D/'reads/12-fallback-obu-dinner/obu-03.attempt-1.source.json');assert obu['profile']['publicBookingRead']['status']=='NOT_EXPOSED_OR_NOT_UNIQUELY_BOUND';assert not any(re.search(r'fugu|pufferfish',f['text'],re.I) for f in obu['profile']['sourceFragments'] if f['role']=='CATEGORY');assert not any(f['role']=='COURSE_OFFER' for f in obu['profile']['sourceFragments'])
put('source-search-audit.json',{'mode':'OFFLINE_RECOMPUTATION_FROM_SAVED_RAW','case03GoogleSearches':casesearch,'primaryShioseDistanceMeters':meters(centerprimary,sg),'primaryNemotoReturnedTimes':[s['time'] for s in get(D/'reads/06-final-inventory/inventory-03.attempt-1.body.json')['selection'].values()],'fallbackObu':{'source':ref(D/'reads/12-fallback-obu-dinner/obu-03.attempt-1.source.json'),'classification':'NOT_CERTIFIED_HARD_AND_INVENTORY_NOT_ESTABLISHED'},'noWitnessMeaning':'No certified witness found within the bounded approved source search, not proof that every restaurant has no suitable table.'})
put('resource-and-cadence-audit.json',{'status':'PASS','requestCount':len(rows),'googleRequests':sum(google.values()),'googleByCase':dict(google),'restaurantSourceRequests':len(rows)-sum(google.values()),'requestsByKind':dict(kinds),'httpStatuses':{'200':len(rows)},'minFinishToNextStartGapMs':{k:min(v) for k,v in gaps.items()},'retries':0,'newModelCalls':0,'newFullLiveRuns':0,'newEnvironmentReruns':0,'reservationFormRequests':0,'slotClicks':0,'tablecheckReserveRequests':0,'browserSessions':0,'inventoryResponseLinks':'Parsed as data only; never fetched','observations':observations})
changed=subprocess.check_output(['git','diff','--name-only','941ca9c1','--','src','web-skills','scripts','package.json','package-lock.json',str(B/'holdout.yaml'),str(B/'commitment.json'),str(B/'exit-dates.json')]).decode().strip();assert not changed;assert not (D/'network-denied.jsonl').exists()
put('delivery-verification.json',{'status':'PASS_WITNESS_CERTIFICATION_WITH_ONE_APPROVED_EXCLUSION','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'originalBase':'941ca9c1','promisedFileSha256':c['fileSha256'],'caseSha256':case_hashes,'frozenInputsVerified':frozen,'registry':ref(D/'registry.json'),'certifiedWitnesses':certified,'certifiedCases':5,'excludedCases':1,'fallbackUsedCases':['p2c-holdout-03'],'newModelCalls':0,'newProductLiveRuns':0,'productAndGoldUnchanged':True,'offlineCertificationNoNetworkAttempt':True,'auditRepairNote':'Initial independent audit treated source-relative slot URLs as absolute; it was corrected to standard same-origin URL resolution before checking outlet/date/party/time. Raw responses and certification input/verdicts were unchanged.', 'checks':'Independent Python byte hashing, geometry, raw date/member/outlet/time URL binding, source classification and request cadence; no production parser/model used. Full merchant HTML not retained, only exact minimal business fragments and responseSHA.'})
print(json.dumps({'status':'PASS','requests':len(rows),'google':sum(google.values()),'source':len(rows)-sum(google.values()),'gaps':{k:min(v) for k,v in gaps.items()},'certified':len(certified),'earliestBeijing':bj(reg['earliestWitnessObservedAt']),'deadlineBeijing':bj(reg['validUntil'])},ensure_ascii=False))
