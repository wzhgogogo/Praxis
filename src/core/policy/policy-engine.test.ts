import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { ActionProposal, Authorization, CommitPolicyInput } from "./contracts.js";
import { PolicyEngine } from "./policy-engine.js";

const now = "2026-08-05T09:00:00.000Z";

const proposal: ActionProposal = {
  id: "proposal-1",
  taskId: "task-1",
  actionType: "BOOK",
  target: { type: "RESTAURANT_OUTLET", id: "restaurant-1" },
  termsHash: "terms-1",
  risk: "LOW",
  reversible: true,
};

const authorization: Authorization = {
  id: "authorization-1",
  proposalId: proposal.id,
  scope: "ONE_TIME",
  approvedAt: "2026-08-05T08:59:00.000Z",
  expiresAt: "2026-08-05T09:05:00.000Z",
};

function validInput(overrides: Partial<CommitPolicyInput> = {}): CommitPolicyInput {
  return {
    proposal,
    authorization,
    now,
    taskAllowsCommit: true,
    offerHealthy: true,
    hasActiveAttempt: false,
    outcomeUnknown: false,
    ...overrides,
  };
}

describe("PolicyEngine", () => {
  test("allows a healthy one-time authorized action", () => {
    const decision = new PolicyEngine().evaluateCommit(validInput());
    assert.deepEqual(decision, { allowed: true, decidedAt: now });
  });

  test("rejects a missing authorization", () => {
    const input = validInput();
    delete input.authorization;
    const decision = new PolicyEngine().evaluateCommit(input);
    assert.equal(decision.allowed, false);
    if (!decision.allowed) {
      assert.equal(decision.code, "AUTHORIZATION_MISSING");
    }
  });

  test("rejects an expired authorization", () => {
    const decision = new PolicyEngine().evaluateCommit(
      validInput({
        authorization: { ...authorization, expiresAt: now },
      }),
    );
    assert.equal(decision.allowed, false);
    if (!decision.allowed) {
      assert.equal(decision.code, "AUTHORIZATION_EXPIRED");
    }
  });

  test("rejects malformed authorization timestamps", () => {
    const decision = new PolicyEngine().evaluateCommit(
      validInput({
        authorization: { ...authorization, expiresAt: "not-a-date" },
      }),
    );
    assert.equal(decision.allowed, false);
    if (!decision.allowed) {
      assert.equal(decision.code, "AUTHORIZATION_INVALID");
    }
  });

  test("OUTCOME_UNKNOWN takes precedence over a new authorization", () => {
    const decision = new PolicyEngine().evaluateCommit(validInput({ outcomeUnknown: true }));
    assert.equal(decision.allowed, false);
    if (!decision.allowed) {
      assert.equal(decision.code, "OUTCOME_UNKNOWN");
    }
  });
});
