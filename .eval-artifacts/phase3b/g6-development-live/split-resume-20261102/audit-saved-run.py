"""Offline measurements from the stopped D1 artifacts; no requests or regrading.

Original evaluation files are read only. This sidecar does not clear S0_STOP.
"""
import base64
import collections
import hashlib
import json
import pathlib
import subprocess
from html.parser import HTMLParser
from datetime import datetime
from urllib.parse import urljoin, urlsplit
from zoneinfo import ZoneInfo

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
SLOT = HERE / "w1-runs/D1"
RECORDING = next((SLOT / "recordings").glob("*/recording.json"))


def load(path):
    return json.loads(path.read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(name, data):
    (HERE / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def cet(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(
        ZoneInfo("Europe/Vienna")
    ).isoformat()


result = load(SLOT / "execution.result.json")
run, view = result["execution"], result["view"]
state = run["finalSnapshot"]["domainState"]
evaluation = load(SLOT / "evaluation.json")
evaluation_input = load(SLOT / "evaluation.input.json")
boundary = load(SLOT / "boundary-observation.json")
recording = load(RECORDING)
recording_observation = load(SLOT / "recording-observation.json")
har = load(RECORDING.parent / "replay.har")
decisions = [json.loads(line) for line in (SLOT / "execution.decisions.jsonl").read_text().splitlines()]
frozen = load(HERE / "source-inputs.json")
changed = [item["path"] for item in frozen["files"] if sha(ROOT / item["path"]) != item["sha256"]]
assert not changed, changed

# Reconcile the shared ledger against the last committed pre-Live snapshot.
budget_path = ROOT / ".eval-artifacts/phase3b/budget.json"
budget = load(budget_path)
before = json.loads(subprocess.check_output(
    ["git", "show", "eae8fa90:.eval-artifacts/phase3b/budget.json"], cwd=ROOT
))
assert budget["entries"][:len(before["entries"])] == before["entries"]
assert len({entry["id"] for entry in budget["entries"]}) == len(budget["entries"])
delta = {key: budget["cumulative"][key] - old for key, old in before["cumulative"].items()}
new = budget["entries"][len(before["entries"]):]
assert sum(entry.get("fullLive", 0) for entry in new) == delta["fullLive"] == 1
assert sum(entry.get("realModelCalls", 0) for entry in new) == delta["realModelCalls"] == len(decisions) == 23
assert sum(entry.get("evaluationPublicGET", 0) for entry in new) == delta["evaluationPublicGET"] == 2
save("budget-reconciliation.json", {
    "baselineCommit": "eae8fa908f4b2af774a2a2bc987e0f90c5d97bf8",
    "baselineRows": len(before["entries"]), "allBaselineRowsUnchanged": True,
    "rows": len(budget["entries"]), "appendedRows": len(new), "delta": delta,
    "cumulative": budget["cumulative"], "limits": budget["limits"],
    "developmentPublicGET": budget["cumulative"]["evaluationPublicGET"] - 255,
    "developmentPublicGETLimit": 25, "developmentPublicGETRemaining": 25 - (budget["cumulative"]["evaluationPublicGET"] - 255),
    "newRequestIds": [entry["id"] for entry in new],
})

def content(entry):
    value = entry["response"]["content"]
    raw = value.get("text", "")
    return base64.b64decode(raw).decode() if value.get("encoding") == "base64" else raw


handoff = view["restaurant"]["bookingHandoffs"][0]
source = [entry for entry in har["log"]["entries"] if "/find_vacancy?" in entry["request"]["url"]]
source_links = [urljoin(entry["request"]["url"], option["url"])
                for entry in source for option in json.loads(content(entry)).get("selection", {}).values()]
assert handoff["url"] in source_links
post = load(SLOT / "witness/002-vacancy.body")
assert post["base_date"] == {"year": 2026, "month": 11, "day": 11, "dow": "Wed"}
assert post["members"] == 2 and any(option["time"] == "19:00" for option in post["selection"].values())
boundary_checks = [check for check in evaluation["checks"] if check["rule"] == "REQUEST_BOUNDARY"]
assert len(boundary_checks) == len(evaluation_input["requests"]) == 1130
assert all(check["status"] == "PASS" for check in boundary_checks)
candidate = next(c for c in state["candidates"] if c["restaurant"]["id"] == handoff["candidateId"])
witness = next(c for c in state["candidates"] if c["restaurant"]["sourceIds"].get("phone") == "03-5249-4011")
witness_id = witness["restaurant"]["id"]


class LinkReader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        if tag == "a" and "href" in dict(attrs):
            self.hrefs.append(dict(attrs)["href"])


search_page = RECORDING.parent / "diagnostic/snapshot-0032.html"
links = LinkReader()
links.feed(search_page.read_text())
witness_url = "https://tabelog.com/en/tokyo/A1323/A132305/13108466/"
witness_links = [href for href in links.hrefs if urljoin(witness_url, href).rstrip("/") == witness_url.rstrip("/")]
witness_navigation = next(entry for entry in recording["entries"]
                          if entry["kind"] == "SESSION_CALL" and entry["detail"].get("method") == "navigate"
                          and entry["detail"].get("args", [None])[0] == witness_url)
witness_navigation_error = next(entry for entry in recording["entries"]
                                if entry["sequence"] > witness_navigation["sequence"] and entry["kind"] == "SESSION_ERROR")
assert witness_links and "Timeout 14814ms" in str(witness_navigation_error)
save("stop-audit.json", {
    "schema": "g6-stopped-run-audit@1", "mode": "OFFLINE_SAVED_ARTIFACT_INSPECTION",
    "originalEvaluationSHA256": sha(SLOT / "evaluation.json"),
    "originalVerdictUnchanged": evaluation["verdict"],
    "nonPassingChecks": [check for check in evaluation["checks"] if check["status"] != "PASS"],
    "presentation": {"phase": view["case"]["phase"], "presentedCandidateIds": view["restaurant"].get("presentedCandidateIds"),
                     "readyCandidateIds": view["restaurant"]["readyCandidateIds"],
                     "resultsPresentedEvents": sum(event["event"]["type"] == "RESULTS_PRESENTED" for event in run["events"]),
                     "screenRenderObserved": False, "qualifiedResultEvidenceCompleteAt": None,
                     "qualifiedResultDisplayedAt": None},
    "B1": {"candidateId": handoff["candidateId"], "name": candidate["restaurant"]["outletName"],
           "url": handoff["url"], "sourceURLLiteralMatch": True, "sourceResponses": [json.loads(content(entry)) for entry in source],
           "handoffInReturnedView": True, "candidateInDeliveredSet": False,
           "terms": handoff["terms"], "platformFee": handoff["platformFee"],
           "interpretation": "Automatic B1_LINK S0 is retained. Runner passes all cached handoffs but delivered only presentedCandidateIds. Actual display of this unpresented handoff is not established by this non-Web run. Product/API projection versus evaluator scope requires reviewer decision; no S0=0 or clearance is claimed."},
    "boundary": {"actualObservedSourceRequests": len(evaluation_input["requests"]),
                 "methods": dict(collections.Counter(req["method"] for req in evaluation_input["requests"])),
                 "independentRequestChecksPassed": len(boundary_checks),
                 "forbiddenRequestsReachedSource": boundary["forbiddenRequestsReachedSource"],
                 "bookingFormRequestsReachedSource": sum("/booking/form_course/" in req["url"] for req in evaluation_input["requests"])},
    "witness": {"candidateId": witness_id, "name": witness["restaurant"]["outletName"],
                "discoveredBy": "GOOGLE_PLACES", "nativeTabelogAccepted": run["trajectories"][0]["executionMetadata"]["nativeDiscoveryFunnel"]["accepted"],
                "tabelogPointerObserved": {"snapshot": 32, "hrefs": witness_links, "sha256": sha(search_page)},
                "tabelogDetailNavigation": witness_navigation,
                "tabelogDetailNavigationFailure": witness_navigation_error,
                "availabilityBlocker": "Correct Tabelog pointer was found after name query broadening; page.goto of that exact detail URL timed out after 14814 ms waiting for domcontentloaded. No completed detail snapshot was saved. This is not evidence of a wrong-shop match or a source HTTP error.",
                "factCheck": state["factChecks"].get(witness_id), "availabilityCheck": state["availabilityChecks"].get(witness_id),
                "presented": False, "postRunWitnessStillExists": True,
                "postRawSHA256": sha(SLOT / "witness/002-vacancy.body"),
                "postCheckedAtCET": cet(load(SLOT / "witness/002-vacancy.body.json")["checkedAt"])},
    "sourceFreeze": {"checked": len(frozen["files"]), "changed": changed},
    "w2": {"packPrepared": True, "recertificationStarted": False, "LiveStarted": False,
           "reason": "W1 S0_STOP; global batch stop also blocks deferred W2"},
})

models = collections.defaultdict(lambda: {"count": 0, "latencyMs": 0})
for decision in decisions:
    models[decision["purpose"]]["count"] += 1
    models[decision["purpose"]]["latencyMs"] += decision["latencyMs"]
calls = [entry["detail"] for entry in recording["entries"] if entry["kind"] == "SESSION_CALL"]
paths = [call["args"][0] for call in calls if call["method"] == "navigate" and call.get("args")]
google = [entry for entry in har["log"]["entries"] if urlsplit(entry["request"]["url"]).hostname == "places.googleapis.com"]
actions = [{"step": step["stepNumber"], "atCET": cet(step["occurredAt"]), "action": step["agentAction"],
            "metadataLatencyMs": (step.get("executionMetadata") or {}).get("latencyMs"),
            "failureCode": (step.get("executionMetadata") or {}).get("failureCode"),
            "outcome": step["stepOutcome"]} for step in run["trajectories"]]
save("time-and-resource-observations.json", {
    "elapsedMs": boundary["elapsedMs"], "executionElapsedMs": run["resourceUsage"]["elapsedMs"],
    "startCET": cet(decisions[0]["startedAt"]), "boundedConclusionAtCET": cet(state["noVerifiedResult"]["endedAt"]),
    "firstQualifiedResultAt": None, "presentationAt": None, "observationToPresentationMs": None,
    "actions": actions, "modelsByPurpose": dict(models), "modelLatencyTotalMs": sum(row["latencyMs"] for row in models.values()),
    "timingCaution": "Action metadata latencies contain nested source/model work and are not additive with model latencies. SESSION_CALL/RETURN entries omit wall timestamps. Page-load, structure-read, wait, operation, launch and Google-wait durations are NOT_EVALUATED, not zero; no guessed attribution is made.",
    "sessionCalls": dict(collections.Counter(call["method"] for call in calls)),
    "navigateCalls": len(paths), "repeatedExactNavigateCalls": len(paths) - len(set(paths)),
    "googleRequests": boundary["googleRequests"], "googleStructuredResponsesCaptured": len(google),
    "googleResponseStatuses": dict(collections.Counter(entry["response"]["status"] for entry in google)),
    "semanticAttemptsByTurn": boundary["semanticAttemptsByTurn"], "semanticSchemaRetries": boundary["semanticSchemaRetries"],
    "F6": {key: boundary[key] for key in ["exceeded500Seconds", "sourceReadsStartedInReserve", "termsWorkStartedInReserve"]},
    "F6EndWindow": state["readEndWindow"], "limits": run["limits"],
})

scripts = {}
har_paths = {(urlsplit(entry["request"]["url"]).scheme + "://" + urlsplit(entry["request"]["url"]).netloc,
              urlsplit(entry["request"]["url"]).path) for entry in har["log"]["entries"]}
for entry in recording["entries"]:
    if entry["kind"] == "NETWORK":
        for request in entry["detail"]:
            origin, path = request.get("origin", "").rstrip("/"), request.get("pathname", "")
            if request.get("resourceType") == "script" and (origin, path) not in har_paths:
                scripts[(origin, path)] = {"origin": origin, "path": path, "outcome": request["outcome"]}
snapshots = [entry["detail"] for entry in recording["entries"] if entry["kind"] == "SNAPSHOT"]
calendars = [{"snapshot": index, "url": snapshot["url"], "responses": snapshot["responses"],
              "diagnostic": f"diagnostic/snapshot-{index:04}.html"}
             for index, snapshot in enumerate(snapshots, 1) if snapshot.get("responses")]
save("live-checklist.json", {
    "recording": {"qualifiedPages": recording_observation["qualifiedPages"], "totalPages": recording_observation["totalPages"],
                  "reasonCounts": dict(collections.Counter(page["reason"] for page in recording_observation["pages"])),
                  "pages": recording_observation["pages"], "replayStatus": recording["replay"]["status"]},
    "uncapturedScriptsOriginPathOnly": sorted(scripts.values(), key=lambda item: (item["origin"], item["path"])),
    "tabelogCalendarAndSameSaveData": calendars,
    "calendarStatus": "Collected as candidate inputs only; not yet added to G2 or independently accepted as a new regression baseline.",
    "tablecheckCalendarWithBindableSlot": {"status": "NOT_COLLECTED", "reason": "D2/D8 not started; D1 TableCheck observations yielded no bound positive slot"},
    "newReplay": {"path": str((RECORDING.parent / "replay.har").relative_to(ROOT)), "sha256": sha(RECORDING.parent / "replay.har"),
                  "executed": False, "reason": "Current task requires recording and qualification counts; no full replay success is claimed."},
    "D8LinkChecklist": {"status": "NOT_REACHED", "links": [], "reason": "D8 unstarted after W1 S0_STOP"},
})
save("audit-inputs-sha256.json", {"mode": "OFFLINE_READ_ONLY", "files": [
    {"path": str(path.relative_to(ROOT)), "sha256": sha(path), "bytes": path.stat().st_size}
    for path in sorted(SLOT.rglob("*")) if path.is_file()
]})
print(json.dumps({"verdict": evaluation["verdict"], "ledgerDelta": delta,
                  "modelLatencyMs": sum(row["latencyMs"] for row in models.values()),
                  "snapshotCount": len(snapshots), "calendars": [row["snapshot"] for row in calendars],
                  "sourceFilesUnchanged": len(frozen["files"])}, ensure_ascii=False))
