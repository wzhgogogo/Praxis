import assert from "node:assert/strict";
import { test } from "node:test";

import { settleAtRunDeadline } from "./live-run-deadline.js";

test("outer live-run deadline settles a child promise that ignores abort", async () => {
  const controller = new AbortController();
  const settled = settleAtRunDeadline(new Promise<never>(() => {}), controller.signal);
  controller.abort();
  await assert.rejects(settled, (error: unknown) =>
    error instanceof Error && error.message === "Run deadline reached" && (error as Error & { code?: string }).code === "CANCELLED",
  );
});

test("outer live-run deadline preserves a child result that arrives before abort", async () => {
  const controller = new AbortController();
  const settled = settleAtRunDeadline(Promise.resolve("terminal"), controller.signal);
  assert.equal(await settled, "terminal");
  controller.abort();
});
