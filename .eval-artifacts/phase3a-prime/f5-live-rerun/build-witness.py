#!/usr/bin/env python3
"""Build current witness inputs from the just-retained public GET responses."""
import datetime as dt, hashlib, json, pathlib
HERE=pathlib.Path(__file__).resolve().parent
def read(p):return json.loads(p.read_text())
def save(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
cert=read(HERE/'certification/certificate.json')
assert cert['status']=='WITNESS_EXISTS','WITNESS_NO_LONGER_EXISTS_STOP'
proof=next(row for row in cert['results'] if row['status']=='CERTIFIED_PRELIVE')
base=read(HERE/'identity-registry-base.json')['variants'][0]['witnesses'][0]
identity=proof['identityGeographyCategory']
assert identity['address']==base['address'],'PUBLIC_ADDRESS_CHANGED_STOP'
assert identity['name']==base['outletName'] and identity['distanceMeters']<=1000
own=proof['vacancy'];body=HERE.parents[2]/own['bodyPath']
assert hashlib.sha256(body.read_bytes()).hexdigest()==own['sha256']
save(HERE/'certification/vacancy.normalized.json',{'method':'GET','url':own['url'],'status':own['status'],'finishedAt':own['finishedAtVienna'],'sha256':own['sha256']})
save(HERE/'witness-manifest.json',{'rows':[{'name':identity['name'],'parameters':{'rst_id':proof['rst_id']},'bodyPath':str(body),'metadataPath':str(HERE/'certification/vacancy.normalized.json'),'sha256':own['sha256']}]})
base.update({'address':identity['address'],'distanceMeters':identity['distanceMeters'],'hardEvidence':[{'criterion':'kushikatsu','quote':'\n'.join(identity['categoryQuotes'])}]})
base['identityAudit']['freshPublicDetailSha256']=proof['detail']['sha256']
valid=(dt.datetime.fromisoformat(cert['certifiedAtVienna'])+dt.timedelta(hours=24)).isoformat()
save(HERE/'witness-registry.json',{'schema':'f5-witness-identity@2','status':'frozen regression / exposed; fresh certification applies only in its recorded window','validUntil':valid,'variants':[{'variantId':'f5-case01-rerun-20261104','center':cert['center'],'classification':'KNOWN_FEASIBLE_SUPPORTED','request':cert['date']+' 19:00 x2 '+(HERE/'p2c-holdout-01.content.txt').read_text().strip(),'witnesses':[base]}]})
print(json.dumps({'status':'FRESH_WITNESS_INPUTS_READY','address':identity['address'],'validUntil':valid,'requests':0},ensure_ascii=False))
