from pathlib import Path
import json,hashlib,statistics
r=Path(__file__).parent
rows=[]
for mode in ['TC-NODE','TC-BROWSER','W1-NODE','W1-BROWSER','D4-CAPTURE','D4-CAPTURE-GET']:
 p=r/'recordings'/mode;d=json.loads((p/'result.json').read_text());trace=json.loads((p/'timeline.json').read_text());paired=json.loads((p/'paired-timing.json').read_text());rec=json.loads((p/'source/recording.json').read_text())
 transfers=[x for x in paired if x['kind'] in ['NODE_FETCH_START','BROWSER_CONTINUE_START']]
 docs=[x for x in transfers if x.get('resourceType')=='document']
 boundaries=[]
 for e in trace:
  if e['kind']=='GUARD_TRANSPORT_START':boundaries.append(e['detail'])
 for e in paired:
  if e['kind']=='BROWSER_CONTINUE_START':boundaries.append(e)
 # This audits performed transfer intents; the rejected D4 document is not a dispatched transfer.
 forbidden=[e for e in boundaries if any('/'+s+'/' in e['url'].lower()+'/' for s in ['yoyaku','reserve','confirm','payment','checkout','login','account'])]
 assert not forbidden,(mode,forbidden)
 rows.append({'mode':mode,'status':d['status'],'transport':d['transport'],'navigationDclMs':d.get('navigationDclMs'),'responseDrain':d.get('responseDrain'),'pageReads':d['pageReads'],'documentTransfers':len(docs),'totalTransportStarts':len(transfers),'error':d.get('error'),'guardErrors':[x for x in d['guardDiagnostics'] if x.get('error')],'guardDocumentRejections':[x for x in d['guardDiagnostics'] if x['resourceType']=='document'],'recording':rec['replay'],'pageQualifications':rec['pages'],'forbiddenTransfers':forbidden,'directory':str(p),'resultSha256':hashlib.sha256((p/'result.json').read_bytes()).hexdigest()})
ledger=json.loads((r.parent/'budget-C.json').read_text());old=json.loads((r.parent/'budget-baseline.json').read_text())
assert len([x for x in ledger['entries'] if x['probe'].startswith(('TC-','W1-'))])==4
assert len([x for x in ledger['entries'] if x['probe'].startswith('D4-CAPTURE')])==2
assert all(b['startedAtEpochMs']-a['startedAtEpochMs']>=5000 for a,b in zip(ledger['entries'],ledger['entries'][1:]))
summary={'mode':'REAL_READONLY_CONTROL_AND_CAPTURE_NOT_FINAL_LIVE','rows':rows,'currentStop':'UNCHANGED_GUARD_REJECTS_PUBLIC_SEARCH_genre_name','realModelCalls':0,'googleRequests':0,'fullLive':0,'newPageReads':6,'cumulativeSessionReads':len(ledger['entries']),'remainingOriginalProbeReads':15-len(ledger['entries']),'sharedGET':old['cumulative']['evaluationPublicGET']+len(ledger['entries']),'holdoutReservedGET':108}
(r/'analysis.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='rows'},indent=2))
