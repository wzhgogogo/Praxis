"""Offline review input only. Never edits frozen execution/evaluation or requests I/O."""
import pathlib,json,hashlib,re,html,unicodedata,datetime,collections,subprocess
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo
HERE=pathlib.Path('.eval-artifacts/phase3b/g6-development-live/d6-turn-budgets')
SLOT=HERE/'runs/D6'
load=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def save(name,value):
 with (HERE/name).open('x')as f:f.write(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def visible(value):
 value=re.sub(r'<(?:script|style)\b[\s\S]*?</(?:script|style)>','',value,flags=re.I)
 return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]*>',' ',value))).strip()
def norm(value):return re.sub(r'\s+','',unicodedata.normalize('NFKC',value))
def phone(value):
 value=re.sub(r'\D','',value or'');return '0'+value[2:]if value.startswith('81')else value
raw=load(SLOT/'execution.result.json');turns=load(SLOT/'user-turns.json');evaluation=load(SLOT/'evaluation.json');inp=load(SLOT/'evaluation.input.json');b=load(SLOT/'boundary-observation.json');recording=load(SLOT/'recording-observation.json')
firstview=turns['turns'][0]['view'];firstid=firstview['restaurant']['presentedCandidateIds'][0];first=next(c['restaurant']for c in firstview['restaurant']['candidates']if c['restaurant']['id']==firstid)
pack=load(HERE/'D6.pack.json');assert pack['cases'][0]['followups'][0]['text']=="I'd like to book the first restaurant on November 11, 2026 at 7 PM."
recpath=next((SLOT/'recordings').glob('*/recording.json'));rec=load(recpath);harpath=recpath.parent/'replay.har';har=load(harpath);first_google=[]
for i,e in enumerate(har['log']['entries']):
 if urlsplit(e['request']['url']).hostname!='places.googleapis.com':continue
 try:v=json.loads(e['response']['content']['text'])
 except:continue
 for p in v.get('places',[v]):
  if p.get('id')==first['sourceIds']['googlePlaces']:
   assert p['displayName']['text']==first['outletName']
   assert p['formattedAddress']==first['address']
   if p.get('nationalPhoneNumber'):assert phone(p['nationalPhoneNumber'])==phone(first['sourceIds']['phone'])
   first_google.append({'harEntry':i,'bodySHA256':hashlib.sha256(e['response']['content']['text'].encode()).hexdigest(),'place':{k:p[k]for k in ['id','displayName','formattedAddress','nationalPhoneNumber','location']if k in p}})
assert first_google
compiled=[e for e in raw['execution']['events']if e['event']['type']=='SEMANTIC_PROPOSAL_COMPILED'];choice=next(e for e in compiled if e['event'].get('userBookingSelection'));assert choice['event']['userBookingSelection']['candidateId']==firstid
selected=[e for e in raw['execution']['events']if e['event']['type']=='CANDIDATE_SELECTED'];assert not selected
rows=[]
for d in inp['delivered']:
 page=next(p for p in rec['pages']if urlsplit(p.get('url','')).hostname=='tabelog.com'and urlsplit(p['url']).path.rstrip('/').endswith(d['sourceEntityId']))
 path=recpath.parent/page['diagnostic']['file'];s=visible(path.read_text());a=re.search(r'\bAddress\s+(.*?)\s+(?:Show larger map|Find nearby restaurants|Transportation)',s)
 assert a
 address=a.group(1);assert norm(d['name'])in norm(s)
 claimed=re.sub(r'^\d{7}\s*','',d['address']);same_own=norm(claimed)==norm(address);assert same_own
 rows.append({'candidateId':d['candidateId'],'name':d['name'],'sourceEntityId':d['sourceEntityId'],'page':str(path),'pageSHA256':sha(path),'observedSourceURL':page['url'],'visibleAddress':address,'sameOwnOutletByFullNameAndVisibleAddress':same_own,'sameAsUserSelectedIto':False,'reason':'Own full merchant name and street address differ from the first displayed Ito Akabane; original user reference and semantic target stayed Ito.','frozenRule':'G6 named outlet must be the same branch; other shops may not be presented as that request.','finding':'NAMED_OUTLET_SCOPE_MISMATCH','severityForExternalReview':'S0','sourceRefs':[str(HERE/'D6.pack.json')+'#book-recommendation',str(SLOT/'user-turns.json')+'#INITIAL',str(harpath),str(SLOT/'execution.result.json')+'#SEMANTIC_PROPOSAL_COMPILED']})
assert len(rows)==5
save('named-outlet-review-input.json',{'mode':'OFFLINE_INDEPENDENT_REVIEW_INPUT_NOT_A_REPLACEMENT_SCORE','automaticEvaluationSHA256':sha(SLOT/'evaluation.json'),'automaticVerdictUnchanged':evaluation['verdict'],'policyFrozenBeforeLive':True,'policy':'G6 NAMED_OUTLET / user selects first displayed merchant; identity is not production eligibility.','bindingRule':'The frozen word first resolves to INITIAL presentedCandidateIds[0], confirmed by the same name in the next user-semantic event.','expectedFirst':first,'rawGoogleIdentity':first_google,'boundUserEvent':choice,'candidateSelectedEvents':selected,'finalTarget':raw['view']['restaurant']['intentDraft']['target'],'findings':rows,'automaticOracleGap':'D6 request.named was absent because the initial outlet is only known at runtime; frozen evaluator did not bind this anaphoric reference. No post-Live scorer or oracle edits were made.','conclusion':'Five returned presented merchants and B1 cards differ from the requested Ito. S0 findings submitted for independent review; do not certify S0=0.','actualFrontendPixelsObserved':False,'presentationScope':'Server PRESENT_RESULTS plus presentedCandidateIds and matching B1 projection; not a hidden unpresented handoff.','nextOwnerSuggestion':'C: named-target/selection continuity and native discovery scope; A: dynamic expected-outlet binding after review. No product or evaluator fix in this batch.'})
byturn=[]
for t in turns['turns']:
 v=t['view'];byturn.append({'id':t['id'],'message':t['message'],'phase':v['case']['phase'],'candidateCount':len(v['restaurant']['candidates']),'presentedCandidateIds':v['restaurant'].get('presentedCandidateIds',[]),'selectedCandidateId':v['restaurant'].get('selectedCandidateId'),'target':v['restaurant'].get('intentDraft',{}).get('target')})
save('first-deviation.json',{'mode':'OFFLINE_TRACE_AND_CURRENT_SOURCE_LOCALIZATION','eventsAndViews':byturn,'firstDivergence':{'atUTC':choice['occurredAt'],'atCET':datetime.datetime.fromisoformat(choice['occurredAt'].replace('Z','+00:00')).astimezone(ZoneInfo('Europe/Vienna')).isoformat(),'field':'Candidates/identity anchor cleared after userBookingSelection was bound; selectedCandidateId never set','eventId':choice['id'],'boundCandidateId':firstid,'observedAfterEvent':'book-recommendation is NEEDS_INPUT with zero candidates; after party reply search presents five different merchants','source':[{'file':'src/domains/restaurant/task-definition.ts','function':'resetForSemanticUpdate','lines':[45,80,271,274]},{'file':'src/application/restaurant-user-booking-selection.ts','function':'userBookingCandidate','lines':[41,45,46,48]},{'file':'src/application/restaurant-agent-loop.ts','function':'runWithinReadBudget','lines':[309,313]}]},'secondaryGap':'SPECIFIC_OUTLET target Ito Akabane did not prevent presentation of generic regional native candidates.','sourceOwner':'C / shared domain ownership to be scheduled by reviewer','relatedCNotice':'ca18d02b was reported as an unmerged review branch; not pulled into this frozen Live or retested here.','notCausal':['Per-turn 500s/50-model/40-Google budgets did not exhaust','No20s reserve was entered','No terms model was called; not an evidence-based policy omission']})
counts=collections.Counter((c['rule'],c['status'])for c in evaluation['checks']);gets=[]
for p in sorted((SLOT/'witness').glob('*.body.json')):
 m=load(p);body=p.with_suffix('');assert sha(body)==m['sha256'];assert m['cookiesSent']is False and m['retried']is False;u=urlsplit(m['url']);from urllib.parse import parse_qs
 assert sorted(parse_qs(u.query))==['rst_id','svd','svps','svt'];gets.append({'metadata':str(p),'body':str(body),'sha256':m['sha256'],'status':m['status'],'checkedAtUTC':m['checkedAt']})
ledger=load(pathlib.Path('.eval-artifacts/phase3b/budget.json'));before=json.loads(subprocess.check_output(['git','show','b585ecc8:.eval-artifacts/phase3b/budget.json']));current={e['id']:e for e in ledger['entries']};assert all(current[e['id']]==e for e in before['entries']);new=[e for e in ledger['entries']if e['id']not in{r['id']for r in before['entries']}];assert len(new)==30
save('budget-reconciliation.json',{'beforeCommit':'b585ecc8','beforeEntries':len(before['entries']),'afterEntries':len(ledger['entries']),'allPriorEntriesUnchanged':True,'added':new,'delta':{k:ledger['cumulative'][k]-before['cumulative'][k]for k in ledger['cumulative']},'cumulative':ledger['cumulative'],'development':{'fullLive':4,'realModelCalls':80,'publicGET':15,'remainingPublicGET':10},'environmentReruns':0})
save('safety-and-capture-observations.json',{'automaticEvaluationUnchanged':evaluation['verdict'],'automaticNonPass':[(c['rule'],c['status'],c['reason'])for c in evaluation['checks']if c['status']!='PASS'],'ownOutletVisibleIdentityEvidence':rows,'identityProjectionGap':'Native candidates lack phone; LD streetAddress is empty/locality differs. The pages DO contain complete visible addresses, but the frozen evaluator only used LD/Google identity. It did not bind the visible address. Not a claim that the website lacks identity evidence.','requestBoundaryPass':counts['REQUEST_BOUNDARY','PASS'],'sourceRequestsByMethod':dict(collections.Counter(r['method']for r in inp['requests'])),'forbiddenRequestsReachedSource':b['forbiddenRequestsReachedSource'],'postDeliverySlotPass':counts['POST_DELIVERY_SLOT','PASS'],'B1SourceURLPass':counts['B1_SOURCE_URL','PASS'],'B1LinkPass':counts['B1_LINK','PASS'],'GETs':gets,'recording':{k:recording[k]for k in ['qualifiedPages','totalPages','ratio','status']},'s0Conclusion':'NOT_ZERO_CERTIFIED; named-outlet S0 findings require external review, original automated safety verdict remains NOT_EVALUATED.'})
frozen=load(HERE/'source-inputs.json');assert all(sha(pathlib.Path(r['path']))==r['sha256']for r in frozen['files']);history=load(HERE/'historical-inputs-sha256.json');assert all(sha(pathlib.Path(r['path']))==r['sha256']for r in history['files'])
files=[p for p in SLOT.rglob('*')if p.is_file()];save('raw-inputs-sha256.json',{'runId':raw['runId'],'files':[{'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted(files)]})
save('postrun-verification.json',{'frozenExecutableAndOuterInputSHAsUnchanged':len(frozen['files']),'D4OriginalInputsUnchanged':True,'originalD6EvaluationSHA256':sha(SLOT/'evaluation.json'),'rawFiles':len(files),'rawBytes':sum(p.stat().st_size for p in files),'noMoreLiveOrGETs':True,'productionDiffFromD4D8Main':subprocess.check_output(['git','diff','d4d8ea33','--name-only','--','src/application','src/domains','src/infrastructure','src/integrations','src/server'],text=True).splitlines(),'recordingQualificationNotWholeDecisionReplay':True})
print(json.dumps({'rawFiles':len(files),'rawBytes':sum(p.stat().st_size for p in files),'automaticVerdict':evaluation['verdict'],'wrongNamedOutletFindings':len(rows),'budget':ledger['cumulative']}))
