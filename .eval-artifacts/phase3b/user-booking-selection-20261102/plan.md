# 用户消息选店切片

- Status: current executable preparation; exposed development response replay, not Clean/Live.
- User decision: 2026-11-02 CET, user explicitly approved this slice and work-branch push; no main merge.
- Base: efeab25483cf58011b7505c32d6da857e41c2533.
- Promise: accepted SPECIFIC_OUTLET booking wording records one unambiguous user selection through existing CANDIDATE_SELECTED; raw PRESENT_RESULTS need not choose again. Missing guests, current availability, B1 source provenance and optional G1 terms remain independent.
- No Agent Prompt, State/TaskDefinition version or terms-reader change; a required version bump stops work before editing. Do not alter A eval files or B G3 files. Real model/Google/public GET/Live 0; no .env/holdout read.

## Failure mechanism and coverage

Original fixtures choose SELECT_CANDIDATE themselves, so they missed the real legal PRESENT_RESULTS route. Freeze A49e37c55 P1-0-8 and P2-0-10 byte-for-byte into C fixtures, use their response.outputText unchanged at the ordinary model boundary, not their old labels. Preserve source/G1/identity/Compiler/Reducer/SQL and both B1 checks. Before product edits prove B1 exists, selected ID absent, terms empty, then fail the required selection assertion. P2 first has a recommendation, then booking without party, then party only; it must reacquire current availability.

Controls: OPEN_ENDED; non-booking basis; ambiguous exact names/partial names; explicit G1 question; Agent-internal choice; Book-on departure; unverified availability; repeated same choice; no BOOKING_PROPOSED/write. Reuse original tests and reserve suite unchanged. A tests retained byte-for-byte.

## Minimal implementation investigation

Only code-inspected accepted booking proposals may request user selection. Keep original goalBasis/reason/quotes transient. Bind a displayed unique outlet before semantic reset when possible; pending selection across a party supplement must be grounded in authoritative message events, never a guessed name or a trajectory-as-state. Recheck current target and existing identity evidence before emitting the existing selection event. State fields and Reducer need not change; stop and report if they do. Mark USER_MESSAGE in its own trajectory with USER event provenance, no invented Agent action or booking authority.

## Evidence and gates

Commit/freeze C input/helper/tests and controlled orchestration before red. Preserve red/green raw artifacts separately. Independent evaluation reconstructs event provenance, actual model outputs, selection/availability ordering, visible link/terms and quoted source material without production eligibility as oracle. This is local composition/replay regression, not G6 Live signoff.

After repair run source integrity, typecheck, arch, npm test, build, Chromium fixture and strict G2 with clean status before/after every gate. Freeze SHA. Update ADR0049 by appending the approved decision, relevant authorities, STATUS/DEVLOG/TEST-LOG/monthly indexes and zero-call ledger entry, union-preserving others. Push only work branch; ls-remote; notify A and stop for review.
