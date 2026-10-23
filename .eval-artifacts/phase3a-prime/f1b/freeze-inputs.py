from pathlib import Path
import collections,gzip,hashlib,json,re,subprocess,datetime
from zoneinfo import ZoneInfo
root=Path(__file__).resolve().parents[3];out=Path(__file__).resolve().parent
previous=json.loads((root/'.eval-artifacts/phase3a-prime/f1/replay-freeze.json').read_text())
files={};changed=[];removed=[]
for p,h in previous['files'].items():
 path=root/p
 if not path.exists():
  assert p=='src/harness/browser/browser-read-fixture.test.ts',p
  removed.append(p);continue
 current=hashlib.sha256(path.read_bytes()).hexdigest()
 if current!=h:
  assert (p.startswith('src/') and p.endswith('.test.ts')) or p.startswith('docs/skills/test/') or p in ['package.json','src/harness/browser/fixtures/PAGES.md'],(p,h,current)
  changed.append({'path':p,'beforeSha256':h,'currentSha256':current})
 files[p]=current
tracked=subprocess.check_output(['git','ls-files','-z','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json'],cwd=root).decode().split('\0')
extra=[str(p.relative_to(root)) for p in out.rglob('*') if p.is_file() and p.suffix in ['.py','.mjs']]+[str((out/'regressions/calibration-freeze.json').relative_to(root))]
for p in filter(None,tracked+extra):files[p]=hashlib.sha256((root/p).read_bytes()).hexdigest()
freeze={'schema':'f1b-offline-input-freeze@1','at':datetime.datetime.now(ZoneInfo('Europe/Vienna')).isoformat(),'codeCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root).decode().strip(),'mode':'OFFLINE_NO_NEW_MODEL_OR_NETWORK','priorFreeze':'.eval-artifacts/phase3a-prime/f1/replay-freeze.json','permittedChanges':'F1b tests/fixtures/test commands/read guard only; historical evaluation inputs and production unchanged','changesFromPreviousFreeze':changed,'splitSourceRemoved':removed,'files':dict(sorted(files.items()))}
(out/'input-freeze.json').write_text(json.dumps(freeze,indent=2)+'\n')
rows=json.loads((out/'fixture-relocation.json').read_text())['files'];kinds=collections.Counter()
for row in rows:
 source=(root/row['sourceArtifact']).read_bytes();stored=(root/row['fixture']).read_bytes()
 assert hashlib.sha256(source).hexdigest()==row['sourceSha256']
 assert hashlib.sha256(stored).hexdigest()==row['storedSha256']
 if row['fixtureVersion']=='F1b path-only index projection':kinds['pathOnlyIndexes']+=1
 else:
  actual=gzip.decompress(stored) if row['fixtureVersion']=='F1b byte-preserving gzip' else stored
  assert actual==source,row['fixture'];kinds['exactContent']+=1
before=subprocess.check_output(['git','ls-tree','-r','--name-only','686ad69d','src'],cwd=root).decode().splitlines()
production=[p for p in before if p.endswith('.ts') and not p.endswith('.test.ts')]
for p in production:assert subprocess.check_output(['git','show','686ad69d:'+p],cwd=root)==(root/p).read_bytes(),p
old=subprocess.check_output(['git','show','686ad69d:src/harness/browser/browser-read-fixture.test.ts'],cwd=root).decode();new='\n'.join(p.read_text() for p in root.glob('src/harness/browser/browser-read-*.test.ts'))
count=lambda s:collections.Counter(re.findall(r'\bassert(?:\.\w+)?\s*\(',s))
assert count(old)==count(new)
audit={'at':freeze['at'],'existingNonTestTypeScriptUnchanged':len(production),'newTestHelper':'src/harness/browser/browser-read-test-fixtures.ts','originalLargeFileAssertionCallSites':sum(count(old).values()),'splitFileAssertionCallSites':sum(count(new).values()),'assertionCountsByMethod':dict(count(old)),'relocatedInputs':len(rows),'fixtureVerification':dict(kinds),'productScope':'No production/evaluator/Prompt/Schema/Gold changes; new non-test TS is only a shared browser-test fixture helper','sourcePacksPhysicalLines':473,'siteAdapterPhysicalLines':3864}
(out/'preservation-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
print('freeze files',len(files),'sha256',hashlib.sha256((out/'input-freeze.json').read_bytes()).hexdigest());print(json.dumps(audit))
