"""Offline, deterministic evidence inheritance. Does not send requests or alter scores."""
import pathlib,json,hashlib,sys,datetime
from zoneinfo import ZoneInfo
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[3]
BASE=HERE.parent
load=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,value):
 with p.open('x') as f:f.write(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
slot=sys.argv[1]
assert slot in ['D3','D5','D2','D8']
now=datetime.datetime.now(ZoneInfo('Europe/Vienna'))
assert now.date()<=datetime.date(2026,11,4),'Visit date outside approved 7–14 day window'
pack=load(HERE/(slot+'.pack.json'))
old=load(BASE/'d6-turn-budgets/reviewed-evidence.json')
ledger=load(ROOT/'.eval-artifacts/phase3b/budget.json')
used=ledger['cumulative']['evaluationPublicGET']-255
assert 15<=used<25,('Development GET capacity',used)
records={str(pathlib.Path(r['path']).resolve()):r for r in old['getRecords']}
for directory in [BASE/'d6-turn-budgets/runs/D6/witness',HERE/'runs',HERE/'w2-certification']:
 for meta in directory.rglob('*.body.json'):
  m=load(meta);body=meta.with_suffix('');assert sha(body)==m['sha256']
  assert m['status']==200 and m['cookiesSent'] is False and m['retried'] is False
  records[str(body.resolve())]={'path':str(body.resolve()),'sha256':m['sha256']}
if slot in ['D3','D5']:
 cert=old['certificates'][0]
else:
 cert=load(HERE/'w2-certification/receipt.json')
 assert cert['exists'] is True
 detail=ROOT/cert['detailRef'] if not pathlib.Path(cert['detailRef']).is_absolute() else pathlib.Path(cert['detailRef'])
 records[str(detail.resolve())]={'path':str(detail.resolve()),'sha256':cert['detailSHA256']}
age=now.timestamp()-datetime.datetime.fromisoformat(cert['checkedAt'].replace('Z','+00:00')).timestamp()
assert 0<=age<86400,('Certificate outside24h',age)
assert cert['target']['sourceEntityId']==pack['cases'][0]['witness']['sourceEntityId']
assert cert['target']['time']==pack['cases'][0]['witness']['time']
for r in records.values():assert sha(pathlib.Path(r['path']))==r['sha256']
assert len(records)<=used
capture=HERE/(slot+'.capture-inheritance.json')
save(capture,{'publicGETAttempts':used,'sharedLedgerSHA256':sha(ROOT/'.eval-artifacts/phase3b/budget.json'),'inheritedD6PostGETs':5,'noNewRequests':True,'recordCount':len(records)})
out={**old,'packSHA256':sha(HERE/(slot+'.pack.json')),'publicGETAttempts':used,'captureRef':str(capture),'captureSHA256':sha(capture),'getRecords':list(records.values()),'certificates':[cert],'oracles':{slot:load(HERE/(slot+'.oracle.json'))}}
save(HERE/(slot+'.evidence.json'),out)
print(json.dumps({'slot':slot,'packSHA256':out['packSHA256'],'evidenceSHA256':sha(HERE/(slot+'.evidence.json')),'publicGETs':used,'certificateAgeSeconds':round(age)}))
