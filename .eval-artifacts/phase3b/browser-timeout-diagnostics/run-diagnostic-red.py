from pathlib import Path
import gzip, hashlib, json, subprocess, sys, time

root = Path.cwd()
out = Path(sys.argv[1]).resolve()
assert not out.exists() and not out.is_relative_to(root)
assert not subprocess.check_output(["git", "status", "--porcelain"])
out.mkdir(parents=True)
clone = out / "constructed-fixture"
fixture = clone / "src/harness/browser"
fixture.mkdir(parents=True)
(clone / "scripts").mkdir()
(clone / "node_modules").symlink_to(root / "node_modules", target_is_directory=True)
(clone / "package.json").write_text('{"type":"module"}\n')
base = "7c83e02ee78ccb18c9ddf6670a64823bb18a2c95"
old = subprocess.check_output(["git", "show", base + ":scripts/run-browser-fixtures.mjs"])
text = old.decode()
assert text.count("timeout: 600_000") == 1
text = text.replace("timeout: 600_000", "timeout: 3_000")
(clone / "scripts/run-browser-fixtures.mjs").write_text(text)
(clone / "scripts/test-filesystem-guard.mjs").write_bytes((root / "scripts/test-filesystem-guard.mjs").read_bytes())
for name in ("a-held", "b-finished", "c-held", "d-held", "e-held", "f-queued"):
    body = "" if name == "b-finished" else """
      await new Promise(resolve => {
        const timer = setInterval(() => {}, 1000);
        t.signal.addEventListener('abort', () => { clearInterval(timer); resolve(); }, {once:true});
      });
    """
    (fixture / (name + ".test.ts")).write_text("import test from 'node:test';\n"
        + f"test({json.dumps(name + ' lifecycle step')}, async t => {{ console.log({json.dumps(name + ' partial output')}); {body} }});\n")
started = time.monotonic()
with (out / "red.log").open("wb") as log:
    result = subprocess.run(["node", "scripts/run-browser-fixtures.mjs"], cwd=clone,
                            stdout=log, stderr=subprocess.STDOUT, timeout=20)
raw = (out / "red.log").read_bytes()
(out / "red.log.gz").write_bytes(gzip.compress(raw, mtime=0))
text = raw.decode()
assert result.returncode != 0 and "ETIMEDOUT" in text and "a-held partial output" in text, text
diagnostic_present = "UNFINISHED" in text and "a-held.test.ts" in text and "elapsedMs" in text
receipt = {"base": base, "mode": "LOCAL_CONSTRUCTED_DIAGNOSTIC_CONTRACT_RED",
           "notIntermittent600SecondReproduction": True,
           "onlyLegacyOuterGuardScaledMs": [600000, 3000], "originalEntrySha256": hashlib.sha256(old).hexdigest(),
           "constructedEntrySha256": hashlib.sha256((clone / "scripts/run-browser-fixtures.mjs").read_bytes()).hexdigest(),
           "exitCode": result.returncode, "elapsedSeconds": round(time.monotonic() - started, 3),
           "partialOutputRetained": True, "requiredUnfinishedFileElapsedDiagnostic": diagnostic_present,
           "targetAssertion": "assert diagnostic contains UNFINISHED, a-held.test.ts and elapsedMs",
           "targetAssertionFailed": not diagnostic_present, "rawLogSha256": hashlib.sha256(raw).hexdigest(),
           "realCalls": 0}
(out / "red.json").write_text(json.dumps(receipt, indent=2) + "\n")
assert not diagnostic_present, "The old path unexpectedly meets the new diagnostic contract"
assert not subprocess.check_output(["git", "status", "--porcelain"])
print(json.dumps(receipt), flush=True)
