from pathlib import Path
import hashlib,json,subprocess
r=Path('.eval-artifacts/phase3b/b1-g3-wiring/rebased-main')
f=json.loads((r/'freeze.json').read_text())
for row in f['files']:
    assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
subprocess.run(['git','merge-base','--is-ancestor',f['mainBase'],'HEAD'],check=True)
subprocess.run(['git','diff','--exit-code',f['mainBase'],'--','src/integrations/tabelog/tabelog-browser-availability.ts','src/integrations/tabelog/tabelog-query-controls.ts','src/integrations/tabelog/tabelog-vacancy-response.ts','src/eval','src/harness','src/web','docs/decisions','.eval-artifacts/phase3b/budget.json'],check=True)
subprocess.run(['git','diff','--exit-code',f['previousDelivery'],'--','src/application/run-bounded-model-gateway.ts','src/integrations/tabelog/tabelog-booking-handoff-reader.ts','src/integrations/restaurant-search/live-read-assembly.ts','.eval-artifacts/phase3b/b1-g3-wiring/implementation','.eval-artifacts/phase3b/b1-g3-wiring/input.json','.eval-artifacts/phase3b/b1-g3-wiring/probe.mjs','.eval-artifacts/phase3b/b1-g3-wiring/red.json','.eval-artifacts/phase3b/b1-g3-wiring/red.log'],check=True)
print(json.dumps({'status':'PASS','frozenInputs':len(f['files']),'mainBase':f['mainBase'],'protectedB_A_frontend_ADRs_budget':'UNCHANGED_FROM_MAIN','C_cache_scope_assembly_and_old_evidence':'UNCHANGED_FROM_PREVIOUS_DELIVERY','newProviderCalls':0,'envRead':False}))
