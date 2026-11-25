from pathlib import Path
import hashlib
import json
import os
import re
import shutil
import subprocess
import time

root = Path.cwd()
out = Path(__file__).resolve().parent
gates = out / "gates"
gates.mkdir()
previous = out.parent / "round-27-dining-date-p2"
expected = sorted(" D " + row["path"] for row in json.loads((previous / "midnight-recovery-plan.json").read_text())["rows"])
assert len(expected) == 652
profile = '(version 1)(allow default)(deny network-outbound)(allow network-outbound (remote ip "localhost:*"))'


def git(*args):
    return subprocess.check_output(["git", "--no-optional-locks", *args], text=True)


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


sha = git("rev-parse", "HEAD").strip()
source = git("rev-parse", "HEAD:src").strip()
scripts = ["run-acceptance.py", "verify-protection.py", "verify-build-assets.mjs", "inspect-browser-graph.py"]
inputs = {str(path.relative_to(root)): digest(path) for path in [
    *(out / name for name in scripts),
    out / "PLAN.md", out / "protection-baseline.json", out / "worktree-check.json",
]}
env = {key: os.environ[key] for key in ("PATH", "HOME", "TMPDIR") if key in os.environ}
rows = []


def inspect():
    status = git("status", "--porcelain=v1", "--untracked-files=all").splitlines()
    assert sorted(status) == expected, "Unexpected tracked or untracked worktree change"
    assert not git("diff", "--name-only", "HEAD", "--", "src/")
    assert git("rev-parse", "HEAD").strip() == sha
    assert all(digest(root / path) == value for path, value in inputs.items())
    return hashlib.sha256(json.dumps(status, separators=(",", ":")).encode()).hexdigest()


status = inspect()
(out / "freeze.json").write_text(json.dumps({
    "sha": sha, "sourceTree": source, "inputsSHA256": inputs, "statusSHA256": status,
    "wholeTreeClean": False, "sourceAndInputsClean": True, "declaredTrackedHistoricalMissing": len(expected),
}, indent=2) + "\n")


def run(name, args, *, sandbox=True, extra=None):
    start_status = inspect()
    start = time.monotonic()
    command = ["/usr/bin/sandbox-exec", "-p", profile, *args] if sandbox else args
    with (gates / (name + ".log")).open("x") as log:
        result = subprocess.run(command, env=env | (extra or {}), stdout=log, stderr=subprocess.STDOUT)
    seconds = time.monotonic() - start
    raw = (gates / (name + ".log")).read_text()
    summaries = [
        {"tests": int(n), "pass": int(p), "fail": int(f), "durationMs": float(ms)}
        for n, p, f, ms in re.findall(r"ℹ tests (\d+).*?ℹ pass (\d+)\nℹ fail (\d+).*?ℹ duration_ms ([\d.]+)", raw, re.S)
    ]
    row = {
        "name": name, "sha": sha, "sourceTree": source, "command": command,
        "exitCode": result.returncode, "seconds": seconds, "tests": summaries, "envLoaded": False,
        "statusBeforeSHA256": start_status, "statusAfterSHA256": inspect(),
        "environment": extra or {}, "wholeTreeClean": False, "sourceAndInputsClean": True,
    }
    rows.append(row)
    (gates / "manifest.json").write_text(json.dumps(rows, indent=2) + "\n")
    print(json.dumps(row), flush=True)
    if result.returncode:
        raise SystemExit(result.returncode)


for name, args in (
    ("typecheck", ["npm", "run", "typecheck"]),
    ("arch-check", ["npm", "run", "arch:check"]),
    ("build", ["npm", "run", "build"]),
    ("test", ["npm", "test"]),
    ("browser-fixture", ["npm", "run", "test:browser:fixture"]),
):
    # The Replay tests own their OS isolation. Wrapping this gate would nest sandbox-exec.
    visual = {
        "PRAXIS_ROUND29_VISUAL_OUTPUT": str(out / "states"),
        "PRAXIS_ROUND29_SHA": sha,
    } if name == "browser-fixture" else None
    run(name, args, sandbox=name != "browser-fixture", extra=visual)

fixture = Path("src/domains/restaurant/fixtures/booking-handoff/source.json")
built_fixture = Path("dist") / fixture.relative_to("src")
built_fixture.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(fixture, built_fixture)
(out / "dist-fixture.json").write_text(json.dumps({
    "sha": sha, "fixture": str(fixture), "sha256": digest(fixture), "distCopyMatches": digest(fixture) == digest(built_fixture),
}, indent=2) + "\n")
run("c1-built", ["node", "--import", "tsx", "--test", "src/harness/browser/cloudflare-cdp-isolation.test.ts"], extra={"PRAXIS_CDP_DIST": "1"})
run("build-assets", ["node", "--import", "tsx", str(out / "verify-build-assets.mjs")])
run("browser-graph", ["python3", str(out / "inspect-browser-graph.py")])
run("protection", ["python3", str(out / "verify-protection.py")])
