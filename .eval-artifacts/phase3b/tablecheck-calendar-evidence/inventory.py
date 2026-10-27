"""Offline saved-page inventory; no product parser and no source transport."""
from pathlib import Path
from html import unescape
import argparse,subprocess,json,re,hashlib,tarfile,io,gzip,datetime,zoneinfo
ROOT=Path('.eval-artifacts/phase3b/tablecheck-calendar-evidence')
REV='daba2ef03451ed8e54f152b1c8387a6d329d9f20'

def blobs(entries):
 stream=subprocess.Popen(['git','cat-file','--batch'],stdin=subprocess.PIPE,stdout=subprocess.PIPE)
 try:
  for entry in entries:
   stream.stdin.write((entry['gitObjectId']+'\n').encode());stream.stdin.flush()
   header=stream.stdout.readline().decode().split();assert header[1]=='blob'
   body=stream.stdout.read(int(header[2]));assert stream.stdout.read(1)==b'\n'
   yield entry,body
 finally:
  stream.stdin.close();stream.wait();assert stream.returncode==0

def freeze():
 entries=[];excluded=[]
 for line in subprocess.check_output(['git','ls-tree','-r',REV,'.eval-artifacts','src/harness/browser/fixtures','src/integrations/tablecheck/fixtures'],text=True).splitlines():
  meta,path=line.split('\t',1);_,kind,oid=meta.split()
  if kind!='blob' or not path.endswith(('.html','.html.gz','.tar.gz','.tgz')):continue
  if re.search('holdout|clean[-_]set',path,re.I) or '.mutated.html' in path:
   excluded.append({'path':path,'reason':'PRIVATE_HOLDOUT_PATH_NOT_READ' if 'holdout' in path.lower() else 'NOT_AN_ORIGINAL_PAGE'});continue
  entries.append({'path':path,'gitObjectId':oid})
 for entry,body in blobs(entries):entry.update({'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body)})
 result={'sourceGit':REV,'scope':'All committed saved HTML/HTML.gz and tar.gz in the three listed roots; no private holdout paths or mutated copies','entries':entries,'excluded':excluded,'newRealCalls':0}
 target=ROOT/'inputs.json.gz';assert not target.exists();target.write_bytes(gzip.compress((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode(),mtime=0))
 print(json.dumps({'sourceGit':REV,'inputCount':len(entries),'excluded':len(excluded),'inputManifestSha256':hashlib.sha256(target.read_bytes()).hexdigest()}))

def inventory(output):
 frozen=json.loads(gzip.decompress((ROOT/'inputs.json.gz').read_bytes()));files=[];archives=[];candidates=[]
 def inspect(body,path,kind):
  text=body.decode('utf8',errors='replace');widget=bool(re.search(r'<div\b[^>]*data-testid=[\"\']Venue Availability[\"\']',text,re.I))
  tablecheck=widget or bool(re.search(r'<(?:link|meta)\b[^>]*(?:tablecheck\.com|[\"\']TableCheck[\"\'])',text,re.I))
  slots=bool(re.search(r'<a\b[^>]*data-testid=[\"\']Venue Timeslot Btn[\"\']',text,re.I))
  times=[]
  if tablecheck:
   # This is only a broad candidate search. Selected time options are excluded:
   # their presence alone is not an available inventory fact.
   for tag in re.finditer(r'<(a|button)\b[^>]*>[\s\S]*?</\1>',text,re.I):
    label=' '.join(unescape(re.sub('<[^>]+>',' ',tag[0])).split())
    if re.search(r'\b(?:[01]?\d|2[0-3]):[0-5]\d\b',label):times.append({'text':label,'htmlOffset':tag.start()})
  row={'path':path,'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body),'tablecheckPage':tablecheck,'venueWidget':widget,'unavailableMarker':bool(re.search(r'data-testid=[\"\']Venue Unavailable Msg[\"\']',text,re.I)),'timeslotAnchor':slots,'timeActionCandidates':times}
  if slots or times:candidates.append({'kind':kind,**row})
  return row
 for entry,body in blobs(frozen['entries']):
  assert hashlib.sha256(body).hexdigest()==entry['sha256'],entry['path'];path=entry['path']
  if path.endswith(('.tar.gz','.tgz')):
   members=[]
   with tarfile.open(fileobj=io.BytesIO(body)) as archive:
    for member in archive.getmembers():
     if member.isfile() and member.name.endswith('.html') and not re.search('holdout|clean[-_]set',member.name,re.I):members.append(inspect(archive.extractfile(member).read(),path+'::'+member.name,'ARCHIVED_HTML'))
   archives.append({'path':path,'sha256':entry['sha256'],'htmlMembers':members})
  else:files.append(inspect(gzip.decompress(body) if path.endswith('.gz') else body,path,'SAVED_HTML'))
 rows=files+[m for a in archives for m in a['htmlMembers']]
 summary={'timeCET':datetime.datetime.now(zoneinfo.ZoneInfo('Europe/Vienna')).isoformat(),'sourceGit':REV,'inputManifestSha256':hashlib.sha256((ROOT/'inputs.json.gz').read_bytes()).hexdigest(),'savedHtmlFiles':len(files),'archives':len(archives),'archiveHtmlMembers':sum(len(a['htmlMembers']) for a in archives),'tablecheckPages':sum(r['tablecheckPage'] for r in rows),'venueWidgets':sum(r['venueWidget'] for r in rows),'unavailableMarkers':sum(r['unavailableMarker'] for r in rows),'timeslotAnchors':sum(r['timeslotAnchor'] for r in rows),'timeActionCandidatePages':len(candidates),'newRealCalls':0,'note':'Counts include duplicate captures, not independent restaurants. Marker absence alone does not prove availability absence; broad semantic action candidates require manual review. Select options, business hours and source snippets are not inventory.'}
 target=Path(output);assert not target.exists();target.mkdir(parents=True)
 (target/'inventory.json.gz').write_bytes(gzip.compress((json.dumps({'summary':summary,'files':files,'archives':archives},ensure_ascii=False,indent=2)+'\n').encode(),mtime=0))
 (target/'candidates.json').write_text(json.dumps(candidates,ensure_ascii=False,indent=2)+'\n');(target/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps(summary,ensure_ascii=False))

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--freeze',action='store_true');parser.add_argument('--out');args=parser.parse_args()
 if args.freeze:freeze()
 else:
  assert args.out;inventory(args.out)
