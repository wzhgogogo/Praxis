from pathlib import Path
import hashlib,json,subprocess,collections,re
root=Path('.eval-artifacts/phase3b/test-suite-review')
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
source=json.loads((root/'source-sha256.json').read_text())
assert all(sha(file)==digest for file,digest in source.items())
assert not subprocess.check_output(['git','diff','ba466eb3','--','src','scripts','package.json','package-lock.json'])
mapping=json.loads((root/'runtime-map.json').read_text());assert not mapping['unbound']
rows=json.loads((root/'runtime-review.json').read_text());tests=[r for r in rows if r['testType']=='test']
assert len(tests)==1378 and len({r['reason'] for r in tests})==1378
assert collections.Counter(r['cohort'] for r in tests)=={'default':1203,'chromium':175}
cards=json.loads((root/'static-cards.json').read_text());ids={c['id'] for c in cards}
for proposal in json.loads((root/'proposals.json').read_text())['items']:
 assert proposal['source'] in ids and all(ref in ids for ref in proposal['coveredBy'])
 if proposal['proposedTestReduction']:
  assert not next(r for r in rows if r['declarationId']==proposal['source'])['protectedReasons']
main=json.loads(subprocess.check_output(['git','show','ba466eb3:.eval-artifacts/phase3b/budget.json'],text=True))
repeat=json.loads(subprocess.check_output(['git','show','f80dacb0:.eval-artifacts/phase3b/budget.json'],text=True))
local=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text());by={e['id']:e for e in local['entries']}
assert len(by)==len(local['entries'])
assert all(by[e['id']]==e for e in main['entries'])
paid=[e for e in repeat['entries'] if e['id'].startswith('phase3b-A-g1-schema3-repeat-20261028-')]
assert len(paid)==19 and all(by[e['id']]==e for e in paid)
assert sum(e.get('realModelCalls',0) for e in paid)==19
assert local['cumulative']['realModelCalls']==main['cumulative']['realModelCalls']+19
assert local['cumulative']['evaluationPublicGET']==main['cumulative']['evaluationPublicGET']
assert all(not any(e.get(key,0) for key in ['realModelCalls','evaluationPublicGET','googleRequests','restaurantWebsiteRequests','fullLive','environmentReruns']) for e in local['entries'] if 'test-suite-review' in e['id'])
links=[]
for p in [root/'report.md',root/'review-list.md']:
 for target in re.findall(r'\]\(([^)]+)\)',p.read_text()):
  if target.startswith(('https:','http:','#')):continue
  assert (p.parent/target.split('#')[0]).exists(),(str(p),target)
  links.append(target)
result={'sourceHashes':len(source),'productAndTestDiffFromMain':0,'runtimeTests':len(tests),'runtimeMapGaps':0,'duplicateReasons':0,'reviewedFilesWithDeclarations':128,'compileOnlyFileReview':1,'mainLedgerEntriesPreserved':len(main['entries']),'paidRowsImportedByteEquivalent':len(paid),'auditRealCalls':0,'ledgerEntries':len(by),'localReportLinksChecked':len(links),'diffCheckExitCode':subprocess.run(['git','diff','--check']).returncode}
assert result['diffCheckExitCode']==0
(root/'delivery-validation.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
