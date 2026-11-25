from pathlib import Path
import subprocess,json,sys
out=Path(__file__).resolve().parent;groups=[]
for script,args,expected in [('reviewer-date-probe.mjs',['--p1-only'],6),('reviewer-weekday-probe.mjs',[],5),('reviewer-contextual-date.mjs',['--p1-only'],4),('reviewer-alternatives.mjs',[],2),('reviewer-omitted-edit.mjs',[],2),('reviewer-confirm-date.mjs',['--confirm-only'],3)]:
 command=['node','--import','tsx',str(out/script),*args];r=subprocess.run(command,capture_output=True,text=True)
 print(r.stdout,end='');print(r.stderr,end='',file=sys.stderr)
 rows=[json.loads(line) for line in r.stdout.splitlines() if line.startswith('{')]
 groups.append({'script':script,'command':command,'childExitCode':r.returncode,'pass':r.returncode==0 and len(rows)==expected and all(row['pass'] for row in rows),'rows':rows})
passed=all(group['pass'] for group in groups)
(out/'reviewer-probe-results.json').write_text(json.dumps({'sha':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'envLoaded':False,'pass':passed,'rowCount':sum(len(g['rows']) for g in groups),'groups':groups},indent=2)+'\n')
raise SystemExit(0 if passed else 1)
