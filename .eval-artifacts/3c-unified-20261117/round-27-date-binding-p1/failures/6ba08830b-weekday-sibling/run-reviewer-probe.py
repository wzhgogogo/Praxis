from pathlib import Path
import subprocess,json,sys
out=Path(__file__).resolve().parent
command=['node','--import','tsx',str(out/'reviewer-date-probe.mjs'),'--p1-only']
r=subprocess.run(command,capture_output=True,text=True)
print(r.stdout,end='');print(r.stderr,end='',file=sys.stderr)
rows=[json.loads(line) for line in r.stdout.splitlines() if line.startswith('{')]
passed=r.returncode==0 and len(rows)==6 and all(row['pass'] for row in rows)
(out/'reviewer-probe-results.json').write_text(json.dumps({'sha':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'envLoaded':False,'command':command,'childExitCode':r.returncode,'pass':passed,'rows':rows},indent=2)+'\n')
raise SystemExit(0 if passed else 1)
