from pathlib import Path
import collections, datetime, hashlib, json, re

base = Path('.eval-artifacts/phase3a-boundary/review-correction')
def read(path):
    return json.loads(path.read_text())
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def basis_key(value):
    if isinstance(value, dict):
        return 'goalBasis' in value or any(basis_key(v) for v in value.values())
    return isinstance(value, list) and any(basis_key(v) for v in value)
def norm(text):
    return re.sub(r'\s+', ' ', text).strip().lower()
def diff(a, b, path=''):
    if a == b:
        return []
    if isinstance(a, dict) and isinstance(b, dict):
        return [row for key in sorted(set(a) | set(b)) for row in diff(a.get(key), b.get(key), path + '.' + key)]
    return [{'path': path, 'expected': a, 'actual': b}]
def view(draft, gold):
    if draft is None:
        return None
    result = {key: draft[key] for key in ['date', 'timeWindow', 'permittedAlternativeTimeWindow', 'partySize', 'area', 'budgetPerPerson'] if key in draft}
    result['criteria'] = sorted({json.dumps({'text': c['text'].strip().lower(), 'polarity': c['polarity'], 'strength': c['strength']}, sort_keys=True) for c in draft['criteria']})
    if 'target' in gold:
        result['target'] = {key: draft.get('target', {}).get(key) for key in ['query', 'selectionScope', 'requestedResultCount'] if key in gold['target']}
    return result

selected = read(base / 'selected-inputs.json')
result = read(base / 'execution.json')
assert result['status'] == 'COMPLETED' and result['completedLogicalTurns'] == 9
starts = sorted((base / 'calls').glob('*.started.json'))
responses = sorted((base / 'calls').glob('*.response.json'))
assert len(starts) == len(responses) == result['newRealCalls'] <= 18
assert [read(p)['attempt'] for p in starts] == list(range(85, 85 + len(starts)))
assert result['cumulativeRealCalls'] == 84 + len(starts) <= 144
findings = []
for session in selected['sessions']:
    previous = None
    for turn in session['turns']:
        row = next(r for r in result['rows'] if r['sessionId'] == session['id'] and r['turnId'] == turn['id'])
        assert row['input']['message'] == turn['message']
        assert row['input']['referenceTime'] == '2026-08-05T09:00:00+09:00'
        assert row['input'].get('currentDraft') == previous
        targets = [f for f in row['interpreted'].get('proposal', {}).get('facts', []) if f['field'] == 'TARGET']
        actual = row.get('actualDraft')
        expected_goal = {'SR02-T01': 'AVAILABILITY', 'SR02-T02': 'AVAILABILITY', 'SR03-T01': 'RECOMMENDATION'}[turn['id']]
        expected_category = {'SR02-T01': 'A', 'SR02-T02': 'CONTEXT_CARRY', 'SR03-T01': 'NO_TIME'}[turn['id']]
        assert turn['category'] == expected_category
        errors = []
        if row['interpreted']['status'] != 'PROPOSED':
            errors.append('MODEL_OUTPUT_NOT_VALID')
        if actual is None or actual.get('target', {}).get('goal') != expected_goal:
            errors.append('AUTHORITATIVE_GOAL_MISMATCH')
        if expected_category == 'CONTEXT_CARRY':
            if targets or not previous or actual.get('target', {}).get('goal') != previous.get('target', {}).get('goal'):
                errors.append('CONTEXT_CARRY_VIOLATION')
        else:
            if len(targets) != 1 or targets[0].get('value', {}).get('goal') != expected_goal:
                errors.append('PROPOSED_TARGET_MISMATCH')
            for target in targets:
                basis = target.get('value', {}).get('goalBasis', {})
                quotes = basis.get('quotes', [])
                if basis.get('type') not in ['BOOKING_WORDING', 'SPECIFIC_TIME_MEAL', 'JUDGMENT'] or not basis.get('reason', '').strip() or not quotes:
                    errors.append('MISSING_BASIS')
                if any(not norm(q) or norm(q) not in norm(turn['message']) for q in quotes):
                    errors.append('QUOTE_NOT_IN_CURRENT_MESSAGE')
        assert not basis_key(actual)
        assert len(row['transitions']) == 1
        for transition in row['transitions']:
            assert not transition['commands'] and not basis_key(transition['domainState'])
            event = transition['event']
            if event['type'] == 'SEMANTIC_PROPOSAL_COMPILED' and 'target' in event['patch']:
                assert actual['target']['goal'] == event['patch']['target']['goal']
        strict_differences = diff(turn['expectedDraft'], actual)
        value_differences = diff(view(turn['expectedDraft'], turn['expectedDraft']), view(actual, turn['expectedDraft']))
        findings.append({'sessionId': session['id'], 'turnId': turn['id'], 'category': expected_category, 'expectedGoal': expected_goal,
                         'actualGoal': actual.get('target', {}).get('goal') if actual else None,
                         'goalStatus': 'SATISFIED' if not errors else 'NOT_SATISFIED', 'errors': errors,
                         'nonGoalValueDifferences': value_differences, 'fullGoldDraftDifferences': strict_differences,
                         'rowFileSha256': sha(base / 'rows' / (str(row['logicalIndex']).zfill(3) + '.json'))})
        previous = actual
for p in starts:
    request = read(p)['request']
    assert request['promptVersion'] == 'v25' and request['outputSchema']['version'] == '4'
    assert request['timeoutMs'] == 30000
    assert 'goalBasis' in request['messages'][0]['content']
    assert request['messages'][-1]['content'].startswith('User restaurant message as JSON string: ')
records = [r for p in responses for r in read(p)['providerRecords']]
assert len(records) == len(starts) and all(r['outcome'] == 'SUCCEEDED' for r in records)
budget = read(Path('.eval-artifacts/phase3a-boundary/budget.json'))
assert budget['cumulative']['realModelCalls'] == result['cumulativeRealCalls']
shared = read(Path('.eval-artifacts/phase3a-prime/budget.json'))
assert shared['cumulative'] == read(base / 'initial-shared-budget.json')['cumulative']
allocation = next(r for r in shared['entries'] if r.get('slice') == 'phase3a-boundary stop1 independent allocation')
assert allocation['externalActualRealModelCalls'] == result['cumulativeRealCalls'] and allocation['chargedToThis400CallBudget'] == 0
review = {'schema': 'phase3a-boundary-independent-review@1', 'sourceCommit': result['sourceCommit'],
          'evaluatedAtCET': datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(),
          'executionSha256': sha(base / 'execution.json'), 'unit': 'logical turn', 'planned': 9, 'completed': len(findings),
          'goalSatisfied': sum(r['goalStatus'] == 'SATISFIED' for r in findings),
          'nonGoalValuesSatisfied': sum(not r['nonGoalValueDifferences'] for r in findings),
          'newRealCalls': len(starts), 'cumulativeRealCalls': result['cumulativeRealCalls'], 'remainingAllowance': 144 - result['cumulativeRealCalls'],
          'configuredModel': 'deepseek-v4-flash', 'reportedModels': dict(collections.Counter(read(p)['response']['model'] for p in responses)),
          'usage': {key: sum(r.get('usage', {}).get(key, 0) for r in records) for key in ['inputTokens', 'outputTokens', 'totalTokens']},
          'providerLatencyMsSum': sum(r['latencyMs'] for r in records), 'findings': findings,
          'localAuthorityChecks': 'SATISFIED: saved transitions contain no commands/basis persistence/downstream goal mutation',
          'productE2E': 'NOT_EVALUATED', 'sourceDeliveryS0toS4': 'NOT_EVALUATED: semantic-only; no source/delivery execution',
          'grayResults': 'Previously accepted 3/3 observations, annotations remain gray; not rerun', 'privateHoldout': 'NOT_READ'}
(base / 'independent-review.json').write_text(json.dumps(review, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: review[key] for key in ['goalSatisfied', 'nonGoalValuesSatisfied', 'completed', 'newRealCalls', 'cumulativeRealCalls', 'remainingAllowance']}))
