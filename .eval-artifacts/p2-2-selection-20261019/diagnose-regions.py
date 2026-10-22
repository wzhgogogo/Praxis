"""Read frozen P2-1 traces only. Never imports production or opens a network."""
from pathlib import Path
import hashlib, json, re, html

base = Path('.eval-artifacts/p2-2-selection-20261019')
inputs = json.loads((base / 'timing-inputs.json').read_text())['inputs']
records = []
for item in inputs:
    if not item['group'].startswith('P21_'):
        continue
    path = Path(item['artifact']['path'])
    if hashlib.sha256(path.read_bytes()).hexdigest() != item['artifact']['sha256']:
        raise RuntimeError('Frozen probe changed')
    source = json.loads(path.read_text())
    trace = [json.loads(line) for line in Path(item['trace']['path']).read_text().splitlines() if line]
    captures = [json.loads(line) for line in Path(item['decisions']['path']).read_text().splitlines() if line] if item.get('decisions') else []
    tabelog = next((row for row in source['sources'] if row['sourceId'] == 'tabelog'), {})
    pages = []
    for point in trace:
        detail = point.get('detail') or {}
        url = detail.get('url') if isinstance(detail, dict) else None
        if point['kind'] == 'SNAPSHOT' and url and 'tabelog.com/' in url and (not pages or pages[-1]['url'] != url):
            pages.append({'sequence': point['sequence'], 'at': point['at'], 'url': url})
    decisions = []
    for capture in captures:
        if capture['purpose'] != 'browser_read_decide':
            continue
        observed = json.loads(next(message['content'] for message in capture['messages'] if message['role'] == 'user'))
        if observed.get('source') != 'DIRECTORY' or observed.get('stage') != 'DISCOVERY':
            continue
        try:
            action = json.loads(capture.get('outputText') or '{}')
        except json.JSONDecodeError:
            action = {'action': 'UNPARSEABLE'}
        target = next((target for target in observed['observation']['targets'] if target['ref'] == action.get('targetRef')), None)
        decisions.append({'sequence': capture['sequence'], 'startedAt': capture.get('startedAt'),
            'objective': observed.get('objective'), 'progress': observed.get('progress'),
            'observedUrl': observed['observation'].get('url'), 'action': action.get('action'),
            'field': action.get('authoritativeField'), 'selectedTarget': {key: target.get(key) for key in ['label','href','kind']} if target else None,
            'modelReasonNotSourceFact': action.get('reason'),
            'relatedObservedTargets': [{key: target.get(key) for key in ['label','href','kind']} for target in observed['observation']['targets'] if re.search('kagurazaka|iidabashi|yotsuya|shinjuku|kichijoji|nakameguro|神楽坂', target.get('label',''), re.I)]})
    page_urls = [page['url'].split('?')[0].rstrip('/') for page in pages]
    repeated = sorted({url for url in page_urls if page_urls.count(url) > 1})
    fragments = []
    if 'kagurazaka' in source['caseId']:
        for recording in sorted((path.parent / 'recording').glob('**/snapshot-*.html')):
            raw = recording.read_text()
            links = []
            for anchor in re.finditer(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>([\s\S]*?)</a>', raw, re.I):
                label = html.unescape(re.sub('<[^>]+>', ' ', anchor[2])).strip()
                if re.search('kagurazaka|iidabashi|yotsuya|神楽坂', label, re.I):
                    links.append({'label': re.sub(r'\s+', ' ', label), 'href': html.unescape(anchor[1])})
            if links:
                fragments.append({'path': str(recording), 'sha256': hashlib.sha256(recording.read_bytes()).hexdigest(),
                    'scope': 'Recorded HTML links; visibility comes only from the separate captured observed targets.', 'links': list({json.dumps(link,sort_keys=True):link for link in links}.values())[:12]})
            if len(fragments) >= 2:
                break
    failure = tabelog.get('failureCode')
    if not failure:
        attribution = 'No Tabelog terminal failure in this probe; retain as a comparison, not a failure sample.'
    elif failure == 'READ_BUDGET_EXCEEDED' and repeated:
        attribution = 'Recorded region/list URLs repeat before the page budget stops the read. Selected target labels and model reasons below distinguish the incorrect route from the stopping symptom.'
    elif failure == 'DISCOVERY_SOURCE_LOCATION_UNGROUNDED':
        attribution = 'Source location was not grounded; model COMPLETE/target choices are retained. Code alone does not prove which geographic interpretation was correct.'
    else:
        attribution = 'Recorded terminal code plus actual action/feedback retained; do not infer a missing cause from the code alone.'
    records.append({'id': item['id'], 'group': item['group'], 'caseId': source['caseId'], 'artifact': item['artifact'],
        'trace': item['trace'], 'decisionsInput': item.get('decisions'), 'tabelog': tabelog,
        'pageSequence': pages, 'repeatedUrls': repeated, 'regionDecisions': decisions,
        'recordedRelatedHtml': fragments, 'attribution': attribution})

output = base / 'region-diagnosis.json'
if output.exists():
    raise RuntimeError('Refuse to overwrite prior diagnosis')
output.write_text(json.dumps({'status': 'OFFLINE_DIAGNOSIS_ONLY', 'records': records, 'models': 0, 'websites': 0,
    'nativeRestaurantSearchChanged': False, 'limitation': 'Source labels/links establish the recorded hierarchy, not a new coordinate/name map or current website behavior.'}, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'records': len(records), 'failures': sum(bool(record['tabelog'].get('failureCode')) for record in records)}, indent=2))
