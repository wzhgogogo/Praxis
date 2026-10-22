"""Offline-only extraction. Uses stdlib HTMLParser, never production parsers."""
import collections
import hashlib
import json
import pathlib
import re
from html.parser import HTMLParser
from urllib.parse import urldefrag, urlsplit, urlunsplit

ROOT = pathlib.Path(__file__).resolve().parents[3]
OUT = pathlib.Path(__file__).resolve().parent
INDEX = ROOT / '.eval-artifacts/checkpoint-c-live-20261020/guarded-continuation-20261021/results-index.json'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def dump(name, value):
    with (OUT / name).open('x') as f:
        json.dump(value, f, ensure_ascii=False, indent=2)
        f.write('\n')


class Node:
    def __init__(self, tag='', attrs=(), parent=None):
        self.tag, self.attrs, self.parent = tag, dict(attrs), parent
        self.children, self.parts = [], []

    def text(self):
        return ' '.join(' '.join(p.text() if isinstance(p, Node) else p for p in self.parts).split())

    def ancestors(self):
        n = self
        while n:
            yield n
            n = n.parent

    def descendants(self):
        for n in self.children:
            yield n
            yield from n.descendants()


class Document(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = self.current = Node()
        self.nodes = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.current)
        self.current.children.append(n)
        self.current.parts.append(n)
        self.nodes.append(n)
        if tag not in {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}:
            self.current = n

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for n in self.current.ancestors():
            if n.tag == tag and n.parent:
                self.current = n.parent
                break

    def handle_data(self, value):
        self.current.parts.append(value)


def matches(n, selector):
    a, t, r = n.attrs, n.tag, n.attrs.get('role')
    if selector == 'a[href],[role=link]':
        return t == 'a' and 'href' in a or r == 'link'
    if selector == 'button,[role=button],[role=option],input[role=combobox][aria-readonly=true]':
        return t == 'button' or r in {'button', 'option'} or t == 'input' and r == 'combobox' and a.get('aria-readonly') == 'true'
    if selector == '[role=combobox]:not(input):not(select):not(button)':
        return r == 'combobox' and t not in {'input', 'select', 'button'}
    if selector == 'select':
        return t == 'select'
    if selector == 'input[type=radio],[role=radio]':
        return t == 'input' and a.get('type') == 'radio' or r == 'radio'
    if selector == 'input[type=checkbox],[role=checkbox]':
        return t == 'input' and a.get('type') == 'checkbox' or r == 'checkbox'
    if selector == 'input[type=range],[role=slider]':
        return t == 'input' and a.get('type') == 'range' or r == 'slider'
    if selector.startswith('input:not([type=checkbox])'):
        return t == 'input' and a.get('type') not in {'checkbox', 'radio', 'range'} and not (r == 'combobox' and a.get('aria-readonly') == 'true') or t == 'textarea' or r == 'textbox' and r != 'combobox'
    if selector.startswith('[data-praxis-scroll-region]'):
        return 'data-praxis-scroll-region' in a or t == 'dialog' and 'open' in a or r in {'dialog', 'alertdialog', 'listbox', 'region'}
    return False


def group_label(node):
    if node is None:
        return 'Unlabelled group'
    for n in node.ancestors():
        classes = n.attrs.get('class', '').split()
        if any('calendar-navi' in c or c.endswith('__calendar-wrap') for c in classes) or n.tag == 'table':
            return 'Calendar'
        if n.attrs.get('aria-label') and n is not node:
            return n.attrs['aria-label'][:160]
        for child in n.children:
            if child.tag in {'legend', 'caption'} or any(re.search(r'(?:__|-)(?:label|title)$', c) for c in child.attrs.get('class', '').split()):
                label = child.text()
                if label and len(label) <= 100:
                    return label
        if n.tag in {'nav', 'header', 'footer'}:
            return n.tag.title()
        if n.tag == 'form':
            return n.attrs.get('aria-label') or n.attrs.get('id') or 'Form'
        if n.tag in {'section', 'article', 'aside', 'main'}:
            heading = next((c.text() for c in n.descendants() if c.tag in {'h1', 'h2', 'h3', 'h4'} and c.text()), None)
            return heading[:160] if heading else n.tag.title()
    return 'Page'


def bind_node(dom, control):
    stable = control.get('stableKey', '')
    if '|' not in stable:
        return None
    selector, ordinal = stable.split('|', 1)[0], stable.rsplit('|', 1)[1]
    matching = [n for n in dom.nodes if matches(n, selector)]
    structure = control.get('structure', {})

    def agrees(node):
        if structure.get('tag', '').lower() != node.tag:
            return False
        if not set(structure.get('classes', [])).issubset(node.attrs.get('class', '').split()):
            return False
        # Recording sanitization removes unsafe href attributes, so LINK selector
        # ordinals can shift. Bind against classes + retained URL + text instead.
        if control['kind'] == 'LINK':
            href = control.get('href', '')
            if href and not href.startswith('[REDACTED') and urldefrag(href)[0] != urldefrag(node.attrs.get('href', ''))[0]:
                return False
        label = control['label']
        observed_label = node.attrs.get('aria-label') or node.attrs.get('title') or node.text()
        return not label or label == observed_label or control.get('calendarDate') is not None

    if control['kind'] != 'LINK' and ordinal.isdigit() and int(ordinal) < len(matching) and agrees(matching[int(ordinal)]):
        return matching[int(ordinal)]
    candidates = [n for n in matching if agrees(n)]
    return candidates[0] if len(candidates) == 1 else None


def main():
    index = json.loads(INDEX.read_text())
    files, inventory, seeds, observations, answers = {}, [], [], [], []

    def retain(path):
        path = path.resolve()
        rel = str(path.relative_to(ROOT))
        files[rel] = {'path': rel, 'sha256': digest(path), 'bytes': path.stat().st_size}
        return rel

    retain(INDEX)
    for run in index['runs']:
        decisions_path = ROOT / run['decisions']['path']
        recording_path = ROOT / run['browserRecording']['path']
        retain(decisions_path)
        assert digest(decisions_path) == run['decisions']['sha256']
        retain(recording_path)
        assert digest(recording_path) == run['browserRecording']['sha256']
        rec = json.loads(recording_path.read_text())
        snapshots = [(i, e) for i, e in enumerate(rec['entries']) if e['kind'] == 'SNAPSHOT']
        docs = {d['snapshot']: d for d in rec['documents']}
        for row in map(json.loads, decisions_path.read_text().splitlines()):
            if row['purpose'] != 'browser_read_decide':
                continue
            inp = json.loads(next(m['content'] for m in row['messages'] if m['role'] == 'user'))
            targets = inp['observation']['targets']
            dates = [i for i, t in enumerate(targets) if t['label'].startswith('Calendar date 2026-10-')]
            if inp['stage'] != 'AVAILABILITY' or not inp['goal']['date'].startswith('2026-11-') or not dates or not any(t['label'] == 'Next' for t in targets):
                continue
            original = json.loads(row['outputText']) if row['outputText'] else {}
            chosen = next((t for t in targets if t['ref'] == original.get('targetRef')), None)
            selected = bool(chosen and chosen['label'] == 'Next')
            sample_id = f"{run['run']['runId']}-d{row['sequence']:03}"
            snapshot = row['browser']['recordingSnapshot']
            snapshot_index, snapshot_event = snapshots[snapshot - 1]
            assert snapshot_event['detail']['url'] == inp['observation']['url']
            event = next(e for e in rec['entries'][snapshot_index + 1:] if e['kind'] in {'CONTROLS', 'SNAPSHOT'})
            assert event['kind'] == 'CONTROLS'
            controls = event['detail']['controls']
            projected = []
            for c in controls:
                if not c.get('visible') or c.get('blockedByActiveLayer') or c.get('observationOnly') and not c.get('calendarDate') or c['kind'] == 'LINK' and c.get('href') is None:
                    continue
                projected.append(c)
                if c['kind'] == 'SELECT' and not c.get('disabled'):
                    projected.extend({**o, 'kind': 'OPTION'} for o in c.get('options', []))
            assert max(int(t['ref'].rsplit(':', 1)[1]) for t in targets) <= len(projected), sample_id
            html_path = recording_path.parent / docs[snapshot]['file']
            retain(html_path)
            dom = Document(html_path.read_text())
            v3 = json.loads(json.dumps(inp['observation']))
            month_nodes = [n for n in dom.nodes if n.tag == 'a' and n.text() == 'Next month' and any('calendar-navi-target--next' in c for c in n.attrs.get('class', '').split())]
            assert len(month_nodes) == 1, sample_id
            actual_month_node = month_nodes[0]
            captions = sorted({n.text() for n in dom.nodes if n.tag == 'caption' and re.search(r'Oct\s+2026', n.text())})
            assert captions, sample_id
            v3['displayedCalendarMonth'] = {'year': 2026, 'month': 10, 'source': 'DOM caption', 'caption': captions[0]}
            bindings, true_ref, previous_refs, pager_refs, labels_changed = [], None, [], {}, []
            for target, augmented in zip(targets, v3['targets']):
                control = projected[int(target['ref'].rsplit(':', 1)[1]) - 1]
                label_matches = (target['label'] == control['label'] or control['label'] == '[REDACTED_PROFILE_LABEL]'
                                 or control.get('calendarDate') and control['calendarDate'] == target.get('calendarDate')
                                 or target['label'].startswith('https://') and control['label'] == urlunsplit((*urlsplit(target['label'])[:3], '', '')))
                assert label_matches and target['kind'] == control['kind'], (sample_id, target['ref'])
                stable = control.get('stableKey', '')
                node = bind_node(dom, control)
                group = 'Calendar' if target.get('calendarDate') else group_label(node)
                augmented['controlGroupLabel'] = group
                if node is not None and not target['label'] and node.text():
                    augmented['label'] = node.text()[:240]
                    augmented['labelSource'] = 'DOM descendant text'
                    labels_changed.append({'ref': target['ref'], 'from': '', 'to': augmented['label']})
                if node is actual_month_node:
                    assert 'CLICK' in target.get('availableActions', [])
                    true_ref = target['ref']
                if node is not None:
                    test_id = node.attrs.get('data-testid', '')
                    if test_id in {'headcount-select-next', 'time-select-next'}:
                        assert (node.attrs.get('aria-label') or node.text()) == 'Next'
                        pager_refs[target['ref']] = test_id
                    if node.text() == 'Previous month' and 'calendar-navi-target--prev' in node.attrs.get('class', ''):
                        previous_refs.append(target['ref'])
                bindings.append({'ref': target['ref'], 'rawControlId': control.get('id'), 'stableKey': stable,
                                 'groupLabel': group, 'domTag': node.tag if node else None,
                                 'dataTestid': node.attrs.get('data-testid') if node else None})
            assert true_ref, sample_id
            positional = next(t for t in reversed(targets[:dates[0]]) if t['label'] == 'Next')
            assert positional['ref'] in pager_refs
            entry = {'id': sample_id, 'runId': run['run']['runId'], 'caseId': run['run']['caseId'], 'sequence': row['sequence'],
                     'selected': selected, 'selectionReason': 'ORIGINAL_SELECTED_NEXT' if selected else 'ORIGINAL_OTHER_ACTION',
                     'decisionsPath': str(decisions_path.relative_to(ROOT)), 'recordingPath': str(recording_path.relative_to(ROOT)),
                     'htmlPath': str(html_path.relative_to(ROOT)), 'htmlSha256': digest(html_path), 'snapshot': snapshot,
                     'reviewerPositionalRef': positional['ref'], 'reviewerPositionalActualOwner': pager_refs[positional['ref']],
                     'actualMonthNextRef': true_ref, 'originalAction': original, 'originalMonthLabel': next(t['label'] for t in targets if t['ref'] == true_ref)}
            inventory.append(entry)
            if selected:
                seeds.append({'id': sample_id, 'runId': entry['runId'], 'sequence': row['sequence'], 'captured': row})
                observations.append({'id': sample_id, 'observation': v3})
                answers.append({'id': sample_id, 'expectedAction': 'CLICK', 'expectedRef': true_ref, 'calendarPreviousRefs': previous_refs,
                                'pagerRefs': pager_refs, 'htmlPath': entry['htmlPath'], 'htmlSha256': entry['htmlSha256'],
                                'rule': 'Original DOM node a containing Next month in calendar navigation, bound through captured stableKey and exact original targetRef; never target order',
                                'labelsChanged': labels_changed, 'bindings': bindings})
    assert len(inventory) == 104 and len(seeds) == 69
    anchor = next(a for a in answers if a['id'] == 'c-01-d028')
    assert anchor['expectedRef'] == 'observation:4:target:90'
    assert anchor['pagerRefs']['observation:4:target:131'] == 'headcount-select-next'
    assert anchor['pagerRefs']['observation:4:target:136'] == 'time-select-next'
    dump('inventory.json', {'schema': 'checkpoint-c-calendar-inventory@1', 'status': 'EXPOSED_DEVELOPMENT', 'browserDecisionCount': 153,
                           'eligible': len(inventory), 'selected': len(seeds), 'excluded': 35, 'entries': inventory})
    for name, rows in [('seeds.jsonl', seeds), ('observations-v3.jsonl', observations)]:
        with (OUT / name).open('x') as f:
            for value in rows:
                f.write(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n')
    dump('oracle.json', {'schema': 'checkpoint-c-calendar-oracle@1', 'status': 'USER_APPROVED_DOM_RULE_CORRECTION', 'annotator': 'CODEX_OFFLINE_SOURCE_AUDIT', 'answers': answers})
    dump('source-manifest.json', {'schema': 'checkpoint-c-calendar-sources@1', 'files': sorted(files.values(), key=lambda v: v['path'])})
    dump('oracle-audit.json', {'eligible': 104, 'selected': 69, 'modelCalls': 0, 'websiteRequests': 0,
                             'selectedByRun': dict(collections.Counter(s['runId'] for s in seeds)),
                             'selectedPositionalOwners': dict(collections.Counter(e['reviewerPositionalActualOwner'] for e in inventory if e['selected'])),
                             'trueCalendarRefPresent': 69, 'trueCalendarLabelsEmpty': sum(e['originalMonthLabel'] == '' for e in inventory if e['selected']),
                             'communicationCorrection': 'Actual controls were present as empty-label links, not absent. V3 completes semantics on existing refs.',
                             'literalControl': anchor})
    print(json.dumps({'eligible': len(inventory), 'seeds': len(seeds), 'modelCalls': 0, 'sourceFiles': len(files)}))


if __name__ == '__main__':
    main()
