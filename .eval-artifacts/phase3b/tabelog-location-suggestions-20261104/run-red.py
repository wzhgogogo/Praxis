import hashlib,io,json,pathlib,subprocess,tarfile,tempfile,time
root=pathlib.Path.cwd();out=root/".eval-artifacts/phase3b/tabelog-location-suggestions-20261104"
files=["src/integrations/restaurant-search/native-restaurant-search.ts","src/integrations/restaurant-search/source-packs.ts","src/infrastructure/browser/browser-task-executor.ts"]
head=subprocess.check_output(["git","rev-parse","HEAD"],text=True).strip();versions=[]
with tempfile.TemporaryDirectory(prefix="praxis-location-red-",dir="/private/tmp") as folder:
 temp=pathlib.Path(folder);data=subprocess.check_output(["git","archive","HEAD","src","scripts","package.json","package-lock.json","tsconfig.json"])
 with tarfile.open(fileobj=io.BytesIO(data)) as archive:
  assert all(not pathlib.PurePosixPath(m.name).is_absolute() and ".." not in pathlib.PurePosixPath(m.name).parts for m in archive.getmembers());archive.extractall(temp)
 for file in files:
  data=subprocess.check_output(["git","show","be84674e:"+file]);(temp/file).write_bytes(data);versions.append({"path":file,"sha256":hashlib.sha256(data).hexdigest()})
 (temp/"node_modules").symlink_to(root/"node_modules",target_is_directory=True)
 with (out/"red-business.log").open("wb") as log:
  code=subprocess.run(["node","--import","tsx","--test","--test-concurrency=1","src/integrations/restaurant-search/location-suggestion-discovery.test.ts"],cwd=temp,stdout=log,stderr=subprocess.STDOUT,timeout=120).returncode
 (out/"red-business.json").write_text(json.dumps({"fixedTestGit":head,"oldProductGit":"be84674e","oldFiles":versions,"returnCode":code,"externalCalls":0,"scope":"Real Chromium/HAR ordinary production assembly with identical constructed source I/O; original product files only."},indent=2)+"\n")
 print("old implementation exit",code);assert code==1
