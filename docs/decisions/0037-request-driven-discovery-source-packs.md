# ADR-0037: Request-driven discovery with source-owned packs

- Status: Accepted; implemented, Phase2 offline verified
- Document revision: 1.1
- Last updated: 2026-10-07
- Source of truth for: Discovery source selection, pack ownership and durable sequence continuation
- Supersedes in part: [ADR-0032](0032-source-native-restaurant-discovery.md) fixed source order and mutually exclusive Google/native discovery; [ADR-0033](0033-native-source-batch-delivery.md) fixed source-stage continuation
- Related documents: [ADR-0036](0036-generic-public-read-network-policy.md), [Restaurant Domain](../domains/RESTAURANT-BOOKING.md), [Capability Matrix](../integrations/CAPABILITY-MATRIX.md)

## Context

The authorized H001→H001–H005 Playbook requires request-driven source selection.
The existing fixed two-source sequence, binary discovery flag and source names
inside shared layers cannot represent cafe recommendation, coordinate-nearby
search and Google discovery in the same execution path. Two actual web sources
already own different query, parsing and grounding rules; these establish the
current need for a small source-pack contract.

## Decision

1. Source packs in integrations own source metadata, query/listing and next-page
   parsing, identity, deterministic request URLs and availability grounding,
   reviewed network reads and browser skill text. The registry supplies the
   current real packs. Only currently used capabilities need implementation;
   packs do not own UI permissions or Task State.
2. A deterministic Domain/application Planner consumes canonical intent,
   authoritative location and pack metadata. It returns an ordered sequence of
   opaque source IDs and queries. Source-specific name branches, URL construction,
   parser branches and Case IDs do not appear in shared application, Domain or
   browser infrastructure. Provenance data is not a source-selection branch.
3. Positive HARD conditions may form a search keyword/category. Negative-only
   or no-HARD requests use location and a general category; negative conditions
   stay in the fact/eligibility stage. Recommendation excludes reservation-only
   sources. Group/same-day priorities follow declared source capabilities.
4. Nearby uses supplied client/evaluation coordinates and the existing radius;
   it does not become a named area or inherit another request's location.
   Google named-place resolution remains shared by sources. Google Places
   discovery is a pack in the same plan, not a mutually exclusive mode.
   Source-specific region mappings belong to pack data and cannot replace
   final distance verification.
5. Durable continuation records the intent-bound source plan, sequence cursor
   and cumulative per-source progress. A chunk is not source exhaustion.
   Observed pending entrances and next pages remain reusable within the same
   budget. Current source-batch investigation and qualified short-delivery
   semantics remain separate from continuation; explicit counts and all
   evidence gates remain authoritative. Mixing discovery sources does not
   establish cross-platform identity or create an entity-merging system.
6. Source-native candidates retain observed same-source identity and entrances;
   Google candidates retain cross-source HIGH checks. Every result still needs
   current identity, geographic scope, HARD evidence and request-bound stock
   when applicable. Browser reads cannot issue an Offer or change Task State.

The fixed nativeStage and binary discovery flag are removed with all callers
and fixtures. Incompatible durable DTOs receive a new owned schema version.
This is pre-Pilot code: no production-data migration or compatibility path is
needed; old experimental development state is explicitly reset rather than
silently reinterpreted. Original artifacts and decisions remain historical.
Semantic, Gold, HARD, identity and radius thresholds and the 500s/50-call global
budget do not change.

## Consequences

Phase2 acceptance requires auditable frozen H001–H005 Planner outputs and
production Router→Provider composition, including negative-only, cafe and
nearby controls. Pure Planner output does not establish source discovery or
inventory. Real-source matrices and full delivery remain later Playbook gates.
Shared code has no source-name branches; a new pack still needs reviewed source
evidence, Capability Matrix and Harness coverage. No generic business framework,
fallback provider or speculative capability layer is introduced.

## Alternatives considered

- Keep two mutually exclusive discovery paths: rejected by the authorized
  Playbook; it hides valid complementary sources and request differences.
- Let the browser model invent source URLs and deterministic query parameters:
  rejected when the current pack can construct them from authoritative inputs.
- Merge candidate identities across platforms automatically: outside this slice;
  discovery origin never substitutes for verified same-store identity.
- Rewrite accepted historical decisions: rejected; only their specified details
  are superseded here.

## Implementation evidence

Phase2 frozen H001–H005 plans retain named-location defaults (H001/H0021km)
and supplied nearby coordinates (H003–H0053km). The actual three-pack
composition presents supported controlled results; source skill, timezone,
location reuse and provider bindings are covered. [Acceptance and limits](../../.eval-artifacts/h001-h005-playbook-20261007/root.phase2.acceptance.json).
No real-source matrix or stock is certified. Current audit provider labels and
source diagnostics remain; third-source zero-core-change acceptance is Phase6.


## 2026-10-10 ADR-0040 partial supersession

用户批准 2026-10-10 [ADR-0040](0040-agent-selected-directory-region-entrances.md)。Decision 4 中由 Pack 数据映射地区入口的部分被替代：删除 tabelogRegions/锚点表，改为 Agent 选择当前观察到的地区入口，LOCATION 由 Executor 填同次解析名称。原 Decision 4 文本保留；Pack 查询 grammar、来源权限和精确坐标资格及其他 Decisions 不变。


## 2026-10-11 nearby radius tightening

用户批准 Playbook §2 第15条：默认附近圆为1,000m，H003–H005评测点默认从3,000m收紧为1,000m。请求或评测显式指定半径仍权威。共享常量只包含默认米数，不含任何评测坐标；历史Gold、基线Playbook和评价保留原文。新评价使用运行时绑定范围，旧交付只另表重算，不覆盖旧结论。

## 2026-10-16 proposed partial supersession of Decisions 2–3

[ADR-0042](0042-agent-planned-discovery-and-search-availability-hints.md) 为 Proposed，提议将检索表达式从第一个正向 HARD 原文的机械投影改为 Agent 的有界选择，并增加只用于查位的搜索级空位线索。仅在用户批准并实施后，部分替代本 ADR Decision 2–3 的表达式生成方式；批准前本 ADR 继续有效。Planner 的来源顺序、Pack 职责以及身份、半径、HARD 和交付资格保持不变。以上原文及既有追加段落不改。
