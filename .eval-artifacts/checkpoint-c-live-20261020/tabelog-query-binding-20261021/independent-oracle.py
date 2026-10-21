"""Independent HTMLParser + JSON source oracle. Does not import production parsers."""
import hashlib
import json
import pathlib
import re
from html.parser import HTMLParser
from urllib.parse import urlparse, parse_qs, urljoin

root = pathlib.Path(__file__).resolve().parents[3]
batch = pathlib.Path(__file__).resolve().parent
manifest = json.loads((batch/'inputs/manifest.json').read_text())
class Document(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.nodes = []
        self.stack = []
        self.feed(html)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        parent = self.stack[-1] if self.stack else None
        n = {'tag': tag, 'a': a, 'parent': parent, 'text': ''}
        n['hidden'] = bool(parent and parent['hidden']) or 'hidden' in a or a.get('aria-hidden') == 'true' or 'is-hidden' in (a.get('class') or '').split() or bool(re.search(r'(display\s*:\s*none|visibility\s*:\s*hidden)',a.get('style') or '',re.I))
        n['booking'] = bool(parent and parent['booking']) or 'p-booking-calendar' in (a.get('class') or '').split()
        self.nodes.append(n)
        if tag not in ['input','br','hr','img','meta','link','source','wbr','area','embed','param','col','base']: self.stack.append(n)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack and self.stack[-1]['tag'] == tag: self.stack.pop()
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i]['tag'] == tag:
                del self.stack[i:]
                break
    def handle_data(self, text):
        for n in self.stack: n['text'] += text
def selected(n):
    a=n['a']
    return any(a.get(k)=='true' for k in ['aria-pressed','aria-selected','aria-checked']) or a.get('aria-current') in ['true','page','step','location','date','time'] or bool(set((a.get('class') or '').split()) & set(['active','selected','current','checked','is-active','is-selected','is-current','is-checked']))
def people(n):
    p=n
    while p and p['booking']:
        a=p['a']
        if set((a.get('class') or '').split()) & set(['p-booking-calendar__people-button','p-booking-calendar__people-button-box']): return True
        if (a.get('aria-label') or '').lower() in ['guests','people','party size']: return True
        if p['tag']=='fieldset' and re.match(r'\s*Guests\b',p['text']): return True
        p=p['parent']
    return False
def slots(body, row):
    d=body.get('base_date',{})
    if f"{d.get('year')}-{d.get('month',0):02d}-{d.get('day',0):02d}" != row['request']['date'] or body.get('members') != row['request']['partySize']: return None
    selection=body.get('selection',{})
    values=selection.values() if isinstance(selection,dict) else selection
    result=[]
    for item in values:
        t=item.get('time');u=urlparse(urljoin('https://tabelog.com',item.get('url','')));q=parse_qs(u.query)
        expected={'rcd':row['outletId'],'member':str(row['request']['partySize']),'visit_date':row['request']['date'].replace('-',''),'visit_time':(t or '').replace(':','')}
        if u.netloc!='tabelog.com' or u.path!='/en/booking/form_course/new' or not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d',t or '') or any(q.get(k)!=[v] for k,v in expected.items()): return None
        result.append(t)
    return sorted(set(result))
rows=[]
for row in manifest['rows']:
    data=(root/row['htmlPath']).read_bytes()
    assert hashlib.sha256(data).hexdigest()==row['html']['sha256']
    doc=Document(data.decode())
    active=[n for n in doc.nodes if n['booking'] and not n['hidden'] and selected(n)]
    dates=[f"{int(n['a']['data-year']):04d}-{int(n['a']['data-month']):02d}-{int(n['a']['data-day']):02d}" for n in active if all(k in n['a'] for k in ['data-year','data-month','data-day'])]
    guests=[int(n['a'].get('data-value') or n['text'].strip()) for n in active if n['tag']=='button' and people(n)]
    confirmed=bool(dates and guests) and all(d==row['request']['date'] for d in dates) and all(p==row['request']['partySize'] for p in guests)
    ui=[]
    for n in doc.nodes:
        a=n['a']
        if n['booking'] and not n['hidden'] and n['tag']=='button' and 'data-time' in a and 'data-url' in a and a['data-url']:
            time=a['data-time']
            if re.fullmatch(r'\d{4}',time): time=time[:2]+':'+time[2:]
            ui.append({'time':time,'url':a['data-url']})
    ui_times=slots({'base_date':dict(zip(['year','month','day'],map(int,row['request']['date'].split('-')))),'members':row['request']['partySize'],'selection':ui},row) if confirmed else None
    post=next((p for p in manifest['postRun'] if p['runId']==row['runId'] and p['outletId']==row['outletId']),None)
    if post:
        metadata=json.loads((root/post['metadataPath']).read_text())
        q=parse_qs(urlparse(metadata['url']).query)
        assert metadata['method']=='GET' and metadata['status']==200 and set(q)=={'rst_id','svd','svps','svt'}
        assert q=={'rst_id':[row['outletId']],'svd':[row['request']['date'].replace('-','')],'svps':[str(row['request']['partySize'])],'svt':[row['request']['timeWindow']['earliest'].replace(':','')]}
    post_times=slots(json.loads((root/post['bodyPath']).read_text()),row) if post else None
    rows.append({'id':row['id'],'selectedDates':dates,'selectedGuests':guests,'selectedQuery':confirmed,'uiAvailableSlots':ui_times,
       'runtimeCapturedResponseCount':row['responsesCount'],'runtimeInventory':'NOT_EVALUATED_NO_CAPTURED_RESPONSE',
       'postRunComparison':{'status':'NOT_COVERED' if not post else 'NOT_COMPARABLE_SELECTION_UNCONFIRMED' if not confirmed else 'MATCH' if ui_times==post_times else 'SUPPORTED_SUBSET' if ui_times is not None and post_times is not None and set(ui_times).issubset(post_times) else 'MISMATCH',
                            'exactSlotSetEqual':ui_times == post_times if confirmed and post else None,
                            'everyRenderedSlotSupported':set(ui_times).issubset(post_times) if ui_times is not None and post_times is not None else None,
                            'postSlots':post_times,'rawPath':post['bodyPath'] if post else None}})
output={'mode':'INDEPENDENT_SAVED_SOURCE_ORACLE','networkRequests':0,'modelCalls':0,'count':len(rows),'confirmed':sum(r['selectedQuery'] for r in rows),'rows':rows}
(batch/'independent-oracle.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'count':len(rows),'confirmed':output['confirmed'],'postComparisons':{s:sum(r['postRunComparison']['status']==s for r in rows) for s in ['MATCH','SUPPORTED_SUBSET','MISMATCH','NOT_COVERED','NOT_COMPARABLE_SELECTION_UNCONFIRMED']}}))
