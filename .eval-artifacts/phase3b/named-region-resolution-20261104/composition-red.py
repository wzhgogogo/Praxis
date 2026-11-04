"""One isolated old-source challenge, exact frozen test and I/O; no workspace source mutation."""
import hashlib,json,os,pathlib,subprocess,tarfile,tempfile,time,io
root=pathlib.Path.cwd();out=root/'.eval-artifacts/phase3b/named-region-resolution-20261104'
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
file='src/domains/restaurant/named-outlet-resolution.ts'
old=subprocess.check_output(['git','show','be84674e:'+file])
with tempfile.TemporaryDirectory(prefix='praxis-d8-red-',dir='/private/tmp') as folder:
    temp=pathlib.Path(folder)
    archive=subprocess.check_output(['git','archive','HEAD','src','scripts','package.json','package-lock.json','tsconfig.json'])
    with tarfile.open(fileobj=io.BytesIO(archive)) as tar:tar.extractall(temp,filter='data')
    (temp/file).write_bytes(old)
    (temp/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
    start=time.monotonic()
    with (out/'red-composition.log').open('wb') as log:
        code=subprocess.run(['node','--import','tsx','--test','src/application/restaurant-named-unknown-peer.test.ts'],cwd=temp,stdout=log,stderr=subprocess.STDOUT,timeout=90).returncode
    result={'testSourceGit':head,'oldProductGit':'be84674e','oldProductSha256':hashlib.sha256(old).hexdigest(),'returnCode':code,'elapsedSeconds':time.monotonic()-start,'temporaryArchiveRemoved':True,'workspaceMutated':False,'externalCalls':0}
    (out/'red-composition.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result))
    assert code==1,'Old implementation must fail the actual presentation assertion'
