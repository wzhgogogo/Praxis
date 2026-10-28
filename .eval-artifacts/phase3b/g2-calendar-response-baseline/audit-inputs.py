# -*- coding: utf-8 -*-
from pathlib import Path
import subprocess,json,hashlib,gzip,urllib.parse,base64
root=Path('.eval-artifacts/phase3b/g2-calendar-response-baseline');base='ba466eb3eff89cc3f934bafc2134a39c4b6d84ed'
def blob(path):return subprocess.check_output(['git','show',base+':'+path])
def sha(b):return hashlib.sha256(b).hexdigest()
files=['src/harness/browser/fixtures/dom-change/baseline.json','src/harness/browser/fixtures/dom-change/manifest.json','src/harness/browser/fixtures/tabelog-teppen-calendar-20260929.html','src/harness/browser/fixtures/tabelog-teppen-calendar-20260929.html.provenance.json','src/harness/browser/fixtures/tabelog-sen-no-slots-20261010.html','src/harness/browser/fixtures/tabelog-sen-no-slots-20261010.html.provenance.json','src/harness/browser/fixtures/tabelog-sen-no-slots-20261010.provenance.json','src/harness/browser/fixtures/tabelog-sen-no-slots-20261010.snapshot.json','src/harness/browser/fixtures/tabelog-sen-no-slots-20261010.snapshot.json.provenance.json','src/eval/restaurant/dom-change/run.ts','src/eval/restaurant/dom-change/classification.ts','src/eval/restaurant/dom-change/mutation.ts','src/harness/browser/dom-change.test.ts']
for case in ['teppen','sen']:
 files += ['src/harness/browser/fixtures/dom-change/tabelog-calendar-'+case+'.html.gz','src/harness/browser/fixtures/dom-change/tabelog-calendar-'+case+'.html.gz.provenance.json']
inputs=[{'git':base,'path':p,'sha256':sha(blob(p))} for p in files]
(root/'original-baseline.json').write_bytes(blob(files[0]))
source=json.loads(blob(files[1]));cases=[p for p in source['pages'] if p['id'] in ['tabelog-calendar-teppen','tabelog-calendar-sen']]
for case in cases:assert sha(gzip.decompress(blob(case['path'])))==case['sha256']
external=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/tabelog-lead-teppen-20260929');externalRows=[]
for p in sorted(external.iterdir()):
 raw=p.read_bytes();row={'path':str(p),'sha256':sha(raw),'size':len(raw)}
 if p.suffix=='.json':
  obj=json.loads(raw);row['keys']=list(obj);row['responseBodiesPresent']=any(key in obj for key in ['responses','responseBodies','bodies','har'])
  row['traffic']=[{'type':x.get('type'),'origin':urllib.parse.urlsplit(x.get('url','')).scheme+'://'+urllib.parse.urlsplit(x.get('url','')).netloc,'path':urllib.parse.urlsplit(x.get('url','')).path,'status':x.get('status'),'retainedFields':list(x)} for x in obj.get('traffic',[])]
 externalRows.append(row)
ready=next(x for x in externalRows if x['path'].endswith('/02-teppen-production-ready.json'));assert ready['sha256']=='24507cf76afffe58771da24e98f348996fdd94d7f502b4e5edcb6da4b4f5191d'
missing=['/Users/wangzhour/.codex/worktrees/p1-prelive-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791616284408','/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791616284408']
assert all(not Path(p).exists() for p in missing)
allFiles=subprocess.check_output(['git','ls-tree','-r','--name-only',base,'.eval-artifacts','src/harness/browser/fixtures'],text=True).splitlines()
recordings=[p for p in allFiles if p.endswith('recording.json') or p.endswith('.har')]
matches=[]; exact=[]
targets={case['sha256'] for case in cases}
for p in recordings:
 raw=blob(p); inputs.append({'git':base,'path':p,'sha256':sha(raw),'purpose':'same-capture archive audit'})
 obj=json.loads(raw); literal=[x for x in targets if x.encode() in raw]; bodies=[]
 for index,entry in enumerate(obj.get('log',{}).get('entries',[])):
  content=entry.get('response',{}).get('content',{}); text=content.get('text')
  if not isinstance(text,str):continue
  body=base64.b64decode(text) if content.get('encoding')=='base64' else text.encode()
  digest=sha(body)
  if digest in targets:bodies.append({'entry':index,'sha256':digest})
 if literal or bodies:exact.append({'path':p,'sha256':sha(raw),'literalShaMatches':literal,'bodyMatches':bodies})
 if b'hybrid-1791616284408' in raw or b'tabelog-lead-teppen-20260929' in raw:matches.append({'path':p,'sha256':sha(raw)})
# A URL/date match from a different run is deliberately insufficient.
audit={'schema':'g2-calendar-evidence-audit@1','base':base,'sameCaptureOriginals':'provenance-matched Teppen files; Sen retained HTML/text only','teppen':{'files':externalRows,'conclusion':'initial_vacancy HTTP200 metadata retained; no raw response body/HAR in exact capture directory; cannot infer any per-date status'},'sen':{'missingOriginalRecordingRoots':missing,'retainedSnapshotKeys':list(json.loads(blob('src/harness/browser/fixtures/tabelog-sen-no-slots-20261010.snapshot.json'))),'conclusion':'HTML/text/provenance retain no public data response; original recording absent'},'committedArchiveScan':{'scope':'recording.json / .har under fixed main .eval-artifacts','filesInspected':len(recordings),'sameRunIdentifierMatches':matches,'exactSourceHtmlShaMatching':{'filesInspected':len(recordings),'matches':exact}},'dates':[{'caseId':case['id'],'date':date,'outletUrl':case['sourceUrl'],'partySize':case['request']['partySize'],'rawResponse':None,'newExpectation':None,'meaning':'UNKNOWN','basis':'无公开证据：同次保存材料没有可绑定该日期/人数的响应正文'} for case in cases for date in case['dates']],'newRealCalls':0}
(root/'evidence-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n');(root/'historical-inputs-sha256.json').write_text(json.dumps({'gitInputs':inputs,'externalCaptureFiles':externalRows},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'sameCaptureResponseBodies':0,'dateCount':len(audit['dates']),'committedRecordingsChecked':len(recordings),'identifierMatches':matches},ensure_ascii=False))
