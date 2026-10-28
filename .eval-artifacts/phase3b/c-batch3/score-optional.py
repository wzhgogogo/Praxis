from pathlib import Path
import collections,datetime,hashlib,importlib.util,json
root=Path('.eval-artifacts/phase3b/c-batch3')
def load(p):return json.loads(Path(p).read_text())
spec=importlib.util.spec_from_file_location('frozen_source_oracle','.eval-artifacts/phase3b/c-batch2/score-search.py');oracle=importlib.util.module_from_spec(spec);spec.loader.exec_module(oracle)
execution=load(root/'optional/execution.json');gold={r['id']:r for r in load('.eval-artifacts/phase3b/c-batch2/gold.certified.json')['rows']}
rows=[]
for r in execution['results']:
    row={'id':r['subjectId'],'query':r['query'],'ledgerId':r['ledgerId'],'httpStatus':r.get('httpStatus')}
    if r.get('failure'):row.update(status='NOT_EVALUATED_SOURCE_FAILURE',failure=r['failure'])
    else:
        assert hashlib.sha256(Path(r['bodyPath']).read_bytes()).hexdigest()==r['sha256']
        url=load(r['bodyPath'].replace('.body.html','.started.json'))['url']
        evidence=oracle.inspect(Path(r['bodyPath']).read_text(),url,r['query'])
        row['evidence']=evidence
        row['status']='UNKNOWN_STRUCTURE_CHANGED' if not evidence['queryVisible'] or not evidence['structureVerified'] else 'HIT' if gold[r['subjectId']]['rstId'] in evidence['ids'] else 'MISS_IN_THIS_FIRST_PAGE'
    rows.append(row)
result={'schema':'phase3b-c-optional-evaluation@1','evaluatedAtCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),'mode':'EVALUATION_PUBLIC_GET_ONLY_NO_LIVE','executionStatus':execution['status'],'planned':execution['planned'],'requested':execution['sourceRequests'],'counts':dict(collections.Counter(r['status'] for r in rows)),'rows':rows,'limit':'First-page certified ID and visible heading+ItemList only; historical originals are not contemporary paired controls. No identity, inventory or whole15 uplift claim.'}
(root/'optional/evaluation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='rows'},ensure_ascii=False))
