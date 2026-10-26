#!/bin/bash
set -euo pipefail
sudo apt-get update
sudo apt-get install -y --no-install-recommends ca-certificates curl xz-utils git python3 util-linux
mkdir -p /tmp/praxis-node
cd /tmp/praxis-node
curl -fsSLO https://nodejs.org/dist/v24.4.1/node-v24.4.1-linux-arm64.tar.xz
curl -fsSLO https://nodejs.org/dist/v24.4.1/SHASUMS256.txt
grep ' node-v24.4.1-linux-arm64.tar.xz$' SHASUMS256.txt | sha256sum --check -
sudo tar -xJf node-v24.4.1-linux-arm64.tar.xz -C /usr/local --strip-components=1
mkdir -p "$HOME/praxis-health"
tar -xf /tmp/praxis-health-source.tar -C "$HOME/praxis-health"
cd "$HOME/praxis-health"
git init -q
git add .
git -c user.name='Offline fixture' -c user.email='fixture@localhost' commit -qm 'Frozen complete repository snapshot'
npm ci --no-audit --no-fund
npx playwright-core install --with-deps --only-shell chromium
node --version
uname -a
id
