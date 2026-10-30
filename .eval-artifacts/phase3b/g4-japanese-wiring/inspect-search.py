"""Existing independent query/ItemList/heading binding, no Gold loaded."""
import importlib.util,json,sys
from pathlib import Path
path='.eval-artifacts/phase3b/c-batch2/score-search.py'
spec=importlib.util.spec_from_file_location('frozen_search_oracle',path)
oracle=importlib.util.module_from_spec(spec);spec.loader.exec_module(oracle)
result=oracle.inspect(Path(sys.argv[1]).read_text(),sys.argv[2],sys.argv[3])
print(json.dumps({k:result[k] for k in ['queryVisible','structureVerified']}))
