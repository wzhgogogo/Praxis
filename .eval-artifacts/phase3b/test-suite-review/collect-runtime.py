from pathlib import Path
import subprocess,shlex,glob,json,time,hashlib
root=Path('.eval-artifacts/phase3b/test-suite-review');freeze=json.loads((root/'input-freeze.json').read_text());assert not subprocess.check_output(['git','status','--porcelain'])
for name,digest in freeze['files'].items():assert hashlib.sha256(Path(name).read_bytes()).hexdigest()==digest,name
package=json.loads(Path('package.json').read_text());summary=[]
for script,cohort in [('test','default'),('test:browser:fixture','chromium')]:
 args=shlex.split(package['scripts'][script]);assert args[0]=='node' and '--test' in args
 insert=args.index('--test')+1;args.insert(insert,'--test-reporter='+str(root/'runtime-reporter.mjs'))
 expanded=[]
 for arg in args:expanded.extend(sorted(glob.glob(arg)) if '*' in arg else [arg])
 start=time.monotonic();out=root/(cohort+'-runtime.jsonl')
 with out.open('x') as log:r=subprocess.run(expanded,stdout=log,stderr=subprocess.PIPE,text=True)
 (root/(cohort+'-stderr.log')).write_text(r.stderr);row={'script':script,'cohort':cohort,'argv':expanded,'seconds':time.monotonic()-start,'exitCode':r.returncode,'beforeClean':True,'afterClean':not subprocess.check_output(['git','status','--porcelain'])};summary.append(row);(root/'runtime-baseline.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps({k:v for k,v in row.items() if k!='argv'}),flush=True)
 assert r.returncode==0 and row['afterClean']
 for name,digest in freeze['files'].items():assert hashlib.sha256(Path(name).read_bytes()).hexdigest()==digest,name
