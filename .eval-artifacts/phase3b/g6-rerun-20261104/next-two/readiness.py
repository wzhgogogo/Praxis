"""Offline prerequisite check, no network/credentials/model."""
import subprocess,json,hashlib,datetime
from pathlib import Path
from zoneinfo import ZoneInfo
HERE=Path(__file__).resolve().parent
packs=json.loads((HERE/'packs.json').read_text())
for row in packs['slots']:
 p=Path(row['path']);assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256']
 pack=json.loads(p.read_text());d=datetime.date.fromisoformat(pack['cases'][0]['witness']['date']);now=datetime.datetime.now(ZoneInfo('Europe/Vienna')).date()
 assert 7<=(d-now).days<=14 and d.weekday()==2,'Re-materialize/freeze visit date before calls'
assert json.loads(Path('.eval-artifacts/phase3b/budget.json').read_text())['limits']=={'fullLive':34,'realModelCalls':1600,'environmentReruns':4,'evaluationPublicGET':425}
missing=[]
for label,revision in [('B','de2b7ecc'),('C1','aba06e16'),('C2','a96f4d4e')]:
 for tip in ['origin/main','HEAD']:
  if subprocess.run(['git','merge-base','--is-ancestor',revision,tip],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode:missing.append({'dependency':label,'revision':revision,'missingFrom':tip})
print(json.dumps({'ready':not missing,'missing':missing,'live':0,'publicGET':0,'realModel':0}))
raise SystemExit(1 if missing else 0)
