import type { ExecutionResult } from "../../core/execution/contracts.js";
import type {
  BookingProofBundle,
  BookingProofField,
  BookingVerificationObservation,
  ConfirmedBookingProof,
  RestaurantBookingSelection,
  RestaurantVerificationResult,
} from "./contracts.js";

const orderedFields: BookingProofField[] = [
  "attemptId",
  "providerReference",
  "restaurantId",
  "dateTime",
  "partySize",
  "status",
];

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function assessProof(
  proof: BookingProofBundle,
  selection: RestaurantBookingSelection,
  executionResult: ExecutionResult,
): BookingProofBundle {
  const missing = new Set<BookingProofField>();
  const conflicting = new Set<BookingProofField>();
  const matched = new Set<BookingProofField>();

  if (proof.attemptId === executionResult.attemptId) {
    matched.add("attemptId");
  } else {
    conflicting.add("attemptId");
  }

  const providerReference = proof.claims.providerReference;
  if (isMissing(providerReference)) {
    missing.add("providerReference");
  } else if (
    executionResult.status === "SUBMITTED" &&
    executionResult.providerReference &&
    providerReference !== executionResult.providerReference
  ) {
    conflicting.add("providerReference");
  } else {
    matched.add("providerReference");
  }

  const expectedClaims: Array<{
    field: "restaurantId" | "dateTime" | "partySize" | "status";
    actual: unknown;
    expected: unknown;
  }> = [
    {
      field: "restaurantId",
      actual: proof.claims.restaurantId,
      expected: selection.candidate.restaurant.id,
    },
    {
      field: "dateTime",
      actual: proof.claims.dateTime,
      expected: selection.offer.dateTime,
    },
    {
      field: "partySize",
      actual: proof.claims.partySize,
      expected: selection.offer.partySize,
    },
    { field: "status", actual: proof.claims.status, expected: "CONFIRMED" },
  ];

  for (const claim of expectedClaims) {
    if (isMissing(claim.actual)) {
      missing.add(claim.field);
    } else if (claim.actual === claim.expected) {
      matched.add(claim.field);
    } else {
      conflicting.add(claim.field);
    }
  }

  return {
    ...structuredClone(proof),
    matchedFields: orderedFields.filter((field) => matched.has(field)),
    missingFields: orderedFields.filter((field) => missing.has(field)),
    conflictingFields: orderedFields.filter((field) => conflicting.has(field)),
  };
}

export function verifyBookingCompletion(input: {
  selection: RestaurantBookingSelection;
  executionResult: ExecutionResult;
  observation: BookingVerificationObservation;
}): RestaurantVerificationResult {
  if (input.observation.status === "ABSENT") {
    return { status: "ABSENT", checkedAt: input.observation.checkedAt };
  }

  const proof = input.observation.evidence;
  if (!proof) {
    return { status: "INCONCLUSIVE", checkedAt: input.observation.checkedAt };
  }

  const assessed = assessProof(proof, input.selection, input.executionResult);
  const isComplete =
    input.observation.status === "EVIDENCE" &&
    assessed.strength === "STRONG" &&
    assessed.missingFields.length === 0 &&
    assessed.conflictingFields.length === 0;

  if (isComplete) {
    return {
      status: "CONFIRMED",
      evidence: assessed as ConfirmedBookingProof,
    };
  }

  return {
    status: "INCONCLUSIVE",
    evidence: assessed,
    checkedAt: input.observation.checkedAt,
  };
}
