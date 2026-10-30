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
assert not out.exists() and not out.is_relative_to(root)
out.mkdir(parents=True)
source = "src/harness/browser/browser-read-request-binding.test.ts"
frozen = json.loads((item / "inputs-sha256.json").read_text())["files"]


def git(*args, cwd=root):
    return subprocess.check_output(["git", *args], cwd=cwd, text=True).strip()


def check():
    assert not git("status", "--porcelain")
    for path, sha in frozen.items():
        assert hashlib.sha256((root / path).read_bytes()).hexdigest() == sha, path


check()
head = git("rev-parse", "HEAD")
receipt = {"commit": head, "mode": "OFFLINE_LOCAL_CHROMIUM_FIXTURE_MODEL",
           "startedAtCET": datetime.datetime.now(datetime.timezone.utc).astimezone(ZoneInfo("Europe/Vienna")).isoformat(),
           "newRealCalls": 0, "runs": []}
command = ["node", "--import", "./scripts/test-filesystem-guard.mjs", "--import", "tsx", "--test",
           "--test-name-pattern=^native dynamic Tabelog (AVAILABLE|UNAVAILABLE) reaches formal H001", source]


def isolate(name, transform):
    clone = out / (name + "-checkout")
    subprocess.run(["git", "clone", "--shared", "--no-checkout", str(root), str(clone)],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    subprocess.run(["git", "config", "core.sparseCheckout", "true"], cwd=clone, check=True)
    (clone / ".git/info/sparse-checkout").write_text("/*\n!/.eval-artifacts/\n!/.env\n")
    subprocess.run(["git", "checkout", "--detach", head], cwd=clone, check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    (clone / "node_modules").symlink_to(root / "node_modules", target_is_directory=True)
    with (clone / ".git/info/exclude").open("a") as stream:
        stream.write("\n/node_modules\n")
    assert not (clone / ".env").exists() and not (clone / ".eval-artifacts").exists()
    original = (clone / source).read_text()
    changed = transform(original)
    assert changed != original
    (clone / source).write_text(changed)
    patch = subprocess.check_output(["git", "diff", "--", source], cwd=clone)
    (out / (name + ".patch")).write_bytes(patch)
    subprocess.run(["git", "add", source], cwd=clone, check=True)
    subprocess.run(["git", "-c", "user.name=Offline controlled fixture fault", "-c", "user.email=fixture@invalid.local",
                    "commit", "-m", name], cwd=clone, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    assert git("diff", "--name-only", head, "HEAD", cwd=clone) == source
    return clone


def drop_judgment(text):
    anchor = '  const native = createLiveReadAssembly(LIVE_READ_DEBUG_INVESTIGATION_BUDGET, { google, browser: runtime, model, clock: { now: () => reference } });\n'
    assert text.count(anchor) == 1
    fault = '''  // CONTROLLED LOCAL FAULT: drop accepted judgments at the fact-port boundary.
  // Keep COMPLETED and raw evidence so earlier checks cannot mask the new assertion.
  const inspectFacts = native.facts.inspectFacts.bind(native.facts);
  native.facts.inspectFacts = async (request, signal) => {
    const read = await inspectFacts(request, signal);
    const dropped = new Set(read.evidence.filter(item => item.provider === "MODEL_JUDGMENT").map(item => item.evidenceId));
    return { ...read, evidence: read.evidence.filter(item => !dropped.has(item.evidenceId)),
      factChecks: Object.fromEntries(Object.entries(read.factChecks).map(([id, value]) =>
        [id, { ...value, evidenceIds: value.evidenceIds.filter(ref => !dropped.has(ref)) }])) };
  };
'''
    return text.replace(anchor, anchor + fault)


def stale_view(text):
    anchor = "    const successorFacts = restaurantCurrentFactEvidence(successor, candidateId);"
    assert text.count(anchor) == 1
    return text.replace(anchor, "    const successorFacts = restaurantCurrentFactEvidence(state, candidateId); // CONTROLLED stale pre-refresh consumer")


def run(name, cwd, expected_pass, expected_fail, message=None):
    check()
    assert not git("status", "--porcelain", cwd=cwd)
    started = time.monotonic()
    with (out / (name + ".log")).open("wb") as stream:
        result = subprocess.run(command, cwd=cwd, stdout=stream, stderr=subprocess.STDOUT)
    raw = (out / (name + ".log")).read_bytes()
    (out / (name + ".log.gz")).write_bytes(gzip.compress(raw, mtime=0))
    text = raw.decode()
    assert not git("status", "--porcelain", cwd=cwd)
    check()
    row = {"name": name, "command": command, "cwd": str(cwd), "exitCode": result.returncode,
           "elapsedSeconds": round(time.monotonic() - started, 3), "expectedPass": expected_pass,
           "expectedFail": expected_fail, "gitStatusBefore": "", "gitStatusAfter": "",
           "rawLogSha256": hashlib.sha256(raw).hexdigest(), "inputCount": len(frozen)}
    receipt["runs"].append(row)
    (out / "controls.json").write_text(json.dumps(receipt, indent=2) + "\n")
    assert (result.returncode == 0) == (expected_fail == 0), text[-14000:]
    assert f"# pass {expected_pass}\n" in text and f"# fail {expected_fail}\n" in text, text[-14000:]
    if message:
        assert message in text, text[-14000:]
    row["verifiedExpectedOutcome"] = True
    print(name, result.returncode, row["elapsedSeconds"], flush=True)


run("unaccepted-judgment-red", isolate("unaccepted-judgment-red", drop_judgment), 0, 2,
    "current facts must contain an accepted MODEL_JUDGMENT verifying omakase")
run("stale-consumer-red", isolate("stale-consumer-red", stale_view), 1, 1,
    "a replacement investigation must exclude every old accepted judgment from current facts")
run("behavior-green", root, 2, 0)
receipt["status"] = "EXPECTED_REDS_AND_GREEN_VERIFIED"
(out / "controls.json").write_text(json.dumps(receipt, indent=2) + "\n")
