#!/bin/bash
set -euo pipefail
sudo apt-get update
sudo apt-get install -y --no-install-recommends ca-certificates curl xz-utils git python3 util-linux iproute2
mkdir -p /tmp/praxis-node
cd /tmp/praxis-node
curl -fsSLO https://nodejs.org/dist/v24.4.1/node-v24.4.1-linux-arm64.tar.xz
curl -fsSLO https://nodejs.org/dist/v24.4.1/SHASUMS256.txt
grep ' node-v24.4.1-linux-arm64.tar.xz$' SHASUMS256.txt | sha256sum --check -
sudo tar -xJf node-v24.4.1-linux-arm64.tar.xz -C /usr/local --strip-components=1
mkdir -p "$HOME/praxis-f3-small-fixes"
tar -xzf /tmp/praxis-f3-small-fixes-source.tar.gz -C "$HOME/praxis-f3-small-fixes"
cd "$HOME/praxis-f3-small-fixes"
git init -q
git add .
git -c user.name='Offline fixture' -c user.email='fixture@localhost' commit -qm 'Frozen tracked repository snapshot'
npm ci --no-audit --no-fund
npx playwright-core install --with-deps --only-shell chromium
python3 - <<'PY'
from pathlib import Path
import hashlib,json,subprocess
binary=Path.home()/'.cache/ms-playwright/chromium_headless_shell-1234/chrome-linux/headless_shell'
assert binary.is_file()
alias=Path('/opt/google/chrome/chrome');assert not alias.exists()
subprocess.run(['sudo','mkdir','-p',str(alias.parent)],check=True)
subprocess.run(['sudo','ln','-s',str(binary),str(alias)],check=True)
receipt={'purpose':'Existing static-DOM default test hardcodes chrome channel; explicit Guest-only real Chromium alias, not branded Google Chrome verification','version':subprocess.check_output([str(binary),'--version'],text=True).strip(),'binary':str(binary),'binarySha256':hashlib.sha256(binary.read_bytes()).hexdigest(),'alias':str(alias)}
Path('/tmp/praxis-f3-small-fixes-chrome-alias.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt),flush=True)
PY
node --version
uname -a
id
