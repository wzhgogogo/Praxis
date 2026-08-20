export type BrowserRuntimeFailureCode =
  | "BROWSER_TIMEOUT"
  | "BROWSER_RUNTIME_FAILED"
  | "BOT_CHALLENGE"
  | "UNEXPECTED_PAGE"
  | "EXTRACTION_FAILED"
  | "BROWSER_ABORTED";

export class BrowserRuntimeError extends Error {
  constructor(readonly code: BrowserRuntimeFailureCode, message: string, readonly cause?: unknown) {
    super(message);
    this.name = "BrowserRuntimeError";
  }
}
