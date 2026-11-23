import json,re,hashlib,subprocess
from pathlib import Path
out=Path(__file__).parent
rows=json.loads((out/'ui-screenshot-contract.json').read_text())
log=(out/'final/states-driver.log').read_text()
executed=re.findall(r'(?:✔ |# Subtest: )(Round23 UI: .*?)(?: \(\d|\n)',log)
assert sorted(executed)==sorted(row['testName'] for row in rows),(executed,rows)
expected=set()
for row in rows:
 assert row['testName'] in log
 assert row['inputFile'] in (out/'final/visual-driver.json').read_text()
 for path in row['screenshots']:
  file=out/path;assert file.is_file() and file.read_bytes().startswith(b'\x89PNG\r\n\x1a\n'),path
  expected.add(file.resolve())
 row['ran']=True;row['pngVerified']=True
actual=set(p.resolve() for p in (out/'final/states').glob('round23-*.png'))
assert actual==expected,{'missing':list(map(str,expected-actual)),'unexpected':list(map(str,actual-expected))}
result={'sha':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'tests':len(rows),'screenshots':len(expected),'rows':rows}
(out/'ui-screenshot-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'tests':len(rows),'screenshots':len(expected),'missing':0,'unexpected':0}))
