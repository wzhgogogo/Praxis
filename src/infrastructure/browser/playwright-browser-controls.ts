import type { ElementHandle, Page } from "playwright-core";

import type { BrowserControlHint, BrowserPageControl, BrowserSnapshot } from "./browser-runtime.js";
import { BrowserRuntimeError } from "./browser-runtime-errors.js";

const CONTROL_GROUPS: Array<{ selector: string; kind: BrowserPageControl["kind"]; defaultRole: string }> = [
  { selector: "a[href],[role=link]", kind: "LINK", defaultRole: "link" },
  { selector: "button,[role=button],[role=option],input[role=combobox][aria-readonly=true]", kind: "BUTTON", defaultRole: "button" },
  { selector: "[role=combobox]:not(input):not(select):not(button)", kind: "BUTTON", defaultRole: "combobox" },
  { selector: "select", kind: "SELECT", defaultRole: "combobox" },
  { selector: "input[type=checkbox],[role=checkbox]", kind: "CHECKBOX", defaultRole: "checkbox" },
  { selector: "input[type=range],[role=slider]", kind: "RANGE", defaultRole: "slider" },
  { selector: "input:not([type=checkbox]):not([type=range]):not([role=combobox][aria-readonly=true]),textarea,[role=textbox]:not([role=combobox])", kind: "INPUT", defaultRole: "textbox" },
  { selector: "[data-praxis-scroll-region],dialog[open],[role=dialog],[role=alertdialog],[role=listbox],[role=region]", kind: "REGION", defaultRole: "region" },
];

/** Check the current observed link before a single public GET navigation fallback. */
export async function observedLinkCovered(element: ElementHandle<SVGElement | HTMLElement>, expectedHref: string): Promise<boolean> {
  // Playwright would scroll before clicking; inspect the same on-screen center
  // after that scroll so lower result cards cannot fall through to a blocked click.
  await element.scrollIntoViewIfNeeded();
  return element.evaluate((node, expected) => {
    if (!(node instanceof HTMLAnchorElement) || !node.isConnected || new URL(node.href, document.baseURI).href !== expected) {
      throw new Error("Observed link changed before navigation");
    }
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) throw new Error("Observed link is not visible");
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) return false;
    const hit = document.elementFromPoint(x, y);
    return !!hit && !node.contains(hit);
  }, expectedHref);
}

/**
 * Observes accessibility-facing DOM facts and pins each offered action to its
 * ElementHandle. The model receives only opaque ids; no selector or JavaScript
 * crosses the model boundary.
 */
export class PlaywrightControlRegistry {
  private revision = 0;
  private targets = new Map<string, { element: ElementHandle<SVGElement | HTMLElement>; signature: string; selectedClass?: string; ownerId?: string; nodeIdentity?: string }>();
  private nextNodeIdentity = 0;

  async dispose(): Promise<void> {
    await Promise.all([...this.targets.values()].map(target => target.element.dispose().catch(() => undefined)));
    this.targets.clear();
  }

  private async selectedDisplay(element: ElementHandle<SVGElement | HTMLElement>): Promise<string | undefined> {
    return element.evaluate(node => {
      if (!(node instanceof HTMLInputElement) || node.getAttribute("role") !== "combobox"
        || node.getAttribute("aria-readonly") !== "true" || node.value) return undefined;
      // An explicit value container and its unique single-value child bind the
      // displayed selection to this input. Nearby page text is not a value.
      const container = [node.parentElement, node.parentElement?.parentElement]
        .find(parent => parent?.getAttribute("data-testid") === "Value Container");
      if (!container || container.querySelectorAll('input[role="combobox"]').length !== 1) return undefined;
      const displays = [...container.children].filter(child =>
        [...child.classList].some(name => /(?:^|-)singleValue$/.test(name)));
      if (displays.length !== 1 || displays[0]!.contains(node)) return undefined;
      const display = displays[0]!;
      if (!(display as HTMLElement).getClientRects().length || display.querySelector("input,select,button,[role=option]")) return undefined;
      const value = display.textContent?.replace(/\s+/g, " ").trim();
      return value && value.length <= 160 ? value : undefined;
    });
  }

  private async signature(element: ElementHandle<SVGElement | HTMLElement>, selectedClass?: string): Promise<string | undefined> {
    return element.evaluate((node, hintClass) => {
      if (!node.isConnected) return undefined;
      const form = node.closest("form");
      const value = node instanceof HTMLInputElement || node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement ? node.value : undefined;
      const selectedOptions = node instanceof HTMLSelectElement
        ? [...node.options].slice(0, 24).map(option => [option.value, option.label, option.disabled, option.selected]) : undefined;
      const modalSelector = 'dialog[open], [role=dialog][aria-modal="true"], [role=alertdialog][aria-modal="true"]';
      let activeModal: Element | undefined;
      let hasNativeModal = false;
      for (const modal of document.querySelectorAll(modalSelector)) {
        if (!(modal as HTMLElement).getClientRects().length) continue;
        const nativeModal = modal.matches(":modal");
        if (nativeModal || !hasNativeModal) activeModal = modal;
        hasNativeModal ||= nativeModal;
      }
      const blockedByActiveLayer = !!activeModal && !activeModal.contains(node);
      return JSON.stringify({
        tag: node.tagName, role: node.getAttribute("role"), type: node.getAttribute("type"),
        label: node.getAttribute("aria-label"), title: node.getAttribute("title"),
        text: node instanceof HTMLSelectElement ? undefined : (node as HTMLElement).innerText?.replace(/\s+/g, " ").trim().slice(0, 240) ?? "",
        associatedLabel: [...((node as HTMLInputElement).labels ?? [])].map(label => label.innerText.replace(/\s+/g, " ").trim()).join(" "),
        value, href: node.getAttribute("href"), name: node.getAttribute("name"),
        formMethodOverride: node.getAttribute("formmethod"), formTarget: node.getAttribute("formtarget"),
        disabled: (node as HTMLElement).matches(":disabled") || node.getAttribute("aria-disabled") === "true" || node.getAttribute("data-state") === "disabled",
        selected: node.getAttribute("aria-selected") === "true" || node.getAttribute("aria-pressed") === "true" || (hintClass ? node.classList.contains(hintClass) : false),
        expanded: node.getAttribute("aria-expanded"), controls: node.getAttribute("aria-controls"),
        dataDate: node.getAttribute("data-date"), dataValue: node.getAttribute("data-value"),
        dateParts: [node.getAttribute("data-year"), node.getAttribute("data-month"), node.getAttribute("data-day")],
        checked: node instanceof HTMLInputElement && node.type === "checkbox" ? node.checked : undefined,
        min: node.getAttribute("min") ?? node.getAttribute("aria-valuemin"), max: node.getAttribute("max") ?? node.getAttribute("aria-valuemax"),
        rangeValue: node.getAttribute("aria-valuenow"),
        selectedOptions,
        listboxId: node.closest('[role="listbox"]')?.id ?? "",
        formMethod: form?.getAttribute("method") ?? "",
        blockedByActiveLayer,
      });
    }, selectedClass);
  }

  async observe(page: Page, hints: readonly BrowserControlHint[] = []): Promise<BrowserPageControl[]> {
    this.revision += 1;
    const previousTargets = this.targets;
    this.targets = new Map();
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
        const locator = await groupLocator.nth(index).elementHandle();
        if (!locator) continue;
        const release = () => locator.dispose().catch(() => undefined);
        if (!group.hint && hintedSelector && await locator.evaluate((element, selector) => element.matches(selector), hintedSelector)) { await release(); continue; }
        if (!await locator.isVisible().catch(() => false)) { await release(); continue; }
        const initialSignature = await this.signature(locator, group.hint?.selectedClass).catch(() => undefined);
        if (!initialSignature) { await release(); continue; }
        const disabled = await locator.isDisabled() || await locator.getAttribute("aria-disabled") === "true"
          || await locator.getAttribute("data-state") === "disabled";
        const ariaLabel = await locator.getAttribute("aria-label");
        const title = await locator.getAttribute("title");
        const text = await locator.innerText().catch(() => "");
        const role = await locator.getAttribute("role") ?? group.defaultRole;
        const comboboxInput = group.kind === "BUTTON" && role === "combobox"
          ? await locator.inputValue().then(value => ({ value }), () => undefined)
          : undefined;
        const inputValue = group.kind === "INPUT" || group.kind === "SELECT" || group.kind === "RANGE"
          ? await locator.inputValue().catch(() => "") : comboboxInput?.value ?? "";
        const selectedDisplay = role === "combobox" && !inputValue ? await this.selectedDisplay(locator).catch(() => undefined) : undefined;
        const associatedLabel = await locator.evaluate(element => [...((element as HTMLInputElement).labels ?? [])].map(label => label.innerText).join(" "));
        const placeholder = await locator.getAttribute("placeholder");
        const name = await locator.getAttribute("name");
        const inputFallback = group.kind === "INPUT" ? placeholder || name : undefined;
        let label = (ariaLabel || title || associatedLabel || inputFallback || text || inputValue).replace(/\s+/g, " ").trim().slice(0, 240);
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
          : group.kind === "INPUT" || group.kind === "SELECT" || comboboxInput !== undefined
          ? inputValue || selectedDisplay || ""
            : dataDate ?? dataValue ?? await locator.getAttribute("value") ?? "";
        const formMethodAttribute = await locator.getAttribute("formmethod");
        const enclosingMethod = await locator.evaluate(element => element.closest("form")?.getAttribute("method") ?? null);
        const method = (formMethodAttribute ?? enclosingMethod ?? "").toUpperCase();
        const controlledListboxId = role === "combobox" ? await locator.getAttribute("aria-controls") : null;
        const type = await locator.getAttribute("type");
        const expanded = await locator.getAttribute("aria-expanded");
        let selected = await locator.getAttribute("aria-selected") === "true" || await locator.getAttribute("aria-pressed") === "true";
        if (group.hint) {
          const hint = group.hint;
          if (hint.value === "DATE_PARTS") {
            const parts = await locator.evaluate(element => ["year", "month", "day"].map(part => element.getAttribute(`data-${part}`)));
            if (!parts.every(part => part && /^\d+$/.test(part))) { await release(); continue; }
            const [year, month, day] = parts.map(Number);
            if (!year || !month || !day || month > 12 || day > 31) { await release(); continue; }
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
          return { tag: element.tagName, name: element.getAttribute("name") ?? "", classes: [...element.classList], dialogLabel: label.trim(), formClass: element.closest("form")?.className ?? "", sliderCount: dialog?.querySelectorAll('[role="slider"]').length ?? 0, listboxId: element.closest('[role="listbox"]')?.id ?? "" };
        });
        const id = `dom:${this.revision}:${controls.length + 1}`;
        if (await this.signature(locator, group.hint?.selectedClass).catch(() => undefined) !== initialSignature) { await release(); continue; }
        let nodeIdentity: string | undefined;
        if (group.kind === "SELECT" || role === "combobox") {
          for (const previous of previousTargets.values()) {
            if (!previous.nodeIdentity) continue;
            if (await locator.evaluate((element, old) => element === old, previous.element).catch(() => false)) {
              nodeIdentity = previous.nodeIdentity;
              break;
            }
          }
          nodeIdentity ??= `control:${++this.nextNodeIdentity}`;
        }
        this.targets.set(id, { element: locator, signature: initialSignature,
          ...(group.hint?.selectedClass ? { selectedClass: group.hint.selectedClass } : {}),
          ...(nodeIdentity ? { nodeIdentity } : {}) });
        controls.push({
          id,
          structure,
          ...(group.hint?.observationOnly ? { observationOnly: true } : {}),
          stableKey: [group.selector, role, role === "combobox" ? "" : label, group.kind === "BUTTON" && role !== "combobox" ? value : "", nodeIdentity ?? index].join("|"),
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
          ...(controlledListboxId ? { controlledListboxId } : {}),
        });
      }
    }
    const expanded = controls.filter(item => item.role === "combobox" && item.expanded === true);
    for (const control of controls.filter(item => item.role === "option")) {
      const listboxId = control.structure?.listboxId;
      const explicit = listboxId ? expanded.filter(item => item.controlledListboxId?.split(/\s+/).includes(listboxId)) : [];
      const owner = explicit.length === 1 ? explicit[0] : undefined;
      if (owner) {
        control.optionOwnerId = owner.id;
        this.targets.get(control.id)!.ownerId = owner.id;
      }
    }
    await Promise.all([...previousTargets.values()].map(target => target.element.dispose().catch(() => undefined)));
    return controls;
  }

  async target(id: string): Promise<ElementHandle<SVGElement | HTMLElement> | undefined> {
    const observed = this.targets.get(id);
    if (!observed) return undefined;
    try {
      if (await this.signature(observed.element, observed.selectedClass) !== observed.signature
        || !await observed.element.isVisible() || await observed.element.isDisabled()) {
        throw new Error("Observed target changed, detached, hidden, or disabled");
      }
      if (observed.ownerId) {
        const owner = this.targets.get(observed.ownerId);
        if (!owner || await this.signature(owner.element, owner.selectedClass) !== owner.signature
          || !await owner.element.isVisible() || await owner.element.isDisabled()) {
          throw new Error("Observed option owner changed, detached, hidden, or disabled");
        }
      }
      return observed.element;
    } catch {
      throw new BrowserRuntimeError("BROWSER_STALE_TARGET", "Observed target changed or detached; inspect a fresh page observation before acting");
    }
  }

  private async observeOptions(locator: ElementHandle<SVGElement | HTMLElement>): Promise<Array<{ value: string; label: string; selected: boolean; disabled: boolean }>> {
    const options = await locator.$$("option");
    const count = Math.min(options.length, 24);
    const observed: Array<{ value: string; label: string; selected: boolean; disabled: boolean }> = [];
    try { for (let index = 0; index < count; index += 1) {
      const option = options[index]!;
      const value = await option.evaluate(element => (element as HTMLOptionElement).value);
      const label = (await option.innerText().catch(() => "")).replace(/\s+/g, " ").trim().slice(0, 160);
      const selected = await option.evaluate((element) => (element as HTMLOptionElement).selected).catch(() => false);
      const disabled = (await option.getAttribute("disabled")) !== null;
      observed.push({ value, label, selected, disabled });
    } } finally {
      await Promise.all(options.map(option => option.dispose().catch(() => undefined)));
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
export async function activateObservedControl(locator: ElementHandle<SVGElement | HTMLElement>): Promise<void> {
  if (await locator.getAttribute("role") === "combobox" && await locator.getAttribute("aria-readonly") === "true"
    && await locator.evaluate(element => element.tagName === "INPUT")) {
    await locator.press("ArrowDown");
  } else await locator.click();
}
