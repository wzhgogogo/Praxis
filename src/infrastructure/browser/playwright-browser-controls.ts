import type { Locator, Page } from "playwright-core";

import type { BrowserControlHint, BrowserPageControl, BrowserSnapshot } from "./browser-runtime.js";

const CONTROL_GROUPS: Array<{ selector: string; kind: BrowserPageControl["kind"]; defaultRole: string }> = [
  { selector: "a[href],[role=link]", kind: "LINK", defaultRole: "link" },
  { selector: "button,[role=button],[role=option],input[role=combobox][aria-readonly=true]", kind: "BUTTON", defaultRole: "button" },
  { selector: "select", kind: "SELECT", defaultRole: "combobox" },
  { selector: "input[type=checkbox],[role=checkbox]", kind: "CHECKBOX", defaultRole: "checkbox" },
  { selector: "input[type=range],[role=slider]", kind: "RANGE", defaultRole: "slider" },
  { selector: "input:not([type=checkbox]):not([type=range]):not([role=combobox][aria-readonly=true]),[role=textbox],[role=combobox]:not(input[aria-readonly=true])", kind: "INPUT", defaultRole: "textbox" },
  { selector: "[data-praxis-scroll-region],dialog[open],[role=dialog],[role=alertdialog],[role=listbox],[role=region]", kind: "REGION", defaultRole: "region" },
];

/**
 * Uses Playwright's live locator and accessibility-facing DOM APIs. The model receives
 * only opaque ids; no selector or JavaScript crosses the model boundary.
 */
export class PlaywrightControlRegistry {
  private revision = 0;
  private readonly locators = new Map<string, Locator>();

  async observe(page: Page, hints: readonly BrowserControlHint[] = []): Promise<BrowserPageControl[]> {
    this.revision += 1;
    this.locators.clear();
    const controls: BrowserPageControl[] = [];
    const modalSelector = 'dialog[open], [role=dialog][aria-modal="true"], [role=alertdialog][aria-modal="true"]';
    const modals = page.locator(modalSelector);
    let activeModalIndex = -1;
    let hasNativeModal = false;
    for (let index = 0; index < await modals.count(); index += 1) {
      const modal = modals.nth(index);
      if (!await modal.isVisible()) continue;
      const nativeModal = await modal.evaluate(element => element.matches(":modal"));
      // The browser top layer takes precedence over ordinary DOM dialogs. For nested
      // custom dialogs the last visible child is the active layer, not every ancestor.
      if (nativeModal || !hasNativeModal) activeModalIndex = index;
      hasNativeModal ||= nativeModal;
    }
    // Source-described controls replace, rather than duplicate, their standard group entry.
    const hintedSelector = hints.map(hint => hint.selector).join(",");
    const groups = [
      ...hints.map(hint => ({ selector: hint.selector, kind: "BUTTON" as const, defaultRole: "button", hint })),
      ...CONTROL_GROUPS.map(group => ({ ...group, hint: undefined })),
    ];
    for (const group of groups) {
      const groupLocator = page.locator(group.selector);
      const count = await groupLocator.count();
      for (let index = 0; index < count; index += 1) {
        const locator = groupLocator.nth(index);
        if (!group.hint && hintedSelector && await locator.evaluate((element, selector) => element.matches(selector), hintedSelector)) continue;
        if (!await locator.isVisible().catch(() => false)) continue;
        const disabled = await locator.isDisabled() || await locator.getAttribute("aria-disabled") === "true"
          || await locator.getAttribute("data-state") === "disabled";
        const ariaLabel = await locator.getAttribute("aria-label");
        const title = await locator.getAttribute("title");
        const text = await locator.innerText().catch(() => "");
        const inputValue = group.kind === "INPUT" || group.kind === "SELECT" || group.kind === "RANGE" ? await locator.inputValue().catch(() => "") : "";
        const associatedLabel = await locator.evaluate(element => [...((element as HTMLInputElement).labels ?? [])].map(label => label.innerText).join(" "));
        let label = (ariaLabel || title || associatedLabel || text || inputValue).replace(/\s+/g, " ").trim().slice(0, 240);
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
        let value = group.kind === "RANGE"
          ? await locator.getAttribute("aria-valuenow") ?? inputValue
          : group.kind === "INPUT" || group.kind === "SELECT"
            ? inputValue
            : dataDate ?? dataValue ?? await locator.getAttribute("value") ?? "";
        const formMethodAttribute = await locator.getAttribute("formmethod");
        const enclosingMethod = await locator.evaluate(element => element.closest("form")?.getAttribute("method") ?? null);
        const method = (formMethodAttribute ?? enclosingMethod ?? "").toUpperCase();
        const role = await locator.getAttribute("role") ?? group.defaultRole;
        const type = await locator.getAttribute("type");
        const expanded = await locator.getAttribute("aria-expanded");
        let selected = await locator.getAttribute("aria-selected") === "true" || await locator.getAttribute("aria-pressed") === "true";
        if (group.hint) {
          const hint = group.hint;
          if (hint.value === "DATE_PARTS") {
            const parts = await locator.evaluate(element => ["year", "month", "day"].map(part => element.getAttribute(`data-${part}`)));
            if (!parts.every(part => part && /^\d+$/.test(part))) continue;
            const [year, month, day] = parts.map(Number);
            if (!year || !month || !day || month > 12 || day > 31) continue;
            value = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          } else value = text.trim();
          label = `${hint.labelPrefix} ${value}`;
          selected = await locator.evaluate((element, selectedClass) => element.classList.contains(selectedClass), hint.selectedClass);
        }
        const checked = group.kind === "CHECKBOX"
          ? await locator.isChecked().catch(async () => await locator.getAttribute("aria-checked") === "true")
          : undefined;
        const min = group.kind === "RANGE" ? await locator.getAttribute("aria-valuemin") ?? await locator.getAttribute("min") ?? undefined : undefined;
        const max = group.kind === "RANGE" ? await locator.getAttribute("aria-valuemax") ?? await locator.getAttribute("max") ?? undefined : undefined;
        const valueText = group.kind === "RANGE" ? await locator.getAttribute("aria-valuetext") ?? undefined : undefined;
        const scrollable = group.kind === "REGION"
          ? await locator.evaluate((element) => element.scrollHeight > element.clientHeight).catch(() => false)
          : undefined;
        const scrollTop = group.kind === "REGION"
          ? await locator.evaluate((element) => element.scrollTop).catch(() => 0)
          : undefined;
        const options = group.kind === "SELECT" ? await this.observeOptions(locator) : undefined;
        const blockedByActiveLayer = activeModalIndex >= 0
          ? await locator.evaluate((element, { selector, index }) => {
            const active = document.querySelectorAll(selector)[index];
            return !active || !active.contains(element);
          }, { selector: modalSelector, index: activeModalIndex }).catch(() => true)
          : false;
        const structure = await locator.evaluate(element => {
          const dialog = element.closest('[role="dialog"],dialog');
          const label = dialog?.getAttribute("aria-label") || (dialog?.getAttribute("aria-labelledby") ?? "").split(/\s+/).map(id => document.getElementById(id)?.textContent ?? "").join(" ");
          return { tag: element.tagName, name: element.getAttribute("name") ?? "", classes: [...element.classList], dialogLabel: label.trim(), formClass: element.closest("form")?.className ?? "", sliderCount: dialog?.querySelectorAll('[role="slider"]').length ?? 0 };
        });
        const id = `dom:${this.revision}:${controls.length + 1}`;
        this.locators.set(id, locator);
        controls.push({
          id,
          structure,
          ...(group.hint?.observationOnly ? { observationOnly: true } : {}),
          stableKey: [group.selector, role, label, group.kind === "BUTTON" ? value : "", index].join("|"),
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
          ...(expanded !== null ? { expanded: expanded === "true" } : {}),
          ...(checked !== undefined ? { checked } : {}),
          ...(min ? { min } : {}),
          ...(max ? { max } : {}),
          ...(valueText ? { valueText } : {}),
          ...(scrollable !== undefined ? { scrollable } : {}),
          ...(scrollTop !== undefined ? { scrollTop } : {}),
          ...(blockedByActiveLayer ? { blockedByActiveLayer: true } : {}),
          ...(options?.length ? { options } : {}),
        });
      }
    }
    return controls;
  }

  locator(id: string): Locator | undefined { return this.locators.get(id); }

  private async observeOptions(locator: Locator): Promise<Array<{ value: string; label: string; selected: boolean; disabled: boolean }>> {
    const options = locator.locator("option");
    const count = Math.min(await options.count(), 24);
    const observed: Array<{ value: string; label: string; selected: boolean; disabled: boolean }> = [];
    for (let index = 0; index < count; index += 1) {
      const option = options.nth(index);
      const value = await option.getAttribute("value") ?? "";
      const label = (await option.innerText().catch(() => "")).replace(/\s+/g, " ").trim().slice(0, 160);
      const selected = await option.evaluate((element) => (element as HTMLOptionElement).selected).catch(() => false);
      const disabled = (await option.getAttribute("disabled")) !== null;
      observed.push({ value, label, selected, disabled });
    }
    return observed;
  }
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

/** Read-only ARIA inputs may be tiny focus proxies rather than pointer targets.
 * ArrowDown opens their native accessible choice list without force-clicking an
 * overlaid input. The Executor still validates the target and verifies new state.
 */
export async function activateObservedControl(locator: Locator): Promise<void> {
  if (await locator.getAttribute("role") === "combobox" && await locator.getAttribute("aria-readonly") === "true"
    && await locator.evaluate(element => element.tagName === "INPUT")) {
    await locator.press("ArrowDown");
  } else await locator.click();
}
