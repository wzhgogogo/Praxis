# Phase2c Live — stopped on outer deadline enforcement failure

Evidence status: current stopped read-only execution; capability evaluation DEFERRED. Private holdout exposed to the approved product only; no tuning. This report contains operational facts, not qualification or exit decisions.

## 1. End-to-end record — capability evaluation deferred

- Planned18 slots; recorded13 (h-01…h-13),15 attempts,14 formal Live attempts,11 complete Runner `result.json` files. h-14…h-18 are NOT_REACHED.
- h-01 attempt2 and h-13 have no complete result after outer deadlines. h-03 attempt1 is the retained source-busy ENV_FAILURE without final result; its approved retry produced a result. Missing results are not silently reconstructed, scored as misses, or replaced.
- No QD/MISS/DU, condition/display grades, capability denominator acceptance or phase-exit conclusion is persisted or reported before independent wording review. The unchanged @33 safety-only projection enforces S0 and the environment retry whitelist; its non-safety assessments are discarded. Case03 retains the preapproved no-witness capability exclusion;5/6 certified witnesses and recorded fallback remain unchanged.

## 2. Execution and component controls

- Product equals approved8487a844 / reviewed16e91940 byte-for-byte. Runner configuration, Gold dates, witness material and Evaluator33/rubric29 remain unchanged. No production/semantic/Guard code changed.
- Accepted product verification reused: five gates PASS (default1022/1022, Chromium137/137), calendar69/69, selection5/5, independent calibration22/22. This is historical approved offline evidence, not a new Live capability result.
- Initial two queues: A odd / B even, B start90.243s afterA, maximum2 overlapping formal attempts, separate directories/ledgers and temporary browser contexts. Original per-queue finish-to-start gap5min. TableCheck busy quote triggered sequential fallback at10-23 13:38:25 Beijing; no later parallel start.
- User-approved random-gap amendment: old controller paused after h-10 at14:57:24 with0 active Live; no completed task repeated and no environment rerun charged for handoff. Remaining scopeh-11…h-18 was committed/frozen separately; six offline controls PASS,0 network/models.
- Actual sampled gaps: h-11 215s; h-12 198s; h-13 137s. h-14 drew206s but never started. Draws occur before the wait using independent crypto.randomInt120…240 seconds. Source403/503/429/busy cooldown remains15min; no-status post-transport retry remains2min.
- The new offline freeze entry initially collided with the imported old same-name entry (EEXIST); only the new entry was renamed before Live. Original frozen files were not edited, and the six interval controls remained unchanged/PASS.0 network/models.
- Original11 offline orchestration controls plus the real Runner entry with scripted transport passed with0 network/models. No actual-model replay or new product test gate was run for the interval amendment.

## 3. Safety / protocol severity — no blanket S0=0 claim

- Actual stop: OUTER_500S_ENFORCEMENT_FAILURE_CONFIRMED at10-23 15:27:28 Beijing, between completed runs;0 active Live interrupted at this final stop.
- h-13: outer elapsed502038ms,40 model calls; SIGTERM at the500s ceiling did not promptly stop execution; a subsequent model invocation started after500s. Forced cleanup at502s left no final result. The post-500 call is included in the40-call charge. This violates the requested hard elapsed limit; it is not waived as cleanup.
- Earlier h-03 source busy: Search is unavailable right now. Please try again. This is a busy-page observation, not proof of HTTP403. Automatic SIGTERM did not promptly end that child;8 additional calls started after the signal. Operator verified and killed only that child;15min waiting restarted from actual finish. All29 calls are charged.
- S0_PRESENT was not the reason for this stop. Incomplete artifacts/independent evidence retain unknown status; no comprehensive S0=0 or phase safety acceptance is claimed. Read-only Guard, no forms/slot clicks, permanent TableCheck /reserve denial stayed unchanged. No new external write or personal-information submission was authorized.

## 4. Attribution, limits and next review

- Proven failure scope: the frozen outer stop mechanism did not enforce immediate termination after its deadline/source pause signals. Evidence is signal/finish timestamps plus passive provider START ledgers. Exact library-level signal-handler cause is not claimed proven.
- Product capability is not inferred from this orchestration failure. h-01/h-13 remain ORCHESTRATION_INTERRUPTED and are not retried under the ENV_FAILURE-only whitelist. No product repair or extra Live was attempted after stopping.
- To resume under the same500s promise, the outer must first have a reviewed/frozen deadline-stop repair; this task stops after pushing the preserved outputs and blind wording packet.
- Word packet: pending-wordings.json only;7 artifact entries /8 candidate pairs. Every pair is bound to original artifact SHA and criterion indices; no cross-pair equivalence assumed. Reviewer should read only this packet before subsequent capability evaluation.

## Frozen lineage

- Original Live freeze SHA256: `303b42703b70e01f94b8590b4984159ac9f8875023616cf1a6e699976b08935e`.
- User-approved sequential random-gap freeze SHA256: `f080870439cb2f6acf7cc82b27b5dd476abef245f8799bd428f2061fb7ecab7d`.
- Raw output freeze SHA256: `a253f5bcabb7659a684a0b707cb43223a0c47a5bf6c8c6bc488ca93d38783699`.
- Blind wording packet SHA256: `8d088f20c232c4d4bc3ac8f22c8a26e467152a8213021658062dbcbba4fc661f`.
- Witness source package unchanged: `.eval-artifacts/phase2c-holdout/witness-certification-20261023/certification-package.json`; earliest observation2026-10-23T04:15:40.465Z, common expiry2026-10-24T04:15:40.465Z (10-24 12:15:40 Beijing). Stop occurred before expiry.

## Resource ledger

- Cumulative models **4231/5000** (phase23217 + prior carry1014); full Live **86/100**; environment reruns **5/10**. All source manifest sums and per-attempt passive model ledgers reconciled.
- This task increment:435 models,14 formal Live,2 environment re-entries (h-01 preflight failure and h-03 busy-page failure).0 model/Live for all offline controls, certification or report generation.
- Live Google: **at least59** recorded (including network/source preflight). Exact total UNKNOWN for missing-result h-01 attempt2,h-03 attempt1,h-13. These partial-row counts are lower bounds, never zero or exact totals. Witness Google11 / total witness HTTP42; task Google combined known lower bound70.
- API metadata/Git administration is separate from source/Google/model ledgers. Repository remains private; no Pages/PR/share link or public publication.

## Timing and overlap (Beijing)

| Run | Attempt | Queue | Start | Finish | Outer s | Models | Google known | Result file | Overlap |
| --- | ---: | --- | --- | --- | ---: | ---: | --- | --- | --- |
| h-01 | 1 | A | 10-23 13:14:50 | 10-23 13:15:41 | 51.074 | 0 | 2 | missing | none |
| h-02 | 1 | B | 10-23 13:16:20 | 10-23 13:21:11 | 290.867 | 27 | 5 | present | h-01#2 |
| h-01 | 2 | A | 10-23 13:20:42 | 10-23 13:29:02 | 500.045 | 40 | 2 (lower bound) | missing | h-02#1, h-04#1 |
| h-04 | 1 | B | 10-23 13:26:12 | 10-23 13:31:02 | 290.139 | 22 | 3 | present | h-01#2 |
| h-03 | 1 | A | 10-23 13:34:03 | 10-23 13:39:51 | 348.212 | 29 | 2 (lower bound) | missing | h-06#1 |
| h-06 | 1 | B | 10-23 13:36:03 | 10-23 13:37:02 | 59.409 | 6 | 2 | present | h-03#1 |
| h-03 | 2 | A | 10-23 13:54:52 | 10-23 14:02:58 | 486.384 | 47 | 4 | present | none |
| h-05 | 1 | A | 10-23 14:07:58 | 10-23 14:12:11 | 252.926 | 22 | 5 | present | none |
| h-07 | 1 | A | 10-23 14:17:12 | 10-23 14:24:50 | 458.173 | 47 | 11 | present | none |
| h-08 | 1 | B | 10-23 14:29:51 | 10-23 14:34:48 | 297.273 | 26 | 5 | present | none |
| h-09 | 1 | A | 10-23 14:39:49 | 10-23 14:47:48 | 478.88 | 47 | 4 | present | none |
| h-10 | 1 | B | 10-23 14:52:48 | 10-23 14:57:24 | 275.362 | 25 | 3 | present | none |
| h-11 | 1 | A | 10-23 15:00:59 | 10-23 15:04:18 | 199.327 | 21 | 5 | present | none |
| h-12 | 1 | B | 10-23 15:07:37 | 10-23 15:13:28 | 351.246 | 36 | 4 | present | none |
| h-13 | 1 | A | 10-23 15:15:45 | 10-23 15:24:07 | 502.038 | 40 | 2 (lower bound) | missing | none |

Not reached: h-14,h-15,h-16,h-17,h-18. Source cooldown and administrative handoff are included in actual start/finish spacing; product elapsed is separately retained in timing-and-resources.json where available.

Verification: original933 frozen files and amended2289 files unchanged; exact credential value scan0 hits; maximum artifact<100MiB. Raw outputs frozen before extracting wording. All Runner results remain originals; no capability evaluation output produced.
