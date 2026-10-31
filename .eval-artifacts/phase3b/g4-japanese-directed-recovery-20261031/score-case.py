"""Gold is opened only after the production identity-prefix result is frozen."""
from pathlib import Path
from urllib.parse import urlparse
import hashlib,json,re,sys
R=Path('.eval-artifacts/phase3b/g4-japanese-directed-recovery-20261031')
sid=sys.argv[-1];row=json.loads((R/'execution'/f'{sid}.json').read_text())
for f in json.loads((Path('.eval-artifacts/phase3b/g4-japanese-directed-20261031')/'oracle-freeze.json').read_text())['files']:assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256']
gold=json.loads(Path('.eval-artifacts/phase3b/g4-e2e/gold.json').read_text())
expected=next(r['rstId'] for r in gold['rows'] if r['id']==sid)
def ident(url):
 u=urlparse(url or '');m=re.fullmatch(r'/(?:en/)?[a-z-]+/A\d+/A\d+/(\d+)/?',u.path)
 return m[1] if u.scheme=='https' and u.netloc=='tabelog.com' and m and not u.query else None
accepted=row['observedAcceptedUrl'];actual=ident(accepted)
wrong=bool(accepted and actual!=expected)
proof=any(r.get('bodyPath') and ident(r['url'])==actual for r in row['details']) if accepted else False
for read in row['reads']:
 if read.get('bodyPath'):assert hashlib.sha256(Path(read['bodyPath']).read_bytes()).hexdigest()==read['sha256']
if wrong:verdict='WRONG_ACCEPTED'
elif accepted and not proof:verdict='UNSUPPORTED_ACCEPTANCE_S0'
elif row['environmentFailures']:verdict='ENVIRONMENT_FAILURE'
elif row['uncertainties']:verdict='NOT_EVALUATED'
elif accepted:verdict='CORRECT_ACCEPTED'
else:verdict='NOT_ACCEPTED'
queries=[]
for q in row['queries']:
 queries.append({**{k:v for k,v in q.items() if k!='ordered'},'certifiedOnFirstPage':any(ident(o['sourceUrl'])==expected for o in q['ordered'])})
jp=next((q for q in row['queries'] if q['source']=='JAPANESE'),None)
third=verdict=='CORRECT_ACCEPTED' and jp is not None and any(ident(r['url'])==actual and r['discoveryQuery']==jp['query'] for r in row['details'])
value={'id':sid,'verdict':verdict,'certifiedId':expected,'observedAcceptedId':actual,'independentReadProof':proof,'thirdTermContributedAcceptance':third,
 'thirdTermCausalScope':'First production HIGH comes from a detail opened under the Japanese query; no claim about a separate full-five two-word counterfactual.',
 'queries':queries,'details':row['details'],'actuallyAcquiredDetails':row['actualAcquiredDetails'],'uncertainties':row['uncertainties'],'environmentFailures':row['environmentFailures'],'sourceNetworkCallsInEvaluation':0,'inventoryEvaluated':False}
(R/'evaluation').mkdir(exist_ok=True)
with (R/'evaluation'/f'{sid}.json').open('x') as f:f.write(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:value[k] for k in ['id','verdict','thirdTermContributedAcceptance']}))
if verdict in ['WRONG_ACCEPTED','UNSUPPORTED_ACCEPTANCE_S0']:
 p=R/'state.json';state=json.loads(p.read_text());state['status']='STOPPED';state['stop']='S0_'+verdict;p.write_text(json.dumps(state,indent=2)+'\n');sys.exit(2)
