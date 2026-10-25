# POST-RUN OFFLINE ANALYSIS ONLY; not part of frozen Live configuration; never invokes Runner/network/model.
import pathlib,json,datetime as dt,collections,hashlib,re,sys
root=pathlib.Path.cwd();number=int(sys.argv[1]);p=root/'.eval-artifacts/phase3a-prime/f5-live-rerun/slots'/str(number);s=json.loads((p/'summary.json').read_text());a=json.loads(pathlib.Path(s['artifactPath']).read_text());ds=[json.loads(l) for l in pathlib.Path(a['decisionCapture']['path']).read_text().splitlines()];t=lambda v:round(dt.datetime.fromisoformat(v.replace('Z','+00:00')).timestamp()*1000);start,end=t(a['startedAt']),t(a['finishedAt']);pending=collections.defaultdict(list);spans=[];gaps=[]
for r in a['diagnostics']['browserTrace']:
 d=r.get('detail') or {}
 if r['kind']!='EXECUTOR_DIAGNOSTIC':continue
 key=(d.get('source'),d.get('candidateId'),d.get('stage'),d.get('detail'));op=d.get('detail','');at=t(r['at'])
 if d.get('event')=='OPERATION_STARTED':pending[key].append((at,r['sequence']))
 elif d.get('event') in ['OPERATION_FINISHED','OPERATION_FAILED']:
  if not pending[key]:gaps.append({'kind':'FINISH_WITHOUT_START','sequence':r['sequence']});continue
  begin,seq=pending[key].pop();stage='PAGE_LOAD' if op in ['NAVIGATE','OPEN_LINK'] else 'READ_PAGE' if op in ['SNAPSHOT','OBSERVE_CONTROLS'] else 'WAIT' if 'WAIT' in op or 'STABILITY' in op else 'PAGE_OPERATION';spans.append((begin,at,stage,1))
for key,stack in pending.items():
 for at,seq in stack:gaps.append({'kind':'UNPAIRED_START_NOT_ATTRIBUTED','sequence':seq,'operation':key[-1]})
for r in ds:
 if isinstance(r.get('latencyMs'),(int,float)):spans.append((t(r['startedAt']),t(r['startedAt'])+r['latencyMs'],'MODEL:'+r['purpose'],2))
points=sorted({start,end,*[min(end,max(start,v)) for sp in spans for v in sp[:2]]});totals=collections.Counter()
for x,y in zip(points,points[1:]):
 candidates=[sp for sp in spans if sp[0]<=x and sp[1]>=y];best=max(candidates,key=lambda sp:(sp[3],sp[0])) if candidates else None;totals[best[2] if best else 'UNATTRIBUTED']+=y-x
assert sum(totals.values())==end-start
recdir=pathlib.Path(a['browserRecording']['path']);recording=json.loads((recdir/'recording.json').read_text());har=json.loads((recdir/'replay.har').read_text());google=[i for i,e in enumerate(har['log']['entries']) if 'places.googleapis.com' in e['request']['url']];controls=[]
for line,r in enumerate(ds,1):
 if r['purpose']!='browser_read_decide':continue
 try:u=json.loads(next(m['content'] for m in r['messages'] if m['role']=='user'));o=json.loads(r.get('outputText') or '{}')
 except (ValueError,TypeError,StopIteration):continue
 for target in u.get('observation',{}).get('targets',[]):
  location='FILL_AUTHORITATIVE:LOCATION' in target.get('availableActions',[]) and 'Akabane' in ((u.get('goal') or {}).get('location') or {}).get('name','');station=bool(re.search(r'Akabane\s*(?:Sta\.?|Station)',target.get('label',''),re.I)) and 'OPEN_LINK' in target.get('availableActions',[])
  if location or station:controls.append({'decisionLine':line,'kind':'LOCATION' if location else 'STATION','label':target['label'],'href':target.get('href'),'proposedUse':o.get('targetRef')==target.get('ref'),'objective':u.get('objective'),'diagnosticDOM':[str(recdir/page['diagnostic']['file']) for page in recording['pages'] if page['url']==u['observation']['url'] and page.get('diagnostic',{}).get('status')=='SAVED']})
result={'kind':'SUPPLEMENTARY_OFFLINE_OBSERVATION','artifactSha256':s['artifactSha256'],'method':'Only paired actual Executor operations and recorded model intervals. Unmatched starts are gaps, not assumed ongoing to task cutoff. Additive post-run measurement; frozen metrics/evaluation unchanged.','elapsedMs':end-start,'wallTimePartitionMs':dict(totals),'pairingGaps':gaps,'rawGoogleHarEntryIndices':google,'googleHarResponses':len(google),'controlsFromActualDecisionMessages':controls,'originalMetricsRetained':True,'newCalls':0};(p/'observation-supplement.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'slot':number,'conservativePartition':dict(totals),'googleResponsesInHar':len(google),'controls':len(controls)}))
