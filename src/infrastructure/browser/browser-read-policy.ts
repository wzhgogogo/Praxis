import type {BrowserReadNetworkPolicy} from "./browser-runtime.js";

/** Shared existing query-key privacy rejection; observational consumers cannot relax it. */
export function hasSensitiveBrowserReadQuery(url:URL):boolean {
  return [...url.searchParams.keys()].some(key => /(?:email|e-mail|phone|tel|address|name|password|passcode|token|secret|cookie|api_?key|card|payment|credit)/i.test(key));
}

/** Explicit source revocations apply before planning and again before dispatch. */
export function isBrowserReadPathProhibited(policy: BrowserReadNetworkPolicy | undefined, value: string | URL): boolean {
  try {
    const url = value instanceof URL ? value : new URL(value);
    const rules = policy?.prohibitedPaths?.filter(rule => url.hostname === rule.hostname || url.hostname.endsWith(`.${rule.hostname}`));
    if (!rules?.length) return false;
    const segments = decodeURIComponent(url.pathname).toLowerCase().split("/");
    return rules.some(rule => segments.includes(rule.pathSegment.toLowerCase()));
  } catch { return true; }
}
