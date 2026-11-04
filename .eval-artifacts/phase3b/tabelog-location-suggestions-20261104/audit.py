"""Independent literal artifact audit, no product parser, matcher or evaluator import."""
import datetime,hashlib,json,math,pathlib,re,subprocess
P=pathlib.Path('.eval-artifacts/phase3b/tabelog-location-suggestions-20261104')
def load(path):return json.loads(path.read_text())
def sha(data):return hashlib.sha256(data).hexdigest()
def original(git,path):return subprocess.check_output(['git','show',git+':'+path])
checks=[]
def check(label,condition):
 assert condition,label
 checks.append(label)
freeze=load(P/'freeze.json');check('All frozen source and input bytes unchanged',all(sha(pathlib.Path(r['path']).read_bytes())==r['sha256'] for r in freeze['files']))
provenance=load(P/'input-provenance.json');raw=original(provenance['git'],provenance['path']);check('Exact saved D4 menu byte provenance',raw==(P/'d4-menu.original.html').read_bytes() and sha(raw)==provenance['sha256'])
menu=load(pathlib.Path(provenance['projectionPath']));check('D4 projection SHA and31 missing-area entries',sha(pathlib.Path(provenance['projectionPath']).read_bytes())==provenance['projectionSha256'] and len(menu['regions'])==31 and not any(re.search('akabane|赤羽',r['label'],re.I) for r in menu['regions']))
check('Actual original HTML has no Akabane and3 equivalent public home links',not re.search('akabane|赤羽',raw.decode(),re.I) and len(re.findall(r'<a\b[^>]*href=["\']https://tabelog.com/en/["\']',raw.decode(),re.I))==3)
for row in load(P/'a-g6-originals.json')['files']+load(P/'a-g6-data.json'):
 data=original(row['sourceGit'],row['path']);check('Original A byte contract: '+row['path'],sha(data)==row['sha256'] and data==pathlib.Path(row['path']).read_bytes())
def results(path):return [json.loads(line.split('LOCATION_SUGGESTION_RESULT ',1)[1]) for line in path.read_text().splitlines() if 'LOCATION_SUGGESTION_RESULT ' in line]
red=results(P/'red-final.log');check('Effective old-source red has all6 actual runs',len(red)==6)
for row in red:
 check('Old missing-home route '+row['mode'],len(row['candidates'])==0 and any(a['operation']=='openLink' and a['args'][1]=='https://tabelog.com/en/tokyo/A1322/' for a in row['actions']) and not any(a['operation']=='fill' for a in row['actions']) and not any(d['event'] in ['OPERATION_FAILED','MODEL_DECISION_FAILED'] for d in row['diagnostics']))
receipts=load(P/'gates.json');check('Six formal gates succeeded cleanly',len(receipts)==6 and all(r['returnCode']==0 and r['beforeStatus']==r['afterStatus']=='' for r in receipts))
check('All formal gates use the same frozen candidate',len({r['head'] for r in receipts})==1)
green=results(P/'default.log');expected={'LINK':5,'OPTION':5,'NONE':0,'AMBIGUOUS':0,'OUTSIDE':0,'MERCHANT_ONLY':0};check('Literal independent6 result counts',len(green)==6 and {r['mode']:len(r['candidates']) for r in green}==expected)
summary=[]
for row in green:
 actions=row['actions'];urls=[a['args'][1] for a in actions if a['operation']=='openLink']+[a['args'][0] for a in actions if a['operation']=='navigate']
 check('No merchant/foreign navigation '+row['mode'],all(not re.search('1399999[89]|aichi|R88888',url,re.I) for url in urls))
 check('Only literal authoritative place filled '+row['mode'],[a['args'][1] for a in actions if a['operation']=='fill']==['Akabane'])
 check('Observed home always reached '+row['mode'],'https://tabelog.com/en/' in urls)
 check('No fixture/runtime/wire failures '+row['mode'],not any(d['event'] in ['OPERATION_FAILED','MODEL_DECISION_FAILED'] for d in row['diagnostics']))
 funnel=row['metadata']['nativeDiscoveryFunnel'];check('No reset region/operation ceilings '+row['mode'],funnel['retrieval']['regionPages']<=4 and max(d['lifecycle']['candidateRuntimeOperations'] for d in row['diagnostics'])<=80)
 if row['mode'] in ['LINK','OPTION']:
  check('No guessed browser-model action '+row['mode'],not any(d['event']=='MODEL_DECISION_STARTED' for d in row['diagnostics']))
  for c in row['candidates']:
   point=c['coordinates'];lat,lon=map(math.radians,[point['lat'],point['lng']]);a,b=map(math.radians,[35.7799638,139.723053]);distance=2*6371000*math.asin(math.sqrt(math.sin((lat-a)/2)**2+math.cos(a)*math.cos(lat)*math.sin((lon-b)/2)**2));check('Independent radius '+row['mode']+' '+c['id'],distance<=1000 and c['id'].startswith('tabelog:en/tokyo/A1323/A132305/'))
 elif row['mode'] in ['NONE','AMBIGUOUS','MERCHANT_ONLY']:
  check('Original fallback path actually executed '+row['mode'],'https://tabelog.com/en/tokyo/A1322/' in urls and funnel['retrieval']['regionPages']==4 and row['metadata']['failureCode']=='READ_BUDGET_EXCEEDED')
 summary.append({'mode':row['mode'],'candidateCount':len(row['candidates']),'sourceElapsedMs':funnel['sourceElapsedMs'],'runtimeOperations':max(d['lifecycle']['candidateRuntimeOperations'] for d in row['diagnostics']),'regionPages':funnel['retrieval']['regionPages'],'failureCode':row['metadata'].get('failureCode'),'browserModelDecisions':sum(d['event']=='MODEL_DECISION_STARTED' for d in row['diagnostics'])})
text=(P/'default.log').read_text();check('Default1431 and3 admission controls pass',re.search(r'^ℹ tests 1431$',text,re.M) is not None and all('✔ location suggestion shortcut preserves existing admission: '+m in text for m in ['NO_GUARD','RESERVE_AFTER_FILL','OPERATION_CAP']))
chrome=(P/'chromium.log').read_text();check('Ordinary Chromium189 plus full originalG6 66 all pass',all(re.search('^ℹ '+kind+' '+str(n)+'$',chrome,re.M) for kind,n in [('tests',189),('pass',189),('tests',66),('pass',66)]))
strict=(P/'strict-g2.log').read_text();check('StrictG2 five tests and12 valid pages pass','ℹ pass 5' in strict and strict.count('"classification":"PASS"')==12)
protected=['src/integrations/tabelog/tabelog-browser-availability.ts','src/integrations/tabelog/tabelog-query-controls.ts','src/integrations/tabelog/tabelog-vacancy-response.ts','src/infrastructure/browser/browser-action-decision.ts','src/infrastructure/browser/playwright-read-network-guard.ts','src/domains/restaurant/contracts.ts','src/domains/restaurant/read-time-reserve.ts','src/application/live-read-investigation-budget.ts','web-skills/tabelog/SKILL.md']
for file in protected:check('Unchanged main contract: '+file,pathlib.Path(file).read_bytes()==original(freeze['mainBase'],file))
ledger=load(pathlib.Path('.eval-artifacts/phase3b/budget.json'));ids={r['id']:r for r in ledger['entries']}
for git in [freeze['mainBase'],'aba06e16']:
 old=json.loads(original(git,'.eval-artifacts/phase3b/budget.json'));check('Immutable shared ledger union '+git,all(ids.get(r['id'])==r for r in old['entries']))
check('Zero new real calls',all(ids['phase3b-C-tabelog-location-suggestions-20261104'][k]==0 for k in ['fullLive','realModelCalls','googleRequests','evaluationPublicGET','restaurantWebsiteRequests']))
check('Counters exactly sum preserved rows',ledger['cumulative']=={k:sum(r.get(k,r.get('publicGET',0) if k=='evaluationPublicGET' else 0) for r in ledger['entries']) for k in ledger['cumulative']})
out={'status':'PASS','timeCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),'checks':checks,'caseSummary':summary,'externalCalls':0,'boundary':'Constructed source-discovery composition with real local Chromium/HAR and production Guard. Not current-site DOM/network compatibility, real model or availability completion.'}
(P/'audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':out['status'],'checks':len(checks),'cases':summary},ensure_ascii=False))
