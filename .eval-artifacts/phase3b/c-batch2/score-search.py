"""Independent posthoc oracle: source ItemList + visible named heading link, no private selectors."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlparse
import collections,datetime,hashlib,json,re

root=Path('.eval-artifacts/phase3b/c-batch2')
def load(p):return json.loads(Path(p).read_text())
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def outlet_id(value):
    try:
        u=urlparse(value)
        if u.scheme!='https' or u.hostname!='tabelog.com':return None
        m=re.fullmatch(r'/(?:en/)?tokyo/A\d+/A\d+/(\d+)/?',u.path)
        return m[1] if m else None
    except (TypeError,ValueError):return None
class VisibleLinks(HTMLParser):
    def __init__(self):super().__init__(convert_charrefs=True);self.stack=[];self.hidden=0;self.links=[];self.text=[];self.anchor=None
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag in ('script','style'):self.hidden+=1
        if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'):self.stack.append(tag)
        if tag=='a':self.anchor={'href':d.get('href',''),'text':'','heading':any(t in ('h2','h3') for t in self.stack),'aside':any(t in ('aside','nav','footer') for t in self.stack)}
    def handle_endtag(self,tag):
        if tag=='a' and self.anchor:self.links.append(self.anchor);self.anchor=None
        if tag in ('script','style'):self.hidden=max(0,self.hidden-1)
        if tag in self.stack:self.stack=self.stack[:len(self.stack)-1-self.stack[::-1].index(tag)]
    def handle_data(self,data):
        if self.hidden:return
        self.text.append(data)
        if self.anchor:self.anchor['text']+=data
def walk(value):
    if isinstance(value,dict):
        yield value
        for child in value.values():yield from walk(child)
    elif isinstance(value,list):
        for child in value:yield from walk(child)
def inspect(body,url,query):
    parser=VisibleLinks();parser.feed(body)
    headings=[{'url':urljoin(url,a['href']),'label':re.sub(r'\s+',' ',a['text']).strip()} for a in parser.links if a['heading'] and not a['aside'] and a['text'].strip() and outlet_id(urljoin(url,a['href']))]
    structured=[];schema_ok=False;empty_item_list=False
    for m in re.finditer(r'<script\b[^>]*\btype=["\']application/ld\+json["\'][^>]*>([\s\S]*?)</script>',body,re.I):
        try:data=json.loads(m[1])
        except json.JSONDecodeError:continue
        for item in walk(data):
            types=item.get('@type',[]);types=[types] if isinstance(types,str) else types
            if 'ItemList' not in types:continue
            items=item.get('itemListElement');schema_ok=isinstance(items,list)
            empty_item_list=empty_item_list or items is None
            if not schema_ok:continue
            for row in items:
                if not isinstance(row,dict):schema_ok=False;continue
                value=row.get('url')
                if not isinstance(value,str) or not outlet_id(value):schema_ok=False;continue
                structured.append(value)
    visible=' '.join(parser.text);normalized=lambda s:re.sub(r'\s+',' ',s).strip()
    query_visible=normalized(query) in normalized(visible)
    observed={outlet_id(a['url']) for a in headings};ids={outlet_id(u) for u in structured}
    explicit_empty=bool(re.search(r'No restaurants match|該当するお店が見つかりません',visible,re.I))
    schema_ok=(schema_ok and observed==ids) or (empty_item_list and explicit_empty and not observed and not ids)
    return {'queryVisible':query_visible,'structureVerified':schema_ok,'structuredUrls':structured,'headingLinks':headings,
            'ids':sorted(ids),'explicitEmpty':explicit_empty}

def main():
    execution=load(root/'search/execution.json');gold={r['id']:r for r in load(root/'gold.certified.json')['rows']}
    subjects={r['id']:r for r in load(root/'subjects.json')['subjects']};rows=[]
    for item in execution['results']:
        identity=item['subjectId'];entry={'id':identity,'variant':item['variant'],'cohort':item['cohort'],'query':item.get('query'),
          'expectedId':gold[identity]['rstId'],'ledgerId':item.get('ledgerId'),'httpStatus':item.get('httpStatus')}
        if item['status'].startswith('SKIPPED'):entry.update(status=item['status'])
        elif item.get('failure') or item.get('httpStatus')!=200:entry.update(status='NOT_EVALUATED_SOURCE_FAILURE',failure=item.get('failure'))
        else:
            assert sha(item['bodyPath'])==item['sha256']
            evidence=inspect(Path(item['bodyPath']).read_text(),load(Path(item['bodyPath']).with_name(Path(item['bodyPath']).name.replace('.body.html','.started.json')))['url'],item['query'])
            entry.update(evidence=evidence,bodyPath=item['bodyPath'],bodySha256=item['sha256'],elapsedMs=item['elapsedMs'])
            if not evidence['queryVisible'] or not evidence['structureVerified']:entry.update(status='UNKNOWN_STRUCTURE_CHANGED',alert='Source search structure or query binding changed; no silent miss')
            else:entry.update(status='HIT' if entry['expectedId'] in evidence['ids'] else 'MISS_IN_THIS_FIRST_PAGE')
        rows.append(entry)
    seen={(r['id'],r['variant']) for r in rows}
    for planned in load(root/'queries.materialized.json')['queries']:
        key=(planned['subjectId'],planned['variant'])
        if key in seen:continue
        rows.append({'id':planned['subjectId'],'cohort':planned['cohort'],'variant':planned['variant'],'query':planned.get('query'),
                     'expectedId':gold[planned['subjectId']]['rstId'],
                     'status':planned['status'] if planned.get('status','').startswith('SKIPPED') else 'NOT_REACHED_AFTER_SOURCE_STOP'})
    paired=[]
    for identity,subject in subjects.items():
        r=[x for x in rows if x['id']==identity]
        if subject['cohort']=='NEW_PRIMARY':
            original=next((x for x in r if x['variant']=='ORIGINAL'),None);alternate=next((x for x in r if x['variant']!='ORIGINAL'),None)
            paired.append({'id':identity,'historicalAnchor':subject['historicalAnchor'],'name':subject['subject']['name'],
                'original':original['status'] if original else 'NOT_REACHED','alternate':alternate['status'] if alternate else 'NOT_REACHED'})
    def counter(group):return dict(collections.Counter(r['status'] for r in group))
    result={'schema':'phase3b-g4-independent-retrieval-evaluation@2','evaluatedAtCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat(timespec='seconds'),
      'executionSha256':sha(root/'search/execution.json'),'goldSha256':sha(root/'gold.certified.json'),
      'mode':'EVALUATION_PUBLIC_GET_ONLY_NO_LIVE','newRealCalls':0,'executionStatus':execution['status'],'sourceRequests':execution['sourceRequests'],
      'primaryPaired':paired,'primaryCounts':counter([r for r in rows if r['cohort']=='NEW_PRIMARY']),
      'secondaryHistoricalCounts':counter([r for r in rows if r['cohort']!='NEW_PRIMARY']),'rows':rows,
      'revision':'Original evaluation.json@1 retained. Sidecar@2 recognizes the source explicit No restaurants match message plus an empty ItemList without itemListElement; this is not a new request, Gold change or source hit.',
      'limits':'First returned public page only. Hit is independent certified ID in both source ItemList and visible named headings, with query visible. No identity acceptance, opening-status, availability or general-population success claim. Historical15 are not contemporary paired controls.'}
    (root/'search/evaluation.v2.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ['executionStatus','sourceRequests','primaryPaired','secondaryHistoricalCounts']},ensure_ascii=False))
if __name__=='__main__':
    import sys
    if '--self-test' in sys.argv:
        empty='<p>No restaurants match "keyword".</p><script type="application/ld+json">{"@type":"ItemList"}</script>'
        assert inspect(empty,'https://tabelog.com/en/tokyo/rstLst/?sw=keyword','keyword')['structureVerified']
        broken='<p>keyword</p><script type="application/ld+json">{"@type":"ItemList","itemListElement":[{"url":"https://tabelog.com/en/tokyo/A1/A2/11111111/"}]}</script><h3><a href="/en/tokyo/A1/A2/22222222/">Other store</a></h3>'
        assert not inspect(broken,'https://tabelog.com/en/tokyo/rstLst/?sw=keyword','keyword')['structureVerified']
        assert not inspect(empty,'https://tabelog.com/en/tokyo/rstLst/?sw=keyword','unseen')['queryVisible']
        print('PASS explicit empty, structured/visible mismatch and query-binding controls;0 real calls')
    else:main()
