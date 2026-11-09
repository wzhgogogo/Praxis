# v3 witness policy and run boundary

Status: draft / not integrated until gates and main freeze. Use the published main SHA, no private original/manifest copies in repository.

Manifest witness may carry `allowKnownUnavailableCertificate:true`; false or other values are invalid, absence retains positive-only gate. `allowDetailOnlyCertificate` remains refused. Unknown vacancy never starts a required certification. Actual false with explicit flag admits NO_POSITIVE_WITNESS_DIAGNOSTIC; actual true uses STANDARD_G6 even with flag. Negative witnesses never become positive known-feasible evidence, and product claims still pass original independent evaluation.

Outer batch.witnessPolicies lists planned ID/policy, including not-yet-run cases. Per-attempt certificationMode/witnessExists come from original execution/failure; inner batch slots and execution/failure also carry declared policy and actual observation. This is reporting only: no score override, automatic replacement, extra request or model call. Existing eighteen planned slots unchanged.

After main publication: certify-only --cases p3b-holdout-03 using external proposed-manifest-v3.json SHA2a91aef4ba68520f0b66b56c288ada0751b3f4180d30b20977b0446e40e794cf and existing original/active ledger, output .eval-artifacts/phase3b/heldout-certification-third. Full commitment/manifest checks, env-file, clean fixed main SHA, pacing/quota remain. If true, normal command without --cases on SAME SHA/v3/ledger, output .eval-artifacts/phase3b/heldout-run-20261109. Every planned run still gets its own existing witness and per-case health; pre-certification is not reused.

No code changes, direct private-file reading or manual intervention during execution. Non-health stop -> preserve/report raw batch/receipts and wait reviewer; health-failure recovery alone permits max2 --resume, same identity/ledger/source. No additional certificates. Source slot times quoted exactly as JST, operational timestamps CET. Report each receipt/verdict/elapsed/models and cumulative, never aggregate a pass rate.
