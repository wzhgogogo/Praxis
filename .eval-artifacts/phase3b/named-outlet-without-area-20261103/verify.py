from pathlib import Path
import hashlib,json,subprocess
r=Path(__file__).parent
git=lambda *a:subprocess.check_output(['git',*a],text=True)
frozen=json.loads((r/'freeze.json').read_text())
for f in frozen['files']:
    assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
base=frozen['baseMain']

def hunks(text):
    result={};path=None;active=False
    for line in text.splitlines():
        if line.startswith(('diff --git ','--- a/')):active=False
        elif line.startswith('+++ '):
            path=line[4:];path=path[2:] if path.startswith('b/') else path
            result[path]=[];active=False
        elif line.startswith('@@ '):active=True;result[path].append(line.split('@@')[1])
        elif active and line[:1] in {' ','+','-'}:result[path].append(line)
    return result

auth=json.loads((r/'authorizations.json').read_text())
owned=auth['A_sync']['files']
assert sorted(git('diff','--name-only',base,'--','src/eval','src/harness').splitlines())==sorted(owned)
assert hunks(git('diff','--no-ext-diff','--unified=3',base,'--',*owned))==hunks((r/'a-owned-sync-proposal.patch').read_text())
c=auth['C_expectations']['file']
assert hunks(git('diff','--no-ext-diff','--unified=3',base,'--',c))==hunks((r/'c-selection-expectation-proposal.patch').read_text())
protected=['src/web','src/integrations/tabelog/tabelog-browser-availability.ts',
 'src/integrations/tabelog/tabelog-query-controls.ts','src/integrations/tabelog/tabelog-vacancy-response.ts']
assert not git('diff','--name-only',base,'--',*protected).strip()
changed=git('diff','--name-only',base,'--','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json').splitlines()
assert sorted(changed)==frozen['changedSourcePaths']

manifest=json.loads((r/'frozen-input.json').read_text())
for f in manifest['files']:
    raw=(r/f['path']).read_bytes();assert len(raw)==f['bytes'] and hashlib.sha256(raw).hexdigest()==f['sha256']
raw=subprocess.check_output(['git','show',manifest['sourceGit']+':'+manifest['sourcePath']])
assert raw==(r/'d3-decisions.original.jsonl').read_bytes()
assert raw.splitlines(keepends=True)[0]==(r/'d3-decision-1.original.jsonl').read_bytes()
assert json.loads(raw.splitlines()[0])['outputText'].encode()==Path('src/application/fixtures/named-outlet-without-area/d3-semantic.original.json').read_bytes()

old=json.loads(git('show',base+':.eval-artifacts/phase3b/budget.json'))
a=json.loads((r/'budget-A-cc9562cd.snapshot.json').read_text())
budget=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text());rows={e['id']:e for e in budget['entries']}
assert len(rows)==len(budget['entries'])==627
for source in [old,a]:
    for e in source['entries']:assert rows[e['id']]==e,e['id']
assert budget['limits']==old['limits']
own=rows['phase3b-C-named-outlet-without-area-offline-20261103']
for k in ['fullLive','realModelCalls','environmentReruns','evaluationPublicGET','googleRequests','restaurantWebsiteRequests']:assert own[k]==0
for k in budget['cumulative']:
    total=sum(e.get('evaluationPublicGET',e.get('publicGET',0)) if k=='evaluationPublicGET' else e.get(k,0) for e in rows.values())
    assert total==budget['cumulative'][k],k
print(json.dumps({'status':'PASS','frozenFiles':len(frozen['files']),'originalD3BytesRetained':True,
 'approvedASyncFiles':len(owned),'approvedCExpectationControls':2,'protectedPathsUnchanged':protected,'ledgerRows':len(rows),'realCalls':0}))
