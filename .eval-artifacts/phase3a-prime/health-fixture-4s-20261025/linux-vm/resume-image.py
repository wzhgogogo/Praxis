from pathlib import Path
from urllib.request import Request,urlopen
import concurrent.futures,hashlib,json,time
root=Path('/private/tmp/praxis-review-followup-a-20261025-vm')
assert (root/'runtime/bin/limactl').exists()
lima_url='https://github.com/lima-vm/lima/releases/download/v2.2.1/lima-2.2.1-Darwin-arm64.tar.gz'
lima_hash='9e9eacce88f37e185c346bad73aa6136f738d8cdf8c3bb23cd42b071824bc66e'
assert hashlib.sha256((root/'lima.tar.gz').read_bytes()).hexdigest()==lima_hash
official_url = 'https://cloud.debian.org/images/cloud/bookworm/20260923-2610/debian-12-genericcloud-arm64-20260923-2610.qcow2'
url = 'https://saimei.ftp.acc.umu.se/images/cloud/bookworm/20260923-2610/debian-12-genericcloud-arm64-20260923-2610.qcow2'
size = 340590592; chunk = 4 * 1024 * 1024
expected = '89a752d5c7d8e88bee39a57d88d496cca574f7d1e8df5df7a169825435f99feb11ed13ab27ec7bee96fe1584be4ff9479358fbca6cc859efa109f4aba18724c8'
parts = root / 'parts'; parts.mkdir(exist_ok=True)
started = time.monotonic()
def download(index):
    start = index * chunk; end = min(size, start + chunk) - 1
    existing=parts/str(index)
    if existing.exists() and existing.stat().st_size==end-start+1:return
    for attempt in range(2):
        try:
            with urlopen(Request(url, headers={'Range': f'bytes={start}-{end}'}), timeout=45) as response:
                assert response.status == 206 and response.headers['Content-Range'] == f'bytes {start}-{end}/{size}'
                data = response.read()
            assert len(data) == end - start + 1
            (parts / str(index)).write_bytes(data)
            print('Image part', index, 'verified length', len(data), flush=True)
            return
        except Exception:
            if attempt: raise
            print('Retry one image part', index, flush=True)
count = (size + chunk - 1) // chunk
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(download, range(count)))
digest = hashlib.sha512()
with (root / 'debian.qcow2').open('wb') as output:
    for index in range(count):
        data = (parts / str(index)).read_bytes(); output.write(data); digest.update(data)
assert digest.hexdigest() == expected
receipt = {'runtimeUrl': lima_url, 'runtimeSha256': lima_hash, 'imageUrl': official_url, 'actualMirror': url,
           'imageSha512': expected, 'imageBytes': size, 'verified': True,
           'method': '4MiB HTTP ranges, four workers; resume missing parts only, at most one retry per failed part',
           'downloadSeconds': round(time.monotonic() - started, 3)}
(root / 'download-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
print('Verified official image SHA512', flush=True)
