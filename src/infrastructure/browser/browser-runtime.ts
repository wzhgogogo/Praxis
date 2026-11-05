import type { BrowserTransportError } from "./browser-runtime-errors.js";
export type BrowserRuntimeProvider = "CLOUDFLARE_BROWSER_RUN" | "LOCAL_PLAYWRIGHT_CHROMIUM";
export type BrowserEngine = "KITESURF" | "CHROMIUM";
export type BrowserEngineMode = "AUTO" | "KITESURF_ONLY" | "CHROMIUM_ONLY";

export interface BrowserResponseRule { origin: string; pathname: string; }
/** Source-owned admission for public browser reads. Infrastructure only enforces it. */
export interface BrowserReadNetworkRequestRule {
  origin: string;
  /** Source-owned exact path, reviewed prefix, or anchored path grammar. */
  pathname?: string;
  pathnamePrefix?: string;
  pathnamePattern?: string;
  resourceTypes: readonly ("document" | "script" | "stylesheet" | "font" | "image" | "media" | "xhr" | "fetch")[];
  methods?: readonly ("GET" | "HEAD" | "POST")[];
  /** Omitted means no query fields; values never enter the policy or diagnostics. */
  queryKeys?: readonly string[];
  /**
   * A source-owned public query grammar where selected fields may repeat or
   * a cache-buster key is release-specific. All unlisted keys still fail.
   */
  queryKeyRules?: { required: readonly string[]; allowed?: readonly string[]; repeatable?: readonly string[]; allowedPatterns?: readonly string[] };
  /** Presence of one of these fields requires the full reviewed query grammar,
   * including under generic public GET admission. An empty list requires the
   * reviewed grammar for every request to this endpoint. Values stay source-owned. */
  strictQueryKeys?: readonly string[];
  /** Browser-generated, bodyless projection of an approved GET/HEAD/POST; actual POST body is checked separately. */
  corsPreflight?: { requestOrigin: string; requestedHeaderNames: readonly string[] };
  /** Exact flat public JSON shape for an independently reviewed read query. */
  bodyFields?: Readonly<Record<string, "string" | "number">>;
}

export interface BrowserReadNetworkPolicy {
  /** Exact public document URLs are admitted only after Executor prepares navigation. */
  documentOrigins: readonly string[];
  /** ADR-0036: prepared public document origins may issue non-sensitive GET/HEAD reads. */
  genericPublicRead?: boolean;
  /** Source-revoked workflows. Deny wins over prepared navigation and reviewed rules. */
  prohibitedPaths?: readonly { hostname: string; pathSegment: string }[];
  /** Declarative exceptions to default image/media/font suppression; never grants admission. */
  retainedResources?: readonly BrowserReadNetworkRequestRule[];
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

/** Protocol facts only, never the values of requested headers. */
export interface BrowserReadCorsPreflightObservation {
  /** Recognized at the browser Fetch boundary from browser-reserved CORS headers. */
  initiator: "BROWSER_PREFLIGHT";
  secFetchMode: string;
  requestOrigin: string;
  requestedMethod: string;
  requestedHeaderNames: string[];
  bodyBytes: number;
}

export interface BrowserReadResourceTypeObservation {
  origin: string; pathname: string; method: string; resourceType: string;
  resourceTypeDetails: { selectedFrom: "PLAYWRIGHT" | "NETWORK" | "FETCH"; playwright?: string; network?: string; fetch?: string; policyBlock?: "NONESSENTIAL_RESOURCE" };
}

/** A value-free request shape captured by an installed read boundary. */
export interface BrowserReadNetworkObservation {
  outcome: "ADMITTED" | "BLOCKED" | "REDIRECT_BLOCKED" | "FAILED" | "TIMED_OUT";
  origin: string;
  pathname: string;
  method: string;
  resourceType: string;
  queryKeys: string[];
  error?: BrowserTransportError;
  corsPreflight?: BrowserReadCorsPreflightObservation;
  resourceTypeDetails?: BrowserReadResourceTypeObservation["resourceTypeDetails"];
  /** Independent outer observer binding; never a production admission input. */
  outerRequestId?: string;
  bodyObservation?: { bodySha256: string; contentType: string; fieldTypes: Record<string, string> };
}

export interface BrowserSettlementDiagnostics {
  url: string;
  pendingByType: Record<string, number>;
  oldestPendingMs: number;
  blockingDataRequests: number;
  busySelectors: string[];
  visibleTextChanging: boolean;
}

export interface BrowserSnapshot {
  /** Runtime-owned loading feedback; PENDING is never inventory completion evidence. */
  settlement?: "SETTLED" | "PENDING";
  url: string;
  html: string;
  /** Browser-rendered evidence, excluding non-visible subtrees; never model supplied. */
  visibleHtml?: string;
  text: string;
  title: string;
  /**
   * Browser-derived state of public interactive controls.  It is deliberately
   * separate from page text: a query may change value, selection or disabled
   * state without changing the visible prose.
   */
  settlementDiagnostics?: BrowserSettlementDiagnostics;
  interactiveState?: string;
  /** Opaque, session-local page identity. It changes only when an observed link opens a new page. */
  pageId?: string;
  /** Source-allowlisted passive GET responses; never model-supplied evidence. */
  responses?: BrowserCapturedResponse[];
  /** Guard-only endpoint diagnostics, with no query/body values or headers. */
  networkDiagnostics?: Array<{
    code: "BLOCKED_ENDPOINT" | "BLOCKED_FIELDS" | "BLOCKED_METHOD" | "BLOCKED_REDIRECT" | "READ_REQUEST_FAILED" | "READ_TIMEOUT" | "RESOURCE_POLICY_BLOCKED";
    origin: string;
    pathname: string;
    /** Request shape only: no query or body values, headers, or response content. */
    method: string;
    resourceType: string;
    queryKeys: string[];
    error?: BrowserTransportError;
  }>;
  /** Value-free Guard request chronology for optional Record and PolicyDraft evidence. */
  networkRequests?: BrowserReadNetworkObservation[];
  /** Raw CDP type observations, not admissions or inventory evidence. */
  networkResourceTypes?: BrowserReadResourceTypeObservation[];
}

/** Code-owned descriptions of nonstandard source controls. Never accepted from a model. */
export interface BrowserControlHint {
  selector: string;
  labelPrefix: string;
  value: "TEXT" | "DATE_PARTS";
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
  /** Public DOM ownership; an unknown or ambiguous owner is never inferred. */
  controlGroupLabel?: string;
  /** Registry-observed DOM owner identity; never inferred from a repeated label. */
  controlGroupKey?: string;
  labelSource?: "DOM descendant text";
  calendarMonth?: BrowserCalendarMonth;
  value?: string;
  href?: string;
  /** Browser-observed structural facts, never a page assertion of safety. */
  formMethod?: "GET" | "POST" | "UNKNOWN";
  /** Browser-owned native form association and visible lines; not hidden field values. */
  formObservation?: { owner: string; visibleLines: string[] };
  /** Observed structure for source-owned control contracts; never a permission itself. */
  structure?: { tag: string; name: string; classes: string[]; dialogLabel: string; formClass: string; sliderCount: number; listboxId?: string; radioGroupLabel?: string; radioGroupKey?: string };
  type?: string;
  disabled: boolean;
  visible: boolean;
  /** Only clipped by its currently open list; executor reveals before selection. */
  outsideViewport?: boolean;
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
  /** Calendar date derived from the visible day cell and its observed month/year. */
  calendarDate?: string;
  /** Select options remain distinct from the control's current value. */
  options?: Array<{ value: string; label: string; selected: boolean; disabled: boolean }>;
  /** A custom role=option is actionable only when bound to an observed combobox. */
  optionOwnerId?: string;
  controlledListboxId?: string;
}

export interface BrowserCalendarMonth {
  year: number;
  month: number;
  caption: string;
  source: "DOM caption" | "ARIA label";
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
  /** Runtime-owned lifecycle fact; a failed page control does not imply this. */
  isClosed?(): boolean;
  navigate(url: string, options?: { waitUntil?: "domcontentloaded" | "load"; timeoutMs?: number }): Promise<void>;
  /** Admit one code-owned document URL in an already guarded context. */
  prepareNavigation?(url: string, options?: BrowserActionOptions): Promise<void>;
  /** Admit one Executor-observed public link after its source code allowed the origin. */
  prepareObservedNavigation?(url: string, options?: BrowserActionOptions): Promise<void>;
  snapshot(): Promise<BrowserSnapshot>;
  /** Drain already-observed guarded responses for recording; never navigates. */
  flushRecordedResponses?(): Promise<void>;
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
  /** Page-level read-only recovery. It never targets or submits a control. */
  pressEscape?(options?: BrowserActionOptions): Promise<void>;
  scroll?(target: string, deltaY: number, options?: BrowserActionOptions): Promise<void>;
  /** One bounded, browser-owned recovery for an observed transient overlay. */
  dismissTransientObstruction?(target: string, options?: BrowserActionOptions): Promise<{ occluder: string }>;
  waitFor(target: string, timeoutMs?: number): Promise<void>;
  /** Wait for network completion, quiet DOM or stable visible state, and no visible busy indicators; false on timeout. */
  waitForSettled?(previous: Pick<BrowserSnapshot, "url" | "title" | "text" | "interactiveState">, timeoutMs?: number): Promise<boolean>;
  settlementDiagnostics?(): BrowserSettlementDiagnostics | undefined;
  screenshot(): Promise<Uint8Array>;
  /** Code-owned privacy-safe layout capture: masks content without changing control state. */
  screenshotLayoutOnly?(): Promise<Uint8Array>;
  close(): Promise<void>;
}

export interface BrowserRuntime {
  /** Runtime-owned capability: only these implementations may install a guarded isolated context. */
  readonly readNetworkBoundaryCapability?: "ISOLATED_CONTEXT";
  openSession(input: {
    signal: AbortSignal;
    engineMode?: BrowserEngineMode;
    networkPolicy?: BrowserReadNetworkPolicy;
    /** Receives an in-memory admitted public response for an optional sanitized Record artifact. */
    recordResponse?: (response: { url: string; method: string; resourceType: string; status: number; contentType: string; body: Uint8Array; redirectLocation?: string }) => Promise<void> | void;
    /** A caller-provided, already sanitized HAR. Local replay never falls back to live network. */
    replayHarPath?: string;
  }): Promise<BrowserSession>;
}
