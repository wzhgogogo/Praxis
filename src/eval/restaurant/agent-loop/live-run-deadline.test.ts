import assert from "node:assert/strict";
import { test } from "node:test";

import { createRunDeadlineSignal, RUN_DEADLINE_EXCEEDED, settleAtRunDeadline } from "./live-run-deadline.js";

test("outer live-run deadline settles a child promise that ignores abort", async () => {
  const controller = new AbortController();
  const settled = settleAtRunDeadline(new Promise<never>(() => {}), controller.signal);
  controller.abort();
  await assert.rejects(settled, (error: unknown) =>
    error instanceof Error && error.message === "Read-only run was cancelled" && (error as Error & { code?: string }).code === "CANCELLED",
  );
});

test("owned deadline is distinguishable from a caller cancellation", async () => {
  const deadline = createRunDeadlineSignal(1);
  const settled = settleAtRunDeadline(new Promise<never>(() => {}), deadline.signal);
  await assert.rejects(settled, (error: unknown) => !!error && typeof error === "object" && (error as { code?: string }).code === RUN_DEADLINE_EXCEEDED);
  deadline.dispose();
});

test("outer live-run deadline preserves a child result that arrives before abort", async () => {
  const controller = new AbortController();
  const settled = settleAtRunDeadline(Promise.resolve("terminal"), controller.signal);
  assert.equal(await settled, "terminal");
  controller.abort();
});
