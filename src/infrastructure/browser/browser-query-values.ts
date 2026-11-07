import {createHash} from "node:crypto";
import {normalizedTextKey} from "../../core/text-key.js";
import {assertPublicReadInput} from "./playwright-observed-get-forms.js";

export type BrowserQueryValueClass = "EQUALS_AUTHORITATIVE_INPUT" | "PREFIX_OF_AUTHORITATIVE_INPUT" | "NUMERIC" | "SHORT_TOKEN" | "SENSITIVE_FORMAT" | "OTHER" | "PAGE_OBSERVED_VALUE" | "NAMESPACED_TOKEN";
export interface BrowserQueryValueObservation { queryKey: string; valueClass: BrowserQueryValueClass; characterDescription?: {lengthRange:string; letters:boolean; digits:boolean; whitespace:boolean; comma:boolean; period:boolean; colon:boolean; brackets:boolean; quotes:boolean; otherPunctuation:boolean}; }
const hash=(value:string)=>createHash("sha256").update(normalizedTextKey(value)).digest("hex");
/** Observational only: no raw query or inserted values leave this function. */
export function observeQueryValues(url:URL, authoritativeInputs:readonly string[],pageValueHashes:ReadonlySet<string>=new Set()): BrowserQueryValueObservation[] {
 return [...url.searchParams].map(([key,value])=>{
  let valueClass:BrowserQueryValueClass;
  try { assertPublicReadInput(value,"G4_SOURCE_TERM"); }
  catch { return {queryKey:key,valueClass:"SENSITIVE_FORMAT"}; }
  const normalized=normalizedTextKey(value);
  if(authoritativeInputs.some(input=>hash(input)===hash(value)))valueClass="EQUALS_AUTHORITATIVE_INPUT";
  else if(normalized.length>0&&authoritativeInputs.some(input=>normalizedTextKey(input).startsWith(normalized)))valueClass="PREFIX_OF_AUTHORITATIVE_INPUT";
  else if(/^-?\d+(?:\.\d+)?$/.test(value))valueClass="NUMERIC";
  else if(/^[A-Za-z0-9_-]+$/.test(value))valueClass="SHORT_TOKEN";
  else if(key==="destination"&&value.length<=32&&/^[A-Za-z0-9]+(?::[A-Za-z0-9]+)*$/.test(value))valueClass="NAMESPACED_TOKEN";
  else valueClass="OTHER";
  if(valueClass!=="OTHER")return {queryKey:key,valueClass};
  const length=[...value].length;
  const characterDescription={lengthRange:length===0?"EMPTY":length<=16?"1_16":length<=64?"17_64":length<=256?"65_256":"OVER_256",
   letters:/\p{L}/u.test(value),digits:/\p{N}/u.test(value),whitespace:/\s/u.test(value),comma:/,/.test(value),period:/\./.test(value),colon:/:/.test(value),brackets:/[\[\]{}()]/.test(value),quotes:/["']/.test(value),otherPunctuation:/[^\p{L}\p{N}\s,.:]/u.test(value)};
  return {queryKey:key,valueClass:pageValueHashes.has(hash(value))?"PAGE_OBSERVED_VALUE":"OTHER",characterDescription};
 });
}
