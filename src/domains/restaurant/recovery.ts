import type {
  RecoveryEventFactory,
  RecoveryRequiredCommand,
} from "../../core/task-runtime/recovery-coordinator.js";
import type { RestaurantCommand, RestaurantEvent } from "./contracts.js";

function requireCommitCommand(
  envelope: RecoveryRequiredCommand<RestaurantCommand>,
): Extract<RestaurantCommand, { type: "COMMIT_BOOKING" }> {
  if (
    envelope.command.type !== "COMMIT_BOOKING" ||
    envelope.command.category !== "EXTERNAL_WRITE"
  ) {
    throw new Error(
      `Restaurant recovery cannot handle command ${envelope.command.type}`,
    );
  }
  return envelope.command;
}

export const restaurantRecoveryEventFactory: RecoveryEventFactory<
  RestaurantCommand,
  RestaurantEvent
> = {
  createRecoveryEvent(envelope, detectedAt) {
    const command = requireCommitCommand(envelope);
    return {
      type: "COMMIT_UNCERTAIN",
      result: {
        status: "SIDE_EFFECT_UNCERTAIN",
        attemptId: command.attemptId,
        reason: envelope.recoveryReason,
        submittedAt: detectedAt,
      },
    };
  },
};
