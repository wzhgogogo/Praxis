import { createHash } from "node:crypto";
import type { ElementHandle, JSHandle, Page } from "playwright-core";

import type { BrowserPublicInputSource } from "./browser-runtime.js";

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
  private readonly submitters = new WeakMap<Page, ElementHandle>();

  async observe(page: Page): Promise<void> {
    const previous = this.documents.get(page);
    const forms = await page.$$("form") as ElementHandle<HTMLFormElement>[];
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
    const previous = this.insertions.get(page) ?? [];
    // Keep the handle until the document changes; the registry's next
    // observation disposes its own refs, so take an independent handle.
    const retained = await element.evaluateHandle(node => node) as ElementHandle;
    this.insertions.set(page, [...previous, { element: retained, value, source }]);
  }

  beforeClick(page: Page, element: ElementHandle): void { this.submitters.set(page, element); }

  async submission(page: Page, requested: URL): Promise<ObservedGetFormSubmission | undefined> {
    const observed = this.documents.get(page);
    if (!observed || page.url() !== observed.url || requested.origin !== new URL(observed.url).origin
      || !await observed.document.evaluate(node => node === document).catch(() => false)) return undefined;
    const matches: ObservedGetFormSubmission[] = [];
    for (const form of observed.forms) {
      if (await observed.inputEvents.evaluate((events, owner) => events.some(event => event.node.form === owner && !event.approved), form).catch(() => true)) continue;
      const inserted: Array<{ key: string; value: string; source: BrowserPublicInputSource }> = [];
      for (const entry of this.insertions.get(page) ?? []) {
        const own = await entry.element.evaluate((node, owner) => {
          if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) || !node.isConnected || node.form !== owner) return undefined;
          return { key: node.name, value: node.value };
        }, form).catch(() => undefined);
        if (own && own.value === entry.value) inserted.push({ ...own, source: entry.source });
      }
      const submitter = this.submitters.get(page);
      const facts = await form.evaluate((owner, button) => {
        if (!owner.isConnected || owner.ownerDocument !== document) return undefined;
        const actualButton = button instanceof HTMLButtonElement || button instanceof HTMLInputElement ? button : undefined;
        const associated = actualButton?.form === owner ? actualButton : undefined;
        const method = associated?.hasAttribute("formmethod") ? associated.formMethod : owner.method;
        const action = associated?.hasAttribute("formaction") ? associated.formAction : owner.action;
        if (method.toLowerCase() !== "get") return undefined;
        const data = associated && associated.type === "submit" ? new FormData(owner, associated) : new FormData(owner);
        const entries = [...data.entries()];
        if (entries.some(([, value]) => typeof value !== "string")) return undefined;
        return { action, entries: entries as Array<[string, string]> };
      }, submitter).catch(() => undefined);
      if (!facts) continue;
      const action = new URL(facts.action);
      if (action.origin !== requested.origin || action.pathname !== requested.pathname || action.username || action.password) continue;
      // Native GET replaces an action's query. Compare the full multiset,
      // including repeated keys, empty values and unlisted/extra fields.
      const normalize = (entries: Iterable<[string, string]>) => JSON.stringify([...entries].map(([key, value]) => [key.replace(/\r?\n/g, "\r\n"), value.replace(/\r?\n/g, "\r\n")]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
      if (normalize(facts.entries) !== normalize(requested.searchParams.entries())) continue;
      matches.push({ documentOrigin: requested.origin, actionOrigin: action.origin, actionPathname: action.pathname,
        fields: facts.entries.map(([key, value]) => ({ key, valueSha256: createHash("sha256").update(value).digest("hex"),
          source: inserted.find(entry => entry.key === key && entry.value === value)?.source ?? "PAGE" })) });
    }
    // Two indistinguishable observed forms cannot establish which one submitted.
    return matches.length === 1 ? matches[0] : undefined;
  }
}
