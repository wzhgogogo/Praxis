"""Independent frozen-I/O oracle. No production imports, predicates or labels."""
from pathlib import Path
import base64,collections,hashlib,html,json,re,sys,unicodedata
from urllib.parse import urlparse,parse_qs

r=Path(__file__).parent
sha=lambda b:hashlib.sha256(b).hexdigest()
key=lambda s:' '.join(unicodedata.normalize('NFKC',s).lower().split())
def require(ok,message):
    if not ok:raise AssertionError(message)
def frames(path):
    output=[]
    for line in path.read_text().splitlines():
        if '_RAW ' in line:
            output.append(json.loads(base64.b64decode(line.split('_RAW ',1)[1])))
    return output
def question_calls(d,turn=None):
    return [x for x in d['requests'] if x['request']['purpose']=='restaurant_page_question' and (turn is None or x['turn']==turn)]
def events(d,kind):return [x['event'] for x in d['execution']['events'] if x['event']['type']==kind]
def reasons(d):return collections.Counter(x['reason'] for x in d['execution']['bookingTermsDiagnostics'])
def terms(d):return [t for h in d['view']['restaurant'].get('bookingHandoffs',[]) for t in h['terms']]
def pages(d,url):return [x['page'] for x in d['sourcePages'] if x['page']['url']==url]
def supported_handoffs(d):
    view=d['view'];v=view['restaurant'];state=d['execution']['finalSnapshot']['domainState']
    ids=v.get('presentedCandidateIds',[]) if view['case']['phase']=='PRESENT_RESULTS' else v['readyCandidateIds']
    for handoff in v.get('bookingHandoffs',[]):
        require(handoff['candidateId'] in ids,'Hidden handoff')
        u=urlparse(handoff['url']);q=parse_qs(u.query)
        require(u.scheme=='https' and u.hostname in ['tabelog.com','www.tablecheck.com'],'Handoff host')
        if handoff['provider']=='TABELOG':
            require(u.path=='/en/booking/form_course/new','Tabelog path')
            request=state['intent'];require(q['member']==[str(request['partySize'])] and q['visit_date']==[request['date'].replace('-','')],'Request binding')
            request_time=request['timeWindow'];require(request_time['earliest'].replace(':','')<=q['visit_time'][0]<=request_time['latest'].replace(':',''),'Slot binding')
            observations=[response for p in d['sourcePages'] for response in p['page'].get('responses',[])]
            require(any(handoff['url'] in json.dumps(x,ensure_ascii=False) for x in observations),'Exact source URL absent')
        for term in handoff['terms']:
            require(term['citations'],'Uncited term')
            for cite in term['citations']:
                observed=pages(d,cite['url'])
                require(any(cite['text'] in p['text'] for p in observed),'Quote not in observed same page')
                require((urlparse(cite['url']).hostname=='tabelog.com')==(handoff['provider']=='TABELOG'),'Cross-channel terms')
                if handoff['provider']=='TABELOG':require(q['rcd'][0]==urlparse(cite['url']).path.rstrip('/').split('/')[-1],'Cross-shop terms')

inputs=json.loads((r/'evaluation-inputs.json').read_text())
outputs=[]
for log in sys.argv[1:]:
    path=Path(log);outputs+=frames(path)
require(len(outputs)==26,'Expected 3 D2 + 2 D3 + 14 terms + 7 reserve frames')
by={d['label']:d for d in outputs};require(len(by)==26,'Duplicate scenario frame')
rows=[]
for d in outputs:
    require(d['realCalls']==0,'External-call fixture boundary')
    e=d['execution'];v=d['view'];snapshot=e['finalSnapshot']
    require(snapshot['domainState']['schemaVersion']=='25' and snapshot['definitionVersion']=='23','Version drift')
    require('bookingTermsDiagnostics' not in snapshot['domainState'],'Diagnostics in durable State')
    require(not events(d,'BOOKING_PROPOSED'),'Booking proposal outside B1')
    for call in d['sourceCalls']:
        require(not re.search(r'/booking/|/yoyaku/|/(review|confirmation|checkout|payments?|accounts?)(/|\?|$)',urlparse(call['url']).path),'Forbidden source navigation')
    for diag in e['bookingTermsDiagnostics']:
        require(diag['rootTaskId']==v['case']['rootTaskId'],'Cross-task diagnostic')
        require(not diag.get('readRunId') or diag['readRunId'].startswith('run:'+v['case']['rootTaskId']+':investigation:'),'Unbound run diagnostic')
    supported_handoffs(d)
    rows.append({'scenario':d['label'],'phase':v['case']['phase'],'handoffs':len(v['restaurant'].get('bookingHandoffs',[])),
        'questions':len(question_calls(d)),'reasons':dict(reasons(d)),'fixtureModelCalls':len(d['requests']),
        'sourceLoads':len(d['sourceCalls']),'elapsedMs':d['run']['elapsedMs'],'status':'PASS'})

d2=json.loads(Path(inputs['d2']).read_text());ids=[x['restaurant']['id'] for x in d2['candidates']]
for mode in ['ONE','NONE','TWO']:
    d=by[mode];v=d['view'];ev=d['execution']['events']
    require(d['googleWires'][0]['response']['places']==d2['places'],'Original Google seven changed')
    require([c['restaurant']['id'] for c in v['restaurant']['candidates']]==ids,'Original possible-name five changed')
    require(d['requests'][0]['response']['outputText']==Path(inputs['d2Semantic']).read_text(),'D2 semantic bytes changed')
    facts=events(d,'CANDIDATE_FACTS_CHECKED');require(len(facts)==1,'Missing bounded identity batch')
    evidence=facts[0]['evidence'];require([x['candidateId'] for x in evidence if x['kind']=='ENTITY_MATCH']==ids[:3],'Identity prefix/order')
    require(all(x['kind']=='ENTITY_MATCH' for x in evidence),'Identity read leaked inventory/facts')
    exact=[]
    for index,candidate in enumerate(d2['candidates'][:3]):
        identity=next(x for x in evidence if x['candidateId']==candidate['restaurant']['id'])
        observed=pages(d,identity['sourceUrl']);require(observed,'Missing identity page')
        source=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',observed[0]['html'],re.S).group(1))
        require(source['telephone']==candidate['restaurant']['sourceIds']['phone'],'Independent phone mismatch')
        require(source['address']==d2['sourcePlaces'][index]['formattedAddress'],'Independent original full address mismatch')
        require(source['name'] in observed[0]['text'],'Source name not observed')
        if key(source['name'])==key(d2['intentDraft']['target']['query']):exact.append(candidate['restaurant']['id'])
    require(len(exact)=={'ONE':1,'NONE':0,'TWO':2}[mode],'Constructed source-name oracle')
    if len(exact)==1:
        require(v['restaurant']['presentedCandidateIds']==exact,'Wrong named outlet presented')
        checked=events(d,'AVAILABILITY_CHECKED');require(len(checked)==1 and checked[0]['request']['candidateIds']==exact,'Availability before uniqueness')
        types=[x['event']['type'] for x in ev];require(types.index('CANDIDATE_FACTS_CHECKED')<types.index('AVAILABILITY_CHECKED'),'Early inventory')
        require(len(v['restaurant']['bookingHandoffs'])==1,'Missing supported handoff')
    else:
        require(v['case']['phase']=='NEEDS_INPUT' and not events(d,'AVAILABILITY_CHECKED') and not events(d,'CANDIDATE_SELECTED'),'Ambiguity not closed')
        require(not v['restaurant']['bookingHandoffs'],'Ambiguous handoff')

for label in ['D3_PENDING','D3_BUSY']:
    d=by[label];require(d['view']['restaurant']['bookingHandoffs'][0]['url']==inputs['d3Link'],'Original D3 B1 link changed')
    require(not terms(d),'Payment acceptance turned into booking-card claim')
    if label=='D3_PENDING':
        require(len(question_calls(d,'SELECTED'))==2,'D3 selected questions not reached')
        require(reasons(d)['NOT_STATED']==4,'Two original-byte rounds should honestly omit missing terms')
        for call in question_calls(d):
            wire=' '.join(m['content'] for m in call['request']['messages'])
            require('Credit card accepted' in wire and '現在アクセスが集中しています' not in wire,'G1 wrong document')
        for ordinal in ['23','24']:
            page=json.loads(Path(inputs['d3Pages'][ordinal]['path']).read_text())
            require(sha(page['text'].encode())==inputs['d3Pages'][ordinal]['textSHA256'],'Original visible text drift')
            require(any(p['page']['text']==page['text'] for p in d['sourcePages']),'Original page not observed')
    else:require(not question_calls(d) and reasons(d)['NO_PAGES']>0,'Still-loading page admitted')

for label,reason in inputs['diagnosticScenarios'].items():require(reasons(by[label])[reason]>0,label+' missing '+reason)
require(len(question_calls(by['boundary-20000']))==0 and not terms(by['boundary-20000']),'Reserve boundary read')
require(len(question_calls(by['between-models']))==1 and not terms(by['between-models']),'Second call in reserve')
require(len(question_calls(by['conflict']))==4 and len(terms(by['conflict']))==3,'Bilingual conflict regression')
for label in ['TABELOG-proactive','TABLECHECK-proactive','boundary-20001']:
    require(len(terms(by[label]))==2,label+' lost supported terms')
for label in ['SHOP','CHANNEL','budget','cancelled','deadline','early-abort']:
    require(not terms(by[label]),label+' failed open')

result={'status':'PASS','mode':'FROZEN_SOURCE_IO_WITH_ORIGINAL_MODEL_BYTES','frames':len(outputs),'rows':rows,
    'claimSupport':'PASS within frozen constructed/saved I/O; no current website claim',
    'boundaries':'No workflow navigation or booking events in recorded fixture I/O',
    'realExternalCalls':0,'historicalD6S0':1,'liveOutcome':'NOT_EVALUATED',
    'limitations':['D2 detail pages/inventory are constructed controls, not real source identity Gold.',
        'D3 actual page has neither cancellation nor booking card requirement; reaching the model is not proof of populated Live terms.',
        'Fixed browser COMPLETE replaces historical CLICK references; not a complete original HAR/decision replay.',
        'No claim of new 37-store rate, actual Live timing, fresh inventory or reservation completion.']}
print(json.dumps(result,ensure_ascii=False,indent=2))
