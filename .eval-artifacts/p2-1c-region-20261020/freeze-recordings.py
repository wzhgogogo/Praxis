"""Read exact Git objects only; never network or holdout files."""
from pathlib import Path
import subprocess,json,gzip,hashlib,re,datetime,collections,math,statistics
OUT=Path(__file__).resolve().parent
REV='305d1e0'
BASE='.eval-artifacts/p2-1-discovery-20261016/'
def raw(p):return subprocess.check_output(['git','show',REV+':'+p])
def sha(b):return hashlib.sha256(b).hexdigest()
files=subprocess.check_output(['git','ls-tree','-r','--name-only',REV,BASE],text=True).splitlines()
groups=['baseline','network-restored-20261019','checkpoint-a-20261019','checkpoint-a-corrected-20261019','checkpoint-a-dom-20261019','checkpoint-b-20261019','checkpoint-b-corrected-20261019']
records=[]
for path in files:
 if not path.endswith('/probe-summary.json') or path[len(BASE):].split('/')[0] not in groups:continue
 prefix=path[:-len('probe-summary.json')]
 sourcepaths=[path,prefix+'trace.jsonl',prefix+'probe.decisions.jsonl']
 if any(p not in files for p in sourcepaths):continue
 bs=[raw(p) for p in sourcepaths];summary=json.loads(bs[0]);trace=[json.loads(l) for l in bs[1].splitlines() if l.strip()];decisions=[json.loads(l) for l in bs[2].splitlines() if l.strip()]
 region=[];planning=[]
 for d in decisions:
  try:inp=json.loads(next(m['content'] for m in d['messages'] if m['role']=='user'))
  except (StopIteration,ValueError,KeyError):continue
  if d['purpose']=='restaurant_discovery_retrieval' and not inp.get('observation'):
   planning.append({'sequence':d['sequence'],'latencyMs':d.get('latencyMs'),'outcome':d.get('outcome')})
  if d['purpose']=='browser_read_decide' and ('region/station' in inp.get('objective','') or 'first five inspected' in inp.get('objective','')):
   region.append({'sequence':d['sequence'],'startedAt':d['startedAt'],'input':inp,'outputText':d.get('outputText'),'outcome':d.get('outcome')})
 batches=[r for r in trace if r['kind']=='SOURCE_FIRST_BATCH'];google=next((r for r in batches if r['detail']['sourceId']=='google-places'),None)
 plan=next((r for r in trace if r['kind']=='DISCOVERY_PLAN'),None)
 loc=next((r['detail']['read']['continuation']['locationContext'] for r in batches if r['detail']['read'].get('continuation',{}).get('locationContext')),None)
 gi=trace.index(google) if google else None
 # Existing stages are serial: the previous SOURCE_FIRST_BATCH closes its stage.
 previous=next((r for r in reversed(trace[:gi]) if r['kind']=='SOURCE_FIRST_BATCH'),plan) if gi is not None else None
 elapsed=(datetime.datetime.fromisoformat(google['at'].replace('Z','+00:00'))-datetime.datetime.fromisoformat(previous['at'].replace('Z','+00:00'))).total_seconds()*1000 if google and previous else None
 records.append({'id':path[len(BASE):-len('/probe-summary.json')],'caseId':summary['caseId'],'group':path[len(BASE):].split('/')[0],
 'sources':[{'gitCommit':REV,'path':p,'sha256':sha(b)} for p,b in zip(sourcepaths,bs)],
 'location':loc,'regionDecisions':region,'googleBatch':google,'googleStageElapsedMs':elapsed,'sharedTextPlanning':planning,
 'googleStageTimingDefinition':'Gap from preceding source batch to Google batch; includes uninstrumented dispatch. Shared text planning is reported separately. This is observed serial-stage cost, not a measured future critical path.',
 'summary':{'terminationReason':summary.get('terminationReason'),'sources':summary.get('sources')}})
assert len(records)==54,len(records)
blob=gzip.compress((json.dumps(records,ensure_ascii=False,separators=(',',':'))+'\n').encode(),mtime=0)
(OUT/'recordings.json.gz').write_bytes(blob)
gold={'p2-kagurazaka-kaiseki-20261029':'A1309','p2-nakameguro-yakiniku-20261030':'A1317','p2-kf-h001-20261027':'A1303','p2-kf-h005-20261029':'A1301','p2-kichijoji-tempura-20261027':'A1320','p2-kf-h002-20261031':'A1301'}
(OUT/'inputs.json').write_text(json.dumps({'status':'EXPOSED_FROZEN_DEVELOPMENT_OFFLINE','reviewCommit':REV,'records':len(records),'recordings':{'path':'recordings.json.gz','sha256':sha(blob)},'expectedTopRegionByCase':gold,'goldAuthority':'User 2026-10-20 task + independent review 305d1e0; controls use established source region, never product input.','externalCalls':0,'modelCalls':0},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'records':len(records),'bytes':len(blob),'sha256':sha(blob)}))
