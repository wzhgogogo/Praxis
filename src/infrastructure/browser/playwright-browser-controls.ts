import type { ElementHandle, Page } from "playwright-core";

import type { BrowserControlHint, BrowserPageControl, BrowserSnapshot } from "./browser-runtime.js";
import { BrowserRuntimeError } from "./browser-runtime-errors.js";
import { hasSelectedControlState } from "./control-selected-state.js";

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

/** A clipped option is observable only through its visible owning list. */
async function optionViewportState(locator: ElementHandle<SVGElement | HTMLElement>): Promise<{ clipped: boolean; covered: boolean }> {
  return locator.evaluate(element => {
    const owner = element.closest('[role="listbox"]') as HTMLElement | null;
    if (!owner || !owner.isConnected || !owner.getClientRects().length) return { clipped: false, covered: true };
    const item = element.getBoundingClientRect(); const bounds = owner.getBoundingClientRect();
    const clipped = (owner.scrollHeight > owner.clientHeight || owner.scrollWidth > owner.clientWidth)
      && (item.top < bounds.top || item.bottom > bounds.bottom || item.left < bounds.left || item.right > bounds.right);
    const x = clipped ? Math.max(bounds.left + 1, Math.min(item.left + item.width / 2, bounds.right - 1)) : item.left + item.width / 2;
    const y = clipped ? Math.max(bounds.top + 1, Math.min(item.top + item.height / 2, bounds.bottom - 1)) : item.top + item.height / 2;
    const hit = document.elementFromPoint(x, y);
    return { clipped, covered: !hit || !(clipped ? owner.contains(hit) : element.contains(hit)) };
  }).catch(() => ({ clipped: false, covered: true }));
}

/**
 * Observes accessibility-facing DOM facts and pins each offered action to its
 * ElementHandle. The model receives only opaque ids; no selector or JavaScript
 * crosses the model boundary.
 */
export class PlaywrightControlRegistry {
  private revision = 0;
  private targets = new Map<string, { element: ElementHandle<SVGElement | HTMLElement>; signature: string; ownerId?: string; nodeIdentity?: string; listboxIds?: string[] }>();
  private nextNodeIdentity = 0;

  async dispose(): Promise<void> {
    await Promise.all([...this.targets.values()].map(target => target.element.dispose().catch(() => undefined)));
    this.targets.clear();
  }

  /**
   * Read the inexpensive, browser-owned control projection once.  The
   * `signature` intentionally excludes presentation-only fields such as the
   * full CSS class list and scroll position: they help describe a control, but
   * a hover/animation must not invalidate an otherwise identical observed
   * target before its one permitted action.
   */
  private async snapshot(element: ElementHandle<SVGElement | HTMLElement>): Promise<string | undefined> {
    const snapshot = await element.evaluate((node) => {
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
      // Object methods remain self-contained when Playwright serializes this
      // callback; named local arrows can capture the transpiler's __name helper.
      const monthReader = {
        clean(value: string | null | undefined) { return value?.replace(/\s+/g, " ").trim() ?? ""; },
        ownerKey(owner: Element | undefined) {
          if (!owner) return undefined;
          const path: string[] = [];
          for (let current: Element | null = owner; current?.parentElement; current = current.parentElement) {
            path.unshift(`${current.tagName}:${[...current.parentElement.children].indexOf(current)}`);
          }
          return `dom-group:${path.join("/")}`;
        },
        read(calendar: Element | null) {
          if (!calendar) return undefined;
          const captionNode = calendar.querySelector("caption");
          const caption = (captionNode?.textContent || calendar.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
          const english = caption.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i);
          const numeric = caption.match(/(\d{4})\s*[年/-]\s*(\d{1,2})/);
          const year = Number(english?.[2] ?? numeric?.[1]);
          const month = english ? ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(english[1]!.slice(0, 3).toLowerCase()) + 1 : Number(numeric?.[2]);
          return year && month >= 1 && month <= 12 ? { year, month, caption, source: captionNode ? "DOM caption" as const : "ARIA label" as const } : undefined;
        },
      };
      let controlGroupLabel = "Unlabelled group";
      let groupOwner: Element | undefined;
      let calendarMonth: ReturnType<typeof monthReader.read>;
      // Stay inside a nearby widget. Never assign a page's one calendar to
      // an unrelated header/footer control or choose among multiple calendars.
      let container = node.parentElement;
      for (let depth = 0; container && depth < 6 && !container.matches("body,html,main,header,footer"); depth++, container = container.parentElement) {
        const ownMonth = container.matches('table,[role="grid"]') ? monthReader.read(container) : undefined;
        if (ownMonth) { controlGroupLabel = "Calendar"; calendarMonth = ownMonth; groupOwner = container; break; }
        const labelledBy = (container.getAttribute("aria-labelledby") ?? "").split(/\s+/).filter(Boolean);
        const explicit = monthReader.clean(container.getAttribute("aria-label") || labelledBy.map(id => document.getElementById(id)?.textContent ?? "").join(" "));
        const labels = [...new Set([...container.children].filter(child => /^(?:LABEL|LEGEND|H[1-6]|P|SPAN)$/.test(child.tagName)
          && child.getClientRects().length > 0 && !child.querySelector('input,select,button,a,[role="button"],[role="option"]'))
          .map(child => monthReader.clean(child.textContent)).filter(value => value && value.length <= 100))];
        if (explicit || labels.length === 1) { controlGroupLabel = (explicit || labels[0]!).slice(0, 160); groupOwner = container; break; }
        if (labels.length > 1) break;
        const calendars = [...container.querySelectorAll('table,[role="grid"]')].filter(table => table.getClientRects().length > 0).map(table => monthReader.read(table)).filter(month => month !== undefined);
        if (calendars.length === 1) { controlGroupLabel = "Calendar"; calendarMonth = calendars[0]; groupOwner = container; break; }
        if (calendars.length > 1 || container.matches("section,article,aside,form")) break;
      }
      // A native select / custom combobox may itself be the labelled owner.
      if (!groupOwner && (node instanceof HTMLSelectElement || node.getAttribute("role") === "combobox")) {
        const ownLabel = monthReader.clean(node.getAttribute("aria-label") || [...((node as HTMLInputElement).labels ?? [])].map(label => label.textContent).join(" "));
        if (ownLabel) { groupOwner = node; controlGroupLabel = ownLabel.slice(0, 160); }
      }
      const controlGroupKey = monthReader.ownerKey(groupOwner);
      const alternatives = node.matches('a,[role="link"]') ? [...new Set([...node.querySelectorAll('i,svg title,img[alt],[aria-label],[title]')]
        .map(child => monthReader.clean(child.getAttribute("aria-label") || child.getAttribute("title") || child.getAttribute("alt") || child.textContent))
        .filter(value => value && value.length <= 240))] : [];
      const linkAlternativeText = alternatives.length === 1 ? alternatives[0] : undefined;
      const dayCell = node.closest('td,[role="gridcell"]');
      const monthCaption = dayCell?.closest('table,[role="grid"]')?.querySelector('caption')?.textContent ?? '';
      const monthYear = monthCaption.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i);
      const numericMonthYear = monthCaption.match(/(\d{4})\s*[年/-]\s*(\d{1,2})/);
      const yearNumber = Number(monthYear?.[2] ?? numericMonthYear?.[1]);
      const dayNumber = Number(dayCell?.textContent?.trim().match(/^(\d{1,2})(?:\D|$)/)?.[1]);
      const monthNumber = monthYear ? ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(monthYear[1]!.slice(0,3).toLowerCase())+1 : Number(numericMonthYear?.[2]);
      const calendarDate = yearNumber && monthNumber > 0 && monthNumber <= 12 && dayNumber > 0 && dayNumber <= new Date(Date.UTC(yearNumber,monthNumber,0)).getUTCDate()
        ? `${yearNumber}-${String(monthNumber).padStart(2,'0')}-${String(dayNumber).padStart(2,'0')}` : undefined;
      const formVisibleLines: string[] = [];
      if (form) {
        const walker = document.createTreeWalker(form, NodeFilter.SHOW_TEXT);
        for (let next = walker.nextNode(), visited = 0; next && visited < 1000 && formVisibleLines.length < 80; next = walker.nextNode(), visited++) {
          const owner = next.parentElement;
          if (!owner || owner.closest("script,style,template,noscript,select,option") || !(owner as HTMLElement).getClientRects().length) continue;
          const style = getComputedStyle(owner); if (style.display === "none" || style.visibility === "hidden") continue;
          const text = next.textContent?.replace(/\s+/g, " ").trim();
          if (text && text.length <= 160) formVisibleLines.push(text);
        }
      }
      const projection = {
        tag: node.tagName, classes: [...node.classList], role: node.getAttribute("role"), type: node.getAttribute("type"),
        label: node.getAttribute("aria-label"), title: node.getAttribute("title"),
        text: (node as HTMLElement).innerText?.replace(/\s+/g, " ").trim().slice(0, 240) ?? "",
        controlGroupLabel, controlGroupKey, calendarMonth, linkAlternativeText,
        associatedLabel: [...((node as HTMLInputElement).labels ?? [])].map(label => label.innerText.replace(/\s+/g, " ").trim()).join(" "),
        value, href: node.getAttribute("href"), name: node.getAttribute("name"), placeholder: node.getAttribute("placeholder"),
        formOwner: form ? `${form.id || formIndex}` : "", radioGroupKey,
        formVisibleLines,
        formMethodOverride: node.getAttribute("formmethod"), formTarget: node.getAttribute("formtarget"),
        readOnly: (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) && node.readOnly,
        disabled: (node as HTMLElement).matches(":disabled") || node.getAttribute("aria-disabled") === "true" || node.getAttribute("data-state") === "disabled",
        selectionAttributes: Object.fromEntries(["aria-selected", "aria-pressed", "aria-checked", "aria-current"].map(name => [name, node.getAttribute(name)])),
        expanded: node.getAttribute("aria-expanded"), controls: node.getAttribute("aria-controls"),
        calendarDate, dataDate: node.getAttribute("data-date"), dataValue: node.getAttribute("data-value"),
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
        controlGroupLabel: _groupLabel,
        controlGroupKey: _groupKey,
        formVisibleLines: _formVisibleLines,
        ...signature
      } = projection;
      return { projection, signature };
    });
    if (!snapshot) return undefined;
    const { selectionAttributes, ...projection } = snapshot.projection;
    const { selectionAttributes: _selectionAttributes, ...signature } = snapshot.signature;
    const selected = hasSelectedControlState(selectionAttributes) || projection.checked === true;
    return JSON.stringify({ projection: { ...projection, selected }, signature: { ...signature, selected } });
  }

  private decodeSnapshot(snapshot: string): { signature: string; projection: {
    tag: string; classes?: string[]; role?: string | null; type?: string | null; label?: string | null; title?: string | null; text?: string;
    associatedLabel?: string; value?: string; href?: string | null; name?: string | null; placeholder?: string | null;
    controlGroupLabel?: string; controlGroupKey?: string; calendarMonth?: import("./browser-runtime.js").BrowserCalendarMonth; linkAlternativeText?: string;
    readOnly?: boolean; disabled?: boolean; selected?: boolean; expanded?: string | null; checked?: boolean | string;
    calendarDate?: string; dataDate?: string | null; dataValue?: string | null; dateParts?: Array<string | null>; min?: string | null; max?: string | null;
    rangeValue?: string | null; valueText?: string | null; selectedOptions?: Array<[string, string, boolean, boolean]>; listboxId?: string; controls?: string | null;
    formOwner?: string; formVisibleLines?: string[]; formMethodOverride?: string | null; formMethod?: string; formClass?: string; dialogLabel?: string; sliderCount?: number;
    radioGroupLabel?: string; radioGroupKey?: string; scrollable?: boolean; scrollTop?: number; blockedByActiveLayer?: boolean;
  } } {
    const parsed = JSON.parse(snapshot) as { signature: object; projection: {
      tag: string; classes?: string[]; role?: string | null; type?: string | null; label?: string | null; title?: string | null; text?: string;
      associatedLabel?: string; value?: string; href?: string | null; name?: string | null; placeholder?: string | null;
      controlGroupLabel?: string; controlGroupKey?: string; calendarMonth?: import("./browser-runtime.js").BrowserCalendarMonth; linkAlternativeText?: string;
      readOnly?: boolean; disabled?: boolean; selected?: boolean; expanded?: string | null; checked?: boolean | string;
      calendarDate?: string; dataDate?: string | null; dataValue?: string | null; dateParts?: Array<string | null>; min?: string | null; max?: string | null;
      rangeValue?: string | null; valueText?: string | null; selectedOptions?: Array<[string, string, boolean, boolean]>; listboxId?: string; controls?: string | null;
      formOwner?: string; formVisibleLines?: string[]; formMethodOverride?: string | null; formMethod?: string; formClass?: string; dialogLabel?: string; sliderCount?: number;
      radioGroupLabel?: string; radioGroupKey?: string; scrollable?: boolean; scrollTop?: number; blockedByActiveLayer?: boolean;
    } };
    return { signature: JSON.stringify(parsed.signature), projection: parsed.projection };
  }

  private async actionSignature(element: ElementHandle<SVGElement | HTMLElement>): Promise<string | undefined> {
    const snapshot = await this.snapshot(element);
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
        const optionState = await locator.getAttribute("role") === "option" ? await optionViewportState(locator) : undefined;
        if (optionState?.covered) { await release(); continue; }
        const initialSnapshot = await this.snapshot(locator).catch(() => undefined);
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
        const inputFallback = group.kind === "INPUT" ? projection.placeholder || projection.name || undefined : undefined;
        let label = (projection.label || projection.title || projection.associatedLabel || inputFallback || text || inputValue).replace(/\s+/g, " ").trim().slice(0, 240);
        const alternativeLabel = !label && group.kind === "LINK" ? projection.linkAlternativeText : undefined;
        if (alternativeLabel) label = alternativeLabel;
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
          ? projection.value
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
        if (group.kind === "BUTTON" && projection.calendarDate) {
          value = projection.calendarDate;
          label = `Date ${value}`;
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
        if (await this.actionSignature(locator).catch(() => undefined) !== initialSignature) { await release(); continue; }
        let nodeIdentity: string | undefined;
        let priorListboxes: string[] = [];
        if (group.kind === "SELECT" || role === "combobox") {
          for (const previous of previousTargets.values()) {
            if (!previous.nodeIdentity) continue;
            if (await locator.evaluate((element, old) => element === old, previous.element).catch(() => false)) {
              nodeIdentity = previous.nodeIdentity;
              priorListboxes = previous.listboxIds ?? [];
              break;
            }
          }
          nodeIdentity ??= `control:${++this.nextNodeIdentity}`;
        }
        const listboxIds = [...new Set([...(controlledListboxId?.split(/\s+/).filter(Boolean) ?? []), ...priorListboxes])];
        const selectionReadback = role === "combobox" ? await this.selectionReadback(locator,listboxIds) : undefined;
        this.targets.set(id, { element: locator, signature: initialSignature,
          ...(nodeIdentity ? { nodeIdentity, listboxIds } : {}) });
        controls.push({
          id,
          structure,
          ...(group.hint?.observationOnly ? { observationOnly: true } : {}),
          ...(projection.calendarDate ? { calendarDate: projection.calendarDate } : {}),
          stableKey: [group.selector, role, group.kind === "RADIO" ? structure.radioGroupKey ?? "" : "", role === "combobox" ? "" : label, group.kind === "BUTTON" && role !== "combobox" || group.kind === "RADIO" ? value : "", nodeIdentity ?? index].join("|"),
          kind: group.kind,
          role,
          label,
          controlGroupLabel: projection.controlGroupLabel ?? "Unlabelled group",
          ...(projection.controlGroupKey ? { controlGroupKey: projection.controlGroupKey } : {}),
          ...(alternativeLabel ? { labelSource: "DOM descendant text" as const } : {}),
          ...(projection.calendarMonth ? { calendarMonth: projection.calendarMonth } : {}),
          // An observed native input's empty property is meaningful current
          // state. Do not collapse it into an absent property: discovery
          // needs to distinguish an empty public search from an unobserved
          // field without inventing a value for controls that have none.
          ...(value !== undefined ? { value } : {}),
          ...(resolvedHref ? { href: resolvedHref } : {}),
          ...(method ? { formMethod: method === "GET" ? "GET" : "POST" } : {}),
          ...(projection.formOwner ? { formObservation: { owner: projection.formOwner, visibleLines: projection.formVisibleLines ?? [] } } : {}),
          ...(type ? { type } : {}),
          ...(projection.readOnly ? { readOnly: true } : {}),
          disabled,
          visible: true,
          ...(optionState?.clipped ? { outsideViewport: true } : {}),
          ...(selected || group.kind === "RADIO" && checked === true ? { selected: true } : {}),
          ...(expanded === "true" || expanded === "false" ? { expanded: expanded === "true" } : {}),
          ...(selectionReadback ? {selectionReadback} : {}),
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
    const days = await page.evaluate(() => [...document.querySelectorAll('table,[role="grid"]')].flatMap((calendar, calendarIndex) => {
      const caption = calendar.querySelector('caption')?.textContent ?? calendar.getAttribute('aria-label') ?? '';
      const english = caption.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i);
      const numeric = caption.match(/(\d{4})\s*[年/-]\s*(\d{1,2})/);
      const year = Number(english?.[2] ?? numeric?.[1]);
      const month = english ? ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(english[1]!.slice(0,3).toLowerCase())+1 : Number(numeric?.[2]);
      if (!year || month < 1 || month > 12) return [];
      const ownerPath: string[] = [];
      for (let current: Element | null = calendar; current?.parentElement; current = current.parentElement) ownerPath.unshift(`${current.tagName}:${[...current.parentElement.children].indexOf(current)}`);
      const controlGroupKey = `dom-group:${ownerPath.join('/')}`;
      return [...calendar.querySelectorAll('td,[role="gridcell"]')].flatMap((cell, index) => {
        const style=getComputedStyle(cell);
        if (!cell.getClientRects().length || style.display==='none' || style.visibility==='hidden') return [];
        const number=Number(cell.textContent?.trim().match(/^(\d{1,2})(?:\D|$)/)?.[1]);
        if (!number || number>new Date(Date.UTC(year,month,0)).getUTCDate()) return [];
        const date=`${year}-${String(month).padStart(2,'0')}-${String(number).padStart(2,'0')}`;
        const stateNodes = [cell, ...cell.querySelectorAll('[aria-selected],[aria-pressed],[aria-checked],[aria-current]')]
          .filter(node => node === cell || node.getClientRects().length > 0 && node.textContent?.trim() === String(number));
        const selectionAttributes = stateNodes.map(node => Object.fromEntries(["aria-selected", "aria-pressed", "aria-checked", "aria-current"].map(name => [name, node.getAttribute(name)])));
        return [{date,key:`calendar:${calendarIndex}:day:${index}`,selectionAttributes,controlGroupKey,calendarMonth:{year,month,caption:caption.replace(/\s+/g,' ').trim(),source:calendar.querySelector('caption')?'DOM caption' as const:'ARIA label' as const}}];
      });
    }));
    for (const day of days) {
      if (controls.some(control => control.value===day.date || control.label===`Date ${day.date}`)) continue;
      controls.push({id:`dom:${this.revision}:calendar:${controls.length+1}`,stableKey:day.key,kind:'BUTTON',role:'gridcell',label:`Calendar date ${day.date}`,controlGroupLabel:'Calendar',controlGroupKey:day.controlGroupKey,calendarMonth:day.calendarMonth,value:day.date,calendarDate:day.date,...(day.selectionAttributes.some(attributes => hasSelectedControlState(attributes))?{selected:true}:{}),disabled:true,visible:true,observationOnly:true,structure:{tag:'TD',name:'',classes:[],dialogLabel:'',formClass:'',sliderCount:0}});
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
      if (!owner || control.disabled) control.observationOnly = true;
    }
    await Promise.all([...previousTargets.values()].map(target => target.element.dispose().catch(() => undefined)));
    return controls;
  }

  async target(id: string): Promise<ElementHandle<SVGElement | HTMLElement> | undefined> {
    const observed = this.targets.get(id);
    if (!observed) return undefined;
    try {
      if (await this.actionSignature(observed.element) !== observed.signature
        || !await observed.element.isVisible() || await observed.element.isDisabled()) {
        throw new Error("Observed target changed, detached, hidden, or disabled");
      }
      if (observed.ownerId) {
        const owner = this.targets.get(observed.ownerId);
        if (!owner || await this.actionSignature(owner.element) !== owner.signature
          || !await owner.element.isVisible() || await owner.element.isDisabled()) {
          throw new Error("Observed option owner changed, detached, hidden, or disabled");
        }
      }
      if (observed.ownerId && await observed.element.getAttribute("role") === "option") {
        // Scroll this list only. Do not move the page or consume a model decision.
        await observed.element.evaluate(node => {
          const list = node.closest('[role="listbox"]') as HTMLElement | null;
          if (!list) throw new Error("Option list detached");
          const item = node.getBoundingClientRect(); const bounds = list.getBoundingClientRect();
          if (item.top < bounds.top) list.scrollTop += item.top - bounds.top;
          else if (item.bottom > bounds.bottom) list.scrollTop += item.bottom - bounds.bottom;
          if (item.left < bounds.left) list.scrollLeft += item.left - bounds.left;
          else if (item.right > bounds.right) list.scrollLeft += item.right - bounds.right;
        });
        const viewport = await optionViewportState(observed.element);
        const owner = this.targets.get(observed.ownerId)!;
        if (viewport.clipped || viewport.covered
          || await this.actionSignature(observed.element) !== observed.signature
          || await this.actionSignature(owner.element) !== owner.signature)
          throw new Error("Revealed option changed, lost its owner, or is covered");
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

  /** Public compact display beside a read-only ARIA input, never a private
   * value-container proxy or a value borrowed from announcements/other fields. */
  private async selectionReadback(element: ElementHandle<SVGElement | HTMLElement>, knownListboxes: string[]): Promise<{menuClosed: boolean; displayRequired?: true; displayText?: string}> {
    return element.evaluate((node, known) => {
      const ids = [...new Set([...(node.getAttribute("aria-controls")?.split(/\s+/).filter(Boolean) ?? []), ...known])];
      const visibleLists = ids.some(id => {
        const list = document.getElementById(id);
        if (!list) return false;
        if (list.getAttribute("role") !== "listbox") return true;
        const style = getComputedStyle(list);
        return list.getClientRects().length > 0 && style.display !== "none" && style.visibility !== "hidden";
      });
      const expanded = node.getAttribute("aria-expanded");
      const menuClosed = expanded !== null ? expanded === "false" && !visibleLists : ids.length > 0 && !visibleLists;
      const displayRequired = node instanceof HTMLInputElement && node.getAttribute("aria-readonly") === "true" && node.value === "";
      const proof = {menuClosed,...(displayRequired ? {displayRequired:true as const} : {})};
      if (!menuClosed || !displayRequired) return proof;
      const interactive = 'input,select,textarea,button,a[href],[role="combobox"],[role="button"],[role="textbox"]';
      for (let container = node.parentElement; container && !container.matches('html,body,main,form,section,article,[role="listbox"],[role="log"],[aria-live]'); container = container.parentElement) {
        if ([...container.querySelectorAll(interactive)].some(control => control !== node)) break;
        const texts = new Set<string>(), walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const parent = walker.currentNode.parentElement;
          if (!parent || parent.closest('script,style,[hidden],[aria-hidden="true"],[role="listbox"],[role="log"],[aria-live]') || parent.closest(interactive)) continue;
          const style = getComputedStyle(parent);
          if (!parent.getClientRects().length || style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;
          const text = walker.currentNode.textContent?.replace(/\s+/g," ").trim();
          if (text) texts.add(text);
        }
        if (texts.size) { const text = [...texts][0]!; return texts.size === 1 && text.length <= 240 ? {...proof,displayText:text} : proof; }
      }
      return proof;
    },knownListboxes);
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

/** Quiet DOM or stable visible content plus completed requests indicate readiness, never inventory. */
export async function waitForPageSettled(
  page: Page,
  _previous: Pick<BrowserSnapshot, "url" | "title" | "text" | "interactiveState">,
  timeoutMs: number,
  activity: () => { pending: number; revision: number; pendingByType?: Record<string, number>; oldestPendingMs?: number },
  diagnostic?: (value: import("./browser-runtime.js").BrowserSettlementDiagnostics) => void,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const before = activity();
    const ready = await page.evaluate((remaining) => new Promise<{ settled: boolean; busySelectors: string[]; visibleTextChanging: boolean }>(resolve => {
      let lastMutation = performance.now();
      const observer = new MutationObserver(() => { lastMutation = performance.now(); });
      observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
      const projection = { capture() { return JSON.stringify({ text: document.body?.innerText ?? "", controls:
        [...document.querySelectorAll('a[href],input,select,textarea,button,[role=combobox],[role=option],[role=checkbox],[role=radio],[role=slider]')].filter(element => {
          const style = getComputedStyle(element);
          return element.getClientRects().length > 0 && style.display !== "none" && style.visibility !== "hidden";
        }).map(element => {
          const field = element as HTMLInputElement;
          return [element.tagName, element.id, element.getAttribute("role"), element.getAttribute("name"), element.getAttribute("href"),
            "value" in field ? field.value : element.getAttribute("data-value"), "checked" in field ? field.checked : element.getAttribute("aria-checked"),
            element.getAttribute("aria-selected"), (field.disabled || element.getAttribute("aria-disabled") === "true"), element.getAttribute("aria-expanded"), element.getAttribute("aria-valuenow")];
        }) }); } };
      let sample = projection.capture(), visibleSince = performance.now();
      const started = performance.now();
      const timer = setInterval(() => {
        const busyElements = [...document.querySelectorAll('[aria-busy="true"],[role="progressbar"],[class]')].filter(element => {
          if (!element.matches('[aria-busy="true"],[role="progressbar"]') && !/(?:^|[\s_-])(?:spinner|loader|skeleton)(?:$|[\s_-])/i.test(element.className.toString())) return false;
          const style = getComputedStyle(element);
          return element.getClientRects().length > 0 && style.display !== "none" && style.visibility !== "hidden";
        });
        const current = projection.capture();
        if (current !== sample) { sample = current; visibleSince = performance.now(); }
        const settled = !busyElements.length && (performance.now() - lastMutation >= 300 || performance.now() - visibleSince >= 300);
        if (settled || performance.now() - started >= remaining) {
          clearInterval(timer); observer.disconnect(); resolve({ settled, busySelectors: busyElements.slice(0, 12).map(element => element.matches('[aria-busy="true"]') ? '[aria-busy="true"]' : element.matches('[role="progressbar"]') ? '[role="progressbar"]' : '.' + element.className.toString().split(/\s+/).filter(value => /spinner|loader|skeleton/i.test(value)).join('.')), visibleTextChanging: performance.now() - visibleSince < 300 });
        }
      }, 50);
    }), Math.max(1, deadline - Date.now())).catch(async error => {
      // A chosen observed link can commit while the passive DOM sample is
      // pending. Follow that already-started navigation within this same
      // settling window; never reissue the click or request.
      if (!(error instanceof Error) || !/Execution context was destroyed|Cannot find context with specified id/u.test(error.message) || page.isClosed()) throw error;
      if (Date.now() < deadline) await page.waitForLoadState("domcontentloaded", {timeout: Math.max(1, deadline-Date.now())}).catch(() => undefined);
      return undefined;
    });
    if (!ready) continue;
    const after = activity();
    diagnostic?.({ url: page.url(), pendingByType: after.pendingByType ?? {}, oldestPendingMs: after.oldestPendingMs ?? 0, blockingDataRequests: after.pending, busySelectors: ready.busySelectors, visibleTextChanging: ready.visibleTextChanging });
    if (ready.settled && before.pending === 0 && after.pending === 0 && before.revision === after.revision) return true;
    if (!ready.settled) return false;
  }
  return false;
}

/** Current visible busy markers; a prior wait's sample cannot certify a later result. */
export async function pageBusyDiagnostics(page: Page): Promise<{busySelectors: string[]; contentBusySelectors: string[]}> {
  return page.evaluate(() => {
    const busy = [...document.querySelectorAll('[aria-busy="true"],[role="progressbar"],[class]')].filter(element => {
      if (!element.matches('[aria-busy="true"],[role="progressbar"]') && !/(?:^|[\s_-])(?:spinner|loader|skeleton)(?:$|[\s_-])/i.test(element.className.toString())) return false;
      const style = getComputedStyle(element);
      return element.getClientRects().length > 0 && style.display !== "none" && style.visibility !== "hidden";
    });
    const rules = {
      describe(element: Element) { return element.matches('[aria-busy="true"]') ? '[aria-busy="true"]' : element.matches('[role="progressbar"]') ? '[role="progressbar"]' : '.' + element.className.toString().split(/\s+/).filter(value => /spinner|loader|skeleton/i.test(value)).join('.'); },
      decoration(element: Element) {
        for (let node: Element | null = element; node; node = node.parentElement) if (getComputedStyle(node).opacity === "0") return true;
        if (element.matches('[aria-busy="true"],[role="progressbar"]')) return false;
        if ((element as HTMLElement).innerText?.trim()) return false;
        const box = element.getBoundingClientRect();
        for (let frame = element.parentElement; frame && !frame.matches('html,body,main,form,section,article'); frame = frame.parentElement) {
          // A real media surface, or a separate empty, dimensioned preview
          // surface inside an observed navigation wrapper. Neither names nor
          // private attributes/classes identify the preview.
          const navigation = frame.tagName === "A" && frame.hasAttribute("target");
          const text = (frame as HTMLElement).innerText?.replace(/\s+/g," ").trim();
          // Mixed prose cards are not media previews. A navigation preview
          // may carry its own public accessible label, but no other prose.
          if (text && (!navigation || text !== frame.getAttribute("aria-label")?.replace(/\s+/g," ").trim())) continue;
          const frameBox = frame.getBoundingClientRect();
          const geometry = {sameArea(left: DOMRect, right: DOMRect) {return [left.left-right.left,left.right-right.right,left.top-right.top,left.bottom-right.bottom].every(delta => Math.abs(delta) <= 1);}};
          const surfaces = [...frame.querySelectorAll('img,picture,video,canvas,svg,iframe,[role="img"],div')].filter(node => {
            if (node === element || element.contains(node) || node.contains(element) || busy.includes(node) || (node as HTMLElement).innerText?.trim()) return false;
            const style = getComputedStyle(node), area = node.getBoundingClientRect();
            return area.width > 0 && area.height > 0 && style.display !== "none" && style.visibility !== "hidden"
              && (node.matches('img,picture,video,canvas,svg,iframe,[role="img"]') || style.backgroundImage !== "none" || navigation && node.children.length === 0)
              // A preview mask fills its independent surface and frame;
              // a small body placeholder inside a large image does not.
              && geometry.sameArea(box,area) && geometry.sameArea(area,frameBox);
          });
          if (!surfaces.length) continue;
          const walker = document.createTreeWalker(frame, NodeFilter.SHOW_TEXT);
          let coveredText = false;
          while (walker.nextNode()) {
            const node = walker.currentNode, parent = node.parentElement;
            if (!node.textContent?.trim() || !parent || element.contains(parent)) continue;
            const style = getComputedStyle(parent);
            if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;
            const range = document.createRange(); range.selectNodeContents(node);
            for (const rect of range.getClientRects()) {
              if (rect.right <= box.left || rect.left >= box.right || rect.bottom <= box.top || rect.top >= box.bottom) continue;
              const hit = document.elementFromPoint((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2);
              if (hit && element.contains(hit)) coveredText = true;
            }
          }
          if (!coveredText) return true;
        }
        return false;
      },
    };
    // Filter the complete DOM before either diagnostic is capped. The generic
    // settlement marker list (including aria-hidden loaders) is unchanged.
    return {busySelectors: busy.slice(0, 12).map(element => rules.describe(element)),
      contentBusySelectors: busy.filter(element => !rules.decoration(element)).slice(0, 12).map(element => rules.describe(element))};
  });
}

export async function pageBusySelectors(page: Page): Promise<string[]> { return (await pageBusyDiagnostics(page)).busySelectors; }

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
