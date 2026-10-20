import json,gzip,hashlib,re,statistics,subprocess
from pathlib import Path
from datetime import datetime
base=Path('.eval-artifacts/name-resolution-benchmark-20261019');out=base/'live-20261020'
read=lambda p:json.loads(Path(p).read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
original=base/'samples.json';assert sha(original)=='89ce49a49e428e84c5a4caed8831bf8ca98d1c06566d384879f8ce42992d0f87'
samples=read(original)['samples'];selected=[s for s in samples if s['platform']=='TABELOG'];byid={s['id']:s for s in selected};ledger=read(out/'ledger.json')
finished=[a for a in ledger['attempts'] if 'finishedAt'in a];stamp=lambda x:datetime.fromisoformat(x.replace('Z','+00:00')).timestamp()
keys=[(a['phase'],a['sampleId'])for a in ledger['attempts']];assert len(keys)==len(set(keys))
gaps=[]
for left,right in zip(ledger['attempts'],ledger['attempts'][1:]):
 assert 'finishedAt'in left
 value=stamp(right['startedAt'])-stamp(left['finishedAt']);assert value>=29.99,('SOURCE_CADENCE',left,right,value);gaps.append(value)
for block in ledger['sourceBlocks']:
 later=next((a for a in ledger['attempts'] if stamp(a['startedAt'])>stamp(block['at'])),None)
 if later:assert stamp(later['startedAt'])-stamp(block['at'])>=599.99
assert len(ledger['modelCalls'])<=150
modelrows=[a for a in finished if a['phase']=='method-a'];cert=[];methods=[]
for a in finished:
 assert a['sampleId']in byid
 row=read(out/a['phase']/a['sampleId']/'result.json')
 if a['phase']=='verify':cert.append(row)
 else:
  methods.append(row);real=sum(c['sampleId']==a['sampleId']for c in ledger['modelCalls']);assert real<=3
  if 'observation'in row:assert row['observation']['modelCalls']==real,('MODEL_COUNT',a['sampleId'],real,row['observation']['modelCalls'])
  if row.get('evaluation',{}).get('verdict')=='CORRECT':
   sample=byid[a['sampleId']];o=row['observation'];idof=lambda value:re.search(r'/A\d+/A\d+/(\d+)(?:/|$)',value)[1]
   assert idof(o['returnedUrl'])==idof(o['rawSelectedPageUrl'])==sample['expected']['outletId']
# Gold source/config bytes remain bound to their original committed version,
# while the separately approved method-A re-freeze is checked on disk.
old_commit='2260cc81ecc56128be294801ff77257a600dee7b'
for name,want in read(out/'freeze.json')['files'].items():
 data=subprocess.check_output(['git','show',old_commit+':'+name]);assert hashlib.sha256(data).hexdigest()==want,('GOLD_HISTORICAL_FREEZE',name)
current_freeze=read(out/'method-a-freeze.json')
for name,want in current_freeze['files'].items():assert sha(name)==want,('METHOD_A_CURRENT_FREEZE',name)
before=read(out/'ledger-before-method-a.json');assert ledger['attempts'][:30]==before['attempts'];assert len(before['attempts'])==30
certificate=read(out/'verify/certified-summary.json');assert certificate['status']=='COMPLETED';effective=[r for r in certificate['rows'] if r['status']=='VERIFIED'];assert len(effective)==29
assert not any(r['sampleId']=='nr-023' for r in methods)
assert len({r['sampleId']for r in methods})==len(methods)

selection=read('.eval-artifacts/checkpoint-c-integration-20261020/selection-recheck/summary.json');a_calls=len(ledger['modelCalls']);verified=[r for r in cert if r['status']=='VERIFIED'];dropped=[r for r in cert if r['status']=='DROPPED']
summary={'status':'RUNNING'if not ledger.get('stop')else'STOPPED','freezeCommit':ledger['codeCommit'],'sampleSha256':sha(original),'plannedTabelog':{'gold':30,'controls':5},'certification':{'attempted':len(cert),'verified':len(verified),'dropped':len(dropped),'notReached':30-len(cert),'effectiveVerified':len(effective),'effectiveDropped':30-len(effective),'manualAddressSidecar':'verify/manual-address-verification.json'},'methodA':{'attempted':len(modelrows),'models':a_calls,'perSubjectMax':3,'modelMax':150,'rows':[{k:v for k,v in r.items() if k in ['sampleId','role','observation','evaluation','boundary','status','error']}for r in methods]},'usage':{'selectionModels':selection['modelCalls'],'benchmarkModels':a_calls,'batchModels':selection['modelCalls']+a_calls,'google':0,'fullLive':0},'stop':ledger['stop'],'cadence':{'gapsChecked':len(gaps),'minimumSeconds':min(gaps)if gaps else None,'cooldownEvents':len(ledger['sourceBlocks'])},'frozenFilesVerified':len(current_freeze['files']),'historicalGoldFilesVerified':len(read(out/'freeze.json')['files']),'methodAFreezeCommit':ledger.get('methodAConfiguration',{}).get('codeCommit')}
if(out/'method-a/summary.json').exists():summary['status']=read(out/'method-a/summary.json')['status'];summary['methodA']['evaluation']=read(out/'method-a/summary.json').get('evaluation')
elif(out/'verify/summary.json').exists():summary['status']='GOLD_COMPLETE_METHOD_PENDING'if not ledger['stop']else'STOPPED'
(out/'audit-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
manifest={str(p):sha(p)for p in out.rglob('*')if p.is_file()and p.name not in ['artifact-manifest.json','audit-summary.json','report.md','summarize.py']}
(out/'artifact-manifest.json').write_text(json.dumps({'schema':'name-benchmark-output-manifest@1','files':manifest},indent=2)+'\n')
print(json.dumps({k:summary[k]for k in ['status','certification','usage','stop','cadence','frozenFilesVerified']},indent=2))
