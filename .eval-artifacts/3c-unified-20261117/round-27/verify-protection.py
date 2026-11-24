from pathlib import Path
import hashlib,json,subprocess
root=Path.cwd();out=Path(__file__).resolve().parent;base=json.loads((out/'protection-baseline.json').read_text());h=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest();git=lambda *a:subprocess.check_output(['git','--no-optional-locks',*a]);sha=git('rev-parse','HEAD').decode().strip()
changed=[];newMissing=[]
for name,digest in base['historySHA256'].items():
 p=root/name
 if not p.is_file():newMissing.append(name)
 elif h(p)!=digest:changed.append(name)
knownMissingStill=[n for n in base['knownMissing'] if not (root/n).is_file()]
recovered=[n for n in base['knownMissing'] if (root/n).is_file()]
assert not recovered,'No additional historical recovery authorized in Round27'
main=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing');now={k:hashlib.sha256(git('-C',str(main),*args)).hexdigest() for k,args in [('head',['rev-parse','HEAD']),('status',['status','--porcelain=v1','--untracked-files=all']),('index',['diff','--cached','--binary']),('diff',['diff','--binary'])]}
allowed=set('''src/application/restaurant-message-handler.ts
src/application/restaurant-relative-date.test.ts
src/domains/restaurant/relative-date-binding.ts
src/domains/restaurant/relative-date-binding.test.ts
src/domains/restaurant/semantic-proposal.ts
src/domains/restaurant/semantic-interpreter.ts
src/domains/restaurant/semantic-interpreter.test.ts
src/domains/restaurant/semantic-compiler.ts
src/domains/restaurant/temporal-materialization.ts
src/domains/restaurant/fixtures/semantic-prompt-v26-sha.json
src/domains/restaurant/fixtures/semantic-prompt-v29-sha.json
src/eval/restaurant/semantic/scorer.ts
src/eval/restaurant/semantic/scorer.test.ts
src/eval/restaurant/agent-loop/hybrid-read-composition.ts
src/harness/workspace-fixture-server.ts
src/harness/browser/web-workspace-round6.test.ts
src/harness/browser/web-workspace-round25.test.ts
src/harness/browser/web-workspace-round27.test.ts
src/web/local-workspace-page.ts
src/web/browser/composer.ts
src/web/browser/entry.ts
src/web/browser/runtime.ts
src/web/browser/transport.ts
src/web/browser/views.ts'''.splitlines())
paths=git('diff','--name-only',base['head']).decode().splitlines();unauthorized=[n for n in paths if n.startswith('src/') and n not in allowed]
sourceChanges=[n for n,v in base['sourceSHA256'].items() if not (root/n).is_file() or h(root/n)!=v];unauthorized+= [n for n in sourceChanges if n not in allowed and n not in unauthorized]
closeout=Path('/private/tmp/praxis-3c-closeout');prior=json.loads((out.parent/'round-23/closeout-protection.json').read_text())['snapshot'];closeoutChanges=[n for n,v in prior['materializedFilesExcludingDependencies'].items() if not (closeout/n).is_file() or h(closeout/n)!=v['sha256']]
counts={name:sum(1 for n in base['historySHA256'] if ('/'+name+'/') in n) for name in ['round-25','round-26']}
result={'sha':sha,'sourceTree':git('rev-parse','HEAD:src').decode().strip(),'historicalPresentBaseline':len(base['historySHA256']),'historicalPresentMatching':len(base['historySHA256'])-len(changed)-len(newMissing),'historicalExistingChanged':changed,'newMissing':newMissing,'knownEarlyMissing':knownMissingStill,'knownEarlyMissingCount':len(knownMissingStill),'historyArchiveCounts':counts,'mainWorkspaceUnchanged':now==base['main'],'mainEnvUnchanged':h(main/'.env')==base['mainEnvSHA256'],'sparseUnchanged':h(base['sparsePath'])==base['sparseSHA256'],'closeoutMaterializedFiles':len(prior['materializedFilesExcludingDependencies']),'closeoutChanges':closeoutChanges,'sourceChanges':sourceChanges,'sourceWhitelist':sorted(allowed),'unauthorizedSourceChanges':unauthorized,'protectedConfigUnchanged':all(h(root/name)==value for name,value in base['protectedConfigSHA256'].items()),'round27ChangeProtection':'PASS' if not changed and not newMissing and not unauthorized else 'FAIL','overallHistoricalSignoff':'BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS'}
(out/'protection-verification.json').write_text(json.dumps(result,indent=2)+'\n')
assert all(h(root/name)==value for name,value in base['protectedConfigSHA256'].items())
assert not changed and not newMissing and not unauthorized and not closeoutChanges
assert len(knownMissingStill)==137 and result['mainWorkspaceUnchanged'] and result['mainEnvUnchanged'] and result['sparseUnchanged']
print(json.dumps({'round27ChangeProtection':'PASS','historicalPresentMatching':result['historicalPresentMatching'],'knownMissing':137,'overallHistoricalSignoff':result['overallHistoricalSignoff']}))
