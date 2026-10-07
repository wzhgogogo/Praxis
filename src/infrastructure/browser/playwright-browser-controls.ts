import type { ElementHandle, Page } from "playwright-core";

import type { BrowserControlHint, BrowserPageControl, BrowserSnapshot } from "./browser-runtime.js";
import { BrowserRuntimeError } from "./browser-runtime-errors.js";

const CONTROL_GROUPS: Array<{ selector: string; kind: BrowserPageControl["kind"]; defaultRole: string }> = [
  { selector: "a[href],[role=link]", kind: "LINK", defaultRole: "link" },
  { selector: "button,[role=button],[role=option],input[role=combobox][aria-readonly=true]", kind: "BUTTON", defaultRole: "button" },
  { selector: "[role=combobox]:not(input):not(select):not(button)", kind: "BUTTON", defaultRole: "combobox" },
  { selector: "select", kind: "SELECT", defaultRole: "combobox" },
  { selector: "input[type=radio],[role=radio]", kind: "RADIO", defaultRole: "radio" },
  { selector: "input[type=checkbox],[role=checkbox]", kind: "CHECKBOX", defaultRole: "checkbox" },
  { selector: "input[type=range],[role=slider]", kind: "RANGE", defaultRole: "slider" },
  { selector: "input:not([type=checkbox]):not([type=radio]):not([type=range]):not([role=combobox][aria-readonly=true]),textarea,[role=textbox]:not([role=combobox])", kind: "INPUT", defaultRole: "textbox" },
  { selector: "[data-praxis-scroll-region],dialog[open],[role=dialog],[role=alertdialog],[role=listbox],[role=region]", kind: "REGION", defaultRole: "region" },
];
const INTERACTIVE_ACTION_TIMEOUT_MS = 5_000;

/** Check the current observed link before a single public GET navigation fallback. */
export async function observedLinkCovered(element: ElementHandle<SVGElement | HTMLElement>, expectedHref: string, timeoutMs = INTERACTIVE_ACTION_TIMEOUT_MS): Promise<boolean> {
  // Playwright would scroll before clicking; inspect the same on-screen center
  // after that scroll so lower result cards cannot fall through to a blocked click.
  await element.scrollIntoViewIfNeeded({ timeout: timeoutMs });
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
 * A role=option inside a clipped, scrollable owner is not an actionable target
 * until it is actually in that owner's viewport.  The owner itself is still
 * observed as a scroll region, so the model can legally reveal it.
 */
async function visibleWithinScrollableOwner(locator: ElementHandle<SVGElement | HTMLElement>): Promise<boolean> {
  return locator.evaluate((element) => {
    const owner = element.closest('[role="listbox"], [data-praxis-scroll-region]') as HTMLElement | null;
    if (!owner || owner.scrollHeight <= owner.clientHeight) return true;
    const item = element.getBoundingClientRect();
    const bounds = owner.getBoundingClientRect();
    return item.bottom > bounds.top && item.top < bounds.bottom;
  }).catch(() => false);
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

  /**
   * Read the inexpensive, browser-owned control projection once.  The
   * `signature` intentionally excludes presentation-only fields such as the
   * full CSS class list and scroll position: they help describe a control, but
   * a hover/animation must not invalidate an otherwise identical observed
   * target before its one permitted action.
   */
  private async snapshot(element: ElementHandle<SVGElement | HTMLElement>, selectedClass?: string): Promise<string | undefined> {
    return element.evaluate((node, hintClass) => {
      if (!node.isConnected) return undefined;
      // Native controls may belong to a form through the `form` attribute,
      // rather than DOM ancestry. Use the browser's owner resolution for both
      // action-time signatures and observed radio group identity.
      const form = node instanceof HTMLInputElement || node instanceof HTMLButtonElement
        || node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement
        ? node.form : node.closest("form");
      const nativeRadio = node instanceof HTMLInputElement && node.type === "radio";
      const radioGroup = nativeRadio ? undefined : node.closest('[role="radiogroup"]');
      const formIndex = form ? [...document.querySelectorAll("form")].indexOf(form) : -1;
      const groupIndex = radioGroup ? [...document.querySelectorAll('[role="radiogroup"]')].indexOf(radioGroup) : -1;
      const radioGroupKey = nativeRadio && node.getAttribute("name") ? `form:${form?.id || formIndex}|name:${node.getAttribute("name")}`
        : radioGroup ? `group:${radioGroup.id || groupIndex}` : undefined;
      const nestedInputs = node.getAttribute("role") === "combobox"
        ? [...node.querySelectorAll("input")].filter(input => ["text", "search"].includes(input.type)) : [];
      const value = node instanceof HTMLInputElement || node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement ? node.value
        : nestedInputs.length === 1 ? nestedInputs[0]!.value : node.getAttribute("value") ?? undefined;
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
      // Non-modal suggestions block only controls actually covered by their
      // visible listbox. Do not disable unrelated controls elsewhere on a page.
      const rect = node.getBoundingClientRect();
      const hit = rect.width && rect.height ? document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) : null;
      const coveringListbox = hit?.closest('[role="listbox"]');
      const coveredBySuggestions = !!coveringListbox?.id && !!hit && !node.contains(hit)
        && [...document.querySelectorAll('[role="combobox"][aria-expanded="true"]')]
          .some(owner => owner.getAttribute("aria-controls")?.split(/\s+/).includes(coveringListbox.id));
      const blockedByActiveLayer = !!activeModal && !activeModal.contains(node) || coveredBySuggestions;
      const dialog = node.closest('[role="dialog"],dialog');
      const labelledBy = dialog?.getAttribute("aria-labelledby")?.split(/\s+/) ?? [];
      const dialogLabel = dialog?.getAttribute("aria-label") || labelledBy.map(id => document.getElementById(id)?.textContent ?? "").join(" ");
      const labelContainer = node.closest('fieldset,[role="radiogroup"]');
      const legend = labelContainer?.querySelector("legend")?.textContent ?? "";
      const groupLabel = radioGroup?.getAttribute("aria-label") || (radioGroup?.getAttribute("aria-labelledby") ?? "").split(/\s+/).map(id => document.getElementById(id)?.textContent ?? "").join(" ") || legend;
      const projection = {
        tag: node.tagName, classes: [...node.classList], role: node.getAttribute("role"), type: node.getAttribute("type"),
        label: node.getAttribute("aria-label"), title: node.getAttribute("title"),
        text: (node as HTMLElement).innerText?.replace(/\s+/g, " ").trim().slice(0, 240) ?? "",
        associatedLabel: [...((node as HTMLInputElement).labels ?? [])].map(label => label.innerText.replace(/\s+/g, " ").trim()).join(" "),
        value, href: node.getAttribute("href"), name: node.getAttribute("name"), placeholder: node.getAttribute("placeholder"),
        formOwner: form ? `${form.id || formIndex}` : "", radioGroupKey,
        formMethodOverride: node.getAttribute("formmethod"), formTarget: node.getAttribute("formtarget"),
        disabled: (node as HTMLElement).matches(":disabled") || node.getAttribute("aria-disabled") === "true" || node.getAttribute("data-state") === "disabled",
        selected: node.getAttribute("aria-selected") === "true" || node.getAttribute("aria-pressed") === "true" || (hintClass ? node.classList.contains(hintClass) : false),
        expanded: node.getAttribute("aria-expanded"), controls: node.getAttribute("aria-controls"),
        dataDate: node.getAttribute("data-date"), dataValue: node.getAttribute("data-value"),
        dateParts: [node.getAttribute("data-year"), node.getAttribute("data-month"), node.getAttribute("data-day")],
        checked: node instanceof HTMLInputElement && (node.type === "checkbox" || node.type === "radio") ? node.checked : (node.getAttribute("role") === "checkbox" || node.getAttribute("role") === "radio") ? node.getAttribute("aria-checked") : undefined,
        min: node.getAttribute("aria-valuemin") ?? node.getAttribute("min"), max: node.getAttribute("aria-valuemax") ?? node.getAttribute("max"),
        rangeValue: node.getAttribute("aria-valuenow"), valueText: node.getAttribute("aria-valuetext"),
        scrollable: (node as HTMLElement).scrollHeight > (node as HTMLElement).clientHeight,
        scrollTop: (node as HTMLElement).scrollTop,
        selectedOptions,
        listboxId: node.closest('[role="listbox"]')?.id ?? "", dialogLabel: dialogLabel?.replace(/\s+/g, " ").trim() ?? "",
        formMethod: form?.getAttribute("method") ?? "", formClass: form?.className ?? "", sliderCount: dialog?.querySelectorAll('[role="slider"]').length ?? 0,
        radioGroupLabel: groupLabel.replace(/\s+/g, " ").trim(),
        blockedByActiveLayer,
      };
      const {
        // These fields describe the current rendered presentation. They are
        // deliberately not action-time identity: changing a CSS class or
        // scrolling a region does not authorize rejecting a still-current
        // public control.
        classes: _classes,
        scrollable: _scrollable,
        scrollTop: _scrollTop,
        formClass: _formClass,
        ...signature
      } = projection;
      return JSON.stringify({ projection, signature });
    }, selectedClass);
  }

  private decodeSnapshot(snapshot: string): { signature: string; projection: {
    tag: string; classes?: string[]; role?: string | null; type?: string | null; label?: string | null; title?: string | null; text?: string;
    associatedLabel?: string; value?: string; href?: string | null; name?: string | null; placeholder?: string | null;
    disabled?: boolean; selected?: boolean; expanded?: string | null; checked?: boolean | string;
    dataDate?: string | null; dataValue?: string | null; dateParts?: Array<string | null>; min?: string | null; max?: string | null;
    rangeValue?: string | null; valueText?: string | null; selectedOptions?: Array<[string, string, boolean, boolean]>; listboxId?: string; controls?: string | null;
    formOwner?: string; formMethodOverride?: string | null; formMethod?: string; formClass?: string; dialogLabel?: string; sliderCount?: number;
    radioGroupLabel?: string; radioGroupKey?: string; scrollable?: boolean; scrollTop?: number; blockedByActiveLayer?: boolean;
  } } {
    const parsed = JSON.parse(snapshot) as { signature: object; projection: {
      tag: string; classes?: string[]; role?: string | null; type?: string | null; label?: string | null; title?: string | null; text?: string;
      associatedLabel?: string; value?: string; href?: string | null; name?: string | null; placeholder?: string | null;
      disabled?: boolean; selected?: boolean; expanded?: string | null; checked?: boolean | string;
      dataDate?: string | null; dataValue?: string | null; dateParts?: Array<string | null>; min?: string | null; max?: string | null;
      rangeValue?: string | null; valueText?: string | null; selectedOptions?: Array<[string, string, boolean, boolean]>; listboxId?: string; controls?: string | null;
      formOwner?: string; formMethodOverride?: string | null; formMethod?: string; formClass?: string; dialogLabel?: string; sliderCount?: number;
      radioGroupLabel?: string; radioGroupKey?: string; scrollable?: boolean; scrollTop?: number; blockedByActiveLayer?: boolean;
    } };
    return { signature: JSON.stringify(parsed.signature), projection: parsed.projection };
  }

  private async actionSignature(element: ElementHandle<SVGElement | HTMLElement>, selectedClass?: string): Promise<string | undefined> {
    const snapshot = await this.snapshot(element, selectedClass);
    return snapshot ? this.decodeSnapshot(snapshot).signature : undefined;
  }

  /** A disconnected handle is a vanished observation, never an enabled control. */
  private async disconnected(element: ElementHandle<SVGElement | HTMLElement>): Promise<boolean> {
    // Do not classify a protocol/runtime failure as a removed node. The caller
    // may omit a control only when the page itself confirms `isConnected=false`.
    return element.evaluate(node => !node.isConnected).catch(() => false);
  }

  async observe(page: Page, hints: readonly BrowserControlHint[] = []): Promise<BrowserPageControl[]> {
    this.revision += 1;
    const previousTargets = this.targets;
    this.targets = new Map();
    const controls: BrowserPageControl[] = [];
    // Source-described controls replace, rather than duplicate, their standard group entry.
    const hintedSelector = hints.map(hint => hint.selector).join(",");
    const groups = [
      ...hints.map(hint => ({ selector: hint.selector, kind: "BUTTON" as const, defaultRole: "button", hint })),
      ...CONTROL_GROUPS.map(group => ({ ...group, hint: undefined })),
    ];
    for (const group of groups) {
      const groupLocator = page.locator(group.selector);
      // Pin this observation's handles before reading any of them. A source page
      // can remove one unrelated node during the pass; a native one-call
      // ElementHandle snapshot keeps later controls from shifting indices.
      const handles = await groupLocator.elementHandles() as Array<ElementHandle<SVGElement | HTMLElement>>;
      for (const [index, locator] of handles.entries()) {
        if (!locator) continue;
        const release = () => locator.dispose().catch(() => undefined);
        try {
        if (!group.hint && hintedSelector && await locator.evaluate((element, selector) => element.matches(selector), hintedSelector)) { await release(); continue; }
        if (!await locator.isVisible()) { await release(); continue; }
        if (group.defaultRole === "button" && await locator.getAttribute("role") === "option" && !await visibleWithinScrollableOwner(locator)) {
          await release();
          continue;
        }
        const initialSnapshot = await this.snapshot(locator, group.hint?.selectedClass).catch(() => undefined);
        if (!initialSnapshot) { await release(); continue; }
        const { signature: initialSignature, projection } = this.decodeSnapshot(initialSnapshot);
        const disabled = projection.disabled === true;
        const text = projection.text ?? "";
        const role = projection.role ?? group.defaultRole;
        const comboboxInput = group.kind === "BUTTON" && role === "combobox"
          ? projection.value === undefined ? undefined : { value: projection.value }
          : undefined;
        const inputValue = group.kind === "INPUT" || group.kind === "SELECT" || group.kind === "RANGE"
          ? projection.value ?? "" : comboboxInput?.value ?? "";
        const selectedDisplay = role === "combobox" && !inputValue ? await this.selectedDisplay(locator).catch(() => undefined) : undefined;
        const inputFallback = group.kind === "INPUT" ? projection.placeholder || projection.name || undefined : undefined;
        let label = (projection.label || projection.title || projection.associatedLabel || inputFallback || text || inputValue).replace(/\s+/g, " ").trim().slice(0, 240);
        const href = projection.href;
        let resolvedHref: string | undefined;
        if (href) {
          try {
            resolvedHref = new URL(href, page.url()).toString();
          } catch {
            // An invalid href is not a navigable model target.
          }
        }
        const dataDate = projection.dataDate;
        const dataValue = projection.dataValue;
        // Keep a genuinely observed empty native value.  Other controls do
        // not acquire a synthetic empty value merely because they have no
        // value-bearing DOM property.
        let value = group.kind === "RANGE"
          ? projection.rangeValue ?? projection.value
          : group.kind === "INPUT" || group.kind === "SELECT" || comboboxInput !== undefined
          ? selectedDisplay || projection.value
            : dataDate ?? dataValue ?? projection.value;
        // HTML's default method is GET, but only for a control whose actual
        // form owner was observed. A bare submit-looking button remains
        // structurally unclassified and cannot gain public-query permission.
        const method = projection.formMethodOverride?.trim().toUpperCase()
          || (projection.formOwner ? projection.formMethod?.trim().toUpperCase() || "GET" : projection.formMethod?.trim().toUpperCase() || "");
        const controlledListboxId = role === "combobox" ? projection.controls ?? null : null;
        const type = projection.type ?? null;
        const expanded = projection.expanded ?? null;
        let selected = projection.selected === true;
        if (group.hint) {
          const hint = group.hint;
          if (hint.value === "DATE_PARTS") {
            const parts = projection.dateParts ?? [];
            if (!parts.every(part => part && /^\d+$/.test(part))) { await release(); continue; }
            const [year, month, day] = parts.map(Number);
            if (!year || !month || !day || month > 12 || day > 31) { await release(); continue; }
            value = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          } else value = text.trim();
          label = `${hint.labelPrefix} ${value}`;
          selected = projection.selected === true;
        }
        const checked = group.kind === "CHECKBOX" || group.kind === "RADIO"
          ? projection.checked === true || projection.checked === "true"
          : undefined;
        const min = group.kind === "RANGE" ? projection.min ?? undefined : undefined;
        const max = group.kind === "RANGE" ? projection.max ?? undefined : undefined;
        const valueText = group.kind === "RANGE" ? projection.valueText ?? undefined : undefined;
        const scrollable = group.kind === "REGION"
          ? projection.scrollable === true
          : undefined;
        const scrollTop = group.kind === "REGION"
          ? projection.scrollTop ?? 0
          : undefined;
        const options = group.kind === "SELECT" ? await this.observeOptions(locator) : undefined;
        const blockedByActiveLayer = projection.blockedByActiveLayer === true;
        const structure = { tag: projection.tag, name: projection.name ?? "", classes: projection.classes ?? [], dialogLabel: projection.dialogLabel ?? "", formClass: projection.formClass ?? "", sliderCount: projection.sliderCount ?? 0, listboxId: projection.listboxId ?? "", ...(projection.radioGroupLabel ? { radioGroupLabel: projection.radioGroupLabel.slice(0, 240) } : {}), ...(projection.radioGroupKey ? { radioGroupKey: projection.radioGroupKey } : {}) };
        const id = `dom:${this.revision}:${controls.length + 1}`;
        if (await this.actionSignature(locator, group.hint?.selectedClass).catch(() => undefined) !== initialSignature) { await release(); continue; }
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
          stableKey: [group.selector, role, group.kind === "RADIO" ? structure.radioGroupKey ?? "" : "", role === "combobox" ? "" : label, group.kind === "BUTTON" && role !== "combobox" || group.kind === "RADIO" ? value : "", nodeIdentity ?? index].join("|"),
          kind: group.kind,
          role,
          label,
          // An observed native input's empty property is meaningful current
          // state. Do not collapse it into an absent property: discovery
          // needs to distinguish an empty public search from an unobserved
          // field without inventing a value for controls that have none.
          ...(value !== undefined ? { value } : {}),
          ...(resolvedHref ? { href: resolvedHref } : {}),
          ...(method ? { formMethod: method === "GET" ? "GET" : "POST" } : {}),
          ...(type ? { type } : {}),
          disabled,
          visible: true,
          ...(selected || group.kind === "RADIO" && checked === true ? { selected: true } : {}),
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
        } catch (error) {
          if (await this.disconnected(locator)) { await release(); continue; }
          await release();
          throw error;
        }
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
      if (await this.actionSignature(observed.element, observed.selectedClass) !== observed.signature
        || !await observed.element.isVisible() || await observed.element.isDisabled()) {
        throw new Error("Observed target changed, detached, hidden, or disabled");
      }
      if (observed.ownerId) {
        const owner = this.targets.get(observed.ownerId);
        if (!owner || await this.actionSignature(owner.element, owner.selectedClass) !== owner.signature
          || !await owner.element.isVisible() || await owner.element.isDisabled()) {
          throw new Error("Observed option owner changed, detached, hidden, or disabled");
        }
      }
      return observed.element;
    } catch {
      throw new BrowserRuntimeError("BROWSER_STALE_TARGET", "Observed target changed or detached; inspect a fresh page observation before acting");
    }
  }

  /**
   * Native radios are often a visually clipped input with a visible associated
   * label. Clicking that observed label is the ordinary browser interaction;
   * it avoids force-setting a hidden input and always verifies the input state.
   */
  async setChecked(id: string, checked: boolean, timeoutMs = INTERACTIVE_ACTION_TIMEOUT_MS): Promise<boolean> {
    const element = await this.target(id);
    if (!element) return false;
    if (await element.isChecked() === checked) return true;
    const labelHandle = await element.evaluateHandle(node => {
      if (!(node instanceof HTMLInputElement) || (node.type !== "radio" && node.type !== "checkbox")) return null;
      return [...(node.labels ?? [])].find(label => label.isConnected && (label as HTMLElement).getClientRects().length > 0) ?? null;
    });
    const label = labelHandle.asElement() as ElementHandle<SVGElement | HTMLElement> | null;
    try {
      if (label) await label.click({ timeout: timeoutMs });
      else await element.setChecked(checked, { timeout: timeoutMs });
      const current = await element.isChecked();
      if (current !== checked) throw new Error("Observed checked control did not reach the requested state");
      return true;
    } finally {
      await labelHandle.dispose().catch(() => undefined);
    }
  }

  private async observeOptions(locator: ElementHandle<SVGElement | HTMLElement>): Promise<Array<{ value: string; label: string; selected: boolean; disabled: boolean }>> {
    return locator.evaluate(element => [...element.querySelectorAll("option")].slice(0, 24).map(option => ({
      value: option.value,
      label: (option.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 160),
      selected: option.selected,
      disabled: option.disabled,
    })));
  }
}

export async function waitForVisibleChange(
  page: Page,
  previous: Pick<BrowserSnapshot, "url" | "title" | "text" | "interactiveState">,
  timeoutMs: number,
): Promise<boolean> {
  try {
    await page.waitForFunction(
      ({ url, title, text, interactiveState }) => {
        if (location.href !== url || document.title !== title) return true;
        const state = [...document.querySelectorAll("input,select,textarea,button,[role=combobox],[role=option],[role=checkbox],[role=radio],[role=slider]")]
          .filter(element => {
            const style = getComputedStyle(element);
            return (element as HTMLElement).getClientRects().length > 0 && style.display !== "none" && style.visibility !== "hidden";
          })
          .map((element, index) => {
          const field = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
          return JSON.stringify({ index, tag: element.tagName, role: element.getAttribute("role"), name: element.getAttribute("name"), id: element.id,
            value: "value" in field ? field.value : element.getAttribute("data-value"),
            checked: field instanceof HTMLInputElement && (field.type === "checkbox" || field.type === "radio") ? field.checked : (element.getAttribute("role") === "checkbox" || element.getAttribute("role") === "radio") ? element.getAttribute("aria-checked") : undefined,
            selected: element.getAttribute("aria-selected"),
            disabled: (element as HTMLButtonElement).disabled || element.getAttribute("aria-disabled") === "true" || element.getAttribute("data-state") === "disabled",
            expanded: element.getAttribute("aria-expanded") });
        }).join("\n");
        // This is only a bounded wake-up signal. A fresh executor observation
        // and the source adapter still decide whether a control effect or
        // request-bound inventory result exists. Keeping visible text here
        // avoids waiting out a rendered result that is not itself a control.
        return interactiveState === undefined
          ? (document.body?.innerText ?? "") !== text
          : state !== interactiveState || (document.body?.innerText ?? "") !== text;
      },
      previous,
      { timeout: timeoutMs },
    );
    return true;
  } catch (error) {
    if (error instanceof Error && /timeout/i.test(error.message)) return false;
    throw error;
  }
}

/** A small browser-owned projection for waiting, never model-supplied state. */
export async function interactiveState(page: Page): Promise<string> {
  return page.evaluate(() => [...document.querySelectorAll("input,select,textarea,button,[role=combobox],[role=option],[role=checkbox],[role=radio],[role=slider]")]
    .filter(element => {
      const style = getComputedStyle(element);
      return (element as HTMLElement).getClientRects().length > 0 && style.display !== "none" && style.visibility !== "hidden";
    })
    .map((element, index) => {
    const field = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    return JSON.stringify({
      index,
      tag: element.tagName,
      role: element.getAttribute("role"),
      name: element.getAttribute("name"),
      id: element.id,
      value: "value" in field ? field.value : element.getAttribute("data-value"),
      checked: field instanceof HTMLInputElement && (field.type === "checkbox" || field.type === "radio") ? field.checked : (element.getAttribute("role") === "checkbox" || element.getAttribute("role") === "radio") ? element.getAttribute("aria-checked") : undefined,
      selected: element.getAttribute("aria-selected"),
      disabled: (element as HTMLButtonElement).disabled || element.getAttribute("aria-disabled") === "true" || element.getAttribute("data-state") === "disabled",
      expanded: element.getAttribute("aria-expanded"),
    });
  }).join("\n"));
}

/** Read-only ARIA inputs may be tiny focus proxies rather than pointer targets.
 * ArrowDown opens their native accessible choice list without force-clicking an
 * overlaid input. The Executor still validates the target and verifies new state.
 */
export async function activateObservedControl(locator: ElementHandle<SVGElement | HTMLElement>, timeoutMs = INTERACTIVE_ACTION_TIMEOUT_MS): Promise<void> {
  const options = { timeout: timeoutMs };
  if (await locator.getAttribute("role") === "combobox" && await locator.getAttribute("aria-readonly") === "true"
    && await locator.evaluate(element => element.tagName === "INPUT")) {
    await locator.press("ArrowDown", options);
  } else await locator.click(options);
}
