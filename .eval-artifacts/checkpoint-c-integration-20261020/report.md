# Checkpoint C integration — offline handoff

- Evidence status: current integrated executable / exposed development calibration; not Clean Baseline or Checkpoint C Live acceptance.
- Branch: `codex/integration-checkpoint-c`; isolated managed worktree. Primary branch, source feature branches and historic frozen evaluation worktrees are unchanged.
- Scope: sequential merges, necessary Context unification, five offline gates, existing22 calibration and documentation. Website/model/probe/Live calls: **0**. Name-resolution benchmark item4 remains deferred.

## Inputs and commits

| Role | Frozen commit |
| --- | --- |
| Latest origin/codex/feat-live-restaurant-read-path fetched at task start | `13c93a325a80a97eb2c663613c4360776b5afe5d` |
| P2-2 selection input | `7dfeb692dfb04ed5a62c767f9694fc88c493cfb2` |
| First merge | `41d677ce906065771cfefb9601ec785a87cb3f30` |
| P2-3 conditions input | `89e0dfb2159c816095e6995827b53537ed3fe73b` |
| Second merge / integrated production code and calibration freeze | `5309545a639aeb3958b1ea60ba2987f0cff250d1` |

The final handoff commit follows these two merge commits and changes documentation/evidence only; use the pushed integration branch HEAD for review. Source branch refs are not advanced. No release/configuration/Gold/variant/witness/seed or prior recording was rewritten.

## Conflict resolution

First merge:5 documentation files. Second merge:12 files.13 distinct conflicted paths in total. Stage blob IDs and individual resolutions are in [P2-2 conflicts](merge-p2-2-conflicts.json) and [P2-3 conflicts](merge-p2-3-conflicts.json).

| Merge | File | Resolution |
| --- | --- | --- |
| p2-2 | `docs/STATUS.md` | Keep both histories; reconcile revisions, table headers and actual index counts. |
| p2-2 | `docs/history/DEVLOG.md` | Keep both histories; reconcile revisions, table headers and actual index counts. |
| p2-2 | `docs/history/TEST-LOG.md` | Keep both histories; reconcile revisions, table headers and actual index counts. |
| p2-2 | `docs/history/monthly/2026-10-index.md` | Keep both histories; reconcile revisions, table headers and actual index counts. |
| p2-2 | `docs/history/monthly/2026-10.md` | Keep both histories; reconcile revisions, table headers and actual index counts. |
| p2-3 | `docs/STATUS.md` | Keep both histories; reconcile revisions, table headers and actual index counts. |
| p2-3 | `docs/architecture/INTERFACES-AND-SCHEMAS.md` | Combine feature contracts; current Context@15/State@17/Prompt@27; isolated results remain linked. |
| p2-3 | `docs/history/DEVLOG.md` | Keep both histories; reconcile revisions, table headers and actual index counts. |
| p2-3 | `docs/history/TEST-LOG.md` | Keep both histories; reconcile revisions, table headers and actual index counts. |
| p2-3 | `docs/history/monthly/2026-10.md` | Keep both histories; reconcile revisions, table headers and actual index counts. |
| p2-3 | `docs/integrations/CAPABILITY-MATRIX.md` | Keep newer header and both feature capability entries. |
| p2-3 | `src/domains/restaurant/agent-context.test.ts` | Combined Context@15 in type/projection/assertions; both feature fields and all tests retained. |
| p2-3 | `src/domains/restaurant/agent-context.ts` | Combined Context@15 in type/projection/assertions; both feature fields and all tests retained. |
| p2-3 | `src/domains/restaurant/agent-decision.test.ts` | Combined Context@15 in type/projection/assertions; both feature fields and all tests retained. |
| p2-3 | `src/domains/restaurant/read-assessment.ts` | Both imports retained: first-check selection scope and HARD price assessment. |
| p2-3 | `src/harness/restaurant-harness.test.ts` | Combined Context@15 in type/projection/assertions; both feature fields and all tests retained. |
| p2-3 | `src/infrastructure/postgres/postgres-runtime.test.ts` | Combined Context@15 in type/projection/assertions; both feature fields and all tests retained. |

No side was selected wholesale for code. The only shared source import conflict retains both modules. Context fields and persistence/assertions share one new version. Automatically merged source paths were also covered by the full gates, including Tabelog busy handling plus price extraction.

## Final versions

Version axes are read from each immutable input commit, not inferred from old reports; [machine-readable table](versions.json).

| Axis | Base | P2-2 | P2-3 | Integrated |
| --- | --- | --- | --- | --- |
| Agent decision Prompt | 25 | 27 | 25 | **27** |
| Agent Context Schema | 11 | 14 | 12 | **15** |
| Agent Action Schema | 4 | 4 | 4 | **4** |
| Restaurant State | 16 | 16 | 17 | **17** |
| Restaurant TaskDefinition | 14 | 14 | 14 | **14** |
| Browser decision Prompt | 16 | 16 | 16 | **16** |
| Browser Action Schema | 11 | 11 | 11 | **11** |
| Retrieval Prompt | restaurant-discovery-retrieval-prompt@5 | restaurant-discovery-retrieval-prompt@5 | restaurant-discovery-retrieval-prompt@4 | **restaurant-discovery-retrieval-prompt@5** |
| Retrieval Schema | 2 | 2 | 1 | **2** |
| Semantic Prompt | v21 | v21 | v21 | **v21** |
| Semantic Schema | 3 | 3 | 3 | **3** |
| Evaluator | restaurant-hybrid-read-diagnostic-evaluator@29 | restaurant-hybrid-read-diagnostic-evaluator@29 | restaurant-hybrid-read-diagnostic-evaluator@30 | **restaurant-hybrid-read-diagnostic-evaluator@30** |
| Evaluator rubric | restaurant-hybrid-read-diagnostic-rubric@25 | restaurant-hybrid-read-diagnostic-rubric@25 | restaurant-hybrid-read-diagnostic-rubric@26 | **restaurant-hybrid-read-diagnostic-rubric@26** |
| PriceFacts | absent | absent | restaurant-price-facts@1 | **restaurant-price-facts@1** |
| Condition policy | absent | absent | restaurant-condition-policy@1 | **restaurant-condition-policy@1** |

Context@15 is a new combined contract: P2-2 availabilityPath/distance/selection scope and P2-3 source-attributed price commercial notes coexist. Existing historical captures keep their own schema versions; no compatibility branch is added. State@17 and the existing explicit development reset protocol come from P2-3; no database was accessed/reset.

## Behavior and preservation

Relative to the source base, the integration retains:

- P2-2 source-derived DIRECT/NAME_RESOLUTION/NONE paths, shared first-check scope for >=3 uninvestigated in-radius DIRECT candidates, strict irrelevant action fields, bounded busy-page handling/English outlet normalization, region revisit prevention and LOCATION rebinding, and recorded stage-timing diagnostics.
- P2-3 quoted numeric meal/course prices with tax/meal/add-on scope, guide-fact retention across reads, approved around-price tolerance, HARD price verification, persisted MET/NOT_MET/NOT_CHECKED condition states and English Web disclosure, and independent price evaluation.
- The newer source-base retrieval Prompt@5/Schema@2, HARD-only shared keywords and sparse-list constraints; P2-3's older retrieval versions do not roll these back.

The integration introduces no extra product behavior beyond combining those branches and assigning Context@15. Identity, radius, freshness, availability and authorization rules remain as implemented in the inputs. Menu prices do not imply plan inventory or Offer prices. No request pacing proposal or name-resolution methodB was enabled.

[Test retention](test-retention.json): all source-base and both branch test files and named test declarations remain, including parameterized titles/multiplicity. Integrated83 files/942 named declarations; P2-2 83/937 and P2-3 82/921 have zero missing files/declarations. These declaration counts differ from executed test counts because of parameterization; green gates verify actual assertions. Only necessary shared schema expectations were reconciled, with no skip/todo/exclusion added.

## Gates and calibration

| Check | Result | Log |
| --- | --- | --- |
| npm run typecheck | PASS | [typecheck](typecheck-initial.log) |
| npm run arch:check | PASS /0 forbidden dependencies | [architecture](arch.log) |
| npm test | **972/972**,0 failed/skipped/todo | [default suite](test.log) |
| npm run build | PASS | [build](build.log) |
| npm run test:browser:fixture | **121/121**,0 failed/skipped/todo;278972.547ms | [local Chromium](browser.log) |
| Original22 artifact evaluations |22 completed,0 model/network | [evaluation run](calibration.log) |
| Existing independent comparator | **22/22 result types;20/20 S0 declarations;8/8 delivered subtypes;0 false qualified** | [comparison log](calibration-comparison.log) |

Calibration reuses the P2-3 wrapper and unchanged E1 evaluator entry/comparator, with a new output directory/freeze only. All354 bound source/input/configuration files are SHA-verified before/after. The original22 inputs, reviewer labels, Gold corrections, observations and independent network rules are byte-identical. Automatic output hashes were saved before the separate comparator opened labels. [Freeze](calibration-freeze.json), [automatic outputs](calibration/summary.json), [full comparison](calibration/comparison/comparison.md), [verification/log SHAs](verification.json).

## Four-layer evidence and limits

1. **Outcome:** all22 historical result types match the original labels. This calibrates the evaluator; it is not22 new product successes or an integrated Live result.
2. **Stage/mechanism:** L0/L1 scripted transports, existing integration suites and local Chromium fixtures cover the merged runtime/selection/price/condition paths. They do not prove current source-site structure, inventory or real-model end-to-end behavior.
3. **Severity:** normal S0 declarations20/20; two interrupted cases remain NOT_EVALUATED as authorized. Network boundary9 evaluated ABSENT and13 historical EVIDENCE_GAP,0 rule gaps. No aggregate claim that S0=0 or the full read-only boundary is verified.
4. **Attribution:** merge preservation and shared Context wiring are supported offline; final delivery, new-location performance and timing benefits remain for separately authorized Checkpoint C evaluation. No website, real model, discovery, full Live, controlled write or name-resolution benchmark item4 was run.

Five gates and calibration meet this integration handoff slice. Push only this branch and stop for independent review; do not merge it into the source/main branch.
