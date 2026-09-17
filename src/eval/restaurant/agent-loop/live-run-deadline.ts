/**
 * A diagnostic's outer deadline must settle even when a cooperative child
 * observed AbortSignal but left its promise pending. The caller still owns
 * artifact finalization and classifies this as a cancelled run.
 */
export function settleAtRunDeadline<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  const cancelled = () => Object.assign(new Error("Run deadline reached"), { code: "CANCELLED" });
  if (signal.aborted) return Promise.reject(cancelled());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(cancelled());
    signal.addEventListener("abort", onAbort, { once: true });
    work.then(
      (value) => { signal.removeEventListener("abort", onAbort); resolve(value); },
      (error) => { signal.removeEventListener("abort", onAbort); reject(error); },
    );
  });
}
