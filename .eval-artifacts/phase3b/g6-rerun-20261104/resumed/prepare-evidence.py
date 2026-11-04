"""Offline evidence binding only. Operator must review new raw identity/booking blocks first."""
import json,pathlib,hashlib,sys,datetime
from zoneinfo import ZoneInfo
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[3]
load=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,x):
 with p.open('x') as f:f.write(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
slot=sys.argv[1];assert slot in ['D4','D6','D8']
packPath=HERE.parent/(slot+'.pack.json');pack=load(packPath)
old=load(HERE.parents[1]/'g6-supplement-20261103'/(slot+'.evidence.json'))
cert=load(HERE/'certificates'/('W2' if slot=='D8' else 'W1')/'receipt.json')
assert cert['exists'] is True
now=datetime.datetime.now(ZoneInfo('Europe/Vienna'))
age=now.timestamp()-datetime.datetime.fromisoformat(cert['checkedAt'].replace('Z','+00:00')).timestamp();assert 0<=age<86400
assert cert['target']==pack['cases'][0]['witness']
ledgerPath=ROOT/'.eval-artifacts/phase3b/budget.json';b=load(ledgerPath);used=b['cumulative']['evaluationPublicGET']-255;assert 43<=used<58
records={}
for meta in (HERE/'certificates').rglob('*.body.json'):
 m=load(meta);p=meta.with_suffix('');assert sha(p)==m['sha256'];assert m['status']==200 and m['cookiesSent'] is False and m['retried'] is False
 records[str(p.resolve())]={'path':str(p.resolve()),'sha256':m['sha256']}
q=load(HERE.parents[1]/'g6-supplement-20261103'/(slot+'.oracle.json'))
for item in q['qualificationOracles']:
 item['evidenceRefs']=list(dict.fromkeys([*item['evidenceRefs'],cert['detailRef']]))
capture=HERE/(slot+'.capture.json');save(capture,{'publicGETAttempts':used,'sharedLedgerSHA256':sha(ledgerPath),'inheritedBeforeReruns':43,'newAttempts':used-43,'noNewRequestsInThisScript':True})
result={**old,'packSHA256':sha(packPath),'reviewedAt':now.isoformat(),'reviewer':'A public raw GET name/address/phone/online-block verification; prior user-confirmed qualification unchanged','publicGETAttempts':used,'captureRef':str(capture.resolve()),'captureSHA256':sha(capture),'getRecords':list(records.values()),'certificates':[cert],'oracles':{slot:q}}
save(HERE/(slot+'.evidence.json'),result)
print(json.dumps({'slot':slot,'packSHA256':sha(packPath),'evidenceSHA256':sha(HERE/(slot+'.evidence.json')),'publicGETs':used}))
