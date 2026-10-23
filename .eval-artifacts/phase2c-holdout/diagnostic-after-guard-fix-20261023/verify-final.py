from pathlib import Path
import json,hashlib,subprocess,re
b=Path('.eval-artifacts/phase2c-holdout/diagnostic-after-guard-fix-20261023');read=lambda p:json.loads(Path(p).read_text());sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
counts={}
for name in ['freeze.json','freeze-continuation.json']:
 f=read(b/name)
 for p,h in f['files'].items():assert sha(p)==h,p
 counts[name]=len(f['files'])
assert not subprocess.check_output(['git','diff','4d953731','--','src','scripts','web-skills','package.json','package-lock.json','tsconfig.json','tsconfig.build.json'])
for p in ['.eval-artifacts/phase2c-holdout/holdout.yaml','.eval-artifacts/phase2c-holdout/exit-dates.json','.eval-artifacts/phase2c-holdout/exit-live-20261023/runner-input.yaml','.eval-artifacts/phase2c-holdout/witness-certification-20261023/registry.json']:
 assert Path(p).read_bytes()==subprocess.check_output(['git','show','1a2e7c12:'+p]),p
r=read(b/'run-report.final.json');assert r['models']==77 and r['fullLive']==2 and r['Google']==9 and r['newEvaluationFiles']==0 and r['ledgerTotals']=={'models':4395,'Live':91,'environmentReruns':5}
post=[]
for row in r['rows']:
 assert row['original18Contribution']==0 and row['deliveryCount']==0 and not row['nearDefect']
 a=read(row['artifactPath']);assert sha(row['artifactPath'])==row['artifactSha256'];assert a['failureCode']=='RUN_DEADLINE_EXCEEDED';assert row['decisions']['rows']==row['modelCalls'];assert row['formalRunStarted']
 hs=row['sourceHealthAttempts'];assert len(hs)==2
 from datetime import datetime,timezone
 parse=lambda v:datetime.fromisoformat(v.replace('Z','+00:00'))
 assert (parse(hs[1]['startedAt'])-parse(hs[0]['finishedAt'])).total_seconds()>=300
 assert all(o['outcome']=='HEALTHY' and o['httpStatus']==200 for o in hs[1]['observations'])
 assert parse(row['finishedAt'])<parse('2026-10-24T04:15:40Z')
 m=read(b/f"attempt-{row['run']}/post-run/manifest.json")
 for raw in m['rows']:
  assert sha(raw['bodyPath'])==raw['sha256'];assert raw['parameters']=={'rst_id':'13108466','svd':'20261104','svps':'2','svt':'1900'}
  post.append({'run':row['run'],'status':raw.get('status'),'requestedAt':raw['requestedAt'],'finishedAt':raw['finishedAt'],'bodySha256':raw['sha256']})
 for p,h in read(b/'recovery/first-artifacts.json')['files'].items():assert sha(p)==h,p
w=read(b/'wordings.final.json');assert w['entries']==[];assert not any(k in w for k in ['outcome','result','grade','delivery'])
for row in read(b/'network-raw-manifest.json')['files']:assert sha(row['path'])==row['sha256']
links=[]
for target in re.findall(r'\]\(([^)]+)\)',(b/'report.final.md').read_text()):
 if '://' in target:continue
 p=b/target.split('#')[0];assert p.exists(),target;links.append(target)
index=Path('docs/history/monthly/2026-10-index.md').read_text();tableCounts={}
for name,label in [('DEVLOG','开发'),('TEST-LOG','验证')]:
 sec=re.search(r'## '+label+r'记录（(\d+)条）\n(.*?)(?=\n## |\Z)',index,re.S);n=len(re.findall(r'\]\(../'+name+r'\.md#[^)]+\)',sec[2]));assert n==int(sec[1]);tableCounts[name]=n
primary=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing');p=read('.eval-artifacts/phase2c-merge-20261023/main-worktree-before.json')
assert subprocess.check_output(['git','-C',str(primary),'rev-parse','HEAD']).decode().strip()==p['head']
for n,h in p['files'].items():assert sha(primary/n)==h,n
out={'status':'PASS','mainline':'4d953731163e922741ea91ccc6c1c47b53f0b0e1','frozenFilesVerified':counts,'productByteDifferences':[],'originalGoldDateInputRegistryUnchanged':True,'original18Contribution':0,'newFullLive':2,'newModels':77,'Google':9,'totals':r['ledgerTotals'],'noKnownNearDefect':True,'completeGrading':'DEFERRED','unmatchedWordingEntries':0,'postRaw':post,'firstAttemptImmutableFiles':len(read(b/'recovery/first-artifacts.json')['files']),'reportLinks':len(links),'monthlyIndex':tableCounts,'primaryUserFilesUnchanged':9,'artifactsSha256':{str(p):sha(p) for p in b.rglob('*') if p.is_file() and p.name!='final-integrity.json'}}
(b/'final-integrity.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({k:v for k,v in out.items() if k!='artifactsSha256'},indent=2))
