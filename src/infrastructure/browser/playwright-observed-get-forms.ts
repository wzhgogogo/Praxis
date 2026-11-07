import { createHash } from "node:crypto";
import { channel } from "node:diagnostics_channel";
import type { ElementHandle, JSHandle, Page } from "playwright-core";

import type { BrowserPublicInputSource } from "./browser-runtime.js";

/** Optional diagnostics contain timings only, never form keys or values. */
const formEvidence = channel("praxis.browser.form-evidence");
let traceSequence = 0;
export async function traceFormEvidence<T>(stage: string, operation: () => Promise<T>): Promise<T> {
  const id = ++traceSequence, started = performance.now();
  const emit = (phase: string) => { try { formEvidence.publish({ id, stage, phase, monotonicMs: performance.now(), elapsedMs: performance.now() - started }); } catch { /* A diagnostic consumer cannot change admission. */ } };
  emit("START");
  try { const result = await operation(); emit("END"); return result; }
  catch (error) { emit("ERROR"); throw error; }
}

export interface ObservedGetFormSubmission {
  documentOrigin: string;
  actionOrigin: string;
  actionPathname: string;
  fields: Array<{ key: string; valueSha256: string; source: "PAGE" | BrowserPublicInputSource }>;
}

const inputSources: readonly BrowserPublicInputSource[] = ["AREA", "CUISINE", "DATE", "TIME", "PARTY_SIZE", "SPECIFIC_OUTLET", "G4_SOURCE_TERM"];

/** This is a format rejection, not a general person-name classifier. */
export function assertPublicReadInput(value: string, source?: BrowserPublicInputSource): void {
  if (!source || !inputSources.includes(source)) throw new Error("Public read input has no authoritative nonpersonal source");
  // Dates and clock values have their own exact authority. Do not mistake a
  // native ISO date for a telephone number. Other inserted text has the same
  // phone/mail/credential format rejection used by the read recorder.
  if (/[@\r\n]|Bearer\s|\bsk-|\b(?:cookie|token|password|authorization)\s*[:=]/iu.test(value)
    || !/^\d{4}-\d{2}-\d{2}$/.test(value) && /\+?\d[\d()\s-]{8,}\d/u.test(value)) {
    throw new Error("Public read input contains a sensitive format");
  }
}

/**
 * Native forms observed by the runtime, bound to their actual document and
 * element handles. No page/model assertion can register a form or input origin.
 * Website defaults are returned only to that same website. All values inserted
 * by this runtime must first pass assertPublicReadInput; unknown fills are
 * refused before the page receives them.
 */
export class PlaywrightObservedGetForms {
  private readonly documents = new WeakMap<Page, { url: string; document: JSHandle<Document>; forms: ElementHandle<HTMLFormElement>[]; inputEvents: JSHandle<Array<{ node: HTMLInputElement | HTMLTextAreaElement; value: string; approved?: boolean }>> }>();
  private readonly insertions = new WeakMap<Page, Array<{ element: ElementHandle; value: string; source: BrowserPublicInputSource }>>();
  private readonly readInputs = new WeakMap<Page, string[]>();
  private readonly pendingInsertions = new WeakMap<Page, Promise<void>>();
  beginReadScope(page:Page):void { this.readInputs.delete(page); }
  async authoritativeInputs(page:Page):Promise<readonly string[]> {
    await this.pendingInsertions.get(page);
    const observed=this.documents.get(page);
    if(!observed || !await observed.document.evaluate(node=>node===document).catch(()=>false))return [];
    return this.readInputs.get(page)??[];
  }
  /** Pause query observation until the actual fill succeeds or fails. */
  async fill(page:Page,element:ElementHandle,value:string,source:BrowserPublicInputSource,perform:()=>Promise<void>):Promise<void> {
    assertPublicReadInput(value,source);
    let release!:()=>void;
    this.pendingInsertions.set(page,new Promise<void>(resolve=>{release=resolve;}));
    try { await perform(); await this.inserted(page,element,value,source); }
    finally { release();this.pendingInsertions.delete(page); }
  }
  private readonly submitters = new WeakMap<Page, ElementHandle>();

  async observe(page: Page): Promise<void> {
    const previous = this.documents.get(page);
    // Keep every form-evidence handle in the document's main execution context.
    // Resolve all handle ownership before any action so the later atomic read
    // needs no additional cross-context element resolution.
    const list = await page.evaluateHandle(() => [...document.forms]);
    const forms = [...(await list.getProperties()).values()].flatMap(value => {
      const element = value.asElement(); return element ? [element as ElementHandle<HTMLFormElement>] : [];
    });
    await list.dispose();
    const sameDocument = previous && await previous.document.evaluate(node => node === document).catch(() => false);
    const documentHandle = sameDocument ? previous.document : await page.evaluateHandle(() => document);
    const inputEvents = sameDocument ? previous.inputEvents : await page.evaluateHandle(() => {
      const events: Array<{ node: HTMLInputElement | HTMLTextAreaElement; value: string; approved?: boolean }> = [];
      document.addEventListener("input", event => {
        const node = event.target;
        if (event.isTrusted && (node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement
          && !["checkbox", "radio", "range", "button", "submit", "reset"].includes(node.type))) events.push({ node, value: node.value });
      }, true);
      return events;
    });
    if (!sameDocument) this.readInputs.delete(page);
    if (previous && previous.inputEvents !== inputEvents) {
      await previous.inputEvents.dispose().catch(() => {});
      await previous.document.dispose().catch(() => {});
      await Promise.all((this.insertions.get(page) ?? []).map(entry => entry.element.dispose().catch(() => {})));
      this.insertions.delete(page);
    }
    this.documents.set(page, { url: page.url(), document: documentHandle, forms, inputEvents });
    await Promise.all((previous?.forms ?? []).map(form => form.dispose().catch(() => {})));
  }

  async inserted(page: Page, element: ElementHandle, value: string, source: BrowserPublicInputSource): Promise<void> {
    assertPublicReadInput(value, source);
    const observed = this.documents.get(page);
    if (!observed || observed.url !== page.url()) throw new Error("Public read input document was not observed");
    await observed.inputEvents.evaluate((events, input) => {
      const event = events.at(-1);
      if (event?.node === input.element && event.value === input.value) event.approved = true;
    }, { element, value });
    this.readInputs.set(page,[...this.readInputs.get(page)??[],value]);
    const previous = this.insertions.get(page) ?? [];
    // Keep the handle until the document changes; the registry's next
    // observation disposes its own refs, so take an independent handle.
    const retained = await page.evaluateHandle(node => node, element) as ElementHandle;
    this.insertions.set(page, [...previous, { element: retained, value, source }]);
  }

  async beforeClick(page: Page, element: ElementHandle): Promise<void> {
    const retained = await page.evaluateHandle(node => node, element) as ElementHandle;
    await this.submitters.get(page)?.dispose().catch(() => {});
    this.submitters.set(page, retained);
  }

  /** Chromium reports a new-window form navigation as windowOpen, without a
   * frameRequestedNavigation reason. Inspect native form ownership/target;
   * an unobserved or ambiguous matching form receives no permission. */
  async popupSubmission(page: Page, requested: URL, windowName: string): Promise<{ evidence?: ObservedGetFormSubmission } | undefined> {
    const formTarget = await page.evaluate(({ destination, windowName }) => {
      const url = new URL(destination);
      return [...document.forms].some(form => {
        const active = document.activeElement;
        const submitter = active instanceof HTMLButtonElement || active instanceof HTMLInputElement ? active : undefined;
        const associated = submitter?.form === form ? submitter : undefined;
        const action = new URL(associated?.hasAttribute("formaction") ? associated.formAction : form.action);
        const target = associated?.hasAttribute("formtarget") ? associated.formTarget : form.target;
        return action.origin === url.origin && action.pathname === url.pathname
          && (target === "_blank" && !windowName || target === windowName && !["", "_self", "_top", "_parent"].includes(target));
      });
    }, { destination: requested.toString(), windowName }).catch(() => true);
    if (!formTarget) return undefined;
    const evidence = await this.submission(page, requested);
    return evidence ? { evidence } : {};
  }

  async submission(page: Page, requested: URL): Promise<ObservedGetFormSubmission | undefined> {
    const observed = this.documents.get(page);
    if (!observed || page.url() !== observed.url || requested.origin !== new URL(observed.url).origin) return undefined;
    // Read one atomic document snapshot. After Chromium schedules navigation,
    // a second Runtime.callFunctionOn may wait for that paused navigation. Never
    // require another browser evaluation to authorize the waiting request.
    const snapshot = await traceFormEvidence("SUBMISSION_SNAPSHOT", () => observed.document.evaluate((current, input) => {
      if (current !== document) return [];
      return input.forms.flatMap(owner => {
        if (!owner.isConnected || owner.ownerDocument !== document
          || input.events.some(event => event.node.form === owner && !event.approved)) return [];
        const actualButton = input.submitter instanceof HTMLButtonElement || input.submitter instanceof HTMLInputElement ? input.submitter : undefined;
        const button = actualButton?.form === owner ? actualButton : undefined;
        const method = button?.hasAttribute("formmethod") ? button.formMethod : owner.method;
        const action = button?.hasAttribute("formaction") ? button.formAction : owner.action;
        if (method.toLowerCase() !== "get") return [];
        const entries = [...(button && button.type === "submit" ? new FormData(owner, button) : new FormData(owner)).entries()];
        if (entries.some(([, value]) => typeof value !== "string")) return [];
        const inserted = input.insertions.flatMap(entry => {
          const node = entry.element;
          return (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) && node.isConnected
            && node.form === owner && node.value === entry.value ? [{ key: node.name, value: node.value, source: entry.source }] : [];
        });
        return [{ action, entries: entries as Array<[string, string]>, inserted }];
      });
    }, { forms: observed.forms, events: observed.inputEvents, submitter: this.submitters.get(page), insertions: this.insertions.get(page) ?? [] })).catch(() => []);
    const matches: ObservedGetFormSubmission[] = [];
    for (const facts of snapshot) {
      const action = new URL(facts.action);
      if (action.origin !== requested.origin || action.pathname !== requested.pathname || action.username || action.password) continue;
      const normalize = (entries: Iterable<[string, string]>) => JSON.stringify([...entries].map(([key, value]) => [key.replace(/\r?\n/g, "\r\n"), value.replace(/\r?\n/g, "\r\n")]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
      if (normalize(facts.entries) !== normalize(requested.searchParams.entries())) continue;
      matches.push({ documentOrigin: requested.origin, actionOrigin: action.origin, actionPathname: action.pathname,
        fields: facts.entries.map(([key, value]) => ({ key, valueSha256: createHash("sha256").update(value).digest("hex"),
          source: facts.inserted.find(entry => entry.key === key && entry.value === value)?.source ?? "PAGE" })) });
    }
    // Two indistinguishable observed forms cannot establish which one submitted.
    const receipt = matches.length === 1 ? matches[0] : undefined;
    try { formEvidence.publish({ stage: "SUBMISSION_RECEIPT", receipt: receipt ?? null, monotonicMs: performance.now() }); } catch { /* Diagnostics are not admission authority. */ }
    return receipt;
  }
}
