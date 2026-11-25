from pathlib import Path
import os,subprocess,json,time,re
root=Path.cwd();out=Path(__file__).resolve().parent;gates=out/'gates';assert not gates.exists();gates.mkdir()
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();tree=subprocess.check_output(['git','rev-parse','HEAD:src'],text=True).strip();clean=lambda:not subprocess.check_output(['git','status','--porcelain=v1','--untracked-files=all'],text=True)
assert clean();env={k:os.environ[k] for k in ['PATH','HOME','TMPDIR'] if k in os.environ};env['PRAXIS_ROUND27_SHA']=sha;env['PRAXIS_ROUND27_VISUAL_OUTPUT']=str(out/'visual');rows=[]
profile='(version 1)(allow default)(deny network-outbound)(allow network-outbound (remote ip "localhost:*"))'
def run(name,command,folder=gates,sandbox=True):
 assert clean();start=time.monotonic();actual=['/usr/bin/sandbox-exec','-p',profile,*command] if sandbox else command
 with (folder/(name+'.log')).open('w') as log:r=subprocess.run(actual,env=env,stdout=log,stderr=subprocess.STDOUT)
 content=(folder/(name+'.log')).read_text();summaries=[{'tests':int(a),'pass':int(b),'fail':int(c)} for a,b,c in re.findall(r'(?:#|\u2139) tests (\d+).*?(?:#|\u2139) pass (\d+)\n(?:#|\u2139) fail (\d+)',content,re.S)]
 row={'name':name,'sha':sha,'sourceTree':tree,'command':command,'invocation':actual,'exitCode':r.returncode,'seconds':time.monotonic()-start,'cleanBefore':True,'cleanAfter':clean(),'envLoaded':False,'network':'OS deny non-loopback outbound' if sandbox else 'Fixture-only; Replay children enforce their own OS sandbox; no outer sandbox','testSummaries':summaries};rows.append(row);(gates/'manifest.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(row),flush=True)
 if r.returncode or not row['cleanAfter']:raise SystemExit(r.returncode or 1)
for name,command in [('typecheck',['npm','run','typecheck']),('arch-check',['npm','run','arch:check']),('build',['npm','run','build']),('test',['npm','test']),('browser-fixture',['npm','run','test:browser:fixture'])]:run(name,command,sandbox=name!='browser-fixture')
# The dist test owns its single OS sandbox and runs only after this SHA's Build.
run('c1-built',['python3',str(out/'run-c1-built.py')],folder=out,sandbox=False)
run('reviewer-probe',['python3',str(out/'run-reviewer-probe.py')],folder=out)
run('assets',['node','--import','tsx',str(out/'verify-build-assets.mjs')],folder=out)
run('graph',['python3',str(out/'inspect-browser-graph.py')],folder=out)
run('protection',['python3',str(out/'verify-protection.py')],folder=out)
print('Round27 dining-date context P1 offline acceptance complete',flush=True)
