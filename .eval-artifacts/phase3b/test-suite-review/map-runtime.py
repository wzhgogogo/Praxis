from pathlib import Path
import json,re,collections
root=Path('.eval-artifacts/phase3b/test-suite-review');prefix=str(Path.cwd())+'/'
cards=json.loads((root/'static-cards.json').read_text());by=collections.defaultdict(list)
for card in cards:by[card['file']].append(card)
rows=[];unbound=[];stacks=collections.defaultdict(dict)
for cohort in ['default','chromium']:
 for event in map(json.loads,(root/(cohort+'-runtime.jsonl')).read_text().splitlines()):
  data=event['data'];file=data.get('file','').removeprefix(prefix)
  if event['event']=='test:start':
   level=data['nesting'];stack=stacks[file]
   parent=stack.get(level-1)
   candidates=[card for card in by[file] if (card.get('parentId') or None)==parent and re.fullmatch(card['titlePattern'],data['name'])]
   if len(candidates)>1:
    exact=[c for c in candidates if c['title']==data['name']]
    if len(exact)==1:candidates=exact
    else:
     weight=lambda c:len(c['titlePattern'].replace('.*?','').replace('.*',''))
     strongest=max(map(weight,candidates));candidates=[c for c in candidates if weight(c)==strongest]
   if len(candidates)==1:
    stack[level]=candidates[0]['id']
   else:
    stack[level]=None
    unbound.append({'file':file,'name':data['name'],'level':level,'parent':parent,'candidates':[c['id'] for c in candidates]})
   for key in list(stack):
    if key>level:del stack[key]
  elif event['event'] in ['test:pass','test:fail']:
   source=stacks[file].get(data['nesting'])
   rows.append({'id':cohort+':'+str(len(rows)+1),'cohort':cohort,'name':data['name'],'file':file,'declarationId':source,'nesting':data['nesting'],'testType':data['details']['type'],'durationMs':data['details']['duration_ms'],'result':event['event'].removeprefix('test:')})
(root/'runtime-map.json').write_text(json.dumps({'rows':rows,'unbound':unbound},indent=2)+'\n')
print(json.dumps({'runtimeRows':len(rows),'byCohort':dict(collections.Counter(r['cohort'] for r in rows)),'testTypes':dict(collections.Counter(r['testType'] for r in rows)),'unbound':len(unbound)},indent=2))
for row in unbound:print(row)
