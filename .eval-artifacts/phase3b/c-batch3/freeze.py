from pathlib import Path
import hashlib,json,subprocess,sys
root=Path('.eval-artifacts/phase3b/c-batch3')
paths=subprocess.check_output(['git','ls-files','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json'],text=True).splitlines()
paths += [str(p) for p in root.glob('*.mjs')]+[str(p) for p in root.glob('*.py')]
paths += [row['path'] for row in json.loads(Path('.eval-artifacts/phase3b/c-batch2/identity/recomputed.json').read_text())['inputs']]
prior=Path('.eval-artifacts/phase3b/c-batch2')
paths += [str(prior/name) for name in ['subjects.json','queries.materialized.json','retrieval-inputs/fragment.response.json','gold.certified.json']]
paths += [str(p) for p in (prior/'search').iterdir() if p.suffix in ['.json','.html']]
paths += [str(prior/'score-search.py')]+[str(p) for p in (prior/'retrieval-inputs/google').glob('*.raw.json')]
if (root/'optional-queries.json').exists():paths.append(str(root/'optional-queries.json'))
if (root/'optional').exists():paths += [str(p) for p in (root/'optional').iterdir() if p.suffix in ['.json','.html']]
result={'schema':'phase3b-c-inputs@1','files':[{'path':p,'sha256':hashlib.sha256(Path(p).read_bytes()).hexdigest()} for p in sorted(set(paths))]}
(root/(sys.argv[1] if len(sys.argv)>1 else 'freeze.json')).write_text(json.dumps(result,indent=2)+'\n')
print(len(result['files']))
