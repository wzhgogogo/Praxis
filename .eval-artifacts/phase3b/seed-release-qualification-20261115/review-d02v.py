"""Review the current run's actual source DOM and HAR without using product qualification."""
from pathlib import Path
import json,re,math,hashlib
root=Path(__file__).resolve().parent
slot=root/'d02v/live/runtime/dev-d02v-release-20261115'
read=lambda p:json.loads(p.read_text())
inp=read(slot/'evaluation.input.json')
page=next(p for p in inp['pages'] if p['sourceIdentity']['sourceEntityId']=='13309182')
rec=Path(read(slot/'recording-observation.json')['recordingPath'])
html= (rec/'diagnostic/snapshot-0011.html').read_text()
scripts=re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',html,re.S)
objects=[json.loads(s) for s in scripts]
restaurant=next(o for o in objects if o.get('@type')=='Restaurant')
assert restaurant['name']==page['sourceIdentity']['name']
assert 'Robatayaki' in restaurant['servesCuisine']
assert page['sourceIdentity']['address'] in html
assert '/13309182/' in page['sourceIdentity']['canonicalUrl']
har=read(rec/'replay.har')['log']['entries']
geocodeIndex,geocode=next((i,json.loads(e['response']['content']['text'])) for i,e in enumerate(har) if 'googleapis.com' in e['request']['url'] and json.loads(e['response']['content']['text']).get('places',[{}])[0].get('id')=='ChIJo9BwwI_yGGARzEFspqeGj3Q')
center=geocode['places'][0]['location'];geo=restaurant['geo']
a,b,c,d=map(math.radians,[center['latitude'],center['longitude'],geo['latitude'],geo['longitude']])
distance=6371000*2*math.asin(math.sqrt(math.sin((c-a)/2)**2+math.cos(a)*math.cos(c)*math.sin((d-b)/2)**2))
assert distance<=1000
annotation={'schema':'phase3b-holdout-review@1','attemptKey':'dev-d02v-release-20261115','annotations':{'qualificationOracles':[{'name':restaurant['name'],'nativeIdentity':page['sourceIdentity'],'hardCriteriaMet':True,'withinArea':True,'evidenceRefs':[page['ref']]}]}}
file=Path('/private/tmp/praxis-seed-release-20261115-review-d02v.json')
file.write_text(json.dumps(annotation,ensure_ascii=False,indent=2)+'\n')
(root/'d02v/review-annotation.json').write_bytes(file.read_bytes())
(root/'d02v/independent-qualification.json').write_text(json.dumps({'source':'same-run saved source HTML and source HAR; no product HARD/HIGH conclusion','sourceDocument':str(rec/'diagnostic/snapshot-0011.html'),'htmlSHA256':hashlib.sha256(html.encode()).hexdigest(),'sourceIdentity':page['sourceIdentity'],'sourceCategory':restaurant['servesCuisine'],'geo':geo,'observedCenter':center,'centerSourceHARIndex':geocodeIndex,'distanceMeters':distance,'maximumRadiusMeters':1000,'semanticReview':'The source classification explicitly says Robatayaki, satisfying the requested positive HARD cuisine. The recorded shop is within the request radius.','annotationSHA256':hashlib.sha256(file.read_bytes()).hexdigest()},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'distanceMeters':round(distance),'classification':restaurant['servesCuisine'],'externalCalls':0}))
