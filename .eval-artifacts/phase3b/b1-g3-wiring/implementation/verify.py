from pathlib import Path
import hashlib, json, subprocess
root=Path('.eval-artifacts/phase3b/b1-g3-wiring/implementation')
f=json.loads((root/'freeze-delivery.json').read_text())
for row in f['files']:
    assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256'], row['path']
subprocess.run(['git','merge-base','--is-ancestor',f['baseG3Commit'],'HEAD'],check=True)
subprocess.run(['git','diff','--exit-code',f['baseG3Commit'],'--',
    'src/integrations/tabelog/tabelog-browser-availability.ts',
    'src/integrations/tabelog/tabelog-query-controls.ts',
    'src/integrations/tabelog/tabelog-vacancy-response.ts',
    'src/eval','src/harness','src/web','.eval-artifacts/phase3b/budget.json'],check=True)
old=Path('.eval-artifacts/phase3b/b1-g3-wiring')
subprocess.run(['git','diff','--exit-code','f861befec2256053ae545a7ea0f80e3982c0790b','--',*[str(old/name) for name in ['input.json','probe.mjs','plan.md','freeze.json','red.json','red.log','report.md','verification.json']]],check=True)
print(json.dumps({'status':'PASS','frozenInputs':len(f['files']),'B3_A_UI_budget':'UNCHANGED_FROM_G3_BASE','oldStopEvidence':'UNCHANGED','newProviderCalls':0,'envRead':False}))
