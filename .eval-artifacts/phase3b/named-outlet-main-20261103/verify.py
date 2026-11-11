from pathlib import Path
import hashlib,json,subprocess
r=Path(__file__).parent
f=json.loads((r/'freeze.json').read_text())
git=lambda *a:subprocess.check_output(['git',*a],text=True)
for item in f['files']:assert hashlib.sha256(Path(item['path']).read_bytes()).hexdigest()==item['sha256'],item['path']
assert not git('diff','--name-only',f['approved'],'--','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json').strip()
for source in [json.loads(git('show',f['approved']+':.eval-artifacts/phase3b/budget.json')),json.loads((r/'budget-A-5912dd11.snapshot.json').read_text())]:
 after=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text());rows={e['id']:e for e in after['entries']}
 assert len(rows)==len(after['entries'])
 for e in source['entries']:assert rows[e['id']]==e,e['id']
assert after['limits']==json.loads(git('show',f['approved']+':.eval-artifacts/phase3b/budget.json'))['limits']
for k in after['cumulative']:assert after['cumulative'][k]==sum(e.get('evaluationPublicGET',e.get('publicGET',0)) if k=='evaluationPublicGET' else e.get(k,0) for e in after['entries'])
print(json.dumps({'status':'PASS','frozenFiles':len(f['files']),'sourceEqualsApproved':f['approved'],'ledgerRows':len(rows),'cumulative':after['cumulative'],'realCalls':0,'envFileLoaded':False}))
