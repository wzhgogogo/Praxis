"""Offline metadata extraction; no network, header/query values or response bodies emitted."""
import pathlib,json,urllib.parse,hashlib,collections
ROOT=pathlib.Path.cwd(); OUT=ROOT/'.eval-artifacts/phase3b/tablecheck-final-comparison-20261107'
inputs={};records=[]
def read(path):
 p=ROOT/path;raw=p.read_bytes();inputs[path]=hashlib.sha256(raw).hexdigest();return json.loads(raw)
def endpoint(row):
 try:
  url=urllib.parse.urlsplit(row.get('url',''));origin=row.get('origin') or (url.scheme+'://'+url.netloc if url.netloc else '')
  if origin!='https://search-v4.production.ap-northeast-1.aws.tablecheck.net':return None
  return origin,row.get('pathname') or url.path,sorted(set(row.get('queryKeys',urllib.parse.parse_qs(url.query,keep_blank_values=True))))
 except (ValueError,AttributeError):return None
def add(label,path,loc,row,stage,method=None,typ=None):
 ep=endpoint(row)
 if not ep:return
 record={'dataset':label,'source':path,'location':loc,'stage':stage,'origin':ep[0],'pathname':ep[1],'queryKeys':ep[2],
 'method':row.get('method',method),'resourceType':row.get('resourceType',row.get('type',typ)),'status':row.get('status'),
 'outcome':row.get('outcome',row.get('event')),'elapsedMs':row.get('elapsedMs'),'requestHeaderNames':None,'responseHeaderNames':None,
 'headersEvidence':'NOT_RECORDED_FULL_SETS','observationPoint':row.get('observationPoint')}
 for key in ['requestHeaders','responseHeaders']:
  h=row.get(key)
  if isinstance(h,dict):record[key.replace('Headers','HeaderNames')]=sorted(k.lower() for k in h)
  elif isinstance(h,list):record[key.replace('Headers','HeaderNames')]=sorted({v['name'].lower() for v in h if isinstance(v,dict) and 'name' in v})
 cors=row.get('corsFacts')
 if cors:
  record['recordedCorsCategory']=cors.get('allowOrigin');record['recordedAllowsCredentials']=cors.get('allowsCredentials')
  record['responseHeaderNamesKnownSubset']=(['access-control-allow-origin'] if cors.get('allowOrigin') not in [None,'ABSENT'] else [])+(['access-control-allow-credentials'] if cors.get('allowsCredentials') else [])
 if row.get('corsPreflight'):record['requestedHeaderNamesSubset']=row['corsPreflight'].get('requestedHeaderNames')
 records.append(record)
for mode in ['production','guarded','plain']:
 path=f'.eval-artifacts/p2-1-discovery-20261016/preflight-diagnosis-20261020/{mode}/result.json';d=read(path)
 for section in ['rows','hooks']:
  for i,row in enumerate(d[section]):add('OCT20_'+mode.upper(),path,f'{section}/{i}',row,row.get('event','GUARD_RESPONSE_CALLBACK'))
for variant in ['guarded-search','counterfactual-search','facet-direct']:
 path=f'.eval-artifacts/tablecheck-guard-preflight-20261023/h14-inputs/{variant}.result.json';d=read(path)
 if variant=='facet-direct':add('OCT23_'+variant,path,'root',d,'DIRECT_NODE_GET_RESPONSE',method='GET')
 else:
  # Actual request observations provide method/resource type, unlike response events.
  for i,row in enumerate(d['requests']):add('OCT23_'+variant,path,f'requests/{i}',row,'GUARD_REQUEST_OBSERVATION')
  for i,row in enumerate(d['events']):add('OCT23_'+variant,path,f'events/{i}',row,'RESPONSE' if 'status' in row else row.get('event','EVENT'))
traces=[('D8_NOV06','.eval-artifacts/phase3b/d4-d8-live-20261106/D8-runtime/runs/D8/D8/browser-trace.json'),('PROBE1_NOV06','.eval-artifacts/phase3b/tablecheck-spa-20261106/runtime/events.json'),('PROBE2_NOV07','.eval-artifacts/phase3b/tablecheck-text-search-20261107/probe-runtime/events.json'),('PROBE3_NOV07','.eval-artifacts/phase3b/tablecheck-transport-20261107/probe-runtime/events.json')]
for label,path in traces:
 d=read(path);events=d if isinstance(d,list) else d['events'];starts={}
 for e in events:
  row=e.get('detail',{});kind=e.get('kind','')
  if not isinstance(row,dict):continue
  if kind=='NETWORK_REQUEST_START':starts[row.get('requestId')]=row
  if kind!='NETWORK_CORS_ERROR' and kind.startswith(('NETWORK_','GUARD_TRANSPORT_')):
   merged={**starts.get(row.get('requestId'),{}),**row};add(label,path,str(e.get('sequence')),merged,kind)
  if kind=='SNAPSHOT':
   for i,r in enumerate(row.get('networkRequests',[])):add(label,path,str(e.get('sequence'))+f'/networkRequests/{i}',r,'GUARD_REQUEST_OBSERVATION')
# CORS failures have an ID rather than a URL; correlate strictly by request ID.
for label,path in traces:
 d=read(path);events=d if isinstance(d,list) else d['events'];starts={e['detail']['requestId']:e['detail'] for e in events if e.get('kind')=='NETWORK_REQUEST_START'}
 for e in events:
  if e.get('kind')!='NETWORK_CORS_ERROR':continue
  row=e['detail'];base=starts.get(row.get('requestId'),{});ep=endpoint(base)
  if ep:
   add(label,path,str(e.get('sequence')),{**base,**row},'NETWORK_CORS_ERROR');records[-1]['corsError']=row.get('corsError',row.get('error'))
summaries={}
for label in sorted({r['dataset'] for r in records}|{label for label,_ in traces}):
 subset=[r for r in records if r['dataset']==label];counts=collections.Counter()
 for r in subset:
  if r['stage'] in ['NETWORK_REQUEST_END','response','GUARD_RESPONSE_CALLBACK','RESPONSE','DIRECT_NODE_GET_RESPONSE']:
   counts[(r['pathname'],r['method'] or 'METHOD_NOT_RECORDED',str(r['status']),r['stage'])]+=1
 summaries[label]={'records':len(subset),'terminalOrResponseGroups':[{'pathname':k[0],'method':k[1],'status':k[2],'stage':k[3],'count':v} for k,v in sorted(counts.items())]}
# inventory06 is a witness batch for Tabelog, not a search-v4 success recording.
inv='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/certification-freezes/inventory-06.json';freeze=read(inv)
invroot=ROOT/'.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/source-reads/inventory-06';inventory=[]
for p in sorted(invroot.glob('*.metadata.json')):
 d=read(str(p.relative_to(ROOT)));u=urllib.parse.urlsplit(d['url']);inventory.append({'file':str(p.relative_to(ROOT)),'origin':u.scheme+'://'+u.netloc,'pathname':u.path,'method':d['method'],'status':d['status'],'requestHeaderNames':None,'responseHeaderNames':None})
result={'status':'NO_CONFIRMED_TESTABLE_REGRESSION_DIFFERENCE_OPTION_B','bodyOrHeaderValuesCopied':False,'records':records,'summaries':summaries,'inventory06':{'freeze':inv,'productionBase':freeze['productionBase'],'requests':inventory,'isSearchV4SuccessEvidence':False},'limitations':['Full header sets were not recorded by selected historical and current source traces; null means unknown, not empty/absent.','CORS facts are categorical browser observations, not upstream response header lists.','Sanitized replay HAR content-type headers are synthesized; not used as origin-wire evidence.','No upstream status/WAF/CDN header evidence for native CORS-failed GETs; no site-side attribution.']}
(OUT/'recording-comparison.json').write_text(json.dumps(result,indent=2)+'\n');(OUT/'comparison-input-sha256.json').write_text(json.dumps(inputs,indent=2)+'\n')
print(json.dumps({'datasets':summaries,'inventory06Requests':len(inventory),'sourceFiles':len(inputs)},indent=2))
