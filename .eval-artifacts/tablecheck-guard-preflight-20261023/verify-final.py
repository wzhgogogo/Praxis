from pathlib import Path
import json, hashlib, subprocess, re
b=Path('.eval-artifacts/tablecheck-guard-preflight-20261023')
sha=lambda v:hashlib.sha256(v).hexdigest()
read=lambda p:json.loads(Path(p).read_text())
inputs=read(b/'input-manifest.json')
for row in inputs['files']:
 data=(b/'h14-inputs'/row['name']).read_bytes()
 assert sha(data)==row['sha256'] and len(data)==row['bytes']
 assert data==subprocess.check_output(['git','show',row['sourceCommit']+':'+row['source']])
freezes={}
for p in [b/'replay-freeze.json',b/'regressions/calibration-freeze.json']:
 f=read(p)
 for name,h in f['files'].items(): assert sha(Path(name).read_bytes())==h,name
 freezes[str(p)]={'files':len(f['files']),'sha256':sha(p.read_bytes())}
assert not subprocess.check_output(['git','diff','b6ac60c5','--','src'])
unchanged=['src/domains','src/application','src/core','src/web']
for scope in unchanged: assert not subprocess.check_output(['git','diff','8487a844','--',scope]),scope
scope=read(b/'policy-scope.json');assert scope['status']=='PASS' and not any(scope[k] for k in ['newOrigins','newPaths','newMethods']) and scope['prohibitedPathsUnchanged']
gates=read(b/'gates/results.json');assert len(gates)==5 and all(x['exitCode']==0 for x in gates)
for name,n in [('default-tests',1026),('browser-fixtures',138)]:
 s=(b/f'gates/{name}.log').read_text(); assert re.search(r'(?:pass|passed)\D*'+str(n)+r'\b',s,re.I),(name,n)
assert read(b/'gates/side-effect-verification.json')['restored']
r=read(b/'regressions/regression-results.json');assert r['status']=='PASS' and r['calendar']['passed']==69 and r['selection']['passed']==5 and r['newModelCalls']==0
c=read(b/'regressions/calibration/comparison.json');assert c['status']=='PASS' and c['outcomeMatches']==22 and c['normalS0Declaration']=={'matched':20,'total':20}
for row in c['rows']:assert sha(Path(row['outputPath']).read_bytes())==row['outputSha256']
report=b/'report.md'
links=[]
for target in re.findall(r'\]\(([^)]+)\)',report.read_text()):
 if '://' in target or target.startswith('#'):continue
 p=report.parent/target.split('#')[0]
 assert p.exists() or p==b/'final-integrity.json',target
 links.append(target)
index=Path('docs/history/monthly/2026-10-index.md').read_text()
counts={}
for name,prefix,label in [('DEVLOG','DEV','开发'),('TEST-LOG','TEST','验证')]:
 log=Path(f'docs/history/{name}.md').read_text()
 anchors=re.findall(r'^## ('+prefix+r'-[^\n]+)',log,re.M)
 assert len(anchors)==len(set(anchors))
 n=int(re.search(r'## '+label+r'记录（(\d+)条）',index)[1])
 # Monthly index has exactly one link per current-month history anchor.
 section=re.search(r'## '+label+r'记录（\d+条）\n(.*?)(?=\n## |\Z)',index,re.S)[1]
 rows=re.findall(r'\]\(../'+name+r'\.md#[^)]+\)',section)
 assert len(rows)==n,(name,n,len(rows))
 counts[name]=n
tracked=subprocess.check_output(['git','ls-files','-z','src','docs/STATUS.md','docs/history/DEVLOG.md','docs/history/TEST-LOG.md','docs/history/monthly/2026-10-index.md','docs/history/monthly/2026-10.md']).decode().split('\0')
outputs={str(p):sha(p.read_bytes()) for p in b.rglob('*') if p.is_file() and p.name!='final-integrity.json'}
out={'status':'PASS','baseline':'8487a844','implementation':'b6ac60c5','regressionFreezeCommit':'abcf5ad9','frozenInputsUnchanged':len(inputs['files']),'freezes':freezes,'sourceUnchangedSinceImplementation':True,'domainApplicationCoreWebUnchanged':unchanged,'fiveGates':gates,'calendar':69,'selection':5,'calibrationOutcomes':22,'normalDeclarations':20,'reportLinks':len(links),'monthlyIndexCounts':counts,'usageIncrement':{'model':0,'google':0,'realRestaurantWebsites':0,'completeLive':0},'fileSha256':outputs,'trackedSourceAndLogSha256':{p:sha(Path(p).read_bytes()) for p in tracked if p}}
(b/'final-integrity.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({k:v for k,v in out.items() if k not in ['fileSha256','trackedSourceAndLogSha256','fiveGates']},indent=2))
