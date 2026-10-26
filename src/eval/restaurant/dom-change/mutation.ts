import { createHash } from "node:crypto";
import type { Page } from "playwright-core";

export interface MarkerMap {
  classes: Record<string, string>;
  ids: Record<string, string>;
  dataAttributes: Record<string, string>;
  testIds: Record<string, string>;
}
export const DOM_MUTATION_RULE = "dom-marker-mutation@2";
export function opaqueMarker(seed: string, kind: string, value: string): string {
  return `g2-${createHash("sha256").update(seed + "\0" + kind + "\0" + value).digest("hex").slice(0, 16)}`;
}

/** Eval-only transform. Page scripts are disabled by the owning fixture context. */
export async function renamePrivateMarkers(page: Page, seed: string) {
  const tokens = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll("*")];
    return {
      classes: [...new Set(nodes.flatMap(node => [...node.classList]))].sort(),
      ids: [...new Set(nodes.filter(node => node.hasAttribute("id")).map(node => node.id))].sort(),
      dataAttributes: [...new Set(nodes.flatMap(node => [...node.attributes].map(a => a.name).filter(name => name.startsWith("data-"))))].sort(),
      testIds: [...new Set(nodes.filter(node => node.hasAttribute("data-testid")).map(node => node.getAttribute("data-testid")!))].sort(),
    };
  });
  const mapping: MarkerMap = {
    classes: Object.fromEntries(tokens.classes.map(value => [value, opaqueMarker(seed, "class", value)])),
    ids: Object.fromEntries(tokens.ids.map(value => [value, opaqueMarker(seed, "id", value)])),
    dataAttributes: Object.fromEntries(tokens.dataAttributes.map(value => [value, "data-" + opaqueMarker(seed, "attribute", value)])),
    testIds: Object.fromEntries(tokens.testIds.map(value => [value, opaqueMarker(seed, "testid", value)])),
  };
  const diagnostics = await page.evaluate(mapping => {
    const nodes = [...document.querySelectorAll("*")];
    const idRefs = new Set(["aria-labelledby", "aria-describedby", "aria-controls", "aria-owns", "aria-activedescendant", "aria-flowto", "aria-details", "aria-errormessage"]);
    // Object methods stay self-contained when TSX serializes this browser callback.
    const { path } = { path(element: Element): string {
      const parts: string[] = [];
      for (let node: Element | null = element; node; node = node.parentElement) {
        const parent: Element | null = node.parentElement;
        parts.unshift(node.tagName.toLowerCase() + ":" + (parent ? [...parent.children].indexOf(node) : 0));
      }
      return parts.join("/");
    } };
    const { own } = { own(map: Record<string, string>, value: string) { return Object.hasOwn(map, value) ? map[value]! : value; } };
    const { reference } = { reference(value: string) { return value ? own(mapping.ids, value) : value; } };
    const { refs } = { refs() { return nodes.flatMap(node => [...node.attributes].flatMap(attribute => {
      const values = idRefs.has(attribute.name) ? attribute.value.match(/\S+/g) ?? []
        : node.tagName.toLowerCase() === "label" && attribute.name === "for" ? [attribute.value] : [];
      return values.map((token, index) => ({ owner: path(node), attribute: attribute.name, index, token, target: document.getElementById(token) ? path(document.getElementById(token)!) : null }));
    })); } };
    const { href } = { href(value: string): string {
      const index = value.indexOf("#");
      if (index < 0) return value;
      try {
        const target = new URL(value, document.URL), current = new URL(document.URL);
        target.hash = ""; current.hash = "";
        if (!value.startsWith("#") && target.href !== current.href) return value;
        const token = decodeURIComponent(value.slice(index + 1));
        return token && Object.hasOwn(mapping.ids, token) ? value.slice(0, index + 1) + mapping.ids[token] : value;
      } catch { return value; }
    } };
    const { urlRefs } = { urlRefs(value: string) { return value.replace(/url\(\s*(["']?)#([^\s)'"]+)\1\s*\)/gi, (whole, quote: string, token: string) =>
      Object.hasOwn(mapping.ids, token) ? `url(${quote}#${mapping.ids[token]}${quote})` : whole); } };
    // CSS selectors are browser-parsed first. Rewrite marker tokens outside
    // strings; attribute-selector values require their own exact-key mapping.
    const { selector } = { selector(value: string): string {
      const candidates = [
        ...Object.entries(mapping.classes).map(([old, next]) => ["." + CSS.escape(old), "." + next]),
        ...Object.entries(mapping.ids).filter(([old]) => old.length > 0).map(([old, next]) => ["#" + CSS.escape(old), "#" + next]),
      ].sort((a, b) => b[0]!.length - a[0]!.length);
      let output = "", index = 0;
      while (index < value.length) {
        const char = value[index]!;
        if (char === "[") {
          let end = index + 1, quote = "";
          for (; end < value.length; end++) {
            const current = value[end]!;
            if (current === "\\") { end++; continue; }
            if (quote) { if (current === quote) quote = ""; }
            else if (current === "\"" || current === "'") quote = current;
            else if (current === "]") break;
          }
          let attribute = value.slice(index, end + 1);
          attribute = attribute.replace(/^(\[\s*)([\w-]+)/, (whole, prefix: string, name: string) => prefix + own(mapping.dataAttributes, name));
          attribute = attribute.replace(/^(\[\s*)([\w-]+)(\s*[~|^$*]?=\s*)(["'])(.*?)\4/, (whole, prefix: string, name: string, operator: string, quote: string, old: string) => {
            const original = Object.entries(mapping.dataAttributes).find(([, next]) => next === name)?.[0] ?? name;
            const next = original === "id" ? own(mapping.ids, old) : original === "class" ? old.replace(/\S+/g, token => own(mapping.classes, token))
              : original === "data-testid" ? own(mapping.testIds, old) : original === "href" || original === "xlink:href" ? href(old) : old;
            return prefix + name + operator + quote + next + quote;
          });
          output += attribute; index = end + 1; continue;
        }
        if (char === "\"" || char === "'") {
          const quote = char; let end = index + 1;
          for (; end < value.length; end++) { if (value[end] === "\\") end++; else if (value[end] === quote) { end++; break; } }
          output += value.slice(index, end); index = end; continue;
        }
        const token = candidates.find(([old]) => value.startsWith(old!, index) && !/[\w-]/.test(value[index + old!.length] ?? ""));
        if (token) { output += token[1]; index += token[0]!.length; }
        else {
          if (char === "#") {
            const raw = value.slice(index).match(/^#((?:\\.|[\w-])+)/)?.[1];
            if (raw) {
              const token = raw.replace(/\\([0-9a-f]{1,6})\s?|\\(.)/gi, (_whole, hex: string | undefined, escaped: string | undefined) => hex ? String.fromCodePoint(parseInt(hex, 16)) : escaped!);
              if (!document.getElementById(token)) danglingReferences.push({ owner: "inline-css", attribute: "selector", index, token, target: null });
            }
          }
          output += char; index++;
        }
      }
      return output;
    } };
    const beforeRefs = refs();
    const danglingReferences = beforeRefs.filter(reference => reference.target === null);
    const beforeText = document.body.innerText;
    const publicAttributes = nodes.flatMap(node => [...node.attributes].filter(attribute => attribute.name.startsWith("aria-") && !idRefs.has(attribute.name)
      || ["name", "value", "role"].includes(attribute.name)).map(attribute => ({ owner: path(node), name: attribute.name, value: attribute.value })));
    const links = nodes.flatMap(node => [...node.attributes].filter(attribute => attribute.localName === "href").map(attribute => ({ node, name: attribute.name, namespace: attribute.namespaceURI, before: attribute.value, after: href(attribute.value) })));
    for (const link of links) {
      if (link.before.startsWith("#")) {
        try {
          const token = decodeURIComponent(link.before.slice(1));
          if (!document.getElementById(token)) danglingReferences.push({ owner: path(link.node), attribute: link.name, index: 0, token, target: null });
        } catch { /* Invalid source fragments remain unchanged. */ }
      }
    }
    const { recordUrlRefs } = { recordUrlRefs(value: string, owner: string, attribute: string) {
      for (const match of value.matchAll(/url\(\s*(["']?)#([^\s)'"]+)\1\s*\)/gi)) {
        const token = match[2]!;
        if (!document.getElementById(token)) danglingReferences.push({ owner, attribute, index: match.index, token, target: null });
      }
    } };
    for (const node of nodes) for (const attribute of [...node.attributes]) recordUrlRefs(attribute.value, path(node), attribute.name);
    const scriptReferences: Array<{ script: number; id: string; offset: number; line: number; column: number }> = [];
    const scripts = [...document.querySelectorAll("script")].map((node, index) => {
      const text = node.textContent ?? "";
      for (const id of Object.keys(mapping.ids).filter(Boolean)) {
        let offset = 0;
        while ((offset = text.indexOf(id, offset)) >= 0) {
          if (!/[\w-]/.test(text[offset - 1] ?? "") && !/[\w-]/.test(text[offset + id.length] ?? "")) {
            const preceding = text.slice(0, offset), line = preceding.split("\n").length;
            scriptReferences.push({ script: index, id, offset, line, column: offset - preceding.lastIndexOf("\n") });
          }
          offset += id.length;
        }
      }
      return text;
    });
    const { rewriteRules } = { rewriteRules(rules: CSSRuleList) {
      for (const rule of [...rules]) {
        if ("selectorText" in rule) {
          const style = rule as CSSStyleRule; style.selectorText = selector(style.selectorText);
          for (const name of [...style.style]) {
            recordUrlRefs(style.style.getPropertyValue(name), "inline-css", name);
            style.style.setProperty(name, urlRefs(style.style.getPropertyValue(name)), style.style.getPropertyPriority(name));
          }
        }
        if ("cssRules" in rule) rewriteRules((rule as CSSGroupingRule).cssRules);
      }
    } };
    const stylesheetErrors: string[] = [];
    for (const style of document.querySelectorAll("style")) {
      try { if (style.sheet) { rewriteRules(style.sheet.cssRules); style.textContent = [...style.sheet.cssRules].map(rule => rule.cssText).join("\n"); } }
      catch (error) { stylesheetErrors.push(String(error)); }
    }
    for (const node of nodes) {
      if (node.hasAttribute("class")) node.setAttribute("class", [...node.classList].map(value => own(mapping.classes, value)).join(" "));
      if (node.hasAttribute("id")) node.id = own(mapping.ids, node.id);
      for (const attribute of [...node.attributes]) {
        if (idRefs.has(attribute.name)) node.setAttribute(attribute.name, attribute.value.replace(/\S+/g, token => reference(token)));
        else if (node.tagName.toLowerCase() === "label" && attribute.name === "for") node.setAttribute("for", reference(attribute.value));
        else if (attribute.name.startsWith("data-")) {
          node.removeAttribute(attribute.name);
          node.setAttribute(own(mapping.dataAttributes, attribute.name), attribute.name === "data-testid" ? own(mapping.testIds, attribute.value) : attribute.value);
        } else if (/url\(\s*["']?#/i.test(attribute.value)) node.setAttribute(attribute.name, urlRefs(attribute.value));
      }
    }
    for (const link of links) {
      if (link.namespace) link.node.setAttributeNS(link.namespace, link.name, link.after);
      else link.node.setAttribute(link.name, link.after);
    }
    const afterRefs = refs();
    const referenceMismatches = beforeRefs.filter((before, index) => {
      const after = afterRefs[index]; return !after || before.owner !== after.owner || before.attribute !== after.attribute || before.index !== after.index
        || before.target !== after.target || after.token !== reference(before.token);
    });
    const publicAttributeMismatches = publicAttributes.filter(record => {
      const node = nodes.find(node => path(node) === record.owner); return node?.getAttribute(record.name) !== record.value;
    });
    const hrefMismatches = links.filter(link => link.node.getAttribute(link.name) !== link.after).map(link => ({ owner: path(link.node), name: link.name }));
    const scriptMismatches = scripts.map((text, index) => index).filter(index => scripts[index] !== document.querySelectorAll("script")[index]?.textContent);
    return {
      inlineScriptsExecuted: false, scriptReferences, danglingReferences, references: beforeRefs.map((before, index) => ({ before, after: afterRefs[index] })),
      integrity: { valid: beforeText === document.body.innerText && beforeRefs.length === afterRefs.length && !referenceMismatches.length && !publicAttributeMismatches.length && !hrefMismatches.length && !scriptMismatches.length && !stylesheetErrors.length,
        visibleTextPreserved: beforeText === document.body.innerText, referenceMismatches, publicAttributeMismatches, hrefMismatches, scriptMismatches, stylesheetErrors },
    };
  }, mapping);
  return { rule: DOM_MUTATION_RULE, seed, mapping, ...diagnostics };
}
