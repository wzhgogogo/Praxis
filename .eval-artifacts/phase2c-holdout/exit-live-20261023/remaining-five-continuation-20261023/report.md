# Phase2c records: paused for independent remote review

Evidence status: current execution evidence; exposed holdout; capability evaluation DEFERRED. User explicitly cancelled the proposed repair and paused continuation. No production file was changed. No further Live is running or scheduled.

## Review entry points

- [All11 complete Runner result.json files](complete-result-index.json), each with repository-relative path and SHA256.
- [All19 attempt records](attempt-record-index.json), including decisions.jsonl, started/finish records, provider-call counters, stdout/stderr and safety records.
- [Combined chronological manifest](all-execution-manifest.json), preserving every earlier attempt and its original classification.
- [Full timing/resource/overlap table](timing-and-resources.json).
- [Cumulative phase2 ledger](execution/ledger-after.json).
- [Raw execution output freeze](raw-output-freeze.json), [separate network diagnosis freeze](network-diagnosis-freeze.json), and [explicit user pause](user-pause.json).
- [TableCheck diagnosis with raw responses and red/green screenshots](user-network-diagnosis-20261023/report.md).
- [Blind pending-wording packet](pending-wordings.json), unchanged7 artifact entries/8 pairs; no capability results or observed prices.

## 1. End-to-end execution record, unscored

Fourteen of18 planned slots have a recorded attempt. There are19 attempts:17 formal Live starts and2 preflight/startup-only attempts. Eleven formal attempts have actual complete Runner result files;6 formal interrupted attempts do not. No synthetic result.json has been created for them. h-15 through h-18 remain NOT_REACHED. Older results, classifications, evaluations and wording packets are retained and never overwritten.

This continuation only started h-14 once. The original outer recorded ENV_FAILURE after the TableCheck visible busy message, with13 model calls and no complete result.json. Its one normal retry was reserved/scheduled but NEVER STARTED: no extra Live/model/environment charge. Subsequent user-directed diagnosis paused the idle scheduler; the user then chose offline repair but cancelled it before any production edit. The scheduler was terminated while idle, with0 active Live interrupted.

h-14 start (Beijing): `2026-10-23T16:38:20.187000+08:00`; finish: `2026-10-23T16:41:39.174000+08:00`; outer duration `198.987s`.

## 2. Per-stage assessment: deferred

No request/Gold correspondence was added and no capability scoring was performed. Interpretation, location, witness discovery, identity, HARD facts, inventory, decisions and delivery remain pending the approved independent wording/evaluation process. Mainline8487a844 product, Gold, exit dates, certified5/6 witness registry, evaluator33/rubric29 and existing Runner ceilings remain unchanged. The sixth witness-excluded case/fallback stays unchanged. Earliest witness expiry remains Beijing2026-10-24 12:15:40.465; pause does not extend it.

The raw execution files were committed before extracting the blind wording packet. Its7 entries/8 pairs are unchanged because the newly interrupted h-14 has no complete artifact to extract. The packet contains no capability outcome, score, source price, condition state or delivery details.

## 3. Severity and boundaries

No S0 PRESENT monitor signal was seen in h-14. Its incomplete final artifact means independent S0 declaration/boundary checks remain NOT_EVALUATED; this is not an assertion of S0=0. Safety-only evaluator33 saved only its allowed safety/environment output. No S1-S4 or exit-pass claims are produced here.

Runtime read-only restrictions and /reserve permanent denial remain unchanged: no new permission for reservation forms, slot clicks or personal information submission. Diagnostic browser reads used the same public search page; there were no clicks or reservation navigation. The temporary diagnostic policy instance is not a production change or a Live result.

## 4. Attribution and limits

User-requested DNS/ICMP/HTTPS diagnosis established that ping loss did not imply website failure: the document, real V4 search API and the exact missing-hits cuisine facet GET all returnedHTTP200. An actual Chromium session with the unchanged Guard reproduced the h-14 busy page: the site-owned venue-facet-cuisine GET omits hits, but the Guard requires it, so its browser-generated OPTIONS preflight was blocked. The main result/map GETs still succeeded. A separate temporary, exact seven-key read-only diagnostic rule made the same page display654 source search results and removed the busy message.

This confirms a Guard false rejection for the exact observed h-14 URL. It does not retroactively relabel all earlier busy-page attempts, change original ENV records, or establish a capability result. The earlier missing-new-host hypothesis was checked and explicitly rejected: the current host is already in the frozen policy. No production repair, new Prompt/Context/rubric version, full-task rerun, or model-based replay was performed. User paused before the proposed offline repair began.

## Cumulative resources

- Models4318/5000, remaining682, including all failures/replays/prior carry. This continuation added13; diagnosis and packaging added0.
- Formal full Live89/100, remaining11. This continuation added1; diagnosis0.
- Environment reruns5/10, remaining5. The h-14 retry was not started and is not charged. Prior consumed quotas and the earlier two explicit timeout exceptions are retained.
- Holdout Live Google known lower bound67, plus11 witness requests gives at least78 combined. Six interrupted formal attempts lack exact product Google totals: exact cumulative Google remains UNKNOWN. Diagnosis used0 Google API/model calls; its other read-only source traffic is separately recorded.
- Every continuation is sequential with independently drawn120-240s ordinary finish-to-start gaps. The preceding source15-minute cooldown was respected before h-14. The next draw151s was superseded by source cooldown and then explicit user pause, not executed as another attempt.

## Verification and delivery

All frozen Live input hashes and raw execution/diagnosis hashes are verified. Production is byte-identical to8487a844; no repair branch/patch was created or merged. Six new offline scheduler controls passed before h-14, with0 network/models. Diagnostic reads are real external read-only observations and are not reported as offline fixtures or product acceptance. No fresh five-gate run was needed for this paused evidence-only delivery; no new gate PASS is claimed. Raw HTTP CRLF and source DOM whitespace are preserved, so raw-data whitespace diagnostics are not normalized away.

All11 complete result files are already tracked and are indexed for remote reviewers; all new partial run records, diagnostics, receipts and raw materials are included in the private branch push. No public publication, mainline change or capability evaluation. State: PAUSED_BY_USER; await independent remote review and new user instruction.

Last Live input freeze SHA256: `b99babc38d91b491730e32c8506b1afbb22aa13ff980263f41019d31c07fb5a7`.
Blind packet SHA256: `7c7b9ec0b5a35e08b65055ba074b382b851dd1c5fe76d679032a541d7ee911ef`.
