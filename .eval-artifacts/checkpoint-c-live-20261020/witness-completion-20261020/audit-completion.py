"""Offline source review and independent request/raw-byte audit for this batch.

The HARD interpretations below are explicit evaluation-side judgments for these
registered outlets, not a production parser or a general semantic classifier.
"""
import datetime
import hashlib
import json
import math
import pathlib
from urllib.parse import urlsplit, parse_qs

ROOT=pathlib.Path('.eval-artifacts/checkpoint-c-live-20261020')
DIRECTORY=ROOT/'witness-completion-20261020'
sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
load=lambda p:json.loads(pathlib.Path(p).read_text())
capture_path=DIRECTORY/'capture/capture.json'
capture=load(capture_path)
plan=load(ROOT/'witness-plan.json')
prior=load(ROOT/'witness-resume-20261020/capture/capture.json')
old_review=load(ROOT/'witness-resume-20261020/source-review.json')
assert capture['stopped'] is None and capture['gets']==18 and capture['models']==0
assert sha('.eval-artifacts/p2-live-set-20261019/variants.yaml')=='910ba0fdf755392ab1d2a1b0c2da5f9fa8d66a32217c109e8eb5f3b3ee24e8b6'

# Independent literal oracle: dates/party/window and new request order authorized by the user.
REQUESTS={
 'p2l-kf-h001-20261103':('2026-11-03',2,'19:00','19:00'),
 'p2l-kf-h002-20261107':('2026-11-07',2,'18:30','18:30'),
 'p2l-kf-h003-20261106':('2026-11-06',10,'17:30','22:00'),
 'p2l-kf-h005-20261105':('2026-11-05',4,'18:00','18:00'),
 'p2l-kagurazaka-kaiseki-20261105':('2026-11-05',3,'19:30','19:30'),
 'p2l-kichijoji-tempura-20261103':('2026-11-03',2,'18:00','18:00'),
}
ORDER=[('V','13281962'),('P','13318227'),('V','13318227'),('V','13305528'),
 ('P','13255508'),('V','13255508'),('P','13218101'),('V','13218101'),
 ('P','13048623'),('V','13048623'),('P','13011403'),('V','13011403'),
 ('P','13282321'),('V','13282321'),('P','13303321'),('V','13303321'),
 ('P','13192886'),('V','13192886')]
records=[json.loads(line) for line in (DIRECTORY/'capture/requests.jsonl').read_text().splitlines()]
actual=[]
for record in records:
 u=urlsplit(record['url']);q=parse_qs(u.query)
 assert u.scheme=='https' and u.netloc=='tabelog.com' and record['method']=='GET'
 assert record['status']==200 and record['attempt']==1
 if u.path=='/en/booking/calendar/find_vacancy/':
  assert set(q)=={'rst_id','svd','svps','svt'} and all(len(v)==1 for v in q.values())
  actual.append(('V',q['rst_id'][0]))
 else:
  assert not q and not u.fragment and u.path.endswith('/') and '/booking/' not in u.path and '/party/' not in u.path
  actual.append(('P',u.path.rstrip('/').split('/')[-1]))
assert actual==ORDER
when=lambda s:datetime.datetime.fromisoformat(s.replace('Z','+00:00'))
gaps=[(when(b['requestedAt'])-when(a['finishedAt'])).total_seconds() for a,b in zip(records,records[1:])]
assert min(gaps)>=30
preserved=[]
review_rows=[]
rows=[]
observations=[]
for variant in capture['variants']:
 registered=next(v for v in plan['variants'] if v['caseId']==variant['caseId'])
 date,party,earliest,latest=REQUESTS[variant['caseId']]
 assert (variant['date'],variant['partySize'],variant['earliest'],variant['latest'])==(date,party,earliest,latest)
 for row in variant['observedWitnesses']:
  witness=next(w for w in registered['witnesses'] if w['sourceUrl']==row['sourceUrl'])
  for ref in row['observationRefs']:
   assert sha(ref['path'])==ref['fileSha256']
   observations.append(when(ref['requestedAt']))
  raw=load(row['inventory']['bodyPath'])
  assert sha(row['inventory']['bodyPath'])==row['inventory']['sha256']
  assert raw['base_date']['year']==int(date[:4]) and raw['base_date']['month']==int(date[5:7]) and raw['base_date']['day']==int(date[-2:])
  assert raw['members']==party and raw['time']==earliest
  inventory_query=parse_qs(urlsplit(row['inventory']['url']).query)
  assert inventory_query=={'rst_id':[row['rst_id']],'svd':[date.replace('-','')],'svps':[str(party)],'svt':[earliest.replace(':','')]}
  slots=[]
  for value in raw.get('selection',{}).values():
   u=urlsplit(value['url']);q=parse_qs(u.query)
   if not (earliest<=value['time']<=latest):continue
   assert u.netloc in ['', 'tabelog.com'] and q.get('rcd')==[row['rst_id']] and q.get('member')==[str(party)]
   assert q.get('visit_date')==[date.replace('-','')] and q.get('visit_time')==[value['time'].replace(':','')]
   slots.append(value['time'])
  assert slots==row['matchingSlots']
  identity_ref=next(ref for ref in row['observationRefs'] if ref['kind']=='IDENTITY')
  source=load(identity_ref['path'])
  business=None
  for block in source['evidence']['jsonLd']:
   assert hashlib.sha256(block['raw'].encode()).hexdigest()==block['sha256']
   value=json.loads(block['raw'])
   if value.get('@id')==witness['sourceUrl']:business=value
  assert business is not None
  geo=business['geo'];center=registered['center'];r=math.pi/180
  h=math.sin((float(geo['latitude'])-center['latitude'])*r/2)**2+math.cos(center['latitude']*r)*math.cos(float(geo['latitude'])*r)*math.sin((float(geo['longitude'])-center['longitude'])*r/2)**2
  meters=12742000*math.atan2(math.sqrt(h),math.sqrt(1-h))
  assert meters<=center['radiusMeters']
  old=next((w for w in old_review['witnesses'] if w['caseId']==variant['caseId'] and w['rst_id']==row['rst_id']),None)
  if old:
   previous=next(w for v in prior['variants'] if v['caseId']==variant['caseId'] for w in v['observedWitnesses'] if w['rst_id']==row['rst_id'])
   assert {k:v for k,v in previous.items() if k!='reusedFromCapture'}=={k:v for k,v in row.items() if k!='reusedFromCapture'}
   preserved.append({'caseId':variant['caseId'],'rst_id':row['rst_id'],'inventorySha256':row['inventory']['sha256']})
   review=old
  else:
   refs=list(dict.fromkeys(ref['path'] for ref in row['observationRefs'] if ref['kind'] in ['IDENTITY','HARD']))
   hard=[]
   for criterion in registered['criteria']:
    if criterion['strength']!='HARD':continue
    value=criterion['value']
    if value=='local food':
     rationale='Current positive main-cuisine facts identify Japanese sushi/tempura or an izakaya/yakitori restaurant. Evaluation-side manual interpretation of the unchanged local-food requirement; Fukumimi is supported by current JSON-LD, not its absent preregistered literal quote.'
     assert any(s in business.get('servesCuisine','') for s in ['Sushi','Japanese','Yakitori'])
    elif value=='fast food':
     rationale='Evaluation-side manual source interpretation: the positively described sushi/tempura restaurant (JPY 10,000–14,999) or Japanese izakaya/yakitori tavern (JPY 4,000–4,999), together with its registered business identity, supports a full-service venue rather than a fast-food establishment. This is not an absence-of-keyword inference or an explicit source quotation of the exclusion; external review remains pending.'
     assert business.get('priceRange') in ['JPY 10,000～JPY 14,999','JPY 4,000～JPY 4,999']
    elif value=='kaiseki':
     rationale='Current retained raw quote explicitly identifies kaiseki cuisine/course or the registered venue offering Kaiseki; unchanged HARD criterion.'
     assert any('kaiseki' in x['raw'].lower() for x in source['evidence']['rawQuotes'])
    elif value=='tempura':
     rationale='Current retained raw business cuisine classification explicitly includes Tempura; unchanged HARD criterion.'
     assert 'Tempura' in business.get('servesCuisine','')
    else:raise AssertionError('Unreviewed HARD: '+value)
    hard.append({'value':value,'polarity':criterion['polarity'],'status':'SUPPORTED','assessmentMethod':'CODEX_EVALUATION_SIDE_MANUAL_SOURCE_INTERPRETATION','rationale':rationale,'evidenceRefs':refs,'rawQuoteBytesRetained':bool(source['evidence']['rawQuotes']),'rawBusinessJsonLdRetained':True})
   review={'caseId':variant['caseId'],'rst_id':row['rst_id'],'identityReview':{'status':'SUPPORTED','currentSourceName':business['name'],'canonicalUrl':business['@id'],'distanceMeters':meters,'rationale':'Same preregistered canonical outlet ID, business identity, source address and in-radius coordinates; translated or expanded branch suffixes are recorded without changing the original exact-name observation.','evidenceRefs':[{'path':identity_ref['path'],'sha256':identity_ref['fileSha256']}]},'hardCriteria':hard,'inventoryReview':{'status':'MATCHED' if slots else 'NO_MATCH_FOR_REGISTERED_REQUEST','matchingSlots':slots,'rawPath':row['inventory']['bodyPath'],'sha256':row['inventory']['sha256']},'classification':'KNOWN_FEASIBLE_SUPPORTED' if slots else 'NOT_CERTIFIED_NO_MATCHING_INVENTORY'}
  review_rows.append(review)
  rows.append({'caseId':variant['caseId'],'rst_id':row['rst_id'],'sourceName':business['name'],'distanceMeters':meters,'inventoryMatched':bool(slots),'matchingSlots':slots,'retainedPreregisteredQuote':all(h['found'] for h in row['hardObservations']),'rawInventorySha256':row['inventory']['sha256']})
assert len(preserved)==6 and len(rows)==16
assert min(observations).isoformat()=='2026-10-20T12:26:41.866000+00:00'
review={'captureSha256':sha(capture_path),'reviewedBy':'CODEX_EVALUATION_SIDE','independentOfProduction':True,'externalReviewerApproval':'PENDING','method':'Independent literal request/date/party oracle, raw JSON-LD and inventory bytes, manual source interpretations; no production parser, models, or network.','witnesses':review_rows}
audit={'status':'PASS','captureSha256':sha(capture_path),'requests':18,'http200':18,'minSourceGapSeconds':min(gaps),'transportRetries':0,'cooldownRetries':0,'models':0,'googleRequests':0,'fullLiveRuns':0,'formalLiveEnvironmentReruns':0,'preservedWitnesses':preserved,'expectedRequestOrder':'PASS','rawShaAndRequestBinding':'PASS','registeredDatesUnchanged':'PASS','earliestWitnessObservedAt':min(observations).isoformat(),'certificationCaptureFinishedAt':capture['finishedAt'],'rows':rows}
for name,value in [('source-review.json',review),('capture-audit.json',audit)]:
 with (DIRECTORY/name).open('x') as f:json.dump(value,f,ensure_ascii=False,indent=2);f.write('\n')
print(json.dumps({'status':'PASS','rows':len(rows),'inventoryMatched':sum(r['inventoryMatched'] for r in rows),'preserved':len(preserved),'minSourceGapSeconds':min(gaps)},ensure_ascii=False))
