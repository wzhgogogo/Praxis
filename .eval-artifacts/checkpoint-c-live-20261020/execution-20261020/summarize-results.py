"""Post-batch offline accounting and readable four-layer index; never used by Runner."""
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

BASE = Path('.eval-artifacts/checkpoint-c-live-20261020')
EXEC = BASE / 'execution-20261020'
RESULTS = EXEC / 'results'


def get(path):
    return json.loads(Path(path).read_text())


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def stamp(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00')).timestamp()


def write(name, value):
    with (EXEC / name).open('x') as stream:
        stream.write(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def summarize():
    assert (EXEC / 'supervisor/finish.json').exists(), 'Batch process must finish before final accounting'
    plan = get(BASE / 'plan.json')
    previous = get(BASE / 'phase2-ledger.json')
    records = []
    for folder in sorted(RESULTS.glob('c-*-attempt-*')):
        summary_path = folder / 'run-report.json'
        if not summary_path.exists():
            summary_path = folder / 'pre-post-check.run-report.json'
        if not summary_path.exists():
            raise RuntimeError('Attempt lacks evaluation: ' + str(folder))
        summary = get(summary_path)
        start, finish = get(folder / 'started.json'), get(folder / 'finish.json')
        end = summary['layers']['endToEnd']
        artifact = get(summary['artifact']) if summary.get('artifact') else None
        decisions = [json.loads(line) for path in folder.glob('runner/*.decisions.jsonl') for line in path.read_text().splitlines() if line.strip()]
        actual = end.get('realModelCalls')
        formal = finish['orchestration']['finish']['formalRunStarted']
        if actual is None and not formal and not decisions:
            actual = 0
        model_checks = {'resource': actual, 'decisionRecords': len(decisions), 'maxDecisionSequence': max((d['sequence'] for d in decisions), default=0), 'invocations': len(artifact.get('modelInvocations', [])) if artifact else None}
        post = folder / 'post-run/post-check.json'
        post_rows = get(post)['rows'] if post.exists() else []
        source_preflight = folder / 'source-preflight/source-data-preflight.json'
        source_data = get(source_preflight) if source_preflight.exists() else None
        network_preflight = [get(path) for path in (folder / 'network-preflight').glob('*.result.json')]
        google_total = end.get('totalGoogleRequests')
        if google_total is None and not formal:
            google_total = sum(sum(item.get('target') == 'GOOGLE' for item in pre.get('attempts', [])) for pre in network_preflight) + (source_data or {}).get('googleRequests', 0)
        selected = summary['layers']['stages']['P2_2']['selectedAvailabilityCandidates']
        unique_selected = list(dict.fromkeys(v['candidateId'] for v in selected))
        state = (artifact or {}).get('finalSnapshot', {}).get('domainState', {})
        records.append({'run': summary['run'], 'attempt': start['attempt'], 'directory': str(folder), 'summaryPath': str(summary_path), 'summarySha256': sha(summary_path), 'startedAt': start['at'], 'runnerFinishedAt': finish['at'], 'outerWallMs': round((stamp(finish['at']) - stamp(start['at'])) * 1000), 'formalRunStarted': formal, 'outcome': end['outcome'], 'qualifiedDelivery': end['qualifiedDelivery'], 'deliveredCount': end['deliveredCount'], 'runnerElapsedMs': end['elapsedMs'], 'modelCalls': actual, 'modelChecks': model_checks, 'googleRequestsIncludingBothPreflights': google_total, 'preflight': source_data, 'S0_DECLARATION': summary['layers']['severity']['S0_DECLARATION'], 'S0_BOUNDARY': summary['layers']['severity']['S0_BOUNDARY'], 'conditions': end['conditions'], 'requestCriteria': end['requestCriteria'], 'displayConsistency': end['displayConsistency'], 'P2_1': summary['layers']['stages']['P2_1']['firstCandidateBatchWitnesses'], 'P2_2_selectedDirectPageCount': summary['layers']['stages']['P2_2']['selectedDirectPageCount'], 'P2_2_uniqueSelectedCandidates': unique_selected, 'P2_2_recordedAvailabilityChecks': {key: {'status': value['status'], 'reasonCode': value.get('reasonCode')} for key, value in state.get('availabilityChecks', {}).items()}, 'P2_3': summary['layers']['stages']['P2_3'], 'witnessFunnel': summary['layers']['stages']['witnessFunnel'], 'postResponses': [{'name': row.get('name'), 'provider': row.get('provider', 'TABELOG'), 'status': row.get('status'), 'httpStatus': row.get('raw', {}).get('status')} for row in post_rows], 'evaluationAttribution': summary['layers']['attribution']})
    records.sort(key=lambda r: stamp(r['startedAt']))
    final = {row['run']['runId']: row for row in records}
    planned = [{'run': run, 'status': final[run['runId']]['outcome']['type'] if run['runId'] in final and final[run['runId']]['formalRunStarted'] else 'NOT_REACHED', 'attemptOutcome': final[run['runId']]['outcome']['type'] if run['runId'] in final else None, 'reason': 'PRE_RUN_ENV_FAILURE' if run['runId'] in final and not final[run['runId']]['formalRunStarted'] else 'BATCH_STOPPED_RETRY_EXHAUSTED' if run['runId'] not in final else None} for run in plan['runs']]
    gaps = [{'previous': left['directory'], 'next': right['directory'], 'gapMsFromRunnerFinish': round((stamp(right['startedAt']) - stamp(left['runnerFinishedAt'])) * 1000)} for left, right in zip(records, records[1:])]
    complete_counts = all(row['modelCalls'] is not None for row in records)
    known_calls = sum(row['modelCalls'] or 0 for row in records)
    charged_calls = sum(row['modelCalls'] if row['modelCalls'] is not None else 50 for row in records)
    formal_runs = sum(row['formalRunStarted'] for row in records)
    formal_reruns = sum(row['formalRunStarted'] and row['attempt'] > 1 and any(old['formalRunStarted'] for old in records if old['run']['runId'] == row['run']['runId'] and old['attempt'] < row['attempt']) for row in records)
    ledger = {'status': 'RECONCILED' if complete_counts else 'BOUNDED_INCOMPLETE_MODEL_COUNT', 'baselinePath': str(BASE / 'phase2-ledger.json'), 'baselineSha256': sha(BASE / 'phase2-ledger.json'), 'checkpointC': {'attempts': len(records), 'plannedRunsReached': len(final), 'formalFullLiveRuns': formal_runs, 'formalEnvironmentReruns': formal_reruns, 'attemptRetriesIncludingPreflight': sum(row['attempt'] > 1 for row in records), 'observedModelCalls': known_calls, 'allModelCountsComplete': complete_counts, 'conservativeBudgetCharge': charged_calls, 'newModelReplays': 0}, 'phase2ModelCalls': previous['phase2ModelCalls'] + charged_calls, 'priorPhaseModelCalls': previous['priorPhaseModelCalls'], 'totalModelCalls': previous['totalModelCalls'] + charged_calls, 'totalFullLiveRuns': previous['totalFullLiveRuns'] + formal_runs, 'environmentReruns': previous['environmentReruns'] + formal_reruns, 'limits': previous['limits'], 'remaining': {'modelCalls': 4000 - previous['totalModelCalls'] - charged_calls, 'fullLiveRuns': 100 - previous['totalFullLiveRuns'] - formal_runs, 'environmentReruns': 10 - previous['environmentReruns'] - formal_reruns}, 'accountingNotes': ['All failed model invocations and prior model replays remain charged.', 'Missing model counts are never zero: reserve the per-attempt 50-call ceiling and retain the observed lower bound.', 'Source-only preflight retries are separate from restarted formal full Live.'], 'sources': [{'path': row['summaryPath'], 'sha256': row['summarySha256'], 'modelChecks': row['modelChecks']} for row in records]}
    audit = {'status': 'EXPOSED_DEVELOPMENT_PENDING_INDEPENDENT_REVIEW', 'generatedAt': datetime.now(timezone.utc).isoformat(), 'approvedFreezeSha256': get(EXEC / 'user-approval.json')['freezeSha256'], 'hardDeadline': get(EXEC / 'launch.json')['hardDeadline'], 'finish': get(RESULTS / 'finish.json') if (RESULTS / 'finish.json').exists() else get(EXEC / 'supervisor/finish.json'), 'plannedRuns': planned, 'attempts': records, 'outcomes': dict(Counter(row['outcome']['type'] for row in final.values())), 'qualified': sum(row['qualifiedDelivery'] for row in final.values()), 'NOT_REACHED': 18 - len(final), 'gaps': gaps, 'minimumGapMs': min((g['gapMsFromRunnerFinish'] for g in gaps), default=None), 'notes': ['Frozen evaluator@30/rubric@26 outputs are retained without relabeling or post-hoc rescoring.', 'Selected direct-page count includes recorded CHECK_AVAILABILITY model selections; unique IDs and actual availability records are separate, since rejected selections are not executed visits.', 'Combined Live supports stage observations, not separate causal effects of P2-1/P2-2/P2-3.', 'No delivery gives no displayed restaurant-condition rows; it is not condition satisfaction or inconsistency evidence.'], 'ledger': ledger}
    audit['planSlotsNotAttempted'] = 18 - len(final)
    audit['formalLiveNotReached'] = sum(row['status'] == 'NOT_REACHED' for row in planned)
    audit['NOT_REACHED'] = audit['formalLiveNotReached']
    ledger['checkpointC']['sourceOnlyPreflightRetryAttempts'] = sum(row['attempt'] > 1 and not row['formalRunStarted'] for row in records)
    ledger['checkpointC']['caseRetryAllowanceUsed'] = dict(Counter(row['run']['caseId'] for row in records if row['attempt'] > 1))
    ledger['checkpointC']['googleRequestsIncludingPreflight'] = sum(row['googleRequestsIncludingBothPreflights'] or 0 for row in records)
    ledger['checkpointC']['outerRetryBudget'] = {'reservedMaximum': 6, 'usedIncludingSourcePreflight': sum(row['attempt'] > 1 for row in records), 'perCaseMaximum': 1, 'exhaustedCases': list(ledger['checkpointC']['caseRetryAllowanceUsed']), 'note': 'Frozen ledger environmentReruns counts formal Live restarts; outer totalReruns also charges preflight retries. Both are retained; no second H005 retry is available.'}
    write('result-audit.json', audit)
    write('phase2-ledger-after.json', ledger)
    return audit


if __name__ == '__main__':
    audit = summarize()
    print(json.dumps({'attempts': len(audit['attempts']), 'qualified': audit['qualified'], 'NOT_REACHED': audit['NOT_REACHED'], 'outcomes': audit['outcomes'], 'ledger': audit['ledger']['checkpointC']}, ensure_ascii=False))
