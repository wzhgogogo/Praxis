import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { ExecutionResult } from "../../core/execution/contracts.js";
import { fixtureCandidates } from "../../harness/restaurant-fixtures.js";
import type { BookingProofBundle } from "./contracts.js";
import { verifyBookingCompletion } from "./booking-verifier.js";

const candidate = fixtureCandidates[0]!;
const executionResult: ExecutionResult = {
  status: "SUBMITTED",
  attemptId: "attempt-1",
  providerReference: "reservation-1",
  submittedAt: "2026-08-05T09:00:00.000Z",
};

function proof(overrides: Partial<BookingProofBundle> = {}): BookingProofBundle {
  return {
    evidenceId: "evidence-1",
    attemptId: "attempt-1",
    strength: "STRONG",
    source: "MOCK_PROVIDER",
    observedAt: "2026-08-05T09:00:01.000Z",
    artifactRef: { kind: "MOCK", reference: "mock://reservation-1" },
    claims: {
      status: "CONFIRMED",
      providerReference: "reservation-1",
      restaurantId: candidate.restaurant.id,
      dateTime: candidate.offer.dateTime,
      partySize: candidate.offer.partySize,
    },
    matchedFields: [],
    missingFields: [],
    conflictingFields: [],
    ...overrides,
  };
}

describe("verifyBookingCompletion", () => {
  test("confirms strong evidence only when every completion field matches", () => {
    const result = verifyBookingCompletion({
      candidate,
      executionResult,
      observation: {
        status: "EVIDENCE",
        evidence: proof(),
        checkedAt: "2026-08-05T09:00:01.000Z",
      },
    });

    assert.equal(result.status, "CONFIRMED");
    if (result.status === "CONFIRMED") {
      assert.deepEqual(result.evidence.matchedFields, [
        "attemptId",
        "providerReference",
        "restaurantId",
        "dateTime",
        "partySize",
        "status",
      ]);
      assert.deepEqual(result.evidence.missingFields, []);
      assert.deepEqual(result.evidence.conflictingFields, []);
    }
  });

  test("keeps weak evidence inconclusive even when its claims match", () => {
    const result = verifyBookingCompletion({
      candidate,
      executionResult,
      observation: {
        status: "EVIDENCE",
        evidence: proof({ strength: "WEAK", source: "FORM_SUBMITTED" }),
        checkedAt: "2026-08-05T09:00:01.000Z",
      },
    });

    assert.equal(result.status, "INCONCLUSIVE");
  });

  test("rejects evidence produced for a different execution attempt", () => {
    const result = verifyBookingCompletion({
      candidate,
      executionResult,
      observation: {
        status: "EVIDENCE",
        evidence: proof({ attemptId: "attempt-other" }),
        checkedAt: "2026-08-05T09:00:01.000Z",
      },
    });

    assert.equal(result.status, "INCONCLUSIVE");
    if (result.status === "INCONCLUSIVE" && result.evidence) {
      assert.deepEqual(result.evidence.conflictingFields, ["attemptId"]);
    }
  });

  test("reports mismatched restaurant, time and party size as conflicts", () => {
    const result = verifyBookingCompletion({
      candidate,
      executionResult,
      observation: {
        status: "EVIDENCE",
        evidence: proof({
          claims: {
            status: "CONFIRMED",
            providerReference: "reservation-1",
            restaurantId: "restaurant-other",
            dateTime: "2026-08-05T20:00:00+09:00",
            partySize: 4,
          },
        }),
        checkedAt: "2026-08-05T09:00:01.000Z",
      },
    });

    assert.equal(result.status, "INCONCLUSIVE");
    if (result.status === "INCONCLUSIVE" && result.evidence) {
      assert.deepEqual(result.evidence.conflictingFields, [
        "restaurantId",
        "dateTime",
        "partySize",
      ]);
    }
  });
});
