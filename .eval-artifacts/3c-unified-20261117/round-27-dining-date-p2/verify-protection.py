from pathlib import Path
import hashlib,json,subprocess
root=Path.cwd();out=Path(__file__).resolve().parent;base=json.loads((out/'protection-baseline.json').read_text())
git=lambda *a:subprocess.check_output(['git','--no-optional-locks',*a]);h=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
changed=[n for n,v in base['historySHA256'].items() if (root/n).is_file() and h(root/n)!=v]
missing=[n for n in base['historySHA256'] if not (root/n).is_file()]
knownMissing=[n for n in base['knownMissing'] if not (root/n).is_file()]
assert len(knownMissing)==137
allowed={'src/application/restaurant-agent-loop.ts','src/harness/browser/web-workspace-round27.test.ts','src/domains/restaurant/relative-date-binding.ts','src/domains/restaurant/relative-date-binding.test.ts','src/application/restaurant-relative-date.test.ts'}
sourceChanges=[n for n,v in base['sourceSHA256'].items() if not (root/n).is_file() or h(root/n)!=v]
sourcePaths=git('diff','--name-only',base['head'],'--','src/').decode().splitlines();unauthorized=sorted((set(sourceChanges)|set(sourcePaths))-allowed)
main=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing')
now={k:hashlib.sha256(git('-C',str(main),*args)).hexdigest() for k,args in [('head',['rev-parse','HEAD']),('status',['status','--porcelain=v1','--untracked-files=all']),('index',['diff','--cached','--binary']),('diff',['diff','--binary'])]}
prior=json.loads((out.parent/'round-23/closeout-protection.json').read_text())['snapshot']['materializedFilesExcludingDependencies'];closeout=Path('/private/tmp/praxis-3c-closeout')
closeoutChanged=[n for n,v in prior.items() if not (closeout/n).is_file() or h(closeout/n)!=v['sha256']]
result={'sha':git('rev-parse','HEAD').decode().strip(),'sourceTree':git('rev-parse','HEAD:src').decode().strip(),'historicalBaseline':len(base['historySHA256']),'historicalMatches':len(base['historySHA256'])-len(changed)-len(missing),'changedHistorical':changed,'newMissing':missing,'knownMissingCount':len(knownMissing),'sourceChanges':sourceChanges,'unauthorizedSourceChanges':unauthorized,'mainWorkspaceUnchanged':now==base['main'],'mainEnvUnchanged':h(main/'.env')==base['mainEnvSHA256'],'sparseUnchanged':h(base['sparsePath'])==base['sparseSHA256'],'protectedConfigsUnchanged':all(h(root/n)==v for n,v in base['protectedConfigSHA256'].items()),'closeoutFiles':len(prior),'closeoutChanges':closeoutChanged,'originalRound27ManifestUnchanged':h(out.parent/'round-27/artifact-sha256.json')==base['originalRound27ManifestSHA256'],'overallHistoricalSignoff':'BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS'}
expectedMissing={r['path'] for r in json.loads((out/'midnight-recovery-plan.json').read_text())['rows']}
assert not changed and set(missing)==expectedMissing and not unauthorized and not closeoutChanged
result['declaredTrackedHistoricalMissingCount']=len(expectedMissing)
result['declaredHistoricalDeletionSetStable']=True
assert all(result[k] for k in ['mainWorkspaceUnchanged','mainEnvUnchanged','sparseUnchanged','protectedConfigsUnchanged','originalRound27ManifestUnchanged'])
result['followupChangeProtection']='AVAILABLE_FILES_AND_SOURCE_UNCHANGED; HISTORICAL_PROTECTION_BLOCKED';(out/'protection-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ['sha','historicalMatches','knownMissingCount','followupChangeProtection','overallHistoricalSignoff']}))
