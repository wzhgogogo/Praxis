"""Independent integration artifact audit; imports no product resolver/evaluator."""
import datetime,hashlib,json,pathlib,re,subprocess
P=pathlib.Path('.eval-artifacts/phase3b/tabelog-location-suggestions-main-20261104');OLD=pathlib.Path('.eval-artifacts/phase3b/named-region-resolution-20261104')
def load(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def original(git,p):return subprocess.check_output(['git','show',git+':'+p])
checks=[]
def check(label,condition):
 assert condition,label
 checks.append(label)
freeze=load(P/'freeze.json');proof=load(P/'merge-proof.json')
check('900 frozen source and input files unchanged',len(freeze['files'])==900 and all(sha(pathlib.Path(r['path']).read_bytes())==r['sha256'] for r in freeze['files']))
for row in proof['preserved']:
 b=pathlib.Path(row['path']).read_bytes();check('Preserved '+row['side']+': '+row['path'],b==original(row['git'],row['path']) and sha(b)==row['sha256'])
check('Approved location commit is ancestor',subprocess.run(['git','merge-base','--is-ancestor',freeze['reviewed'],'HEAD']).returncode==0)
check('Latest main is ancestor',subprocess.run(['git','merge-base','--is-ancestor',freeze['mainBefore'],'HEAD']).returncode==0)
for manifest in ['a-g6-originals.json','a-g6-data.json']:
 data=load(OLD/manifest);rows=data.get('files',[]) if isinstance(data,dict) else data
 for row in rows:check('A original '+row['path'],sha(pathlib.Path(row['path']).read_bytes())==row['sha256'] and pathlib.Path(row['path']).read_bytes()==original(row['sourceGit'],row['path']))
package=load(pathlib.Path('package.json'));check('Mandatory browser gate runs full G6',package['scripts']['test:browser:fixture'].endswith('&& npm run test:g6:assembly') and package['scripts']['test:g6:assembly']=='node scripts/run-g6-fixtures.mjs')
check('Eight original G6 files present',len(list(pathlib.Path('src/eval/restaurant/agent-loop/g6').glob('*.test.ts')))==8)
check('D8 resolver unchanged from accepted main',pathlib.Path('src/domains/restaurant/named-outlet-resolution.ts').read_bytes()==original(freeze['mainBefore'],'src/domains/restaurant/named-outlet-resolution.ts'))
text=(P/'default.log').read_text();rows=[json.loads(m) for m in re.findall(r'D8_RESOLUTION_RESULT (\{.*\})',text)]
expected={'D8_ORIGINAL':True,'UNKNOWN_GOOGLE_EQUAL':False,'UNKNOWN_JAPANESE_EQUAL':False,'FOREIGN_PLACE_NAME':True,'UNKNOWN_AFTER_PREFIX_EQUAL':False,'TWO_BOUND_EQUAL':False,'NO_HIGH_EXACT':False}
check('Seven literal D8 expectations',len(rows)==7 and {r['mode']:r['resolved'] for r in rows}==expected)
check('Default1439 passes, including ordinary source composition','ℹ tests 1439' in text and 'ℹ pass 1439' in text and '✔ ordinary assembly presents the sole identity-bound exact outlet despite a different-name unknown peer' in text)
locationRows=[json.loads(line.split('LOCATION_SUGGESTION_RESULT ',1)[1]) for line in text.splitlines() if 'LOCATION_SUGGESTION_RESULT ' in line]
expectedLocation={'LINK':5,'OPTION':5,'NONE':0,'AMBIGUOUS':0,'OUTSIDE':0,'MERCHANT_ONLY':0}
check('Six literal location expectations alongside D8',len(locationRows)==6 and {r['mode']:len(r['candidates']) for r in locationRows}==expectedLocation)
summary=[]
for row in locationRows:
 actions=row['actions'];urls=[a['args'][1] for a in actions if a['operation']=='openLink']+[a['args'][0] for a in actions if a['operation']=='navigate'];funnel=row['metadata']['nativeDiscoveryFunnel']
 check('No merchant/foreign navigation '+row['mode'],all(not re.search('1399999[89]|aichi|R88888',url,re.I) for url in urls))
 check('Only literal user place filled '+row['mode'],[a['args'][1] for a in actions if a['operation']=='fill']==['Akabane'])
 check('Same4 region/80 operation caps '+row['mode'],funnel['retrieval']['regionPages']<=4 and max(d['lifecycle']['candidateRuntimeOperations'] for d in row['diagnostics'])<=80)
 check('No source fixture/wire error '+row['mode'],not any(d['event'] in ['OPERATION_FAILED','MODEL_DECISION_FAILED'] for d in row['diagnostics']))
 if row['mode'] in ['LINK','OPTION']:check('No added browser-model decision '+row['mode'],not any(d['event']=='MODEL_DECISION_STARTED' for d in row['diagnostics']))
 else:
  if row['mode']!='OUTSIDE':check('Existing fallback actually executes '+row['mode'],'https://tabelog.com/en/tokyo/A1322/' in urls and row['metadata']['failureCode']=='READ_BUDGET_EXCEEDED')
 summary.append({'mode':row['mode'],'candidates':len(row['candidates']),'sourceElapsedMs':funnel['sourceElapsedMs'],'runtimeOperations':max(d['lifecycle']['candidateRuntimeOperations'] for d in row['diagnostics']),'regionPages':funnel['retrieval']['regionPages'],'failureCode':row['metadata'].get('failureCode')})
chrome=(P/'chromium.log').read_text();check('Chromium189 and full G6 66 pass',all(re.search('^ℹ '+kind+' '+str(n)+'$',chrome,re.M) for kind,n in [('tests',189),('pass',189),('tests',66),('pass',66)]))
strict=(P/'strict-g2.log').read_text();check('StrictG2 five tests and12 valid pages pass','ℹ pass 5' in strict and strict.count('"classification":"PASS"')==12)
gates=load(P/'gates.json');check('All six current gates passed with empty before/after status',len(gates)==6 and all(r['returnCode']==0 and r['beforeStatus']==r['afterStatus']=='' for r in gates))
check('One frozen gate HEAD',len({r['head'] for r in gates})==1)
ledger=load(pathlib.Path('.eval-artifacts/phase3b/budget.json'));ids={r['id']:r for r in ledger['entries']}
for git in [freeze['mainBefore'],freeze['reviewed']]:
 prior=json.loads(original(git,'.eval-artifacts/phase3b/budget.json'));check('Every immutable ledger row retained '+git,all(ids.get(r['id'])==r for r in prior['entries']))
check('No real calls from this merge',all(ids['phase3b-C-location-main-integration-20261104'][k]==0 for k in ['fullLive','realModelCalls','evaluationPublicGET','googleRequests','restaurantWebsiteRequests']))
check('Shared ledger cumulative exact row sum',ledger['cumulative']=={k:sum(r.get(k,r.get('publicGET',0) if k=='evaluationPublicGET' else 0) for r in ledger['entries']) for k in ledger['cumulative']})
for file in ['src/domains/restaurant/contracts.ts','src/infrastructure/browser/browser-action-decision.ts','src/infrastructure/browser/playwright-read-network-guard.ts','src/application/live-read-investigation-budget.ts','src/integrations/tabelog/tabelog-browser-availability.ts','src/integrations/tabelog/tabelog-query-controls.ts','src/integrations/tabelog/tabelog-vacancy-response.ts']:
 check('Main contract untouched '+file,pathlib.Path(file).read_bytes()==original(freeze['mainBefore'],file))
result={'status':'PASS','timeCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),'checks':checks,'locationSummary':summary,'externalCalls':0,'note':'Offline integration of approved location suggestions after D8 and original G6 corpus; historical scores and raw reviewed evidence unchanged.'};(P/'audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':result['status'],'checks':len(checks)}))
