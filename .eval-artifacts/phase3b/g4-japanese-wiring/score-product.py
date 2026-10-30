"""Gold is loaded only here, after evaluation-layer simulation wrote its result."""
from pathlib import Path
from urllib.parse import urlparse
import collections,json,sys
ROOT=Path('.eval-artifacts/phase3b/g4-japanese-wiring')
BASE=Path('.eval-artifacts/phase3b/g4-name-entities')
def load(p):return json.loads(Path(p).read_text())
def identity(url):return urlparse(url).path.rstrip('/').split('/')[-1] if url else None
gold={r['id']:r for r in load('.eval-artifacts/phase3b/g4-e2e/gold.json')['rows']}
baseline={r['key']:r for r in load(BASE/'evaluation-summary.json')['rows']}
def score(row):
 target=gold[row['id']]['rstId'];before=baseline[row['key']]
 verdict='WRONG_ACCEPTED' if row['acceptedUrl'] and identity(row['acceptedUrl'])!=target else 'CORRECT_ACCEPTED' if row['acceptedUrl'] else 'NOT_EVALUATED' if row['status']=='NOT_EVALUATED' else 'NOT_ACCEPTED'
 old=load(BASE/'replay-execution'/f"{row['key']}.json")
 old_details=[r['url'] for r in old['requests'] if r['kind']=='DETAIL']
 old_fifth=len(old_details)>=5 and identity(old_details[4])==target
 selected=any(identity(r['url'])==target for r in row['details'])
 return {'id':row['id'],'key':row['key'],'view':row['view'],'cohort':row['cohort'],'verdict':verdict,
  'old23':before['baselineVerdict']=='CORRECT_ACCEPTED','currentBaselineAccepted':before['verdict']=='CORRECT_ACCEPTED',
  'focusThree':row['view']=='MAIN37' and row['id'] in ['nr-010','nr-022','nr-026'],
  'baselineFifthWasCertified':old_fifth,'certifiedSelected':selected,
  'fifthDisplaced':old_fifth and not selected,'uncertainties':row['uncertainties'],
  'queries':[{'query':r['query'],'kind':r['kind']} for r in row['searches']],
  'detailPlan':[{'url':r['url'],'phase':r['phase'],'certified':identity(r['url'])==target,'problem':r.get('problem')} for r in row['details']]}
if '--one' in sys.argv:
 print(json.dumps(score(load(sys.argv[-1]))))
else:
 rows=[score(load(ROOT/'product-execution'/f"{r['key']}.json")) for r in load(ROOT/'inputs.json')['rows']]
 prior=[r for r in rows if r['old23']];focus=[r for r in rows if r['focusThree']]
 result={'schema':'g4-named-retrieval-simulation-evaluation@1','mode':'PRODUCTION_IDENTITY_PREFIX_NOT_STOCK_OR_LIVE',
  'main37':dict(collections.Counter(r['verdict'] for r in rows if r['view']=='MAIN37')),
  'rerun4':dict(collections.Counter(r['verdict'] for r in rows if r['view']=='RERUN4')),
  'old23':{'planned':len(prior),'retained':sum(r['verdict']=='CORRECT_ACCEPTED' for r in prior),'notEvaluated':sum(r['verdict']=='NOT_EVALUATED' for r in prior)},
  'focusThree':focus,'wrongAccepted':sum(r['verdict']=='WRONG_ACCEPTED' for r in rows),
  'previousCertifiedFifth':sum(r['baselineFifthWasCertified'] for r in rows),'fifthDisplaced':[r['key'] for r in rows if r['fifthDisplaced']],
  'rows':rows}
 (ROOT/'product-evaluation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:v for k,v in result.items() if k not in ['rows','focusThree']}))
