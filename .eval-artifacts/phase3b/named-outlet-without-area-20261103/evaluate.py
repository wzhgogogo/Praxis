from pathlib import Path
import base64,collections,hashlib,json,re,sys
r=Path(__file__).parent
log=r/(sys.argv[1] if len(sys.argv)>1 else 'runtime-contract-check/test.log')
frames={}
for line in log.read_text().splitlines():
    if 'NAMED_AREA_RAW ' not in line:continue
    a=json.loads(base64.b64decode(line.split('NAMED_AREA_RAW ',1)[1]));assert a['label'] not in frames
    frames[a['label']]=a
expected={'D3_UNIQUE','USER_AREA','AMBIGUOUS','OPEN_NO_AREA','MISSING','UNRELATED','UNRELATED_USER_AREA','OUTSIDE_TOKYO','OTHER_BRANCH'}
assert set(frames)==expected,frames.keys()
literal=(r/'d3-semantic-output.original.json').read_text()
assert literal==Path('src/application/fixtures/named-outlet-without-area/d3-semantic.original.json').read_text()
assert json.loads((r/'d3-decision-1.original.jsonl').read_text())['outputText']==literal
target='Kushi Katsu Dengana Akabane ten'
address='東京都北区赤羽1-15-1 新仲ビル1F';phone='03-5249-4011'
source=json.loads(Path('src/eval/restaurant/agent-loop/cases/g6-development/source.json').read_text())
url=source['vacancy']['body']['selection'][0]['url']
rows=[]
for label,a in frames.items():
    v=a['view'];state=a['execution']['finalSnapshot']['domainState']
    assert a['realCalls']==0 and state['schemaVersion']=='25'
    assert a['execution']['finalSnapshot']['definitionVersion']=='23'
    assert all(q['response']['provider']=='FIXTURE' for q in a['requests'])
    for q in a['requests']:
        if q['turn']=='INITIAL' and q['request']['purpose']=='restaurant_semantic_interpret' and label!='OPEN_NO_AREA':assert q['response']['outputText']==literal
    for call in a['sourceCalls']:
        assert call['kind'] in {'GOOGLE_FIXTURE','BROWSER_NAVIGATE'}
        if call['kind']=='BROWSER_NAVIGATE':assert not re.search(r'/(?:booking|yoyaku|account|payment|confirm)(?:/|$)',call['url'])
    assert not any(e['event']['type']=='BOOKING_PROPOSED' for e in a['execution']['events'])
    rows.append({'label':label,'phase':v['case']['phase'],'candidates':len(v['restaurant']['candidates']),
      'handoffs':len(v['restaurant'].get('bookingHandoffs',[])),
      'fixtureModelCalls':dict(collections.Counter(q['request']['purpose'] for q in a['requests'])),
      'observedLifecycleSeconds':a['timeline'][-1]['elapsedMs']/1000})

a=frames['D3_UNIQUE'];v=a['view'];restaurant=v['restaurant']
assert v['case']['phase']=='PRESENT_RESULTS' and 'area' not in restaurant['intentDraft']
assert 'area' not in a['execution']['finalSnapshot']['domainState']['intent']
assert len(restaurant['presentedCandidateIds'])==len(restaurant['readyCandidateIds'])==1
assert len(restaurant['bookingHandoffs'])==1 and restaurant['bookingHandoffs'][0]['url']==url
assert restaurant['bookingHandoffs'][0]['terms'] and len(restaurant['bookingHandoffs'][0]['terms'])==2
c=restaurant['candidates'][0];assert c['restaurant']['outletName']==target and c['restaurant']['address']==address
assert 'distanceObservation' not in c and not restaurant.get('searchLocation')
wire=a['googleWires'][0];assert wire['body']['textQuery']==target+' Tokyo'
assert not any(k in wire['body'] for k in ['locationRestriction','locationBias'])
google=wire['response']['places'][0]
assert google['displayName']['text']==target and google['formattedAddress']==address and google['nationalPhoneNumber']==phone
jsonld=[]
for p in a['sourcePages']:
    for text in re.findall(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',p['page']['html'],re.S):jsonld.append(json.loads(text))
assert any(p.get('name')==target and p.get('address')==address and p.get('telephone')==phone for p in jsonld)
assert any(response['body']==source['vacancy']['body'] for p in a['sourcePages'] for response in p['page'].get('responses',[]))
for term in restaurant['bookingHandoffs'][0]['terms']:
    for citation in term['citations']:assert any(citation['text'] in p['page']['text'] and citation['url']==p['page']['url'] for p in a['sourcePages'])

for label in ['AMBIGUOUS','OTHER_BRANCH']:
    a=frames[label];v=a['view'];assert v['case']['phase']=='NEEDS_INPUT'
    assert not v['restaurant'].get('selectedCandidateId') and not v['restaurant']['availabilityChecks'] and not v['restaurant']['bookingHandoffs']
    assert not any(c['kind']=='BROWSER_NAVIGATE' for c in a['sourceCalls'])
    if label=='AMBIGUOUS':
        assert len(a['googleWires'][0]['response']['places'])==2
        assert any(q['request']['purpose']=='restaurant_agent_decide' and json.loads(q['response']['outputText'])['type']=='SELECT_CANDIDATE' for q in a['requests'])
        assert not any(e['event']['type']=='CANDIDATE_SELECTED' for e in a['execution']['events'])

for label in ['MISSING','UNRELATED','UNRELATED_USER_AREA','OUTSIDE_TOKYO']:
    a=frames[label];v=a['view'];assert v['case']['phase']=='NO_VERIFIED_RESULT'
    assert not v['restaurant']['candidates'] and not v['restaurant']['bookingHandoffs']
    assert not any(c['kind']=='BROWSER_NAVIGATE' for c in a['sourceCalls'])
assert frames['OUTSIDE_TOKYO']['googleWires'][0]['response']['places'][0]['formattedAddress']=='1-2-3 Osaka Japan'
assert frames['OPEN_NO_AREA']['view']['case']['phase']=='NEEDS_INPUT' and frames['OPEN_NO_AREA']['sourceCalls']==[]
later=frames['USER_AREA']['view']['restaurant'];assert later['intentDraft']['area']['query']=='Akabane'
assert later['bookingHandoffs'][0]['url']==url and not any(e['claims'].get('locationBasis')=='NAMED_OUTLET_RESOLUTION' for e in later['readEvidence'])
print(json.dumps({'status':'PASS','mode':'OFFLINE_CONSTRUCTED_SOURCE_WITH_LITERAL_D3_SEMANTIC_OUTPUT','observations':len(frames),
 'literalD3OutputSha256':hashlib.sha256(literal.encode()).hexdigest(),'oracle':'Literal D3 bytes, observed fixed Google/body/page identity and slot; no production name/identity/eligibility helper imports',
 'realCalls':0,'liveCapability':'NOT_EVALUATED','rows':rows},ensure_ascii=False,indent=2))
