import type {RestaurantSearchIntent,RestaurantTaskState,RestaurantReadEvidence,RestaurantOutlet} from "./contracts.js";

/** Transient read input reconstructed from existing authoritative Runtime events. */
export interface NamedOutletReference {
  restaurant:RestaurantOutlet;
  discovery:RestaurantReadEvidence[];
  userEventId:string;
}

export function outletNameKey(value:string):string {
  return value.normalize("NFKC").trim().replace(/\s+/gu," ").toLocaleLowerCase("en-US");
}

/** Stable provider IDs bind a prior user choice; neither names nor phone alone do. */
export function sameNamedOutletIdentity(candidate:RestaurantOutlet,reference:RestaurantOutlet,evidence:readonly RestaurantReadEvidence[]=[]):boolean {
  let matched=false;
  for(const [key,provider] of [["googlePlaces","GOOGLE_PLACES"],["tabelog","TABELOG"],["tablecheck","TABLECHECK"]] as const){
    const expected=reference.sourceIds[key];if(!expected)continue;
    const values=[candidate.sourceIds[key],...evidence.filter(e=>e.candidateId===candidate.id&&e.provider===provider&&e.kind==="ENTITY_MATCH"&&e.entityMatch?.confidence==="HIGH").map(e=>e.sourceEntityId)].filter((value):value is string=>Boolean(value));
    const canonical=(value:string)=>key==="tabelog"?value.match(/^(?:https:\/\/(?:www\.)?tabelog\.com\/)?(?:en\/)?[^/]+\/A\d+\/A\d+\/(\d+)\/?$/u)?.[1]??value:value;
    if(values.length){if(values.some(value=>canonical(value)!==canonical(expected)))return false;matched=true;}
  }
  return matched;
}
export function namedOutletWithoutArea(intent:{target?:RestaurantSearchIntent["target"];area?:unknown}|undefined):boolean {
  return Boolean(intent&&!intent.area&&intent.target?.selectionScope==="SPECIFIC_OUTLET"&&intent.target.query.trim());
}
type NamedState=Pick<RestaurantTaskState,"intentDraft"|"readEvidence"|"candidates">;
const native=(e:RestaurantReadEvidence)=>["TABELOG","TABLECHECK"].includes(e.provider)&&e.kind==="ENTITY_MATCH"&&e.entityMatch?.confidence==="HIGH";

/** Whole names, not a prefix inside another word (Sen must not match Senga). */
export function outletNameContains(full:string,part:string):boolean {
  const a=outletNameKey(full),b=outletNameKey(part),start=a.indexOf(b);
  if(!b||start<0)return false;
  const word=/[\p{Script=Latin}\p{N}]/u;
  return !(word.test(b[0]!)&&start>0&&word.test(a[start-1]!))
    &&!(word.test(b.at(-1)!)&&start+b.length<a.length&&word.test(a[start+b.length]!));
}

/** Extra words need this outlet's identity-bound source text, never a vocabulary. */
export function namedOutletContainment(query:string,sourceName:string,address:string,localities:readonly string[]=[],sourceText:readonly string[]=[]):boolean {
  const a=outletNameKey(query),b=outletNameKey(sourceName);
  const [full,part]=outletNameContains(a,b)?[a,b]:outletNameContains(b,a)?[b,a]:[];
  if(!full||!part)return false;
  const at=full.indexOf(part),extra=(full.slice(0,at)+" "+full.slice(at+part.length)).trim();
  const location=outletNameKey(address);
  return extra.split(/\s+/u).filter(Boolean).every(term=>{
    const geographic=localities.some(value=>outletNameContains(value,term));
    return geographic?outletNameContains(location,term):sourceText.some(text=>outletNameContains(text,term));
  });
}

function lookup(state:NamedState,candidateId:string){
  const query=state.intentDraft?.target?.query??"";
  return state.readEvidence.find(e=>e.kind==="DISCOVERY"&&e.candidateId===candidateId
    &&typeof e.claims.requestedOutletName==="string"&&outletNameKey(e.claims.requestedOutletName)===outletNameKey(query));
}

/** User-approved bounded identity prefix; untouched candidates remain visible as uninvestigated. */
export function namedOutletIdentityPrefix(state:NamedState):string[] {
  if(state.intentDraft?.target?.selectionScope!=="SPECIFIC_OUTLET"||state.candidates.length<2)return [];
  if(!state.candidates.every(c=>lookup(state,c.restaurant.id)?.claims.namedOutletSearchComplete===true))return [];
  return state.candidates.slice(0,3).map(c=>c.restaurant.id);
}

function knownGoogleNames(state:NamedState,candidateId:string):string[] {
  const candidate=state.candidates.find(c=>c.restaurant.id===candidateId);
  return [candidate?.restaurant.outletName??"",...state.readEvidence.filter(e=>e.candidateId===candidateId
    &&e.kind==="ENTITY_MATCH"&&e.provider==="GOOGLE_PLACES"&&e.entityMatch?.confidence==="HIGH"
    &&e.sourceEntityId===candidate?.restaurant.sourceIds.googlePlaces&&typeof e.claims.outletName==="string")
    .map(e=>e.claims.outletName as string)].filter(Boolean);
}

export function boundNames(state:NamedState,candidateId:string):string[] {
  const evidence=state.readEvidence.filter(e=>e.candidateId===candidateId);
  const identity=evidence.filter(native);
  if(!identity.length)return [];
  const names=knownGoogleNames(state,candidateId);
  for(const e of evidence){
    if(native(e)&&typeof e.claims.observedOutletName==="string")names.push(e.claims.observedOutletName);
    // G1 already binds its actual en/ja page name to this same-source identity.
    if(native(e)&&e.claims.observationKind==="PUBLIC_PAGE"&&typeof e.claims.outletName==="string")names.push(e.claims.outletName);
    for(const q of e.sourceFieldQuotes??[])if(q.field==="NAME"&&identity.some(i=>i.provider===e.provider
      &&i.sourceEntityId===e.sourceEntityId&&i.sourceUrl===q.sourceUrl&&e.sourceUrl===q.sourceUrl))names.push(q.quote);
  }
  return names.filter(Boolean);
}

function boundNameSupport(state:NamedState,candidateId:string):string[] {
  const place=state.candidates.find(c=>c.restaurant.id===candidateId)?.restaurant.sourceIds.googlePlaces;
  const identity=state.readEvidence.filter(e=>e.candidateId===candidateId&&e.kind==="ENTITY_MATCH"&&e.entityMatch?.confidence==="HIGH"
    &&e.provider!=="MODEL_JUDGMENT"&&(e.provider!=="GOOGLE_PLACES"||e.sourceEntityId===place));
  return state.readEvidence.filter(e=>e.candidateId===candidateId&&identity.some(i=>i.provider===e.provider
    &&i.sourceEntityId===e.sourceEntityId&&i.sourceUrl===e.sourceUrl)).flatMap(e=>[
    ...(native(e)&&typeof e.claims.observedOutletName==="string"?[e.claims.observedOutletName]:[]),
    ...(e.provider==="GOOGLE_PLACES"&&e.sourceEntityId===place&&typeof e.claims.outletName==="string"?[e.claims.outletName]:[]),
    ...(e.sourceFieldQuotes??[]).filter(q=>(q.field==="NAME"||q.field==="CATEGORY"||q.field==="GOOGLE_TYPE")&&q.sourceUrl===e.sourceUrl).map(q=>q.quote),
  ]);
}

/** A single possible reference can be investigated read-only; it is not yet a selection. */
export function namedOutletCandidateCanInvestigate(state:NamedState,candidateId:string):boolean {
  const candidate=state.candidates.find(c=>c.restaurant.id===candidateId),record=lookup(state,candidateId);
  const prefix=namedOutletIdentityPrefix(state);
  if(prefix.length)return prefix.includes(candidateId);
  if(!candidate||state.candidates.length!==1)return false;
  // A source port may return a single full-name candidate without lookup
  // metadata. It may be read for identity, but is not resolved or selected.
  if(!record)return Boolean(state.intentDraft?.area
    &&outletNameKey(candidate.restaurant.outletName)===outletNameKey(state.intentDraft.target!.query)
    &&state.readEvidence.some(e=>e.kind==="DISCOVERY"&&e.candidateId===candidateId));
  if(record.claims.namedOutletCandidateCount!==1
    ||record.claims.namedOutletSearchComplete!==true)return false;
  const query=state.intentDraft!.target!.query;
  return outletNameContains(query,candidate.restaurant.outletName)||outletNameContains(candidate.restaurant.outletName,query)
    ||state.readEvidence.some(e=>e.candidateId===candidateId&&e.provider==="GOOGLE_PLACES"&&e.kind==="ENTITY_MATCH"
      &&e.sourceEntityId===candidate.restaurant.sourceIds.googlePlaces&&typeof e.claims.outletName==="string"&&outletNameKey(e.claims.outletName)===outletNameKey(query));
}

/** This binds the user's name to a candidate, never replaces source identity. */
export function namedOutletCandidateResolved(state:NamedState,candidateId:string):boolean {
  const target=state.intentDraft?.target;
  if(target?.selectionScope!=="SPECIFIC_OUTLET")return true;
  const record=lookup(state,candidateId);
  if(!record){
    if(namedOutletWithoutArea(state.intentDraft))return false;
    const exact=state.candidates.filter(c=>outletNameKey(c.restaurant.outletName)===outletNameKey(target.query)
      ||boundNames(state,c.restaurant.id).some(value=>outletNameKey(value)===outletNameKey(target.query)));
    return exact.length===1&&exact[0]!.restaurant.id===candidateId
      &&state.readEvidence.some(e=>e.candidateId===candidateId&&e.kind==="ENTITY_MATCH"&&e.entityMatch?.confidence==="HIGH");
  }
  const selected=Object.fromEntries(["googlePlaces","tabelog","tablecheck"].flatMap(key=>typeof record.claims[`selectedIdentity:${key}`]==="string"?[[key,record.claims[`selectedIdentity:${key}`] as string]]:[]));
  const candidate=state.candidates.find(c=>c.restaurant.id===candidateId)?.restaurant;
  if(Object.keys(selected).length&&(!candidate||!sameNamedOutletIdentity(candidate,{...candidate,sourceIds:selected},state.readEvidence)))return false;
  if(record.claims.namedOutletStatus==="UNIQUE")return true;
  if(record.claims.namedOutletSearchComplete!==true)return false;
  const prefix=namedOutletIdentityPrefix(state);
  if(prefix.length){
    if(!prefix.includes(candidateId))return false;
    const equals=(value:string)=>outletNameKey(value)===outletNameKey(target.query);
    const exact=state.candidates.filter(c=>boundNames(state,c.restaurant.id).some(equals));
    if(exact.length!==1||exact[0]!.restaurant.id!==candidateId)return false;
    // Unknown peers need not consume more identity reads, but an exact known
    // Google name (including a same-ID Japanese name) still blocks uniqueness.
    // Include uninvestigated candidates outside the bounded prefix as well.
    return state.candidates.every(c=>state.readEvidence.some(e=>e.candidateId===c.restaurant.id&&native(e))
      ||!knownGoogleNames(state,c.restaurant.id).some(equals));
  }
  const exact=state.candidates.filter(c=>boundNames(state,c.restaurant.id).some(value=>outletNameKey(value)===outletNameKey(target.query)));
  if(exact.length)return exact.length===1&&exact[0]!.restaurant.id===candidateId;
  if(state.candidates.length!==1||record.claims.namedOutletCandidateCount!==1)return false;
  const names=boundNames(state,candidateId);
  if(!names.length)return false;
  const sole=state.candidates[0]!.restaurant;
  const localities=record.claims.namedOutletLocalities;
  return namedOutletContainment(target.query,sole.outletName,sole.address,Array.isArray(localities)?localities:[],boundNameSupport(state,candidateId));
}
