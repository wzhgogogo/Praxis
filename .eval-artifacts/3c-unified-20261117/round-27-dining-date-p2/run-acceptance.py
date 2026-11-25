from pathlib import Path
import os,subprocess,json,time,re,hashlib
root=Path.cwd();out=Path(__file__).resolve().parent;gates=out/'gates';assert not gates.exists();gates.mkdir()
git=lambda *a:subprocess.check_output(['git','--no-optional-locks',*a])
sha=git('rev-parse','HEAD').decode().strip();tree=git('rev-parse','HEAD:src').decode().strip()
plan=json.loads((out/'midnight-recovery-plan.json').read_text());expected=sorted(' D '+r['path'] for r in plan['rows']);assert len(expected)==652
inputs=json.loads((out/'frozen-inputs.json').read_text())['files']
for row in plan['rows']:assert hashlib.sha256(git('show','HEAD:'+row['path'])).hexdigest()==row['headSHA256']
def inspect():
 status=git('status','--porcelain=v1','--untracked-files=all').decode().splitlines()
 changedInputs=[n for n,v in inputs.items() if not (root/n).is_file() or hashlib.sha256((root/n).read_bytes()).hexdigest()!=v]
 sourceDiff=git('diff','--name-only','HEAD','--','src/').decode().splitlines()
 return {'status':status,'statusSHA256':hashlib.sha256(json.dumps(status,separators=(',',':')).encode()).hexdigest(),'wholeTreeClean':not status,'declaredHistoricalDeletesOnly':sorted(status)==expected,'sourceAndInputsClean':not changedInputs and not sourceDiff and git('rev-parse','HEAD').decode().strip()==sha,'changedInputs':changedInputs,'sourceDiff':sourceDiff}
initial=inspect();assert initial['declaredHistoricalDeletesOnly'] and initial['sourceAndInputsClean'];(out/'frozen-worktree-status.json').write_text(json.dumps({'sha':sha,'sourceTree':tree,'policy':'user-authorized functional acceptance with only exact652declared passive historical deletions; not a clean tree','expectedDeletionCount':652,**initial},indent=2)+'\n')
env={k:os.environ[k] for k in ['PATH','HOME','TMPDIR'] if k in os.environ};env['PRAXIS_ROUND27_SHA']=sha;env['PRAXIS_ROUND27_VISUAL_OUTPUT']=str(out/'visual');rows=[]
profile='(version 1)(allow default)(deny network-outbound)(allow network-outbound (remote ip "localhost:*"))'
def run(name,command,folder=gates,sandbox=True):
 before=inspect();assert before['declaredHistoricalDeletesOnly'] and before['sourceAndInputsClean'];start=time.monotonic();actual=['/usr/bin/sandbox-exec','-p',profile,*command] if sandbox else command
 with (folder/(name+'.log')).open('w') as log:r=subprocess.run(actual,env=env,stdout=log,stderr=subprocess.STDOUT)
 content=(folder/(name+'.log')).read_text();summaries=[{'tests':int(a),'pass':int(b),'fail':int(c)} for a,b,c in re.findall(r'(?:#|\u2139) tests (\d+).*?(?:#|\u2139) pass (\d+)\n(?:#|\u2139) fail (\d+)',content,re.S)];after=inspect()
 row={'name':name,'sha':sha,'sourceTree':tree,'command':command,'invocation':actual,'exitCode':r.returncode,'seconds':time.monotonic()-start,'cleanBefore':before['wholeTreeClean'],'cleanAfter':after['wholeTreeClean'],'sourceAndInputsCleanBefore':before['sourceAndInputsClean'],'sourceAndInputsCleanAfter':after['sourceAndInputsClean'],'declaredHistoricalDeletesOnlyBefore':before['declaredHistoricalDeletesOnly'],'declaredHistoricalDeletesOnlyAfter':after['declaredHistoricalDeletesOnly'],'statusBeforeSHA256':before['statusSHA256'],'statusAfterSHA256':after['statusSHA256'],'historicalDeletionCount':652,'envLoaded':False,'network':'OS deny non-loopback outbound' if sandbox else 'Fixture-only; Replay children own OS sandbox; dist C1 owns one sandbox; no outer sandbox','testSummaries':summaries};rows.append(row);(gates/'manifest.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(row),flush=True)
 if r.returncode or not after['sourceAndInputsClean'] or not after['declaredHistoricalDeletesOnly'] or before['statusSHA256']!=after['statusSHA256']:
  (out/'first-failure-state.json').write_text(json.dumps(after,indent=2)+'\n');raise SystemExit(r.returncode or 1)
for name,command in [('typecheck',['npm','run','typecheck']),('arch-check',['npm','run','arch:check']),('build',['npm','run','build']),('test',['npm','test']),('browser-fixture',['npm','run','test:browser:fixture'])]:run(name,command,sandbox=name!='browser-fixture')
run('c1-built',['python3',str(out/'run-c1-built.py')],folder=out,sandbox=False)
run('reviewer-probe',['python3',str(out/'run-reviewer-probe.py')],folder=out)
run('assets',['node','--import','tsx',str(out/'verify-build-assets.mjs')],folder=out)
run('graph',['python3',str(out/'inspect-browser-graph.py')],folder=out)
run('protection',['python3',str(out/'verify-protection.py')],folder=out)
print('Functional offline acceptance complete; whole-tree historical protection remains BLOCKED',flush=True)
