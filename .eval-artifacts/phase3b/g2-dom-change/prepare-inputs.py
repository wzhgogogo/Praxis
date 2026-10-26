from pathlib import Path
import subprocess,hashlib,json,tarfile,io,gzip
REV='cc12732020256f22e1827bf62fb4b66ccc3cb0ba'
def blob(path):return subprocess.check_output(['git','show',REV+':'+path])
def sha(value):return hashlib.sha256(value).hexdigest()
out=Path('src/harness/browser/fixtures/dom-change');out.mkdir(parents=True,exist_ok=True)
archive='.eval-artifacts/phase3a-prime/f5-live-rerun/evidence/slot-1-recording.tar.gz';data=blob(archive)
archive_file=tarfile.open(fileobj=io.BytesIO(data));root=archive_file.getnames()[0].split('/')[0];manifest=json.load(archive_file.extractfile(root+'/recording.json'))
old='.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-18-attempt-1/recordings/hybrid-1792599832794';oldmanifest=json.loads(blob(old+'/recording.json'));docs={x['snapshot']:x for x in oldmanifest['documents']}
pages=[]
def compress(body):
 data=io.BytesIO()
 with gzip.GzipFile(fileobj=data,mode='wb',filename='',mtime=0) as f:f.write(body)
 return data.getvalue()
def add(id,site,kind,body,url,provenance,dates):
 path=out/(id+'.html.gz');path.write_bytes(compress(body));prov={'schema':'saved-page-provenance@1','evidenceStatus':'frozen exposed saved-page DOM; not current website or inventory','fixture':str(path),'fixtureSha256':sha(body),'storageEncoding':'gzip','storageSha256':sha(path.read_bytes()),'sourceUrl':url,'sourceGit':REV,'source':provenance,'newRealCalls':0,'inlineScriptsExecuted':False};Path(str(path)+'.provenance.json').write_text(json.dumps(prov,ensure_ascii=False,indent=2)+'\n');pages.append({'id':id,'site':site,'kind':kind,'path':str(path),'sha256':sha(body),'sourceUrl':url,'provenancePath':str(path)+'.provenance.json','dates':dates,'request':{'date':dates[0],'partySize':2,'timeWindow':{'earliest':'19:00','latest':'19:00'}}})
for name,kind,n in [('tabelog-list-nerima','LIST',4),('tabelog-list-akabane','LIST',9),('tabelog-detail-01','DETAIL',6),('tabelog-detail-02','DETAIL',7)]:
 d=next(x for x in manifest['documents'] if x['snapshot']==n);member=root+'/'+d['file'];add(name,'TABELOG',kind,archive_file.extractfile(member).read(),d['url'],{'kind':'ORIGINAL_SANITIZED_DOCUMENT','archive':archive,'archiveSha256':sha(data),'member':member,'snapshot':n,'capturedOn':'2026-10-25 UTC'},['2026-11-04'])
for name,path in [('tabelog-calendar-teppen','src/harness/browser/fixtures/tabelog-teppen-calendar-20260929.html'),('tabelog-calendar-sen','src/harness/browser/fixtures/tabelog-sen-no-slots-20261010.html'),('tablecheck-list-ginza','src/harness/browser/fixtures/tablecheck-ginza-card-20260929.html')]:
 p=json.loads(blob(path+'.provenance.json'));add(name,'TABLECHECK' if name.startswith('tablecheck') else 'TABELOG','LIST' if 'list' in name else 'CALENDAR',blob(path),p['sourceUrl'],{'kind':'EXISTING_SAVED_FIXTURE','path':path,'provenanceSha256':sha(blob(path+'.provenance.json')),'capturedOn':p['capturedOn']},['2026-09-29','2026-09-28','2026-09-30'] if name.endswith('teppen') else ['2026-10-22','2026-10-01'])
p=next(x for x in manifest['pages'] if x['snapshot']==12);member=root+'/diagnostic/snapshot-0012.html';add('tablecheck-list-akabane','TABLECHECK','LIST',archive_file.extractfile(member).read(),p['url'],{'kind':'DIAGNOSTIC_DOM_ONLY_NOT_REPLAY_QUALIFIED','archive':archive,'archiveSha256':sha(data),'member':member,'snapshot':12,'originalQualification':p['reason'],'capturedOn':'2026-10-25 UTC'},['2026-11-04'])
for name,kind,n in [('tablecheck-detail-nakamata','DETAIL',4),('tablecheck-detail-takahashiya','DETAIL',5),('tablecheck-calendar-nakamata','CALENDAR',17),('tablecheck-calendar-kinri','CALENDAR',40)]:
 d=docs[n];path=old+'/'+d['file'];add(name,'TABLECHECK',kind,blob(path),d['url'],{'kind':'ORIGINAL_SAVED_DOCUMENT','path':path,'sourceManifest':old+'/recording.json','sourceManifestSha256':sha(blob(old+'/recording.json')),'snapshot':n,'capturedOn':'2026-10-21 UTC'},['2026-11-06'] if kind=='CALENDAR' else ['2026-10-22'])
assert len(pages)==12
(out/'manifest.json').write_text(json.dumps({'schema':'dom-change-inputs@1','mutationRule':'dom-marker-mutation@2','seed':'phase3b-g2-seed-20261026','sourceGit':REV,'publicSemantics':'all ids renamed and bound references rewritten per user clarification; dangling ids unchanged; scripts not executed or rewritten','pages':pages},ensure_ascii=False,indent=2)+'\n')
