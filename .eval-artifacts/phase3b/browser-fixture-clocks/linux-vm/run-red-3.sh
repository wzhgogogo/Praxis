#!/bin/bash
set -euo pipefail
cd "$HOME/praxis-g1-timing"
output=/tmp/g1-timing-validation/red-3
mkdir -p "$output"
sudo mkdir -p /sys/fs/cgroup/praxis-timing-stress
printf '25000 100000\n' | sudo tee /sys/fs/cgroup/praxis-timing-stress/cpu.max >/dev/null
printf '%s\n' "$$" | sudo tee /sys/fs/cgroup/praxis-timing-stress/cgroup.procs >/dev/null
cat /sys/fs/cgroup/praxis-timing-stress/cpu.max > "$output/cpu.max"
cat /proc/self/status | grep Cpus_allowed > "$output/cpu-affinity.txt"
test -z "$(git status --porcelain)"
set +e
unshare -rn sh -c 'ip link set lo up; exec timeout 240s taskset -c 0,1 node --import ./scripts/test-filesystem-guard.mjs --import tsx --test --test-concurrency=4 src/harness/browser/dom-change.test.ts src/harness/browser/live-source-health.test.ts src/harness/browser/browser-read-discovery.test.ts src/harness/browser/browser-read-request-binding.test.ts' > "$output/chromium.log" 2>&1
code=$?
set -e
printf '%s\n' "$code" > "$output/exit-code.txt"
cat /sys/fs/cgroup/praxis-timing-stress/cpu.stat > "$output/cpu.stat"
git status --porcelain > "$output/status-after.txt"
