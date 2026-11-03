from pathlib import Path
import hashlib,json,subprocess
r=Path(__file__).parent
git=lambda *a:subprocess.check_output(['git',*a],text=True)
f=json.loads((r/'freeze.json').read_text())
for item in f['files']:assert hashlib.sha256(Path(item['path']).read_bytes()).hexdigest()==item['sha256'],item['path']
base=f['reviewedCandidate']
protected=['src/eval','src/harness','src/web','src/integrations/tabelog/tabelog-browser-availability.ts','src/integrations/tabelog/tabelog-query-controls.ts','src/integrations/tabelog/tabelog-vacancy-response.ts','src/integrations/restaurant-availability/outlet-identity.ts','src/domains/restaurant/contracts.ts','src/domains/restaurant/task-definition.ts','src/domains/restaurant/semantic-interpreter.ts','src/domains/restaurant/semantic-proposal.ts','src/integrations/restaurant-facts/booking-terms.ts']
assert not git('diff','--name-only',base,'--',*protected).strip()
changed=git('diff','--name-only',base,'--','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json').splitlines();assert sorted(changed)==f['changedSourcePaths']
manifest=json.loads((r/'frozen-input.json').read_text())
raw=subprocess.check_output(['git','show',manifest['sourceCommit']+':'+manifest['sourcePath']]);assert raw==(r/'d1-execution.result.original.json').read_bytes()
assert hashlib.sha256(raw).hexdigest()==manifest['sourceSha256']
old=json.loads(raw)['view']['restaurant']['candidates'][1]['restaurant']
place=json.loads(Path(manifest['moduleFixture']).read_text());assert place['displayName']['text']==old['outletName'] and place['formattedAddress']==old['address']
for key,target in [('id','googlePlaces'),('nationalPhoneNumber','phone'),('websiteUri','googleWebsiteUri'),('googleMapsUri','googleMapsUri')]:assert place[key]==old['sourceIds'][target]
assert place['location']=={'latitude':old['coordinates']['lat'],'longitude':old['coordinates']['lng']}
assert hashlib.sha256(Path(manifest['moduleFixture']).read_bytes()).hexdigest()==manifest['moduleSha256']
assert hashlib.sha256(Path('src/application/fixtures/named-outlet-without-area/d3-semantic.original.json').read_bytes()).hexdigest()==manifest['semanticOriginalSha256']
before=json.loads(git('show',base+':.eval-artifacts/phase3b/budget.json'));after=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text())
rows={e['id']:e for e in after['entries']};assert len(rows)==len(after['entries'])==len(before['entries'])+1
for e in before['entries']:assert rows[e['id']]==e
assert before['limits']==after['limits'] and before['cumulative']==after['cumulative']
for key in after['cumulative']:assert sum(e.get('evaluationPublicGET',e.get('publicGET',0)) if key=='evaluationPublicGET' else e.get(key,0) for e in after['entries'])==after['cumulative'][key]
assert not git('diff','--name-only',base,'--','.eval-artifacts/phase3b/named-outlet-without-area-20261103').strip()
print(json.dumps({'status':'PASS','frozenFiles':len(f['files']),'protectedPathsUnchanged':protected,'ledgerRows':len(rows),'D1OriginalAndD3LiteralRetained':True,'realCalls':0,'envFileLoaded':False}))
