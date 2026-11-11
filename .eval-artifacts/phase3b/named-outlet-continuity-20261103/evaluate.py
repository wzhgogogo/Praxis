from pathlib import Path
import base64,collections,json,re,sys,urllib.parse
r=Path(__file__).parent
log=Path(sys.argv[1]) if len(sys.argv)>1 else r/'gates/test.log'
frames={};guard=[];native=[];visibility=[]
for line in log.read_text().splitlines():
 for prefix,dest in [('NAMED_CONTINUITY_RAW ',frames),('NAMED_GUARD_RAW ',guard),('NAMED_NATIVE_REFERENCE_RAW ',native),('B1_VISIBILITY_RAW ',visibility)]:
  if prefix not in line:continue
  a=json.loads(base64.b64decode(line.split(prefix,1)[1]));
  if isinstance(dest,dict):assert a['label'] not in dest;dest[a['label']]=a
  else:dest.append(a)
expected={'EXACT_INITIAL','EXACT_BOOK','EXACT_PARTY','RENAMED_INITIAL','RENAMED_BOOK','RENAMED_PARTY','ALLOW_OTHERS_BEFORE','ALLOW_OTHERS_AFTER','MISSING_INITIAL','MISSING_PARTY','NO_SLOT_INITIAL','NO_SLOT_PARTY','FRESH_AMBIGUOUS'}
assert set(frames)==expected,(set(frames),expected)
inputs=json.loads(Path('src/application/fixtures/named-outlet-continuity/inputs.json').read_text());place='ChIJwUnGVR2TGGARNAEaZNumYhQ';oldBad={o['id'] for o in inputs['thirdOriginalRestaurants']}
rows=[]
for label,a in frames.items():
 v=a['view'];rest=v['restaurant'];state=a['execution']['finalSnapshot']['domainState'];events=a['execution']['events']
 assert a['realCalls']==0 and state['schemaVersion']=='25' and a['execution']['finalSnapshot']['definitionVersion']=='23'
 assert not {'namedOutletReference','selectedOutletReference','reference'}&set(state)
 assert all(q['response']['provider']=='FIXTURE' for q in a['requests'])
 assert not any(e['event']['type'] in {'BOOKING_PROPOSED','AUTHORIZE','COMMIT_SUCCEEDED'} for e in events)
 for e in events:
  if e['event']['type']=='SEARCH_COMPLETED':assert not {'reference','userSelectedOutlet','namedOutletReference'}&set(e['event']['request'])
 for c in a['sourceCalls']:
  assert c['kind'] in {'GOOGLE_FIXTURE','BROWSER_NAVIGATE'}
  if c['kind']=='BROWSER_NAVIGATE':assert not re.search(r'/(?:booking|yoyaku|payment|account|confirm)(?:/|$)',c['url'])
 if label.endswith('_INITIAL'):
  assert v['case']['phase']=='PRESENT_RESULTS' and rest['presentedCandidateIds']==inputs['originalPresentedIds']
 if label.endswith('_BOOK'):
  assert v['case']['phase']=='NEEDS_INPUT' and rest['intentDraft']['target']['query']=='Ito Akabane' and not rest.get('bookingHandoffs')
 if rest['intentDraft']['target']['selectionScope']=='SPECIFIC_OUTLET':
  for id in rest.get('presentedCandidateIds',[]):
   c=next(c for c in rest['candidates'] if c['restaurant']['id']==id);assert c['restaurant']['sourceIds'].get('googlePlaces')==place and id not in oldBad
 if label in {'EXACT_PARTY','RENAMED_PARTY'}:
  assert v['case']['phase']=='PRESENT_RESULTS' and len(rest['presentedCandidateIds'])==1
  assert rest['selectedCandidateId']==rest['presentedCandidateIds'][0] and len(rest['bookingHandoffs'])==1
  choice=[e for e in events if e['event']['type']=='CANDIDATE_SELECTED'];assert choice and choice[-1]['trace']['actor']=='USER'
  anchor=next(e for e in events if e['event']['type']=='SEMANTIC_PROPOSAL_COMPILED' and e['event'].get('userBookingSelection',{}).get('candidateId')==inputs['originalPresentedIds'][0])
  assert choice[-1]['trace']['causationId']==anchor['id']
  claims=[e['claims'] for e in rest['readEvidence'] if e['kind']=='DISCOVERY' and e.get('candidateId')==rest['selectedCandidateId']]
  assert any(c.get('selectedIdentity:googlePlaces')==place and c.get('userSelectionEventId')==anchor['id'] for c in claims)
  wires=[w for w in a['googleWires'] if w['turn']=='ADD_PARTY'];assert sum(w['method']=='GET' and w['url'].endswith('/'+place) for w in wires)==1
  assert not any(w['body'] and ('includedTypes' in w['body'] or 'Ito' in w['body'].get('textQuery','')) for w in wires)
  semantic=[q['response']['outputText'] for q in a['requests'] if q['request']['purpose']=='restaurant_semantic_interpret']
  for text,n in zip(semantic,[1,9,12]):assert text==Path(f'src/application/fixtures/named-outlet-continuity/decision-{n:02d}.original.json').read_text()
  bad=Path('src/application/fixtures/named-outlet-continuity/decision-23.original.json').read_text();assert any(q['response']['outputText']==bad for q in a['requests'])
  check=rest['availabilityChecks'][rest['selectedCandidateId']];assert check['status']=='AVAILABLE'
  assert any('03-3598-2992' in p['page']['text'] and p['page']['url'].startswith('https://tabelog.com/') for p in a['sourcePages'])
  for h in rest['bookingHandoffs']:
   parsed=urllib.parse.urlparse(h['url']);q=urllib.parse.parse_qs(parsed.query)
   assert parsed.netloc=='tabelog.com' and parsed.path=='/en/booking/form_course/new'
   assert q['visit_date']==['20261111'] and q['visit_time']==['1900'] and q['member']==['2']
   assert any(h['url'] in json.dumps(response['body'],ensure_ascii=False) for p in a['sourcePages'] for response in p['page'].get('responses',[]))
   assert len(h['terms'])==2
   for term in h['terms']:
    for cite in term['citations']:assert any(cite['text'] in p['page']['text'] and cite['url']==p['page']['url'] for p in a['sourcePages'])
 if label in {'MISSING_PARTY','NO_SLOT_PARTY','ALLOW_OTHERS_BEFORE'}:
  assert v['case']['phase']=='NO_VERIFIED_RESULT' and not rest.get('presentedCandidateIds') and not rest['bookingHandoffs']
  msg=v['conversation']['messages'][-1]['content'];assert all(t in msg for t in ['Ito Akabane','2026-11-11','19:00','2 guests'])
 if label=='FRESH_AMBIGUOUS':assert v['case']['phase']=='NEEDS_INPUT' and len(rest['candidates'])==2 and not rest['bookingHandoffs'] and not rest['availabilityChecks']
 if label=='ALLOW_OTHERS_AFTER':
  assert v['case']['phase']=='PRESENT_RESULTS' and rest['intentDraft']['target']['selectionScope']=='OPEN_ENDED'
  assert rest['intentDraft']['target']['requestedResultCount']==2 and len(rest['presentedCandidateIds'])==2
  assert any(m['role']=='USER' and m['content']=='Please show me two other nearby restaurants for the same date and guests.' for m in v['conversation']['messages'])
  assert all(next(c for c in rest['candidates'] if c['restaurant']['id']==id)['restaurant']['sourceIds']['googlePlaces']!=place for id in rest['presentedCandidateIds'])
 rows.append({'label':label,'phase':v['case']['phase'],'presented':len(rest.get('presentedCandidateIds',[])),'handoffs':len(rest['bookingHandoffs']),'fixtureModelsByPurpose':dict(collections.Counter(q['request']['purpose'] for q in a['requests']))})
assert len(guard)==len(native)==1
assert len(guard[0]['outcomes'])==5 and all(not x['resolved'] and x['id'] in oldBad for x in guard[0]['outcomes'])
n=native[0];assert n['sourceCalls']==[] and all(e['kind']=='DISCOVERY' for e in n['read']['evidence']);assert n['read']['evidence'][0]['observedAt']==n['reference']['discovery'][0]['observedAt'];assert n['moved']['evidence'][0]['claims']['areaMatch'] is False and 'distanceMeters' not in n['moved']['evidence'][0]['claims']
wrong=[v for v in visibility if v['label']=='WRONG_NAMED_TARGET'];assert len(wrong)==1
w=wrong[0];assert len(w['prepared'])==1 and not w['detail']['projected']['restaurant']['bookingHandoffs'] and w['detail']['modelCallsBefore']==w['detail']['modelCallsAfter']
assert json.loads((r/'adjudication.json').read_text())['count']==1
print(json.dumps({'status':'PASS','mode':'OFFLINE_REAL_D6_RESPONSE_BYTES_WITH_CONSTRUCTED_SOURCE_IO_AND_EXPLICIT_CORRECTIVE_FIXTURE_ACTIONS','e2eFrames':len(frames),'guardControls':len(guard),'nativeSeedComponents':len(native),'projectionControls':len(wrong),'historicalD6LiveS0':{'count':1,'unit':'PRESENTATION','stores':5,'unchanged':True},'newLiveRate':'NOT_EVALUATED','realCalls':0,'rows':rows},ensure_ascii=False,indent=2))
