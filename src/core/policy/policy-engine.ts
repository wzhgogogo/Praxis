import type { CommitPolicyInput, PolicyDecision, PolicyDenialCode } from "./contracts.js";

function denied(code: PolicyDenialCode, decidedAt: string): PolicyDecision {
  return { allowed: false, code, decidedAt };
}

export class PolicyEngine {
  evaluateCommit(input: CommitPolicyInput): PolicyDecision {
    if (input.outcomeUnknown) {
      return denied("OUTCOME_UNKNOWN", input.now);
    }
    if (!input.taskAllowsCommit) {
      return denied("TASK_STATE_DISALLOWS_ACTION", input.now);
    }
    if (input.hasActiveAttempt) {
      return denied("ACTIVE_ATTEMPT_EXISTS", input.now);
    }
    if (!input.offerHealthy) {
      return denied("OFFER_STALE", input.now);
    }

    const authorization = input.authorization;
    if (!authorization) {
      return denied("AUTHORIZATION_MISSING", input.now);
    }
    if (authorization.proposalId !== input.proposal.id) {
      return denied("AUTHORIZATION_PROPOSAL_MISMATCH", input.now);
    }
    if (authorization.scope !== "ONE_TIME") {
      return denied("AUTHORIZATION_SCOPE_UNSUPPORTED", input.now);
    }
    if (authorization.revokedAt) {
      return denied("AUTHORIZATION_REVOKED", input.now);
    }

    const now = Date.parse(input.now);
    const approvedAt = Date.parse(authorization.approvedAt);
    const expiresAt = Date.parse(authorization.expiresAt);
    if (
      !Number.isFinite(now) ||
      !Number.isFinite(approvedAt) ||
      !Number.isFinite(expiresAt) ||
      approvedAt >= expiresAt
    ) {
      return denied("AUTHORIZATION_INVALID", input.now);
    }
    if (approvedAt > now) {
      return denied("AUTHORIZATION_NOT_YET_VALID", input.now);
    }
    if (expiresAt <= now) {
      return denied("AUTHORIZATION_EXPIRED", input.now);
    }

    return { allowed: true, decidedAt: input.now };
  }
}
