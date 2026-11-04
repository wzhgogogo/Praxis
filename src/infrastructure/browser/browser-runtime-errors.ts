export type BrowserRuntimeFailureCode =
  | "BROWSER_TIMEOUT"
  /** No navigation dispatched because its remaining browser window is too small. */
  | "BROWSER_BUDGET_EXHAUSTED"
  /** Operations reached their bounded count before an elapsed deadline. */
  | "BROWSER_OPERATION_BUDGET_EXCEEDED"
  | "BROWSER_RUNTIME_FAILED"
  | "BROWSER_STALE_TARGET"
  /** The runtime could not start; this is distinct from a provider-local page operation failure. */
  | "BROWSER_RUNTIME_UNAVAILABLE"
  | "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED"
  | "BROWSER_CANDIDATE_MODEL_BUDGET_EXCEEDED"
  | "BOT_CHALLENGE"
  | "UNEXPECTED_PAGE"
  | "EXTRACTION_FAILED"
  | "BROWSER_ABORTED";

/** The smallest deadline attribution that an artifact may rely on. */
export type BrowserDeadlineScope = "RUN" | "CANDIDATE" | "PROVIDER";

export class BrowserRuntimeError extends Error {
  constructor(
    readonly code: BrowserRuntimeFailureCode,
    message: string,
    readonly cause?: unknown,
    /** Present for executor-owned deadline exhaustion; never inferred from another provider's error. */
    readonly scope?: BrowserDeadlineScope,
  ) {
    super(message);
    this.name = "BrowserRuntimeError";
  }
}
