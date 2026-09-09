import type { Locator, Page } from "playwright-core";

import type { BrowserPageControl, BrowserSnapshot } from "./browser-runtime.js";

const CONTROL_GROUPS: Array<{ selector: string; kind: BrowserPageControl["kind"]; defaultRole: string }> = [
  { selector: "a[href],[role=link]", kind: "LINK", defaultRole: "link" },
  { selector: "button,[role=button]", kind: "BUTTON", defaultRole: "button" },
  { selector: "select,[role=combobox]", kind: "SELECT", defaultRole: "combobox" },
  { selector: "input,[role=textbox]", kind: "INPUT", defaultRole: "textbox" },
];

/**
 * Uses Playwright's live locator and accessibility-facing DOM APIs. The model receives
 * only opaque ids; no selector or JavaScript crosses the model boundary.
 */
export class PlaywrightControlRegistry {
  private revision = 0;
  private readonly locators = new Map<string, Locator>();

  async observe(page: Page): Promise<BrowserPageControl[]> {
    this.revision += 1;
    this.locators.clear();
    const controls: BrowserPageControl[] = [];
    for (const group of CONTROL_GROUPS) {
      const groupLocator = page.locator(group.selector);
      const count = await groupLocator.count();
      for (let index = 0; index < count; index += 1) {
        const locator = groupLocator.nth(index);
        if (!await locator.isVisible().catch(() => false)) continue;
        const disabled = (await locator.getAttribute("disabled")) !== null || await locator.getAttribute("aria-disabled") === "true";
        const ariaLabel = await locator.getAttribute("aria-label");
        const title = await locator.getAttribute("title");
        const text = await locator.innerText().catch(() => "");
        const inputValue = group.kind === "INPUT" || group.kind === "SELECT" ? await locator.inputValue().catch(() => "") : "";
        const label = (ariaLabel ?? title ?? text ?? inputValue).replace(/\s+/g, " ").trim().slice(0, 240);
        const href = await locator.getAttribute("href");
        let resolvedHref: string | undefined;
        if (href) {
          try {
            resolvedHref = new URL(href, page.url()).toString();
          } catch {
            // An invalid href is not a navigable model target.
          }
        }
        const dataDate = await locator.getAttribute("data-date");
        const dataValue = await locator.getAttribute("data-value");
        const value = dataDate ?? dataValue ?? await locator.getAttribute("value") ?? inputValue;
        const formMethodAttribute = await locator.getAttribute("formmethod");
        const enclosingMethod = await locator.locator("xpath=ancestor::form[1]").getAttribute("method", { timeout: 50 }).catch(() => null);
        const method = (formMethodAttribute ?? enclosingMethod ?? "").toUpperCase();
        const role = await locator.getAttribute("role") ?? group.defaultRole;
        const type = await locator.getAttribute("type");
        const selected = await locator.getAttribute("aria-selected") === "true" || await locator.getAttribute("aria-pressed") === "true" || await locator.getAttribute("checked") !== null;
        const id = `dom:${this.revision}:${controls.length + 1}`;
        this.locators.set(id, locator);
        controls.push({
          id,
          stableKey: [group.selector, role, label, value, index].join("|"),
          kind: group.kind,
          role,
          label,
          ...(value ? { value } : {}),
          ...(resolvedHref ? { href: resolvedHref } : {}),
          ...(method ? { formMethod: method === "GET" ? "GET" : "POST" } : {}),
          ...(type ? { type } : {}),
          disabled,
          visible: true,
          ...(selected ? { selected: true } : {}),
        });
      }
    }
    return controls;
  }

  locator(id: string): Locator | undefined { return this.locators.get(id); }
}

export async function waitForVisibleChange(
  page: Page,
  previous: Pick<BrowserSnapshot, "url" | "title" | "text">,
  timeoutMs: number,
): Promise<boolean> {
  try {
    await page.waitForFunction(
      ({ url, title, text }) => location.href !== url || document.title !== title || (document.body?.innerText ?? "") !== text,
      previous,
      { timeout: timeoutMs },
    );
    return true;
  } catch (error) {
    if (error instanceof Error && /timeout/i.test(error.message)) return false;
    throw error;
  }
}
