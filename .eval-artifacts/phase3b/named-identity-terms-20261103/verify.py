from pathlib import Path
import difflib,hashlib,json,subprocess
r=Path(__file__).parent
f=json.loads((r/'freeze.json').read_text())
git=lambda *a:subprocess.check_output(['git',*a])
sha=lambda b:hashlib.sha256(b).hexdigest()
for item in f['files']:assert sha(Path(item['path']).read_bytes())==item['sha256'],item['path']
assert not git('diff','--name-only',f['baseMain'],'--','src/eval','src/harness','src/server','src/web',
    'src/integrations/tabelog/tabelog-query-controls.ts','src/integrations/tabelog/tabelog-vacancy-response.ts',
    'src/integrations/restaurant-availability/outlet-identity.ts','src/integrations/restaurant-facts/model-page-question.ts',
    'src/domains/restaurant/contracts.ts','src/domains/restaurant/task-definition.ts',
    'src/domains/restaurant/semantic-proposal.ts','src/domains/restaurant/semantic-interpreter.ts',
    'package.json','package-lock.json','scripts').strip(),'Protected source changed'
providerCommit='9008f7bbde3e819f84931294b5667526e605a551'
providerPaths=['src/integrations/tabelog/tabelog-browser-availability.ts','src/integrations/tablecheck/tablecheck-browser-availability.ts']
assert set(git('diff-tree','--no-commit-id','--name-only','-r',providerCommit).decode().splitlines())==set(providerPaths)
for source,patch in zip(providerPaths,['tabelog','tablecheck']):
    before=git('show',f['baseMain']+':'+source).decode().splitlines(keepends=True)
    current=Path(source).read_text().splitlines(keepends=True)
    assert Path(source).read_bytes()==git('show',providerCommit+':'+source),'Provider changed beyond approved patch'
    actual=''.join(difflib.unified_diff(before,current,fromfile='a/'+source,tofile='b/'+source))
    assert actual==(r/(patch+'-identity-only-proposal.patch')).read_text(),'Approved patch mismatch'
source=json.loads((r/'inputs.json').read_text())
for item in source['files']:
    saved=(r/item['saved']).read_bytes();assert sha(saved)==item['sha256'],item['saved']
    assert saved==git('show',source['sourceCommit']+':'+item['source']),item['source']
fixtures=Path('src/application/fixtures/named-identity-terms')
for run,folder in [('D2',fixtures/'d2'),('D3',fixtures)]:
    decisions={x['sequence']:x['outputText'].encode() for x in map(json.loads,(r/f'raw/runs/{run}/{run}/execution.decisions.jsonl').read_text().splitlines())}
    for file in folder.glob('decision-*.original.json'):
        sequence=int(file.name.split('-')[1].split('.')[0]);assert file.read_bytes()==decisions[sequence],str(file)
for ordinal in [23,24]:
    page=json.loads((fixtures/f'page-{ordinal}.json').read_text())
    raw=r/next(item['saved'] for item in source['files'] if item['saved'].endswith(f'snapshot-00{ordinal}.html'))
    assert page['html'].encode()==raw.read_bytes(),'Original DOM changed'
base=json.loads(git('show',f['baseMain']+':.eval-artifacts/phase3b/budget.json'))
after=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text());rows={e['id']:e for e in after['entries']}
assert len(rows)==len(after['entries'])==len(base['entries'])+1
for entry in base['entries']:assert rows[entry['id']]==entry,entry['id']
assert after['limits']==base['limits'] and after['cumulative']==base['cumulative']
added=rows['phase3b-C-named-identity-terms-offline-20261103']
for field in ['fullLive','realModelCalls','environmentReruns','evaluationPublicGET','googleRequests','restaurantWebsiteRequests']:
    assert not added.get(field,0),field
print(json.dumps({'status':'PASS','frozenFiles':len(f['files']),'rawOriginals':len(source['files']),
    'providerPatchCommit':providerCommit,'otherProtectedFiles':'UNCHANGED','ledgerRows':len(rows),
    'cumulative':after['cumulative'],'versionChanges':False,'realCalls':0,'envFileLoaded':False}))
