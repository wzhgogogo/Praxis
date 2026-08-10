export type ExecutionResult =
  | {
      status: "SUBMITTED";
      attemptId: string;
      providerReference?: string;
      submittedAt: string;
    }
  | {
      status: "FAILED_BEFORE_SIDE_EFFECT";
      attemptId: string;
      reason: string;
    }
  | {
      status: "SIDE_EFFECT_UNCERTAIN";
      attemptId: string;
      reason: string;
      submittedAt: string;
    };

export interface SideEffectRecord {
  idempotencyKey: string;
  taskId: string;
  actionType: string;
  targetId: string;
  attemptedAt: string;
}
