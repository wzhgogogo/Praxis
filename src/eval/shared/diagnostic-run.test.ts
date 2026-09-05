import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { diagnosticFailureCode, diagnosticUrl, startDiagnosticRun } from "./diagnostic-run.js";

test("diagnostic start survives early failure and results cannot overwrite prior evidence", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-diagnostic-test-"));
  try {
    const run = await startDiagnosticRun(directory, { mode: "FIXTURE" });
    assert.equal(JSON.parse(await readFile(run.startPath, "utf8")).status, "STARTED");
    await assert.rejects(readFile(run.resultPath), { code: "ENOENT" });
    await run.finish({ status: "FAILED", stage: "SEMANTIC", failureCode: "MODEL_FAILURE", downstream: "NOT_REACHED" });
    const original = await readFile(run.resultPath, "utf8");
    await assert.rejects(run.finish({ status: "SUCCEEDED" }), { code: "EEXIST" });
    assert.equal(await readFile(run.resultPath, "utf8"), original);
    assert.equal(JSON.parse(original).downstream, "NOT_REACHED");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("diagnostics remove URL credentials, query and fragments and never return raw errors", () => {
  assert.equal(diagnosticUrl("https://user:password@tablecheck.com/en/shop?token=secret#secret"), "https://tablecheck.com/en/shop");
  assert.equal(diagnosticFailureCode(new Error("sk-secret")), "DIAGNOSTIC_FAILED");
  assert.equal(diagnosticFailureCode(Object.assign(new Error("private"), { code: "BROWSER_TIMEOUT" })), "BROWSER_TIMEOUT");
  assert.equal(diagnosticFailureCode(Object.assign(new Error("private"), { code: "https://secret" })), "DIAGNOSTIC_FAILED");
});
