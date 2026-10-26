"""Directed slow-snapshot positive/defect controls in disposable source copies.
The real six full-suite samples are never filtered or mutated."""
from pathlib import Path
import argparse, hashlib, json, os, subprocess, tarfile, tempfile

parser=argparse.ArgumentParser()
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args();root=Path.cwd();out=args.output.resolve();out.mkdir(parents=True,exist_ok=False)
commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
test_path='src/harness/browser/live-source-health.test.ts'
health_path='src/eval/restaurant/agent-loop/live-source-health.ts'
rows=[]
for fault in [False,True]:
    mode='drop-completed-snapshot' if fault else 'unchanged-health'
    with tempfile.TemporaryDirectory(prefix='praxis-slow-control-',dir='/private/tmp') as directory:
        clone=Path(directory)/'repo';clone.mkdir();archive=Path(directory)/'source.tar'
        subprocess.run(['git','archive','--format=tar','--output='+str(archive),commit,'src','scripts','web-skills','package.json','package-lock.json','tsconfig.json','tsconfig.build.json'],check=True)
        with tarfile.open(archive) as stream: stream.extractall(clone)
        (clone/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
        test=clone/test_path;text=test.read_text()
        modes="for(mode of ['healthy','slow-last-snapshot','busy-after-results','forbidden','challenge'])"
        assert text.count(modes)==1 and text.count('assert.ok(seenPolicies.length>=8)')==1
        text=text.replace(modes,"for(mode of ['slow-last-snapshot'])").replace('assert.ok(seenPolicies.length>=8)','assert.ok(seenPolicies.length>=2)')
        test.write_text(text)
        health=clone/health_path;production=health.read_text()
        if fault:
            boundary='resolve(observation());controller.abort();'
            assert production.count(boundary)==1
            production=production.replace(boundary,'if(snapshots.at(-1)?.finishedAt===null&&page){console.error("CONTROL_DROP_COMPLETED_SNAPSHOT");page=undefined;}\n  '+boundary)
            health.write_text(production)
        command=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test',test_path]
        env={k:v for k,v in os.environ.items() if k in ['PATH','HOME','TMPDIR','LANG','PLAYWRIGHT_BROWSERS_PATH']}
        result=subprocess.run(command,cwd=clone,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=30)
        log=result.stdout.decode(errors='replace');(out/(mode+'.log')).write_bytes(result.stdout)
        if fault:
            assert result.returncode!=0 and 'CONTROL_DROP_COMPLETED_SNAPSHOT' in log and 'slow-last-snapshot' in log and 'ENV_FAILURE' in log,log[-4000:]
        else: assert result.returncode==0,log[-4000:]
        rows.append({'mode':mode,'exitCode':result.returncode,'testVariantSha256':hashlib.sha256(text.encode()).hexdigest(),'healthVariantSha256':hashlib.sha256(production.encode()).hexdigest(),'logSha256':hashlib.sha256(result.stdout).hexdigest()})
(out/'summary.json').write_text(json.dumps({'status':'PASS','sourceCommit':commit,'windowMs':1000,'lateThresholdMs':800,'delayMs':220,'scope':'DIRECTED_VARIANTS_ONLY_NOT_FULL_SUITE','runs':rows,'realCalls':0},indent=2)+'\n')
print(json.dumps({'status':'PASS','runs':rows},indent=2))
