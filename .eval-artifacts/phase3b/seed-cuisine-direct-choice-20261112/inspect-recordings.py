"""Offline DOM audit of exposed D02-V recordings; never navigates or evaluates page scripts.
DOM class/id markers below locate evidence only. This is not product logic or a browser replay.
"""
from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re
OUT=Path(__file__).parent
ROOTS={
 'r1':Path('/private/tmp/praxis-seed-post-fix-evidence-03/.eval-artifacts/phase3b/seed-d02v-r4-pathfix-20261112/D02V-r1/runtime/dev-d02v-paging-r1'),
 'r2':Path('/private/tmp/praxis-seed-post-fix-evidence-04/.eval-artifacts/phase3b/seed-d02v-final-r2-20261112/D02V-r2/runtime/dev-d02v-paging-r2')}
class Node:
 def __init__(self,tag='',attrs=(),parent=None,pos=None):
  self.tag=tag;self.attrs=dict(attrs);self.parent=parent;self.children=[];self.pos=pos
 def text(self):return ''.join(x.text() if isinstance(x,Node) else x for x in self.children)
 def walk(self):
  yield self
  for child in self.children:
   if isinstance(child,Node):yield from child.walk()
class DOM(HTMLParser):
 def __init__(self,s):
  super().__init__(convert_charrefs=True);self.root=Node();self.current=self.root;self.feed(s)
 def handle_starttag(self,tag,attrs):
  n=Node(tag,attrs,self.current,self.getpos());self.current.children.append(n)
  if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:self.current=n
 def handle_endtag(self,tag):
  p=self.current
  while p.parent:
   if p.tag==tag:self.current=p.parent;break
   p=p.parent
 def handle_data(self,data):self.current.children.append(data)
def clean(s):return re.sub(r'\s+',' ',s).strip()
def identity(p):
 data=p.read_bytes();return {'file':str(p),'sha256':hashlib.sha256(data).hexdigest()}
def projection(p):
 s=p.read_text();dom=DOM(s);nodes=list(dom.root.walk())
 panels=[x for x in nodes if x.attrs.get('id')=='js-leftnavi-genre-scroll']
 # Entire recorded selection subtree, not just rendered model targets.
 people=[x for x in nodes if 'p-booking-calendar__people-button-box' in x.attrs.get('class','').split()]
 return {**identity(p),
 'title':[clean(x.text()) for x in nodes if x.tag=='title'],
 'headings':[{'text':clean(x.text()),'position':x.pos} for x in nodes if x.tag in ['h1','h2']][:6],
 'categoryPanels':[{'position':panel.pos,'links':[{'label':clean(x.text()),'href':x.attrs.get('href'),'position':x.pos} for x in panel.walk() if x.tag=='a']} for panel in panels],
 'textInputs':[{'attrs':x.attrs,'position':x.pos} for x in nodes if x.tag in ['textarea','input'] and x.attrs.get('type','text') not in ['hidden','submit','checkbox','radio','button']],
 'forms':[{'attrs':x.attrs,'position':x.pos,'fields':[{'tag':c.tag,'name':c.attrs.get('name'),'type':c.attrs.get('type')} for c in x.walk() if c.tag in ['input','select','textarea']]} for x in nodes if x.tag=='form'],
 'peopleGroups':[{'position':x.pos,'values':[c.attrs.get('data-value') for c in x.walk() if c.tag=='button'],'buttons':[{'text':clean(c.text()),'attrs':c.attrs,'position':c.pos} for c in x.walk() if c.tag=='button']} for x in people],
 'criterionOccurrences':[{'position':x.pos,'tag':x.tag,'text':clean(x.text())[:300]} for x in nodes if x.tag in ['h1','h2','h3','a','input','option'] and 'robatayaki' in (x.text()+' '+str(x.attrs)).lower()]}
result={}
for run,root in ROOTS.items():
 recording=next((root/'recordings').iterdir())
 selected=[4,5,14,15,16,17] if run=='r1' else [4,5,15,16,17,18]
 rows=[json.loads(x) for x in (root/'execution.decisions.jsonl').read_text().splitlines()]
 result[run]={'snapshots':[projection(recording/f'snapshot-{i:04d}.html') for i in selected],
 'decisions':[{'sequence':r['sequence'],'browser':r.get('browser'),'outputText':r.get('outputText')} for r in rows if r['purpose']=='browser_read_decide' and r['sequence']<=15]}
# Independent evidence assertions, not tests for the requested unimplemented product changes.
for run in result.values():
 for shot in run['snapshots'][:2]:
  assert shot['textInputs']==[]
  assert all(not re.search('robatayaki',l['label'],re.I) for panel in shot['categoryPanels'] for l in panel['links'])
assert result['r1']['snapshots'][2]['peopleGroups'][0]['values']==['1','2','3','4','5','6']
assert result['r1']['snapshots'][3]['peopleGroups'][0]['values']==['2','3','4','5','6','7']
assert result['r1']['snapshots'][4]['peopleGroups'][0]['values']==['3','4','5','6','7','8']
assert result['r2']['snapshots'][4]['peopleGroups'][0]['values']==['1','2','3','4','5','6']
assert result['r2']['snapshots'][5]['peopleGroups'][0]['values']==['2','3','4','5','6','7']
(OUT/'recording-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('PASS: recorded DOM is windowed; initial group has no target 8; no text retrieval input or exact criterion category link in retained directory DOM. No network/model calls.')
