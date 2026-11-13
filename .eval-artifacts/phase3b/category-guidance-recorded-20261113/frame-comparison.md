# Real DeepSeek / recorded-frame comparison

Fixed public contexts; one text call per frame, no browser execution or invented transition. Current Skill + frozen native objective.

| Frame / original sequence | Original action | New accepted action | Result |
|---|---|---|---|
| collapsed-category / #7 | CLICK `observation:4:target:19` group=`` | CLICK `observation:4:target:17` group=`` | PASS |
| parent-collapsed / #9 | CLICK `observation:6:target:18` group=`` | CLICK `observation:6:target:18` group=`` | PASS |
| parent-expanded / #10 | CLICK `observation:7:target:39` group=`` | OPEN_LINK `observation:7:target:36` group=`` | PASS |
| no-calendar-first / #21 | ADVANCE_TO_AUTHORITATIVE `observation:10:target:26` group=`` | REQUEST_HUMAN_HELP `` group=`` | PASS |
| no-calendar-feedback / #22 | ADVANCE_TO_AUTHORITATIVE `observation:11:target:26` group=`observation:11:group:2` | REQUEST_HUMAN_HELP `` group=`` | PASS |
| advance-calendar / #26 | ADVANCE_TO_AUTHORITATIVE `observation:16:target:107` group=`observation:16:group:1` | ADVANCE_TO_AUTHORITATIVE `observation:16:target:107` group=`observation:16:group:1` | PASS |
| advance-party / #28 | ADVANCE_TO_AUTHORITATIVE `observation:18:target:127` group=`observation:18:group:2` | ADVANCE_TO_AUTHORITATIVE `observation:18:target:127` group=`observation:18:group:2` | PASS |
| exact-date / #27 | CLICK_AUTHORITATIVE `observation:17:target:10` group=`` | CLICK_AUTHORITATIVE `observation:17:target:10` group=`` | PASS |
| exact-party / #33 | CLICK_AUTHORITATIVE `observation:21:target:19` group=`` | CLICK_AUTHORITATIVE `observation:21:target:19` group=`` | PASS |

9/9 frame assertions pass; 9 real model calls, 0 GET, 0 Live. Original failures retained in baseline-decisions.json and immutable source recordings. No counterfactual browser effects or end-to-end success inferred.

Calendar advancement uses the actual date-choice group1, not the separate navigation group13; guest advancement uses group2. Okajoki has no such group, so requesting help is the safe correct result rather than inventing group metadata.
