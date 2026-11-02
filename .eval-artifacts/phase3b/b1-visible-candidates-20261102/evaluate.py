from pathlib import Path
import base64,collections,json,sys

r=Path(__file__).parent
fixture=json.loads(Path('src/eval/restaurant/agent-loop/cases/g6-development/source.json').read_text())
expected_url=fixture['vacancy']['body']['selection'][0]['url']

def frames(path):
    found={}
    for line in path.read_text().splitlines():
        if 'B1_VISIBILITY_RAW ' not in line:continue
        item=json.loads(base64.b64decode(line.split('B1_VISIBILITY_RAW ',1)[1]))
        assert item['label'] not in found
        found[item['label']]=item
    assert set(found)=={'HARD_UNKNOWN','HIDDEN_HTTP','SEARCHING_READY','PRESENTED','SELECTED_PRESENTED','BOUNDARY_ONLY'},found.keys()
    return found

red=frames(r/'red/test.log')
target=sys.argv[1] if len(sys.argv)>1 else 'gates/test.log'
green=frames(r/target)
rows=[]
for label,item in green.items():
    view=item['view'];restaurant=view['restaurant']
    assert item['realCalls']==0
    assert all(q['response']['provider']=='FIXTURE' for q in item['requests'])
    assert len(item['prepared'])==1
    assert item['prepared'][0]['source']['url']==expected_url
    for call in item['sourceCalls']:
        assert call['kind'] in {'GOOGLE_FIXTURE','BROWSER_NAVIGATE'}
        if call['kind']=='BROWSER_NAVIGATE':
            assert call['url']==fixture['pageUrl'],call
    assert not any(e['event']['type']=='BOOKING_PROPOSED' for e in item['execution']['events'])
    if label!='BOUNDARY_ONLY':
        for handoff in restaurant.get('bookingHandoffs',[]):
            # Independent membership oracle: deliberately no production helper import.
            allowed=restaurant.get('presentedCandidateIds',[]) if view['case']['phase']=='PRESENT_RESULTS' else restaurant['readyCandidateIds']
            assert handoff['candidateId'] in allowed
            assert handoff['url']==expected_url
    counts=dict(collections.Counter(q['request']['purpose'] for q in item['requests']))
    rows.append({'label':label,'phase':view['case']['phase'],'prepared':len(item['prepared']),
                 'outwardHandoffs':len(restaurant.get('bookingHandoffs',[])),'fixtureModelCallsByPurpose':counts,
                 'secondsToLastObservation':item['timeline'][-1]['elapsedMs']/1000})

for stage,items in [('red',red),('green',green)]:
    for label in ['HARD_UNKNOWN','HIDDEN_HTTP']:
        item=items[label];v=item['view'];rest=v['restaurant']
        assert v['case']['phase']=='NO_VERIFIED_RESULT' and rest['readyCandidateIds']==[] and not rest.get('presentedCandidateIds')
        assert any(c['text']=='kushikatsu' and c['strength']=='HARD' for c in rest['intentDraft']['criteria'])
        # Independent source oracle: the saved source pages never state the requested cuisine.
        assert item['sourcePages'] and all('kushikatsu' not in p['page']['text'].lower() and 'kushikatsu' not in p['page']['html'].lower() for p in item['sourcePages'])
        source=item['prepared'][0]['source'];assert source['url']==expected_url
        assert rest['availabilityChecks'][source['candidateId']]['status']=='AVAILABLE'
        assert len(rest['bookingHandoffs'])==(1 if stage=='red' else 0)
    departure=items['HIDDEN_HTTP']['detail']['departure']
    assert departure['status']==(201 if stage=='red' else 400)
    if stage=='green':assert departure['body'].get('url') is None and departure['body']['error']=='No current verified source handoff'
    else:assert departure['body']['url']==expected_url
    boundary=items['BOUNDARY_ONLY']['detail']
    assert boundary['modelCallsAfter']-boundary['modelCallsBefore']==(2 if stage=='red' else 0)
    if stage=='green':assert all(v['restaurant']['bookingHandoffs']==[] for v in boundary['results'])

for label in ['SEARCHING_READY','PRESENTED','SELECTED_PRESENTED']:
    a=red[label]['view'];b=green[label]['view']
    assert a['restaurant']['bookingHandoffs']==b['restaurant']['bookingHandoffs']
    h=b['restaurant']['bookingHandoffs'][0];assert h['url']==expected_url
    if label=='SEARCHING_READY':assert b['case']['phase']=='SEARCHING' and not b['restaurant'].get('presentedCandidateIds')
    else:assert b['case']['phase']=='PRESENT_RESULTS' and h['candidateId'] in b['restaurant']['presentedCandidateIds']
    if label=='SELECTED_PRESENTED':
        assert b['restaurant']['selectedCandidateId']==h['candidateId']
        assert [t['label'] for t in h['terms']]==['Same-day cancellations cost 100% of the course price.','Card required']
        quotes=[c for t in h['terms'] for c in t['citations']]
        assert all(c['url']==fixture['pageUrl'] and c['readAt']==fixture['referenceTime'] for c in quotes)
        pages=green[label]['sourcePages']
        assert all(any(c['text'] in p['page']['text'] for p in pages) for c in quotes)
        assert sum(q['request']['purpose']=='restaurant_page_question' for q in green[label]['requests'])==2

result={'status':'PASS','mode':'OFFLINE_WHOLE_COMPOSITION_WITH_FIXED_EXTERNAL_IO','frames':6,
        'wholeCompositionFrames':5,'boundaryOnlyFrames':1,'sourceOracle':'literal fixture vacancy URL, original page text and HTTP reply',
        'redHiddenHTTP':201,'greenHiddenHTTP':400,'keptPreparedCache':True,'positiveHandoffsByteEqual':True,
        'realCalls':0,'newLiveCapabilityRate':'NOT_EVALUATED','rows':rows}
print(json.dumps(result,ensure_ascii=False,indent=2))
