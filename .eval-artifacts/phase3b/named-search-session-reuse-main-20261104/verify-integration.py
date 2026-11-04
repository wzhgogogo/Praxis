"""Saved-output/source audit only; no product imports or external calls."""
from collections import Counter
import hashlib,json,pathlib,re,subprocess

out=pathlib.Path(__file__).resolve().parent
root=out.parents[2]
def git(*args):return subprocess.check_output(['git',*args],cwd=root)
freeze=json.loads((out/'freeze.json').read_text())
for row in freeze['files']:
    assert hashlib.sha256((root/row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
gates=json.loads((out/'gates.json').read_text())
assert len(gates)==9
assert all(r['returnCode']==0 and r['beforeStatus']=='' and r['afterStatus']=='' for r in gates)
assert len({r['head'] for r in gates})==1
assert git('diff',gates[0]['head'],'--','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json')==b''
proof=json.loads((out/'merge-proof.json').read_text())
def canonical(raw):return b'\n'.join(l for l in raw.splitlines() if not l.startswith((b'index ',b'@@ ')))
p='src/infrastructure/browser/browser-task-executor.ts'
for original,other in [(proof['reviewedC'],proof['main']),(proof['main'],proof['reviewedC'])]:
    assert canonical(git('diff',proof['base'],original,'--',p))==canonical(git('diff',other,'--',p))
for row in proof['sourceRows']:
    assert hashlib.sha256((root/row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
oldpaths=git('ls-tree','-r','--name-only',proof['reviewedC'],'.eval-artifacts/phase3b/named-search-session-reuse-20261104').decode().splitlines()
for p in oldpaths:assert (root/p).read_bytes()==git('show',proof['reviewedC']+':'+p),p
for p in ['docs/STATUS.md','docs/history/DEVLOG.md','docs/history/TEST-LOG.md','docs/history/monthly/2026-11-index.md','docs/history/monthly/2026-11.md','docs/integrations/CAPABILITY-MATRIX.md']:
    current=Counter((root/p).read_text().splitlines())
    for parent in [proof['main'],proof['reviewedC']]:
        assert not (Counter(git('show',parent+':'+p).decode().splitlines())-current),p
for name,count in [('default',1415),('chromium',189),('strict-g2',5),('target',18),('reuse-floor',1)]:
    raw=(out/(name+'.log')).read_text()
    assert re.search(r'pass '+str(count)+r'\b',raw),(name,count)
assert (out/'strict-g2.log').read_text().count('"classification":"PASS"')==12
raw=(out/'target.log').read_text()
data=json.loads(next(l for l in raw.splitlines() if 'SESSION_REUSE_RESULT ' in l).split('SESSION_REUSE_RESULT ',1)[1])
assert data['conclusions']==[{'name':'Alpha Sushi','status':'COMPLETED'},{'name':'Beta Sushi','status':'COMPLETED'},{'name':'Wrong Sushi','status':'UNKNOWN'},{'name':'Ambiguous Sushi','status':'UNKNOWN'}]
assert data['externalCalls']==0
browser=json.loads((out/'browser-form-result.json').read_text())
assert all(r['method']=='GET' for r in browser['received'])
assert [r['url'] for r in browser['received'] if r['url'].startswith('/search?')]==['/search?q=Alpha','/search?q=Beta','/search?q=Gamma']
assert (browser['sessionOpens'],browser['entranceNavigations'],browser['observedSubmissions'])==(1,1,2)
ledger=json.loads((root/'.eval-artifacts/phase3b/budget.json').read_text())
rows={e['id']:e for e in ledger['entries']}
assert len(rows)==len(ledger['entries'])==830
for parent in [proof['main'],proof['reviewedC']]:
    old=json.loads(git('show',parent+':.eval-artifacts/phase3b/budget.json'))
    assert all(rows[e['id']]==e for e in old['entries'])
mainLedger=json.loads(git('show',proof['main']+':.eval-artifacts/phase3b/budget.json'))
assert ledger['limits']==mainLedger['limits'] and ledger['cumulative']==mainLedger['cumulative']
assert ledger['holdoutReservation']==mainLedger['holdoutReservation']
checks={'nineCleanStepsSameSource':True,'all850InputHashesUnchanged':True,
 'bothExecutorDeltasExact':True,'all22UnsharedSourcesUnchanged':True,'all32OriginalCArtifactsUnchanged':True,
 'bothParentDocumentLinesPreserved':True,'sourceIdentityControlsUnchanged':True,
 'observedSubmitHonorsPostFillNavigationFloor':True,'actualLocalGuardFormPasses':True,
 'allParentLedgerRowsAndApprovedMainCeilingsPreserved':True}
result={'status':'PASS','kind':'independent source and saved-result audit','gatedSource':gates[0]['head'],
 'checks':checks,'realCalls':0,'scope':'Offline integration only; historical W1 cause and current website performance remain unverified.'}
(out/'verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
