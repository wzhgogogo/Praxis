/** Compare source text without changing its recorded original value. */
export function normalizedTextKey(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("en-US");
}
