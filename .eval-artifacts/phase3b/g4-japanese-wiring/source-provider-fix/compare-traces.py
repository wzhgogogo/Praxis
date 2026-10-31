from pathlib import Path
import base64,copy,hashlib,json,sys
r=Path('.eval-artifacts/phase3b/g4-japanese-wiring/source-provider-fix')
def traces(name):
 rows={};encoded={}
 for line in (r/name).read_text().splitlines():
  if 'SOURCE_PROVIDER_TRACE ' in line:
   payload=line.split('SOURCE_PROVIDER_TRACE ',1)[1];row=json.loads(base64.b64decode(payload));rows[row['id']]=row['result'];encoded[row['id']]=payload
 return rows,encoded
def diagnostic(name):
 return json.loads(next(line.split('G4_JAPANESE_DIAGNOSTIC ',1)[1] for line in (r/name).read_text().splitlines() if 'G4_JAPANESE_DIAGNOSTIC ' in line))
a,araw=traces('red.log');b,braw=traces('green.log')
expected={'tablecheck-fails-tabelog-succeeds':'TABELOG','tabelog-fails-tablecheck-succeeds':'TABLECHECK','tablecheck-direct':'TABLECHECK','tabelog-direct':'TABELOG','both-fail':None}
assert set(a)==set(b)==set(expected)
results=[]
for key,target in expected.items():
 old,new=a[key],b[key];oc=next(iter(old['availabilityChecks'].values()));nc=next(iter(new['availabilityChecks'].values()))
 assert 'sourceProvider' not in oc
 if target:
  assert nc['sourceProvider']==target
  stripped=copy.deepcopy(new);next(iter(stripped['availabilityChecks'].values())).pop('sourceProvider')
  assert stripped==old,key
  assert json.dumps(stripped,separators=(',',':'))==json.dumps(old,separators=(',',':'))
  if key.endswith('-direct'):assert old['metadata']['provider']==target
 else:
  assert 'sourceProvider' not in nc and old==new and araw[key]==braw[key]
 assert oc['sourceAttempts']==nc['sourceAttempts']
 results.append({'case':key,'sourceBefore':None,'sourceAfter':target,'sourceAttemptsIdentical':True,'allOtherFieldsIdentical':True,'singleSourceEffectiveProviderUnchanged':key.endswith('-direct')})
red,green=diagnostic('red.log'),diagnostic('green.log')
assert red['phase']==green['phase']=='PRESENT_RESULTS' and red['handoffs']==0 and green['handoffs']==1
assert red['navigations']==green['navigations'] and red['evidence']==green['evidence']
assert red['resourceUsage']['googleRequests']==green['resourceUsage']['googleRequests']
assert red['resourceUsage']['modelCallsStarted']==green['resourceUsage']['modelCallsStarted']
assert set(red['checks'])==set(green['checks'])
for candidate in red['checks']:
 old,new=red['checks'][candidate],green['checks'][candidate]
 assert old['sourceProvider']=='AVAILABILITY_SOURCE_RESOLVER' and new['sourceProvider']=='TABELOG'
 old=copy.deepcopy(old);new=copy.deepcopy(new);old.pop('sourceProvider');new.pop('sourceProvider');assert old==new
value={'status':'PASS','mode':'FIXED_CLOCK_ADAPTER_AND_REAL_LOCAL_HTTP_WITH_FIXTURE_IO','cases':results,
 'ordinaryHTTP':{'phase':'PRESENT_RESULTS','handoffsBefore':0,'handoffsAfter':1,'sourceBefore':'AVAILABILITY_SOURCE_RESOLVER','sourceAfter':'TABELOG','allOtherCheckFieldsIdentical':True,'sourceNavigationEvidenceAndCallCountsIdentical':True,'exactB1URL':'Same independent literal asserted by unchanged ordinary HTTP test'},
 'realModel':0,'realGoogle':0,'realGET':0,'Live':0}
p=r/'gates/delta-verification.json'
if '--verify-only' in sys.argv:assert json.loads(p.read_text())==value
else:
 with p.open('x') as f:f.write(json.dumps(value,indent=2)+'\n')
print(json.dumps({'status':'PASS','cases':len(results),'ordinaryHTTPHandoffs':1,'sourceAttemptsIdentical':True,'realCalls':0}))
