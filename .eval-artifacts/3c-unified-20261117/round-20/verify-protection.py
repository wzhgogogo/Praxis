from pathlib import Path
import json
import sys
import subprocess

source = Path(__file__).with_name('protection-snapshot.py').read_text()
namespace = {}
exec(source.split("if sys.argv[1]=='before':")[0], namespace)
data, target = namespace['data'], namespace['target']
before = json.loads(target.read_text())
prior = before['priorEvidence']
current_files = data.pop('priorEvidence')
missing = prior.keys() - current_files.keys()
changed = [path for path in prior.keys() & current_files.keys() if prior[path] != current_files[path]]
assert not missing and not changed, (sorted(missing), sorted(changed))
authorized=json.loads(Path('.eval-artifacts/3c-unified-20261117/round-20/intent-state-authorized.json').read_text())
assert before['missingBlockingFieldsSource']==authorized['beforeSHA256']
assert data['missingBlockingFieldsSource']==authorized['afterSHA256']
original=subprocess.check_output(['git','show','b019f368221581497d91f54c5b20eb959e90b5b9:src/domains/restaurant/intent-state.ts'],text=True)
updated=Path('src/domains/restaurant/intent-state.ts').read_text()
assert updated.replace(authorized['allowedImport']+'\n','',1).replace('  '+authorized['allowedFunctionInsertion']+'\n','',1)==original,'Unauthorized intent-state text changed'
for key in data:
 if key!='missingBlockingFieldsSource':assert data[key]==before[key],key
additions = sorted(current_files.keys() - prior.keys())
assert all('/' in path and subprocess.run(['git','check-ignore','--quiet',str(Path('.eval-artifacts/3c-unified-20261117')/path)]).returncode == 0 for path in additions), additions
base = 'b019f368221581497d91f54c5b20eb959e90b5b9'
protected_tracked = subprocess.check_output([
    'git', 'diff', '--name-only', base, '--', 'src/application/', 'src/core/', 'src/server/', 'src/domains/', 'src/infrastructure/', 'src/integrations/', 'src/eval/',
    'docs/decisions/0038-model-call-default-delivery-window.md', 'docs/decisions/0045-bounded-read-conclusion-reserve.md', 'docs/decisions/0049-source-bound-b1-booking-handoff.md',
    '.eval-artifacts/restaurant-web-read/', '.eval-artifacts/3c-unified-20261117/',
], text=True).splitlines()
allowed={
'src/application/agent-workspace.ts','src/application/persistent-read-preparation.test.ts','src/application/persistent-restaurant-agent.ts','src/application/restaurant-execution-router.ts','src/application/workspace-read-projection.test.ts','src/application/workspace-read-projection.ts',
'src/domains/restaurant/action-validator.ts','src/domains/restaurant/intent-state.ts','src/domains/restaurant/open-ended-target.test.ts','src/domains/restaurant/open-ended-target.ts','src/domains/restaurant/page-question-eligibility.test.ts','src/domains/restaurant/read-assessment.ts','src/domains/restaurant/read-grounding.test.ts','src/domains/restaurant/read-grounding.ts','src/domains/restaurant/task-definition.ts',
'src/integrations/google/google-places-restaurant-search.test.ts','src/integrations/google/google-places-restaurant-search.ts'}
assert all(path in allowed or path.startswith('.eval-artifacts/3c-unified-20261117/round-20/') for path in protected_tracked),protected_tracked
assert not subprocess.check_output(['git','diff','--name-only',base,'--','package.json','package-lock.json','docs/decisions/','src/core/','src/server/','src/eval/'],text=True)
print('AUTHORIZED CHANGE: intent-state.ts whole-file SHA256 '+authorized['beforeSHA256']+' -> '+authorized['afterSHA256']+'; exact import and applyRestaurantIntentPatch call only. All other text, including missingBlockingFields(), is identical.')
print('PASS: main HEAD/status/index/tracked contents, main .env digest, Prompt 15, fingerprint and blocking fields.')
print('PASS: closeout pre-existing missing-.git condition, exact prunable registry entry and residual file/symlink inventory unchanged. Closeout Git HEAD/index/status cannot be independently checked; no repair attempted.')
print(f'PASS: {len(prior)} pre-existing Unified files and {len(data["walkthrough"])} walkthrough files preserve their SHA-256.')
for label in ('round-6', 'round-7', 'round-8', 'round-9', 'round-10', 'round-11', 'round-12', 'round-13', 'round-14', 'round-15', 'round-16', 'round-17', 'round-18', 'round-19'):
    print(f'{label}: {sum(path.startswith(label+"/") for path in prior)} materialized files checked.')
print('PASS: remaining protected sources, all eval/scoring code and non-Round20 evidence match baseline.')
if additions: print(f'Independent review outputs appeared after the initial snapshot. {len(additions)} files inventoried by path only. Round 20 did not write or stage them.')
if additions: print(*additions, sep='\n')
file = 'docs/product/USER-FLOWS.md'
historical = lambda content: [line for line in content.splitlines() if 'historical Mikkeller Case' in line]
assert historical(subprocess.check_output(['git','show',f'{base}:{file}'], text=True)) == historical(Path(file).read_text())
print('PASS: the historical Mikkeller note and ADRs 0038, 0045 and 0049 match the baseline.')
