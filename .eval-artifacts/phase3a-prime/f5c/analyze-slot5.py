#!/usr/bin/env python3
"""Read immutable evidence only; derive timeline/DOM refs without any replay."""
import collections
import datetime as dt
import gzip
import hashlib
import html
import io
import json
import pathlib
import re
import subprocess
import tarfile
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[3]
HERE = pathlib.Path(__file__).resolve().parent
REV = 'a691f7ddbce7a4fc32829508993a1ef49b269fd2'
BASE = '.eval-artifacts/phase3a-prime/f5-live/'
RUN = BASE + 'evidence/slot-5-2026-10-25T01-25-03-549Z-77ea337b-0e75-4cc2-b88e-7209e712274e'
inputs = []
members = []

def sha(raw): return hashlib.sha256(raw).hexdigest()
def source(path, compressed=False):
    raw = subprocess.check_output(['git', 'show', REV + ':' + path], cwd=ROOT)
    decoded = gzip.decompress(raw) if compressed else raw
    inputs.append({'gitBlob': REV + ':' + path, 'blobSha256': sha(raw), 'decodedSha256': sha(decoded)})
    return decoded
def time(value): return dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
def cet(value): return time(value).astimezone(dt.timezone(dt.timedelta(hours=1))).isoformat()
def milliseconds(start, end): return round((time(end)-time(start)).total_seconds()*1000)
def parsed_user(row):
    if row['purpose'] == 'restaurant_semantic_interpret': return {}
    return json.loads(next(m['content'] for m in row['messages'] if m['role'] == 'user'))
def write(path, value): path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def main():
    artifact_bytes = source(RUN + '.result.json.gz', True)
    artifact = json.loads(artifact_bytes)
    decisions = [json.loads(line) for line in source(RUN + '.decisions.jsonl.gz', True).splitlines()]
    supplement = json.loads(source(BASE + 'slots/5/observation-supplement.json'))
    archive = tarfile.open(fileobj=io.BytesIO(source(BASE + 'evidence/slot-5-recording.tar.gz')), mode='r:gz')
    recording_path = next(member.name for member in archive.getmembers() if member.name.endswith('/recording.json'))
    prefix = recording_path.rsplit('/', 1)[0]
    def member(path):
        raw = archive.extractfile(prefix + '/' + path).read()
        members.append({'archiveMember': prefix + '/' + path, 'sha256': sha(raw)})
        return raw
    recording = json.loads(member('recording.json'))
    start, end = artifact['startedAt'], artifact['finishedAt']
    trace = artifact['diagnostics']['browserTrace']
    snapshots = [row for row in trace if row['kind'] == 'SNAPSHOT']
    assert len(snapshots) == len(recording['pages'])
    evidence = []
    seen = set()
    # Trace URLs redact query values; verify snapshot ordinals against each
    # origin/path, while full query evidence remains in the diagnostic DOM.
    for page in sorted(recording['pages'], key=lambda page: page['snapshot']):
        url = page['url']
        snapshot = snapshots[page['snapshot']-1]
        assert urllib.parse.urlsplit(url)._replace(query='', fragment='') == urllib.parse.urlsplit(snapshot['detail']['url'])._replace(query='', fragment='')
        if url in seen or not ('sw=' in url or 'search_text=fugu' in url or '13154986' in url): continue
        seen.add(url)
        path = page.get('diagnostic', {}).get('file')
        if not path: continue
        raw = member(path)
        document = raw.decode()
        text = ' '.join(html.unescape(re.sub('<[^>]+>', ' ', re.sub(r'<(script|style)\b[\s\S]*?</\1>', '', document))).split())
        empty = re.search(r'No restaurants match[^.]*\.', text)
        evidence.append({'snapshot': page['snapshot'], 'diagnosticDOM': prefix + '/' + path,
            'sha256': sha(raw), 'traceSequences': [snapshot['sequence']], 'url': url,
            'restaurantCardAnchors': document.count('list-rst__rst-name-target'),
            'emptyQuote': empty.group(0) if empty else None})
    steps = []
    event_types = {'SEARCH_RESTAURANTS': 'SEARCH_COMPLETED', 'CHECK_AVAILABILITY': 'AVAILABILITY_CHECKED', 'INVESTIGATE_CANDIDATE_FACTS': 'CANDIDATE_FACTS_CHECKED'}
    events = iter(artifact['events'])
    for index, step in enumerate(artifact['trajectories'], 1):
        action = step['agentAction']['type']
        event = next(row for row in events if row['event']['type'] == event_types[action])
        steps.append({'trajectory': index, 'action': action, 'startedAtCET': cet(step['occurredAt']),
            'completedAtCET': cet(event['occurredAt']), 'latencyMs': step['executionMetadata']['latencyMs'],
            'executionMetadataRef': 'trajectories[' + str(index-1) + '].executionMetadata',
            'candidateIds': step['observation']['candidateIds']})
    decision_refs = []
    for line, row in enumerate(decisions, 1):
        payload = parsed_user(row)
        if row['purpose'] in ['restaurant_discovery_retrieval', 'restaurant_agent_decide'] or payload.get('regionCorrection'):
            decision_refs.append({'line': line, 'sequence': row['sequence'], 'purpose': row['purpose'],
                'startedAtCET': cet(row['startedAt']), 'latencyMs': row['latencyMs'],
                'output': json.loads(row['outputText']), 'observationURL': (payload.get('observation') or {}).get('url')})
    model_ms = collections.Counter()
    model_counts = collections.Counter()
    for row in decisions:
        model_ms[row['purpose']] += row['latencyMs']
        model_counts[row['purpose']] += 1
    timing = supplement['timing']
    assert timing['elapsedMs'] == milliseconds(start, end) == sum(timing['wallTimePartitionMs'].values())
    assert dict(model_ms) == timing['modelPurposeLatencyMs']
    assert dict(model_counts) == timing['modelCallsByPurpose']
    searches = [row['event'] for row in artifact['events'] if row['event']['type'] == 'SEARCH_COMPLETED']
    tabelog = searches[0]['metadata']['nativeDiscoveryFunnel']
    tablecheck = searches[1]['metadata']['nativeDiscoveryFunnel']
    observations = tabelog['listingObservations']
    first_query = next(i for i, row in enumerate(observations) if urllib.parse.parse_qs(urllib.parse.urlsplit(row['sourceUrl']).query).get('sw'))
    unfiltered_after_empty = [row for row in observations[first_query+1:] if not urllib.parse.parse_qs(urllib.parse.urlsplit(row['sourceUrl']).query).get('sw')]
    names = {c['restaurant']['id']: c['restaurant']['outletName'] for c in artifact['finalSnapshot']['domainState']['candidates']}
    final_agent = next(row for row in reversed(decisions) if row['purpose'] == 'restaurant_agent_decide')
    final_action = json.loads(final_agent['outputText'])
    execution_start = time(final_agent['startedAt']) + dt.timedelta(milliseconds=final_agent['latencyMs'])
    references = searches[0]['continuation']['discoveryPlan']['regionReferenceRead']['read']['candidates']
    pointer = [c['restaurant'] for c in references if 'tabelog.com/' in c['restaurant']['sourceIds'].get('googleWebsiteUri', '')]
    result = {'classification': 'superseded retrospective / exposed; analysis only, not a new evaluation',
        'revision': REV, 'artifactSha256': sha(artifact_bytes), 'startedAtCET': cet(start), 'finishedAtCET': cet(end),
        'elapsedMs': milliseconds(start, end), 'resourceUsage': artifact['resourceUsage'],
        'timing': {'basis': 'Retained supplementary partition checked against raw duration and decision totals. Unattributed time stays a gap.',
            'wallTimePartitionMs': timing['wallTimePartitionMs'], 'modelCallsByPurpose': dict(model_counts),
            'modelPurposeLatencyMs': dict(model_ms), 'pairingGaps': timing['gaps']},
        'completedActions': steps, 'decisionReferences': decision_refs, 'diagnosticDOM': evidence,
        'tabelog': {'sourceElapsedMs': tabelog['sourceElapsedMs'], 'directoryRegion': tabelog['directoryRegion'],
            'retrieval': tabelog['retrieval'], 'detailAttempts': tabelog['sourceDetailAttempts'],
            'unfilteredAfterFirstEmpty': unfiltered_after_empty,
            'sameSourcePointers': [{'outletName': p['outletName'], 'url': p['sourceIds']['googleWebsiteUri']} for p in pointer]},
        'tablecheck': {'sourceElapsedMs': tablecheck['sourceElapsedMs'], 'retrieval': tablecheck['retrieval'],
            'parsedOutlets': tablecheck['parsedOutlets'], 'detailAttempts': tablecheck['sourceDetailAttempts']},
        'f5': {'regionCorrectionInputs': sum(bool(parsed_user(row).get('regionCorrection')) for row in decisions),
            'selectRegionEntranceOutputs': sum(json.loads(row['outputText']).get('action') == 'SELECT_REGION_ENTRANCE' for row in decisions)},
        'interruptedAction': {'decisionLine': decisions.index(final_agent)+1, 'action': final_action,
            'candidateNames': [names[c] for c in final_action['candidateIds']],
            'executionStartedAtCET': execution_start.astimezone(dt.timezone(dt.timedelta(hours=1))).isoformat(),
            'untilArtifactEndMs': round((time(end)-execution_start).total_seconds()*1000),
            'persistedTrajectory': False, 'lastTrace': trace[-5:]},
        'termination': artifact.get('termination'), 'interruption': artifact.get('interruption')}
    write(HERE/'slot5-analysis.json', result)
    write(HERE/'slot5-inputs-sha256.json', {'revision': REV, 'inputs': inputs, 'archiveMembersRead': members,
        'modelCalls': 0, 'websiteGET': 0, 'Live': 0, 'environmentReruns': 0})
    print(json.dumps({'elapsedMs': result['elapsedMs'], 'regionCorrectionInputs': result['f5']['regionCorrectionInputs'],
        'unfilteredAfterFirstEmpty': len(unfiltered_after_empty), 'interruptedDecision': result['interruptedAction']['decisionLine']}))

if __name__ == '__main__': main()
