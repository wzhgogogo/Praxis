import type { BrowserSkillReadInput } from "../../infrastructure/browser/browser-task-executor.js";

/** Observed 2026-09-16: the public Budget dialog stages two rc-slider endpoints;
 * Update writes budget_dinner_avg_min/max to the public search URL.
 * Cuisine check/uncheck was also observed to add/remove cuisines[]=sushi.
 * This is not a grant for other dialogs, arbitrary GET forms, consent, or reservation pages.
 */
export const permitsTableCheckQueryControl: NonNullable<BrowserSkillReadInput["permitQueryControl"]> = ({ control, snapshot, action }) => {
  let url: URL;
  try { url = new URL(snapshot.url); } catch { return false; }
  if (url.origin !== "https://www.tablecheck.com" || url.pathname !== "/en/japan/search") return false;
  const structure = control.structure;
  if (!structure || !["Budget", "Cuisine"].includes(structure.dialogLabel) || structure.formClass !== "Form_f1pf9bb6") return false;
  if (control.disabled || !control.visible || control.blockedByActiveLayer) return false;
  if (action === "SET_CHECKED") return structure.dialogLabel === "Cuisine" && structure.tag === "INPUT"
    && structure.name === "cuisines" && structure.classes.includes("checkbox") && control.type === "checkbox" && control.kind === "CHECKBOX";
  if (action === "ADJUST_RANGE") return structure.dialogLabel === "Budget" && structure.sliderCount === 2 && control.kind === "RANGE" && structure.tag === "DIV"
    && control.min === "0" && control.max === "15" && structure.classes.includes("rc-slider-handle")
    && (structure.classes.includes("rc-slider-handle-1") || structure.classes.includes("rc-slider-handle-2"));
  return action === "CLICK" && control.kind === "BUTTON" && structure.tag === "BUTTON"
    && control.type === "submit" && control.label === "Update";
};

/** A source-owned availability category can be read only after its radio state is re-observed. */
export const permitsTableCheckAvailabilityServiceCategory: NonNullable<BrowserSkillReadInput["permitQueryControl"]> = ({ control, snapshot, action }) => {
  if (action !== "SET_CHECKED") return false;
  let url: URL;
  try { url = new URL(snapshot.url); } catch { return false; }
  if (url.origin !== "https://www.tablecheck.com") return false;
  const structure = control.structure;
  if (!structure || control.kind !== "RADIO" || control.type !== "radio" || structure.tag !== "INPUT"
    || control.disabled || !control.visible || control.blockedByActiveLayer) return false;
  // This exact observed reservation-query shape excludes radios in account,
  // consent, checkout, and booking-commit flows. HTTP method is deliberately
  // not a safety signal: the public query form observed in the source is POST.
  if (!/^\/(?:en|ja)\/(?:shops\/)?[^/]+\/reserve(?:\/landing)?\/?$/i.test(url.pathname)) return false;
  return structure.name === "reservation[service_category]"
    && /(?:^|\s)reserveform(?:\s|$)/i.test(structure.formClass);
};
