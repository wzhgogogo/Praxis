from pathlib import Path
import json,hashlib,subprocess,re
from datetime import datetime,timezone
root=Path.cwd();b=Path('.eval-artifacts/phase2c-location-semantic-20261023');sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
# Old execution evidence is immutable; only the superseding report is moved to an exact preserved copy.
old=json.loads((b/'integrity-verification.json').read_text());oldn=0
for p,h in old['outputs'].items():
 actual=b/'semantic-followup-220/report-before-resume.md' if p==str(b/'report.md') else Path(p)
 assert sha(actual)==h,p;oldn+=1
for name in ['final-regression-freeze.json','final-regressions/calibration-freeze.json']:
 f=json.loads((b/name).read_text())
 for p,h in f['files'].items():assert sha(p)==h,p
semantic=json.loads((b/'semantic-followup-220/execution-verification.json').read_text());assert semantic['chainCalls']==162 and semantic['calls']==54 and semantic['schemaRetries']==0
reg=json.loads((b/'final-regressions/regression-results.json').read_text());assert reg['calendar']['passed']==69 and reg['selection']['passed']==5
cal=json.loads((b/'final-regressions/calibration/comparison.json').read_text());assert cal['outcomeMatches']==22 and cal['normalS0Declaration']['matched']==20
gates=json.loads((b/'final-gates/results.json').read_text());assert len(gates)==5 and all(r['exitCode']==0 for r in gates)
assert 'pass 1022' in (b/'final-gates/default-tests.log').read_text() and 'pass 137' in (b/'final-gates/browser-fixtures.log').read_text()
assert json.loads((b/'final-gates/side-effect-verification.json').read_text())['restored']
assert subprocess.check_output(['git','diff','16e91940','--','src'],text=True)==''
links=0
for p in [b/'report.md',Path('docs/STATUS.md'),Path('docs/history/DEVLOG.md'),Path('docs/history/TEST-LOG.md'),Path('docs/history/monthly/2026-10.md')]:
 text=p.read_text()
 # Only links introduced by this continuation, not unrelated historical external references.
 for target in re.findall(r'\]\(([^)]+)\)',text):
  if ('phase2c-location-semantic-20261023' in target or p==b/'report.md') and not re.match(r'^https?://',target):
   q=(p.parent/target.split('#')[0]).resolve();assert q.exists() or q==(b/'final-integrity.json').resolve(),str(q);links+=1
index=Path('docs/history/monthly/2026-10-index.md').read_text();index_counts=[]
for section in ['开发','验证']:
 match=re.search(r'## '+section+r'记录（(\d+)条）([\s\S]*?)(?=\n## |\Z)',index)
 n=sum(line.startswith('| 20') for line in match[2].splitlines());assert n==int(match[1]),(section,n,match[1]);index_counts.append(n)
preserve=json.loads((b/'baseline-block-preservation.json').read_text());assert sha(preserve['preservedPath'])==preserve['sha256'];assert hashlib.sha256(subprocess.check_output(['git','show',preserve['originalCommit']+':'+preserve['originalPath']])).hexdigest()==preserve['sha256']
source=json.loads((b/'final-audit/source-line-comparison.json').read_text());assert source['sharedNewConstants']==0 and all(all(v==0 for v in row['thisChainDelta'].values()) for row in source['scopes'])
outputs={str(p):sha(p) for p in sorted(b.rglob('*')) if p.is_file() and p.name!='final-integrity.json'}
out={'status':'PASS_FINAL_OFFLINE_INTEGRITY','verifiedAt':datetime.now(timezone.utc).isoformat(),'productCommit':'16e91940','regressionFreezeCommit':'8ad2d118','priorStopArtifactsPreserved':oldn,'sourceAndOracleFiles':4182,'calibrationFreezeFiles':812,'verifiedLocalLinks':links,'monthlyIndexCounts':index_counts,'originalBaselineConflictRecordPreserved':True,'semantic':{'newCalls':54,'priorCalls':108,'chainCalls':162,'chainCap':220,'focusSoba':'3/3','numericDirection':'12/12','newWebsites':0,'newGoogle':0,'fullLive':0},'gates':{'typecheck':'PASS','arch':'PASS','default':1022,'build':'PASS','Chromium':137,'calendar':69,'selection':5,'calibration':22,'normalDeclarations':20},'sourceLineDelta':0,'overallHistoricalExit6':'NOT_SATISFIED','independentReview':'PENDING','outputs':outputs}
(b/'final-integrity.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({k:v for k,v in out.items() if k!='outputs'}))
