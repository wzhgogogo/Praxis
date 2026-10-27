from pathlib import Path
from urllib.parse import urlsplit
from collections import Counter,defaultdict
import json,subprocess,hashlib,tarfile,io,datetime,zoneinfo,gzip
REV='cc12732020256f22e1827bf62fb4b66ccc3cb0ba'
BASE='.eval-artifacts/phase3a-prime/replay-url-qualification-20261025/inputs/'
def blob(path):return subprocess.check_output(['git','show',REV+':'+path])
def key(url):
 u=urlsplit(url);return u.scheme+'://'+u.netloc,u.path
archive='.eval-artifacts/phase3a-prime/f5-live-rerun/evidence/slot-1-recording.tar.gz';raw=blob(archive);tar=tarfile.open(fileobj=io.BytesIO(raw));tarroot=tar.getnames()[0].split('/')[0]
manifest=json.loads(blob(BASE+'recording/recording.json'));har=json.loads(blob(BASE+'recording/replay.har'));harpaths={(key(e['request']['url']),e['request']['method']) for e in har['log']['entries']}
rows=[];scripts=defaultdict(lambda:{'admittedPages':set(),'blockedPages':set(),'harBodyPresentAtPath':False})
networks=[e['detail'] for e in manifest['entries'] if e['kind']=='NETWORK'];assert len(networks)==len(manifest['pages'])==94
for p,network in zip(manifest['pages'],networks):
 missing=[];blocked=[]
 for r in network:
  pair=key(r['origin'].rstrip('/')+r['pathname']);present=(pair,r['method']) in harpaths
  if r['resourceType']=='script':
   scripts[pair]['harBodyPresentAtPath']=present
   scripts[pair]['admittedPages' if r['outcome']=='ADMITTED' else 'blockedPages'].add(p['snapshot'])
  if r['outcome']=='ADMITTED' and r['resourceType'] in ['script','stylesheet','xhr','fetch'] and not present:
   missing.append({'origin':pair[0],'pathname':pair[1],'method':r['method'],'resourceType':r['resourceType']})
  elif r['outcome']!='ADMITTED' and r['resourceType']=='script':blocked.append({'origin':pair[0],'pathname':pair[1]})
 diagnostic=tarroot+'/'+p.get('diagnostic',{}).get('file','ABSENT')
 available=diagnostic in tar.getnames()
 rows.append({'snapshot':p['snapshot'],'origin':key(p['url'])[0],'pathname':key(p['url'])[1],'status':p['status'],'reason':p['reason'],'diagnosticDomSaved':available,'diagnosticSha256':hashlib.sha256(tar.extractfile(diagnostic).read()).hexdigest() if available else None,'missingAdmittedResponsesAtPath':list({json.dumps(v,sort_keys=True):v for v in missing}.values()),'blockedScripts':list({json.dumps(v,sort_keys=True):v for v in blocked}.values())})
scriptrows=[{'origin':k[0],'pathname':k[1],'admittedPages':sorted(v['admittedPages']),'blockedPages':sorted(v['blockedPages']),'harBodyPresentAtPath':v['harBodyPresentAtPath']} for k,v in sorted(scripts.items())]
missingScripts=[r for r in scriptrows if r['admittedPages'] and not r['harBodyPresentAtPath']]
summary={'timeCET':datetime.datetime.now(zoneinfo.ZoneInfo('Europe/Vienna')).isoformat(),'sourceGit':REV,'archiveSha256':hashlib.sha256(raw).hexdigest(),'pages':94,'qualifiedPages':sum(p['status']=='REPLAYABLE' for p in rows),'diagnosticDomAvailable':sum(p['diagnosticDomSaved'] for p in rows),'qualificationReasons':dict(Counter(p['reason'] for p in rows)),'admittedUncapturedScriptPaths':len(missingScripts),'blockedScriptPaths':sum(bool(r['blockedPages']) for r in scriptrows),'harScriptBodies':sum('javascript' in e['response']['content']['mimeType'] for e in har['log']['entries']),'qualificationChangeThisBatch':0,'notes':['Presence matched at origin+path+method only because network trace omits query values; this is NOT exact-response or code-version certification.','Diagnostic DOM availability is NOT executable network Replay qualification.','No missing bytes fetched or invented; no Recorder/Guard policy changed.']}
oldmetrics=[f'.eval-artifacts/phase3a-prime/f5-live/slots/{i}/metrics.json' for i in range(1,6)]
historical=defaultdict(list)
for path in oldmetrics:
 for url in json.loads(blob(path))['uncapturedScriptOriginPaths']:historical[key(url)].append(path)
oldrows=[{'origin':pair[0],'pathname':pair[1],'historicalMetrics':paths,'inRerunSlot1Har':(pair,'GET') in harpaths,'slot1Observed':pair in scripts} for pair,paths in sorted(historical.items())]
summary['historicalUncapturedScriptPaths']=len(oldrows)
summary['historicalNowCapturedInRerunSlot1']=sum(row['inRerunSlot1Har'] for row in oldrows)
summary['missingStaticStylesheetPages']=sum(any(d['resourceType']=='stylesheet' for d in row['missingAdmittedResponsesAtPath']) for row in rows)
summary['missingDynamicAtPathPages']=sum(any(d['resourceType'] in ['fetch','xhr'] for d in row['missingAdmittedResponsesAtPath']) for row in rows)
out=Path('.eval-artifacts/phase3b/replay-completion')
probe=[]
for number in [1,6,12,51,52,83]:
 page=next(p for p in manifest['pages'] if p['snapshot']==number);member=tarroot+'/'+page['diagnostic']['file'];body=tar.extractfile(member).read();target=out/'dom-probe'/f'snapshot-{number:04d}.html.gz';target.parent.mkdir(exist_ok=True,parents=True)
 data=io.BytesIO()
 with gzip.GzipFile(filename='',fileobj=data,mode='wb',mtime=0) as f:f.write(body)
 target.write_bytes(data.getvalue())
 probe.append({'snapshot':number,'sourceUrl':page['url'],'originalReplayStatus':page['status'],'path':str(target),'rawSha256':hashlib.sha256(body).hexdigest(),'gzipSha256':hashlib.sha256(data.getvalue()).hexdigest(),'archiveSha256':hashlib.sha256(raw).hexdigest(),'archiveMember':member,'purpose':'DOM-only proposal probe, NOT network Replay qualification'})
(out/'dom-probe-inputs.json').write_text(json.dumps(probe,ensure_ascii=False,indent=2)+'\n')
(out/'static-audit.json').write_text(json.dumps({'summary':summary,'historicalUncapturedScripts':oldrows,'scriptPaths':scriptrows,'pages':rows},ensure_ascii=False,indent=2)+'\n');print(json.dumps(summary,ensure_ascii=False,indent=2))
