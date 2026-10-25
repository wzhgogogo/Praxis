from pathlib import Path
from urllib.request import Request,urlopen
import concurrent.futures,hashlib,json,time
root=Path('/private/tmp/praxis-review-followup-a-20261025-vm');parts=root/'parts'
url='https://saimei.ftp.acc.umu.se/images/cloud/bookworm/20260923-2610/debian-12-genericcloud-arm64-20260923-2610.qcow2'
started=time.monotonic()
def fragment(i):
 p=parts/f'49-{i}'
 if p.exists() and p.stat().st_size==524288:return
 a=49*4194304+i*524288;b=a+524288-1
 with urlopen(Request(url+f'?codex_health_part=49-{i}',headers={'Range':f'bytes={a}-{b}'}),timeout=35) as response:
  assert response.status==206 and response.headers['Content-Range']==f'bytes {a}-{b}/340590592'
  data=response.read()
 assert len(data)==524288;p.write_bytes(data);print('Fragment',i,'complete',flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(fragment,range(8)))
(parts/'49').write_bytes(b''.join((parts/f'49-{i}').read_bytes() for i in range(8)))
digest=hashlib.sha512()
with (root/'debian.qcow2').open('wb') as f:
 for i in range(82):
  data=(parts/str(i)).read_bytes();f.write(data);digest.update(data)
expected='89a752d5c7d8e88bee39a57d88d496cca574f7d1e8df5df7a169825435f99feb11ed13ab27ec7bee96fe1584be4ff9479358fbca6cc859efa109f4aba18724c8'
assert digest.hexdigest()==expected
receipt={'imageUrl':'https://cloud.debian.org/images/cloud/bookworm/20260923-2610/debian-12-genericcloud-arm64-20260923-2610.qcow2','actualMirror':url,'imageSha512':expected,'imageBytes':340590592,'verified':True,'method':'4MiB ranges; failed range49 completed by eight512KiB ranges with cache-disambiguating queries; all bytes match official SHA512','finalSubdivisionSeconds':time.monotonic()-started,'runtimeSha256':hashlib.sha256((root/'lima.tar.gz').read_bytes()).hexdigest()}
(root/'download-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print('Verified official image SHA512',flush=True)
