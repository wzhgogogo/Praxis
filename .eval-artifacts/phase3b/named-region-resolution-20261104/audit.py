"""Independent literal artifact audit. Does not import the product resolver or G6 evaluator."""
import datetime,hashlib,json,pathlib,re,subprocess
ROOT=pathlib.Path.cwd();P=ROOT/'.eval-artifacts/phase3b/named-region-resolution-20261104'
def read(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def original(git,path):return subprocess.check_output(['git','show',git+':'+path])
checks=[]
def check(label,value):
    assert value,label
    checks.append(label)
freeze=read(P/'freeze.json')
check('Every frozen source/input byte unchanged',all(sha((ROOT/r['path']).read_bytes())==r['sha256'] for r in freeze['files']))
for manifest in ['inputs.json','initial-provenance.json','breadcrumb-provenance.json']:
    for row in read(P/manifest):
        expected=original(row['git'],row['path'])
        check(manifest+': '+row['savedAs'],sha(expected)==row['sha256'] and expected==(ROOT/row['savedAs']).read_bytes())
for row in read(P/'google-provenance.json'):
    raw=original(row['git'],row['path']);har=json.loads(raw)
    entries=[e for e in har['log']['entries'] if 'places.googleapis.com' in e['request']['url']]
    check('Google exact HAR projection '+row['run'],sha(raw)==row['sha256'] and entries==read(ROOT/row['projection']))
for row in read(P/'a-g6-originals.json')['files']+read(P/'a-g6-data.json'):
    raw=original(row['sourceGit'],row['path'])
    check('A original unchanged '+row['path'],sha(raw)==row['sha256'] and raw==(ROOT/row['path']).read_bytes())
probe=read(P/'D8-resolution-probe.original.json');fixture=read(ROOT/'src/domains/restaurant/fixtures/d8-resolution-20261104.json')
state=read(P/'raw/D8-latest/execution.result.json')['execution']['finalSnapshot']['domainState']
check('D8 fixture exact original authority fields',fixture=={k:state[k] for k in ['intentDraft','candidates','readEvidence']})
check('Original probe is the reviewed sole-match HIGH-prefix refusal',probe['exactBoundNameCount']==1 and probe['allPrefixHaveHighNativeIdentity']==False and probe['firstCandidateResolved']==False)
component=(P/'target.log').read_text()
actual=[json.loads(x) for x in re.findall(r'D8_RESOLUTION_RESULT (\{.*\})',component)]
expected={'D8_ORIGINAL':True,'UNKNOWN_GOOGLE_EQUAL':False,'UNKNOWN_JAPANESE_EQUAL':False,'FOREIGN_PLACE_NAME':True,'UNKNOWN_AFTER_PREFIX_EQUAL':False,'TWO_BOUND_EQUAL':False,'NO_HIGH_EXACT':False}
check('All seven D8 literal independent expectations',len(actual)==7 and {r['mode']:r['resolved'] for r in actual}==expected)
check('Component effective red catches original D8 refusal',re.search(r'fail 2\b',(P/'red-d8-complete.log').read_text()) is not None)
red=(P/'red-composition.log').read_text();check('Composition red is business phase assertion not setup',"'NEEDS_INPUT'" in red and "'PRESENT_RESULTS'" in red and 'AssertionError' in red)
check('Actual composition green retained',re.search(r'pass 1\b',(P/'green-composition.log').read_text()) is not None)
a=read(P/'analysis.json')['rows'];regions=lambda row:[(r['label'],r['href']) for r in row['firstDecision']['regions']]
check('Four initial complete region lists are identical',all(regions(r)==regions(a[0]) for r in a))
check('No observed Akabane region in initial or correction lists',all(not re.search('akabane|赤羽',json.dumps(r['firstDecision']['regions']+r['correction']['entrances'],ensure_ascii=False),re.I) for r in a))
check('All first choices are observed wrong Itabashi parent',all(r['firstDecision']['sequence']==4 and r['firstDecision']['chosen']['href']=='https://tabelog.com/en/tokyo/A1322/' for r in a))
check('Google counts are raw25/25/25/0', [r['google']['rawPlaceCount'] for r in a]==[25,25,25,0])
check('Google query bodies unchanged',[r['google']['firstRequestSha256'] for r in a].count(a[0]['google']['firstRequestSha256'])==4)
check('Full initial model context266/266/267/267', [r['firstDecision']['targetsCount'] for r in a]==[266,266,267,267])
# Structural safety audit: all product paths except the one approved name predicate are main-exact.
paths=subprocess.check_output(['git','diff','--name-only','be84674e','--','src/core','src/domains','src/infrastructure','src/integrations','src/application','src/server','src/harness'],text=True).splitlines()
allowed={'src/domains/restaurant/named-outlet-resolution.ts','src/domains/restaurant/named-outlet-resolution.test.ts','src/domains/restaurant/fixtures/d8-resolution-20261104.json','src/domains/restaurant/fixtures/d8-resolution-20261104.provenance.json','src/application/fixtures/booking-terms-composition.ts','src/application/restaurant-named-unknown-peer.test.ts'}
check('Only approved resolver product code changed; native/Google/Guard/versions untouched',set(paths)<=allowed)
ledger=read(ROOT/'.eval-artifacts/phase3b/budget.json');ids={r['id']:r for r in ledger['entries']}
for git in ['be84674e','92bc1032']:
    old=json.loads(original(git,'.eval-artifacts/phase3b/budget.json'))
    check('Ledger all original rows retained '+git,all(ids.get(r['id'])==r for r in old['entries']))
counts={k:sum(r.get(k,r.get('publicGET',0) if k=='evaluationPublicGET' else 0) for r in ledger['entries']) for k in ledger['cumulative']}
check('Ledger cumulative equals immutable row union',counts==ledger['cumulative'])
check('This slice has no real calls',all(ids['phase3b-C-named-region-resolution-20261104'][k]==0 for k in ['fullLive','realModelCalls','evaluationPublicGET','googleRequests','restaurantWebsiteRequests']))
gates=read(P/'gates.json');check('Seven required clean gates succeeded',len(gates)==7 and all(r['returnCode']==0 and r['beforeStatus']==r['afterStatus']=='' for r in gates))
def totals(name):return [int(n) for n in re.findall(r'^ℹ tests (\d+)$',(P/(name+'.log')).read_text(),re.M)]
check('Default1425 unchanged all passing',totals('default')==[1425])
chrome=(P/'chromium.log').read_text();check('Full Chromium189 plus original G6 corpus66 pass', re.search(r'^ℹ tests 189$',chrome,re.M) is not None and re.search(r'^ℹ pass 189$',chrome,re.M) is not None and re.search(r'^ℹ tests 66$',chrome,re.M) is not None and re.search(r'^ℹ pass 66$',chrome,re.M) is not None)
check('Strict G2 five tests pass',totals('strict-g2')==[5] and 'ℹ fail 0' in (P/'strict-g2.log').read_text())
result={'status':'PASS','timeCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),'checks':checks,'note':'Independent literal artifact audit, not product self-scoring; original exposed history preserved. No new Live result or region-route success claimed.','externalCalls':0}
(P/'audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':result['status'],'checks':len(checks),'calls':0}))
