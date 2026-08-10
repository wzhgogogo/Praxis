import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { DomainCommand, DomainEvent, TaskDefinition } from "./contracts.js";
import { StaleTaskVersionError } from "./errors.js";
import { InMemoryTaskRuntime } from "./in-memory-task-runtime.js";

type CounterState = { count: number };
type CounterEvent = DomainEvent & { type: "INCREMENT" };
type CounterCommand = DomainCommand & { type: "COUNT_CHANGED"; count: number };

const definition: TaskDefinition<CounterState, CounterEvent, CounterCommand, number> = {
  type: "test.counter",
  version: "1",
  create() {
    return { count: 0 };
  },
  transition(state, _event, context) {
    const count = state.count + 1;
    return {
      state: { count },
      commands: [
        {
          type: "COUNT_CHANGED",
          category: "READ",
          idempotencyKey: `${context.taskId}:count:${count}`,
          count,
        },
      ],
    };
  },
  getLifecycleState() {
    return "RUNNING";
  },
  evaluateOutcome(state) {
    return state.count;
  },
};

function createRuntime() {
  let sequence = 0;
  return new InMemoryTaskRuntime(
    definition,
    { now: () => new Date("2026-08-05T09:00:00.000Z") },
    (prefix) => `${prefix}-${++sequence}`,
  );
}

describe("InMemoryTaskRuntime", () => {
  test("deduplicates an event before applying the transition again", () => {
    const runtime = createRuntime();
    runtime.createTask("task-1", {});
    const envelope = {
      id: "event-1",
      taskId: "task-1",
      event: { type: "INCREMENT" } as const,
      occurredAt: "2026-08-05T09:00:00.000Z",
      trace: {
        schemaVersion: "1" as const,
        runId: "run:task-1",
        correlationId: "event-1",
        actor: "USER" as const,
      },
    };

    const first = runtime.dispatch(envelope, 0);
    const replay = runtime.dispatch(envelope, 0);

    assert.equal(first.snapshot.domainState.count, 1);
    assert.equal(first.commands.length, 1);
    assert.equal(replay.duplicateEvent, true);
    assert.equal(replay.snapshot.version, 1);
    assert.equal(replay.commands.length, 0);
  });

  test("rejects a new event carrying a stale task version", () => {
    const runtime = createRuntime();
    runtime.createTask("task-1", {});
    runtime.dispatch({
      id: "event-1",
      taskId: "task-1",
      event: { type: "INCREMENT" },
      occurredAt: "2026-08-05T09:00:00.000Z",
      trace: {
        schemaVersion: "1",
        runId: "run:task-1",
        correlationId: "event-1",
        actor: "USER",
      },
    });

    assert.throws(
      () =>
        runtime.dispatch(
          {
            id: "event-2",
            taskId: "task-1",
            event: { type: "INCREMENT" },
            occurredAt: "2026-08-05T09:00:01.000Z",
            trace: {
              schemaVersion: "1",
              runId: "run:task-1",
              correlationId: "event-2",
              actor: "USER",
            },
          },
          0,
        ),
      StaleTaskVersionError,
    );
  });

  test("records causal metadata and propagates it to emitted commands", () => {
    const runtime = createRuntime();
    runtime.createTask("task-1", {}, { runId: "run-1" });

    const result = runtime.dispatch({
      id: "event-1",
      taskId: "task-1",
      event: { type: "INCREMENT" },
      occurredAt: "2026-08-05T09:00:00.000Z",
      trace: {
        schemaVersion: "1",
        runId: "run-1",
        correlationId: "correlation-1",
        actor: "USER",
      },
    });

    assert.deepEqual(runtime.eventLog[0]?.trace, {
      schemaVersion: "1",
      runId: "run-1",
      correlationId: "correlation-1",
      actor: "USER",
    });
    assert.deepEqual(result.commands[0]?.trace, {
      schemaVersion: "1",
      runId: "run-1",
      correlationId: "correlation-1",
      causationId: "event-1",
      actor: "RUNTIME",
    });
  });

  test("rejects an event whose trace belongs to another run", () => {
    const runtime = createRuntime();
    runtime.createTask("task-1", {});

    assert.throws(
      () =>
        runtime.dispatch({
          id: "event-wrong-run",
          taskId: "task-1",
          event: { type: "INCREMENT" },
          occurredAt: "2026-08-05T09:00:00.000Z",
          trace: {
            schemaVersion: "1",
            runId: "run:other-task",
            correlationId: "event-wrong-run",
            actor: "USER",
          },
        }),
      /Event run mismatch/,
    );
  });
});
