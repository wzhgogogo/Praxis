"""Independent saved-artifact checks. No product parser/verifier imports."""
import pathlib,json,hashlib,subprocess,re

out=pathlib.Path(__file__).resolve().parent;root=out.parents[2]
def git(*args):return subprocess.check_output(['git',*args],cwd=root)
freeze=json.loads((out/'freeze.json').read_text())
for r in freeze['files']:assert hashlib.sha256((root/r['path']).read_bytes()).hexdigest()==r['sha256'],r['path']
imports=json.loads((out/'a-imports.json').read_text())
for r in imports['files']:
    raw=(root/r['path']).read_bytes()
    assert hashlib.sha256(raw).hexdigest()==r['sha256']
    assert raw==git('show',freeze['aSource']+':'+r['path'])
prod=['src/infrastructure/browser/browser-runtime.ts','src/infrastructure/browser/browser-task-executor.ts','src/infrastructure/browser/local-playwright-chromium.ts','src/infrastructure/browser/cloudflare-browser-run.ts']
for p in prod:assert git('show','54805c31:'+p)==git('show',freeze['baseMain']+':'+p),p
guards=['src/domains','src/integrations/restaurant-identity','src/integrations/tabelog','src/integrations/tablecheck','src/infrastructure/browser/playwright-read-network-guard.ts']
assert git('diff',freeze['baseMain'],'--',*guards)==b''
gates=json.loads((out/'gates.json').read_text())
assert len(gates)==7 and all(r['returnCode']==0 and r['beforeStatus']=='' and r['afterStatus']=='' for r in gates)
assert len({r['head'] for r in gates})==1
assert git('diff',gates[0]['head'],'--','src','scripts','package.json','package-lock.json')==b''
default=(out/'default.log').read_text()
assert re.search(r'pass 1417\b',default)
assert 'a page-control failure preserves the current session for observation (reuse=false)' in default
assert 'a page-control failure preserves the current session for observation (reuse=true)' in default
browser=(out/'chromium.log').read_text()
assert re.search(r'pass 189\b',browser) and re.search(r'pass 18\b',browser)
assert 'G6 Runner serializes a user-named identity' in browser and 'G6 capability RENAMED' in browser and 'G6 capability CONTROL_FALLBACK' in browser
assert (out/'strict-g2.log').read_text().count('"classification":"PASS"')==12
red=(out/'red-g6.log').read_text()
assert re.search(r'pass 15\b',red) and re.search(r'fail 3\b',red)
assert 'session is closed' in (out/'red-operation.log').read_text()
source=json.loads((root/'src/eval/restaurant/agent-loop/cases/g6-development/source.json').read_text())
paired=[]
for name in ['CONTROL_FALLBACK','RENAMED']:
    before=json.loads((out/'red-captures'/(name+'.json')).read_text())
    after=json.loads((out/'green-captures'/(name+'.json')).read_text())
    assert before['status']=='FAIL' and before['view']['case']['phase']=='NEEDS_INPUT'
    assert after['status']=='PASS' and after['view']['case']['phase']=='PRESENT_RESULTS'
    page=[p for p in after['snapshots'] if p['url']==source['pageUrl']]
    responses=[r for p in page for r in p.get('responses',[]) if r['url']==source['vacancy']['url']]
    assert responses and responses[-1]['body']==source['vacancy']['body']
    wire=responses[-1]['body']
    assert wire['base_date']=={'year':2026,'month':11,'day':11} and wire['members']==2 and wire['selection'][0]['time']=='19:00'
    actions=[json.loads(c['response']['outputText']) for c in after['calls'] if c['request']['purpose']=='browser_read_decide' and c.get('response')]
    assert any(a['action']=='FILL_AUTHORITATIVE' and a['authoritativeField']=='DATE' for a in actions)
    assert any(a['action']=='CHOOSE_OPTION' and a['authoritativeField']=='PARTY_SIZE' for a in actions)
    ids=after['view']['restaurant']['presentedCandidateIds'];assert len(ids)==1
    assert after['view']['restaurant']['availabilityChecks'][ids[0]]['status']=='AVAILABLE'
    assert after['view']['restaurant']['availability'][ids[0]][0]['dateTime']=='2026-11-11T19:00:00+09:00'
    paired.append({'case':name,'before':'NEEDS_INPUT','after':'PRESENT_RESULTS','sourceResponseExact':True,'observedDateAndGuests':True})
target=(out/'target.log').read_text()
identity=json.loads(next(l for l in target.splitlines() if 'SESSION_REUSE_RESULT ' in l).split('SESSION_REUSE_RESULT ',1)[1])
assert identity['conclusions']==[{'name':'Alpha Sushi','status':'COMPLETED'},{'name':'Beta Sushi','status':'COMPLETED'},{'name':'Wrong Sushi','status':'UNKNOWN'},{'name':'Ambiguous Sushi','status':'UNKNOWN'}]
assert 'one read reuses each source search form' in target and re.search(r'pass 5\b',target)
ledger=json.loads((root/'.eval-artifacts/phase3b/budget.json').read_text());rows={r['id']:r for r in ledger['entries']};assert len(rows)==len(ledger['entries'])==832
for rev in [freeze['baseMain'],freeze['aSource']]:
    old=json.loads(git('show',rev+':.eval-artifacts/phase3b/budget.json'));assert all(rows[e['id']]==e for e in old['entries'])
a=json.loads(git('show',freeze['aSource']+':.eval-artifacts/phase3b/budget.json'))
assert ledger['limits']==a['limits'] and ledger['cumulative']==a['cumulative'] and ledger['holdoutReservation']==a['holdoutReservation']
result={'status':'PASS','mode':'independent saved-result audit, constructed sources only','gatedSource':gates[0]['head'],'frozenInputs':len(freeze['files']),'aOriginalFiles':len(imports['files']),
 'pairedSourceCases':paired,'checks':{'exactThreeOldCodeFailures':True,'allABytesUnchanged':True,'nonReuseAndReuseRecovery':True,'originalReuseControls':True,'allSevenStepsClean':True,'guardIdentityVersionsUnchanged':True,'allParentLedgerRowsPreserved':True},'realCalls':0,'limitsCarriedFromAExistingApproval':ledger['limits']}
(out/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
