"""Frozen offline mutation controls: assert the same contract tests detect removed checks."""
from pathlib import Path
import argparse, datetime, hashlib, json, subprocess
p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);a=p.parse_args()
root=Path.cwd();out=a.output.resolve();assert not out.is_relative_to(root);out.mkdir(parents=True,exist_ok=False)
source=root/'src/integrations/restaurant-facts/model-page-question.ts'
original=source.read_bytes();sha=lambda b:hashlib.sha256(b).hexdigest()
tests=root/'src/integrations/restaurant-facts/model-page-question.test.ts'
rows=[]
controls=[
 ('quote-check', ' || whitespace(statement.text) !== whitespace(citation.quote)', '', 'G1 rejects fabricated'),
 ('identity-check', '&& identity.entityMatch?.confidence === "HIGH"', '&& true', 'G1 rejects stale runs'),
 ('sensitive-prose-check', '!exactKeys(body, ["status", "citations"]) || ', '', 'G1 sensitive questions'),
]
try:
 for name,before,after,pattern in controls:
  text=original.decode();assert text.count(before)==1,(name,text.count(before))
  mutant=text.replace(before,after);source.write_text(mutant)
  command=['node','--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-name-pattern='+pattern,str(tests.relative_to(root))]
  r=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=30)
  (out/(name+'.log')).write_bytes(r.stdout)
  assert r.returncode!=0 and b'AssertionError' in r.stdout and b'TransformError' not in r.stdout,(name,r.returncode,r.stdout[-300:])
  rows.append({'control':name,'command':command,'exitCode':r.returncode,'mutantSha256':sha(mutant.encode()),'logSha256':sha(r.stdout),'detection':'EXPECTED_ASSERTION_FAILURE'})
  source.write_bytes(original)
finally:
 source.write_bytes(original)
assert sha(source.read_bytes())==sha(original)
(out/'controls.json').write_text(json.dumps({'mode':'OFFLINE_FIXTURE_MUTATIONS','testedCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'recordedAtCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1),'CET')).isoformat(),'sourceSha256':sha(original),'testSha256':sha(tests.read_bytes()),'scriptSha256':sha(Path(__file__).read_bytes()),'runs':rows,'sourceRestored':True},indent=2)+'\n')
print('Expected red controls:',len(rows),'source restored')
