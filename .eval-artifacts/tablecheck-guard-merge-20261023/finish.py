from pathlib import Path
import json, subprocess, hashlib
b=Path('.eval-artifacts/tablecheck-guard-merge-20261023')
read=lambda p:json.loads(Path(p).read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
g=read(b/'gates/results.json');assert len(g)==5 and all(r['exitCode']==0 for r in g)
r=read(b/'regressions/regression-results.json');assert r['status']=='PASS' and r['calendar']['passed']==69 and r['selection']['passed']==5
c=read(b/'regressions/calibration/comparison.json');assert c['status']=='PASS' and c['outcomeMatches']==22 and c['normalS0Declaration']['matched']==20
assert not subprocess.check_output(['git','diff','30494fba','--','src','scripts','web-skills','package.json','package-lock.json','tsconfig.json','tsconfig.build.json'])
assert read(b/'gates/side-effect-verification.json')['restored']
freezeCounts={}
for p in [b/'replay-freeze.json',b/'regressions/calibration-freeze.json']:
 f=read(p)
 for n,h in f['files'].items():assert sha(n)==h,n
 freezeCounts[str(p)]=len(f['files'])
primary=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing')
prior=read('.eval-artifacts/phase2c-merge-20261023/main-worktree-before.json')
assert subprocess.check_output(['git','-C',str(primary),'rev-parse','HEAD']).decode().strip()==prior['head']
for n,h in prior['files'].items():assert sha(primary/n)==h,n
(b/'verification.json').write_text(json.dumps({'status':'PASS','merge':'46bd8ef9','reviewedBranch':'30494fba','mainBaseline':'8487a844','conflicts':[],'productByteDifferences':[],'gates':g,'calendar':69,'selection':5,'calibration':22,'normalDeclarations':20,'frozenFiles':freezeCounts,'primaryUserFilesUnchanged':9,'calls':{'models':0,'Google':0,'restaurantWebsites':0,'Live':0}},indent=2)+'\n')
(b/'report.md').write_text("""# Reviewed TableCheck fix mainline integration — 2026-10-23

Status: current baseline after authorized push. Merge `46bd8ef9` integrates independently reviewed `30494fba` into `8487a844`, conflicts **0**. Implementation files are byte-identical to the reviewed branch, exceptions **0**. No new product, Prompt, Schema, State or evaluator changes.

Fresh five gates: typecheck, arch:check, npm test **1026/1026**, build and Chromium **138/138**, all PASS. [Gate logs](gates/results.json). Regression configuration committed before execution at `e925c8a0`; fresh cached calendar **69/69**, selection **5/5**, independent evaluator33/rubric29 calibration **22/22**, normal declarations **20/20**. Interrupted and insufficient boundary evidence remain unknown. [Cached regression](regressions/regression-results.json), [calibration](regressions/calibration/comparison.json), [integrity](verification.json).

Nine primary-worktree user files and its HEAD preserved; historical region-composition output restored byte-for-byte. This merge slice used **0 real model, 0 Google, 0 restaurant website, 0 Live calls**. Local Chromium fixtures and cached-response tests do not prove current website readiness or live delivery.

The final commit containing this report is the mainline production freeze for the separately authorized p2c-holdout-01 DIAGNOSTIC_AFTER_GUARD_FIX. That diagnostic must not replace or count toward the original18 exit runs, reuses exact Gold/exit dates/witnesses, and defers grading until independent wording review. Its ledger and artifacts remain on the holdout branch.
""")
print('PASS')
