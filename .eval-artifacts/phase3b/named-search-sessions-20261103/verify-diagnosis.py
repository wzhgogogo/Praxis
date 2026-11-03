from pathlib import Path
import hashlib,json,subprocess,tempfile,shutil
r=Path(__file__).parent
git=lambda *a:subprocess.check_output(['git',*a])
f=json.loads((r/'freeze.json').read_text())
for item in f['files']:assert hashlib.sha256(Path(item['path']).read_bytes()).hexdigest()==item['sha256']
assert not git('status','--porcelain').strip()
assert not git('diff','a7abbc0f','--','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json').strip()
data=json.loads((r/'analysis.json').read_text());assert len(data['searchEntrances'])==38
assert len({(x['run'],x['sequence']) for x in data['searchEntrances']})==38
assert data['summary']['D4']['sessions']==16 and data['summary']['D8']['sessions']==3
assert len(data['tablecheckD8Branch'])==3
with tempfile.TemporaryDirectory(prefix='praxis-session-diagnosis-') as temp:
    folder=Path(temp)
    for name in ['analyze.py','inputs.json']:shutil.copyfile(r/name,folder/name)
    p=subprocess.run(['python3','-B',str(folder/'analyze.py')],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    assert p.returncode==0,p.stderr.decode()
    for name in ['analysis.json','entrances.md']:assert (r/name).read_bytes()==(folder/name).read_bytes(),'Non-deterministic output'
base=json.loads(git('show','a7abbc0f:.eval-artifacts/phase3b/budget.json'));other=json.loads(git('show','257a907e:.eval-artifacts/phase3b/budget.json'))
after=json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text());rows={e['id']:e for e in after['entries']}
for source in [base,other]:
    for e in source['entries']:assert rows[e['id']]==e
assert len(rows)==len(after['entries'])==815 and after['limits']==base['limits']
print(json.dumps({'status':'PASS','sourceUnchangedFromMain':'a7abbc0f','uniqueEntranceRows':38,'D8BranchWitnesses':3,'deterministicSecondRun':'BYTE_IDENTICAL_IN_TEMP_COPY','ledgerRows':815,'newCalls':0,'inputSha256':hashlib.sha256((r/'inputs.json').read_bytes()).hexdigest(),'outputs':{name:hashlib.sha256((r/name).read_bytes()).hexdigest() for name in ['analysis.json','entrances.md']},'runtimeDiagnosticPatchApplied':False},indent=2))
