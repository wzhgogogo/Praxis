from pathlib import Path
import json,hashlib,subprocess
r=Path('.eval-artifacts/phase3b/g4-japanese-wiring/source-provider-fix');base='20e3588cf360ae647fc619f006ea0c7121debf6d'
f=json.loads((r/'freeze.json').read_text())
for row in f['files']:assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
source='src/integrations/restaurant-availability/availability-source-resolver.ts'
old=subprocess.check_output(['git','show',base+':'+source],text=True);new=Path(source).read_text()
needle='                ...structuredClone(check),\n                sourceAttempts: attempts'
assert old.count(needle)==1
assert new==old.replace(needle,'                ...structuredClone(check),\n                sourceProvider: provider.provider,\n                sourceAttempts: attempts')
changed=set(subprocess.check_output(['git','diff','--name-only',base,'--','src'],text=True).splitlines())
assert changed=={source,'src/integrations/restaurant-availability/availability-source-resolver.test.ts','src/server/local-web-server.test.ts'},changed
single=subprocess.check_output(['git','diff-tree','--no-commit-id','--name-only','-r',f['singleLineCommit']],text=True).splitlines();assert single==[source]
assert subprocess.check_output(['git','show','--format=','--numstat',f['singleLineCommit']],text=True).split()==['1','0',source]
subprocess.run(['git','diff','--exit-code',base,'--','.eval-artifacts/phase3b/budget.json','src/domains','src/core','src/web','src/harness','src/eval','src/integrations/tabelog','src/integrations/tablecheck','src/infrastructure/browser','web-skills','scripts','package.json','package-lock.json','docs/decisions'],check=True)
# All old reports, requests, raw execution and frozen configuration remain immutable.
files=subprocess.check_output(['git','ls-tree','-r','--name-only',base,'.eval-artifacts/phase3b/g4-japanese-wiring'],text=True).splitlines()
for path in files:assert hashlib.sha256(subprocess.check_output(['git','show',base+':'+path])).hexdigest()==hashlib.sha256(Path(path).read_bytes()).hexdigest(),path
print(json.dumps({'status':'PASS','frozenInputs':len(f['files']),'productionDelta':'ONE_SOURCE_PROVIDER_ASSIGNMENT','singleLineCommit':f['singleLineCommit'],'previousArtifactsPreserved':len(files),'budgetUnchanged':True,'realCalls':0,'envRead':False}))
