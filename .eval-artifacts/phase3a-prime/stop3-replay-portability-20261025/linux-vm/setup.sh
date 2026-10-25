#!/bin/bash
set -euo pipefail
# Guest-only setup; limactl invokes this inside the disposable Linux VM.
sudo apt-get update
sudo apt-get install -y --no-install-recommends ca-certificates curl xz-utils git python3 util-linux
mkdir -p /tmp/praxis-node
cd /tmp/praxis-node
curl -fsSLO https://nodejs.org/dist/v24.4.1/node-v24.4.1-linux-arm64.tar.xz
curl -fsSLO https://nodejs.org/dist/v24.4.1/SHASUMS256.txt
grep ' node-v24.4.1-linux-arm64.tar.xz$' SHASUMS256.txt | sha256sum --check -
sudo tar -xJf node-v24.4.1-linux-arm64.tar.xz -C /usr/local --strip-components=1
mkdir -p "$HOME/praxis-replay"
tar -xf /tmp/praxis-replay-source.tar -C "$HOME/praxis-replay"
cd "$HOME/praxis-replay"
git init
git add .
git -c user.name='Offline fixture' -c user.email='fixture@localhost' commit -qm 'Frozen repository snapshot for Linux validation'
npm ci
npx playwright-core install --with-deps chromium
node --version
uname -a
id
