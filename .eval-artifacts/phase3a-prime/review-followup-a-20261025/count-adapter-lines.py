from pathlib import Path
import subprocess,json,hashlib

def git(*args): return subprocess.check_output(['git',*args])
rows=[]
for ref in ['025940c5','main']:
 paths=git('ls-tree','-r','--name-only',ref,'src/integrations/tabelog','src/integrations/tablecheck','src/integrations/restaurant-search/source-packs.ts','web-skills/tabelog','web-skills/tablecheck').decode().splitlines()
 entries=[]
 for path in paths:
  if path.startswith(('src/integrations/tabelog/','src/integrations/tablecheck/')) and path.endswith('.ts') and not path.endswith('.test.ts'): scope='adapter-source'
  elif path=='src/integrations/restaurant-search/source-packs.ts': scope='site-pack-source'
  elif path.startswith('web-skills/'): scope='site-skill-document'
  else: continue
  raw=git('show',f'{ref}:{path}');lines=raw.decode().splitlines()
  entries.append({'path':path,'scope':scope,'physical':len(lines),'nonblank':sum(bool(s.strip()) for s in lines),'sha256':hashlib.sha256(raw).hexdigest()})
 totals={label:sum(e['physical'] for e in entries if e['scope'] in scopes) for label,scopes in [('adapter-source',['adapter-source']),('adapter-plus-site-pack',['adapter-source','site-pack-source']),('adapter-plus-site-pack-and-skills',['adapter-source','site-pack-source','site-skill-document'])]}
 rows.append({'ref':ref,'commit':git('rev-parse',ref).decode().strip(),'files':entries,'totals':totals})
result={'mode':'OFFLINE_GIT_SOURCE_COUNT','rule':'UTF-8 physical splitlines including comments/blank lines; non-test production TypeScript in two provider directories; source-packs.ts shown separately and added; site Skill markdown separately. No tests or fixtures.','historicalReference':'.eval-artifacts/phase2c-location-semantic-20261023/source-line-comparison.json','snapshots':rows}
out=Path(__file__).resolve().parent
(out/'adapter-lines.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps([{'ref':r['ref'],'totals':r['totals']} for r in rows],indent=2))
