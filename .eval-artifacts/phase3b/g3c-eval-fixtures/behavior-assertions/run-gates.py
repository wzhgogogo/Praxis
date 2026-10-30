from pathlib import Path
import datetime
import gzip
import hashlib
import json
import os
import subprocess
import sys
import time
from zoneinfo import ZoneInfo

root = Path.cwd()
item = Path(__file__).resolve().parent
out = Path(sys.argv[1]).resolve()
assert not out.exists(), "Do not overwrite a gate run"
assert not out.is_relative_to(root), "Gate outputs stay outside the worktree"
out.mkdir(parents=True)
frozen = json.loads((item / "inputs-sha256.json").read_text())["files"]


def check():
    status = subprocess.check_output(["git", "status", "--porcelain"], text=True)
    assert not status, status
    changed = [p for p, sha in frozen.items() if hashlib.sha256((root / p).read_bytes()).hexdigest() != sha]
    assert not changed, changed
    return status


commands = [
    ("typecheck", ["npm", "run", "typecheck"], {}),
    ("arch-check", ["npm", "run", "arch:check"], {}),
    ("npm-test", ["npm", "test"], {}),
    ("build", ["npm", "run", "build"], {}),
    ("browser-fixture", ["npm", "run", "test:browser:fixture"], {}),
    ("strict-dom-change", ["npm", "run", "test:dom-change"], {"PRAXIS_G2_REQUIRE_PASS": "1"}),
]
receipt = {
    "commit": subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip(),
    "startedAtCET": datetime.datetime.now(datetime.timezone.utc).astimezone(ZoneInfo("Europe/Vienna")).isoformat(),
    "mode": "OFFLINE_FIXTURE",
    "inputCount": len(frozen),
    "checks": [],
}
for name, command, overrides in commands:
    before = check()
    start = time.monotonic()
    with (out / (name + ".log")).open("wb") as stream:
        result = subprocess.run(command, stdout=stream, stderr=subprocess.STDOUT, env={**os.environ, **overrides})
    elapsed = time.monotonic() - start
    after = check()
    raw = (out / (name + ".log")).read_bytes()
    (out / (name + ".log.gz")).write_bytes(gzip.compress(raw, mtime=0))
    receipt["checks"].append({"name": name, "command": command, "environmentOverrides": overrides,
        "exitCode": result.returncode, "status": "PASS" if result.returncode == 0 else "FAIL",
        "elapsedSeconds": round(elapsed, 3), "gitStatusBefore": before, "gitStatusAfter": after,
        "frozenInputsUnchanged": len(frozen), "rawLogSha256": hashlib.sha256(raw).hexdigest()})
    (out / "gates.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(name, result.returncode, round(elapsed, 3), flush=True)
receipt["status"] = "PASS" if all(row["exitCode"] == 0 for row in receipt["checks"]) else "FAIL"
(out / "gates.json").write_text(json.dumps(receipt, indent=2) + "\n")
sys.exit(0 if receipt["status"] == "PASS" else 1)
