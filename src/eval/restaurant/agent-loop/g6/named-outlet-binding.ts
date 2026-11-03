/** Evaluation references only: never change product State or select an outlet. */
export interface G6NamedOutlet {
  name:string;candidateId?:string;googlePlaceId?:string;sourceIds?:Partial<Record<"TABELOG"|"TABLECHECK",string>>;
  phone?:string;address?:string;selectionEventId?:string;
}
export interface G6NamedState {
  candidates:Array<{restaurant:{id:string;outletName:string;sourceIds:Record<string,string>;address:string}}>;
  intentDraft?:{target?:{selectionScope?:string}};
  readEvidence?:Array<{candidateId?:string;kind:string;provider:string;sourceEntityId?:string;entityMatch?:{confidence:string}}>;
}
export interface G6AuthorityEvent {
  id:string;trace:{actor:string};event:{type:string;candidateId?:string;candidateIds?:string[];userBookingSelection?:{candidateId?:string};patch?:{target?:{selectionScope?:string}}};
}
export interface G6NamedTurn {
  turnId:string;userMessage:string;before:G6NamedState;after:G6NamedState;events:G6AuthorityEvent[];
  /** Independently reviewed frozen user intent, not a model's permission. */
  alternativeConsent?:{quote:string};
}
export interface G6NamedReferences {initial:G6NamedOutlet|null;turns:G6NamedTurn[];}

export function canonicalOutletId(provider:string,value:string):string{
  if(provider==="TABELOG")return value.match(/(?:^|\/)(\d+)\/?$/u)?.[1]??value;
  if(provider==="TABLECHECK")return value.replace(/^shops\//u,"").replace(/\/$/u,"");
  return value;
}

/** A reference copied from authoritative State; never a claim of qualification. */
export function namedIdentityFromState(state:G6NamedState,candidateId:string):G6NamedOutlet|undefined{
  const r=state.candidates.find(c=>c.restaurant.id===candidateId)?.restaurant;if(!r)return;
  const ids:Partial<Record<"TABELOG"|"TABLECHECK",string>>={};
  const add=(provider:"TABELOG"|"TABLECHECK",value:string)=>{
    const id=canonicalOutletId(provider,value);if(ids[provider]&&ids[provider]!==id)throw Error("Conflicting authoritative outlet identifiers");ids[provider]=id;
  };
  for(const [provider,key]of [["TABELOG","tabelog"],["TABLECHECK","tablecheck"]]as const)if(r.sourceIds[key])add(provider,r.sourceIds[key]!);
  for(const [provider,key]of [["TABELOG","tabelogNativeDetailUri"],["TABLECHECK","tablecheckNativeGuideUri"]]as const){
    const observed=r.sourceIds[key];if(!observed)continue;
    const u=new URL(observed);
    if(provider==="TABELOG"&&u.hostname==="tabelog.com")add(provider,u.pathname);
    if(provider==="TABLECHECK"&&["tablecheck.com","www.tablecheck.com"].includes(u.hostname)){
      const slug=u.pathname.match(/^\/(?:en|ja)\/(?:shops\/)?([^/]+)(?:\/reserve(?:\/landing)?)?\/?$/u)?.[1];if(slug)add(provider,slug);
    }
  }
  for(const e of state.readEvidence??[])if(e.candidateId===candidateId&&e.kind==="ENTITY_MATCH"&&e.entityMatch?.confidence==="HIGH"&&e.sourceEntityId&&(e.provider==="TABELOG"||e.provider==="TABLECHECK"))add(e.provider,e.sourceEntityId);
  return {name:r.outletName,candidateId:r.id,...(r.sourceIds.googlePlaces?{googlePlaceId:r.sourceIds.googlePlaces.replace(/^places\//u,"")}:{}),...(Object.keys(ids).length?{sourceIds:ids}:{}),...(r.sourceIds.phone?{phone:r.sourceIds.phone}:{}),...(r.address?{address:r.address}:{})};
}

export function bindNamedOutlet(initial:G6NamedOutlet|undefined,turns:readonly G6NamedTurn[]){
  let named=initial?structuredClone(initial):undefined;
  const known=new Map<string,G6NamedOutlet>(),history:Array<{turnId:string;eventId:string;status:"BOUND"|"USER_ALLOWED_ALTERNATIVES";identity?:G6NamedOutlet}>=[];
  const presentations:Array<{eventId:string;turnId:string;named:G6NamedOutlet;candidates:G6NamedOutlet[]}>=[],issues:string[]=[];
  for(const turn of turns){
    for(const c of turn.before.candidates){const identity=namedIdentityFromState(turn.before,c.restaurant.id);if(identity)known.set(c.restaurant.id,identity);}
    const after=new Map(turn.after.candidates.flatMap(c=>{const identity=namedIdentityFromState(turn.after,c.restaurant.id);return identity?[[c.restaurant.id,identity]as const]:[];}));
    const release=turn.alternativeConsent&&turn.alternativeConsent.quote.length>0&&turn.userMessage.includes(turn.alternativeConsent.quote)&&turn.after.intentDraft?.target?.selectionScope==="OPEN_ENDED"
      ?turn.events.find(e=>e.trace.actor==="USER"&&e.event.type==="SEMANTIC_PROPOSAL_COMPILED"&&e.event.patch?.target?.selectionScope==="OPEN_ENDED")?.id:undefined;
    if(turn.alternativeConsent&&!release)issues.push(`${turn.turnId}: user alternative consent lacks matching quote/authoritative scope`);
    for(const e of turn.events){
      if(e.id===release){named=undefined;history.push({turnId:turn.turnId,eventId:e.id,status:"USER_ALLOWED_ALTERNATIVES"});continue;}
      const selected=e.trace.actor==="USER"?(e.event.type==="SEMANTIC_PROPOSAL_COMPILED"?e.event.userBookingSelection?.candidateId:e.event.type==="CANDIDATE_SELECTED"?e.event.candidateId:undefined):undefined;
      if(selected){
        const identity=known.get(selected)??after.get(selected);
        if(!identity)issues.push(`${turn.turnId}: selected candidate ${selected} absent from authoritative State`);
        else{named={...structuredClone(identity),selectionEventId:e.id};history.push({turnId:turn.turnId,eventId:e.id,status:"BOUND",identity:structuredClone(named)});}
      }
      if(e.event.type==="RESULTS_PRESENTED"&&named){
        const candidates=(e.event.candidateIds??[]).flatMap(id=>{const identity=after.get(id);if(!identity)issues.push(`${turn.turnId}: presented candidate ${id} absent from authoritative State`);return identity?[identity]:[];});
        if(candidates.length)presentations.push({eventId:e.id,turnId:turn.turnId,named:structuredClone(named),candidates});
      }
    }
    for(const [id,identity]of after)known.set(id,identity);
  }
  return {named,history,presentations,issues};
}
