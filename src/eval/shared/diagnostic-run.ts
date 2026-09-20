import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/** Only stable codes may leave the diagnostic boundary; provider errors may contain credentials. */
export function diagnosticFailureCode(error: unknown): string {
  const code = error instanceof Error && "code" in error ? error.code : undefined;
  return typeof code === "string" && /^[A-Z][A-Z0-9_]{0,63}$/.test(code) ? code : "DIAGNOSTIC_FAILED";
}

export function diagnosticUrl(value: string): string {
  const url = new URL(value);
  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";
  return url.toString();
}

/** Two immutable records: a start with no result is visibly incomplete, including after a hard kill. */
export async function startDiagnosticRun(directory: string, metadata: Record<string, unknown>) {
  await mkdir(directory, { recursive: true });
  const startedAt = new Date().toISOString();
  const runId = randomUUID();
  const base = resolve(directory, `${startedAt.replace(/[:.]/g, "-")}-${runId}`);
  const startPath = `${base}.started.json`;
  const resultPath = `${base}.result.json`;
  const identity = { schemaVersion: "1", runId, startedAt };
  await writeFile(startPath, JSON.stringify({ ...metadata, ...identity, status: "STARTED" }, null, 2), { flag: "wx" });
  return {
    startPath,
    resultPath,
    /**
     * A caller that needs durable per-request audit can record an immutable
     * dispatch and settlement pair.  Normal diagnostics still retain only
     * their start/result records; callers choose their own safe payload.
     */
    async recordAttempt(
      attempt: number,
      stage: "DISPATCHED" | "SETTLED",
      record: Record<string, unknown>,
    ) {
      if (!Number.isSafeInteger(attempt) || attempt < 1) {
        throw new Error("Diagnostic attempt number must be a positive safe integer");
      }
      const path = `${base}.attempt-${String(attempt).padStart(3, "0")}.${stage.toLocaleLowerCase("en-US")}.json`;
      await writeFile(path, JSON.stringify({ ...identity, attempt, stage, recordedAt: new Date().toISOString(), ...record }, null, 2), { flag: "wx" });
      return path;
    },
    async finish(result: Record<string, unknown> & { status: "SUCCEEDED" | "FAILED" | "CANCELLED" }) {
      await writeFile(resultPath, JSON.stringify({
        ...metadata, ...result, ...identity, finishedAt: new Date().toISOString(),
      }, null, 2), { flag: "wx" });
    },
  };
}
