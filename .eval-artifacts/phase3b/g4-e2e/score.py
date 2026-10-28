"""Separate posthoc scorer; certified IDs are never passed to execution/model."""
import collections,datetime,json,re,sys,importlib.util,hashlib
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlparse
root=Path('.eval-artifacts/phase3b/g4-e2e')
spec=importlib.util.spec_from_file_location('frozen_oracle','.eval-artifacts/phase3b/c-batch2/score-search.py');oracle=importlib.util.module_from_spec(spec);spec.loader.exec_module(oracle)
def load(p):return json.loads(Path(p).read_text())
def identity(url):
 try:
  u=urlparse(url);m=re.fullmatch(r'/(?:en/)?tokyo/A\d+/A\d+/(\d+)/?',u.path)
  return m[1] if u.hostname=='tabelog.com' and m else None
 except:return None
class Links(HTMLParser):
 def __init__(self):super().__init__();self.values=[]
 def handle_starttag(self,t,a):
  if t=='a':self.values.extend(v for k,v in a if k=='href' and v)
def score(row,gold):
 target=gold[row['id']]['rstId'];searches=[]
 for request in row['requests']:
  if request['kind']!='SEARCH':continue
  ids=[];alert=None
  if request.get('bodyPath'):
   raw=Path(request['bodyPath']).read_bytes();assert hashlib.sha256(raw).hexdigest()==request['sha256']
   evidence=oracle.inspect(raw.decode('utf8'),request['url'],request['query']);ids=evidence['ids']
   if not evidence['queryVisible'] or not evidence['structureVerified']:alert='SOURCE_STRUCTURE_CHANGED_OR_QUERY_UNBOUND'
  searches.append({'query':request['query'],'certifiedPresentInFirstPage':target in ids if not alert else None,'alert':alert})
 verdict='CORRECT_ACCEPTED' if row['acceptedUrl'] and identity(row['acceptedUrl'])==target else 'WRONG_ACCEPTED' if row['acceptedUrl'] else 'ENVIRONMENT_FAILURE' if row['environmentFailure'] else 'INTERRUPTED' if row['stop'] else 'NOT_ACCEPTED'
 stage=None
 if verdict=='NOT_ACCEPTED':
  reason=row['productionReason'] or ''
  stage='MODEL_FRAGMENT_REJECTED' if row['modelRecords'] and len(searches)==1 else 'EMPTY_OR_TARGET_ABSENT_FIRST_PAGE' if not any(s['certifiedPresentInFirstPage'] for s in searches) else 'TARGET_OUTSIDE_DETAIL_CAP' if not any(identity(r['url'])==target for r in row['requests'] if r['kind']=='DETAIL') else 'IDENTITY_NOT_ACCEPTED'
  target_comparisons=[o.get('comparison',{}) for d in row['diagnostics'] for o in d.get('comparedOutlets',[]) if identity(o.get('sourceUrl'))==target]
  if any(c.get('address')=='CONFLICT' or c.get('phone')=='CONFLICT' for c in target_comparisons):stage='IDENTITY_FIELDS_CONFLICT' if stage=='IDENTITY_NOT_ACCEPTED' else stage
 return {'id':row['id'],'cohort':row['cohort'],'verdict':verdict,'acceptedUrl':row['acceptedUrl'],'reason':row['productionReason'],'environmentFailure':row['environmentFailure'],'failureStage':stage,'searches':searches,'openedDetails':[r['url'] for r in row['requests'] if r['kind']=='DETAIL']}
gold={r['id']:r for r in load(root/'gold.json')['rows']}
if '--self-test' in sys.argv:
 sample={'id':'fixture','cohort':'OLD29','acceptedUrl':'https://tabelog.com/en/tokyo/A1/A2/22222222/','requests':[],'environmentFailure':None,'stop':None,'productionReason':'HIGH_EXACT_PHONE','diagnostics':[],'modelRecords':[]}
 assert score(sample,{'fixture':{'rstId':'11111111'}})['verdict']=='WRONG_ACCEPTED'
 sample['acceptedUrl']='https://tabelog.com/en/tokyo/A1/A2/11111111/';assert score(sample,{'fixture':{'rstId':'11111111'}})['verdict']=='CORRECT_ACCEPTED'
 sample['acceptedUrl']=None;sample['environmentFailure']='SOURCE_TIMEOUT';assert score(sample,{'fixture':{'rstId':'11111111'}})['verdict']=='ENVIRONMENT_FAILURE'
 print('PASS independent wrong-ID, correct-ID, environment exclusion controls;0 calls')
elif '--one' in sys.argv:
 row=load(sys.argv[sys.argv.index('--one')+1]);result=score(row,gold);(root/'evaluation'/f"{row['id']}.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False))
else:
 planned=load(root/'inputs.json')['rows'];rows=[]
 for s in planned:
  p=root/'evaluation'/f"{s['id']}.json"
  rows.append(load(p) if p.exists() else {'id':s['id'],'cohort':s['cohort'],'verdict':'NOT_RUN','failureStage':None})
 result={'schema':'g4-e2e-evaluation@1','atCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),'mode':'EVALUATION_PUBLIC_GET_IDENTITY_PREFIX_NO_LIVE','planned':37,'cohorts':{c:{'planned':len(r:=[x for x in rows if x['cohort']==c]),'verdicts':dict(collections.Counter(x['verdict'] for x in r)),'notAcceptedStages':dict(collections.Counter(x['failureStage'] for x in r if x['verdict']=='NOT_ACCEPTED'))} for c in ['OLD29','NEW8']},'rows':rows,'limits':'Compare independently certified ID after production identity. No stock/opening-status claim. HTTP failures excluded from identity miss count; unrun explicit. Old12/29 saved-page result is separate.'}
 (root/'evaluation-summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='rows'},ensure_ascii=False))
