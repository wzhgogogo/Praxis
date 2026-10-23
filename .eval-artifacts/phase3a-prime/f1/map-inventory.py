from pathlib import Path
import re,json
root=Path.cwd();out=root/'.eval-artifacts/phase3a-prime/f1';decls=[]
for path in sorted(root.glob('src/**/*.test.ts')):
 text=path.read_text();matches=list(re.finditer(r'(?<![\w.])(?P<kind>test|it|describe|currentTest|probeTest|t\.test|context\.test)\s*\(\s*([\'"`])',text))
 for i,m in enumerate(matches):
  q=m[2];pos=m.end();name=''
  while pos<len(text):
   if text[pos]=='\\' and pos+1<len(text):name+=text[pos:pos+2];pos+=2;continue
   if text[pos]==q:break
   name+=text[pos];pos+=1
  name=name.replace('\\"','"').replace("\\'", "'").replace('\\`','`')
  if '\n' in name:continue
  escaped='';last=0
  for hole in re.finditer(r'\$\{[^}]+\}',name):escaped+=re.escape(name[last:hole.start()])+'.+?';last=hole.end()
  pattern='^'+escaped+re.escape(name[last:])+'$';end=matches[i+1].start() if i+1<len(matches) else len(text)
  decls.append({'file':str(path.relative_to(root)),'kind':m['kind'],'line':text.count('\n',0,m.start())+1,'offset':m.start(),'nameExpression':name,'pattern':pattern,'bodyExcerpt':text[pos+1:end][:7000]})
compiled=[(d,re.compile(d['pattern'])) for d in decls]
def lookup(name,suite):return [d for d,p in compiled if bool(d['file'].startswith('src/harness/browser/'))==(suite=='browser') and p.fullmatch(name)]
rows=[]
for suite,log in [('default','npm-test-1.log'),('browser','browser-fixture-1.log')]:
 text=(root/'.eval-artifacts/phase3a-prime/main-check'/log).read_text();parents=[]
 for line in text.splitlines():
  m=re.match(r'^( *)▶ (.+)$',line)
  if m:
   indent=len(m[1]);name=m[2];options=lookup(name,suite);parents=[p for p in parents if p['indent']<indent];parents.append({'name':name,'indent':indent,'matches':options});continue
  m=re.match(r'^( *)✔ (.+?) \(([0-9.]+)ms\)\s*$',line)
  if not m:continue
  indent,name,elapsed=len(m[1]),m[2],float(m[3]);options=lookup(name,suite)
  if options and all(d['kind']=='describe' for d in options):continue
  if not options and name.startswith('src/') and name.endswith('.test.ts'):options=[{'file':name,'line':1,'offset':0,'nameExpression':name,'kind':'implicit-file'}]
  if not options:
   inherited=[p for p in parents if p['indent']<indent and p['matches']]
   if inherited:
    parent=inherited[-1];base=parent['matches'][0];options=[{**base,'nameExpression':name,'kind':'dynamic-subtest','parent':parent['name']}]
  rows.append({'suite':suite,'name':name,'parentNames':[p['name'] for p in parents if p['indent']<indent],'baselineMs':elapsed,'matches':[{k:d[k] for k in ['file','line','offset','nameExpression','kind']} for d in options]})
  parents=[p for p in parents if not(p['indent']==indent and p['name']==name)]
(out/'declarations.json').write_text(json.dumps(decls,indent=2,ensure_ascii=False)+'\n');(out/'baseline-name-map.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False)+'\n');issues=[r for r in rows if len(r['matches'])!=1];(out/'inventory-map-issues.json').write_text(json.dumps(issues,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'declarations':len(decls),'rows':len(rows),'default':sum(r['suite']=='default' for r in rows),'browser':sum(r['suite']=='browser' for r in rows),'issues':issues},ensure_ascii=False,indent=2))
