# ADR-0035: Source-owned browser read network boundary

- Status: Accepted
- Document revision: 1.6
- Last updated: 2026-10-07
- Source of truth for: Browser-context network admission for controlled public reads
- Related documents: [Data, Context and Security](../architecture/DATA-CONTEXT-SECURITY.md), [Policy, Execution and Verification](../architecture/POLICY-EXECUTION-VERIFICATION.md), [Capability Matrix](../integrations/CAPABILITY-MATRIX.md), [ADR-0017](0017-controlled-browser-read-executor.md), [ADR-0034](0034-qualified-read-scope-and-investigation-budget.md)

## Context

The browser executor already constrains visible UI actions, but a public page
can bootstrap dynamic requests, open sockets, create a Service Worker, or
redirect before an observed UI action. HTTP method and a button label do not
classify the underlying business effect. A controlled read context therefore
needs a request boundary before broader UI operation is enabled.

Two zero-model, read-only bootstrap observations provide the initial source
evidence. The public TableCheck guide loaded its document, same-source assets
and documented CDN assets, then attempted a cross-origin telemetry POST and a
`production.tablecheck.com` availability-calendar POST. The latter was blocked
before dispatch; its body and response semantics were not inspected. The public
Tabelog Tokyo search loaded its document and documented static origins, made a
same-origin GET to `/contents/reserve_date_status_list` with public bootstrap
keys, and attempted third-party telemetry writes. Its public detail calendar
also has a four-step GET read chain: initial dates, date status, party choices,
then time choices. The source client and saved production observations supply
each exact path and public key grammar; the rules do not classify any response
as inventory. A controlled receiver also showed that ordinary Playwright
routing sees only the first URL of a redirect, so a later hop can otherwise
reach an unreviewed origin.

## Decision

Every guarded read starts in a new isolated browser context. The runtime sets
`serviceWorkers: "block"`, installs HTTP routing and WebSocket routing before
creating its first page, and does not reuse a pre-existing Cloudflare page or
context. If a remote runtime cannot create such an isolated context, guarded
wide UI operation is unavailable and stops explicitly.

Infrastructure receives source-owned, code-supplied rules; it does not contain
TableCheck or Tabelog branches. A rule may admit only:

1. an exact public document origin/path supplied by the adapter;
2. static `script`, `stylesheet`, `font`, `image` or `media` GET/HEAD resources
   on the adapter's observed origin/path prefixes; and
3. an observed dynamic read endpoint with exact origin/path/method and a
   public-field allowlist.

The source rule describes read admission only. It cannot establish outlet
identity, HARD criteria, request satisfaction, inventory, or an Offer; those
remain adapter and Domain evidence checks.

All other requests are blocked before dispatch. This includes unknown GET,
all WebSockets, unknown dynamic fetch/XHR and sensitive public-looking GETs.
The TableCheck public guide attempted
`production.tablecheck.com/v2/hub/availability_calendar_v2`; its public field
names (`locale`, `start_at`, `shop_id`, `num_people`) and string primitive types
were captured without values. A source rule admits only that exact flat JSON
POST shape. No request or response value, credential or unknown key is retained.
Admission classifies a public read query only; its response still needs the
existing outlet/request/result evidence rules before it can affect inventory.
The observed Tabelog calendar GETs are not availability evidence and may be
admitted only with their recorded public field names: `initial_vacancy`
requires `rst_id` and permits only `plan_id`, `seat_only`, and
`exclude_unavailable_time`; date status permits only `rst_id`, `plan_id`, and
`seat_only`; party choices require `rst_id` and `svd`; time choices require
`rst_id`, `svd`, and `svps`. Their documented optional keys remain bounded by
the source rule; missing, unknown, or repeated keys stop before dispatch.
Redirects are
blocked before follow (`maxRedirects: 0` or an equivalent pre-dispatch
mechanism); a sanitized Location may be recorded for a later, separately
reviewed adapter rule. A redirect never inherits admission from its first URL.

The current TableCheck rule also admits only the public source grammars
observed in the page client: no-argument geolocation, autocomplete with its
three public key names, and the AI/non-AI search endpoints with their reviewed
required and optional key names. The source's multi-select cuisine field is
the sole repeatable search key. The existing public budget range fields remain
explicitly listed. These rules classify read requests only; search result and
calendar responses still require the adapter's current outlet/request/result
binding before they can affect inventory.

Once an adapter has supplied such a policy and the runtime has marked the
session `INSTALLED`, its current observed, non-sensitive query button may use
the normal `CLICK` action. The browser still binds the action to an opaque,
fresh control reference; the network boundary remains the business-effect
authority. Input fills remain Router-bound, and radio, checkbox, range, option
and sensitive UI actions keep their existing source-specific permissions.
An unguarded session never receives this wider button capability.

## Consequences

- A real public page can continue loading its source-owned document and
  observed static dependencies without treating third-party analytics or an
  unreviewed calendar request as safe.
- A guarded runtime and source-rule Harness may use ordinary non-sensitive
  query buttons after demonstrating the normal public query plus blocked
  sensitive POST, unknown GET, redirect, popup, worker and socket paths.
  Unguarded runtimes retain the narrow structural permissions.
- A public query POST requires its own exact source evidence and rule review
  even if its host form is visibly a reservation form. The reviewed TableCheck
  POST admits no other body fields or endpoints; `failure/data:null` remains an
  unclassified inventory result.
- Artifacts retain only source, method, resource type, public origin/path and
  allowlisted field names. They do not retain request bodies, Cookies, tokens,
  challenge headers, or raw telemetry payloads.

## Alternatives considered

- Allow every GET or same-origin request: rejected because GET can be sensitive
  and same-origin dynamic endpoints can have business effects.
- Use HTTP method, `type=button`, or absent PII as the read-only oracle:
  rejected because none establishes business safety.
- Install a route after an existing Cloudflare page is attached: rejected
  because old Service Workers, sockets and initial requests have already
  escaped the boundary.
- Rely on ordinary `context.route` to recheck redirects: rejected because its
  handler is invoked only for the first redirect URL.
