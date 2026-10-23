from pathlib import Path
import subprocess,shutil,tempfile,os,json,sys,time
root=Path.cwd();out=root/'.eval-artifacts/phase3a-prime/f1';kind=sys.argv[1]
folder=Path(tempfile.mkdtemp(prefix='praxis-f1-detection-'))
try:
 shutil.copytree(root/'src',folder/'src');shutil.copyfile(root/'package.json',folder/'package.json');(folder/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
 if kind=='meta-retirement':
  target=folder/'src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts';s=target.read_text();s=s.replace('const control = await runCopiedHybridTest(item.testName);','const control = await runCopiedHybridTest(item.testName); console.log(`CONTROL ${item.name}\\n${control.output}`);').replace('const mutant = await runCopiedHybridTest(item.testName, item.mutation);','const mutant = await runCopiedHybridTest(item.testName, item.mutation); console.log(`RED ${item.name}\\n${mutant.output}`);');target.write_text(s)
  file='src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts';pattern='^isolated implementation mutations';expected=0
 elif kind in ['identity-before','identity-after']:
  target=folder/'src/eval/restaurant/agent-loop/browser-read-probe.ts';s=target.read_text();old='identity: identity ? { confidence: identity.confidence';assert s.count(old)==1;target.write_text(s.replace(old,'identity: identity ? { confidence: "HIGH"'))
  file='src/harness/browser/browser-read-fixture.test.ts' if kind.endswith('before') else 'src/eval/restaurant/agent-loop/browser-read-probe.test.ts';pattern='^explicit fixture takeover' if kind.endswith('before') else '^challenge precedes content';expected=1
 elif kind=='provider-30s':
  target=folder/'src/infrastructure/browser/browser-task-executor.ts';s=target.read_text();old='const provider = this.options.maxElapsedMsPerProvider ?? candidate;';assert s.count(old)==1;s=s.replace(old,'const provider = Math.min(this.options.maxElapsedMsPerProvider ?? candidate, 30_000);');old='const providerLimit = this.options.maxElapsedMsPerProvider ?? candidateLimit;';assert s.count(old)==1;s=s.replace(old,'const providerLimit = Math.min(this.options.maxElapsedMsPerProvider ?? candidateLimit, 30_000);');target.write_text(s)
  file='src/harness/browser/browser-read-fixture.test.ts';pattern='^real Chromium TableCheck source observation';expected=1
 else:raise ValueError(kind)
 env=dict(os.environ);env.pop('NODE_TEST_CONTEXT',None);start=time.monotonic();cmd=['node','--import','tsx','--test',f'--test-name-pattern={pattern}',file];p=subprocess.run(cmd,cwd=folder,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=150);text=p.stdout.decode(errors='replace');(out/f'{kind}.log').write_text(text);assert p.returncode==expected,(kind,p.returncode,text[-3000:])
 if kind.startswith('identity'):assert 'ERR_ASSERTION' in text and 'HIGH' in text,text
 if kind=='provider-30s':assert 'UNKNOWN' in text and 'AVAILABLE' in text and 'ERR_ASSERTION' in text,text
 assert 'ERR_MODULE_NOT_FOUND' not in text and 'TransformError' not in text,text
 result={'kind':kind,'command':cmd,'exitCode':p.returncode,'expectedExitCode':expected,'elapsedSeconds':time.monotonic()-start,'mode':'ISOLATED_LOCAL_FIXTURE_NO_NETWORK_OR_REAL_MODEL','workingTreeProductionChanged':False};(out/f'{kind}.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
finally:shutil.rmtree(folder)
