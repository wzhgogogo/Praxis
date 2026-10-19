"""Frozen checkpoint A outer: same probe entry/inputs/metrics, corrected evidence-based preflight."""
from pathlib import Path
from datetime import datetime, timezone
import json, hashlib, subprocess, os, sys, gzip

def preflight_only(a):
    return a.get('status') == 'ENV_FAILURE' and a.get('formalProbeStarted') is False and a.get('models') == 0

def can_resume(ledger, index, origin):
    prior = [a for a in ledger['attempts'] if a['index'] == index]
    stop = ledger.get('stop') or {}
    return (stop.get('code') == 'ENV_PREFLIGHT_RETRYABLE' and stop.get('index') == index
            and index not in ledger['completed'] and len(prior) == 1 and preflight_only(prior[0])
            and origin + ledger['preflightFailures'] <= 2)

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

def recoverable_network_stop(ledger, index, record, origin):
    prior = [a for a in ledger['attempts'] if a['index'] == index]
    stop = ledger.get('stop') or {}
    return (stop.get('code') == 'PREFLIGHT_EVIDENCE_GAP' and stop.get('index') == index
            and index not in ledger['completed'] and len(prior) == 1 and preflight_only(prior[0])
            and origin + ledger['preflightFailures'] + 1 <= 2 and network_preflight_evidence(record) is not None)

config = Path(__file__).resolve().parent
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
now = lambda: datetime.now(timezone.utc).isoformat()
freeze = json.loads((config / 'freeze.json').read_text())
for name, value in freeze['files'].items():
    assert sha(Path(name)) == value, name
plan = json.loads((config / 'plan.json').read_text())
assert plan['status'] == 'FROZEN_CHECKPOINT_A_DISCOVERY_ONLY'
assert subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip() == plan['productionHead']
assert subprocess.check_output(['git', 'status', '--porcelain']).decode().strip() == ''
assert set(sys.argv[2:]).issubset({'--resume-preflight-only', '--recover-network-preflight'})
index = int(sys.argv[1]); assert 0 <= index < len(plan['planned'])
origin = plan['budgetOrigin']
root = Path('.eval-artifacts/p2-1-discovery-20261016')
batch = root / 'checkpoint-a-dom-20261019'; batch.mkdir(exist_ok=True)
ledger_path = batch / 'ledger.json'
ledger = json.loads(ledger_path.read_text()) if ledger_path.exists() else {
    'models': 0, 'google': 0, 'preflightGoogle': 0, 'preflightFailures': 0,
    'completed': [], 'attempts': [], 'stop': None, 'formalLiveRuns': 0}
resume = '--resume-preflight-only' in sys.argv[2:]
if '--recover-network-preflight' in sys.argv[2:]:
    assert resume
    prior = [a for a in ledger['attempts'] if a['index'] == index]
    records = [(p, json.loads(p.read_text())) for p in Path(prior[0]['directory']).glob('*.result.json')]
    matches = [(p, r) for p, r in records if network_preflight_evidence(r)]
    assert len(matches) == 1
    proof_path, proof = matches[0]
    assert recoverable_network_stop(ledger, index, proof, origin['preflightFailures'])
    before = {'code': ledger['stop'], 'originalLedgerSha256': sha(ledger_path),
              'rawResult': str(proof_path), 'rawResultSha256': sha(proof_path),
              'classification': network_preflight_evidence(proof), 'at': now()}
    ledger.setdefault('reclassifications', []).append(before)
    ledger['preflightFailures'] += 1
    ledger['stop'] = {'code': 'ENV_PREFLIGHT_RETRYABLE', 'index': index,
                      'totalPreflightFailures': origin['preflightFailures'] + ledger['preflightFailures']}
if ledger['stop']:
    if not resume or not can_resume(ledger, index, origin['preflightFailures']):
        raise SystemExit('BATCH_STOPPED: ' + str(ledger['stop']))
    ledger.setdefault('stopHistory', []).append({'stop': ledger['stop'], 'resolution': 'APPROVED_PREFLIGHT_ONLY_RETRY', 'at': now()})
    ledger['stop'] = None
prior = [a for a in ledger['attempts'] if a['index'] == index]
assert index not in ledger['completed']
assert not prior or (resume and len(prior) == 1 and preflight_only(prior[0]))
assert origin['preflightFailures'] + ledger['preflightFailures'] <= 2
assert ledger['models'] + 15 <= 150 and origin['models'] + ledger['models'] + 15 <= 450
assert origin['formalProbes'] + len(ledger['completed']) < 42
p = plan['planned'][index]
directory = Path(p['output'])
if prior: directory = directory.with_name(directory.name + '-preflight-2')
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
    total = origin['preflightFailures'] + ledger['preflightFailures']
    ledger['stop'] = {'code': ('PREFLIGHT_EVIDENCE_GAP' if not a['countsTowardStop'] else 'PREFLIGHT_FAILURE_LIMIT' if total > 2 or prior else 'ENV_PREFLIGHT_RETRYABLE'),
                      'index': index, 'totalPreflightFailures': total, 'sourceIds': f['sourceIds']}
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
