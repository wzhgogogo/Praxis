from pathlib import Path
import json, hashlib, re

root = Path('/private/tmp/praxis-fix-phase2c-location-semantic')
base = root / '.eval-artifacts/checkpoint-c-live-20261020'
out = root / '.eval-artifacts/phase2c-location-semantic-20261023'
out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
scopes = [
 ('DEVELOPMENT',base/'checkpoint-c-rerun-20261021/live-results'),
 ('DEVELOPMENT',base/'checkpoint-c-continuation-20261021/live-results'),
 ('DEVELOPMENT',base/'c17-timeout-retry-20261022'),
 ('EXPOSED_HOLDOUT1',base/'holdout-exit-20261022/continuation-20261022/live-results'),
 ('EXPOSED_HOLDOUT2',base/'phase2b-continuation-20261022/resume-20261023/exit-live'),
]
locations=[]; requests={}; failures=[]
def local(p):
    return root / ('.eval-artifacts/'+str(p).split('.eval-artifacts/',1)[1])
for cohort,directory in scopes:
 for result in sorted(directory.rglob('*.result.json')):
  if '/runner/' not in str(result): continue
  data=json.loads(result.read_text())
  if 'finalSnapshot' not in data: continue
  source={'path':str(result.relative_to(root)),'sha256':sha(result.read_bytes()),'runId':data['runId'],'cohort':cohort}
  state=data['finalSnapshot']['domainState']; area=state.get('intentDraft',{}).get('area',{})
  evidence=[e for e in state.get('readEvidence',[]) if e.get('claims',{}).get('locationResolutionSource')=='GOOGLE_TEXT_SEARCH']
  failed=[e for e in data.get('events',[]) if e['event'].get('type')=='SEARCH_FAILED' and str(e['event'].get('code','')).startswith('GOOGLE_LOCATION_')]
  observations=[]
  for event in failed:
   reason=event['event']['reason']
   # Reconstruct only the public observation string actually saved by the resolver.
   pattern=r'name=("(?:[^"\\]|\\.)*") address=("(?:[^"\\]|\\.)*") types=("(?:[^"\\]|\\.)*") placeId=("(?:[^"\\]|\\.)*") coordinate=("(?:[^"\\]|\\.)*")'
   for m in re.finditer(pattern,reason):
    name,address,types,pid,point=[json.loads(x) for x in m.groups()]
    if ',' not in point: continue
    lat,lng=map(float,point.split(','))
    observations.append({'id':pid,'displayName':{'text':name},'formattedAddress':address,'types':types.split(','),'location':{'latitude':lat,'longitude':lng}})
   failures.append({'source':source,'area':area,'eventId':event['id'],'event':event['event'],'observedPlaces':observations,'rawHttpBodySaved':False,'rawHttpStatusSaved':False})
  locations.append({'source':source,'area':area,'recordedSuccessEvidence':evidence,'recordedFailure':failed,'observedPlaces':observations,'responseScope':'BOUNDED_PUBLIC_FAILURE_OBSERVATIONS' if observations else 'RECORDED_EMPTY_LIST' if any('no returned places' in e['event']['reason'] for e in failed) else 'SELECTED_PROJECTION_ONLY_NO_RANKED_RESPONSE' if evidence else 'NOT_OBSERVED','runtimeCommit':data['runtimeContext']['commitSha'],'evaluationLocation':data.get('limits',{}).get('evaluationLocation'),'googleUsage':data.get('resourceUsage',{}).get('googleRequests')})
  capture=data.get('decisionCapture',{}).get('path')
  if not capture: continue
  capture=local(capture)
  for line in capture.open():
   row=json.loads(line)
   if row.get('purpose')!='restaurant_semantic_interpret':continue
   user=next(m['content'] for m in row['messages'] if m['role']=='user')
   prefix='User restaurant message as JSON string: '
   if not user.startswith(prefix):raise ValueError('Unexpected semantic request envelope')
   message=json.loads(user[len(prefix):])
   key=(cohort,data['caseId'])
   item={'id':cohort+':'+data['caseId'],'cohort':cohort,'message':message,'referenceTime':data['materializedCase']['reference_time'],'timezone':'Asia/Tokyo','source':source,'decisionCapture':{'path':str(capture.relative_to(root)),'sha256':sha(capture.read_bytes()),'sequence':row['sequence']},'originalPromptVersion':row['promptVersion'],'originalSemanticProposal':data.get('semantic',{}).get('proposal'),'originalRequestMessages':row['messages']}
   if key not in requests:requests[key]=item
   break
assert len(locations)==56,len(locations)
assert len(requests)==18,len(requests)
assert len([f for f in failures if f['area'].get('query')=='near Ebisu'])==3
for n,v in [('location-inputs.json',{'schema':'phase2c-saved-location-inputs@1','runs':locations,'scope':'Only the exposed C, first holdout and Phase2b holdout result/capture directories; no new holdout searched.'}),('semantic-inputs.json',{'schema':'phase2c-exposed-semantic-inputs@1','cases':list(requests.values()),'cohorts':{'DEVELOPMENT':6,'EXPOSED_HOLDOUT1':6,'EXPOSED_HOLDOUT2':6},'plannedRepetitionsPerVersion':3,'beforeAfterCallCeiling':108,'totalBatchModelCeiling':150}),('location-failure-evidence.json',failures)]:
 (out/n).write_text(json.dumps(v,ensure_ascii=True,indent=2)+'\n')
fixture=[]
for query in ['near Ningyocho','near Shimbashi']:
 matches=[r for r in locations if r['area'].get('query')==query and r['observedPlaces']]
 assert matches,query
 fixture.append({'query':query,'places':matches[0]['observedPlaces'],'provenance':matches[0]['source']})
p=root/'src/integrations/google/fixtures/phase2c-location-observations.json'
p.write_text(json.dumps({'evidenceStatus':'EXPOSED_SAVED_FAILURE_OBSERVATIONS_NOT_FULL_HTTP_RESPONSES','observations':fixture},ensure_ascii=True,indent=2)+'\n')
names=['Shibuya','Shinjuku','Ikebukuro','Ueno','Asakusa','Akihabara','Kanda','Tokyo Station','Ginza','Higashi-Ginza','Ningyocho','Nihonbashi','Shimbashi','Shinbashi','Ebisu','Nakameguro','Kagurazaka','Kichijoji','Jiyugaoka','Koenji','Shimokitazawa','Sangenjaya','Gotanda','Meguro','Yotsuya','Akasaka','Ochanomizu','Aoyama-itchome','Aoyama Itchome','Omotesando']
assert len(names)==30
checks={'schema':'phase2c-google-location-checks@1','names':names,'requestRule':'Each once, AREA=near <name>, production named-location resolver, one Text Search call, no model, no restaurant site, no extra lookup/retry.','context':{'latitude':35.6697,'longitude':139.7670,'radiusMeters':1000},'contextProvenance':'Previously authorized Higashi-Ginza evaluation point; explicit Tokyo-context control for this list, not fabricated historical Ebisu context.','successRule':'Returned geographic type with finite coordinates, within the unchanged100km context ceiling; ambiguous separated leading geographic results rejected.','target':29,'maximumGoogleRequests':30}
(out/'google-30-inputs.json').write_text(json.dumps(checks,ensure_ascii=True,indent=2)+'\n')
(out/'input-shas.json').write_text(json.dumps({str(p.relative_to(root)):sha(p.read_bytes()) for p in [out/'location-inputs.json',out/'semantic-inputs.json',out/'location-failure-evidence.json',out/'google-30-inputs.json',root/'src/integrations/google/fixtures/phase2c-location-observations.json']},indent=2)+'\n')
print(json.dumps({'savedRuns':len(locations),'semanticCaseFamilies':len(requests),'semanticBeforeAfterCalls':108,'googleList':30,'googleListSha256':sha((out/'google-30-inputs.json').read_bytes()),'newModelCalls':0,'newGoogleRequests':0}))
