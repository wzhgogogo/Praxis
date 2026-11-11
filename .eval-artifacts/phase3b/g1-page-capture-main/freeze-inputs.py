from pathlib import Path
import hashlib,json,subprocess,sys
root=Path.cwd();item=Path(__file__).resolve().parent
paths={p for folder in ('src','scripts','web-skills') for p in (root/folder).rglob('*') if p.is_file()}
paths.update(root/f for f in ('package.json','package-lock.json','tsconfig.json','tsconfig.build.json'))
paths.update(p for p in item.iterdir() if p.suffix in ('.py','.ts','.mjs') or p.name=='plan.md')
paths.add(item/'budget-approval.json')
paths.update(root/f for f in ('.eval-artifacts/phase3b/g1-revision/check-fact-compatibility.ts','.eval-artifacts/phase3b/g3-longrun/hard-before.json'))
assert not any(p.name=='.env' or p.name.startswith('answers') for p in paths)
A='27cf175c341da74e4a55b7698fbe9187afadb7ff'
Apaths=['src/eval/restaurant/agent-loop/'+f for f in ('g6-development-preflight.ts','cases/g6-development/source.json','cases/g6-development/outlet.html','holdout-commitment.ts','holdout-commitment.test.ts')]
data={'mode':'OFFLINE_APPROVED_G1_MAIN_INTEGRATION','ACommit':A,'AInputs':{p:hashlib.sha256(subprocess.check_output(['git','show',A+':'+p])).hexdigest() for p in Apaths},'files':{str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(paths)}}
out=Path(sys.argv[1]);out.write_text(json.dumps(data,indent=2)+'\n');print(json.dumps({'files':len(paths),'AInputs':len(Apaths),'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}))
