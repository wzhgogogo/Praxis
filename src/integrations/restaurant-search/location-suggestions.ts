import type {BrowserReadActionTarget,BrowserReadGoal} from "../../infrastructure/browser/browser-action-decision.js";

const key=(text:string)=>text.normalize("NFKC").toLocaleLowerCase("en-US").trim().replace(/\s+/gu," ");
const placeName=(text:string)=>key(text).replace(/\s*(?:\bsta\.?|\bstation|駅)\s*$/iu,"").trim();

/** Public words, accessible group labels and explicit station suffixes only.
 * Unknown icon/class conventions never establish a place or a translation. */
export function locationSuggestionMatches(target:Pick<BrowserReadActionTarget,"label"|"controlGroupLabel">,location:NonNullable<BrowserReadGoal["location"]>):boolean {
  const group=key(target.controlGroupLabel??""),label=key(target.label);
  if(/^(?:restaurants?|restaurant names?|merchants?|店名|店舗)(?: suggestions?|候補)?$/iu.test(group)
    ||/^(?:restaurant|merchant|店名)\s*[:：]/iu.test(label))return false;
  const placeGroup=/^(?:locations?|stations?|areas?|places?|地点|場所|駅|地域)(?: suggestions?|候補)?$/iu.test(group);
  const marked=/^(?:location|station|area|地点|場所|駅)\s*[:：]|^[📍🚉]/u.test(label);
  let name=label.replace(/^(?:(?:location|station|area|地点|場所|駅)\s*[:：]\s*|[📍🚉]\s*)/u,"");
  const qualifiers=[...name.matchAll(/[([（［]([^\])）］]+)[\])）］]/gu)].map(m=>key(m[1]!));
  const regions=(location.addressComponents??[]).filter(c=>c.types.some(t=>t==="country"||t==="locality"||t.startsWith("administrative_area_level_")||t.startsWith("sublocality"))).flatMap(c=>[key(c.longText),...(c.shortText?[key(c.shortText)]:[])]);
  // An explicit foreign/unknown qualifier cannot be silently stripped.
  if(qualifiers.some(q=>!regions.includes(q)))return false;
  name=name.replace(/[([（［][^\])）］]+[\])）］]/gu,"").trim();
  const station=/(?:\bsta\.?|\bstation|駅)\s*$/iu.test(name);
  return Boolean(location.name&&(placeGroup||marked||station)&&placeName(name)===placeName(location.name));
}
