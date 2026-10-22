"""Independent literal Gold/geometry audit of emitted production fixture reads."""
from pathlib import Path
import json,hashlib,math
P=Path(__file__).resolve().parent
raw=(P/'region-composition-results.json').read_bytes();data=json.loads(raw)
inputs=json.loads((P.parent/'p2-1c-region-20261020'/'inputs.json').read_text());gold=inputs['expectedTopRegionByCase']
rows=[]
for r in data['results']:
 read=r['read'];funnel=read['metadata']['nativeDiscoveryFunnel'];selected=funnel['directoryRegion']['first'];region=gold[r['caseId']]
 candidates=read['candidates'];location=read['continuation']['locationContext']
 distances=[]
 for c in candidates:
  p=c['restaurant']['coordinates'];a,b=map(math.radians,[p['lat'],location['latitude']]);dy=math.radians(p['lat']-location['latitude']);dx=math.radians(p['lng']-location['longitude'])
  distances.append(2*6371000*math.asin(math.sqrt(math.sin(dy/2)**2+math.cos(a)*math.cos(b)*math.sin(dx/2)**2)))
 expected='/'+region+'/'
 region_ok=expected in selected['url']
 outcome=region_ok and len(candidates)==1 and all(d<=location['radiusMeters'] for d in distances)
 within=funnel['sourceElapsedMs']<90000 and funnel['retrieval']['regionPages']<=4 and r['modelCalls']<=6
 current_refs=selected['url'] in r['pagesObserved'] and any(m['observation']['url']==selected['observedOn'] and any(t['ref']==selected['targetRef'] and t.get('href')==selected['url'] and 'OPEN_LINK' in t['availableActions'] for t in m['observation']['targets']) for m in r['modelInputs'])
 rows.append({'caseId':r['caseId'],'region':'SATISFIED' if region_ok else 'NOT_SATISFIED','controlledResult':'SATISFIED' if outcome else 'NOT_SATISFIED','budget':'SATISFIED' if within else 'NOT_SATISFIED','observedExecution':'SATISFIED' if current_refs else 'NOT_SATISFIED','selected':selected['url'],'sourceElapsedMs':funnel['sourceElapsedMs'],'regionPages':funnel['retrieval']['regionPages'],'scriptedModelCalls':r['modelCalls'],'googleFixtureCalls':r['googleCalls'],'distanceMeters':distances})
assert len(rows)==len(gold)==6
out={'status':'PASS' if all(all(r[k]=='SATISFIED' for k in ['region','controlledResult','budget','observedExecution']) for r in rows) else 'FAIL',
 'mode':'LOCAL_CHROMIUM_HAR_FIXTURE_WITH_SCRIPTED_MODEL','inputSha256':hashlib.sha256(raw).hexdigest(),'realModelCalls':0,'externalNetworkCalls':0,
 'layers':{'endToEnd':'NOT_EVALUATED: no final task delivery or live inventory','stages':'Region routing + production detail admission in six controlled variants','severity':'No unsupported region in these six controlled fixtures; live S0 remains NOT_EVALUATED','attribution':'Recorded source URL paths ground missing-name entrances; controls retain their observed routes'},'records':rows}
(P/'region-composition-evaluation.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False,indent=2))
if out['status']!='PASS':raise SystemExit(1)
