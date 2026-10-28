#!/bin/bash
set -euo pipefail
cd "$HOME/praxis-g1-timing"
mkdir -p /tmp/g1-timing-validation/red-1
node -e 'console.log(JSON.stringify({cpus:require("node:os").availableParallelism(),platform:process.platform,node:process.version}))' > /tmp/g1-timing-validation/red-1/environment.json
test -z "$(git status --porcelain)"
unshare -rn sh -c 'ip link set lo up; ip -brief addr; cat /proc/net/route' > /tmp/g1-timing-validation/red-1/network.txt
set +e
unshare -rn sh -c 'ip link set lo up; exec taskset -c 0,1 npm run test:browser:fixture' > /tmp/g1-timing-validation/red-1/chromium.log 2>&1
code=$?
set -e
printf '%s\n' "$code" > /tmp/g1-timing-validation/red-1/exit-code.txt
git status --porcelain > /tmp/g1-timing-validation/red-1/status-after.txt
printf 'Full-suite red run exit %s\n' "$code"
