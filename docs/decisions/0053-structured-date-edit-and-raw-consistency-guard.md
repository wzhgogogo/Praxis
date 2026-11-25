# ADR-0053: Structured date edits and DATE.raw consistency

- Status: Accepted, user-directed Round 28, 2026-11-25
- Document revision: 1.0
- Partially supersedes: [ADR-0052](0052-relative-day-offset-and-date-binding.md)
- Source of truth for: structured workspace date edits and deterministic validation of emitted DATE facts

The semantic model chooses which dates apply to a free-text request. Background travel, exclusions, retaining a date and choosing between alternatives are semantic decisions. This supersedes ADR-0052's free-text DATE omission repair and sentence-level date conflict and exclusion rules. A free-text proposal without an ASSERT or CORRECT DATE passes through without date inference. The relativeOffsetDays protocol (2–365), trusted Tokyo natural-day materialization, conflict identity and scoring remain in force.

The date chooser sends a fixed Change command ending in an ISO date. A valid selected date is authoritative when the model emits an ASSERT or CORRECT DATE. Omission, CONFIRM, NEGATE or an invalid target enters CONFLICT. Existing semantic-conflict waiting prevents search or availability calls.

Free-text ASSERT and CORRECT DATE facts require a complete literal quote in the current message after NFKC and case normalization. Supported relative words supply their bounded offset. Supported calendar words must agree with the model's complete materialized date and be legal Gregorian days. Yearless month/day uses the nearest non-past occurrence within 365 days of the trusted Tokyo date. Calendar disagreement enters CONFLICT.

For ordinary weekdays, reuse the existing Tokyo weekday materializer to resolve the raw word and compare the complete date to the model's materialized date. For example, from 2026-11-24 in Tokyo, 周五 resolves to 2026-11-27. A model date of 2026-12-04 conflicts even though it is also Friday. This/next week uses the Tokyo Monday of the named week as the reference, including when the qualifier immediately precedes the quoted weekday in the message. A model result outside that specific day enters CONFLICT. When a matching weekday instruction from Prompt v29 quotes the complete week-qualified expression, bind it to the non-past target using the trusted Tokyo day offset and retain the original DATE.raw.

Offline acceptance covers lexical and arithmetic guards, actual persistent message outcomes and the structured browser journey. Free-text omission and wrong selection among valid dates remain model quality risks for real semantic evaluation.
