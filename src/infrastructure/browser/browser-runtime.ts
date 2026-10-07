export type BrowserRuntimeProvider = "CLOUDFLARE_BROWSER_RUN" | "LOCAL_PLAYWRIGHT_CHROMIUM";
export type BrowserEngine = "KITESURF" | "CHROMIUM";
export type BrowserEngineMode = "AUTO" | "KITESURF_ONLY" | "CHROMIUM_ONLY";

export interface BrowserResponseRule { origin: string; pathname: string; }
/** Source-owned admission for public browser reads. Infrastructure only enforces it. */
export interface BrowserReadNetworkRequestRule {
  origin: string;
  /** Static assets may use a reviewed prefix; dynamic reads require pathname. */
  pathname?: string;
  pathnamePrefix?: string;
  resourceTypes: readonly ("script" | "stylesheet" | "font" | "image" | "media" | "xhr" | "fetch")[];
  methods?: readonly ("GET" | "HEAD" | "POST")[];
  /** Omitted means no query fields; values never enter the policy or diagnostics. */
  queryKeys?: readonly string[];
  /**
   * A source-owned public query grammar where selected fields may repeat or
   * a cache-buster key is release-specific. All unlisted keys still fail.
   */
  queryKeyRules?: { required: readonly string[]; allowed?: readonly string[]; repeatable?: readonly string[]; allowedPatterns?: readonly string[] };
  /** Exact flat public JSON shape for an independently reviewed read query. */
  bodyFields?: Readonly<Record<string, "string" | "number">>;
}

export interface BrowserReadNetworkPolicy {
  /** Exact public document URLs are admitted only after Executor prepares navigation. */
  documentOrigins: readonly string[];
  staticResources: readonly BrowserReadNetworkRequestRule[];
  dynamicReads: readonly BrowserReadNetworkRequestRule[];
}
export interface BrowserCapturedResponse {
  url: string;
  status: number;
  observedAt: string;
  sequence: number;
  body: unknown;
}

export interface BrowserSnapshot {
  url: string;
  html: string;
  text: string;
  title: string;
  /**
   * Browser-derived state of public interactive controls.  It is deliberately
   * separate from page text: a query may change value, selection or disabled
   * state without changing the visible prose.
   */
  interactiveState?: string;
  /** Opaque, session-local page identity. It changes only when an observed link opens a new page. */
  pageId?: string;
  /** Source-allowlisted passive GET responses; never model-supplied evidence. */
  responses?: BrowserCapturedResponse[];
  /** Guard-only endpoint diagnostics, with no query/body values or headers. */
  networkDiagnostics?: Array<{
    code: "BLOCKED_ENDPOINT" | "BLOCKED_FIELDS" | "BLOCKED_METHOD" | "BLOCKED_REDIRECT" | "READ_REQUEST_FAILED" | "READ_TIMEOUT";
    origin: string;
    pathname: string;
    /** Request shape only: no query or body values, headers, or response content. */
    method: string;
    resourceType: string;
    queryKeys: string[];
  }>;
}

/** Code-owned descriptions of nonstandard source controls. Never accepted from a model. */
export interface BrowserControlHint {
  selector: string;
  labelPrefix: string;
  value: "TEXT" | "DATE_PARTS";
  selectedClass: string;
  /** Source has observed a navigation/write boundary; keep as evidence only. */
  observationOnly?: boolean;
}

/**
 * A browser-produced, short-lived reference to a currently visible control.
 * `id` is opaque to the model and is resolved only by the session that observed it.
 */
export interface BrowserPageControl {
  id: string;
  stableKey: string;
  kind: "LINK" | "BUTTON" | "INPUT" | "SELECT" | "CHECKBOX" | "RADIO" | "RANGE" | "REGION";
  role: string;
  label: string;
  value?: string;
  href?: string;
  /** Browser-observed structural facts, never a page assertion of safety. */
  formMethod?: "GET" | "POST" | "UNKNOWN";
  /** Observed structure for source-owned control contracts; never a permission itself. */
  structure?: { tag: string; name: string; classes: string[]; dialogLabel: string; formClass: string; sliderCount: number; listboxId?: string; radioGroupLabel?: string; radioGroupKey?: string };
  type?: string;
  disabled: boolean;
  visible: boolean;
  selected?: boolean;
  expanded?: boolean;
  /** A checkbox's current state is distinct from whether it is an available option. */
  checked?: boolean;
  /** Bounded slider facts are observed state, never model-provided values. */
  min?: string;
  max?: string;
  /** Accessibility-facing display text (for example a currency), distinct from slider positions. */
  valueText?: string;
  scrollable?: boolean;
  scrollTop?: number;
  /** An active modal may leave background controls visible but not safely operable. */
  blockedByActiveLayer?: boolean;
  observationOnly?: boolean;
  /** Select options remain distinct from the control's current value. */
  options?: Array<{ value: string; label: string; selected: boolean; disabled: boolean }>;
  /** A custom role=option is actionable only when bound to an observed combobox. */
  optionOwnerId?: string;
  controlledListboxId?: string;
}

export interface BrowserSessionMetadata {
  runtimeProvider: BrowserRuntimeProvider;
  engine: BrowserEngine;
  /** Opaque local/remote browser-session identifier; never a cookie or credential. */
  sessionId?: string;
  startedAt: string;
  /** Set only by a runtime that created an isolated, service-worker-blocked guarded context. */
  readNetworkBoundary?: "INSTALLED";
}

/** A code-owned cap for one interactive browser operation. */
export interface BrowserActionOptions { timeoutMs?: number; }

export interface BrowserSession {
  readonly metadata: BrowserSessionMetadata;
  navigate(url: string, options?: { waitUntil?: "domcontentloaded" | "load"; timeoutMs?: number }): Promise<void>;
  /** Admit one code-owned document URL in an already guarded context. */
  prepareNavigation?(url: string, options?: BrowserActionOptions): Promise<void>;
  /** Admit one Executor-observed public link after its source code allowed the origin. */
  prepareObservedNavigation?(url: string, options?: BrowserActionOptions): Promise<void>;
  snapshot(): Promise<BrowserSnapshot>;
  captureResponses?(rules: readonly BrowserResponseRule[]): Promise<void>;
  /** Inspect visible DOM controls and their accessibility-facing names without executing page-provided code. */
  observeControls?(hints?: readonly BrowserControlHint[]): Promise<BrowserPageControl[]>;
  click(target: string, options?: BrowserActionOptions): Promise<void>;
  /** Opens one already-observed public link. A target=_blank link remains in this session but becomes the active page. */
  openLink?(target: string, observedHref?: string, options?: BrowserActionOptions): Promise<void>;
  fill(target: string, value: string, options?: BrowserActionOptions): Promise<void>;
  /** Returns the values the remote browser reports as selected. */
  select(target: string, value: string, options?: BrowserActionOptions): Promise<string[]>;
  /** Optional read-only query controls. Unsupported runtimes fail closed in the Executor. */
  setChecked?(target: string, checked: boolean, options?: BrowserActionOptions): Promise<void>;
  press?(target: string, key: "ArrowLeft" | "ArrowRight", options?: BrowserActionOptions): Promise<void>;
  scroll?(target: string, deltaY: number, options?: BrowserActionOptions): Promise<void>;
  /** One bounded, browser-owned recovery for an observed transient overlay. */
  dismissTransientObstruction?(target: string, options?: BrowserActionOptions): Promise<{ occluder: string }>;
  waitFor(target: string, timeoutMs?: number): Promise<void>;
  /** Wait only until the user-visible page state changes; returns false on the bounded timeout. */
  waitForChange?(previous: Pick<BrowserSnapshot, "url" | "title" | "text" | "interactiveState">, timeoutMs?: number): Promise<boolean>;
  screenshot(): Promise<Uint8Array>;
  close(): Promise<void>;
}

export interface BrowserRuntime {
  /** Runtime-owned capability: only these implementations may install a guarded isolated context. */
  readonly readNetworkBoundaryCapability?: "ISOLATED_CONTEXT";
  openSession(input: { signal: AbortSignal; engineMode?: BrowserEngineMode; networkPolicy?: BrowserReadNetworkPolicy }): Promise<BrowserSession>;
}
