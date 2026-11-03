from pathlib import Path
import base64,collections,hashlib,json,re,sys
r=Path(__file__).parent
log=r/(sys.argv[1] if len(sys.argv)>1 else 'gates/test.log')
frames={}
for line in log.read_text().splitlines():
    if 'NAMED_SOURCE_RAW ' not in line:continue
    a=json.loads(base64.b64decode(line.split('NAMED_SOURCE_RAW ',1)[1]));assert a['label'] not in frames
    frames[a['label']]=a
expected={'D1_D3','SOURCE_FULL_NAME','CONTAINMENT_ONLY','TWO_CONTAINED','WRONG_LOCALITY','IDENTITY_CONFLICT','TABLECHECK_SOURCE_NAME'}
assert set(frames)==expected,(set(frames),expected)
literal=Path('src/application/fixtures/named-outlet-without-area/d3-semantic.original.json').read_bytes()
place=json.loads(Path('src/application/fixtures/named-outlet-without-area/d1-google-place.json').read_text())
source=json.loads(Path('src/eval/restaurant/agent-loop/cases/g6-development/source.json').read_text())
rows=[]
for label,a in frames.items():
    v=a['view'];restaurant=v['restaurant'];state=a['execution']['finalSnapshot']['domainState']
    assert state['schemaVersion']=='25' and a['execution']['finalSnapshot']['definitionVersion']=='23'
    assert a['realCalls']==0 and all(q['response']['provider']=='FIXTURE' for q in a['requests'])
    assert not any(e['event']['type']=='BOOKING_PROPOSED' for e in a['execution']['events'])
    assert 'area' not in restaurant['intentDraft'] and all('distanceObservation' not in c for c in restaurant['candidates'])
    if label!='WRONG_LOCALITY':
        assert next(q for q in a['requests'] if q['request']['purpose']=='restaurant_semantic_interpret')['response']['outputText'].encode()==literal
    for call in a['sourceCalls']:
        assert call['kind'] in {'GOOGLE_FIXTURE','BROWSER_NAVIGATE'}
        if call['kind']=='BROWSER_NAVIGATE':assert not re.search(r'/(?:booking|yoyaku|account|payment|confirm)(?:/|$)',call['url'])
    good=label in {'D1_D3','SOURCE_FULL_NAME','CONTAINMENT_ONLY','TABLECHECK_SOURCE_NAME'}
    if good:
        assert v['case']['phase']=='PRESENT_RESULTS'
        assert len(restaurant['presentedCandidateIds'])==len(restaurant['readyCandidateIds'])==1
        assert restaurant['selectedCandidateId']==restaurant['presentedCandidateIds'][0]
        assert len(restaurant['bookingHandoffs'])==1
        handoff=restaurant['bookingHandoffs'][0];assert len(handoff['terms'])==2
        provider='TABLECHECK' if label=='TABLECHECK_SOURCE_NAME' else 'TABELOG'
        assert handoff['provider']==provider
        entity=[e for e in restaurant['readEvidence'] if e['kind']=='ENTITY_MATCH' and e['provider']==provider and e['entityMatch']['confidence']=='HIGH']
        assert entity
        for e in entity:
            if not e['claims'].get('observedOutletName'):continue
            assert any(p['page']['url']==e['sourceUrl'] and e['claims']['observedOutletName'] in p['page']['text'] for p in a['sourcePages'])
        assert any('03-5249-4011' in p['page']['text'] for p in a['sourcePages'])
        if provider=='TABELOG':assert handoff['url']==source['vacancy']['body']['selection'][0]['url']
        for term in handoff['terms']:
            for citation in term['citations']:assert any(citation['text'] in p['page']['text'] and citation['url']==p['page']['url'] for p in a['sourcePages'])
    else:
        assert v['case']['phase']=='NEEDS_INPUT' and not restaurant.get('selectedCandidateId')
        assert not restaurant.get('presentedCandidateIds') and not restaurant['bookingHandoffs']
    if label=='D1_D3':
        wire=a['googleWires'][0];p=wire['response']['places'][0]
        for key in place:assert p[key]==place[key],key
        assert p['displayName']['text']=='Dengana Akabane'
        assert wire['body']['textQuery']=='Kushi Katsu Dengana Akabane ten Tokyo'
        assert 'locationRestriction' not in wire['body'] and 'locationBias' not in wire['body']
    if label=='TWO_CONTAINED':assert len(restaurant['candidates'])==2 and not restaurant['availabilityChecks'] and not any(c['kind']=='BROWSER_NAVIGATE' for c in a['sourceCalls'])
    if label=='WRONG_LOCALITY':assert restaurant['intentDraft']['target']['query'].endswith(' Ginza') and all('ginza' not in c['restaurant']['address'].lower() for c in restaurant['candidates'])
    if label=='IDENTITY_CONFLICT':
        assert any('03-5249-4999' in p['page']['text'] and '2-99-99' in p['page']['text'] for p in a['sourcePages'])
        assert not any(e['provider'] in {'TABELOG','TABLECHECK'} and e['kind']=='ENTITY_MATCH' and e['entityMatch']['confidence']=='HIGH' for e in restaurant['readEvidence'])
    rows.append({'label':label,'phase':v['case']['phase'],'handoffs':len(restaurant['bookingHandoffs']),'fixtureModels':dict(collections.Counter(q['request']['purpose'] for q in a['requests'])),'observedLifecycleSeconds':a['timeline'][-1]['elapsedMs']/1000})
print(json.dumps({'status':'PASS','mode':'OFFLINE_CONSTRUCTED_SOURCE_WITH_REAL_D1_FIELDS_AND_D3_LITERAL_SEMANTICS','frames':len(frames),'oracle':'Literal captured Google fields, original semantic bytes, fixed source phones/name/slots/citations; no production identity/name/scoring helpers imported','realCalls':0,'Live':'NOT_EVALUATED','rows':rows},ensure_ascii=False,indent=2))
