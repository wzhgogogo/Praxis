# Vacancy-only witness certification before manifest freeze

Status: verified integration candidate, source 7d6880d2, full gates PASS; use the published main SHA after reviewer clearance. This change ran no real certification. Private original/manifest remain outside repository.

Use the same committed original, validated filled manifest, activated held-out ledger, clean fixed source SHA and --env-file as the formal runner. The execution authorization flag is still required even though this mode never starts Live. It does not require constructing Google/DeepSeek clients or browser sessions.

```sh
PRAXIS_RUN_HOLDOUT_LIVE=1 node --env-file=/private/credentials.env --import tsx src/eval/restaurant/agent-loop/g6/run-holdout.ts --certify-only --original /private/original.txt --manifest /private/proposed-manifest.json --manifest-sha256 MANIFEST_SHA --source-sha FROZEN_MAIN_SHA --budget /private/active-budget.json --certify-output .eval-artifacts/phase3b/heldout-certification-first
```

The output directory must be new and its parent must exist. --certify-only cannot combine with --output, --resume, --review or --validate-only. No product session, model call, Live charge, formal ledgerId/output-root binding or formal input-hashes.json is created. Certification uses the existing witness.read(..., false): one vacancy GET per case, no detail GET, unchanged public URL contract, credential omission, manual redirects, 20s/8MB/no-retry bounds. All actual GET attempts are precharged and at least5s apart, considering the last existing ledger GET.

Each output contains certification-hashes.json (original/manifest/case/source hashes and ledger path), certificates.json (each ID, exists true/false/null, checkedAt, original responseSHA256, status, sanitized bodyRef/recording status). Response bytes pass the existing public JSON size/privacy rules and own-credential scan BEFORE persistence; private turns use the normal redactor. Saved bodies have separate savedSHA256 in metadata. Unsafe bodies are omitted, never written raw. Failed requests have exists=null; absent response evidence has null SHA/status. Unknown JSON and non200 remain observable, no retry, next case continues. Structural/quota/output errors stop instead of spending unaccounted GETs.

All certify-only charges are recognizable by holdout-certify: IDs. Across output directories and changed proposed manifests, the SAME canonical ledger allows at most12 certification GETs (first6 plus at most6 backup certifications), within the existing126 total. A ledger-scoped process lock serializes certification writers; no formal binding fields are changed. Use a different new certification output after reviewer edits a proposed manifest; keep old results. Do not activate/reset a new ledger to evade the cap.

After reviewer finalizes witnesses and the manifest, invoke the ordinary runner with its final manifest SHA and output root. It still certifies every planned run separately; preliminary certificates are neither cached nor substituted for those witnesses. Certification is only evidence of vacancy at checkedAt, with identity annotations supplied by the reviewer; it does not prove a qualified product delivery or any reservation.
