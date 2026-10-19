from pathlib import Path
from urllib.parse import urlsplit
from collections import Counter
import json,hashlib,subprocess,gzip
main=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing')
wt=Path('/Users/wangzhour/.codex/worktrees/p21-checkpoint-a-dom/Praxis-Zhixing')
base=Path('.eval-artifacts/p2-1-discovery-20261016');batch=base/'checkpoint-a-dom-20261019';out=main/batch
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text())
ledger=load(wt/batch/'ledger.json');plan=load(out/'plan.json');freeze=load(out/'freeze.json')
assert all(sha(Path(p))==s for p,s in freeze['files'].items())
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=wt).decode().strip()==plan['productionHead']
assert not subprocess.check_output(['git','status','--porcelain'],cwd=wt).strip()
for path,expected in load(out/'historical-sha-before.json').items():assert sha(main/path)==expected,path
copied=0
for source in (wt/batch).rglob('*'):
 if not source.is_file():continue
 target=main/source.relative_to(wt)
 if target.exists():
  if source.read_bytes()!=target.read_bytes():
   assert source.relative_to(wt)==batch/'ledger.json',str(target)
   archive=out/'ledger-snapshots'/('ledger-'+sha(target)+'.json');archive.parent.mkdir(exist_ok=True)
   if archive.exists():assert archive.read_bytes()==target.read_bytes()
   else:archive.write_bytes(target.read_bytes())
   target.write_bytes(source.read_bytes())
 else:target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(source.read_bytes());copied+=1
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
actual={};outcomes=Counter()
for a in ledger['attempts']:
 if a['status']!='PROBE_RECORDED':continue
 r,c=row(a['index'],Path(a['summary']));actual[a['index']]=r;outcomes.update(c)
baseline=load(main/base/'network-restored-20261019/baseline-audit.json')
pairs=[]
for i,item in enumerate(plan['planned']):
 b,_=row(i,Path(baseline['rows'][i]['summary']));a=actual.get(i)
 pairs.append({'index':i,'caseId':item['caseId'],'role':item['role'],'repeat':item['repeat'],'baseline':b,'checkpointA':a or {'status':'NOT_STARTED'}})
previous=load(main/base/'checkpoint-a-corrected-20261019/audit.json')
for pair in pairs:
 pair['previousA']=previous['rows'][pair['index']]
 entries=[json.loads(l) for l in (main/pair['previousA']['trace']).read_text().splitlines() if 'SOURCE_FIRST_BATCH' in l]
 pair['previousA']['googleActualTransport']=[{'sequence':t['sequence'],'sourceId':t['detail']['sourceId'],'sourceRequestContext':t['detail'].get('read',{}).get('continuation',{}).get('sourceRequestContext'),'candidates':len(t['detail'].get('read',{}).get('candidates',[]))} for t in entries if t.get('kind')=='SOURCE_FIRST_BATCH' and t.get('detail',{}).get('sourceId')=='google-places']
comparison={'status':'COMPLETE' if len(actual)==10 and not ledger['stop'] else 'PARTIAL','comparablePairs':len(actual),'baselineHead':plan['commonBaseline'],'checkpointAHead':plan['productionHead'],'rawListingCounts':'Includes broad region navigation observations; not final keyword/category hits alone.','radiusScope':'Parsed coordinates, including Google candidates; not verified/deduplicated restaurants.','sharedPlanningRule':'SHARED_TEXT_RETRIEVAL is counted once, never twice for TableCheck/Google.','pairs':pairs}
(out/'comparison.json').write_text(json.dumps(comparison,ensure_ascii=False,indent=2)+'\n')
audit={'status':comparison['status'],'modelCalls':ledger['models'],'googleFormal':ledger['google'],'googlePreflight':ledger['preflightGoogle'],'formalProbes':len(actual),'effectiveCountedPreflightFailures':ledger['preflightFailures'],'stop':ledger['stop'],'cumulativeModels':212+ledger['models'],'cumulativeGoogle':79+ledger['google']+ledger['preflightGoogle'],'cumulativeProbes':31+len(actual),'probeCap':42,'modelCap':450,'fullLive':0,'decisionOutcomes':dict(outcomes),'frozenChecks':'PASS','worktreeClean':'PASS','historicalImmutableFilesChecked':len(load(out/'historical-sha-before.json')),'newFilesCopied':copied,'rows':list(actual.values())}
(out/'audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in audit.items() if k!='rows'},ensure_ascii=False))
