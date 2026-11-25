from pathlib import Path
import hashlib
import json
import subprocess
import sys

root = Path.cwd()
out = Path(__file__).resolve().parent
previous = out.parent / "round-27-dining-date-p2"
before = out / "protection-baseline.json"
base_commit = "83978838cb514a29d06c69dbafa4235503ded746"
main = Path("/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing")
closeout = Path("/private/tmp/praxis-3c-closeout")
tracked_plan = json.loads((previous / "midnight-recovery-plan.json").read_text())["rows"]
original = json.loads((previous / "protection-baseline.json").read_text())
old_archives = json.loads((previous / "artifact-sha256.json").read_text())["files"]
historical = original["historySHA256"] | {str((previous / key).relative_to(root)): digest for key, digest in old_archives.items()}
historical[str((previous / "artifact-sha256.json").relative_to(root))] = hashlib.sha256((previous / "artifact-sha256.json").read_bytes()).hexdigest()
earlier = set(original["knownMissing"])
expected_missing = {r["path"] for r in tracked_plan} | {
    row["path"] for row in json.loads((previous / "additional-historical-gap.json").read_text())["rows"]
}
expected_status = sorted(" D " + r["path"] for r in tracked_plan)
protected_source = (
    "src/domains/restaurant/semantic-proposal.ts", "src/domains/restaurant/semantic-interpreter.ts",
    "src/domains/restaurant/semantic-compiler.ts", "src/domains/restaurant/temporal-materialization.ts",
    "src/domains/restaurant/intent-state.ts", "src/domains/restaurant/search-fingerprint.ts",
    "src/eval/restaurant/semantic/scorer.ts", "src/application/restaurant-agent-loop.ts",
    "docs/decisions/0052-relative-day-offset-and-date-binding.md", "package.json", "package-lock.json", "tsconfig.web.json",
)


def git(*args):
    return subprocess.check_output(["git", "--no-optional-locks", *args])


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def snapshot():
    return {
        "main": {
            key: hashlib.sha256(git("-C", str(main), *args)).hexdigest()
            for key, args in {
                "head": ["rev-parse", "HEAD"],
                "status": ["status", "--porcelain=v1", "--untracked-files=all"],
                "index": ["diff", "--cached", "--binary"],
                "diff": ["diff", "--binary"],
            }.items()
        },
        "mainEnvSHA256": sha(main / ".env"),
        "sparseSHA256": sha(original["sparsePath"]),
        "closeoutFiles": {
            key: sha(closeout / key)
            for key in json.loads((out.parent / "round-23/closeout-protection.json").read_text())["snapshot"]["materializedFilesExcludingDependencies"]
        },
    }


def inspect():
    missing = [key for key in historical if not (root / key).is_file()]
    modified = [key for key, expected in historical.items() if (root / key).is_file() and sha(root / key) != expected]
    prior_missing = sorted(key for key in earlier if not (root / key).is_file())
    protected_diff = git("diff", "--name-only", base_commit, "--", *protected_source).decode().splitlines()
    status = git("status", "--porcelain=v1", "--untracked-files=all").decode().splitlines()
    return {
        "historicalBaselinePaths": len(historical),
        "historicalPresentMatching": len(historical) - len(missing) - len(modified),
        "historicalPresentModified": modified,
        "declaredTrackedMissing": len(tracked_plan),
        "declaredLaterUntrackedMissing": len(expected_missing) - len(tracked_plan),
        "earlierUntrackedMissing": len(prior_missing),
        "additionalMissingSinceRound27": sorted(set(missing) - expected_missing),
        "previouslyMissingNowPresent": sorted((expected_missing - set(missing)) | (earlier - set(prior_missing))),
        "protectedSourceChanges": protected_diff,
        "historicalGitStatusStable": sorted(line for line in status if line.startswith(" D ")) == expected_status,
    }


state = inspect()
assert not state["historicalPresentModified"] and not state["previouslyMissingNowPresent"], state
assert not state["additionalMissingSinceRound27"] and state["historicalGitStatusStable"], state
assert not state["protectedSourceChanges"], state
current = snapshot()
if sys.argv[1:] == ["--baseline"]:
    assert not before.exists()
    before.write_text(json.dumps({"baseline": base_commit, "state": state, "workspaceSnapshot": current}, indent=2) + "\n")
    print("Round28 protection baseline saved")
else:
    initial = json.loads(before.read_text())
    assert state == initial["state"] and current == initial["workspaceSnapshot"], "Protected worktree state changed"
    result = {"sha": git("rev-parse", "HEAD").decode().strip(), **state,
              "scopeVerification": "PASS_NO_ADDITIONAL_PROTECTION_CHANGE",
              "historicalSignoff": "BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS",
              "mainWorkspaceUnchanged": True, "mainEnvUnchanged": True, "sparseUnchanged": True,
              "closeoutFilesUnchanged": len(current["closeoutFiles"]), "historicalFilesRestored": 0}
    (out / "protection-verification.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result))
