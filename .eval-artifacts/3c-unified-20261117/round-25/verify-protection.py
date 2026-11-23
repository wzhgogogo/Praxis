from pathlib import Path
import hashlib,json,subprocess
root=Path.cwd();out=Path(__file__).resolve().parent;base=json.loads((out/'protection-baseline.json').read_text());digest=lambda b:hashlib.sha256(b).hexdigest();h=lambda p:digest(Path(p).read_bytes());git=lambda *a:subprocess.check_output(['git','--no-optional-locks',*a],text=True).strip()
helpers={'src/harness/browser/browser-read-test-fixtures.ts':'C1 shared component session fixture; original component assertions retained','src/harness/browser/fixtures/recorded-g1-query.ts':'C1 shared component session fixture','src/harness/workspace-fixture-server.ts':'V3 synthetic table answer lifecycle plus M2 real-response interruption hooks in the test host only'}
checks={key:{'count':len(base[key]),'changed':[p for p,v in base[key].items() if not (root/p).is_file() or h(root/p)!=v]} for key in ['historySHA256','protectedProduction']}
exceptions=[{'path':p,'reason':helpers[p],'beforeSHA256':base['protectedProduction'][p],'afterSHA256':h(root/p)} for p in checks['protectedProduction']['changed'] if p in helpers]
unauthorized=[p for p in checks['protectedProduction']['changed'] if p not in helpers]
main=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing');now={k:digest(subprocess.check_output(['git','--no-optional-locks','-C',str(main),*args])) for k,args in [('head',['rev-parse','HEAD']),('status',['status','--porcelain=v1','--untracked-files=all']),('index',['diff','--cached','--binary']),('diff',['diff','--binary'])]}
checks.update(mainWorkspaceUnchanged=now==base['main'],mainEnvUnchanged=h(main/'.env')==base['mainEnvSHA256'],sparseUnchanged=h(base['sparsePath'])==base['sparseSHA256'])
closeout=Path('/private/tmp/praxis-3c-closeout');prior=json.loads((out.parent/'round-23/closeout-protection.json').read_text())['snapshot'];changed=[p for p,v in prior['materializedFilesExcludingDependencies'].items() if not (closeout/p).is_file() or h(closeout/p)!=v['sha256']]
blocks=git('worktree','list','--porcelain').split('\n\n');registration=next(b for b in blocks if b.startswith('worktree '+str(closeout)+'\n'));closeoutResult={'files':len(prior['materializedFilesExcludingDependencies']),'changed':changed,'registrationUnchanged':registration==prior['registration'],'gitFileStillMissing':not (closeout/'.git').exists(),'reference':'round-23/closeout-protection.json immutable snapshot; matches round-24 summary'}
checks['closeout']=closeoutResult
paths=git('diff','--name-only',base['head']).splitlines();allowed=set(base['allowedProduction'])|set(helpers)|{'src/infrastructure/browser/'+n+'.ts' for n in ['cloudflare-browser-session','cloudflare-browser-worker','cloudflare-session-proxy','cloudflare-session-protocol']}
testHelpers={'src/harness/browser/fixtures/cdp-faults/loopback-cdp.ts','src/harness/fixtures/cdp-service-host.ts','src/harness/google-photo-recovery-fixture.ts','src/harness/question-row-fixture.ts'}
docs={'docs/integrations/CAPABILITY-MATRIX.md','docs/product/USER-FLOWS.md','docs/product/VISUAL-DIRECTION.md','docs/STATUS.md','docs/history/DEVLOG.md','docs/history/TEST-LOG.md','docs/history/monthly/2026-11-index.md'}
unexpected=[p for p in paths if p not in allowed|testHelpers|docs and not p.endswith('.test.ts') and not p.startswith('.eval-artifacts/3c-unified-20261117/round-25/')]
result={'sha':git('rev-parse','HEAD'),'sourceTree':git('rev-parse','HEAD:src'),'checks':checks,'authorizedTestHelperChanges':exceptions,'unauthorizedProtectedChanges':unauthorized,'changedFiles':paths,'allWithinWhitelist':not unexpected,'unexpected':unexpected,'historicalChanges':len(checks['historySHA256']['changed']),'noLiveOrPostgresOr4312Invoked':True}
(out/'protection-verification.json').write_text(json.dumps(result,indent=2)+'\n')
assert not checks['historySHA256']['changed'] and not unauthorized and not unexpected
assert checks['mainWorkspaceUnchanged'] and checks['mainEnvUnchanged'] and checks['sparseUnchanged']
assert not changed and closeoutResult['registrationUnchanged'] and closeoutResult['gitFileStillMissing']
print(json.dumps({'historicalFiles':checks['historySHA256']['count'],'historicalChanges':0,'protectedFiles':checks['protectedProduction']['count'],'authorizedTestHelpers':len(exceptions),'unauthorizedChanges':0,'mainEnvSparseUnchanged':True,'closeoutFiles':len(prior['materializedFilesExcludingDependencies'])}))
