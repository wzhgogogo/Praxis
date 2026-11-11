"""Known URL frontier from observed simulation inputs; never reads Gold."""
from pathlib import Path
import hashlib,json,sys
ROOT=Path('.eval-artifacts/phase3b/g4-japanese-wiring')
def load(p):return json.loads(Path(p).read_text())
def build():
 config=load(ROOT/'inputs.json');known=[];seen=set()
 for sid in ['nr-007','nr-008','nr-019','nr-025']:
  row=load(ROOT/'execution'/f'main-{sid}.json')
  for index,detail in enumerate(row['details']):
   if detail.get('problem')!='MISSING_SAVED_PAGE' or detail['url'] in seen:continue
   seen.add(detail['url'])
   anchor=next(r for r in row['reads'] if r['kind']=='SEARCH' and r['query']==detail['query'] and r.get('bodyPath'))
   assert hashlib.sha256(Path(anchor['bodyPath']).read_bytes()).hexdigest()==anchor['sha256']
   known.append({'id':f'KNOWN-DETAIL-{len(known)+1:02}','subjectId':sid,'method':'GET','url':detail['url'],
    'detailOrdinalInSimulatedCase':index+1,'phase':detail['phase'],'query':detail['query'],
    'observedIn':anchor['bodyPath'],'observedSha256':anchor['sha256'],
    'executionPath':str(ROOT/'execution'/f'main-{sid}.json'),
    'condition':'Only if preceding reads did not establish HIGH identity and both per-store and shared budgets remain',
    'missingFragmentProposal': 'UNRECORDED_FRAGMENT_PROPOSAL' in row['uncertainties']})
 beef=next(r for r in config['rows'] if r['id']=='nr-007')
 assert len(known)==8
 return {'schema':'g4-scheme-one-request-frontier@2','status':'NOT_EXECUTABLE_UNTIL_SOURCE_BINDING_AND_REVIEW',
  'sourceConfigurationCommit':load(ROOT/'simulation-summary.json')['configurationCommit'],
  'currentNewRequests':0,'knownDetailURLs':known,
  'googleRequest':{'method':'GET','url':f"https://places.googleapis.com/v1/places/{beef['googlePlaceId']}?languageCode=ja",'fieldMask':'id,displayName','expectedPlaceId':beef['googlePlaceId'],'limit':1,'credential':'FUTURE_SERVER_RUNNER_ONLY_NO_ENV_READ_NOW'},
  'beefSearch':{'method':'GET','url':None,'origin':'https://tabelog.com','path':'/en/tokyo/rstLst/',
   'queryBinding':{'sw':'Exact text returned by same-ID Japanese name reader; encode with source request builder'},
   'status':'SOURCE_NAME_NOT_YET_READ_LITERAL_URL_UNMATERIALIZED','limit':1},
  'beefDetails':{'urls':None,'status':'SEARCH_NOT_YET_READ_URLS_UNMATERIALIZED','source':'Only links observed in the Beef Japanese first screen, production ranking order','perStoreDetailCeiling':5},
  'limits':{'google':1,'publicGET':14,'details':13,'model':0,'fullLive':0,'sharedUsed':244,'sharedCeiling':260,
   'perStoreSearches':3,'perStoreDetails':5,'siteTimeoutMs':20000,'minimumGapMs':30000,'cookie':False,'followRedirect':False,'retries':0},
  'budgetAnalysis':{'knownMissingDetails':len(known),'possibleBeefDetails':5,'worstCaseDetails':len(known)+5,
   'worstCasePublicGET':1+len(known)+5,'authorizedPublicGET':14,'beefCapacityIfAllKnownPagesNeeded':13-len(known),
   'worstCaseWithinNumericalBudget':True,'allFourCompletePathsGuaranteed':False,'onBudgetExhaustion':'Stop before request; unresolved cases remain NOT_EVALUATED; no extra quota'},
  'materializationRequired':['First review the exact one-Google-request submanifest; only after approval read/freeze same-ID name and literal Beef search URL',
   'After future Beef first screen: freeze actual observed ordered detail URLs and a budget-valid subset; never use certified IDs',
   'T has no captured fragment proposal; choose a separately approved replay input or retain NOT_EVALUATED, never invent a model result',
   'G3 and B1 main integration are complete; this offline product branch and literal request list still require review before ANY real request (including Google)']}
if __name__=='__main__':
 assert sys.argv[1] in ['--write','--verify-only'];value=build();path=ROOT/'request-plan.json'
 if sys.argv[1]=='--write':
  with path.open('x') as f:f.write(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
 else:assert load(path)==value
 print(json.dumps({'knownURLs':len(value['knownDetailURLs']),'unmaterializedBeefSearch':True,'worstCaseGET':14,'hardCap':14,'executable':False,'newCalls':0}))
