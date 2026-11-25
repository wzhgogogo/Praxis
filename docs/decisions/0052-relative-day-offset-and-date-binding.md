# ADR-0052: Relative day offsets and current-message date binding

- Status: Accepted; user-directed Round 27, 2026-11-24
- Document revision: 1.0
- Supplements: [ADR-0024](0024-deterministic-time-and-diagnostic-read-completion.md)
- Source of truth for: bounded relative-day directives and their binding before message compilation
- Related documents: [User Flows](../product/USER-FLOWS.md), [Restaurant Domain](../domains/RESTAURANT-BOOKING.md)

## Context

The trusted clock belongs to the application. A model can still return TOMORROW or an incorrectly calculated calendar date for an explicit day-after-tomorrow correction, or omit DATE altogether. In the last case an existing date survives even though the user explicitly changed it. Schema-valid output therefore cannot by itself establish date correctness.

## Decision

Extend restaurant-semantic-proposal@4 DATE with `relativeOffsetDays`, an integer from 2 through 365, alongside TODAY/TOMORROW, explicit dates and weekdays. Semantic prompt@29 requests directives instead of model calendar arithmetic. The additive wire alternative does not change the persistent draft/state schema or introduce a migration/legacy compatibility route. Existing temporal materialization@6 records `RELATIVE_OFFSET_DAYS:N` using the trusted Tokyo natural day, including month/year boundaries. No existing TODAY/TOMORROW interpretation changes.

At the pure Domain compiler boundary, actual Web/application and Hybrid message callers pass the current user message and reference instant. Recognize the bounded point-date phrases today/tomorrow/day after tomorrow, 今天/明天/后天/大后天, N天后/in N days and 一周后/in a week. The original message is authoritative; the model's raw expression cannot invent a different relative day. One unambiguous supported offset supplies the DATE directive even when the model omitted it, or returned a wrong calendar date or wrong TODAY/TOMORROW directive. Materialization uses only trusted time. A time-only edit has no new DATE and keeps the authoritative prior date.

Different offsets in the same proposal keep distinct semantic keys and conflict before any correction. Multiple different relative days in the current message, unsupported bounds, raw-only relative dates, or contradictory clear/confirm instructions fail closed through the existing semantic-conflict/NEEDS_INPUT path, without availability calls. This bounded check is not a general language/date parser and does not infer arbitrary dates, interpret calendar UI or call a model again.

## Consequences

Current message text travels through the existing application and Hybrid compiler calls; no Runtime, Policy, availability, search fingerprint or missing-field rules change. Scorer@4 preserves DATE directive identity (including different offsets), without changing acceptance/scoring policy. All core regressions run offline with a fake model through real persistent message composition and availability ports; external model language quality remains untested.

## Alternatives considered

- Trust a schema-valid model calendar date: rejected; raw semantics and inherited state can disagree with the user.
- Only validate emitted DATE values: rejected; omission would silently retain the wrong old date.
- Parse arbitrary natural-language dates or retry the model: rejected; exceeds this bounded deterministic repair and adds calls.

## Related documents

The original ADR-0024 remains historical and authoritative for unchanged temporal semantics. [Semantic compiler](../../src/domains/restaurant/semantic-compiler.ts) and its binding helper own the deterministic translation; no model writes State directly.
