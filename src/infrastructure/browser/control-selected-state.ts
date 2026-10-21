/** Positive public DOM state only. Missing, mixed and lookalike classes stay unselected. */
export function hasSelectedControlState(attributes: Readonly<Record<string, string | null | undefined>>, hintClass?: string): boolean {
  const classes = (attributes.class ?? "").split(/\s+/);
  return ["aria-selected", "aria-pressed", "aria-checked"].some(name => attributes[name] === "true")
    || ["true", "page", "step", "location", "date", "time"].includes(attributes["aria-current"] ?? "")
    || classes.some(name => /^(?:is-)?(?:active|selected|current|checked)$/.test(name))
    || Boolean(hintClass && classes.includes(hintClass));
}
