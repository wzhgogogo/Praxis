# HARD evidence scope — completed, awaiting independent review

- Status: draft / not integrated; exposed saved regressions, not a clean Live baseline.
- Completed: 2026-11-03T10:02:27.636543+01:00 (Vienna, CET UTC+01:00).
- Branch: `codex/fix-phase3b-positive-hard-source-roles`; base main `db1f44a2238b44fa92cff58dae4e17e8903875a5`.
- Final verified candidate: `a5625ddf173025de32e7397a28547caadf03a783`. Product source fix ends at `f3900dc0`; later delivery commit only adds reports/logs/documentation.
- No main merge. Push/remote SHA is confirmed separately by `ls-remote` and the delivery message.

## Result and authority

Non-price positive HARD qualification and its display now share `acceptedPositiveHardEvidence`; qualification does not depend on the display's old English-literal field test. A positive MODEL_JUDGMENT must cite at least one source with an accepted code-owned role. Merchant menu/website/introduction text and recognized source categories qualify; an observed own-page name/H1/alias qualifies only when it explicitly contains the requested type words. CUSTOMER_REVIEW is excluded. Review-only support, an unrelated name, wrong outlet/page and expired source fail closed. Existing current-source replacement, HIGH identity and offer/service-scope filtering remain in place. The card is limited to facts admitted for that result's offer.

Source document role metadata is bound before model selection, using the original source fields, observable H1/review headings, public review ARIA regions, and exact names from the bound source identity. Skipping overlong statements cannot shift review roles. A model CATEGORY selection cannot relabel NAME or a marked review. These transient roles are omitted from model messages; no model-authored provenance is accepted. Ordinary Google/structured provider category claims retain their established admission, including a category with no quote. Such a card shows its basis without inventing quotation text.

Prices are outside this new role filter: their prior model conversion remains, while applicable parsed numeric price evidence alone controls budget MET/NOT_MET. Negative HARD, price applicability, identity, inventory and service-scope rules are not relaxed. No Guard, Prompt or external schema/version constant changed. State25 and TaskDefinition23 remain; the one optional source-document metadata map is transient, not a new State field.

## Original D4 and c05 evidence

| Regression | Original / red | Final / green | Independent source basis |
| --- | --- | --- | --- |
| D4 `kushikatsu`, Tabelog13173601 | Eligible but NOT_CHECKED | Eligible and MET; exact same quote and URL | “揚げ物メニュー：串カツ、アジフライなど” at `https://www.1bangai.org/daioh` |
| c05 Kaga `kaiseki restaurant` | Eligible but NOT_CHECKED | MET, based on the outlet name | Same saved own-page H1 explicitly says Kaiseki; its review title is not support |
| Review title/body only | Accepted before source-role gate | No positive judgment / not eligible / NOT_CHECKED | Code role CUSTOMER_REVIEW |
| Name without requested type, including non-H1 “Kaga” | Model label could be accepted | Rejected; NOT_CHECKED | Code-bound NAME, no requested type word |
| Wrong source page/outlet, expired source | Counter controls | Not eligible / NOT_CHECKED | Existing candidate/URL binding plus explicit source expiry |
| Recognized category without quotation | Eligible category | MET + category basis, sources=[] | Existing source-owned category claim, no manufactured quote |

D4 input is read directly from Git `769766455c38c369fa61bad56112de45230dfc68`, path `.eval-artifacts/phase3b/g6-development-live/d4-d6-safety-only/runs/D4/execution.result.json`; SHA-256 `d74f901dfa54b5a42e9bfd8823da291b23ecb16c08dd132602e9a11f229eaa18`. The diagnostic uses the original display time, not today's clock, and does not alter the historical result.

c05 compressed product fixture SHA-256 `307abb15376b020ea65af8e5aaf7c5e58b57c0d9a84e53a0658f8cae45bd60e1`. Minimal exact source headings come from same-run snapshot0008, SHA-256 `dd0256fb8d771ab72fdd7cf2631a130bb5a074e936ed4b05a85c0a7fb90d3ff9`. Their extraction offsets/digests are in the adjacent provenance file. Historical selected words, IDs and judgments stay unchanged.

Legacy selected documents did not capture roles. Fifteen source-role annotations are regenerated from the existing saved pages with source SHA, exact original selected-text SHA, source URL, evidence ID and original run ID. They restore metadata only, without adding words or altering raw runs. Roles are not borrowed across runs that happen to share a text/document hash. The generator and every source reference are frozen in this branch.

## Red/green and assertion synchronization

- `ddc64451`: separate user-approved c05 contract-sync commit. NOT_CHECKED becomes MET + observed NAME quote; all presentation, current-fact, supersession and no-read assertions remain.
- `a703e6d7`: freezes original D4 diagnostic and Domain/model source-role controls. D4 and c05 fail at NOT_CHECKED versus MET; review title/body and a name without the type fail because the old code accepted them.
- `9b7a7ce0`: separately records the authorized old display contract synchronizations and source metadata restoration. NAME and recognized unquoted category are allowed; CUSTOMER_REVIEW stays rejected. In frozen h-12, outlets13318138 and13196646 had legitimate MODEL_JUDGMENT and literal category “Motsu-nabe”; both cards change NOT_CHECKED → MET with exactly the same original quotes. Remaining price/state/time/identity comparisons are unchanged. The frozen evaluation/Gold files are not edited. Full assertion diff: `contract-sync.diff`; per-row source chains: `approved-display-differences.json`.
- C18 tempura and Utou tests keep their assertions. Missing original field roles are restored from saved pages; no menu or specialty text is invented. All action-validator cafe controls stay byte-for-byte unchanged and pass.
- `5232ae11` → `912be499`: valid plain-name red/green; non-H1 exact source name cannot masquerade as merchant description.
- `a987712d` → `f3900dc0`: price-conversion boundary red/green. A model label still cannot replace parsed applicable numeric price evidence.
- Web renderer component: old “Observed [name]” fails the required basis label. Final real local Chromium shows “Based on outlet name” and an unquoted “Based on Google category”, with14 intercepted fixture requests and0 real source requests. Price prefix “Observed price” is preserved.

The first Web probe used an overly exact case-button locator and timed out; `proof/web-red.log` is retained but is **not** red evidence. Corrected `proof/web-red-02.log` is the actual basis-label assertion red. The initial missing c05 fixture likewise was not used as business evidence; the corrected `proof/c05-red.log` contains the valid status assertion failure.

## Final clean-tree gates

All six entries below ran at `a5625ddf173025de32e7397a28547caadf03a783`. Every entry records empty `git status --porcelain` before and after, its exact command, Vienna time, exit code and raw log SHA in `gates-04/gates.json`.

| Gate | Result | Seconds |
| --- | --- | ---: |
| typecheck | PASS | 0.521 |
| arch:check | PASS | 0.225 |
| npm test | 1397/1397, no failures/cancellations/skips/todo | 46.628 |
| build | PASS | 0.564 |
| test:browser:fixture | 188/188, real local Chromium | 130.647 |
| PRAXIS_G2_REQUIRE_PASS=1 test:dom-change | 5/5; all12 pages PASS | 24.239 |

Earlier complete green runs are retained as gates-01/02/03 at their own frozen SHAs; they are not substituted for the final candidate. Repeats were necessary after the basis label, exact-name provenance and non-price boundary changes. No gate required a failure retry, and no assertion or file was skipped. Own final renderer control also records clean pre/post status at the same SHA.

## Old HARD compatibility and protected rules

The immutable44,197-byte regression remains unmodified (SHA-256 `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`). Factory documents, statement selections and complete model requests are byte-equivalent as serialized data. The full current Native result is47,208 bytes, SHA-256 `711cda8aa38db56e29b33063b3962ad372fb44168ea1098a9ea243eb4a00dd6a`; therefore this report does **not** claim full44,197-byte equality. Exactly two metadata paths differ: `/facts/sourceDocuments/0/statementSourceFields` and `/facts/evidence/1/sourceFieldQuotes`. All original claims, judgment conversion, source selection, checks and model requests in that control remain equal. Exact byte proof: `proof/hard-section-bytes.json` recovers the original44,197 bytes after removing only those two metadata fields. Full structural diff: `proof/hard-final-diff.json`; original Gold/baseline is untouched. Existing price restrictions, negative category, supersession, same-source identity, offer scope, cancellation and late-result controls remain in the full suites.

## Boundaries and remaining limits

No changes under A's `src/eval/**` or `src/harness/**`; no site adapter, entity resolver, shared Browser, restaurant-search, Guard or source-pack change. The additional Web source edit is only English name/category evidence labels and an existing explanation for accepted unquoted categories. No Agent action or authority, booking permission, model call or source visit is added. No State/TaskDefinition/Prompt/schema version increment.

Name matching uses normalized literal type words (with generic trailing restaurant/cuisine/food descriptors removed), not a new cross-language alias dictionary. SOURCE_TEXT and public review detection retain ADR0046's documented limits for unlabelled, ambiguous or mixed review content. Marked review roles never support positive HARD, but these controls do not establish universal review detection or model semantic faithfulness. Those limits are disclosed for independent review, not reported as a new Live quality result.

Four-layer report: this is saved-state/fixture regression plus local renderer behavior, with no new Live end-to-end denominator or latency/quality estimate. D4/c05 source-support projection is checked against the supplied decisions and exact historical text; new role rejection is covered by independent constructed counterexamples. No new real-world S0 rate is asserted; the historical results/independent evaluations are not rewritten. The demonstrated first divergence is positive HARD source admission/display, with the corresponding controlled fixes above.

## Calls, ledger and delivery

New real model, Google, restaurant-site, Live, public GET and environment-rerun calls are all0. No `.env`, `answers*.json` or private holdout was read. All test model/source transports are fixtures; “Live” strings in fixture-runner logs do not mean new Live calls. Ledger keeps all740 main rows exactly, unions the2 prior B zero-call stop rows, appends1 current zero-call row (743 total), and leaves limits/cumulative counters unchanged. See `budget-union.json`.

Only the work branch is pushed for independent review; main is not merged. Notify A with the delivery SHA and this report, then stop for review.
