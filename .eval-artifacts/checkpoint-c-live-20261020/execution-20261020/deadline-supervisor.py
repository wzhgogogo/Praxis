"""Execution-only hard deadline around the unchanged approved Checkpoint C outer."""
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def supervise(launch_path):
    launch_path = Path(launch_path).resolve()
    launch = json.loads(launch_path.read_text())
    deadline = datetime.fromisoformat(launch["hardDeadline"].replace("Z", "+00:00")).timestamp()
    records = launch_path.parent / launch.get("supervisorRecords", "supervisor")
    records.mkdir(exist_ok=False)
    start = {
        "at": utc_now(), "hardDeadline": launch["hardDeadline"],
        "launchSha256": hashlib.sha256(launch_path.read_bytes()).hexdigest(),
        "supervisorSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "command": launch["command"], "cwd": launch["cwd"],
        "approvedFreezeSha256": launch.get("approvedFreezeSha256"),
    }
    (records / "started.json").write_text(json.dumps(start, indent=2) + "\n")
    if time.time() >= deadline:
        finish = {"at": utc_now(), "status": "NOT_STARTED_DEADLINE", "returncode": None}
    else:
        with (records / "outer.stdout.txt").open("x") as out, (records / "outer.stderr.txt").open("x") as err:
            child = subprocess.Popen(launch["command"], cwd=launch["cwd"], stdout=out, stderr=err, start_new_session=True)
            (records / "process.json").write_text(json.dumps({"pid": child.pid, "processGroup": child.pid, "at": utc_now()}, indent=2) + "\n")
            print(json.dumps({"status": "STARTED", "pid": child.pid, "hardDeadline": launch["hardDeadline"]}), flush=True)
            status = "OUTER_EXITED"
            try:
                while child.poll() is None:
                    remaining = deadline - time.time()
                    if remaining <= 0:
                        os.killpg(child.pid, signal.SIGKILL)
                        status = "STOPPED_HARD_DEADLINE"
                        break
                    try:
                        child.wait(timeout=min(30, remaining))
                    except subprocess.TimeoutExpired:
                        pass
            except BaseException:
                os.killpg(child.pid, signal.SIGKILL)
                child.wait()
                (records / "finish.json").write_text(json.dumps({"at": utc_now(), "status": "SUPERVISOR_INTERRUPTED", "returncode": child.returncode}, indent=2) + "\n")
                raise
            child.wait()
            finish = {"at": utc_now(), "status": status, "returncode": child.returncode}
    (records / "finish.json").write_text(json.dumps(finish, indent=2) + "\n")
    print(json.dumps(finish), flush=True)
    return 0 if finish["status"] == "OUTER_EXITED" and finish["returncode"] == 0 else 1


if __name__ == "__main__":
    sys.exit(supervise(sys.argv[1]))
