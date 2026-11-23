from pathlib import Path
import json,re,subprocess
out=Path(__file__).resolve().parent;git=lambda *a:subprocess.check_output(['git','--no-optional-locks',*a],text=True).strip();head=git('rev-parse','HEAD');source=git('rev-parse','HEAD:src');assert not git('status','--porcelain')
gates=json.loads((out/'gates/manifest.json').read_text());visual=json.loads((out/'final/visual-driver.json').read_text());assert len(gates)==5 and len(visual)==3
assert all(r['sha']==head and r['exitCode']==0 and r['cleanBefore'] and r['cleanAfter'] and not r['envLoaded'] for r in gates+visual)
assert gates[2]['testSummaries']==[{'tests':1881,'pass':1881,'fail':0}]
assert gates[3]['testSummaries']==[{'tests':n,'pass':n,'fail':0} for n in [5,554,559,159]],gates[3]['testSummaries']
formal=json.loads((out/'final/formal/manifest.json').read_text());assert len(formal)==16 and all(r['sha']==head and r['status']=='PASS' and all(r['checks'].values()) for r in formal)
for suite,n in [('style1',6),('states',139)]:
 text=(out/f'final/{suite}-driver.log').read_text();assert re.findall(r'ℹ tests (\d+).*?ℹ pass (\d+).*?ℹ fail (\d+)',text,re.S)==[(str(n),str(n),'0')],suite
 assert 'ℹ cancelled 0' in text
manual=json.loads((out/'history/manual-user-routes.json').read_text());assert manual['head']==head and manual['sourceTree']==source and manual['sameSource'] and len(manual['runs'])==2 and all(not r.get('error') and not r['pageErrors'] for r in manual['runs'])
paths=json.loads((out/'history/reported-front-end-paths.json').read_text());assert paths['head']==head and len(paths['receipts'])==8 and all(r.get('completed') and not r['errors'] for r in paths['receipts'])
graph=json.loads((out/'browser-dependencies.json').read_text());assert graph['sha']==head and graph['browserStrict'] and len(graph['graph'])==18 and graph['cycleCount']==0 and all(len(c)==1 for c in graph['stronglyConnectedComponents'])
assets=json.loads((out/'build-assets.json').read_text());assert assets['sha']==head and len(assets['assets'])==19 and all(a['matches'] for a in assets['assets'])
assert json.loads((out/'html-build-comparison.json').read_text())['matches']
independent=json.loads((out/'observations/assertion-results.json').read_text());assert independent['sha']==head and independent['status']=='PASS'
subprocess.run(['python3',str(out/'verify-visual-inventory.py')],check=True)
subprocess.run(['python3',str(out/'verify-protection.py')],check=True)
(out/'final-verification.json').write_text(json.dumps({'sha':head,'sourceTree':source,'fiveGates':True,'formal':16,'style1':6,'states':139,'historicalRoutes':10,'independent':'PASS','graph':'strict / DAG','assets':19,'htmlMatches':True,'protection':'PASS'},indent=2)+'\n')
print('Round24 frozen acceptance verified')
