from pathlib import Path
import hashlib,json,subprocess
root=Path.cwd();out=Path(__file__).resolve().parent;base=json.loads((out/'protection-baseline.json').read_text());digest=lambda b:hashlib.sha256(b).hexdigest();h=lambda p:digest(Path(p).read_bytes());git=lambda *a:subprocess.check_output(['git','--no-optional-locks',*a],text=True).strip()
checks={key:{'count':len(base[key]),'changed':[p for p,v in base[key].items() if not (root/p).is_file() or h(root/p)!=v]} for key in ['historySHA256','protectedProduction']}
main=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing');now={k:digest(subprocess.check_output(['git','--no-optional-locks','-C',str(main),*args])) for k,args in [('head',['rev-parse','HEAD']),('status',['status','--porcelain=v1','--untracked-files=all']),('index',['diff','--cached','--binary']),('diff',['diff','--binary'])]}
checks.update(mainWorkspaceUnchanged=now==base['main'],mainEnvUnchanged=h(main/'.env')==base['mainEnvSHA256'],sparseUnchanged=h(base['sparsePath'])==base['sparseSHA256'])
assert all(not checks[k]['changed'] for k in ['historySHA256','protectedProduction']),checks
assert checks['mainWorkspaceUnchanged'] and checks['mainEnvUnchanged'] and checks['sparseUnchanged']
paths=git('diff','--name-only',base['head']).splitlines();allowed=set(base['allowedProduction']);docs={'docs/product/USER-FLOWS.md','docs/product/VISUAL-DIRECTION.md','docs/STATUS.md','docs/history/DEVLOG.md','docs/history/TEST-LOG.md','docs/history/monthly/2026-11-index.md'}
unexpected=[p for p in paths if p not in allowed and p not in docs and not p.endswith('.test.ts') and not p.startswith('src/harness/browser/fixtures/round24-provenance/') and not p.startswith('.eval-artifacts/3c-unified-20261117/round-24/')]
assert not unexpected,unexpected
result={'sha':git('rev-parse','HEAD'),'sourceTree':git('rev-parse','HEAD:src'),'checks':checks,'changedFiles':paths,'allWithinWhitelist':not unexpected,'productionChanged':[p for p in paths if p in allowed],'historicalChanges':0,'notes':'Protected digests include package/lock/schema/server/Prompt/search fingerprint and all non-whitelisted existing production. No real PG/4312 activity is performed by this check.'}
(out/'protection-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v if not isinstance(v,dict) else {'count':v['count'],'changed':len(v['changed'])} for k,v in checks.items()}))
