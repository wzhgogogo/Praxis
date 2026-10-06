/**
 * A diagnostic's outer deadline must settle even when a cooperative child
 * observed AbortSignal but left its promise pending. The caller still owns
 * artifact finalization and records a deadline stop distinctly from a user
 * cancellation.
 */
export const RUN_DEADLINE_EXCEEDED = "RUN_DEADLINE_EXCEEDED";

function abortError(signal: AbortSignal): Error & { code: string } {
  const reason = signal.reason;
  if (reason && typeof reason === "object" && "code" in reason && reason.code === RUN_DEADLINE_EXCEEDED) {
    return reason as Error & { code: string };
  }
  return Object.assign(new Error("Read-only run was cancelled"), { code: "CANCELLED" });
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
