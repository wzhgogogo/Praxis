"""Offline stop-1c evidence excerpts and arithmetic; never imports product code."""
import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
from zoneinfo import ZoneInfo

OUT = Path(__file__).resolve().parent
REPO = OUT.parents[2]
BASE = "2ada8a69a3071740423745e581c3b6ae30d9a1bd"
EVIDENCE = "3ec38584555b5271b72b79f954179769e92ff9f6"
PRIOR = "29f6328fd5c01efde5aff9a452fba46a5a5cb83a"
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


def save(name, data):
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def at(value):
    return datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))


def vienna(value):
    return at(value).astimezone(ZoneInfo("Europe/Vienna")).isoformat(timespec="milliseconds")


source = next(x["path"] for x in inputs if "/diagnostic-after-guard-fix-20261023/attempt-1/runner/" in x["path"] and x["path"].endswith(".result.json"))
decisions = [json.loads(line) for line in read(source.replace(".result.json", ".decisions.jsonl")).splitlines()]
observation = json.loads(next(m["content"] for m in decisions[4]["messages"] if m["role"] == "user"))["observation"]
# Static URL-shape inventory only. The production Pack/Guard are NOT executed.
shape = re.compile(r"^https://tabelog\.com/en/[^/]+/(?:A\d+|C\d+|R\d+)(?:/(?:A\d+|C\d+|R\d+))*/(?:rstLst/)?$")
menu = [t for t in observation["targets"] if t["kind"] == "LINK" and shape.fullmatch(t.get("href", ""))]
assert len(menu) == 31
save("entrance-history-d1.json", {"evidenceStatus": "exposed development diagnostic; observation excerpt only, not a new replay/fixture",
     "revision": EVIDENCE, "decisionsPath": source.replace(".result.json", ".decisions.jsonl"),
     "decisionLine": 5, "recordingSnapshot": 4, "snapshotTrace": 51, "controlsTrace": 55,
     "sourceId": "tabelog", "sourceFlow": "D1 initial DIRECTORY discovery", "observedOn": observation["url"],
     "observationRevision": observation["revision"], "startedAtVienna": vienna(decisions[4]["startedAt"]),
     "menuLinks": [{"originalTargetRef": t["ref"], "label": t["label"], "href": t["href"], "availableActionsThen": t["availableActions"]} for t in menu],
     "limitation": "These hrefs were actually observed. Static shape matches the recorded Pack rule; production isRegionEntrance, current navigation, parsing, geography and qualification NOT_RUN."})

for path in ["src/domains/restaurant/contracts.ts", "src/integrations/restaurant-search/directory-region-selection.test.ts",
             "src/eval/restaurant/agent-loop/native-discovery-composition.test.ts"]:
    read(path, BASE)
read(PREFIX + "report.md", PRIOR)
read(PREFIX + "budget-estimate.json", PRIOR)

result = json.loads(read(source))
trace = {t["sequence"]: t for t in result["diagnostics"]["browserTrace"]}
case_source = next(x["path"] for x in inputs if "/h-03-attempt-2/runner/" in x["path"] and x["path"].endswith(".result.json"))
case_trace = {t["sequence"]: t for t in json.loads(read(case_source))["diagnostics"]["browserTrace"]}


def span(traces, start, end):
    return {"startTrace": start, "endTrace": end, "startAtVienna": vienna(traces[start]["at"]), "endAtVienna": vienna(traces[end]["at"]),
            "wallMs": round((at(traces[end]["at"]) - at(traces[start]["at"])).total_seconds() * 1000)}


selection = {"run": "D1", "decisionLine": 7, "snapshot": 6, "wallMs": decisions[6]["latencyMs"],
             "startedAtVienna": vienna(decisions[6]["startedAt"]), "meaning": "One model choice proxy only; historical action was a child-region link, not retained-entrance selection."}
segments = {"selectDeep": span(trace, 2, 122), "twoDetailsProxy": span(case_trace, 116, 138), "oneSelectionProxy": selection,
            "directNavigationAndListProxy": span(trace, 107, 122), "keywordProxy": span(case_trace, 80, 92)}
total = sum(x["wallMs"] for x in segments.values())
assert total == 57512
provider = span(trace, 2, 230)["wallMs"]
overhead = result["trajectories"][0]["executionMetadata"]["latencyMs"] - provider
assert overhead == 1981
second_source = next(x["path"] for x in inputs if "/diagnostic-after-guard-fix-20261023/attempt-2/runner/" in x["path"] and x["path"].endswith(".result.json"))
second_trace = {t["sequence"]: t for t in json.loads(read(second_source))["diagnostics"]["browserTrace"]}
second_decisions = [json.loads(line) for line in read(second_source.replace(".result.json", ".decisions.jsonl")).splitlines()]
slower = total - segments["selectDeep"]["wallMs"] - selection["wallMs"] + span(second_trace, 2, 122)["wallMs"] + second_decisions[7]["latencyMs"]
assert slower == 87501
save("budget-estimate-1c.json", {"evidenceStatus": "current design arithmetic; not implemented or a timing promise", "supersededEstimate": {"revision": PRIOR, "path": PREFIX + "budget-estimate.json"},
     "segments": segments, "directDeep": {"wallMs": total, "marginTo90000Ms": 90000 - total, "regionPages": 4, "restoreMenuPages": 0,
     "path": ["Tokyo observed menu", "A1322", "A132201", "one model-selected previously observed different region entrance"]},
     "withConservativeScopeDifference": {"additionalMs": overhead, "wallMs": total + overhead, "marginTo90000Ms": 90000 - total - overhead},
     "slowerD2PrefixAndSelectionProxy": {"wallMs": slower, "marginTo90000Ms": 90000 - slower},
     "locationStationRoute": "NOT_ADOPTED; defer until F5 Live provides complete DOM evidence",
     "limitations": ["Retained-entrance action and scoped provenance contract do not exist yet.", "Two details and keyword timings use C03-2 proxies.", "Direct NAVIGATE is estimated with historical OPEN_LINK/observe time; no real new destination was visited.", "D1 target HTML is incomplete; parseable lists and a useful alternate region remain unproven."]})
save("inputs-sha256.json", inputs)
assert len(inputs) == 48
print(json.dumps({"fixedInputs": len(inputs), "original43Preserved": True, "d1MenuLinks": len(menu), "directDeepMs": total, "regionPages": 4, "restorePages": 0, "newExternalCalls": 0}))
