from pathlib import Path
import json,csv,statistics,hashlib
root=Path(__file__).parent
p=json.loads((root/'results.json').read_text())
summary={'inputSha256':hashlib.sha256((root/'results.json').read_bytes()).hexdigest(),'probeSha':p['sha'],'mainRevision':p['mainRevision'],'primary':{},'paths':[],'faultControl':None}
with (root/'request-timing.csv').open('w') as out:
 w=csv.writer(out);w.writerow(['case','mode','path','isolatedRoute','dropFail','layer','id','type','url','startMs','endMs','durationMs','status','outcome','error'])
 for i,row in enumerate(p['rows']):
  for layer in ['pw','cdp']:
   for r in row[layer]:
    dur=(r['protocolEnd']-r['protocolStart'])*1000 if layer=='cdp' and r['protocolEnd'] is not None else r['endMs']-r['startMs'] if r['endMs'] is not None else None
    w.writerow([i,row['mode'],row['path'],row['isolatedRoute'],row['dropFail'],layer,r.get('key',r.get('id')),r['type'],r['url'],r['startMs'],r['endMs'],dur,r['status'],r.get('outcome','PENDING'),r['error']])
for mode in ['control','main','branch']:
 rows=[r for r in p['rows'] if r['mode']==mode and r['path']=='/normal/page' and not r['isolatedRoute'] and not r['dropFail']]
 denied=[(x['protocolEnd']-x['protocolStart'])*1000 for r in rows for x in r['cdp'] if x['outcome']=='FAILED' and x['protocolEnd'] is not None]
 summary['primary'][mode]={'n':len(rows),'dclMs':[r['dclElapsedMs'] for r in rows],'loadMs':[r['loadElapsedMs'] for r in rows],'dclMedianMs':statistics.median(r['dclElapsedMs'] for r in rows),'loadMedianMs':statistics.median(r['loadElapsedMs'] for r in rows),'browserRequests':[len(r['cdp']) for r in rows],'receiverRequests':[len(r['receivers']) for r in rows],'guardBlocked':[len(r['blocked']) for r in rows],'deniedDurationMaxMs':max(denied) if denied else None,'terminal':all(not r['pendingCdp'] and not r['pendingPw'] and not r['unanswered'] for r in rows)}
for r in p['rows']:
 if r['dropFail']:
  summary['faultControl']={k:r[k] for k in ['error','dclMs','loadMs','snapshotAtMs']}
  summary['faultControl'].update({'cdpPending':len(r['pendingCdp']),'pwPending':len(r['pendingPw']),'unansweredPauses':len(r['unanswered'])})
 elif r['isolatedRoute'] or r['path']=='/native/page':
  failed=[x for x in r['cdp'] if x['outcome']=='FAILED' and x['protocolEnd'] is not None]
  summary['paths'].append({'mode':r['mode'],'path':r['path'],'isolatedRoute':r['isolatedRoute'],'dclMs':r['dclElapsedMs'],'loadMs':r['loadElapsedMs'],'failedDurationMaxMs':max(((x['protocolEnd']-x['protocolStart'])*1000 for x in failed),default=None),'routeAborts':[x for x in r['routeActions'] if x['method']=='abort'],'failCommands':[x for x in r['commands'] if x['method']=='Fetch.failRequest'],'responsePauses':[x for x in r['pauses'] if x['responseStatus'] is not None],'pendingCdp':len(r['pendingCdp']),'pendingPw':len(r['pendingPw']),'unanswered':len(r['unanswered'])})
(root/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({'primary':summary['primary'],'faultControl':summary['faultControl']},indent=2))
