export type ActionType =
  | "BOOK"
  | "CANCEL"
  | "PURCHASE"
  | "RETURN"
  | "SEND"
  | "SUBMIT_APPLICATION";

export interface ActionProposal {
  id: string;
  taskId: string;
  actionType: ActionType;
  target: { type: string; id: string; counterparty?: string };
  amount?: { value: number; currency: string };
  termsHash: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  reversible: boolean;
}

export interface Authorization {
  id: string;
  proposalId: string;
  scope: "ONE_TIME" | "STANDING";
  constraints?: Record<string, unknown>;
  approvedAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export type PolicyDenialCode =
  | "TASK_STATE_DISALLOWS_ACTION"
  | "AUTHORIZATION_MISSING"
  | "AUTHORIZATION_PROPOSAL_MISMATCH"
  | "AUTHORIZATION_SCOPE_UNSUPPORTED"
  | "AUTHORIZATION_INVALID"
  | "AUTHORIZATION_NOT_YET_VALID"
  | "AUTHORIZATION_EXPIRED"
  | "AUTHORIZATION_REVOKED"
  | "OFFER_STALE"
  | "ACTIVE_ATTEMPT_EXISTS"
  | "OUTCOME_UNKNOWN";

export type PolicyDecision =
  | { allowed: true; decidedAt: string }
  | { allowed: false; code: PolicyDenialCode; decidedAt: string };

export interface CommitPolicyInput {
  proposal: ActionProposal;
  authorization?: Authorization;
  now: string;
  taskAllowsCommit: boolean;
  offerHealthy: boolean;
  hasActiveAttempt: boolean;
  outcomeUnknown: boolean;
}
