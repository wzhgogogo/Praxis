from pathlib import Path
import hashlib,json,subprocess
r=Path(__file__).parent
f=json.loads((r/'freeze.json').read_text());git=lambda *a:subprocess.check_output(['git',*a],text=True)
for item in f['files']:assert hashlib.sha256(Path(item['path']).read_bytes()).hexdigest()==item['sha256'],item['path']
protected=['src/eval','src/harness','src/web','src/server','src/integrations/tabelog/tabelog-browser-availability.ts','src/integrations/tabelog/tabelog-query-controls.ts','src/integrations/tabelog/tabelog-vacancy-response.ts','src/integrations/restaurant-availability/outlet-identity.ts','src/domains/restaurant/contracts.ts','src/domains/restaurant/task-definition.ts','src/domains/restaurant/intent-state.ts','src/domains/restaurant/semantic-proposal.ts','src/domains/restaurant/semantic-interpreter.ts','src/domains/restaurant/agent-context.ts','src/domains/restaurant/agent-action.ts','src/integrations/restaurant-facts/native-source-facts.ts','src/integrations/restaurant-facts/page-question-reader.ts']
assert not git('diff','--name-only',f['baseMain'],'--',*protected).strip()
manifest=json.loads((r/'frozen-input.json').read_text())
for item in manifest['files']:
 original=subprocess.check_output(['git','show',manifest['sourceCommit']+':'+item['sourcePath']]);saved=(r/item['saved']).read_bytes();assert original==saved and hashlib.sha256(saved).hexdigest()==item['sha256']
responses=[json.loads(l) for l in (r/'runs--D6--execution.decisions.jsonl.original').read_bytes().splitlines()]
module=Path('src/application/fixtures/named-outlet-continuity');m=json.loads((module/'manifest.json').read_text())
for item in m['responses']:
 b=(module/item['file']).read_bytes();assert b==responses[item['decision']-1]['outputText'].encode() and hashlib.sha256(b).hexdigest()==item['sha256']
before=json.loads(git('show',f['baseMain']+':.eval-artifacts/phase3b/budget.json'));after=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text());rows={e['id']:e for e in after['entries']};assert len(rows)==len(after['entries'])==len(before['entries'])+1
for e in before['entries']:assert rows[e['id']]==e
assert before['limits']==after['limits'] and before['cumulative']==after['cumulative']
for key in after['cumulative']:assert after['cumulative'][key]==sum(e.get('evaluationPublicGET',e.get('publicGET',0)) if key=='evaluationPublicGET' else e.get(key,0) for e in rows.values())
changed=git('diff','--name-only',f['baseMain'],'--','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json').splitlines();assert sorted(changed)==f['changedSourcePaths']
print(json.dumps({'status':'PASS','frozenFiles':len(f['files']),'protectedPathsUnchanged':protected,'rawD6Files':len(manifest['files']),'rawResponses':len(m['responses']),'ledgerRows':len(rows),'versions':'State25 / TaskDefinition23 unchanged','realCalls':0,'envFileLoaded':False}))
