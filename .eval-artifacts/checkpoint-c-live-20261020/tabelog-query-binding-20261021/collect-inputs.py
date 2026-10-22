"""Copy immutable saved evidence only; never opens a socket or calls a model."""
import hashlib
import json
import pathlib
import subprocess
import sys

root = pathlib.Path(__file__).resolve().parents[3]
source = pathlib.Path(sys.argv[1])
batch = pathlib.Path(__file__).resolve().parent
prefix = pathlib.Path('.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021')
commit = 'e95de8cd053b85f659f6a17a30e299eb59d5352d'
def digest(b): return hashlib.sha256(b).hexdigest()
def provenance(p):
    data = p.read_bytes()
    relative = str(p.relative_to(source))
    original = subprocess.check_output(['git', 'show', f'{commit}:{relative}'], cwd=source)
    assert data == original, relative
    return {'commit': commit, 'path': relative, 'sha256': digest(data), 'bytes': len(data)}
def write(p, obj):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n')
rows = []
post = []
for run in sorted((source / prefix / 'quick-live-results').glob('c-*-attempt-1')):
    run_id = run.name[:4]
    result_path = next((run / 'runner').glob('*.result.json'))
    result = json.loads(result_path.read_text())
    checks = result['finalSnapshot']['domainState']['availabilityChecks']
    recording_path = next((run / 'recordings').glob('*/recording.json'))
    recording = json.loads(recording_path.read_text())
    candidates = {}
    candidate = stage = None
    snapshot = 0
    for event in recording['entries']:
        detail = event['detail']
        if event['kind'] == 'EXECUTOR_DIAGNOSTIC' and detail['event'] == 'CANDIDATE_STARTED':
            candidate, stage = detail.get('candidateId'), detail.get('stage')
        if event['kind'] == 'SNAPSHOT':
            snapshot += 1
            key = 'tabelog:'+detail['url'].removeprefix('https://tabelog.com/').rstrip('/')
            if stage != 'FACTS' and key == candidate:
                candidates[key] = {'eventSequence': event['sequence'], 'snapshot': snapshot, 'detail': detail}
    for cid, check in checks.items():
        if check.get('reasonCode') != 'REQUEST_SELECTION_UNCONFIRMED': continue
        selected = candidates[cid]
        doc = next(d for d in recording['documents'] if d['snapshot'] == selected['snapshot'])
        html_path = recording_path.parent / doc['file']
        outlet = cid.rsplit('/', 1)[1]
        name = f'{run_id}-{outlet}'
        html_output = batch / 'inputs' / (name+'.html')
        html_output.write_bytes(html_path.read_bytes())
        snapshot_output = batch / 'inputs' / (name+'.snapshot.json')
        write(snapshot_output, selected)
        request = json.loads(check['requestFingerprint'])
        rows.append({'id': name, 'runId': run_id, 'candidateId': cid, 'outletId': outlet,
                     'request': request, 'originalCheck': check,
                     'htmlPath': str(html_output.relative_to(root)), 'snapshotPath': str(snapshot_output.relative_to(root)),
                     'html': provenance(html_path), 'recording': provenance(recording_path), 'result': provenance(result_path),
                     'eventSequence': selected['eventSequence'], 'snapshot': selected['snapshot'],
                     'responsesCount': len(selected['detail'].get('responses', []))})
    for raw in sorted((run / 'post-run').glob('*.metadata.json')):
        metadata = json.loads(raw.read_text())
        body_path = raw.with_name(raw.name.replace('.metadata.json', '.body.txt'))
        assert digest(body_path.read_bytes()) == metadata['sha256']
        target = batch / 'inputs' / 'post-run' / run_id
        target.mkdir(parents=True, exist_ok=True)
        (target / body_path.name).write_bytes(body_path.read_bytes())
        (target / raw.name).write_bytes(raw.read_bytes())
        post.append({'runId': run_id, 'outletId': raw.name.split('.')[0], 'bodyPath': str((target/body_path.name).relative_to(root)),
                     'metadataPath': str((target/raw.name).relative_to(root)), 'body': provenance(body_path), 'metadata': provenance(raw)})
assert len(rows) == 19
write(batch/'inputs'/'manifest.json', {'schema': 'tabelog-query-binding-replay@1', 'sourceCommit': commit,
      'selectionRule': 'Last saved snapshot in the matching candidate read phase, excluding later FACTS refresh; no response fabrication.',
      'rows': rows, 'postRun': post, 'sourceRequests': 0, 'modelCalls': 0})
print(json.dumps({'samples': len(rows), 'responses': sum(r['responsesCount'] for r in rows), 'postRun': len(post)}))
