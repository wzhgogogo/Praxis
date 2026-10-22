"""Independent evaluation-side review of this newly observed registered set.
No production parser, model, labels or source requests. Fixed requests are a
literal oracle, while identity/quotes/cuisine come only from the new raw bytes.
"""
import datetime,hashlib,json,math,pathlib,re,html
from urllib.parse import urlsplit,parse_qs
ROOT=pathlib.Path('.eval-artifacts/checkpoint-c-live-20261020')
D=ROOT/'checkpoint-c-rerun-20261021'
load=lambda p:json.loads(pathlib.Path(p).read_text())
sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
when=lambda s:datetime.datetime.fromisoformat(s.replace('Z','+00:00'))
plan=load(ROOT/'witness-plan.json');capture=load(D/'witness-capture/capture.json')
assert capture['models']==0 and capture['stopped'] is None and len(capture['variants'])==6
requests={'p2l-kf-h001-20261103':('2026-11-03',2,'19:00','19:00'),'p2l-kf-h002-20261107':('2026-11-07',2,'18:30','18:30'),'p2l-kf-h003-20261106':('2026-11-06',10,'17:30','22:00'),'p2l-kf-h005-20261105':('2026-11-05',4,'18:00','18:00'),'p2l-kagurazaka-kaiseki-20261105':('2026-11-05',3,'19:30','19:30'),'p2l-kichijoji-tempura-20261103':('2026-11-03',2,'18:00','18:00')}
records=[json.loads(s) for s in (D/'witness-capture/requests.jsonl').read_text().splitlines()]
for record in records:
 u=urlsplit(record['url']);q=parse_qs(u.query)
 assert record['method']=='GET' and u.scheme=='https' and u.netloc=='tabelog.com'
 assert '/reserve' not in u.path
 if q:assert u.path=='/en/booking/calendar/find_vacancy/' and set(q)=={'rst_id','svd','svps','svt'} and all(len(v)==1 for v in q.values())
 else:assert re.fullmatch(r'/en/tokyo/(?:A\d+/)+\d{8}/(?:party/)?',u.path)
gaps=[(when(b['requestedAt'])-when(a['finishedAt'])).total_seconds() for a,b in zip(records,records[1:])]
assert min(gaps)>=30
reviews=[];rows=[];times=[]
for v in capture['variants']:
 expected=next(p for p in plan['variants'] if p['caseId']==v['caseId'])
 date,party,start,end=requests[v['caseId']];assert (v['date'],v['partySize'],v['earliest'],v['latest'])==(date,party,start,end)
 assert len(v['observedWitnesses'])==len(expected['witnesses'])
 for row in v['observedWitnesses']:
  registered=next(w for w in expected['witnesses'] if w['sourceUrl']==row['sourceUrl'])
  for ref in row['observationRefs']:assert sha(ref['path'])==ref['fileSha256'];times.append(when(ref['requestedAt']))
  identity=next(r for r in row['observationRefs'] if r['kind']=='IDENTITY');source=load(identity['path']);business=None
  for block in source['evidence']['jsonLd']:
   assert hashlib.sha256(block['raw'].encode()).hexdigest()==block['sha256']
   b=json.loads(block['raw'])
   if b.get('@id')==registered['sourceUrl']:business=b
  assert business is not None
  center=expected['center'];geo=business['geo'];rad=math.pi/180;h=math.sin((float(geo['latitude'])-center['latitude'])*rad/2)**2+math.cos(center['latitude']*rad)*math.cos(float(geo['latitude'])*rad)*math.sin((float(geo['longitude'])-center['longitude'])*rad/2)**2
  meters=12742000*math.atan2(math.sqrt(h),math.sqrt(max(0,1-h)));assert meters<=center['radiusMeters']
  refs=list(dict.fromkeys(ref['path'] for ref in row['observationRefs'] if ref['kind'] in ['IDENTITY','HARD']))
  cuisine=business.get('servesCuisine','');literal=' '.join(html.unescape(q['raw']) for p in refs for q in load(p)['evidence']['rawQuotes'])
  hard=[]
  for c in expected['criteria']:
   if c['strength']!='HARD':continue
   value=c['value'];supported=False;rationale='No current raw support for this original HARD condition.'
   if value=='omakase':supported='omakase' in literal.lower();rationale='Current retained preregistered raw course sentence explicitly identifies omakase.'
   elif value=='kaiseki':supported='kaiseki' in literal.lower();rationale='Current retained preregistered raw venue/course sentence explicitly identifies Kaiseki.'
   elif value=='tempura':supported='Tempura' in cuisine;rationale='Current raw business cuisine classification explicitly includes Tempura.'
   elif value=='local food':supported=any(x in cuisine for x in ['Sushi','Japanese','Yakitori']);rationale='Evaluation-side manual interpretation of current positive Japanese sushi/tempura/izakaya-yakitori business type; unchanged original requirement.'
   elif value in ['fast food','hot pot restaurant','Sichuan/Hunan cuisine']:
    supported=any(x in cuisine for x in ['Sushi','Teppanyaki','Japanese','Yakitori']) and not any(x in cuisine.lower() for x in ['hot pot','sichuan','hunan','fast food'])
    rationale='Evaluation-side manual interpretation of positive registered full-service sushi/teppanyaki/Japanese izakaya type and current business identity; not a ban on all spicy dishes and not absence-of-keyword evidence alone. This is not an explicit source quote of the exclusion.'
   hard.append({'value':value,'polarity':c['polarity'],'status':'SUPPORTED' if supported else 'NOT_EVALUATED','assessmentMethod':'CODEX_EVALUATION_SIDE_CURRENT_RAW_REVIEW','rationale':rationale,'evidenceRefs':refs,'rawBusinessJsonLdRetained':True})
  raw=load(row['inventory']['bodyPath']);assert sha(row['inventory']['bodyPath'])==row['inventory']['sha256']
  assert (raw['base_date']['year'],raw['base_date']['month'],raw['base_date']['day'])==(int(date[:4]),int(date[5:7]),int(date[8:])) and raw['members']==party and raw['time']==start
  if 'dow' in raw['base_date']:assert raw['base_date']['dow']==['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][datetime.date.fromisoformat(date).weekday()]
  slots=[]
  for s in raw.get('selection',{}).values():
   u=urlsplit(s['url']);q=parse_qs(u.query)
   if start<=s['time']<=end:
    assert u.netloc in ['', 'tabelog.com'] and q.get('rcd')==[row['rst_id']] and q.get('member')==[str(party)] and q.get('visit_date')==[date.replace('-','')] and q.get('visit_time')==[s['time'].replace(':','')]
    slots.append(s['time'])
  assert slots==row['matchingSlots']
  review={'caseId':v['caseId'],'rst_id':row['rst_id'],'identityReview':{'status':'SUPPORTED','currentSourceName':business['name'],'canonicalUrl':business['@id'],'distanceMeters':meters,'rationale':'Current canonical outlet ID/name/address/coordinates, same registered business and in-radius; original literal-name observation retained.','evidenceRefs':[{'path':identity['path'],'sha256':identity['fileSha256']}]},'hardCriteria':hard,'inventoryReview':{'matchingSlots':slots,'rawPath':row['inventory']['bodyPath'],'sha256':row['inventory']['sha256']}}
  reviews.append(review);rows.append({'caseId':v['caseId'],'rst_id':row['rst_id'],'sourceName':business['name'],'cuisine':cuisine,'currentRawQuote':literal,'distanceMeters':meters,'hardSupported':all(h['status']=='SUPPORTED' for h in hard),'matchingSlots':slots,'inventoryMatched':bool(slots)})
assert len(rows)==16
review={'captureSha256':sha(D/'witness-capture/capture.json'),'reviewedBy':'CODEX_EVALUATION_SIDE','independentOfProduction':True,'externalReviewerApproval':'User preapproved this recertification and subsequent C18 after review27b3884a; source judgments explicitly recorded here, not a claim of external per-outlet review.','method':'Independent raw JSON-LD, literal raw quote and inventory/date/party/outlet checks. No production parser/model/labels.','witnesses':reviews}
audit={'status':'PASS','requests':len(records),'minSourceGapSeconds':min(gaps),'models':0,'earliestWitnessObservedAt':min(times).isoformat(),'captureFinishedAt':capture['finishedAt'],'rows':rows}
for name,value in [('source-review.json',review),('capture-audit.json',audit)]:
 with (D/name).open('x') as f:json.dump(value,f,ensure_ascii=False,indent=2)
print(json.dumps({'status':'PASS','outlets':len(rows),'inventoryMatched':sum(bool(r['matchingSlots']) for r in rows),'requests':len(records),'minimumGapSeconds':min(gaps)}))
