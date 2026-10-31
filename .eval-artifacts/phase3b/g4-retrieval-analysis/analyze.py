"""Read-only analysis of frozen, exposed G4 evidence; no provider/runtime imports."""
from pathlib import Path
from urllib.parse import urlparse
import collections
import gzip
import hashlib
import importlib.util
import json
import math
import statistics
import subprocess
import sys

ROOT = Path('.eval-artifacts/phase3b/g4-retrieval-analysis')
MAIN = '00519783b3f6a3e48a53a4a0a8b03c9621c8bcf7'
BASE = Path('.eval-artifacts/phase3b/g4-e2e')
CONT = Path('.eval-artifacts/phase3b/g4-e2e-continuation')
IDS = ['nr-007', 'nr-008', 'nr-019', 'nr-025']

def load(path):
    return json.loads(Path(path).read_text())

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()

def verify_inputs():
    freeze = load(ROOT / 'freeze.json')
    for row in freeze['files']:
        assert sha(row['path']) == row['sha256'], row['path']
    subprocess.run(['git', 'diff', '--quiet', MAIN, '--', 'src', 'scripts', 'package.json', 'package-lock.json', '.eval-artifacts/phase3b/budget.json'], check=True)
    return freeze

def outlet_id(url):
    return urlparse(url).path.rstrip('/').split('/')[-1]

def build():
    freeze = verify_inputs()
    summary = load(CONT / 'combined-evaluation-summary.json')
    original = {r['id']: r for r in load(BASE / 'inputs.json')['rows']}
    gold = {r['id']: r for r in load(BASE / 'gold.json')['rows']}
    executions = {r['id']: load(r['executionPath']) for r in summary['main37']}
    all_requests = []
    for parent in [BASE, CONT]:
        all_requests += [load(p) for p in sorted((parent / 'responses').glob('phase3b-*.json')) if not p.name.endswith('.started.json')]
    assert len(all_requests) == 188
    main_requests = [r for e in executions.values() for r in e['requests']]
    assert len(main_requests) == 167
    for r in all_requests:
        if r.get('bodyPath'):
            assert sha(r['bodyPath']) == r['sha256']
    failed = []
    for scored in summary['main37']:
        if scored['verdict'] != 'ENVIRONMENT_FAILURE':
            continue
        case = executions[scored['id']]
        failures = [r for r in case['requests'] if r.get('failure')]
        assert len(failures) == 1
        f = failures[0]
        category = {'SOURCE_TIMEOUT': 'TIMEOUT', 'SOURCE_NETWORK_FAILED': 'CONNECTION_ERROR_UNSPECIFIED'}[f['failure']['code']]
        details = [r for r in case['requests'] if r['kind'] == 'DETAIL']
        failed.append({'id': case['id'], 'name': original[case['id']]['subject']['name'],
            'executionPath': scored['executionPath'], 'executionSha256': sha(scored['executionPath']),
            'request': f, 'category': category, 'stage': f['kind'],
            'detailOrdinal': next((i+1 for i, r in enumerate(details) if r['ledgerId'] == f['ledgerId']), None),
            'completeHTTPResponseSaved': bool(f.get('bodyPath')),
            'certifiedDetailPreviouslyFetched': any(r.get('bodyPath') and outlet_id(r['url']) == gold[case['id']]['rstId'] for r in case['requests'][:case['requests'].index(f)]),
            'laterAuthorizedFirstFourVerdict': next((r['verdict'] for r in summary['rerunFirst4']['rows'] if r['id'] == case['id']), None)})
    assert len(failed) == 8
    assert collections.Counter(r['category'] for r in failed) == {'TIMEOUT': 4, 'CONNECTION_ERROR_UNSPECIFIED': 4}
    assert collections.Counter(r['stage'] for r in failed) == {'DETAIL': 6, 'SEARCH': 2}

    # Reuse the previously independent query/ItemList/visible-heading oracle.
    spec = importlib.util.spec_from_file_location('frozen_search_oracle', '.eval-artifacts/phase3b/c-batch2/score-search.py')
    oracle = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(oracle)
    misses = []
    snapshot_labels = {'nr-007': 'Beef Kitchen Nakameguro honten (ビーフキッチン 中目黒本店)',
        'nr-008': 'Kappou Sanchou Shibuya (割烹 三長 渋谷)',
        'nr-019': 'T nakameguro | Wagyu T-bone steak (T)',
        'nr-025': 'Shibuya Sushi Zumi (渋谷 鮨墨)'}
    for sid in IDS:
        e = executions[sid]
        observed_queries = []
        for r in e['requests']:
            if r['kind'] != 'SEARCH':
                continue
            observation = oracle.inspect(Path(r['bodyPath']).read_text(), r['url'], r['query'])
            assert observation['queryVisible'] and observation['structureVerified']
            observed_queries.append({'query': r['query'], 'certifiedInFirstPage': gold[sid]['rstId'] in observation['ids'], 'resultCount': len(observation['ids']), 'receipt': r['ledgerId']})
        jp = Path(f'.eval-artifacts/phase3b/c-batch2/retrieval-inputs/google/{sid}.raw.json')
        japanese = None
        if jp.exists():
            j = load(jp)
            assert j['id'] == original[sid]['googlePlaceId']
            assert j['displayName']['languageCode'] == 'ja'
            started = load(jp.with_name(jp.name.replace('.raw.json', '.started.json')))
            meta = load(jp.with_name(jp.name.replace('.raw.json', '.meta.json')))
            assert sha(jp) == meta['sha256'] and meta['status'] == 200
            japanese = {'name': j['displayName']['text'], 'placeId': j['id'], 'path': str(jp), 'sha256': sha(jp), 'requestUrl': started['url'], 'checkedAtCET': meta['atCET']}
        verification = Path(f'.eval-artifacts/name-resolution-benchmark-20261019/live-20261020/verify/{sid}/observations.json.gz')
        page = json.loads(gzip.decompress(verification.read_bytes()))['snapshots'][0]
        assert outlet_id(page['url']) == gold[sid]['rstId']
        quote = snapshot_labels[sid]
        assert quote in page['text']
        previous = next(Path('.eval-artifacts/phase3b/c-batch3/optional').glob(f'*-{sid}.result.json'))
        alternative = load(previous)
        body = Path(alternative['bodyPath'])
        assert sha(body) == alternative['sha256']
        started = load(body.with_name(body.name.replace('.body.html', '.started.json')))
        observation = oracle.inspect(body.read_text(), started['url'], alternative['query'])
        assert observation['queryVisible'] and observation['structureVerified']
        misses.append({'id': sid, 'google': original[sid], 'currentBenchmarkQueries': observed_queries,
            'currentBenchmarkDetails': e['bounds']['details'], 'currentBenchmarkModelCalls': e['bounds']['model'],
            'executionPath': next(r['executionPath'] for r in summary['main37'] if r['id'] == sid),
            'googleJapanese': japanese,
            'tabelogClue': {'quote': quote, 'url': page['url'], 'path': str(verification), 'compressedSha256': sha(verification), 'role': 'POSTHOC_ONLY_NOT_RETRIEVAL_INPUT'},
            'previousAlternativeSearch': {'query': alternative['query'], 'variant': alternative['variant'], 'certifiedInFirstPage': gold[sid]['rstId'] in observation['ids'], 'resultCount': len(observation['ids']), 'path': str(previous), 'bodyPath': str(body), 'bodySha256': sha(body), 'checkedAtCET': alternative['finishedAtCET'], 'identityAcceptance': 'NOT_EVALUATED_BY_FIRST_PAGE_HIT'}})

    successes = sorted(r['elapsedMs'] for r in main_requests if not r.get('failure'))
    elapsed = sum(r['elapsedMs'] for r in main_requests)
    ledger = load('.eval-artifacts/phase3b/budget.json')
    cumulative = {key: sum(e.get(key, e.get('publicGET', 0) if key == 'evaluationPublicGET' else 0) for e in ledger['entries']) for key in ['evaluationPublicGET', 'realModelCalls', 'googleRequests', 'fullLive', 'environmentReruns']}
    assert cumulative['evaluationPublicGET'] == 244
    result = {'schema': 'phase3b-g4-retrieval-analysis@1', 'mode': 'OFFLINE_EXPOSED_EVIDENCE_ANALYSIS_NOT_NEW_E2E',
        'main': MAIN, 'frozenConfigurationCommit': git('log', '-1', '--format=%H', '--', str(ROOT/'freeze.json')),
        'freezeSha256': sha(ROOT/'freeze.json'), 'frozenFiles': len(freeze['files']),
        'firstPass37': summary['cohorts'], 'wrongAccepted': sum(r['verdict'] == 'WRONG_ACCEPTED' for r in summary['main37']),
        'firstPassNetworkFailure': {'cases': 8, 'denominator': 37, 'percent': round(800/37, 3), 'byCategory': dict(collections.Counter(r['category'] for r in failed)), 'byStage': dict(collections.Counter(r['stage'] for r in failed)),
            'HTTPRequests': len(main_requests), 'failedHTTPRequests': 8, 'completedHTTPRequests': len(successes), 'percentOfHTTPRequests': round(800/len(main_requests), 3),
            'successElapsedMs': {'min': min(successes), 'median': statistics.median(successes), 'p95NearestRank': successes[math.ceil(.95*len(successes))-1], 'max': max(successes)},
            'successfulRequestsAtLeast10s': [{'id': r['ledgerId'], 'elapsedMs': r['elapsedMs']} for r in main_requests if not r.get('failure') and r['elapsedMs'] >= 10000],
            'failedElapsedMs': sum(r['request']['elapsedMs'] for r in failed), 'allHTTPElapsedMs': elapsed,
            'all188RequestsIncludingRerunsAndPartial': {'requests': len(all_requests), 'failures': sum(bool(r.get('failure')) for r in all_requests), 'elapsedMs': sum(r['elapsedMs'] for r in all_requests)}},
        'japaneseSavedGoogleCountOf4': sum(r['googleJapanese'] is not None for r in misses),
        'previousAlternativeFirstPageHits': sum(r['previousAlternativeSearch']['certifiedInFirstPage'] for r in misses),
        'resources': {'newGoogle': 0, 'newModel': 0, 'newPublicGET': 0, 'newFullLive': 0, 'newEnvironmentRerun': 0, 'credentialFileReadOrLoaded': False,
            'ledgerSha256': sha('.eval-artifacts/phase3b/budget.json'), 'cumulative': cumulative, 'publicGETLimit': ledger['limits']['evaluationPublicGET'], 'publicGETRemaining': ledger['limits']['evaluationPublicGET'] - cumulative['evaluationPublicGET']}}
    return {'analysis.json': result, 'network-failures.json': failed, 'miss-cases.json': misses}

if __name__ == '__main__':
    assert len(sys.argv) == 2 and sys.argv[1] in ['--write', '--verify-only']
    if sys.argv[1] == '--write':
        assert not git('status', '--porcelain'), 'Commit frozen analysis configuration first'
    outputs = build()
    for name, value in outputs.items():
        path = ROOT/name
        if sys.argv[1] == '--write':
            with path.open('x') as f:
                f.write(json.dumps(value, ensure_ascii=False, indent=2)+'\n')
        else:
            assert load(path) == value, name
    verify_inputs()
    print(json.dumps({'status': 'PASS', 'frozenFiles': outputs['analysis.json']['frozenFiles'], 'networkCases': 8, 'newCalls': 0}))
