"""Offline diagnosis only. No product parser or network; literal saved request/decision extraction."""
import hashlib,json,pathlib,re,subprocess
from html.parser import HTMLParser
P=pathlib.Path(__file__).resolve().parent
ROOT=pathlib.Path.cwd()
def load(p):return json.loads(p.read_text())
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[];self.current=None
    def handle_starttag(self,tag,attrs):
        if tag=='a':self.current=[dict(attrs).get('href',''),'']
    def handle_data(self,text):
        if self.current:self.current[1]+=text
    def handle_endtag(self,tag):
        if tag=='a' and self.current:
            self.links.append({'href':self.current[0],'label':' '.join(self.current[1].split())});self.current=None
for name in ['inputs.json','initial-provenance.json','breadcrumb-provenance.json']:
    for row in load(P/name):assert digest(ROOT/row['savedAs'])==row['sha256'],row['savedAs']
rows=[]
for run in ['D1','D4-first','D4-supplement','D4-latest']:
    folder=P/'raw'/run
    decisions=[json.loads(l) for l in (folder/'execution.decisions.jsonl').read_text().splitlines()]
    def context(d):return json.loads(next(m['content'] for m in d['messages'] if m['role']=='user'))
    # Use the model's full context, never the shortened recording diagnostic.
    d=next(d for d in decisions if d['purpose']=='browser_read_decide' and json.loads(d['outputText']).get('action')=='OPEN_LINK' and context(d)['observation']['url']=='https://tabelog.com/en/tokyo/')
    u=context(d);action=json.loads(d['outputText']);obs=u['observation'];targets=obs['targets'];chosen=next(t for t in targets if t['ref']==action['targetRef'])
    regions=[t for t in targets if re.fullmatch(r'https://tabelog.com/en/tokyo/A\d+/',t.get('href',''))]
    assert not any(re.search('akabane|赤羽',json.dumps(t,ensure_ascii=False),re.I) for t in targets)
    assert not re.search('akabane|赤羽',(folder/'initial-diagnostic.html').read_text(),re.I)
    correction=next(d for d in decisions if json.loads(d['outputText']).get('action')=='SELECT_REGION_ENTRANCE')
    cu=context(correction);ca=json.loads(correction['outputText']);cr=cu['regionCorrection'];selected=next(t for t in cr['entrances'] if t['ref']==ca['targetRef'])
    assert not any(re.search('akabane|赤羽',t['label'],re.I) for t in cr['entrances'])
    google=load(folder/'google-entries.json');requests=[];named=[]
    for entry in google:
        body=json.loads(entry['request'].get('postData',{}).get('text','{}'))
        response=json.loads(entry['response']['content']['text'])
        short={'url':entry['request']['url'],'method':entry['request']['method'],'status':entry['response']['status'],'request':{k:v for k,v in body.items() if k!='pageToken'},'pagination':bool(body.get('pageToken')),'placeCount':len(response.get('places',[])),'responseKeys':list(response)}
        if body.get('textQuery')=='kushikatsu Akabane':requests.append(short)
        elif body.get('textQuery')=='Akabane':named.append(short)
    assert requests and requests[0]['status']==200
    breadcrumbs=[]
    if (folder/'later-outlet-diagnostic.html').exists():
        links=Links();links.feed((folder/'later-outlet-diagnostic.html').read_text())
        breadcrumbs=[l for l in links.links if l['label'] in ['Sugamo','Akabane'] and '/A1323/' in l['href']]
        assert any(l['label']=='Akabane' and l['href']=='https://tabelog.com/en/tokyo/A1323/A132305/' for l in breadcrumbs)
    rows.append({'run':run,'firstDecision':{'sequence':d['sequence'],'purpose':d['purpose'],'source':u['source'],'stage':u['stage'],'goal':u['goal'],'observationUrl':obs['url'],'targetsCount':len(targets),'regions':regions,'locationInputs':[t for t in targets if t['kind']=='INPUT'],'action':action,'chosen':chosen},'correction':{'sequence':correction['sequence'],'entrances':cr['entrances'],'action':ca,'chosen':selected,'samples':cr['samples'],'remainingBudget':cr['remainingBudget']},'google':{'namedLocation':named,'discovery':requests,'rawPlaceCount':sum(r['placeCount'] for r in requests),'firstRequestSha256':hashlib.sha256(json.dumps(requests[0]['request'],sort_keys=True).encode()).hexdigest()},'laterBreadcrumbs':breadcrumbs})
assert len({r['google']['firstRequestSha256'] for r in rows})==1
assert [r['google']['rawPlaceCount'] for r in rows]==[25,25,25,0]
out={'mode':'EXPOSED_DEVELOPMENT_SAVED_RECORD_DIAGNOSIS','externalCalls':0,'rows':rows,'limitations':['No observation of the Sugamo parent menu in these runs; later outlet breadcrumbs establish public hierarchy only.','No root observed Akabane target or LOCATION input; no region routing change made.','Last Google capture has HTTP200 empty object, no places; reason beyond captured response is unknown.','This is not a new Live run or rescoring of any historical G6 result.']}
(P/'analysis.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'runs':[{'run':r['run'],'targets':r['firstDecision']['targetsCount'],'regionLinks':len(r['firstDecision']['regions']),'first':r['firstDecision']['chosen']['label'],'correction':r['correction']['chosen']['label'],'googleRawPlaces':r['google']['rawPlaceCount']} for r in rows],'requests':0},ensure_ascii=False))
