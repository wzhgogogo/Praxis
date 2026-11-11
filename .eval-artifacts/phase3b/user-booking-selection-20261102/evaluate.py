from pathlib import Path
import base64,gzip,hashlib,json,re
r=Path(__file__).parent
raw=(r/'gates/test.log').read_text()
out=r/'final-observations';out.mkdir(exist_ok=True)
frames={}
for m in re.finditer(r'USER_SELECTION_RAW ([A-Za-z0-9+/=]+)',raw):
    b=base64.b64decode(m[1]);a=json.loads(b);assert a['label'] not in frames
    frames[a['label']]=a;(out/(a['label']+'.json.gz')).write_bytes(gzip.compress(b,mtime=0))
expected={'P1-0-8','P2-0-10','NAMED','DUPLICATE_AGENT_CHOICE','OPEN_ENDED','NON_BOOKING','AMBIGUOUS','PARTIAL','QUESTION_AND_DEPARTURE'}
assert set(frames)==expected,set(frames)
cid='praxis:restaurant:bd287442c716ac7439273cc9'
url='https://tabelog.com/en/booking/form_course/new?visit_time=1900&member=2&rcd=13123456&visit_date=20261111'
quote='Cancellations on the reservation date are charged at 100% of the course price.'
card='A credit card is required to guarantee this reservation.'
rows=[]
for label,a in frames.items():
    state=a['execution']['finalSnapshot']['domainState'];events=a['execution']['events'];traj=a['execution']['trajectories'];v=a['view']['restaurant']
    selections=[e for e in events if e['event']['type']=='CANDIDATE_SELECTED']
    assert not any(e['event']['type'] in {'BOOKING_PROPOSED','AUTHORIZE','POLICY_APPROVED','COMMIT_SUCCEEDED','COMMIT_UNCERTAIN'} for e in events)
    assert all(not re.search(r'form_course|yoyaku|payment|confirm|checkout|account',c['url']) for c in a['sourceCalls'])
    assert a['realCalls']==0 and 'goalBasis' not in json.dumps(state)
    positive=label in {'P1-0-8','P2-0-10','NAMED','DUPLICATE_AGENT_CHOICE'}
    if positive:
        assert v['selectedCandidateId']==cid and len(selections)==1,label
        e=selections[0];assert e['trace']['actor']=='USER'
        source=next(x for x in events if x['id']==e['trace']['causationId'])
        assert source['trace']['actor']=='USER' and source['event']['type']=='SEMANTIC_PROPOSAL_COMPILED'
        assert source['event']['patch']['target']['selectionScope']=='SPECIFIC_OUTLET'
        assert source['event']['patch']['target']['query']=='G6 Development Sushi'
        t=next(x for x in traj if x.get('observation',{}).get('type')=='CANDIDATE_SELECTED' and 'USER_MESSAGE' in x['observation']['detail'])
        assert not t.get('agentAction') and not t.get('modelAttempt')
        assert {source['id'],e['id']} <= set(t['causalRefs']['eventIds'])
        h=v['bookingHandoffs'][0];assert h['candidateId']==cid and h['url']==url
        assert [x['label'] for x in h['terms']]==['Same-day cancellations cost 100% of the course price.','Card required']
        assert [c['text'] for x in h['terms'] for c in x['citations']]==[quote,card]
        for term in h['terms']:
            for c in term['citations']:
                assert any(p['page']['url']==c['url'] and p['observedAt']==c['readAt'] and c['text'] in p['page']['text'] for p in a['sourcePages'])
        booking_turn='INITIAL' if label=='NAMED' else 'ADD_PARTY' if label=='P2-0-10' else 'SELECTED'
        calls=[x for x in a['requests'] if x['turn']==booking_turn and x['request']['purpose']=='restaurant_page_question']
        assert len(calls)==2
        if label in {'P1-0-8','P2-0-10'}:
            original=json.loads(Path('src/application/fixtures/user-booking-selection/'+label+'.json').read_text())['response']
            assert any(x['turn']==booking_turn and x['response']==original for x in a['requests'])
        if label=='P2-0-10':
            # The choice originates in the booking message, not the party-only message.
            later=[x for x in events[events.index(source)+1:] if x['event']['type']=='SEMANTIC_PROPOSAL_COMPILED']
            assert later and 'partySize' in later[-1]['event']['patch'] and 'target' not in later[-1]['event']['patch']
            assert any(x['event']['type']=='AVAILABILITY_CHECKED' for x in events[events.index(source)+1:])
        if label=='DUPLICATE_AGENT_CHOICE':
            t=next(x for x in traj if x.get('agentAction',{}).get('type')=='SELECT_CANDIDATE')
            assert t['stepOutcome']=='EXECUTED' and t['stateVersionBefore']==t['stateVersionAfter']
    else:
        assert not v.get('selectedCandidateId') and not selections,label
        if label!='QUESTION_AND_DEPARTURE':assert v['bookingHandoffs'][0]['terms']==[]
        if label=='AMBIGUOUS':assert len(state['candidates'])==2
    rows.append({'label':label,'status':'PASS','selected':bool(v.get('selectedCandidateId')),'selectionEvents':len(selections),
                 'terms':len(v['bookingHandoffs'][0]['terms']),'savedModelReplay':label if label in {'P1-0-8','P2-0-10'} else None})
result={'status':'PASS','mode':'OFFLINE_COMPOSITION_SAVED_MODEL_OUTPUT_REPLAY','cases':sorted(rows,key=lambda x:x['label']),
        'evaluator':'Independent literal event/source/visible-result audit; never calls production selection or eligibility functions.',
        'scope':'Local mechanism regression; no new Live, Google, model or website quality claim.','realCalls':0}
(r/'independent-evaluation.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'status':'PASS','cases':len(rows),'realCalls':0}))
