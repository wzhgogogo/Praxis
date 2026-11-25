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

/** Shared conservative public-GET boundary; dynamic strict query rules remain in the Guard. */
export function isSensitiveWorkflowUrl(url: URL): boolean {
  const path=url.pathname.toLowerCase();
  if (/(?:^|\/)(?:login|signin|sign-in|account|checkout|payment|purchase|cancel|delete|confirm)(?:\/|$)/.test(path)) return true;
  const publicQueryNamespace=/\/(?:booking|reserve)\/(?:calendar|availability|vacancy|status|search|list)(?:\/|$)/.test(path);
  if (!publicQueryNamespace && /(?:^|\/)(?:booking|reserve)(?:\/|$)/.test(path)) return true;
  return [...url.searchParams].some(([key,value])=>/^(?:action|cmd|command|operation)$/i.test(key)&&/^(?:cancel|delete|remove|confirm|purchase|pay|book|reserve)$/i.test(value));
}
export function isSensitiveGenericReadUrl(url: URL): boolean {
  return isSensitiveWorkflowUrl(url)||[...url.searchParams.keys()].some(key=>/(?:email|e-mail|phone|tel|address|name|password|passcode|token|secret|cookie|api_?key|card|payment|credit)/i.test(key));
}
