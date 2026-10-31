"""Post-stop file/Git audit only; no HTTP, browser, model, or execution replay."""
import datetime as dt
import hashlib
import json
import pathlib
import re
import subprocess
from urllib.parse import urlsplit, parse_qs

R = pathlib.Path('.eval-artifacts/phase3b/g4-japanese-directed-20261031')
def load(p):
    return json.loads(pathlib.Path(p).read_text())
def sha(b):
    return hashlib.sha256(b).hexdigest()
def git(*args):
    return subprocess.check_output(['git', *args])
def date(s):
    return dt.datetime.fromisoformat(s)
def stamp():
    return dt.datetime.now(dt.timezone(dt.timedelta(hours=1))).isoformat()

inputs, state, freeze = load(R/'inputs.json'), load(R/'state.json'), load(R/'freeze.json')
base = inputs['productionCommit']
assert state['status'] == 'STOPPED'
assert state['stop'] == 'ORCHESTRATION_RUNNER_CONFIGURATION_INVALID'
frozen = []
for f in freeze['files']:
    assert not any(p.startswith('.env') for p in pathlib.Path(f['path']).parts)
    assert sha(pathlib.Path(f['path']).read_bytes()) == f['sha256'], f['path']
    frozen.append(f['path'])
source_changes = git('diff', '--name-only', base, '--', 'src', 'scripts', 'web-skills', 'package.json', 'package-lock.json', 'tsconfig.json').decode().splitlines()
assert source_changes == []
old_files = git('ls-tree', '-r', '--name-only', base, '--', '.eval-artifacts/phase3b/g4-japanese-wiring').decode().splitlines()
for p in old_files:
    assert pathlib.Path(p).read_bytes() == git('show', base+':'+p), p

before = json.loads(git('show', base+':.eval-artifacts/phase3b/budget.json'))
ledger = load('.eval-artifacts/phase3b/budget.json')
by_id = {e['id']: e for e in ledger['entries']}
assert len(by_id) == len(ledger['entries'])
for entry in before['entries']:
    assert entry == by_id[entry['id']], entry['id']
new = [e for e in ledger['entries'] if e['id'] not in {x['id'] for x in before['entries']}]
assert len(new) == 4 and all(e['batch'] == inputs['batchId'] for e in new)
computed = {}
for key in ledger['cumulative']:
    computed[key] = sum(e.get(key, e.get('publicGET', 0) if key == 'evaluationPublicGET' else 0) for e in ledger['entries'])
assert computed == ledger['cumulative'], (computed, ledger['cumulative'])
assert computed['evaluationPublicGET'] == 247
assert computed['googleRequests'] == 12
assert computed['realModelCalls'] == 171
assert sum(e['batchWebsiteGET'] for e in new) == 2
assert sum(e['googleRequests'] for e in new) == 1

requests, previous = [], None
assert len(state['results']) == 4
assert len(list((R/'requests').glob('*.started.json'))) == 4
assert len(list((R/'requests').glob('*.result.json'))) == 4
assert not (R/'execution').exists()
for row in state['results']:
    prefix = R/'requests'/row['id']
    started, result, headers = [load(str(prefix)+'.'+suffix+'.json') for suffix in ['started','result','headers']]
    assert row == result
    assert row['status'] == 200 and row['bodyComplete'] is True
    assert row['networkFailure'] is None and row['failure'] is None
    assert row['method'] == 'GET' and row['redirect'] == 'manual'
    assert row['cookie'] is False and row['retries'] == 0 and row['timeoutMs'] == 20000
    body = pathlib.Path(row['bodyPath']).read_bytes()
    assert len(body) == row['bytesReceived'] and sha(body) == row['sha256']
    frozen_commit = started['frozenCommit']
    manifest_path = started['manifestPath']
    manifest_bytes = pathlib.Path(manifest_path).read_bytes()
    assert sha(manifest_bytes) == started['manifestSha256']
    assert git('show', frozen_commit+':'+manifest_path) == manifest_bytes
    assert subprocess.run(['git','merge-base','--is-ancestor',frozen_commit,'HEAD']).returncode == 0
    manifest = json.loads(manifest_bytes)
    planned = next(x for x in manifest['requests'] if x['id'] == row['id'])
    assert planned['url'] == row['url'] == by_id[row['ledgerId']]['url']
    for f in manifest.get('basis', []):
        assert sha(pathlib.Path(f['path']).read_bytes()) == f['sha256']
        assert git('show', frozen_commit+':'+f['path']) == pathlib.Path(f['path']).read_bytes()
    start = date(row['startedAtCET'])
    assert date(by_id[row['ledgerId']]['recordedAtCET']) <= date(started['atCET']) <= start
    assert date(row['headersAtCET']) <= date(row['bodyCompletedAtCET']) <= date(row['finishedAtCET'])
    assert headers['headersAtCET'] == row['headersAtCET']
    assert date(git('show','-s','--format=%cI', frozen_commit).decode().strip()) < start
    gap = round((start - previous).total_seconds(), 3) if previous else None
    assert gap is None or gap >= 30
    previous = date(row['finishedAtCET'])
    u = urlsplit(row['url'])
    assert u.scheme == 'https' and not u.username and not u.password and not u.fragment
    if row['kind'] == 'GOOGLE':
        assert row['url'] == inputs['googleRequest']['url']
        assert planned['fieldMask'] == 'id,displayName'
    elif row['kind'] == 'ROBOTS':
        assert row['url'] == 'https://tabelog.com/robots.txt'
    else:
        assert u.netloc == 'tabelog.com'
        assert (u.path == '/en/tokyo/rstLst/' and list(parse_qs(u.query)) == ['sw']) or (re.fullmatch(r'/en/[^/]+/A\d+/A\d+/\d+/',u.path) and not u.query)
    requests.append({**row, 'manifestCommit': frozen_commit, 'chargedBeforeSend': True, 'previousFinishToStartSeconds': gap})

# Gold is opened only post-stop, after every acquisition and selection was frozen.
oracle_record = load(R/'oracle-freeze.json')
oracle_path = '.eval-artifacts/phase3b/g4-e2e/gold.json'
oracle_bytes = pathlib.Path(oracle_path).read_bytes()
assert sha(oracle_bytes) == next(f['sha256'] for f in oracle_record['files'] if f['path'] == oracle_path)
gold = {r['id']: r['rstId'] for r in json.loads(oracle_bytes)['rows']}
selection = load(R/'beef-selection.json')
assert len(selection['selected']) == len(selection['ordered']) == 1
beef = next(r for r in state['results'] if r['id'] == 'beef-detail-1')
assert selection['selected'][0]['sourceUrl'] == beef['url']
beef_hit = any(x['sourceEntityId'].split('/')[-1] == gold['nr-007'] for x in selection['ordered'])

config = load(inputs['savedInputs'])
cases = []
for subject in inputs['cases']:
    old = load(subject['sourceExecutionPath'])
    records = old['modelRecords']
    captured = json.loads(records[0]['response']['outputText']) if records else None
    fragment = captured.get('fragment') if captured else None
    name_path = R/'requests/google-name.body.json' if subject['id'] == 'nr-007' else pathlib.Path(config['googleJapanese'][subject['id']])
    name = load(name_path)
    assert name['id'] == subject['googlePlaceId']
    assert not fragment or (fragment in subject['subject']['name'] and fragment != subject['subject']['name'])
    acquired = [r for r in state['results'] if r['subjectId'] == subject['id']]
    cases.append({
        'id': subject['id'], 'name': subject['subject']['name'],
        'plannedTerms': [
            {'source':'SAVED_GOOGLE_ORIGINAL_NAME', 'query':subject['subject']['name'], 'executedInThisIdentityPrefix':False},
            {'source':'SAVED_MODEL_FRAGMENT' if fragment else 'UNRECORDED_FRAGMENT_NOT_FABRICATED', 'query':fragment, 'executedInThisIdentityPrefix':False},
            {'source':'SAME_ID_GOOGLE_JA', 'query':name['displayName']['text'], 'languageCode':name['displayName'].get('languageCode'), 'freshGoogleRead':subject['id']=='nr-007', 'executedInThisIdentityPrefix':False}],
        'freshSearchURLs':[r['url'] for r in acquired if r['kind']=='SEARCH'],
        'freshSearchCertifiedHit':beef_hit if subject['id']=='nr-007' else 'NOT_EVALUATED',
        'freshDetailURLs':[r['url'] for r in acquired if r['kind']=='DETAIL'],
        'acquiredDetailCount':sum(r['kind']=='DETAIL' for r in acquired),
        'identityDetailsRead':0, 'productionIdentityResult':'NOT_EVALUATED',
        'reason':'ORCHESTRATION_INTERRUPTED_BEFORE_IDENTITY_PREFIX' if subject['id']=='nr-007' else 'NOT_STARTED_AFTER_BATCH_STOP',
        'thirdTermAcceptanceContribution':'NOT_EVALUATED',
    })

out = {
    'mode':'POST_STOP_FILE_AND_GIT_AUDIT_NO_EXECUTION_REPLAY_NO_REQUESTS', 'status':'PASS', 'recordedAtCET':stamp(),
    'batchStatus':'STOPPED_ORCHESTRATION_INTERRUPTED', 'sourceCommit':base,
    'frozenFilesUnchanged':len(frozen), 'sourceChanges':source_changes, 'priorWiringArtifactsUnchanged':len(old_files),
    'priorLedgerEntriesPreserved':len(before['entries']), 'newLedgerEntries':len(new), 'cumulative':computed,
    'batchCalls':{'websiteGETExcludingRobots':2,'robotsGET':1,'robotsCountedInSharedGET':True,'google':1,'realModels':0,'Live':0},
    'requests':requests,
    'timing':{'requestElapsedSeconds':sum(r['elapsedMs'] for r in requests)/1000,
              'betweenRequestsSeconds':round(sum(r['previousFinishToStartSeconds'] or 0 for r in requests),3),
              'firstStartToLastFinishSeconds':round((date(requests[-1]['finishedAtCET'])-date(requests[0]['startedAtCET'])).total_seconds(),3)},
    'networkFailures':0, 'additionalRequestsAfterError':0,
    'postStopFirstScreenOracle':{'path':oracle_path,'sha256':sha(oracle_bytes),'beefCertifiedFirstScreenHit':beef_hit,'doesNotEstablishIdentityAcceptance':True},
    'cases':cases,
    'identitySummary':{'correct':'NOT_EVALUATED','notAccepted':'NOT_EVALUATED','wrong':'NOT_EVALUATED','environmentFailures':0,'notEvaluated':4},
    'requestBoundary':'FOUR_CAPTURED_REQUESTS_PASS_INDEPENDENT_URL_METHOD_TIMING_AND_FREEZE_AUDIT',
    'claimSafety':'NOT_EVALUATED_NO_PRODUCT_IDENTITY_RESULT',
}
(R/'audit-stop.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:out[k] for k in ['status','batchStatus','frozenFilesUnchanged','priorLedgerEntriesPreserved','newLedgerEntries','cumulative','timing']},ensure_ascii=False))
