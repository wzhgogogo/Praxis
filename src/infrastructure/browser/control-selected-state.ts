/** Public ARIA selection only; a private class is never selected-state evidence. */
export function hasSelectedControlState(attributes: Readonly<Record<string, string | null | undefined>>): boolean {
  return ["aria-selected", "aria-pressed", "aria-checked"].some(name => attributes[name] === "true")
    || ["true", "page", "step", "location", "date", "time"].includes(attributes["aria-current"] ?? "");
}
