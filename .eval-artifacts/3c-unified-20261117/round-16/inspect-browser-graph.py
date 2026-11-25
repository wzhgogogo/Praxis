"""Static browser import graph including type-only edges; no third-party packages."""
import hashlib,json,re,subprocess
from pathlib import Path
root=Path.cwd();folder=root/'src/web/browser';out=Path(__file__).parent
sources={p.stem:p.read_text() for p in sorted(folder.glob('*.ts'))}
graph={name:sorted(set(re.findall(r'^import\s.*?from\s+["\']\./([^"\']+)\.js["\']',source,re.M))) for name,source in sources.items()}
index=0;stack=[];indices={};low={};active=set();components=[]
def visit(node):
 global index
 indices[node]=low[node]=index;index+=1;stack.append(node);active.add(node)
 for neighbor in graph[node]:
  assert neighbor in graph,(node,neighbor)
  if neighbor not in indices:visit(neighbor);low[node]=min(low[node],low[neighbor])
  elif neighbor in active:low[node]=min(low[node],indices[neighbor])
 if low[node]==indices[node]:
  component=[]
  while True:
   item=stack.pop();active.remove(item);component.append(item)
   if item==node:break
  components.append(sorted(component))
for node in graph:
 if node not in indices:visit(node)
strict=json.loads((root/'tsconfig.web.json').read_text())['compilerOptions']['strict']
for name,source in sources.items():
 assert not re.search(r'\bany\b|@ts-(?:ignore|nocheck|expect-error)',source),name
 if name!='entry':assert 'entry' not in graph[name]
assert strict and all(len(c)==1 and c[0] not in graph[c[0]] for c in components),components
result={'sha':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'browserStrict':strict,'graph':graph,'stronglyConnectedComponents':components,'cycleCount':0,'sourceSHA256':{name:hashlib.sha256(source.encode()).hexdigest() for name,source in sources.items()},'notes':'Includes type-only imports. Request/renderer/navigation callbacks wired only by entry; no module imports entry.'}
(out/'browser-dependencies.json').write_text(json.dumps(result,indent=2)+'\n')
(out/'browser-dependencies.dot').write_text('digraph browser {\n'+''.join('  "'+a+'" -> "'+b+'";\n' for a,edges in graph.items() for b in edges)+'}\n')
print(json.dumps({'browserStrict':strict,'modules':len(graph),'cycles':0}))
