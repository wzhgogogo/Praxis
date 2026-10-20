"""Frozen checkpoint B outer: same probe entry/inputs/metrics, corrected evidence-based preflight."""
from pathlib import Path
from datetime import datetime, timezone
import json, hashlib, subprocess, os, sys, gzip, time

def preflight_only(a):
    return a.get('status') == 'ENV_FAILURE' and a.get('formalProbeStarted') is False and a.get('models') == 0

def can_resume(ledger, index, now_epoch):
    prior = [a for a in ledger['attempts'] if a['index'] == index and not a.get('approvedSetupRestoration')]
    stop = ledger.get('stop') or {}
    return (stop.get('code') == 'ENV_PREFLIGHT_RETRYABLE' and stop.get('index') == index
            and index not in ledger['completed'] and len(prior) == 1 and preflight_only(prior[0])
            and ledger['preflightFailures'] <= 2
            and now_epoch >= stop.get('retryNotBeforeEpoch', 0)
            and now_epoch <= stop.get('recoveryDeadlineEpoch', float('inf')))

def countable_preflight(record):
    failed = [a for a in record.get('attempts', []) if a.get('outcome') == 'FAILED']
    return bool(failed) and all(a.get('reason') in {'NO_RESPONSE', 'EMPTY_RESULT'}
        and (a.get('responseStatus') is not None or a.get('detail') == 'TIMEOUT')
        and a.get('countsTowardStop') is True for a in failed)


def network_preflight_evidence(record):
    if not (record.get('mode') == 'LIVE_NETWORK_PREFLIGHT' and record.get('stage') == 'NETWORK_READINESS'
            and record.get('generationModelCalls') == 0 and record.get('restaurantDiscoveryRequests') == 0
            and record.get('status') == 'FAILED'):
        return None
    failed = [a for a in record.get('attempts', []) if a.get('outcome') == 'FAILED']
    if len(failed) != 1:
        return None
    a = failed[0]
    if not (a.get('target') == 'TABLECHECK' and a.get('status') == 503 and a.get('tls') == 'ESTABLISHED'
            and a.get('request', {}).get('method') == 'GET'
            and a.get('request', {}).get('url') == 'https://www.tablecheck.com/en/'):
        return None
    return {'reason': 'NO_RESPONSE', 'responseStatus': 503, 'sourceId': 'tablecheck',
            'outcome': 'FAILED', 'countsTowardStop': True, 'phase': 'NETWORK_READINESS'}

def can_resume_user(ledger, index, network_record):
    prior = [a for a in ledger['attempts'] if a['index'] == index and not a.get('approvedSetupRestoration')]
    return (index == 0 and ledger.get('stop', {}).get('code') == 'PREFLIGHT_FAILURE_LIMIT'
        and ledger.get('userResume',{}).get('priorPreflightAttempts') == 3 and len(ledger.get('userResumeHistory',[])) == 1 and not ledger['completed'] and len(prior) == 4
        and all(preflight_only(a) for a in prior)
        and ledger['models'] == ledger['google'] == ledger['preflightGoogle'] == 0
        and ledger['preflightFailures'] == 4
        and network_record.get('mode') == 'LIVE_NETWORK_PREFLIGHT'
        and network_record.get('stage') == 'NETWORK_READINESS' and network_record.get('status') == 'SUCCEEDED'
        and network_record.get('generationModelCalls') == network_record.get('restaurantDiscoveryRequests') == 0)

config = Path(__file__).resolve().parent
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
now = lambda: datetime.now(timezone.utc).isoformat()
freeze = json.loads((config / 'freeze.json').read_text())
for name, value in freeze['files'].items():
    assert sha(Path(name)) == value, name
plan = json.loads((config / 'plan.json').read_text())
assert plan['status'] == 'FROZEN_CORRECTED_CHECKPOINT_B_DISCOVERY_ONLY'
assert subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip() == plan['productionHead']
assert subprocess.check_output(['git', 'status', '--porcelain']).decode().strip() == ''
assert set(sys.argv[2:]).issubset({'--resume-preflight-only','--resume-setup-only','--resume-after-user'})
index = int(sys.argv[1]); assert 0 <= index < len(plan['planned'])
origin = plan['budgetOrigin']
root = Path('.eval-artifacts/p2-1-discovery-20261016')
batch = root / 'checkpoint-b-corrected-20261019'; batch.mkdir(exist_ok=True)
ledger_path = batch / 'ledger.json'
ledger = json.loads(ledger_path.read_text()) if ledger_path.exists() else {
    'models': 0, 'google': 0, 'preflightGoogle': 0, 'preflightFailures': 0,
    'completed': [], 'attempts': [], 'stop': None, 'formalLiveRuns': 0}
resume = '--resume-preflight-only' in sys.argv[2:]
resume_setup = '--resume-setup-only' in sys.argv[2:]
if resume_setup:
    proof = json.loads((config / 'recovery/setup-proof.json').read_text())
    assert not resume and ledger['stop'] == {'code':'PROBE_NOT_COMPLETED','index':0}
    assert index == proof['index'] == 0 and proof['productionHead'] == plan['productionHead']
    assert not ledger['completed'] and len(ledger['attempts']) == 1
    failed = ledger['attempts'][0]
    assert failed['directory'] == proof['directory'] and failed['status'] == 'NO_PROBE_SUMMARY'
    assert failed.get('models') == 0 and failed.get('formalProbeStarted') is False
    assert ledger['models'] == ledger['google'] == ledger['preflightGoogle'] == 0
    assert sha(Path(proof['outerLog'])) == proof['outerLogSha256'] and not Path(failed['directory']).exists()
    assert sha(Path(proof['requiredFile'])) == proof['requiredFileSha256']
    ledger.setdefault('stopHistory', []).append({'stop':ledger['stop'],'resolution':'USER_APPROVED_SETUP_RESTORATION','proofSha256':sha(config/'recovery/setup-proof.json'),'at':now()})
    failed['approvedSetupRestoration'] = True
    ledger['stop'] = None
resume_user = '--resume-after-user' in sys.argv[2:]
if resume_user:
    approval = json.loads((config/'approval.json').read_text())
    assert not resume and not resume_setup
    assert sha(ledger_path) == approval['ledgerBeforeSha256']
    assert sha(Path(approval['networkRecheckResult'])) == approval['networkRecheckSha256']
    assert approval['productionHead'] == plan['productionHead']
    assert can_resume_user(ledger,index,json.loads(Path(approval['networkRecheckResult']).read_text()))
    ledger.setdefault('stopHistory',[]).append({'stop':ledger['stop'],'resolution':'USER_REQUESTED_CONTINUATION_AFTER_SUCCESSFUL_NETWORK_RECHECK','approvalSha256':sha(config/'approval.json'),'at':now()})
    ledger.setdefault('userResumeHistory',[]).append(ledger['userResume'])
    ledger['userResume']={'index':index,'priorPreflightAttempts':4,'approvalSha256':sha(config/'approval.json'),'at':now()}
    ledger['stop']=None
if ledger['stop']:
    if ledger['stop'].get('code') == 'ENV_PREFLIGHT_RETRYABLE' and time.time() > ledger['stop'].get('recoveryDeadlineEpoch', float('inf')):
        ledger['stop'] = {**ledger['stop'], 'code': 'TABLECHECK_503_RECOVERY_WINDOW_EXPIRED'}
        ledger_path.write_text(json.dumps(ledger, indent=2) + '\n')
    if not resume or not can_resume(ledger, index, time.time()):
        raise SystemExit('BATCH_STOPPED: ' + str(ledger['stop']))
    ledger.setdefault('stopHistory', []).append({'stop': ledger['stop'], 'resolution': 'APPROVED_PREFLIGHT_ONLY_RETRY', 'at': now()})
    ledger['stop'] = None
prior = [a for a in ledger['attempts'] if a['index'] == index and not a.get('approvedSetupRestoration')]
if resume_user: prior = prior[ledger['userResume']['priorPreflightAttempts']:]
assert index not in ledger['completed']
assert not prior or (resume and len(prior) == 1 and preflight_only(prior[0]))
assert ledger['preflightFailures'] <= 4
assert ledger['models'] + 15 <= 150 and origin['models'] + ledger['models'] + 15 <= 450
assert origin['formalProbes'] + len(ledger['completed']) < 55
p = plan['planned'][index]
directory = Path(p['output'])
if resume_user: directory = directory.with_name(directory.name + '-user-retry-5')
elif resume_setup: directory = directory.with_name(directory.name + '-setup-2')
elif prior: directory = directory.with_name(directory.name + '-preflight-2')
assert not directory.exists()
directory.parent.mkdir(parents=True, exist_ok=True)
a = {'index': index, 'caseId': p['caseId'], 'repeat': p['repeat'], 'head': plan['productionHead'],
     'startedAt': now(), 'directory': str(directory), 'status': 'STARTING'}
ledger['attempts'].append(a)
ledger_path.write_text(json.dumps(ledger, indent=2) + '\n')
args = ['node', '--env-file-if-exists=' + str(Path(os.environ['PRAXIS_EVAL_ENV_FILE']).resolve()),
        '--import', 'tsx', 'src/eval/restaurant/agent-loop/runners/run-discovery-probe.ts',
        '--input', p['input'], '--input-sha256', p['inputSha256'], '--witnesses', plan['witnesses'],
        '--output', str(directory), '--reviewed-reads', plan['reviewedReads'], '--no-proxy', '--execute']
env = os.environ.copy()
env.update({key: '1' for key in ['PRAXIS_ALLOW_LIVE_RESTAURANT_READ', 'PRAXIS_ALLOW_BROWSER_RUN', 'PRAXIS_ALLOW_LIVE_MODEL_EVAL']})
env['PRAXIS_BROWSER_ENGINE'] = 'LOCAL_CHROMIUM'
with (directory.parent / (directory.name + '.outer.log')).open('x') as log:
    try:
        a['exit'] = subprocess.run(args, env=env, stdout=log, stderr=subprocess.STDOUT, timeout=240).returncode
    except subprocess.TimeoutExpired:
        a['exit'] = None
        ledger['stop'] = {'code': 'PROBE_PROCESS_TIMEOUT', 'index': index}
preflight = directory / 'source-data-preflight.json'
a['preflightGoogle'] = json.loads(preflight.read_text()).get('googleRequests', 0) if preflight.exists() else 0
ledger['preflightGoogle'] += a['preflightGoogle']
summary = directory / 'probe-summary.json'
if summary.exists():
    s = json.loads(summary.read_text()); models = s['resources']['modelCalls']
    assert 0 <= models <= 15
    assert s['decisionCapture']['callsStarted'] == s['decisionCapture']['rowsWritten'] == models
    ledger['models'] += models; ledger['google'] += s['resources']['google']['total']
    ledger['completed'].append(index)
    a.update({'status': 'PROBE_RECORDED', 'summary': str(summary), 'summarySha256': sha(summary),
              'models': models, 'formalProbeStarted': True, 'google': s['resources']['google']['total'],
              'witnessInListingBySource': s['witnessInListingBySource'],
              'witnessInFirstBatch': s['witnessInFirstBatch'], 'inRadiusParsed': s['inRadiusParsed']})
    if s['stop']: ledger['stop'] = s['stop']
elif (directory / 'preflight-failure.json').exists():
    f = json.loads((directory / 'preflight-failure.json').read_text())
    assert f['classification'] == 'ENV_FAILURE' and f['modelCalls'] == 0 and f['formalProbeStarted'] is False
    a.update({'status': 'ENV_FAILURE', 'models': 0, 'formalProbeStarted': False, 'sourceIds': f['sourceIds']})
    evidence = json.loads(preflight.read_text()) if preflight.exists() else {}
    a['preflightEvidence'] = evidence.get('attempts', [])
    a['countsTowardStop'] = countable_preflight(evidence)
    if not a['countsTowardStop']:
        records = [(p, json.loads(p.read_text())) for p in directory.glob('*.result.json')]
        matches = [(p, r) for p, r in records if network_preflight_evidence(r)]
        if len(matches) == 1:
            proof_path, proof = matches[0]
            a['preflightEvidence'] = [network_preflight_evidence(proof)]
            a['networkPreflightResult'] = str(proof_path)
            a['networkPreflightResultSha256'] = sha(proof_path)
            a['countsTowardStop'] = True
    ledger['preflightFailures'] += int(a['countsTowardStop'])
    total = ledger['preflightFailures']
    is_tablecheck_503 = any(e.get('responseStatus') == 503 and e.get('sourceId', '').lower() == 'tablecheck' for e in a['preflightEvidence'])
    code = ('PREFLIGHT_EVIDENCE_GAP' if not a['countsTowardStop'] else 'PREFLIGHT_FAILURE_LIMIT' if total > 2 else 'TABLECHECK_503_PERSISTED_AFTER_RETRY' if prior and is_tablecheck_503 else 'PREFLIGHT_RETRY_EXHAUSTED' if prior else 'ENV_PREFLIGHT_RETRYABLE')
    ledger['stop'] = {'code': code, 'index': index, 'checkpointPreflightFailures': total, 'sourceIds': f['sourceIds']}
    if code == 'ENV_PREFLIGHT_RETRYABLE' and is_tablecheck_503:
        end = time.time()
        ledger['stop'].update({'retryNotBeforeEpoch': end + 600, 'recoveryDeadlineEpoch': end + 1800,
                              'rule': 'One retry after at least ten minutes; no recovery attempt beyond thirty minutes. Stop if the retry remains 503.'})

else:
    decisions = directory / 'probe.decisions.jsonl'
    if decisions.exists():
        a['decisionRowsObserved'] = len(decisions.read_text().splitlines())
        a['modelsUpperBoundCharged'] = 15; ledger['models'] += 15
    else: a['models'] = 0
    a['formalProbeStarted'] = decisions.exists()
    a['status'] = 'NO_PROBE_SUMMARY'
    ledger['stop'] = ledger['stop'] or {'code': 'PROBE_NOT_COMPLETED', 'index': index}
a['finishedAt'] = now()
ledger['compressedBytesEstimate'] = sum(len(gzip.compress(path.read_bytes())) for path in root.rglob('*') if path.is_file())
if ledger['compressedBytesEstimate'] > 60000000:
    ledger['stop'] = {'code': 'ARTIFACT_SIZE_CAP', 'bytes': ledger['compressedBytesEstimate']}
ledger_path.write_text(json.dumps(ledger, indent=2) + '\n')
print(json.dumps({'attempt': a, 'models': ledger['models'], 'completed': len(ledger['completed']), 'stop': ledger['stop']}, ensure_ascii=False, indent=2))
