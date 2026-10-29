"""Offline controlled faults in an isolated source copy; never mutates product worktree."""
from pathlib import Path
import subprocess,tarfile,io,tempfile,shutil,json,hashlib,difflib
root=Path.cwd();out=root/'.eval-artifacts/phase3b/test-suite-maintenance/coverage-proofs';out.mkdir(exist_ok=True)
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();copy=Path(tempfile.mkdtemp(prefix='praxis-test-successors-',dir='/private/tmp'))
archive=subprocess.check_output(['git','archive',head,'src','scripts','web-skills','package.json','package-lock.json','tsconfig.json','tsconfig.build.json'])
with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
 for member in tar.getmembers(): assert not member.name.startswith('/') and '..' not in Path(member.name).parts
 tar.extractall(copy)
(copy/'node_modules').symlink_to((root/'node_modules').resolve(),target_is_directory=True)
overlay=['src/integrations/google/google-places-restaurant-search.test.ts','src/harness/browser/browser-read-replay.test.ts','src/infrastructure/browser/playwright-read-network-guard.test.ts']
for file in overlay:shutil.copyfile(root/file,copy/file)
node=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test']
cases=[
 {'id':'A-D01','files':['src/infrastructure/browser/browser-action-decision.test.ts','src/infrastructure/browser/browser-task-executor.test.ts'],'pattern':'browser prompt describes|restores only bounded|accepts page-level WAIT|canonical page-level WAIT|page-level Escape|ordinary observed query submit','source':'src/infrastructure/browser/browser-action-decision.ts','old':'checked: value.requestedState === "CHECKED"','new':'checked: false','expected':'strict browser wire restores only bounded'},
 {'id':'A-D02','files':['src/integrations/google/google-places-restaurant-search.test.ts'],'pattern':'candidate fact investigation re-reads only','source':'src/integrations/google/google-places-client.ts','old':'`${GOOGLE_PLACES_DETAILS_URL}/${encodeURIComponent(id)}`','new':'GOOGLE_PLACES_TEXT_SEARCH_URL','expected':'fact investigation must reuse the stable place ID'},
 {'id':'A-D03','files':['src/integrations/google/google-places-restaurant-search.test.ts'],'pattern':'failed sent Google requests','source':'src/integrations/google/google-places-client.ts','old':'"GOOGLE_NETWORK_FAILED", "Google Places request failed"','new':'"GOOGLE_NETWORK_FAILED", "Google Places request failed: " + String(error)','expected':'validation function is expected to return "true"'},
 {'id':'A-C01','files':['src/harness/browser/browser-read-replay.test.ts'],'pattern':'guarded dynamic TableCheck recording','source':'src/eval/restaurant/agent-loop/runners/browser-read-recording.ts','old':'    this.responses.set(url, {','new':'    if (new URL(url).pathname === "/slots") return; // Controlled lost response\n    this.responses.set(url, {','expected':'REPLAYABLE'},
 {'id':'A-T01','files':['src/infrastructure/browser/playwright-read-network-guard.test.ts'],'pattern':'beyond the action cap','source':'src/infrastructure/browser/playwright-read-network-guard.ts','old':'this.requestTimeoutMs = Math.max(1, timeoutMs);','new':'this.requestTimeoutMs = Math.max(1, Math.min(5_000, timeoutMs));','expected':'fetch:0:5000'},
]
rows=[]
for case in cases:
 command=node+['--test-name-pattern='+case['pattern']]+case['files'];prefix=out/case['id'];file=copy/case['source'];before=file.read_text();assert case['old'] in before
 result={'id':case['id'],'sourceRef':head,'command':command,'sourceSha256':hashlib.sha256(before.encode()).hexdigest(),'testInputsSha256':{name:hashlib.sha256((copy/name).read_bytes()).hexdigest() for name in case['files']},'mode':'LOCAL_CONSTRUCTED_CONTROLLED_FAULT_NOT_WEBSITE_REPLAY'}
 normal=subprocess.run(command,cwd=copy,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=60);Path(str(prefix)+'-normal.log').write_bytes(normal.stdout);assert normal.returncode==0,normal.stdout.decode();result['normalExit']=0
 after=before.replace(case['old'],case['new']);patch=''.join(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile=case['source'],tofile=case['source']));Path(str(prefix)+'.patch').write_text(patch)
 file.write_text(after)
 try:bad=subprocess.run(command,cwd=copy,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=60)
 finally:file.write_text(before)
 Path(str(prefix)+'-red.log').write_bytes(bad.stdout);text=bad.stdout.decode();assert bad.returncode!=0 and case['expected'] in text,(case['id'],text)
 assert 'AssertionError' in text or 'ERR_ASSERTION' in text,text
 assert 'ERR_MODULE_NOT_FOUND' not in text and 'SyntaxError' not in text,text
 result.update(mutantExit=bad.returncode,expectedFailure=case['expected'],assertionFailure=True,patchSha256=hashlib.sha256(patch.encode()).hexdigest(),normalLogSha256=hashlib.sha256(normal.stdout).hexdigest(),redLogSha256=hashlib.sha256(bad.stdout).hexdigest());rows.append(result)
 (out/'summary.json').write_text(json.dumps(rows,indent=2)+'\n');print(case['id']+' NORMAL_PASS CONTROLLED_FAULT_CAUGHT',flush=True)
shutil.rmtree(copy)
