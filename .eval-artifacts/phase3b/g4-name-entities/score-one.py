"""Separate immediate S0 check; execution does not load the certified IDs."""
import json,sys
from pathlib import Path
old=Path('.eval-artifacts/phase3b/g4-e2e');namespace={}
exec(compile((old/'score.py').read_text().split('\ngold=',1)[0],str(old/'score.py'),'exec'),namespace)
load=namespace['load'];gold={r['id']:r for r in load(old/'gold.json')['rows']}
row=load(sys.argv[1]);result=namespace['score'](row,gold);print(json.dumps({'verdict':result['verdict']}))
