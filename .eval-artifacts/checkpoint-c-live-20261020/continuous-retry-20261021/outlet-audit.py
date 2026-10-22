"""Read saved quick-run sources only. Independent DOM/JSON parsing; no requests/models."""
import hashlib
import json
import pathlib
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urlparse, parse_qs, urljoin

class DOM(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.nodes, self.stack = [], []
        self.feed(html)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs); parent = self.stack[-1] if self.stack else None
        n = dict(tag=tag, a=a, parent=parent, text='')
        n['booking'] = bool(parent and parent['booking']) or 'p-booking-calendar' in (a.get('class') or '').split()
        n['hidden'] = bool(parent and parent['hidden']) or 'hidden' in a or a.get('aria-hidden') == 'true' or 'is-hidden' in (a.get('class') or '').split() or bool(re.search(r'display\s*:\s*none|visibility\s*:\s*hidden', a.get('style') or '', re.I))
        self.nodes.append(n)
        if tag not in ['input','br','hr','img','meta','link','source','wbr','area','embed','param','col','base']: self.stack.append(n)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i]['tag'] == tag:
                del self.stack[i:]; break
    def handle_data(self, text):
        for n in self.stack: n['text'] += text

def selected(n):
    a=n['a']
    return any(a.get(k)=='true' for k in ['aria-pressed','aria-selected','aria-checked']) or a.get('aria-current') in ['true','page','step','location','date','time'] or bool(set((a.get('class') or '').split()) & {'active','selected','current','checked','is-active','is-selected','is-current','is-checked'})

def people(n):
    while n and n['booking']:
        a=n['a']
        if set((a.get('class') or '').split()) & {'p-booking-calendar__people-button','p-booking-calendar__people-button-box'} or (a.get('aria-label') or '').lower() in ['guests','people','party size']: return True
        n=n['parent']
    return False

def state(html, date, party):
    active=[n for n in DOM(html).nodes if n['booking'] and not n['hidden'] and selected(n)]
    dates=['%04d-%02d-%02d' % tuple(int(n['a'][k]) for k in ['data-year','data-month','data-day']) for n in active if all(k in n['a'] and str(n['a'][k]).isdigit() for k in ['data-year','data-month','data-day'])]
    guests=[int(n['a'].get('data-value') or n['text'].strip()) for n in active if n['tag']=='button' and people(n) and str(n['a'].get('data-value') or n['text'].strip()).isdigit()]
    return dict(dates=dates, guests=guests, confirmed=bool(dates and guests) and all(d==date for d in dates) and all(p==party for p in guests))

def bound_slots(body, outlet, date, party, sanitized=False):
    d=body.get('base_date') or {}
    if [d.get(k) for k in ['year','month','day']] != list(map(int,date.split('-'))) or body.get('members') != party: return None
    selection=body.get('selection'); items=selection.values() if isinstance(selection,dict) else selection
    if not isinstance(selection,(dict,list)): return None
    result=[]
    for item in items:
        t=item.get('time')
        if not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d', t or ''): return None
        if sanitized: link=item.get('link') or {}; origin=link.get('origin'); path=link.get('pathname'); q={k:link.get(k) for k in ['rcd','member','visit_date','visit_time']}
        else:
            u=urlparse(urljoin('https://tabelog.com',item.get('url',''))); origin=u.scheme+'://'+u.netloc; path=u.path
            q={k:v[0] if len(v)==1 else None for k,v in parse_qs(u.query).items()}
        if origin!='https://tabelog.com' or path!='/en/booking/form_course/new' or any(q.get(k)!=v for k,v in dict(rcd=outlet, member=str(party), visit_date=date.replace('-',''), visit_time=t.replace(':','')).items()): return None
        result.append(t)
    return sorted(set(result))

directory=pathlib.Path(sys.argv[1]); output=pathlib.Path(__file__).resolve().parent; rows=[]
for run in sorted(directory.glob('c-*-attempt-*')):
    paths=list((run/'runner').glob('*.result.json'))
    if not paths: continue
    artifact=json.loads(paths[0].read_text()); semantic=artifact['materializedCase']['semantic']; date=semantic['date']['value']; party=semantic['party_size']
    candidates={c['restaurant']['id'].rsplit('/',1)[-1]:c['restaurant'] for c in artifact['finalSnapshot']['domainState']['candidates'] if c['restaurant']['id'].startswith('tabelog:')}
    observations={}
    for rp in (run/'recordings').glob('*/recording.json'):
        recording=json.loads(rp.read_text()); documents={d['snapshot']:d for d in recording.get('documents',[])}; ordinal=0
        for entry in recording['entries']:
            if entry['kind']!='SNAPSHOT': continue
            ordinal+=1; detail=entry['detail']; match=re.search(r'/(\d{8})/$',urlparse(detail.get('url','')).path)
            if not match: continue
            outlet=match[1]; doc=documents.get(ordinal); html=(rp.parent/doc['file']).read_text() if doc else ''.join(q['markup'] for q in detail.get('queryRegions',[]) if not q.get('ancestorMarkupHidden'))
            st=state(html,date,party); captured=[r for r in detail.get('responses',[]) if urlparse(r.get('url','')).path.rstrip('/')=='/en/booking/calendar/find_vacancy']
            # Full recording response facts contain sanitized source-link components, never reconstituted network responses.
            latest=max(captured,key=lambda r:r.get('sequence',0)) if captured else None
            body=latest.get('body',{}) if latest else {}
            parsed=bound_slots(body,outlet,date,party,True) if latest and latest.get('status')==200 and st['confirmed'] else None
            if parsed==[]: parsed=None  # Empty selection has no independently bound merchant link.
            observations.setdefault(outlet,[]).append(dict(sequence=entry['sequence'], selection=st, captured=bool(captured), base_date=body.get('base_date'), members=body.get('members'), parsedSlots=parsed, response=latest, rawRecording=str(rp), rawHtml=str(rp.parent/doc['file']) if doc else None))
    post_path=run/'post-run/post-check.json'; post=json.loads(post_path.read_text()) if post_path.exists() else {'rows':[]}
    for outlet in sorted(set(candidates)|set(observations)):
        obs=observations.get(outlet,[]); terminal=obs[-1] if obs else None
        bound=[o for o in obs if o['parsedSlots'] is not None]; confirmed=[o for o in obs if o['selection']['confirmed']]
        last=bound[-1] if bound else confirmed[-1] if confirmed else terminal
        p=next((p for p in post['rows'] if p.get('parameters',{}).get('rst_id')==outlet),None); post_slots=None; post_raw=None; post_valid=False
        if p and p.get('raw',{}).get('bodyPath'):
            post_raw=p['raw']; raw=pathlib.Path(post_raw['bodyPath']).read_bytes(); query=parse_qs(urlparse(post_raw['url']).query)
            post_valid=hashlib.sha256(raw).hexdigest()==post_raw['sha256'] and post_raw['method']=='GET' and post_raw['status']==200 and query==dict(rst_id=[outlet],svd=[date.replace('-','')],svps=[str(party)],svt=[semantic['time']['value'].replace(':','')])
            if post_valid: post_slots=bound_slots(json.loads(raw),outlet,date,party)
        runtime=last['parsedSlots'] if last else None
        compare='NOT_COVERED' if not p else 'NOT_COMPARABLE' if runtime is None or post_slots is None else 'EXACT_MATCH' if runtime==post_slots else 'SUPPORTED_SUBSET' if set(runtime)<=set(post_slots) else 'MISMATCH'
        rows.append(dict(runId=run.name, outletId=outlet, outletName=candidates.get(outlet,{}).get('outletName',outlet), requestedDate=date, requestedParty=party, selectedQueryConfirmed=last['selection']['confirmed'] if last else None, selectedQueryEverConfirmed=any(o['selection']['confirmed'] for o in obs), capturedFindVacancy=any(o['captured'] for o in obs), latest=last, lastObserved=terminal, representativeRule='Latest bound read, otherwise latest confirmed selection, otherwise terminal observation; all later observations retained separately.', observations=obs, postGet=post_raw, postGetValidated=post_valid, postGetSlots=post_slots, comparison=compare))
result=dict(mode='INDEPENDENT_SAVED_SOURCE_AUDIT',sourceRequests=0,modelCalls=0,outlets=len(rows),rows=rows,limits='Only existing outer independent GET coverage; no new requests. Missing coverage remains NOT_COVERED. Later GETs do not reconstruct runtime responses; observed DOM state is not computed CSS visibility.')
(output/'quick-outlet-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
lines=['# 快速验证逐家查询绑定与独立 GET 对照','','仅解析已保存材料，0新增网络/模型；未覆盖的 GET 保持 NOT_COVERED。每个快照与响应明细见 JSON。','','| 运行 | 门店 | 查位选中确认 | 捕获 find_vacancy | base_date / members | 解析时段 | 独立 GET 比较 |','| --- | --- | --- | --- | --- | --- | --- |']
for r in rows:
    x=r['latest'] or {}; lines.append('| '+ ' | '.join(str(v) for v in [r['runId'],r['outletName'],r['selectedQueryConfirmed'],r['capturedFindVacancy'],str(x.get('base_date'))+' / '+str(x.get('members')),x.get('parsedSlots'),r['comparison']])+' |')
(output/'quick-outlet-audit.md').write_text('\n'.join(lines)+'\n')
print(json.dumps(dict(outlets=len(rows),selected=sum(r['selectedQueryConfirmed'] is True for r in rows),captured=sum(r['capturedFindVacancy'] for r in rows))))
