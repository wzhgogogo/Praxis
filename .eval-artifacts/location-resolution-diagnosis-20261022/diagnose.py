"""Saved public evidence only. No providers, environment files, or network imports."""
import hashlib, json, pathlib, subprocess, unicodedata

ROOT = pathlib.Path('.')
BATCH = pathlib.Path('.eval-artifacts/checkpoint-c-live-20261020')
OLD = BATCH / 'holdout-exit-20261022'
OUT = pathlib.Path('.eval-artifacts/location-resolution-diagnosis-20261022')

def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def ref(p): return {'path': str(p), 'sha256': sha(p)}
def get(p): return json.loads(pathlib.Path(p).read_text())
def norm(s): return ''.join(c for c in unicodedata.normalize('NFKD', s).lower() if c.isalnum())
def claims(a):
    rows = []
    def walk(x, pointer=''):
        if isinstance(x, dict):
            if 'locationResolutionQuery' in x: rows.append({'pointer': pointer, 'value': x})
            for k, v in x.items(): walk(v, pointer+'/'+k)
        elif isinstance(x, list):
            for i, v in enumerate(x): walk(v, pointer+'/'+str(i))
    walk(a)
    return rows

failures=[]
for run in ['h-04-attempt-1','h-10-attempt-2','h-16-attempt-1']:
    paths=list((OLD/'continuation-20261022/live-results'/run/'runner').glob('*.result.json'))
    assert len(paths)==1
    p=paths[0]; a=get(p)
    event=next((i,x['event']) for i,x in enumerate(a['events']) if x.get('event',{}).get('code')=='GOOGLE_LOCATION_UNRESOLVED')
    assert '"Nihonbashiningyocho"' in event[1]['reason']
    assert a['resourceUsage']['googleRequests']['namedPlaceResolution']==1
    assert a['resourceUsage']['googleRequests']['discovery']==0
    assert a['resourceUsage']['browserRuntimeCalls']==0
    failures.append({'run':run,'artifact':ref(p),'runtimeCommit':a['runtimeContext']['commitSha'],'eventPointer':f'/events/{event[0]}/event','failure':event[1],'areaQuery':a['finalSnapshot']['domainState']['intentDraft']['area']['query'],'latencyMs':a['latencyMs'],'searchWallMs':next(x['elapsedMs'] for x in a['stageTimings']['criticalPath'] if x['stage']=='SEARCH_RESTAURANTS'),'googleRequests':a['resourceUsage']['googleRequests'],'requestReconstruction':{'method':'POST','url':'https://places.googleapis.com/v1/places:searchText','textQuery':'Ningyocho','pageSize':10,'geographicBias':'No bound evaluationLocation: named NEAR request; requiresEvaluationLocation=false. No Tokyo/JP language or region restriction added.','provenance':'Pinned call chain; HTTP request/response bodies for these three production calls were not saved.'}})
assert len({r['runtimeCommit'] for r in failures})==1
comparators=[]
for name in ['Shimokitazawa','Kagurazaka']:
    paths=subprocess.run(['rg','-l','--glob','*.result.json',name,str(BATCH)],capture_output=True,text=True,check=True).stdout.splitlines()
    for p in paths:
        a=get(p); rows=[r for r in claims(a) if r['value']['locationResolutionQuery']==name]
        if rows:
            assert rows[0]['value']['resolvedPlaceName']==name
            comparators.append({'place':name,'kind':'SAVED_PRODUCTION_DISCOVERY_EVIDENCE','artifact':ref(p),'runtimeCommit':a['runtimeContext']['commitSha'],'claim':rows[0]});break
    else: raise AssertionError('Missing production comparator '+name)
centers=get(OLD/'centers.json')
for case in ['p2-holdout-02','p2-holdout-04']:
    c=next(r for r in centers['rows'] if r['caseId']==case)
    stem=OLD/'centers'/f'{case}.attempt-1'
    p=pathlib.Path(str(stem)+'.body.json'); m=pathlib.Path(str(stem)+'.metadata.json')
    assert sha(p)==c['sourceBodySha256']==get(m)['sha256']
    comparators.append({'place':c['query'],'kind':'INDEPENDENT_WITNESS_LOOKUP_NOT_PRODUCTION','body':ref(p),'metadata':ref(m),'returnedPlaces':get(p)['places'],'request':get(m)['requestBody'],'httpStatus':get(m)['status']})
# Failed runs and the diagnostic baseline have identical resolver/client implementations.
sources=[]
for p in ['src/integrations/google/google-places-restaurant-search.ts','src/integrations/google/google-places-client.ts','src/integrations/google/google-places-contracts.ts','src/eval/restaurant/agent-loop/evaluation-location-selection.ts']:
    historical=subprocess.check_output(['git','show',failures[0]['runtimeCommit']+':'+p])
    assert hashlib.sha256(historical).hexdigest()==sha(p)
    sources.append(ref(p))
assert norm('Ningyocho')!=norm('Nihonbashiningyocho')
report={'schema':'location-resolution-diagnosis@1','status':'DIAGNOSIS_ONLY_NO_REPAIR','contamination':'Old exposed holdout only; no new holdout accessed','baseline':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'failedRuns':failures,'comparators':comparators,'pinnedProductionFiles':sources,'networkRequests':0,'modelCalls':0,'productionChanges':0,'limits':['Production raw HTTP bodies/status/addressComponents not preserved for h-04/h-10/h-16. Error observation projection is original evidence; independent witness HTTP200 is a different request.','Jiyugaoka did not run as the production location: the approved fallback Sangenjaya did. Its successful saved Google lookup is only an independent source comparison.']}
(OUT/'evidence.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'failedRuns':len(failures),'comparators':len(comparators),'sourceShaChecks':len(sources),'network':0,'models':0}))
