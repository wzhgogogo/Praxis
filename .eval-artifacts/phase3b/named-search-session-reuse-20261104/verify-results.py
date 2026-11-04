"""Independent assertions on saved execution and immutable source boundaries.
No product parser/evaluator imports and no source/network execution.
"""
import hashlib, json, pathlib, re, subprocess

out=pathlib.Path(__file__).resolve().parent
root=out.parents[2]
def git(*args): return subprocess.check_output(['git',*args],cwd=root)
frozen=json.loads((out/'freeze.json').read_text())
for row in frozen['files']:
    assert hashlib.sha256((root/row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
receipts=json.loads((out/'gates.json').read_text())
assert len(receipts)==7
assert all(r['returnCode']==0 and r['beforeStatus']=='' and r['afterStatus']=='' for r in receipts)
assert len({r['head'] for r in receipts})==1
assert git('diff',receipts[0]['head'],'--','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json')==b''
target=(out/'target.log').read_text()
line=next(l for l in target.splitlines() if 'SESSION_REUSE_RESULT ' in l)
result=json.loads(line.split('SESSION_REUSE_RESULT ',1)[1])
assert result['conclusions']==[
 {'name':'Alpha Sushi','status':'COMPLETED'},
 {'name':'Beta Sushi','status':'COMPLETED'},
 {'name':'Wrong Sushi','status':'UNKNOWN'},
 {'name':'Ambiguous Sushi','status':'UNKNOWN'},
]
assert result['submissions']==['Beta Sushi','Wrong Sushi','Ambiguous Sushi']
assert (result['sessionOpens'],result['entranceNavigations'],result['externalCalls'])==(1,1,0)
assert result['sourceModelCalls']==2
browser=json.loads((out/'browser-form-result.json').read_text())
requests=browser['received']
assert all(r['method']=='GET' and (r['url'].startswith('/search?') or r['url']=='/favicon.ico') for r in requests)
assert [r['url'] for r in requests if r['url'].startswith('/search?')]==['/search?q=Alpha','/search?q=Beta','/search?q=Gamma']
assert sum(d['event']=='SESSION_OPENED' for d in browser['diagnostics'])==1
assert sum(d['event']=='OPERATION_STARTED' and d.get('detail')=='NAVIGATE' for d in browser['diagnostics'])==1
assert sum(d['event']=='OPERATION_STARTED' and d.get('detail')=='SUBMIT_PUBLIC_QUERY' for d in browser['diagnostics'])==2
assert '3 !== 2' in (out/'red-frozen.log').read_text()
assert re.search(r'pass 45\b',(out/'composition-local-chromium.log').read_text())
base=frozen['baseMain']
protected=['src/eval','src/harness','src/application/fixtures',
 'src/integrations/tabelog/tabelog-query-controls.ts',
 'src/integrations/tabelog/tabelog-vacancy-response.ts',
 'src/integrations/restaurant-identity','src/domains/restaurant/outlet-identity.ts',
 'src/infrastructure/browser/playwright-read-network-guard.ts',
 'src/integrations/restaurant-availability/public-browser-read-network-policy.ts']
assert git('diff',base,'--',*protected)==b''
previous=json.loads(git('show','c1c1187af13941815eb10756416054708922984d:.eval-artifacts/phase3b/budget.json'))
current=json.loads((root/'.eval-artifacts/phase3b/budget.json').read_text())
index={e['id']:e for e in current['entries']}
assert len(index)==len(current['entries'])==830
assert all(index[e['id']]==e for e in previous['entries'])
assert current['cumulative']==previous['cumulative'] and current['limits']==previous['limits']
increment=index['phase3b-C-named-search-session-reuse-20261104']
assert all(increment[k]==0 for k in ['fullLive','realModelCalls','environmentReruns','evaluationPublicGET','googleRequests','restaurantWebsiteRequests'])
audit={'status':'PASS','mode':'independent saved-artifact audit','frozenInputs':len(frozen['files']),
 'gatedSource':receipts[0]['head'],'checks':{'allSevenStepsClean':True,'protectedSourcesUnchanged':True,
 'twoAcceptedAndTwoUnresolvedIdentities':True,'localReceiverGETOnlyExactQueries':True,
 'effectiveFrozenRed':True,'persistentComposition45of45':True,'all829LedgerRowsPreserved':True,
 'countersAndLimitsUnchangedFromApprovedBReceipt':True},'sourceFixtureResult':result,
 'scope':'Constructed offline regression only; no new Live delivery rate or current-site performance measurement.'}
(out/'independent-verification.json').write_text(json.dumps(audit,indent=2)+'\n')
print(json.dumps({'status':'PASS','frozenInputs':len(frozen['files']),'checks':audit['checks']}))
