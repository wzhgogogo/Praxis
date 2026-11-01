"""Independent literal check of the captured local-composition output and file scope."""
from pathlib import Path
from urllib.parse import urlsplit,parse_qsl
import hashlib,json,subprocess
R=Path('.eval-artifacts/phase3b/b1-tablecheck-composition-20261101')
load=lambda p:json.loads(Path(p).read_text())
git=lambda *args:subprocess.check_output(['git',*args])
for f in load(R/'a-imports.json')['files']:assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
for f in load(R/'final-freeze.json')['files']:assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
protected=['src/integrations/tabelog/tabelog-browser-availability.ts','src/integrations/tabelog/tabelog-query-controls.ts','src/integrations/tabelog/tabelog-vacancy-response.ts','src/integrations/tabelog/tabelog-booking-handoff-reader.ts','src/integrations/tablecheck/tablecheck-page-parser.ts','src/integrations/tablecheck/tablecheck-browser-availability.ts','src/domains/restaurant/booking-handoff.ts','src/application/restaurant-booking-handoff.ts']
base='fceecaad717eea21f7642f1b0b1cf35b0aea218e'
for p in protected:assert Path(p).read_bytes()==git('show',base+':'+p),p
allowed={f['path'] for f in load(R/'a-imports.json')['files']}|{'src/integrations/tablecheck/tablecheck-booking-handoff-reader.ts','src/integrations/tablecheck/tablecheck-booking-handoff-reader.test.ts','src/integrations/restaurant-search/live-read-assembly.ts'}
changed=set(git('diff','--name-only',base,'--','src','scripts').decode().splitlines());assert changed==allowed,changed
red=load(R/'red/preflight.json');green=load(R/'green-composition/preflight.json')
assert red['status']=='FAILED' and red['failure']['message'].startswith('Initial ordinary source cache must produce B1')
assert green['status']=='PASS' and green['mode']=='OFFLINE_LOCAL_CONSTRUCTED_SOURCES'
assert green['realModelCalls']==green['publicGET']==0
normal=lambda r:[c for c in r['sourceCalls'] if c['turn']=='INITIAL']
assert normal(red)==normal(green) and len(normal(green))==5
for phase in ['initial','after']:
 view=green[phase];rest=view['restaurant'];cid=rest['presentedCandidateIds'][0]
 assert view['case']['phase']=='PRESENT_RESULTS'
 if phase=='after':assert rest['selectedCandidateId']==cid
 handoffs=rest['bookingHandoffs'];assert len(handoffs)==1;h=handoffs[0]
 assert h['candidateId']==cid and h['provider']=='TABLECHECK'
 url=urlsplit(h['url']);assert url.scheme=='https' and url.netloc=='www.tablecheck.com' and url.path=='/en/shops/g6-development-sushi/reserve' and not url.fragment
 assert sorted(parse_qsl(url.query))==sorted([('start_date','2026-11-11'),('start_time','19:00'),('num_people','2')])
 assert 'filled in' in h['continueLabel'] and h['verificationHint']=='Check date and guests'
 assert h['sourceSelection']=='UNKNOWN' and h['linkCarries']==['DATE','TIME','PARTY_SIZE']
 assert not any(x in h['continueLabel'].lower() for x in ['selected','booked'])
 offer=next(o for o in rest['availability'][cid] if o['id']==h['offerId'])
 assert offer['dateTime']=='2026-11-11T19:00:00+09:00' and offer['partySize']==2 and offer['source']=='TABLECHECK'
 check=rest['availabilityChecks'][cid];assert check['status']=='AVAILABLE' and check['sourceProvider']=='TABLECHECK'
 evidence=[e for e in rest['readEvidence'] if e['evidenceId'] in check['evidenceIds'] and e['kind']=='AVAILABILITY' and e['provider']=='TABLECHECK']
 assert any(e['candidateId']==cid and e['sourceEntityId'].removeprefix('shops/')=='g6-development-sushi' and e['entityMatch']['confidence']=='HIGH' and 'EXACT_PHONE' in e['entityMatch']['matchedBy'] and e['claims']['date']=='2026-11-11' and e['claims']['partySize']==2 and '19:00' in e['claims']['visibleSlots'] for e in evidence)
for call in green['sourceCalls']:
 if call['kind']=='BROWSER_NAVIGATE':assert not any(p in urlsplit(call['url']).path for p in ['review','confirm','payment','checkout','account','form_course','yoyaku'])
print(json.dumps({'status':'PASS','AInputsUnchanged':5,'protectedFilesUnchanged':len(protected),'actualAssemblyStages':['initial','after'],'handoffsEach':1,'EXACT_PHONE':True,'sameInitialSourceIO':5,'realExternalCalls':0,'mode':'LOCAL_CONSTRUCTION_NOT_WEBSITE_REPLAY'}))
