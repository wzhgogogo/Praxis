import assert from "node:assert/strict";
import { test } from "node:test";

import { SideEffectLedger } from "./side-effect-ledger.js";

test("SideEffectLedger coalesces concurrent writes with one idempotency key", async () => {
  const ledger = new SideEffectLedger();
  let actualWrites = 0;
  const record = {
    idempotencyKey: "task-1:commit:proposal-1",
    taskId: "task-1",
    actionType: "BOOK",
    targetId: "restaurant-1",
    attemptedAt: "2026-08-05T09:00:00.000Z",
  };
  const perform = async () => {
    actualWrites += 1;
    await Promise.resolve();
    return "submitted";
  };

  const [first, second] = await Promise.all([
    ledger.executeOnce(record, perform),
    ledger.executeOnce(record, perform),
  ]);

  assert.equal(first.result, "submitted");
  assert.equal(second.result, "submitted");
  assert.equal(first.replayed, false);
  assert.equal(second.replayed, true);
  assert.equal(actualWrites, 1);
  assert.equal(ledger.records.length, 1);
});
