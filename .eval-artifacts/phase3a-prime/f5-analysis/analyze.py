"""Offline extraction from immutable, exposed F5 artifacts. No providers or runtime."""
import collections
import csv
import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import urlparse, parse_qs

OUT = Path(__file__).resolve().parent
REPO = OUT.parents[2]
EVIDENCE = "3ec38584555b5271b72b79f954179769e92ff9f6"
BASE = "2ada8a69a3071740423745e581c3b6ae30d9a1bd"
ROOT = ".eval-artifacts/phase2c-holdout"
inputs = {}


def read(path, revision=EVIDENCE):
    raw = subprocess.check_output(["git", "-C", str(REPO), "show", revision + ":" + path])
    inputs[(revision, path)] = {"revision": revision, "path": path,
                              "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)}
    return raw


def seconds(value):
    return datetime.datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()


def save(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def table(name, rows):
    keys = list(dict.fromkeys(key for row in rows for key in row))
    with (OUT / name).open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=keys, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


paths = subprocess.check_output(["git", "-C", str(REPO), "ls-tree", "-r", "--name-only", EVIDENCE, ROOT]).decode().splitlines()
selected = [p for p in paths if "/runner/" in p and p.endswith(".result.json") and
            ("/diagnostic-after-guard-fix-20261023/" in p or "/h-03-attempt-2/" in p or "/h-09-attempt-1/" in p)]
runs, actions, providers, operations, page_intervals, decision_rows, retrieval, options, pages = {}, [], [], [], [], [], {}, {}, []
for path in selected:
    artifact = json.loads(read(path))
    label = "diagnostic-" + path.split("/attempt-")[1].split("/")[0] if "/diagnostic-after-" in path else "case03-h03" if "/h-03-" in path else "case03-h09"
    decision_path = path.replace(".result.json", ".decisions.jsonl")
    decisions = [json.loads(row) for row in read(decision_path).decode().splitlines()]
    assert len(decisions) == len(artifact["modelInvocations"]) == artifact["resourceUsage"]["modelCallsStarted"]
    start = seconds(artifact["startedAt"])
    names = {candidate["restaurant"]["id"]: candidate["restaurant"]["outletName"] for event in artifact["events"] for candidate in event["event"].get("candidates", [])}

    def calls_between(left, right):
        return [i for i, d in enumerate(decisions, 1) if left <= seconds(d["startedAt"]) < right]

    for line, decision in enumerate(decisions, 1):
        output = json.loads(decision.get("outputText") or "{}")
        decision_rows.append({"run": label, "line": line, "purpose": decision["purpose"], "startedAt": decision["startedAt"],
                              "offsetMs": round((seconds(decision["startedAt"]) - start) * 1000), "latencyMs": decision.get("latencyMs"),
                              "browserUrl": (decision.get("browser") or {}).get("url"), "output": json.dumps(output, ensure_ascii=False), "path": decision_path})
    for trajectory in artifact["trajectories"]:
        metadata = trajectory.get("executionMetadata") or {}
        left = seconds(trajectory["occurredAt"])
        right = left + metadata.get("latencyMs", 0) / 1000
        lines = calls_between(left, right)
        actions.append({"run": label, "step": trajectory["stepNumber"], "at": trajectory["occurredAt"],
                        "offsetMs": round((left - start) * 1000), "action": trajectory["agentAction"]["type"],
                        "candidates": " | ".join(names.get(cid, cid) for cid in trajectory["agentAction"].get("candidateIds", [])),
                        "provider": metadata.get("provider"), "executionMs": metadata.get("latencyMs"),
                        "modelCallsInExecution": len(lines), "decisionLines": ",".join(map(str, lines)),
                        "recordPath": path, "jsonPointer": "/trajectories/" + str(trajectory["stepNumber"] - 1)})
    trace = artifact["diagnostics"]["browserTrace"]
    provider_start, operation_start, unmatched_failure_traces = {}, {}, []
    for item in trace:
        detail = item.get("detail", {})
        if item["kind"] != "EXECUTOR_DIAGNOSTIC":
            continue
        key = (detail.get("source"), detail.get("candidateId"))
        event = detail.get("event")
        if event == "PROVIDER_STARTED":
            provider_start[key] = item
        if event == "PROVIDER_FINISHED" and key in provider_start:
            first = provider_start.pop(key)
            left, right = seconds(first["at"]), seconds(item["at"])
            lines = calls_between(left, right)
            stages = collections.Counter(x.get("detail", {}).get("stage") for x in trace if first["sequence"] <= x["sequence"] <= item["sequence"] and x["kind"] == "EXECUTOR_DIAGNOSTIC")
            segment = [x for x in trace if first["sequence"] <= x["sequence"] <= item["sequence"]]
            availability_start = next((x for x in segment if x["kind"] == "EXECUTOR_DIAGNOSTIC" and x["detail"].get("stage") == "AVAILABILITY" and x["detail"].get("event") == "OPERATION_STARTED"), None)
            transitions = [x for x in segment if x["kind"] == "EXECUTOR_DIAGNOSTIC" and x["detail"].get("event") == "OPERATION_STARTED" and x["detail"].get("detail") in ("NAVIGATE", "OPEN_LINK")]
            for index, transition in enumerate(transitions):
                following = transitions[index + 1] if index + 1 < len(transitions) else item
                observed = next((x for x in segment if transition["sequence"] < x["sequence"] < following["sequence"] and x["kind"] == "SNAPSHOT"), None)
                calls = calls_between(seconds(transition["at"]), seconds(following["at"]))
                page_intervals.append({"run": label, "source": key[0], "name": names.get(key[1], key[1]), "stage": transition["detail"].get("stage"),
                                       "startTrace": transition["sequence"], "endTraceExclusive": following["sequence"], "startAt": transition["at"], "endAt": following["at"],
                                       "wallMs": round((seconds(following["at"]) - seconds(transition["at"])) * 1000),
                                       "observedUrl": (observed or {}).get("detail", {}).get("url"), "snapshotTrace": (observed or {}).get("sequence"),
                                       "modelCalls": len(calls), "decisionLines": ",".join(map(str, calls))})
            providers.append({"run": label, "source": key[0], "candidateId": key[1], "name": names.get(key[1], key[1]),
                              "startTrace": first["sequence"], "endTrace": item["sequence"], "startAt": first["at"], "endAt": item["at"],
                              "wallMs": round((right - left) * 1000), "browserModelCalls": detail.get("lifecycle", {}).get("providerModelCalls"),
                              "allModelCalls": len(lines), "decisionLines": ",".join(map(str, lines)), "stages": json.dumps(stages), "status": "CLOSED",
                              "firstAvailabilityTrace": availability_start["sequence"] if availability_start else None,
                              "beforeAvailabilityMs": round(((seconds(availability_start["at"]) if availability_start else right) - left) * 1000),
                              "availabilityMs": round((right - seconds(availability_start["at"])) * 1000) if availability_start else 0})
        op_key = (*key, detail.get("detail"))
        if event == "OPERATION_STARTED":
            assert op_key not in operation_start, (label, op_key)
            operation_start[op_key] = item
        if event == "OPERATION_FAILED" and op_key not in operation_start:
            # Failure detail is an error description, not the operation name.
            pending = [k for k in operation_start if k[:2] == key]
            if not pending:
                unmatched_failure_traces.append(item["sequence"])
                continue
            assert len(pending) == 1, (label, item["sequence"], pending)
            op_key = pending[0]
        if event in ("OPERATION_FINISHED", "OPERATION_FAILED") and op_key in operation_start:
            first = operation_start.pop(op_key)
            operations.append({"run": label, "source": key[0], "candidateId": key[1], "name": names.get(key[1], key[1]),
                               "stage": first["detail"].get("stage"), "operation": first["detail"].get("detail"),
                               "startTrace": first["sequence"], "endTrace": item["sequence"], "startedAt": first["at"], "endedAt": item["at"],
                               "wallMs": round((seconds(item["at"]) - seconds(first["at"])) * 1000), "status": event})
    for key, first in provider_start.items():
        providers.append({"run": label, "source": key[0], "candidateId": key[1], "name": names.get(key[1], key[1]),
                          "startTrace": first["sequence"], "endTrace": None, "startAt": first["at"], "status": "NO_FINISH_RECORD"})
    retrieval[label] = [{"step": t["stepNumber"], **t["executionMetadata"]["nativeDiscoveryFunnel"]} for t in artifact["trajectories"] if "nativeDiscoveryFunnel" in (t.get("executionMetadata") or {})]
    runs[label] = {"resultPath": path, "decisionsPath": decision_path, "caseId": artifact["caseId"], "status": artifact["status"],
                   "failureCode": artifact.get("failureCode"), "elapsedMs": artifact["latencyMs"], "calls": len(decisions),
                   "purposes": dict(collections.Counter(d["purpose"] for d in decisions)), "resourceUsage": artifact["resourceUsage"],
                   "stageTimings": artifact["stageTimings"], "unclosedOperations": len(operation_start),
                   "unclosedOperationStartTraces": [x["sequence"] for x in operation_start.values()],
                   "unmatchedFailureTraces": unmatched_failure_traces}
    if label.startswith("diagnostic-"):
        found = []

        def visit(value, pointer):
            if isinstance(value, dict):
                if value.get("pathname") == "/v2/hub/availability_calendar_v2":
                    found.append({"pointer": pointer, "record": value})
                for key, child in value.items():
                    visit(child, pointer + "/" + str(key))
            elif isinstance(value, list):
                for index, child in enumerate(value):
                    visit(child, pointer + "/" + str(index))

        visit(trace, "/diagnostics/browserTrace")
        blocked = [x for x in found if x["record"].get("code") == "BLOCKED_METHOD"]
        options[label] = {"diagnosticOccurrences": len(blocked), "shapeCounts": dict(collections.Counter(json.dumps(x["record"], sort_keys=True) for x in blocked)),
                          "firstDiagnosticPointer": blocked[0]["pointer"], "allMatchingRecords": found,
                          "limitation": "Repeated snapshot records, not unique network requests. Requested-method/header facts absent on these blocked records."}
    if label in ("diagnostic-1", "case03-h03"):
        recording = artifact["browserRecording"]["path"].split("/praxis-phase2c-witness/")[1]
        for number in ([5, 7] if label == "diagnostic-1" else [8, 9, 10, 11, 12, 13]):
            page_path = recording + "/snapshot-%04d.html" % number
            if page_path not in paths:
                pages.append({"run": label, "snapshot": number, "status": "NOT_SAVED", "path": page_path})
                continue
            html = read(page_path).decode()
            structured = []
            for script in re.findall(r'<script[^>]+type=[\"\']application/ld\+json[\"\'][^>]*>(.*?)</script>', html, re.S | re.I):
                value = json.loads(script)
                for obj in value if isinstance(value, list) else [value]:
                    if isinstance(obj, dict):
                        structured.append({k: obj[k] for k in ["@type", "@id", "name", "geo"] if k in obj})
            map_urls = re.findall(r'https?://[^\"\'<> ]*(?:maps|map\?)[^\"\'<> ]*', html)
            maps = [{"origin": urlparse(url).scheme + "://" + urlparse(url).netloc, "pathname": urlparse(url).path,
                     "queryKeys": sorted(parse_qs(url.replace("&amp;", "&")).keys()),
                     "limitation": "All query values omitted; saved center/markers coordinates are redacted."} for url in map_urls]
            pages.append({"run": label, "snapshot": number, "path": page_path, "htmlBytes": len(html.encode()),
                          "hasBody": "<body" in html.lower(), "structured": structured, "mapLinks": maps})

# An interrupted first attempt and a never-reached third repeat are not complete runs.
partial_root = ROOT + "/exit-live-20261023/execution/A/h-03-attempt-1/"
partial_decision = next(p for p in paths if p.startswith(partial_root) and p.endswith(".decisions.jsonl"))
partial = [json.loads(row) for row in read(partial_decision).decode().splitlines()]
for line, decision in enumerate(partial, 1):
    decision_rows.append({"run": "case03-h03-interrupted", "line": line, "purpose": decision["purpose"], "startedAt": decision["startedAt"],
                          "latencyMs": decision.get("latencyMs"), "browserUrl": (decision.get("browser") or {}).get("url"),
                          "output": decision.get("outputText"), "path": partial_decision})
runs["case03-h03-interrupted"] = {"decisionsPath": partial_decision, "calls": len(partial), "finish": json.loads(read(partial_root + "finish.json")),
                                      "limitation": "No result or complete trace; timestamps only bound observed decisions, not per-source execution durations."}
manifest_path = ROOT + "/exit-live-20261023/remaining-five-continuation-20261023/all-execution-manifest.json"
manifest = json.loads(read(manifest_path))
save("case03-attempts.json", {k: [x for x in v if isinstance(x, dict) and (x.get("run") or {}).get("caseId") == "p2c-holdout-03"] for k, v in manifest.items() if isinstance(v, list)})
for source in ["src/integrations/restaurant-search/native-restaurant-search.ts", "src/integrations/restaurant-search/source-packs.ts",
               "src/integrations/restaurant-search/discovery-retrieval-planner.ts", "src/domains/restaurant/discovery-retrieval.ts",
               "src/integrations/tabelog/tabelog-browser-availability.ts", "src/integrations/tabelog/tabelog-page-parser.ts",
               "src/integrations/restaurant-availability/availability-source-resolver.ts", "src/integrations/tablecheck/tablecheck-public-query.ts",
               "src/infrastructure/browser/playwright-read-network-guard.ts", ".eval-artifacts/phase3a-prime/CODEX-3A-PRIME.md"]:
    read(source, BASE)
save("runs.json", runs)
save("retrieval.json", retrieval)
save("options-classification.json", options)
save("location-evidence.json", pages)
table("time-breakdown.csv", actions)
table("source-reads.csv", providers)
table("operations.csv", operations)
table("page-intervals.csv", page_intervals)
table("decisions.csv", decision_rows)
save("inputs-sha256.json", list(inputs.values()))
save("verify.json", {"status": "PASS", "checks": {"completeRuns": len(selected), "completeDecisionRows": sum(runs[k]["calls"] for k in runs if k != "case03-h03-interrupted"),
                                               "partialDecisionRows": len(partial), "providerSpans": len(providers), "operationSpans": len(operations),
                                               "blockedOptionsOccurrences": {k: v["diagnosticOccurrences"] for k, v in options.items()}, "inputFiles": len(inputs)},
                     "newCalls": {"model": 0, "Google": 0, "restaurantWebsites": 0, "Live": 0},
                     "method": "Static Git blob reads; arithmetic extraction only. No replay of production runtime, no new evaluator or product pass/fail labels."})
print(json.dumps(json.loads((OUT / "verify.json").read_text()), ensure_ascii=False))
