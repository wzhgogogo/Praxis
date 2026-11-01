from pathlib import Path
from urllib.parse import urlparse,parse_qs
import base64,gzip,hashlib,json,re
R=Path(__file__).parent
log=(R/'gates/test.log').read_text()
O=R/'final-compositions';O.mkdir(exist_ok=True)
frames={}
for match in re.finditer(r'B1_TERMS_COMPOSITION_RAW ([A-Za-z0-9+/=]+)',log):
 raw=base64.b64decode(match[1]);value=json.loads(raw);label=value['label'];assert label not in frames
 frames[label]=value;(O/(label+'.json.gz')).write_bytes(gzip.compress(raw,mtime=0))
expected={'agent-selection-only':0,'TABELOG-proactive':2,'TABLECHECK-proactive':2,'admitted-reuse':1,'selected-admitted-reuse':2,'conflict':3,'SHOP':0,'CHANNEL':0,'not-stated-new-run':0,'budget':0,'cancelled':0,'expired-pages':0,'fresh-explicit-reuse':1,'deadline':0}
assert frames.keys()==expected.keys(),(frames.keys(),expected.keys())
expected_quotes={'Cancellations on the reservation date are charged at 100% of the course price.','A credit card is required to guarantee this reservation.','当日キャンセルの場合はコース料金の50％を申し受けます。'}
rows=[];claims=0
for label,value in frames.items():
 view=value['view'];handoffs=view['restaurant']['bookingHandoffs'];assert len(handoffs)==1,label
 h=handoffs[0];assert len(h['terms'])==expected[label],label
 u=urlparse(h['url']);q=parse_qs(u.query)
 if h['provider']=='TABELOG':
  assert u.netloc=='tabelog.com' and u.path=='/en/booking/form_course/new'
  assert q=={'visit_time':['1900'],'member':['2'],'rcd':['13123456'],'visit_date':['20261111']}
 else:
  assert u.netloc=='www.tablecheck.com' and u.path=='/en/shops/g6-development-sushi/reserve'
  assert q=={'start_date':['2026-11-11'],'start_time':['19:00'],'num_people':['2']}
 assert h['sourceSelection']=='UNKNOWN'
 for term in h['terms']:
  assert term['citations']
  for c in term['citations']:
   claims+=1;assert c['text'] in expected_quotes,(label,c)
   cu=urlparse(c['url'])
   assert (cu.netloc=='tabelog.com' and '/13123456/' in cu.path) if h['provider']=='TABELOG' else (cu.netloc=='www.tablecheck.com' and '/g6-development-sushi/reserve' in cu.path)
   rawpages=[row for row in value['sourcePages'] if row['page']['url']==c['url'] and row['observedAt']==c['readAt']]
   assert any(c['text'] in row['page']['text'] and 'G6 Development Sushi' in row['page']['text'] and '03-1234-5678' in row['page']['text'] for row in rawpages),(label,'raw source citation absent',c)
   proofs=[p for prepared in value['prepared'] for p in prepared['source'].get('terms',{}).get('pages',[]) if p['url']==c['url'] and p['readAt']==c['readAt'] and p['identityEvidenceId']==c['identityEvidenceId']]
   assert proofs and all(p['candidateId']==h['candidateId'] and p['provider']==h['provider'] and p['readRunId']==view['restaurant']['sourceReadContext']['runId'] and p['identity']['kind']=='ENTITY_MATCH' and p['identity']['candidateId']==h['candidateId'] and p['identity']['sourceUrl']==c['url'] for p in proofs)
  if term['label']=='Card required':assert all(c['text']=='A credit card is required to guarantee this reservation.' for c in term['citations'])
 purposes=[row['request']['purpose'] for row in value['requests']]
 if label.endswith('proactive'):assert purposes.count('restaurant_page_question')==2
 if label=='admitted-reuse':assert purposes.count('restaurant_page_question')==1
 if label=='conflict':assert purposes.count('restaurant_page_question')==4 and h['cancellationNotice']=='Cancellation terms differ between the Japanese and English pages'
 if label=='budget':assert value['run']['calls']==20 and sum(row['turn']=='SELECTED' for row in value['requests'])==20
 assert not any(re.search(r'form_course|yoyaku|payment|confirm|checkout|account',urlparse(call['url']).path) for call in value['sourceCalls'] if call['kind']=='BROWSER_NAVIGATE')
 assert value['realCalls']==0
 rows.append({'label':label,'result':'QUALIFIED_DELIVERY' if expected[label] else 'HONEST_OPTIONAL_TERMS_OMITTED_LINK_PRESERVED','terms':len(h['terms']),'mockQuestionCalls':purposes.count('restaurant_page_question'),'modelCallsInLastWholeRun':value['run']['calls'],'quotationsOutletChannelRun':'PASS','link':'PASS','externalCalls':0})
p=R/'admitted-artifact/preflight.json';raw=p.read_bytes();a=json.loads(raw)
answer=a['after']['restaurant']['pageQuestion']['result'];h=a['after']['restaurant']['bookingHandoffs'][0]
assert answer['status']=='ANSWERED' and answer['answer']=='Same-day cancellations cost 100% of the course price.'
assert sum(row['request']['purpose']=='restaurant_page_question' for row in a['requests'])==1
assert any(term['label']==answer['answer'] and term['citations']==answer['citations'] for term in h['terms'])
p.with_suffix('.json.gz').write_bytes(gzip.compress(raw,mtime=0))
result={'status':'PASS','scope':'Offline exposed local constructions, independent literal/source-page/output checking; not real-model faithfulness or Live inventory','layer1':{'CObservedFrames':len(rows),'originalAHelper':1,'allPlannedObserved':True,'outputs':rows},'layer2':{'originalAAnswerToTerms':'PASS','proactiveSelectedOnly':'PASS','reuseWithoutDuplicate':'PASS','bilingualConflict':'PASS','unsafeOrUnavailableTermsOmittedLinkPreserved':'PASS','quotationClaimsIndependentlyChecked':claims},'layer3':{'unsupportedFixtureQuotationOrUnsafeNavigationClaims':0,'realSourceS0':'NOT_EVALUATED_NO_LIVE','semanticGeneralization':'NOT_EVALUATED_NO_REAL_MODEL'},'layer4':{'baselineCause':'Production lacked G1-to-B1 terms and selected-outlet acquisition wiring','localTestFailures':'First C wrapper recursion and then exact TC read-URL/cancellation timing; preserved separately','identityGuard':'Additional unit counterexample preserved; no production source identity rule relaxed'},'realCalls':{'model':0,'websiteGET':0,'google':0,'live':0},'AArtifactSHA256':hashlib.sha256(raw).hexdigest()}
(R/'independent-evaluation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':'PASS','frames':len(rows),'originalAHelper':1,'literalCitations':claims,'realCalls':0}))
