"""Task-local pinned Linux runtime; bounded downloads, verified before use."""
from pathlib import Path
from urllib.request import Request, urlopen
import concurrent.futures, hashlib, json, tarfile, time

root = Path('/private/tmp/praxis-f3-small-fixes-20261026-vm')
root.mkdir(exist_ok=False)
lima_url = 'https://github.com/lima-vm/lima/releases/download/v2.2.1/lima-2.2.1-Darwin-arm64.tar.gz'
lima_hash = '9e9eacce88f37e185c346bad73aa6136f738d8cdf8c3bb23cd42b071824bc66e'
with urlopen(lima_url, timeout=60) as stream: data = stream.read()
assert hashlib.sha256(data).hexdigest() == lima_hash
(root / 'lima.tar.gz').write_bytes(data)
with tarfile.open(root / 'lima.tar.gz') as archive:
    assert all(not Path(member.name).is_absolute() and '..' not in Path(member.name).parts for member in archive.getmembers())
    archive.extractall(root / 'runtime')
print('Verified Lima2.2.1', flush=True)
url = 'https://cloud.debian.org/images/cloud/bookworm/20260923-2610/debian-12-genericcloud-arm64-20260923-2610.qcow2'
size = 340590592; chunk = 4 * 1024 * 1024
expected = '89a752d5c7d8e88bee39a57d88d496cca574f7d1e8df5df7a169825435f99feb11ed13ab27ec7bee96fe1584be4ff9479358fbca6cc859efa109f4aba18724c8'
parts = root / 'parts'; parts.mkdir()
started = time.monotonic()
def download(index):
    start = index * chunk; end = min(size, start + chunk) - 1
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
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    list(pool.map(download, range(count)))
digest = hashlib.sha512()
with (root / 'debian.qcow2').open('wb') as output:
    for index in range(count):
        data = (parts / str(index)).read_bytes(); output.write(data); digest.update(data)
assert digest.hexdigest() == expected
receipt = {'runtimeUrl': lima_url, 'runtimeSha256': lima_hash, 'imageUrl': url,
           'imageSha512': expected, 'imageBytes': size, 'verified': True,
           'method': '4MiB HTTP ranges, eight workers, at most one retry per failed part',
           'downloadSeconds': round(time.monotonic() - started, 3)}
(root / 'download-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
print('Verified official image SHA512', flush=True)
