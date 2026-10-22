import type {BrowserReadNetworkPolicy} from "./browser-runtime.js";

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
