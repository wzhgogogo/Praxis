/**
 * A diagnostic's outer deadline must settle even when a cooperative child
 * observed AbortSignal but left its promise pending. The caller still owns
 * artifact finalization and records a deadline stop distinctly from a user
 * cancellation.
 */
export const RUN_DEADLINE_EXCEEDED = "RUN_DEADLINE_EXCEEDED";

function abortError(signal: AbortSignal): Error & { code: string } {
  const reason = signal.reason;
  if (reason && typeof reason === "object" && "code" in reason && [RUN_DEADLINE_EXCEEDED, "RUN_SIGNAL_INTERRUPTED", "RUN_EXTERNAL_STOP"].includes(String(reason.code))) {
    return reason as Error & { code: string };
  }
  return Object.assign(new Error("Read-only run was cancelled"), { code: "CANCELLED" });
}

export interface RunInterruption { reason: "SIGNAL" | "TIMEOUT" | "EXTERNAL_STOP"; signal?: "SIGTERM" | "SIGINT"; at: string; timeoutMs: number; }

/** Only the diagnostic process owner installs signal handlers. No Task State is changed. */
export function createRunStopControl(timeoutMs: number, parent?: AbortSignal) {
  const controller = new AbortController();
  let interruption: RunInterruption | undefined;
  const stop = (reason: RunInterruption["reason"], signal?: "SIGTERM" | "SIGINT") => {
    if (interruption) return;
    interruption = { reason, ...(signal ? { signal } : {}), at: new Date().toISOString(), timeoutMs };
    controller.abort(Object.assign(new Error("Diagnostic run interrupted"), { code: signal ? "RUN_SIGNAL_INTERRUPTED" : "RUN_EXTERNAL_STOP" }));
  };
  const term = () => stop("SIGNAL", "SIGTERM"), int = () => stop("SIGNAL", "SIGINT"), external = () => stop("EXTERNAL_STOP");
  process.on("SIGTERM", term); process.on("SIGINT", int);
  if (parent?.aborted) external(); else parent?.addEventListener("abort", external, { once: true });
  const deadline = createRunDeadlineSignal(timeoutMs, controller.signal);
  const onDeadline = () => { interruption ??= { reason: "TIMEOUT", at: new Date().toISOString(), timeoutMs }; };
  deadline.signal.addEventListener("abort", onDeadline, { once: true });
  return {
    signal: deadline.signal,
    interruption: () => interruption ? { ...interruption } : undefined,
    dispose() {
      deadline.dispose(); deadline.signal.removeEventListener("abort", onDeadline);
      process.off("SIGTERM", term); process.off("SIGINT", int); parent?.removeEventListener("abort", external);
    },
  };
}

/** Builds an owned deadline while preserving an optional caller cancellation reason. */
export function createRunDeadlineSignal(timeoutMs: number, parent?: AbortSignal): { signal: AbortSignal; dispose(): void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(Object.assign(new Error("Run deadline reached"), { code: RUN_DEADLINE_EXCEEDED })), timeoutMs);
  const onParentAbort = () => controller.abort(parent?.reason);
  if (parent?.aborted) onParentAbort();
  else parent?.addEventListener("abort", onParentAbort, { once: true });
  return {
    signal: controller.signal,
    dispose() { clearTimeout(timeout); parent?.removeEventListener("abort", onParentAbort); },
  };
}

export function settleAtRunDeadline<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(abortError(signal));
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError(signal));
    signal.addEventListener("abort", onAbort, { once: true });
    work.then(
      (value) => { signal.removeEventListener("abort", onAbort); resolve(value); },
      (error) => { signal.removeEventListener("abort", onAbort); reject(error); },
    );
  });
}
