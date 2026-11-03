import type {RestaurantSearchIntent,RestaurantTaskState,RestaurantReadEvidence} from "./contracts.js";

export function outletNameKey(value:string):string {
  return value.normalize("NFKC").trim().replace(/\s+/gu," ").toLocaleLowerCase("en-US");
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

/** Cuisine/branch spelling is explicit. Everything else needs literal address support. */
export function namedOutletContainment(query:string,sourceName:string,address:string,localities:readonly string[]=[]):boolean {
  const a=outletNameKey(query),b=outletNameKey(sourceName);
  const [full,part]=outletNameContains(a,b)?[a,b]:outletNameContains(b,a)?[b,a]:[];
  if(!full||!part)return false;
  const at=full.indexOf(part),extra=(full.slice(0,at)+" "+full.slice(at+part.length)).trim();
  const remaining=extra.replace(/(?:\bkushi\s+katsu\b|\bkushikatsu\b|\bsushi\b|\bten\b|\bhonten\b|串カツ|寿司|本店|店)/gu," ");
  const location=outletNameKey(address);
  return remaining.split(/\s+/u).filter(Boolean).every(term=>outletNameContains(location,term)
    &&localities.some(value=>outletNameContains(value,term)));
}

function lookup(state:NamedState,candidateId:string){
  const query=state.intentDraft?.target?.query??"";
  return state.readEvidence.find(e=>e.kind==="DISCOVERY"&&e.candidateId===candidateId
    &&typeof e.claims.requestedOutletName==="string"&&outletNameKey(e.claims.requestedOutletName)===outletNameKey(query));
}

function boundNames(state:NamedState,candidateId:string):string[] {
  const candidate=state.candidates.find(c=>c.restaurant.id===candidateId);
  const evidence=state.readEvidence.filter(e=>e.candidateId===candidateId);
  const identity=evidence.filter(native);
  if(!identity.length)return [];
  const names=[candidate?.restaurant.outletName??""];
  for(const e of evidence){
    // Google Japanese name uses the original Place ID, never a translation.
    if(e.kind==="ENTITY_MATCH"&&e.provider==="GOOGLE_PLACES"&&e.entityMatch?.confidence==="HIGH"
      &&e.sourceEntityId===candidate?.restaurant.sourceIds.googlePlaces&&typeof e.claims.outletName==="string")names.push(e.claims.outletName);
    if(native(e)&&typeof e.claims.observedOutletName==="string")names.push(e.claims.observedOutletName);
    // G1 already binds its actual en/ja page name to this same-source identity.
    if(native(e)&&e.claims.observationKind==="PUBLIC_PAGE"&&typeof e.claims.outletName==="string")names.push(e.claims.outletName);
    for(const q of e.sourceFieldQuotes??[])if(q.field==="NAME"&&identity.some(i=>i.provider===e.provider
      &&i.sourceEntityId===e.sourceEntityId&&i.sourceUrl===q.sourceUrl&&e.sourceUrl===q.sourceUrl))names.push(q.quote);
  }
  return names.filter(Boolean);
}

/** A single possible reference can be investigated read-only; it is not yet a selection. */
export function namedOutletCandidateCanInvestigate(state:NamedState,candidateId:string):boolean {
  const candidate=state.candidates.find(c=>c.restaurant.id===candidateId),record=lookup(state,candidateId);
  if(!candidate||!record||state.candidates.length!==1||record.claims.namedOutletCandidateCount!==1
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
  if(!record)return !namedOutletWithoutArea(state.intentDraft);
  if(record.claims.namedOutletStatus==="UNIQUE")return true;
  if(record.claims.namedOutletSearchComplete!==true)return false;
  const exact=state.candidates.filter(c=>boundNames(state,c.restaurant.id).some(value=>outletNameKey(value)===outletNameKey(target.query)));
  if(exact.length)return exact.length===1&&exact[0]!.restaurant.id===candidateId;
  if(state.candidates.length!==1||record.claims.namedOutletCandidateCount!==1)return false;
  const names=boundNames(state,candidateId);
  if(!names.length)return false;
  const candidate=state.candidates[0]!.restaurant;
  const localities=record.claims.namedOutletLocalities;
  return namedOutletContainment(target.query,candidate.outletName,candidate.address,Array.isArray(localities)?localities:[]);
}
