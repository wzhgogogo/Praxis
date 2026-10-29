#!/bin/bash
set -euo pipefail
sudo apt-get update
sudo apt-get install -y --no-install-recommends ca-certificates curl xz-utils git python3 util-linux iproute2
mkdir -p /tmp/praxis-node
cd /tmp/praxis-node
curl -fsSLO https://nodejs.org/dist/v24.4.1/node-v24.4.1-linux-arm64.tar.xz
curl -fsSLO https://nodejs.org/dist/v24.4.1/SHASUMS256.txt
python3 - <<'PY'
from pathlib import Path
import hashlib
name='node-v24.4.1-linux-arm64.tar.xz'
expected=next(row.split()[0] for row in Path('SHASUMS256.txt').read_text().splitlines() if row.endswith(' '+name))
assert hashlib.sha256(Path(name).read_bytes()).hexdigest()==expected
PY
sudo tar -xJf node-v24.4.1-linux-arm64.tar.xz -C /usr/local --strip-components=1
mkdir -p "$HOME/praxis-g2-scheduling"
tar -xzf /tmp/source.tar.gz -C "$HOME/praxis-g2-scheduling"
cd "$HOME/praxis-g2-scheduling"
test ! -f .env
git init -q
git add -f .
git -c user.name='Offline fixture' -c user.email='fixture@localhost' commit -qm 'Unmodified main b2a3cbd3 tracked source archive'
npm ci --no-audit --no-fund
npx playwright-core install --with-deps --only-shell chromium
python3 - <<'PY'
from pathlib import Path
import hashlib,json,subprocess
binaries=list((Path.home()/'.cache/ms-playwright').glob('chromium_headless_shell-*/**/headless_shell'));assert len(binaries)==1
binary=binaries[0];alias=Path('/opt/google/chrome/chrome');assert not alias.exists()
subprocess.run(['sudo','mkdir','-p',str(alias.parent)],check=True);subprocess.run(['sudo','ln','-s',str(binary),str(alias)],check=True)
Path('/tmp/praxis-g2-chrome-alias.json').write_text(json.dumps({'purpose':'Guest-only real Chromium for existing channel=chrome static-DOM fixture; not a branded Chrome verification','version':subprocess.check_output([str(binary),'--version'],text=True).strip(),'binarySha256':hashlib.sha256(binary.read_bytes()).hexdigest()},indent=2)+'\n')
PY
node --version
uname -a
id
