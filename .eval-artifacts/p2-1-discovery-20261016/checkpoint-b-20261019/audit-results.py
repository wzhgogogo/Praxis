from pathlib import Path
from urllib.parse import urlsplit
from collections import Counter
import json, hashlib, subprocess
main=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing')
wt=Path('/Users/wangzhour/.codex/worktrees/p21-checkpoint-b/Praxis-Zhixing')
base=Path('.eval-artifacts/p2-1-discovery-20261016');batch=base/'checkpoint-b-20261019';out=main/batch
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text())
plan=load(out/'plan.json');freeze=load(out/'freeze.json')
assert all(sha(Path(p))==s for p,s in freeze['files'].items())
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=wt).decode().strip()==plan['productionHead']
assert not subprocess.check_output(['git','status','--porcelain'],cwd=wt).strip()
for path,expected in load(out/'historical-sha-before.json').items():assert sha(main/path)==expected,path
copied=0
for source in (wt/batch).rglob('*'):
 if not source.is_file():continue
 target=main/source.relative_to(wt)
 if target.exists():assert source.read_bytes()==target.read_bytes(),str(target)
 else:target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(source.read_bytes());copied+=1
ledger=load(out/'ledger.json')
sources=['tabelog','tablecheck','google-places']
def row(index,path):
 s=load(main/path);directory=(main/path).parent;decisions=directory/'probe.decisions.jsonl';trace=directory/'trace.jsonl';rows=[json.loads(l) for l in decisions.read_text().splitlines()]
 assert len(rows)==s['resources']['modelCalls']==s['decisionCapture']['callsStarted']==s['decisionCapture']['rowsWritten']
 planning=[]
 for d in rows:
  if d['purpose']!='restaurant_discovery_retrieval':continue
  u=json.loads(next(m['content'] for m in d['messages'] if m['role']=='user'));ob=u.get('observation') or {};host=urlsplit(ob.get('url','')).hostname
  source='tabelog' if host=='tabelog.com' else 'tablecheck' if host=='www.tablecheck.com' else 'SHARED_TEXT_RETRIEVAL'
  try:proposal=json.loads(d.get('outputText') or '{}')
  except ValueError:proposal={'invalidJson':True,'raw':d.get('outputText')}
  planning.append({'sequence':d['sequence'],'source':source,'latencyMs':d['latencyMs'],'outcome':d['outcome'],'errorCode':d.get('errorCode'),'timeout':bool(d.get('errorCode') and 'TIMEOUT' in d['errorCode'].upper()),'url':ob.get('url'),'parsedCount':ob.get('parsedCount'),'categoryCount':len(ob.get('categories',[])),'proposal':proposal})
 per={}
 for source in sources:
  calls=[p for p in planning if p['source']==source];sr=next((r for r in s['sources'] if r['sourceId']==source),{})
  per[source]={'callCount':len(calls),'latencyMs':sum(p['latencyMs'] for p in calls),'timeouts':sum(p['timeout'] for p in calls),'sourceBudgetMs':90000 if source!='google-places' else None,'sourceElapsedMs':(sr.get('funnel')or{}).get('sourceElapsedMs'),'retrieval':(sr.get('funnel')or{}).get('retrieval'),'failureCode':sr.get('failureCode')}
 rec=directory/'recording'/s['caseId']/'recording.json';assert rec.exists() and trace.exists()
 r={'index':index,'caseId':s['caseId'],'resources':s['resources'],'pages':s['pages'],'failureCodes':s['failureCodes'],'terminationReason':s['terminationReason'],'witnessInListingBySource':s['witnessInListingBySource'],'witnessInFirstBatchBySource':{source:any(w['sourceId']==source and w['inFirstBatch'] for w in s['witnessMatches']) for source in sources[:2]},'googleFirstBatchScope':'NOT_APPLICABLE_NATIVE_DETAILS','inRadiusParsed':s['inRadiusParsed'],'inRadiusBySource':dict(Counter(c['sourceId'] for c in s['inRadiusCandidates'])),'retrievalAttempts':s['retrievalAttempts'],'sourceRetrieval':per,'planningCalls':planning,'planningCallCount':len(planning),'planningLatencyMs':sum(p['latencyMs'] for p in planning),'planningTimeouts':sum(p['timeout'] for p in planning),'boundary':s['boundary'],'unattemptedSourceIds':s['unattemptedSourceIds'],'recordingReplayStatus':load(rec).get('replay')}
 for key,p in [('summary',main/path),('decisions',decisions),('trace',trace),('recording',rec)]:r[key]=str(p.relative_to(main));r[key+'Sha256']=sha(p)
 google=[json.loads(l) for l in trace.read_text().splitlines() if 'SOURCE_FIRST_BATCH' in l]
 r['googleActualTransport']=[{'sequence':t['sequence'],'sourceId':t['detail']['sourceId'],'sourceRequestContext':t['detail'].get('read',{}).get('continuation',{}).get('sourceRequestContext'),'candidates':len(t['detail'].get('read',{}).get('candidates',[]))} for t in google if t.get('kind')=='SOURCE_FIRST_BATCH' and t.get('detail',{}).get('sourceId')=='google-places']
 return r,Counter(d['outcome'] for d in rows)
rows=[];outcomes=Counter()
for attempt in ledger['attempts']:
 if attempt['status']!='PROBE_RECORDED':continue
 result,counts=row(attempt['index'],Path(attempt['summary']));outcomes.update(counts)
 summary=load(main/attempt['summary'])
 result['searchAvailabilityHints']={source['sourceId']:(source.get('funnel')or{}).get('searchAvailabilityHint') for source in summary['sources']}
 rows.append(result)
previous=load(main/base/'checkpoint-a-dom-20261019/audit.json')
byIndex={r['index']:r for r in rows}
pairs=[{'index':i,'caseId':item['caseId'],'repeat':item['repeat'],'role':item['role'],'approvedVariable':'HARD_KEYWORD_CORRECTION' if item['caseId'].startswith('p2-kf-h002-') else 'P2_1B_SEARCH_AVAILABILITY_HINTS','checkpointA':previous['rows'][i],'checkpointB':byIndex.get(i,{'status':'NOT_STARTED'})} for i,item in enumerate(plan['planned'])]
status='COMPLETE' if len(rows)==10 and not ledger['stop'] else 'PARTIAL'
comparison={'status':status,'comparisonAHead':plan['comparisonA'],'checkpointBHead':plan['productionHead'],'pairs':pairs,'comparisonScope':'Approved implementation-variable groups; repeated exposed discovery probes, not full Live or statistical causal proof.'}
(out/'comparison.json').write_text(json.dumps(comparison,ensure_ascii=False,indent=2)+'\n')
audit={'status':status,'formalProbes':len(rows),'modelCalls':ledger['models'],'googleFormal':ledger['google'],'googlePreflight':ledger['preflightGoogle'],'cumulativeModels':261+ledger['models'],'cumulativeProbes':41+len(rows),'cumulativeGoogle':108+ledger['google']+ledger['preflightGoogle'],'probeCap':52,'modelCap':450,'fullLive':0,'preflightFailures':ledger['preflightFailures'],'preflightFailureOrigin':1,'stop':ledger['stop'],'decisionOutcomes':dict(outcomes),'frozenFilesChecked':len(freeze['files']),'historicalFilesUnchanged':len(load(out/'historical-sha-before.json')),'worktreeClean':True,'newFilesCopied':copied,'rows':rows}
(out/'audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in audit.items() if k!='rows'},ensure_ascii=False))
