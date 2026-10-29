from pathlib import Path
import hashlib,json,sys
root=Path.cwd();item=Path(__file__).resolve().parent
paths={p for folder in ('src','scripts','web-skills') for p in (root/folder).rglob('*') if p.is_file()}
paths.update(root/x for x in ('package.json','package-lock.json','tsconfig.json','tsconfig.build.json'))
paths.update(p for p in item.iterdir() if p.suffix in ('.py','.ts','.mjs') or p.name=='plan.md')
paths.add(root/'.eval-artifacts/phase3b/g1-revision/check-fact-compatibility.ts')
paths.add(root/'.eval-artifacts/phase3b/g3-longrun/hard-before.json')
assert not any(p.name=='.env' or p.name.startswith('answers') for p in paths)
v={'mode':'OFFLINE_G3_PRICE_APPLICABILITY','files':{str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(paths)}}
p=Path(sys.argv[1]);p.write_text(json.dumps(v,indent=2)+'\n')
print(json.dumps({'paths':len(paths),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}))
