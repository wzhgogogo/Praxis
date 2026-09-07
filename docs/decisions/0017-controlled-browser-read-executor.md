# ADR-0017: Controlled browser read executor

Document revision: 0.2

## Status

Draft / implementation authorized for the 2026-09-07 local and eval browser slice. It does not alter an Accepted booking, authorization, or production-takeover decision.

## Context

ADR-0013 reserved `GENERIC_BROWSER` as a route taxonomy but the current source adapters independently opened browser sessions and only used deterministic page scripts. A browser deadline could therefore leave duplicate sessions or a late action, and there was no constrained path for a changed but normal read-only page.

The present work needs one bounded mechanism for the two actual Restaurant availability sources, without granting a model State, provider-selection, credential, or write authority.

## Decision

- One `BrowserTaskExecutor` owns a single browser session for one Restaurant availability source chain and closes it when the chain settles or its parent signal aborts. TableCheck and Tabelog site methods use this executor; each method navigation is origin-allowlisted and each date/party operation must equal Router-bound authority.
- The executor loads the file-managed generic `browser-read` Skill plus the current source Skill for every model-assisted read. A site method is only a shortcut: when it is incomplete, its current observation and reason are supplied to the same bounded loop rather than being treated as a Provider failure. The model sees a bounded text summary and executor-created target references, never selectors, arbitrary URLs, HTML instructions as authority, Cookie/token values, or credentials. It can only propose an observed-link navigation, a validated read-only click, an exact observed authoritative date/party button, an authoritative date/party fill or selection, a bounded wait, page-ready declaration, or help request.
- References are bound to the page observation revision and invalidated after any action. Unknown, post-form, login, booking, payment, cancellation, PII, credential, arbitrary JavaScript and arbitrary network targets are rejected. An action producing no user-visible page progress is excluded for the rest of that session. Deterministic Grounding remains the only authority for HIGH identity, HARD criteria, requested conditions, availability, and `PRESENT_RESULTS`; Skills and model explanations cannot create business facts.
- Browser model calls and operations are bounded per outlet; automatic elapsed time is bounded for the whole availability source chain. The parent Router cancellation aborts then waits for the provider to settle instead of returning from a timer race while a browser action remains in flight.
- This is local/development/eval-only browser execution. It does not automate CAPTCHA, enlarge ADR-0016 profile access, create a desktop/takeover surface, add an external write path, or make a model a Restaurant Agent.

## Consequences

- The actual H001 runner and local Web Live composition use the same availability combination; direct fixture composition remains explicit and separate.
- A local Chromium Fixture can prove the generic action boundary, but only a separately reported Live Read-only run can establish current source compatibility or H001 completion.
- The browser diagnostics persist only stage, elapsed time, sanitized URL and bounded action/failure metadata. Raw HTML, page credentials, Cookies and challenge material stay out of ordinary diagnostics.

## Alternatives considered

- Keep one session per source script: rejected because it duplicates lifecycle/timeout handling and makes the TableCheck→Tabelog chain less observable.
- Give the Restaurant Agent unrestricted Playwright or DOM access: rejected because it would let untrusted output bypass Router authority and write protections.
- Treat model page interpretation as availability evidence: rejected because page interpretation alone cannot establish same outlet, conditions, availability, or the results terminal state.

## Related documents

- [ADR-0013](0013-agent-loop-final-hardening.md)
- [ADR-0015](0015-supported-source-search-evidence.md)
- [ADR-0016](0016-local-eval-browser-profile-lifecycle.md)
- [Browser Execution and Live Search Plan](../BROWSER-EXECUTION-AND-LIVE-SEARCH-PLAN.md)
- [Restaurant Booking](../domains/RESTAURANT-BOOKING.md)
