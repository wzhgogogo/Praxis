# ADR-0023: Live read run lifecycle at the Web boundary

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-09-12
- Source of truth for: Live Web read ownership, cancellation, and restart-safe termination
- Related documents: [Web-first workspace](0006-web-first-agent-workspace.md), [Agent-loop control](0011-restaurant-agent-loop-control-refinement.md), [Restaurant domain](../domains/RESTAURANT-BOOKING.md)

## Context

Persistent Case state makes a prior result visible after a browser reconnect, but it does not make an in-process model/browser investigation durable. Treating database persistence as an implicit background job could leave a user seeing a task that looks active after the owning process has stopped. Conversely, holding the HTTP request open hides accepted work and prevents a user from leave/return or cancelling the current read.

## Decision

In `LIVE_READ` mode, after authoritative user input is recorded, the Web application starts one bounded in-process read owned by that Case and returns the active Case immediately. State updates are published through the existing Case update stream; reconnects read the same persisted Case and activity history.

Each active read has an `AbortController` owned by the application, never by the Agent. A user-facing stop endpoint aborts the controller and the Agent loop records `AGENT_LOOP_CANCELLED`; no result is presented. A subsequent semantic message first cancels its prior read, then compiles the new request through the normal semantic path. Router deadlines relay parent cancellation to structured and browser source calls.

There is deliberately no durable queue, automatic restart, or hidden continuation. On graceful shutdown active reads are cancelled. When a Live Case in an in-flight phase is loaded with no in-process owner (including after service restart), it is recorded as an execution interruption and ends accurately. The user can adjust the request and start a new bounded read. Fixture mode remains synchronous and unchanged.

## Consequences

- Users can observe an accepted active Case, navigate away, reconnect, stop the current read, or correct its request without a second executor racing the old one.
- A stopped service cannot be mistaken for a running provider call or a completed result.
- Cancellation is a read-only execution outcome, not an external booking, payment, login, or source write.
- This is not background-job durability; restart-safe resumption requires a future explicitly authorized lifecycle design.

## Alternatives considered

- Keep HTTP open until the Agent finishes: rejected because it prevents usable reconnect/cancel behavior.
- Resume any nonterminal Case automatically on startup: rejected because it can repeat paid/source calls without a current execution owner or user action.
- Introduce a general job queue: rejected because this slice needs visible Case ownership and accurate termination, not an unexposed scheduling platform.
