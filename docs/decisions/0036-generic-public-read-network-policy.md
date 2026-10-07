# ADR-0036: Generic public browser reads and reviewed source queries

- Status: Accepted; implementation pending
- Document revision: 1.0
- Last updated: 2026-10-07
- Source of truth for: Generic public browser network admission and guarded UI permissions
- Related ADRs: [ADR-0035](0035-browser-read-network-boundary.md), [ADR-0017](0017-controlled-browser-read-executor.md)
- Related documents: [Data, Context and Security](../architecture/DATA-CONTEXT-SECURITY.md), [Policy, Execution and Verification](../architecture/POLICY-EXECUTION-VERIFICATION.md)

## Context

The exact endpoint policy in ADR-0035 blocks legitimate source reads when a
public query endpoint was omitted. The latest H001 Live exposed an omitted
initial calendar GET; official restaurant websites also need a shared policy
without a separate endpoint inventory for every website.

The user selected the Playbook's permissive same-origin GET policy after an
explicit comparison with retaining review for unknown dynamic requests. This
decision accepts residual risk from public GET endpoints with undisclosed
effects. GET and a sensitive-word filter do not prove absence of business
effects; audit records cannot undo a dispatched request.

## Decision

Replace the unknown-GET default in ADR-0035 with two modes:

1. **Generic public read.** In a new isolated, unauthenticated context, allow
   public documents, static GET/HEAD resources and GET/HEAD dynamic reads on
   the admitted document origin. Reject sensitive paths, URL credentials,
   personal-data or credential query fields, cross-origin dynamic reads and
   all other methods before dispatch. Do not load a personal profile, inject
   account credentials or fill personal-data fields.
2. **Reviewed source.** Use the generic policy plus source-owned declarations
   for independently reviewed public reads, including exact POST endpoint,
   field and primitive-type grammar. An explicitly reviewed public query or
   document may have reservation terminology in its path; a generic text
   filter must not silently retire that existing reviewed read. No rule
   authorizes a booking, payment, cancellation, login or account mutation.

The shared boundary blocks Service Workers and WebSockets before the first
page. Redirects do not inherit admission: a destination must be separately
admitted before any follow. An observed navigation does not authorize a
sensitive action. Source rules and diagnostics are data; the browser core
contains no website-specific policy branches.

After the runtime actually marks the isolated session `INSTALLED`, generic
non-sensitive click, checkbox/radio, option, range, region scroll, public
search fill and page Escape actions can use the shared executor. Remove
source-specific UI permission functions. Current opaque references, control
state, goal-bound date/party/time values, denied sensitive UI actions and the
run budget remain authoritative. Unguarded sessions retain narrow permissions.

Admission never establishes identity, HARD facts, current-query completion,
inventory or an Offer. Existing evidence and result acceptance remain intact.
Known or observed write behavior must be blocked; changing a method or hiding
an action behind GET does not supply Policy or Authorization.

## Consequences

- Previously unlisted same-origin public GET queries can load without adding
  one rule per endpoint. Sensitive GET and cross-origin reads still fail closed.
- Unknown public GET effects remain a stated policy limitation. Neither a
  clean network log nor a successful HTTP status certifies universal read-only
  behavior. Do not report this policy as a proof against every possible write.
- Reviewed query POST remains narrow; ordinary website forms cannot submit.
- Recording/replay must remove credentials, cookies, challenge tokens and
  unrelated personal data. Policy drafts remain untrusted until source review.
- Validate permitted queries reaching an independent receiver as well as
  denied requests having zero arrivals. A known-feasible task must still
  complete within its acceptance budget; correct refusal alone is insufficient.

## Alternatives considered

- Retain exact review of all dynamic GETs: stronger admission evidence, but
  the user chose wider public exploration to reduce false blocking and the
  maintenance cost of long-tail website integrations.
- Treat every GET as intrinsically safe: rejected. Sensitive-request filters,
  isolated sessions, explicit source exceptions and the residual-risk statement
  are part of this decision.
- Widen UI without an installed network boundary: rejected.
