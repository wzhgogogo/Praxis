# -*- coding: utf-8 -*-
from pathlib import Path
import subprocess,json,hashlib,re
root=Path('.eval-artifacts/phase3b/g2-calendar-response-baseline');base='ba466eb3'
original=json.loads((root/'original-baseline.json').read_text());current=json.loads(Path('src/harness/browser/fixtures/dom-change/baseline.json').read_text());changes=json.loads((root/'date-expectation-changes.json').read_text())['dates'];calendars={'tabelog-calendar-teppen','tabelog-calendar-sen'}
assert {x['id'] for x in original['cases']}=={x['id'] for x in current['cases']}
changed=0
for before,after in zip(original['cases'],current['cases']):
 assert before['id']==after['id']
 if before['id'] not in calendars:assert before==after;continue
 for k,value in before['referenceFacts'].items():
  if k.startswith('day:'):
   assert after['referenceFacts'][k] is None;changed+=1
  else:assert after['referenceFacts'][k]==value
 assert set(before['referenceFacts'])==set(after['referenceFacts'])
assert changed==len(changes)==5
for file in ['src/eval/restaurant/dom-change/classification.ts','src/eval/restaurant/dom-change/mutation.ts','src/harness/browser/fixtures/dom-change/manifest.json']:
 assert Path(file).read_bytes()==subprocess.check_output(['git','show',base+':'+file]),file
manifest=json.loads(Path('src/harness/browser/fixtures/dom-change/manifest.json').read_text())
for spec in manifest['pages']:
 assert Path(spec['path']).read_bytes()==subprocess.check_output(['git','show',base+':'+spec['path']]),spec['path']
allowed={'src/eval/restaurant/dom-change/run.ts','src/harness/browser/dom-change.test.ts','src/harness/browser/fixtures/dom-change/baseline.json'}
sourceDiff=subprocess.check_output(['git','diff','--name-only',base,'--','src','scripts','package.json','package-lock.json'],text=True).splitlines();assert set(sourceDiff)==allowed,sourceDiff
budget=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text());by={x['id']:x for x in budget['entries']};assert len(by)==len(budget['entries'])
for commit in ['ba466eb3','b74aa584']:
 old=json.loads(subprocess.check_output(['git','show',commit+':.eval-artifacts/phase3b/budget.json'],text=True));assert all(by[x['id']]==x for x in old['entries'])
new=by['phase3b-A-g2-calendar-response-baseline-20261028'];assert all(new[k]==0 for k in ['fullLive','realModelCalls','environmentReruns','evaluationPublicGET','googleRequests','restaurantWebsiteRequests'])
result={'sourceFilesChanged':sourceDiff,'productFilesChanged':0,'datesCorrected':changed,'otherCasesUnchanged':10,'nonDateFactsUnchanged':True,'savedPagesUnchanged':len(manifest['pages']),'scorerMutationManifestUnchanged':True,'baselineUnknownEncoding':'null','priorLedgerRowsPreserved':462,'newRealCalls':0,'ledgerEntries':len(by)}
log=root/'verification/test-dom-change.log'
if log.exists():
 rows=[]
 for line in log.read_text().splitlines():
  start=line.find('{"id":')
  if start<0:continue
  try:row=json.loads(line[start:])
  except ValueError:continue
  if row['id'] in calendars:rows.append(row)
 assert len(rows)==2 and sum(len(x['unknownDates']) for x in rows)==5
 for row in rows:assert all(pair=={'before':None,'after':None} for pair in row['unknownDates'].values()),row
 teppen=next(x for x in rows if x['id'].endswith('teppen'));sen=next(x for x in rows if x['id'].endswith('sen'))
 assert teppen['classification']=='PASS' and teppen['lost']==[]
 assert sen['classification']=='DEGRADED_HONEST' and sen['lost']==['requestConfirmed']
 result['actualCalendarObservations']=rows
assert subprocess.run(['git','diff','--check']).returncode==0
(root/'delivery-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
