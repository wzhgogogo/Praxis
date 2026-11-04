from pathlib import Path
import json,csv,hashlib,statistics
r=Path(__file__).parent
files=sorted(r.glob('phase3b-B-w1-timeline-*-20261104.json'))
summary=[];browser=[];transports=[]
for f in files:
 p=json.loads(f.read_text());base={'id':p['id'],'sha':p['sha'],'startedAtCET':p['startedAtCET'],'completedAtCET':p['completedAtCET'],'title':p['title'],'busy':p['busy'],'challenge':p['challenge'],'websiteAdmitted':p['websiteAdmitted']}
 if p['kind']=='HTTP':
  summary.append({**base,'group':'http','documentFirstByteMs':p['document']['firstByteMs'] if p['document']['status'] else None,'documentEndMs':p['document']['endMs'] if p['document']['status'] else None,'documentStatus':p['document']['status'],'httpVersion':p['document']['httpVersion'],'dclMs':None,'loadMs':None,'endReason':p['navigationEndReason'],'lastBeforeDcl':None,'lastMainFrameBeforeDcl':None});continue
 events=p['trace'];starts={x['detail']['requestId']:x['detail'] for x in events if x['kind']=='NETWORK_REQUEST_START'}
 headers={x['detail']['requestId']:x['detail'] for x in events if x['kind']=='NETWORK_RESPONSE_HEADERS'}
 ends={x['detail']['requestId']:x['detail'] for x in events if x['kind']=='NETWORK_REQUEST_END'}
 docs=[x for x in starts.values() if x['resourceType']=='Document' and x['urlSha256']==hashlib.sha256(p['url'].encode()).hexdigest()];doc=docs[0] if docs else None
 t0=doc['browserTimestamp'] if doc else None;rows=[]
 for key,s in starts.items():
  h=headers.get(key,{});e=ends.get(key,{});st=s['browserTimestamp'];end=e.get('browserEndTimestamp');ht=h.get('cdpTimestamp')
  scriptFlags=[{k:x[k] for k in ['async','defer','type','inHead']} for x in p['scripts'] if x['src'] and x['srcSha256']==s['urlSha256']]
  row={**base,'group':p['configuration'],'requestId':key,'resourceType':s['resourceType'],'url':s['url'],'urlSha256':s['urlSha256'],'frameId':s['frameId'],'navigationAssociation':s['navigationAssociation'],'startBrowserTimestamp':st,'endBrowserTimestamp':end,'startMs':None if t0 is None else (st-t0)*1000,'headersMs':None if t0 is None or ht is None else (ht-t0)*1000,'endMs':None if t0 is None or end is None else (end-t0)*1000,'durationMs':None if end is None else (end-st)*1000,'status':h.get('status',e.get('status')),'outcome':e.get('outcome','NO_END_OBSERVED'),'reason':e.get('endReason'),'endObservation':e.get('endObservation'),'scriptFlags':scriptFlags}
  rows.append(row);browser.append(row)
 dcl=(p.get('dcl') or {}).get('browserTimestamp');load=(p.get('load') or {}).get('browserTimestamp')
 prior=[x for x in rows if dcl is not None and x['endBrowserTimestamp'] is not None and x['endBrowserTimestamp']<=dcl]
 same=[x for x in prior if doc and x['frameId']==doc['frameId']]
 last=lambda xs:max(xs,key=lambda x:x['endBrowserTimestamp']) if xs else None
 minimal=lambda x:None if x is None else {k:x[k] for k in ['requestId','resourceType','url','urlSha256','startMs','endMs','durationMs','outcome','status','scriptFlags']}
 navends=[x['detail'] for x in events if x['kind']=='NAVIGATION_END' and x['detail'].get('observationPoint')!='DOCUMENT_NETWORK_ONLY'];navend=navends[-1] if navends else {}
 dr=next((x for x in rows if doc and x['requestId']==doc['requestId']),None)
 pending=[minimal(x) for x in rows if x['endBrowserTimestamp'] is None]
 summary.append({**base,'group':p['configuration'],'documentFirstByteMs':dr['headersMs'] if dr else None,'documentEndMs':dr['endMs'] if dr else None,'documentStatus':dr['status'] if dr else None,'dclMs':None if dcl is None or t0 is None else (dcl-t0)*1000,'loadMs':None if load is None or t0 is None else (load-t0)*1000,'endReason':navend.get('endReason','UNKNOWN'),'loadObservationError':p.get('loadError'),'inspectionError':p.get('inspectionError'),'lastBeforeDcl':minimal(last(prior)),'lastMainFrameBeforeDcl':minimal(last(same)),'browserRequests':len(rows),'scriptRequests':sum(x['resourceType']=='Script' for x in rows),'pendingPhysicalEnds':pending,'bodyTextLength':p['bodyTextLength'],'browserVersion':p.get('browserVersion'),'userAgent':p.get('userAgent')})
 ts={e['detail']['transportId']:e['detail'] for e in events if e['kind']=='GUARD_TRANSPORT_START'}
 te={e['detail']['transportId']:e['detail'] for e in events if e['kind']=='GUARD_TRANSPORT_END'}
 for key,s in ts.items():
  e=te.get(key,{})
  transports.append({'id':p['id'],'group':p['configuration'],'transportId':key,'resourceType':s['resourceType'],'url':s['url'],'urlSha256':s['urlSha256'],'startMsFromNavigation':s['monotonicMs']-p['navigationStartMonotonicMs'],'elapsedObservedMs':e.get('elapsedMs'),'status':e.get('status'),'outcome':e.get('outcome','NO_END_OBSERVED'),'endObservation':e.get('endObservation'),'errorName':e.get('errorName')})
def write_csv(name,rows):
 if not rows:return
 with (r/name).open('w') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n');w.writeheader()
  for x in rows:w.writerow({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(dict,list)) else v for k,v in x.items()})
write_csv('browser-requests.csv',browser);write_csv('guard-transports.csv',transports)
(r/'analysis.json').write_text(json.dumps({'samples':summary,'attribution':'Last completed by browser-clock timestamp is descriptive, not proof of causal blocking; curl TTFB differs from browser post-Guard headers observation.','sourceHashes':{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in files}},indent=2,ensure_ascii=False)+'\n')
for x in summary:
 print(x['id'],{k:round(x[k],2) if isinstance(x[k],float) else x[k] for k in ['documentFirstByteMs','documentEndMs','dclMs','loadMs','endReason']},'last=',x['lastMainFrameBeforeDcl'])
