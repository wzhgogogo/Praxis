from pathlib import Path
import subprocess,json,hashlib,re
from datetime import datetime,timezone
b=Path('.eval-artifacts/phase2c-merge-20261023');sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest();read=lambda p:json.loads(Path(p).read_text())
product=read(b/'product-byte-comparison.json');assert product['exceptions']==0 and product['files']==337
for row in product['rows']:assert sha(row['path'])==row['referenceSha256']==row['mergedSha256'],row['path']
assert subprocess.check_output(['git','diff','16e91940','--',*product['paths']],text=True)==''
parents=subprocess.check_output(['git','rev-list','--parents','-n','1',product['mergeCommit']],text=True).split()[1:];assert parents==['8ba0c54a06189c03fd3f7366a865cf705f314aab','ae2235b6a9d9f76529da0e5ffbd4004b04453a6e']
review='.eval-artifacts/phase2c-location-semantic-20261023/independent-review.md';assert Path(review).read_bytes()==subprocess.check_output(['git','show','ae2235b6:'+review])
counts={}
for name in ['replay-freeze.json','regressions/calibration-freeze.json']:
 f=read(b/name)
 for p,h in f['files'].items():assert sha(p)==h,p
 counts[name]=len(f['files'])
gates=read(b/'gates/results.json');assert len(gates)==5 and all(r['exitCode']==0 for r in gates)
assert 'pass 1022' in (b/'gates/default-tests.log').read_text() and 'pass 137' in (b/'gates/browser-fixtures.log').read_text()
assert read(b/'gates/side-effect-verification.json')['restored']
reg=read(b/'regressions/regression-results.json');assert reg['calendar']['passed']==69 and reg['selection']['passed']==5
cal=read(b/'regressions/calibration/comparison.json');assert cal['outcomeMatches']==22 and cal['normalS0Declaration']['matched']==20
before=read(b/'main-worktree-before.json');main=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing');assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=main,text=True).strip()==before['head'];assert subprocess.check_output(['git','status','--porcelain=v1'],cwd=main,text=True)==before['statusPorcelain']
for p,h in before['files'].items():assert sha(main/p)==h,p
links=0
for p in [b/'report.md',Path('docs/STATUS.md'),Path('docs/history/DEVLOG.md'),Path('docs/history/TEST-LOG.md'),Path('docs/history/monthly/2026-10.md')]:
 for target in re.findall(r'\]\(([^)]+)\)',p.read_text()):
  if p==b/'report.md' or 'phase2c-merge-20261023' in target:
   if not re.match(r'^https?://',target):assert (p.parent/target.split('#')[0]).exists() or (p.parent/target.split('#')[0]).resolve()==(b/'final-integrity.json').resolve(),(p,target);links+=1
index=Path('docs/history/monthly/2026-10-index.md').read_text();index_counts=[]
for section in ['开发','验证']:
 m=re.search(r'## '+section+r'记录（(\d+)条）([\s\S]*?)(?=\n## |\Z)',index);n=sum(line.startswith('| 20') for line in m[2].splitlines());assert n==int(m[1]);index_counts.append(n)
outputs={str(p):sha(p) for p in sorted(b.rglob('*')) if p.is_file() and p.name!='final-integrity.json'}
result={'status':'PASS_REVIEWED_MAINLINE_INTEGRATION','verifiedAt':datetime.now(timezone.utc).isoformat(),'mergeCommit':product['mergeCommit'],'mergeParents':parents,'regressionFreezeCommit':'9ba840d7','productReference':product['reference'],'productFilesIdentical':337,'exceptions':0,'manualConflicts':0,'freezeCounts':counts,'fiveGatesPassed':5,'defaultTests':1022,'Chromium':137,'calendar':69,'selection':5,'calibrationOutcomes':22,'normalDeclarations':20,'primaryWorktreeUserFilesUnchanged':len(before['files']),'primaryWorktreeHeadUnchanged':before['head'],'reviewOriginalUnchanged':True,'newModels':0,'newGoogle':0,'newWebsites':0,'newFullLive':0,'newHoldoutSearchOrRead':False,'verifiedLinks':links,'monthlyIndexCounts':index_counts,'outputs':outputs}
(b/'final-integrity.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='outputs'}))
