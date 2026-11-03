from pathlib import Path
import hashlib,json,subprocess,tempfile
r=Path(__file__).parent
f=json.loads((r/'freeze.json').read_text())
git=lambda *a:subprocess.check_output(['git',*a])
sha=lambda b:hashlib.sha256(b).hexdigest()
for item in f['files']:assert sha(Path(item['path']).read_bytes())==item['sha256'],item['path']
base=f['base'];b=f['mainB'];c=f['approvedC']
paths=['src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json']
listing=lambda ref:set(git('ls-tree','-r','--name-only',ref,'--',*paths).decode().splitlines())
bb=listing(b);cc=listing(c);original=listing(base);allpaths=sorted(bb|cc|original)
def blob(ref,path,known):return git('show',ref+':'+path) if path in known else b''
proof=[]
for path in allpaths:
    before=blob(base,path,original);left=blob(b,path,bb);right=blob(c,path,cc)
    current=Path(path).read_bytes() if Path(path).is_file() else b''
    if left==right:expected=left;side='IDENTICAL'
    elif left==before:expected=right;side='C'
    elif right==before:expected=left;side='B'
    else:
        side='BOTH'
        with tempfile.TemporaryDirectory(prefix='praxis-c-merge-proof-') as tmp:
            files=[Path(tmp)/name for name in ['main','base','approved-c']]
            for target,content in zip(files,[left,before,right]):target.write_bytes(content)
            p=subprocess.run(['git','merge-file','-p',*[str(x) for x in files]],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        expected=p.stdout
        if p.returncode:
            assert path=='src/domains/restaurant/read-assessment.ts' and p.returncode==1
            text=expected.decode();start=text.index('<<<<<<<');split=text.index('=======',start);end=text.index('>>>>>>>',split);stop=text.index('\n',end)
            leftBlock=text[text.index('\n',start)+1:split];rightBlock=text[split+8:end]
            assert leftBlock=='import {namedOutletCandidateResolved,namedOutletCandidateCanInvestigate} from "./named-outlet-resolution.js";\nimport { acceptedPositiveHardEvidence } from "./positive-hard-evidence.js";\n'
            assert rightBlock=='import {namedOutletCandidateResolved,namedOutletCandidateCanInvestigate,namedOutletIdentityPrefix} from "./named-outlet-resolution.js";\n'
            expected=(text[:start]+rightBlock+'import { acceptedPositiveHardEvidence } from "./positive-hard-evidence.js";'+text[stop:]).encode()
    assert current==expected,'Source differs from reviewed union: '+path
    if left!=before or right!=before:proof.append({'path':path,'side':side,'sha256':sha(current)})
main=json.loads(git('show',b+':.eval-artifacts/phase3b/budget.json'))
reviewed=json.loads(git('show',c+':.eval-artifacts/phase3b/budget.json'))
after=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text());rows={e['id']:e for e in after['entries']}
assert len(rows)==len(after['entries'])==746
for source in [main,reviewed]:
    for entry in source['entries']:assert rows[entry['id']]==entry,entry['id']
assert after['limits']==main['limits'] and after['cumulative']==main['cumulative']
assert not rows['phase3b-C-named-identity-terms-main-20261103']['realModelCalls']
prior=Path('.eval-artifacts/phase3b/named-identity-terms-20261103')
for path in git('ls-tree','-r','--name-only',c,'--',str(prior)).decode().splitlines():assert Path(path).read_bytes()==git('show',c+':'+path),path
print(json.dumps({'status':'PASS','frozenFiles':len(f['files']),'mainB':b,'approvedC':c,'sourceUnion':proof,
    'ledgerRows':len(rows),'cumulative':after['cumulative'],'reviewedCArtifactsUnchanged':True,'realCalls':0,'envFileLoaded':False},indent=2))
