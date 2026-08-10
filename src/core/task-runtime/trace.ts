import type {
  CommandTraceMetadata,
  DomainCommand,
  DomainEvent,
  EventEnvelope,
  TraceMetadata,
} from "./contracts.js";

export function requireEventTrace<Event extends DomainEvent>(
  envelope: EventEnvelope<Event>,
  runId: string,
): TraceMetadata {
  if (envelope.trace.runId !== runId) {
    throw new Error(
      `Event run mismatch: expected ${runId}, received ${envelope.trace.runId}`,
    );
  }
  return envelope.trace;
}

export function createCommandTrace(
  command: DomainCommand,
  eventTrace: TraceMetadata,
  eventId: string,
): CommandTraceMetadata {
  return {
    schemaVersion: "1",
    runId: eventTrace.runId,
    ...(command.attemptId ?? eventTrace.attemptId
      ? { attemptId: command.attemptId ?? eventTrace.attemptId }
      : {}),
    correlationId: eventTrace.correlationId,
    causationId: eventId,
    actor: "RUNTIME",
  };
}
