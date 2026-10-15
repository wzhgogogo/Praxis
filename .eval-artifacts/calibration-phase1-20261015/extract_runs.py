"""Inventory every Phase 1 Live attempt committed under .eval-artifacts into one JSON list."""
import glob, json, os, re, sys, yaml

ROOT = sys.argv[1]
OUT = sys.argv[2]
os.chdir(ROOT)

def load(p):
    try:
        with open(p) as f:
            return json.load(f)
    except Exception:
        return None

# request text per case id
requests = {}
for f in ["src/eval/restaurant/agent-loop/cases/e2e-cases.gold7.yaml", ".eval-artifacts/p1-f-20261011/variants.rev2.yaml"]:
    for d in yaml.safe_load_all(open(f)):
        if isinstance(d, dict) and d.get("id") and d.get("content"):
            requests[d["id"]] = " ".join(str(d["content"]).split())

def req_for(case):
    if case in requests: return requests[case]
    m = re.match(r"p1f-kf-(h00\d)-", case)
    if m: return requests.get(m.group(1), "")
    for k, v in requests.items():
        if k.rsplit("-", 1)[0] == case.rsplit("-", 1)[0]: return v
    return ""

rows = []

def add(batch, case, attempt, summary, finish, extra):
    s = summary or {}
    fin = finish or {}
    ev = s.get("evaluation") or {}
    deliveries = [{"name": d.get("name"), "providers": d.get("providers"), "distanceMeters": d.get("distanceMeters")} for d in (s.get("deliveries") or [])]
    stop = s.get("stop") if s.get("stop") is not None else fin.get("stop")
    pd = s.get("postDelivery") or extra.get("postDelivery")
    rows.append({
        "batch": batch, "caseId": case, "attempt": attempt,
        "request": req_for(case),
        "head": (s.get("head") or fin.get("head") or "")[:7],
        "startedAt": s.get("startedAt") or fin.get("startedAt"),
        "status": s.get("status"), "phase": s.get("phase"), "failureCode": s.get("failureCode"),
        "termination": s.get("termination"),
        "stop": (stop or {}).get("code") if isinstance(stop, dict) else stop,
        "exit": fin.get("exit") or fin.get("exitCode"),
        "interruption": extra.get("interruption"),
        "deliveries": deliveries,
        "evaluatorVersion": s.get("evaluatorVersion"),
        "evaluation": {k: ev.get(k) for k in ["taskProducedQualifiedResult", "systemBehavior", "evidenceSufficiency", "completion", "status"]} if ev else None,
        "elapsedMs": s.get("elapsedMs"), "models": s.get("models"), "google": s.get("google"),
        "waitPercent": s.get("waitPercent"), "browserTimeout": s.get("browserTimeout"),
        "witnessRawCount": len(s.get("witnessRaw") or extra.get("witnessRaw") or []),
        "postDelivery": [r.get("status") for r in (pd or {}).get("rows", [])] if isinstance(pd, dict) else None,
        "hasVerification": extra.get("verification", False),
        "hasEvaluationCopy": extra.get("evaluationCopy", False),
        "dir": extra["dir"],
    })

# directory-style attempts
for fin_path in sorted(glob.glob(".eval-artifacts/**/attempt-*/finish.json", recursive=True)):
    d = os.path.dirname(fin_path)
    parts = d.split("/")
    batch = "/".join(parts[1:-2])
    case = parts[-2]
    attempt = int(parts[-1].split("-")[1])
    summary = load(os.path.join(d, "summary.json"))
    finish = load(fin_path)
    if summary and summary.get("caseId"): case = summary["caseId"]
    elif finish and finish.get("id"): case = finish["id"]
    extra = {"dir": d, "verification": os.path.exists(os.path.join(d, "verification.json")),
             "evaluationCopy": os.path.exists(os.path.join(d, "evaluation-copy.json")),
             "postDelivery": load(os.path.join(d, "post-delivery.json"))}
    add(batch, case, attempt, summary, finish, extra)

# file-style attempts (P1-F part A, continuation part 1, rerun)
for fin_path in sorted(glob.glob(".eval-artifacts/p1-f-20261011/*/*/attempt-*.finish.json")):
    d = os.path.dirname(fin_path)
    batch = "/".join(d.split("/")[1:-1])
    case = d.split("/")[-1]
    attempt = int(re.search(r"attempt-(\d+)", fin_path).group(1))
    finish = load(fin_path)
    summary = None
    bs = load(os.path.join(os.path.dirname(d), "summary.json"))
    if isinstance(bs, dict) and "rows" in bs:
        for r in bs["rows"]:
            if r.get("caseId") == case and r.get("attempt", attempt) == attempt:
                summary = r
    if summary is None:
        cs = load(os.path.join(d, "summary.json"))
        if isinstance(cs, dict) and cs.get("caseId") == case: summary = cs
    intr = load(fin_path.replace(".finish.json", ".interruption.json"))
    extra = {"dir": d, "interruption": (intr or {}).get("status"),
             "witnessRaw": (finish or {}).get("witness")}
    add(batch, case, attempt, summary, finish, extra)

rows.sort(key=lambda r: (r["startedAt"] or "", r["caseId"]))
json.dump(rows, open(OUT, "w"), ensure_ascii=False, indent=1)
print(len(rows), "attempts")
for r in rows:
    print(f'{(r["startedAt"] or "?")[:16]} {r["batch"][:38]:38} {r["caseId"][:34]:34} a{r["attempt"]} {r["head"]} st={r["status"]} ph={r["phase"]} fc={r["failureCode"]} stop={r["stop"]} int={r["interruption"]} del={[x["name"] for x in r["deliveries"]]} ev={(r["evaluation"] or {}).get("completion")}/{(r["evaluation"] or {}).get("taskProducedQualifiedResult")} pd={r["postDelivery"]} w={r["witnessRawCount"]}')
