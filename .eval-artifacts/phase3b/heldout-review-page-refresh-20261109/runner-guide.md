# Held-out review continuation

Status: verified integration candidate, source c0b5e4f4; use the published main SHA after reviewer clearance. Prior resume guide/budget remain frozen. This guide supplements them; no real execution authorized here.

Start/resume original, manifest, frozen main SHA and ledger identity/prefix requirements are unchanged. Keep external originals, manifest, budget and every reviewer annotation file available at the same canonical paths for all resumes. Budget remains 22 Live / 126 GET / 4 environment replacements / 2500 model calls (849 inherited). No private original was read in this change.

Add to the ordinary resume invocation:

```sh
--resume .eval-artifacts/phase3b/heldout-authorized-run --review ATTEMPT_KEY /private/reviewer-annotations.json
```

`--review` takes exactly the attempt key and external annotation file; it requires `--resume`. The CLI still requires explicit execution flag, --env-file, clean fixed source SHA, matching private hashes and activated same ledger. One invocation reviews one attempt, then continues the next unfinished planned slot if allowed.

External file format (fictional values only):

```json
{
  "schema": "phase3b-holdout-review@1",
  "attemptKey": "fictional-r1",
  "annotations": {
    "qualificationOracles": [],
    "questions": [],
    "priceOracles": []
  }
}
```

Each optional array uses the existing G6/D4/D8 independent annotation format: qualification oracle name/address/phone/nativeIdentity + hardCriteriaMet/withinArea/evidenceRefs; question expected answer/approvedAnswers and sensitivity; price oracle original page/quote/scope. Supply only applicable arrays. No arbitrary evaluation input replacement: request, product claims, delivered outlets, source text, boundary rows, verdict and approved read rules are forbidden in this file. Source identities/slots/links are re-extracted from original recorded DOM/JSON. Missing source or semantic evidence remains unassessed; reviewer annotations cannot invent absent raw observations.

On first review, pin canonical external file path/SHA and the complete original attempt evidence tree hash before grading. Supplement input/result are separate `evaluation.supplement.input.json` / `evaluation.supplement.json`; original evaluation and recordings remain byte-identical. Every subsequent resume checks the annotation SHA, original evidence hash and supplement result SHA, even without --review. Original S0 or supplemental S0 forbids resume. Supplement NOT_EVALUATED or stopBatch=true remains stopped. Only EVALUATED/s0=0/stopBatch=false becomes EVALUATED_BY_REVIEW and is skipped thereafter.

For a charged attempt without evaluation, original `failure.evaluation.input.json`, `failure.json`, complete `outer-requests.json`, trace/recordings are required. Runner now retains full partial claims and method/body/preflight observations even on failure. The supplement independently recomputes GET/HEAD provenance with the frozen sidecar rules and raw outer method/body/preflight checks, and refuses violations or gaps before evaluating. Original failures without this evidence stay stopped. A verified product failure receives G6 evaluation@5 PLANNED_RUN_FAILED/qualified=false and counts once as a failed planned run, with no replacement and no environment ticket. Existing safety checks still inspect every observed partial delivery/claim.

No real GET, Live, model or private input in the fictional controls. G1 regressions separately use exposed D4/D8 DOM plus explicitly LOCAL_CONSTRUCTION refreshed completeness, clock/session/model envelopes; they do not certify Live question/terms readiness.
