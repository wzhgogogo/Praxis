export type BrowserRuntimeFailureCode =
  | "BROWSER_TIMEOUT"
  | "BROWSER_RUNTIME_FAILED"
  /** The runtime could not start; this is distinct from a provider-local page operation failure. */
  | "BROWSER_RUNTIME_UNAVAILABLE"
  | "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED"
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
