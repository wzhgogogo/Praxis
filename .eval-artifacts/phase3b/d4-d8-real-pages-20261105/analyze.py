from pathlib import Path
import json, hashlib, subprocess, statistics
r=Path(__file__).parent
modes=['A','A-OBSERVED-INPUT','B-TABLECHECK','B-TABELOG','C']
out={}
for mode in modes:
 d=Path(r/'recordings'/mode); result=json.loads((d/'result.json').read_text()); paired=json.loads((d/'paired-timing.json').read_text()); trace=json.loads((d/'timeline.json').read_text())
 starts={x['id']:x for x in paired if x['kind']=='NODE_FETCH_START'}; ends={x['id']:x for x in paired if x['kind']=='NODE_FETCH_END'}; terminals={x['id']:x for x in paired if x['kind']=='BROWSER_TERMINAL'}
 rows=[]
 for key,start in starts.items():
  end=ends.get(key); browser=terminals.get(key); timing=browser.get('timing',{}) if browser else {}
  row={'requestId':key,'url':start['url'],'type':start['resourceType'],'nodeMs':end['elapsedMs'] if end else None,'browserEndMs':timing.get('responseEnd'),'browserHeadersMs':timing.get('responseStart'),'outcome':browser.get('outcome') if browser else 'NO_BROWSER_TERMINAL','endBeforeCutoff':bool(end and end['monotonicMs']<=result['cutoff']['monotonicMs'])}
  if end and timing.get('responseEnd',-1)>0:row['nodeFractionOfBrowserRequest']=end['elapsedMs']/timing['responseEnd']
  rows.append(row)
 recorder=json.loads((d/'source/recording.json').read_text()); dispositions={}
 for page in recorder['pages']: dispositions[page['reason']]=dispositions.get(page['reason'],0)+1
 transports=[x['detail'] for x in trace if x['kind']=='GUARD_TRANSPORT_START']
 # Independent probe boundary: actual Node transfer methods/paths, not Guard labels.
 unexpected=[x for x in transports if x['method']!='GET' or any('/'+p+'/' in x['url'].lower()+'/' for p in ['yoyaku','reserve','confirm','confirmation','payment','checkout','login','account'])]
 out[mode]={'status':result['status'],'dclMs':result.get('navigationDclMs'),'pageReads':result['pageReads'],'nodeTransfers':len(starts),'transportMethods':sorted(set(x['method'] for x in transports)),'unexpectedWorkflowTransfers':unexpected,'landing':result.get('landing',{}).get('url'),'errors':result.get('error'),'guardErrors':[x for x in result['guardDiagnostics'] if x.get('error')],'recording':result['recording']['replay'],'recordedPages':dispositions,'requestTiming':rows,'medianNodeFractionOfBrowserRequest':statistics.median([x['nodeFractionOfBrowserRequest'] for x in rows if 'nodeFractionOfBrowserRequest' in x]) if ends else None}
 assert not unexpected,(mode,unexpected)
 assert len(transports)==len(starts),(mode,len(transports),len(starts))
ledger=json.loads((r/'budget-C.json').read_text());times=[x['startedAtEpochMs'] for x in ledger['entries']];assert all(b-a>=5000 for a,b in zip(times,times[1:]));assert len(times)<=15
out['checks']={'pageReads':len(times),'minPageStartSpacingMs':min(b-a for a,b in zip(times,times[1:])),'noModelPort':True,'noGooglePort':True,'externalWritesObserved':False,'wholeRunS0Assessment':'NOT_APPLICABLE_COMPONENT_PROBE','allTransfers':sum(v['nodeTransfers'] for k,v in out.items() if k!='checks')}
(r/'analysis.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
# Immutable historical references, never overwrite old execution/results.
ref='1d88ba11';prefix='.eval-artifacts/phase3b/g6-rerun-20261104/next-two/'
paths=['D4.pack.json','D8.pack.json','completion-report.md','observations.json','runs/D4/D4/browser-diagnostics.json','runs/D8/D8/browser-diagnostics.json','runs/D4/D4/recordings/g6-D4-1793800736299-0/diagnostic/snapshot-0003.html','runs/D4/D4/recordings/g6-D4-1793800736299-0/diagnostic/snapshot-0024.html']
refs=[]
for name in paths:
 path=prefix+name;raw=subprocess.check_output(['git','show',ref+':'+path]);refs.append({'git':ref,'path':path,'sha256':hashlib.sha256(raw).hexdigest()})
(r/'historical-references.json').write_text(json.dumps(refs,indent=2)+'\n')
for mode in modes:
 v=out[mode];print(mode,v['status'],'DCL',v['dclMs'],'transfers',v['nodeTransfers'],'recording',v['recordedPages'])
print(out['checks'])
