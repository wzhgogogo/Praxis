"""Offline metrics only. Reads original G6 verdicts without changing/regrading them."""
from request_metrics import request_summary
import collections
import hashlib
import json
from pathlib import Path
from datetime import datetime
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]


def load(path):
    return json.loads(path.read_text())


def ms(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp() * 1000


def cet(value):
    return datetime.fromtimestamp(ms(value) / 1000, ZoneInfo("Europe/Vienna")).isoformat()


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def phone(value):
    value = "".join(c for c in value or "" if c.isdigit())
    return "0" + value[2:] if value.startswith("81") else value


observations = []
for group in ["runs"]:
    for slot in sorted((HERE / group).glob("*/*")):
        if not slot.is_dir() or not (slot / "execution.result.json").exists():
            continue
        raw = load(slot / "execution.result.json")
        run, view = raw["execution"], raw["view"]
        state = run["finalSnapshot"]["domainState"]
        verdict = load(slot / "evaluation.json")
        recording = load(slot / "recording-observation.json")
        boundary = load(slot / "boundary-observation.json")
        decisions = [json.loads(line) for line in (slot / "execution.decisions.jsonl").read_text().splitlines()]
        traces = load(slot / "browser-trace.json")["events"]
        starts = {e["detail"]["operationId"]: e for e in traces if e["kind"] == "OPERATION_STARTED"}
        spans, durations, unmatched = [], collections.defaultdict(float), set(starts)
        for e in traces:
            if e["kind"] != "OPERATION_FINISHED" or e["detail"]["operationId"] not in starts:
                continue
            operation = e["detail"]["operationId"]
            start = starts[operation]
            unmatched.discard(operation)
            method = e["detail"]["method"]
            duration = ms(e["at"]) - ms(start["at"])
            assert duration >= 0
            durations[method] += duration
            stage = {"openSession": "SESSION_STARTUP", "navigate": "PAGE_LOAD_OPERATION_PROXY", "openLink": "PAGE_LOAD_OPERATION_PROXY",
                     "snapshot": "READ_PAGE_STRUCTURE", "observeControls": "READ_PAGE_STRUCTURE", "waitForSettled": "POST_OPERATION_WAIT",
                     "screenshotLayoutOnly": "RECORDING_SCREENSHOT", "close": "SESSION_CLOSE"}.get(method, "PAGE_OPERATION")
            spans.append((ms(start["at"]), ms(e["at"]), stage, 1))
        purposes = collections.defaultdict(lambda: {"count": 0, "latencyMs": 0})
        for d in decisions:
            purposes[d["purpose"]]["count"] += 1
            purposes[d["purpose"]]["latencyMs"] += d.get("latencyMs") or 0
            if isinstance(d.get("latencyMs"), (float, int)):
                start = ms(d["startedAt"])
                spans.append((start, start + d["latencyMs"], "MODEL:" + d["purpose"], 2))
        run_start = boundary["readStarts"][0]["deadlineAtMs"] - 500000
        run_end = run_start + boundary["elapsedMs"]
        bounds = sorted({run_start, run_end, *[max(run_start, min(run_end, point)) for a, b, _, _ in spans for point in [a, b]]})
        exclusive = collections.defaultdict(float)
        for a, b in zip(bounds, bounds[1:]):
            active = sorted((s for s in spans if s[0] <= a and s[1] >= b), key=lambda s: s[3], reverse=True)
            exclusive[active[0][2] if active else "UNATTRIBUTED"] += b - a
        assert abs(sum(exclusive.values()) - boundary["elapsedMs"]) < 0.1
        presented = [e["occurredAt"] for e in run["events"] if e["event"]["type"] == "RESULTS_PRESENTED"]
        expected_phone = "03-6264-3229" if slot.name in ["D2", "D8"] else "03-5249-4011"
        witness = next((c for c in state["candidates"] if phone(c["restaurant"]["sourceIds"].get("phone")) == phone(expected_phone)), None)
        witness_id = witness["restaurant"]["id"] if witness else None
        rec_file = next((slot / "recordings").glob("*/recording.json"))
        rec = load(rec_file)
        snapshots = [e["detail"] for e in rec["entries"] if e["kind"] == "SNAPSHOT"]
        har_file = rec_file.parent / "replay.har"
        har = load(har_file) if har_file.exists() else {"log": {"entries": []}}
        scripts = {}
        captured_paths = {(urlsplit(e["request"]["url"]).netloc, urlsplit(e["request"]["url"]).path) for e in har["log"]["entries"]}
        for entry in rec["entries"]:
            if entry["kind"] != "NETWORK":
                continue
            for req in entry["detail"]:
                if req.get("resourceType") == "script" and (urlsplit(req["origin"]).netloc, req["pathname"]) not in captured_paths:
                    key = req["origin"].rstrip("/") + req["pathname"]
                    scripts[key] = {"origin": req["origin"], "path": req["pathname"], "outcome": req["outcome"]}
        observations.append({
            "newRequestedMetrics": request_summary(slot, traces),
            "id": slot.name, "group": group, "runId": raw["runId"],
            "verdict": verdict["verdict"], "evaluationSHA256": sha(slot / "evaluation.json"),
            "nonPassingChecks": [c for c in verdict["checks"] if c["status"] != "PASS"],
            "phase": view["case"]["phase"], "delivered": load(slot / "evaluation.input.json")["delivered"],
            "turns": raw["turns"], "handoffs": view["restaurant"].get("bookingHandoffs", []),
            "question": view["restaurant"].get("pageQuestion"),
            "elapsedMs": boundary["elapsedMs"], "turnBudgets": boundary.get("turnBudgets", []), "modelCalls": len(decisions), "modelsByPurpose": dict(purposes),
            "googleRequests": boundary["googleRequests"], "schemaRetries": boundary["semanticSchemaRetries"],
            "exclusiveWallMs": dict(exclusive), "operationInclusiveMs": dict(durations), "unfinishedOperations": sorted(unmatched),
            "timingLimit": "Method spans are source-operation proxies, not pure network latency. Parallel overlap uses model-first exclusive attribution. Slot duration includes setup; the first user-turn start anchors proxy bins, leaving setup/clock offsets unattributed. Per-turn durations and F6 deadlines are authoritative boundary observations; slot totals may exceed 500 seconds. Google wait and complete-evidence timestamp remain unassessed; no timing establishes qualification.",
            "firstServerPresentationCET": cet(presented[0]) if presented else None,
            "firstCompleteQualifiedEvidenceAt": None, "screenRenderingObserved": False,
            "F6": {k: boundary[k] for k in ["exceeded500Seconds", "sourceReadsStartedInReserve", "termsWorkStartedInReserve"]},
            "guardForbiddenReachedSource": boundary["forbiddenRequestsReachedSource"],
            "actions": [{"step": t["stepNumber"], "atCET": cet(t["occurredAt"]), "action": t.get("agentAction", {"kind":"NON_AGENT_RUNTIME_TRANSITION","command":t.get("command")}),
                         "metadata": t.get("executionMetadata"), "outcome": t["stepOutcome"]} for t in run["trajectories"]],
            "witnessFunnel": {"found": bool(witness), "candidateId": witness_id,
                              "candidate": witness, "factCheck": state.get("factChecks", {}).get(witness_id),
                              "availabilityCheck": state.get("availabilityChecks", {}).get(witness_id),
                              "presented": witness_id in view["restaurant"].get("presentedCandidateIds", []) if witness_id else False,
                              "certificatesAndPostChecks": raw["witnesses"]},
            "recording": recording,
            "googleResponsesInHAR": sum(urlsplit(e["request"]["url"]).hostname == "places.googleapis.com" for e in har["log"]["entries"]),
            "uncapturedScriptsOriginPathOnly": sorted(scripts.values(), key=lambda e: (e["origin"], e["path"])),
            "calendarCandidates": [{"snapshot": i, "url": s["url"], "responses": s.get("responses", []), "diagnostic": f"diagnostic/snapshot-{i:04}.html"}
                                   for i, s in enumerate(snapshots, 1) if s.get("responses")],
        })
(HERE / "observations.json").write_text(json.dumps({"mode": "OFFLINE_METRICS_NOT_REGRADED", "slots": observations}, ensure_ascii=False, indent=2) + "\n")
print(json.dumps([{k: row[k] for k in ["id", "verdict", "elapsedMs", "modelCalls", "googleRequests", "phase"]} for row in observations], ensure_ascii=False))
