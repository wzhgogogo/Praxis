import type {RestaurantSearchIntent,RestaurantTaskState} from "./contracts.js";

export function outletNameKey(value:string):string {
  return value.normalize("NFKC").trim().replace(/\s+/gu," ").toLocaleLowerCase("en-US");
}
export function namedOutletWithoutArea(intent:{target?:RestaurantSearchIntent["target"];area?:unknown}|undefined):boolean {
  return Boolean(intent&&!intent.area&&intent.target?.selectionScope==="SPECIFIC_OUTLET"&&intent.target.query.trim());
}
/** This binds the user's name to a candidate, never replaces source identity. */
export function namedOutletCandidateResolved(state:Pick<RestaurantTaskState,"intentDraft"|"readEvidence">,candidateId:string):boolean {
  const target=state.intentDraft?.target;
  if(target?.selectionScope!=="SPECIFIC_OUTLET")return true;
  if(!namedOutletWithoutArea(state.intentDraft))return !state.readEvidence.some(e=>e.kind==="DISCOVERY"&&e.candidateId===candidateId
    &&e.claims.namedOutletStatus==="AMBIGUOUS"&&typeof e.claims.requestedOutletName==="string"&&outletNameKey(e.claims.requestedOutletName)===outletNameKey(target.query));
  return state.readEvidence.some(e=>e.kind==="DISCOVERY"&&e.candidateId===candidateId
    &&e.claims.locationBasis==="NAMED_OUTLET_RESOLUTION"&&e.claims.namedOutletStatus==="UNIQUE"
    &&typeof e.claims.requestedOutletName==="string"&&outletNameKey(e.claims.requestedOutletName)===outletNameKey(target.query));
}
