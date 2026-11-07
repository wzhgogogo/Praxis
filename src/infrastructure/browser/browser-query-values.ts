import {createHash} from "node:crypto";
import {normalizedTextKey} from "../../core/text-key.js";
import {assertPublicReadInput} from "./playwright-observed-get-forms.js";

export type BrowserQueryValueClass = "EQUALS_AUTHORITATIVE_INPUT" | "PREFIX_OF_AUTHORITATIVE_INPUT" | "NUMERIC" | "SHORT_TOKEN" | "SENSITIVE_FORMAT" | "OTHER";
export interface BrowserQueryValueObservation { queryKey: string; valueClass: BrowserQueryValueClass; }
const hash=(value:string)=>createHash("sha256").update(normalizedTextKey(value)).digest("hex");
/** Observational only: no raw query or inserted values leave this function. */
export function observeQueryValues(url:URL, authoritativeInputs:readonly string[]): BrowserQueryValueObservation[] {
 return [...url.searchParams].map(([key,value])=>{
  let valueClass:BrowserQueryValueClass;
  try { assertPublicReadInput(value,"G4_SOURCE_TERM"); }
  catch { return {queryKey:key,valueClass:"SENSITIVE_FORMAT"}; }
  const normalized=normalizedTextKey(value);
  if(authoritativeInputs.some(input=>hash(input)===hash(value)))valueClass="EQUALS_AUTHORITATIVE_INPUT";
  else if(normalized.length>0&&authoritativeInputs.some(input=>normalizedTextKey(input).startsWith(normalized)))valueClass="PREFIX_OF_AUTHORITATIVE_INPUT";
  else if(/^-?\d+(?:\.\d+)?$/.test(value))valueClass="NUMERIC";
  else if(/^[A-Za-z0-9_-]+$/.test(value))valueClass="SHORT_TOKEN";
  else valueClass="OTHER";
  return {queryKey:key,valueClass};
 });
}
