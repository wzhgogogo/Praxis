export type BrowserRuntimeProvider = "CLOUDFLARE_BROWSER_RUN";
export type BrowserEngine = "KITESURF" | "CHROMIUM";
export type BrowserEngineMode = "AUTO" | "KITESURF_ONLY" | "CHROMIUM_ONLY";

export interface BrowserSnapshot {
  url: string;
  html: string;
  text: string;
  title: string;
}

export interface BrowserSessionMetadata {
  runtimeProvider: BrowserRuntimeProvider;
  engine: BrowserEngine;
  sessionId?: string;
  startedAt: string;
}

export interface BrowserSession {
  readonly metadata: BrowserSessionMetadata;
  navigate(url: string, options?: { waitUntil?: "domcontentloaded" | "load"; timeoutMs?: number }): Promise<void>;
  snapshot(): Promise<BrowserSnapshot>;
  click(target: string): Promise<void>;
  fill(target: string, value: string): Promise<void>;
  select(target: string, value: string): Promise<void>;
  waitFor(target: string, timeoutMs?: number): Promise<void>;
  screenshot(): Promise<Uint8Array>;
  close(): Promise<void>;
}

export interface BrowserRuntime {
  openSession(input: { signal: AbortSignal; engineMode?: BrowserEngineMode }): Promise<BrowserSession>;
}
