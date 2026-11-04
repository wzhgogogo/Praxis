"""Offline, immutable Git-blob analysis. No replay, network, model, or grading."""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
MANIFEST = json.loads((HERE / 'inputs.json').read_text())
REF = MANIFEST['sourceCommit']
ROOT = '.eval-artifacts/phase3b/g6-rerun-20261104/resumed/'
RUN = ROOT + 'runs/D6/D6/'
REC = RUN + 'recordings/g6-D6-1793768879017-0/'


def blob(path):
    data = subprocess.check_output(['git', 'show', REF + ':' + path])
    expected = next(x['sha256'] for x in MANIFEST['inputs'] if x['path'] == path)
    assert hashlib.sha256(data).hexdigest() == expected, path
    return data


def read(path):
    return json.loads(blob(path))


def ms(value):
    return round(datetime.fromisoformat(value.replace('Z', '+00:00')).timestamp() * 1000)


def cet(value):
    return datetime.fromtimestamp(value / 1000, timezone(timedelta(hours=1))).isoformat(timespec='milliseconds')


def analyze():
    diagnostics = read(RUN + 'browser-diagnostics.json')['events']
    trace = read(RUN + 'browser-trace.json')['events']
    fail = next(e for e in diagnostics if e['event'] == 'OPERATION_FAILED'
                and e.get('candidateId') == MANIFEST['candidateId'])
    begin = next(e for e in diagnostics if e['event'] == 'CANDIDATE_STARTED'
                 and e.get('candidateId') == MANIFEST['candidateId'])
    start, end = ms(begin['at']), ms(fail['at'])
    assert end - start == 60008
    assert fail['lifecycle']['scope'] == 'CANDIDATE'
    assert fail['lifecycle']['providerElapsedMs'] == 37105
    providers = [e for e in diagnostics if start <= ms(e['at']) <= end and e['event'] == 'PROVIDER_STARTED']
    recording = read(REC + 'recording.json')
    urls = {hashlib.sha256(p['url'].encode()).hexdigest(): p['url'] for p in recording['pages']}
    nav_starts = [e for e in trace if e['kind'] == 'NAVIGATION_START']
    nav_ends = {e['detail']['navigationId']: e for e in trace if e['kind'] == 'NAVIGATION_END'}
    candidate_nav = []
    for e in nav_starts:
        if not start <= ms(e['at']) < end:
            continue
        d = e['detail']
        terminal = nav_ends[d['navigationId']]
        candidate_nav.append({
            'traceSequence': e['sequence'], 'navigationId': d['navigationId'],
            'startCET': cet(ms(e['at'])), 'offsetMs': ms(e['at']) - start,
            'url': urls.get(d['urlSha256'], d['url']),
            'fullQueryKnown': d['urlSha256'] in urls,
            'urlSha256': d['urlSha256'], 'allowanceMs': d['navigationAllowanceMs'],
            'waitUntil': d['waitUntil'], 'elapsedMs': terminal['detail']['elapsedMs'],
            'endReason': terminal['detail']['endReason'],
        })
    assert len(candidate_nav) == 10
    assert len({n['urlSha256'] for n in candidate_nav}) == 10
    assert all(n['endReason'] == 'COMPLETED' for n in candidate_nav)
    assert candidate_nav[-1]['elapsedMs'] < candidate_nav[-1]['allowanceMs']

    # Session-method intervals are independent of per-request/network durations.
    active, spans = {}, []
    for e in trace:
        d = e['detail']
        if e['kind'] == 'OPERATION_STARTED':
            active[d['operationId']] = e
        elif e['kind'] == 'OPERATION_FINISHED':
            first = active.pop(d['operationId'])
            a, b = max(start, ms(first['at'])), min(end, ms(e['at']))
            if a < b:
                spans.append({'kind': 'BROWSER:' + d['method'], 'start': a, 'end': b,
                              'startSequence': first['sequence'], 'endSequence': e['sequence'],
                              'outcome': d.get('outcome')})
    assert not active
    decisions = [json.loads(line) for line in blob(RUN + 'execution.decisions.jsonl').decode().splitlines()]
    models = []
    for d in decisions:
        a, b = ms(d['startedAt']), ms(d['startedAt']) + d['latencyMs']
        if a < end and b > start:
            models.append({'kind': 'MODEL:' + d['purpose'], 'start': max(a, start), 'end': min(b, end),
                           'sequence': d['sequence'], 'latencyMs': d['latencyMs'], 'outputText': d['outputText']})
    assert len(models) == 1 and models[0]['latencyMs'] == 2165
    structured = []
    for e in read(REC + 'replay.har')['log']['entries']:
        request = e['request']
        if not request['url'].startswith('https://places.googleapis.com/'):
            continue
        a, b = ms(e['startedDateTime']), ms(e['startedDateTime']) + e['time']
        if a < end and b > start:
            structured.append({'kind': 'GOOGLE:RECORDED_STRUCTURED_RESPONSE', 'start': max(a, start),
                               'end': min(b, end), 'url': request['url'], 'elapsedMs': e['time']})
    assert len(structured) == 1 and structured[0]['elapsedMs'] == 1527

    # Partition all observed wall time once. Precedence is explicit and does not
    # attribute remote network causality to the containing browser method.
    candidates = models + structured + spans
    points = sorted({start, end} | {p for s in candidates for p in (s['start'], s['end'])})
    bins = Counter()
    timeline = []
    for a, b in zip(points, points[1:]):
        covering = [s for s in candidates if s['start'] <= a and s['end'] >= b]
        selected = covering[0] if covering else {'kind': 'UNATTRIBUTED'}
        kind = selected['kind']
        bins[kind] += b - a
        if timeline and timeline[-1]['kind'] == kind and timeline[-1]['endMs'] == a - start:
            timeline[-1]['endMs'] = b - start
            timeline[-1]['elapsedMs'] += b - a
        else:
            timeline.append({'startCET': cet(a), 'startMs': a - start, 'endMs': b - start,
                             'elapsedMs': b - a, 'kind': kind})
    assert sum(bins.values()) == 60008
    duplicates = defaultdict(list)
    for e in nav_starts:
        duplicates[e['detail']['urlSha256']].append(e)
    repeated = [{'url': events[0]['detail']['url'], 'urlSha256': key,
                 'startsCET': [cet(ms(e['at'])) for e in events],
                 'insideCandidate': [start <= ms(e['at']) < end for e in events]}
                for key, events in duplicates.items() if len(events) > 1]
    assert len(repeated) == 5 and not any(any(x['insideCandidate']) for x in repeated)
    # CDP-only slowest completed request on the last navigation. Never add Guard
    # transport durations or assume URL/order gives a cross-layer request join.
    request_starts = {e['detail']['requestId']: e for e in trace if e['kind'] == 'NETWORK_REQUEST_START'}
    slowest = []
    for e in trace:
        if e['kind'] != 'NETWORK_REQUEST_END':
            continue
        d = e['detail']
        first = request_starts[d['requestId']]['detail']
        if first.get('navigationId') == candidate_nav[-1]['navigationId'] and d.get('outcome') == 'FINISHED':
            slowest.append({'requestId': d['requestId'], 'url': first['url'],
                            'resourceType': first.get('resourceType'), 'terminal': d})
    slowest.sort(key=lambda x: x['terminal'].get('browserElapsedMs', 0), reverse=True)
    lifecycle = [{**e, 'at': cet(ms(e['at'])), 'offsetMs': ms(e['at']) - start}
                 for e in diagnostics if start <= ms(e['at']) <= end]
    return {'mode': 'OFFLINE_DIAGNOSIS_OF_EXPOSED_LIVE_RECORD_NOT_REPLAY_OR_REGRADE',
            'sourceCommit': REF, 'startCET': cet(start), 'endCET': cet(end), 'elapsedMs': end - start,
            'failure': fail, 'exclusiveMs': dict(bins), 'timeline': timeline, 'navigations': candidate_nav,
            'models': [{**s, 'startCET': cet(s['start'])} for s in models],
            'google': [{**s, 'startCET': cet(s['start'])} for s in structured],
            'allExplicitNavigations': len(nav_starts), 'repeatedNavigationsOutsideCandidate': repeated,
            'lifecycle': lifecycle, 'slowestCompletedCDPRequestsOnFinalNavigation': slowest[:5]}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    result = analyze()
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / 'analysis.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ['elapsedMs', 'exclusiveMs', 'allExplicitNavigations']}, indent=2))
