"""Independent strict origin/path/ID audit after simulation, no source calls."""
from pathlib import Path
from urllib.parse import urlparse
import hashlib,json,re,sys
ROOT=Path('.eval-artifacts/phase3b/g4-japanese-prep')
def load(p):return json.loads(Path(p).read_text())
def identity(url):
 u=urlparse(url or '');match=re.fullmatch(r'/(?:en/)?tokyo/A\d+/A\d+/(\d+)/?',u.path)
 return match[1] if u.scheme=='https' and u.netloc=='tabelog.com' and not u.query and not u.fragment and match else None
def build():
 for f in load(ROOT/'posthoc-freeze.json')['files']:assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
 gold={r['id']:r['rstId'] for r in load('.eval-artifacts/phase3b/g4-e2e/gold.json')['rows']}
 rows=[load(ROOT/'execution'/f"{s['key']}.json") for s in load(ROOT/'inputs.json')['rows']]
 accepted=[];focus=[]
 for row in rows:
  for read in row['reads']:
   if read.get('bodyPath'):assert hashlib.sha256(Path(read['bodyPath']).read_bytes()).hexdigest()==read['sha256']
  if row['acceptedUrl']:
   assert row['status']=='MATCH' and not row['uncertainties']
   target=identity(row['acceptedUrl']);assert target==gold[row['id']],row['key']
   assert any(r['kind']=='DETAIL' and r.get('bodyPath') and identity(r['url'])==target for r in row['reads'])
   accepted.append(row['key'])
  if row['view']=='MAIN37' and row['id'] in ['nr-007','nr-008','nr-019','nr-025']:
   jp=next((s for s in row['searches'] if s['kind']=='JAPANESE'),None)
   focus.append({'id':row['id'],'status':row['status'],'japaneseCertifiedRank':next((i+1 for i,o in enumerate(jp['ordered']) if identity(o['sourceUrl'])==gold[row['id']]),None) if jp else None,
    'certifiedDetailSelected':any(identity(d['url'])==gold[row['id']] for d in row['details']),
    'uncertainties':row['uncertainties']})
 assert len(rows)==41 and len(accepted)==26
 assert identity('https://other.invalid/en/tokyo/A1/A2/123/') is None
 assert identity('https://tabelog.com/en/tokyo/A1/A2/123/?unbound=1') is None
 return {'schema':'g4-source-simulation-independent-audit@1','views':41,'mainViews':37,'separateReruns':4,
  'acceptedVerified':len(accepted),'wrongAccepted':0,'acceptedKeys':accepted,'focusFour':focus,'newCalls':0,
  'limits':'No identity claim for NOT_EVALUATED. Strict public URL + certified ID + frozen detail bytes, not production confidence alone.'}
if __name__=='__main__':
 assert sys.argv[1] in ['--write','--verify-only'];value=build();p=ROOT/'independent-verification.json'
 if sys.argv[1]=='--write':
  with p.open('x') as f:f.write(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
 else:assert load(p)==value
 print(json.dumps({k:value[k] for k in ['views','acceptedVerified','wrongAccepted','newCalls']}))
