"""Stop 1b: inspect fixed Git evidence only; no product/runtime/provider imports."""
import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
from zoneinfo import ZoneInfo

OUT = Path(__file__).resolve().parent
REPO = OUT.parents[2]
EVIDENCE = "3ec38584555b5271b72b79f954179769e92ff9f6"
BASE = "2ada8a69a3071740423745e581c3b6ae30d9a1bd"
PRIOR = "1a4596f9810d9cbfac5248159a8dd006debfa0d5"
PREFIX = ".eval-artifacts/phase3a-prime/f5-analysis/"
inputs = json.loads(subprocess.check_output(["git", "-C", str(REPO), "show", PRIOR + ":" + PREFIX + "inputs-sha256.json"]))


def read(path, revision=EVIDENCE):
    raw = subprocess.check_output(["git", "-C", str(REPO), "show", revision + ":" + path])
    entry = {"revision": revision, "path": path, "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)}
    existing = next((x for x in inputs if (x["revision"], x["path"]) == (revision, path)), None)
    if existing:
        assert existing == entry
    else:
        inputs.append(entry)
    return raw


def save(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def stamp(value):
    return datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))


def vienna(value):
    return stamp(value).astimezone(ZoneInfo("Europe/Vienna")).isoformat(timespec="milliseconds")


runs = json.loads(read(PREFIX + "runs.json", PRIOR))
summary = {"evidenceStatus": "exposed development diagnostic; draft / not integrated", "revision": EVIDENCE,
           "scope": "D1 decisions 4–12 / trace 2–230; D2 decisions 4–9 / trace 2–153; first DIRECTORY region only",
           "runs": {}}
finals = {}
for name, last_line, last_trace in [("diagnostic-1", 12, 230), ("diagnostic-2", 9, 153), ("case03-h03", 47, 0), ("case03-h09", 47, 0)]:
    result = json.loads(read(runs[name]["resultPath"]))
    decisions = [json.loads(x) for x in read(runs[name]["decisionsPath"]).splitlines()]
    trace = result["diagnostics"]["browserTrace"]
    if name.startswith("case03"):
        state = result["finalSnapshot"]
        end = next(x for x in reversed(result["events"]) if x["event"]["type"] == "READ_ENDED_NO_VERIFIED_RESULT")
        finals[name] = {"resultPath": runs[name]["resultPath"], "finalSnapshotOutcomePointer": "/finalSnapshot/outcome",
                        "status": result["status"], "latencyMs": result["latencyMs"], "phase": state["domainState"]["phase"],
                        "finalOutcome": state["outcome"], "endedAtVienna": vienna(end["occurredAt"]),
                        "finalDecisionLine": len(decisions), "finalDecision": json.loads(decisions[-1]["outputText"]),
                        "webRenderedTranscriptAvailable": False,
                        "limitation": "Persisted outcome and trajectory are present; no final rendered Web/chat transcript in this result. Decision summary is not user-facing output."}
        continue
    segment = [t for t in trace if 2 <= t["sequence"] <= last_trace]
    rows = []
    for line, decision in enumerate(decisions[:last_line], 1):
        if decision["purpose"] != "browser_read_decide":
            continue
        context = json.loads(next(x["content"] for x in decision["messages"] if x["role"] == "user"))
        obs = context["observation"]
        targets = obs["targets"]
        before = [t for t in segment if stamp(t["at"]) <= stamp(decision["startedAt"])]
        latest = {kind: next((t["sequence"] for t in reversed(before) if t["kind"] == kind), None) for kind in ["SNAPSHOT", "CONTROLS"]}
        chosen = json.loads(decision["outputText"])
        picked = next((x for x in targets if x["ref"] == chosen["targetRef"]), None)
        selected = [x for x in targets if "Sta." in x["label"] or x["label"] == "All" or re.search("Search by|category", x["label"], re.I)
                    or re.search("category", x.get("controlGroupLabel", ""), re.I)]
        category_at = obs.get("visibleText", "").find("Search by category")
        rows.append({"decisionLine": line, "startedAtVienna": vienna(decision["startedAt"]),
                     "sourceElapsedMs": round((stamp(decision["startedAt"]) - stamp(segment[0]["at"])).total_seconds() * 1000),
                     "latencyMs": decision["latencyMs"], "recordingSnapshot": decision["browser"]["recordingSnapshot"],
                     "observationRevision": obs["revision"], "url": obs["url"], "latestTrace": latest,
                     "authoritativeLocation": context["goal"]["location"], "targetCount": len(targets),
                     "inputTargets": [x for x in targets if x["kind"] == "INPUT"],
                     "locationFillTargets": [x for x in targets if "FILL_AUTHORITATIVE:LOCATION" in x.get("availableActions", [])],
                     "stationLabels": [x["label"] for x in targets if "Sta." in x["label"]],
                     "requestedPlaceTargetLabels": [x["label"] for x in targets if re.search("Akabane|赤羽", x["label"], re.I)],
                     "distance800mInVisibleText": bool(re.search(r"800\s*m", obs.get("visibleText", ""), re.I)),
                     "categoryVisibleTextExcerpt": obs["visibleText"][max(0, category_at - 50):category_at + 180] if category_at >= 0 else None,
                     "areaControlGroups": [g for g in obs["controlGroups"] if re.search("Search by|category", g["label"], re.I)],
                     "relevantTargets": selected, "chosenAction": chosen, "chosenTarget": picked,
                     "progress": context["progress"],
                     "rejectionsInHistory": [h for h in context["history"] if h.get("outcome") == "REJECTED"]})
    raw = []
    for t in segment:
        if t["kind"] != "CONTROLS":
            continue
        controls = t["detail"].get("controls", [])
        raw.append({"trace": t["sequence"], "snapshotTrace": t["detail"].get("snapshotSequence"), "url": t["detail"].get("url"),
                    "scope": t["detail"].get("scope"), "totalObserved": t["detail"].get("totalObserved"),
                    "inputCount": sum(c["kind"] == "INPUT" for c in controls),
                    "locationInputs": [c for c in controls if c["kind"] == "INPUT" and re.search(r"location|area|station|地域|エリア|駅|場所", c.get("label", "") + " " + c.get("structure", {}).get("name", ""), re.I)],
                    "requestedPlaceLabels": [c["label"] for c in controls if re.search("Akabane|赤羽", c["label"], re.I)]})
    root = runs[name]["resultPath"].split("/runner/")[0]
    paths = subprocess.check_output(["git", "-C", str(REPO), "ls-tree", "-r", "--name-only", EVIDENCE, root + "/recordings/"]).decode().splitlines()
    html_rows = []
    for number in sorted({d["recordingSnapshot"] for d in rows}):
        suffix = "/snapshot-" + str(number).zfill(4) + ".html"
        matches = [p for p in paths if p.endswith(suffix)]
        if not matches:
            html_rows.append({"snapshot": number, "savedHtml": "MISSING", "limitation": "Recording snapshot exists in decision metadata; no matching HTML blob is committed."})
            continue
        assert len(matches) == 1
        raw_html = read(matches[0])
        html_rows.append({"snapshot": number, "path": matches[0], "bytes": len(raw_html),
                          "hasBodyTag": bool(re.search(rb"<body\b", raw_html, re.I)),
                          "hasClosingHead": b"</head>" in raw_html.lower(),
                          "limitation": "Only saved bytes are checked; omitted HTML cannot establish control absence."})
    screenshots = []
    for number in ([3, 4, 7, 8] if name.endswith("1") else [7]):
        path = next(p for p in paths if p.endswith("/screenshot-" + str(number).zfill(4) + ".png"))
        image = read(path)
        temporary = Path("/private/tmp/f5-1b-" + name + "-" + str(number) + ".png")
        temporary.write_bytes(image)
        screenshots.append({"snapshot": number, "path": path, "inspectionCopy": str(temporary)})
    summary["runs"][name] = {"decisions": rows, "rawControls": raw, "savedHtml": html_rows, "screenshotsForInspection": screenshots}

for path in ["src/infrastructure/browser/browser-action-decision.ts", "src/infrastructure/browser/browser-task-executor.ts",
             "docs/decisions/0040-agent-selected-directory-region-entrances.md", "docs/decisions/0042-agent-planned-discovery-and-search-availability-hints.md"]:
    read(path, BASE)
read("src/application/persistent-restaurant-agent.ts")

def trace_span(name, start, end):
    artifact = json.loads(read(runs[name]["resultPath"]))
    trace = {t["sequence"]: t for t in artifact["diagnostics"]["browserTrace"]}
    return {"run": name, "startTrace": start, "endTrace": end,
            "startAtVienna": vienna(trace[start]["at"]), "endAtVienna": vienna(trace[end]["at"]),
            "wallMs": round((stamp(trace[end]["at"]) - stamp(trace[start]["at"])).total_seconds() * 1000)}

segments = {"selectEarly": trace_span("diagnostic-1", 2, 78),
            "selectDeep": trace_span("diagnostic-1", 2, 122),
            "twoDetailsProxy": trace_span("case03-h03", 116, 138),
            "replaceWithRestoreProxy": trace_span("diagnostic-1", 63, 107),
            "newListProxy": trace_span("diagnostic-1", 107, 122),
            "keywordProxy": trace_span("case03-h03", 80, 92)}
early = sum(segments[k]["wallMs"] for k in ["selectEarly", "twoDetailsProxy", "replaceWithRestoreProxy", "newListProxy", "keywordProxy"])
deep = early - segments["selectEarly"]["wallMs"] + segments["selectDeep"]["wallMs"]
station = segments["selectDeep"]["wallMs"] + 4097 + segments["newListProxy"]["wallMs"] + segments["keywordProxy"]["wallMs"]
save("budget-estimate.json", {"status": "estimate only; no new execution", "segments": segments,
     "earlyProvisional": {"wallMs": early, "marginTo90000Ms": 90000 - early, "regionPagesIncludingRestore": 4,
                          "condition": "First selected broad entrance actually exposes a parseable current public list; historical head-only HTML cannot prove this."},
     "deepProvisionalWithRestore": {"wallMs": deep, "timeMarginTo90000Ms": 90000 - deep, "regionPagesIncludingRestore": 5,
                                    "verdict": "INFEASIBLE at existing 4-region-page cap even if wall-time sum fits"},
     "stationConditional": {"knownProxyMs": station, "remainingForUnobservedRevealMs": 90000 - station,
                            "unknown": "Requested Akabane station + distance controls / LOCATION revelation and interaction; no observed matching route or timing."}})

save("q7-evidence.json", summary)
save("case03-final-outcomes.json", finals)
save("inputs-sha256.json", inputs)
print(json.dumps({"inputs": len(inputs), "newInputs": len(inputs) - 29,
                  "decisions": {k: len(v["decisions"]) for k, v in summary["runs"].items()},
                  "locationInputsInRawControls": {k: sum(len(c["locationInputs"]) for c in v["rawControls"]) for k, v in summary["runs"].items()},
                  "newExternalCalls": 0}, ensure_ascii=False))
