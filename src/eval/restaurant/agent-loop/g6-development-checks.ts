import type { RestaurantCaseView } from "../../../application/agent-workspace.js";

export type G6DevelopmentPath = "P1" | "P2" | "P3" | "P4";
export interface G6DevelopmentRecord {
  path: G6DevelopmentPath;
  initial: RestaurantCaseView;
  after: RestaurantCaseView;
  missingParty?: RestaurantCaseView;
  sourceCalls: Array<{kind:string;method:string;url:string;turn?:string}>;
  requests: Array<{turn:string;request:{purpose:string}}>;
}
export interface G6DevelopmentOracle {
  outlet:{name:string;address:string};pageUrl:string;referenceTime:string;
  date:string;time:string;partySize:number;merchantQuote:string;
  vacancy:{body:{selection:Array<{url:string}>}};
}

/** Independent fixture-output oracle. Never reads production eligibility/status labels. */
export function checkG6Development(record:G6DevelopmentRecord, oracle:G6DevelopmentOracle) {
  const findings:Array<{code:string;detail:string}>=[];
  const require=(ok:unknown,code:string,detail:string)=>{if(!ok)findings.push({code,detail});};
  const first=record.initial.restaurant.presentedCandidateIds?.[0];
  const final=record.after;
  const selected=record.path==="P3" ? final.restaurant.presentedCandidateIds?.[0] : first;
  const outlet=final.restaurant.candidates.find(c=>c.restaurant.id===selected);
  require(outlet?.restaurant.outletName===oracle.outlet.name && outlet?.restaurant.address===oracle.outlet.address,"WRONG_OUTLET","Displayed outlet name and address must both match the independent local source.");
  require(final.case.phase==="PRESENT_RESULTS","NOT_DELIVERED","The completed development path must retain a displayed result.");
  require(final.restaurant.intentDraft?.date===oracle.date && final.restaurant.intentDraft?.partySize===oracle.partySize,"REQUEST_MISMATCH","Final date and guests must match the explicit user replies.");
  if(record.path==="P1"||record.path==="P2")require(final.restaurant.selectedCandidateId===first,"WRONG_SELECTION","Booking continuation must select the same displayed outlet.");
  const handoff=final.restaurant.bookingHandoffs?.find(h=>h.candidateId===selected);
  require(handoff?.url===oracle.vacancy.body.selection[0]?.url,"UNSUPPORTED_HANDOFF","Tabelog handoff must preserve the exact observed source URL.");
  if(handoff){
    const url=new URL(handoff.url);
    require(url.origin==="https://tabelog.com"&&url.pathname==="/en/booking/form_course/new","FORBIDDEN_HANDOFF","Only the public source-provided entrance may be emitted.");
    require(url.searchParams.get("visit_date")===oracle.date.replaceAll("-","")&&url.searchParams.get("visit_time")===oracle.time.replace(":","")&&url.searchParams.get("member")===String(oracle.partySize),"HANDOFF_REQUEST_MISMATCH","Date/time/guests must each agree.");
    require(/filled in/u.test(handoff.continueLabel)&&! /\bselected\b|\bbooked\b/iu.test(handoff.continueLabel+" "+handoff.directLabel),"FALSE_BOOKING_COPY","Copy must describe filled-in fields, not a selected or booked outcome.");
  }
  if(record.path==="P2"){
    require(!Object.keys(record.initial.restaurant.availabilityChecks).length && !(record.initial.restaurant.bookingHandoffs?.length),"RECOMMENDATION_AS_SLOT","A recommendation alone must not create a handoff.");
    require(record.missingParty?.case.phase==="NEEDS_INPUT" && record.missingParty.restaurant.intentDraft?.partySize===undefined && !record.missingParty.restaurant.bookingHandoffs?.length,"PREMATURE_HANDOFF","Missing guests must be asked before any handoff.");
  }
  if(record.path==="P3"){
    require(record.initial.restaurant.intentDraft?.date===undefined,"INVENTED_DATE","An undated request must not acquire an autonomous date.");
    require(record.initial.case.phase==="NEEDS_INPUT"&&record.initial.activities.some(a=>a.type==="AGENT_ASKED_USER"),"DATE_NOT_ASKED","The first response must ask a concrete date.");
    require(!record.sourceCalls.some(c=>c.turn==="INITIAL"),"READ_BEFORE_DATE","No source read may precede the date reply in this control.");
  }
  if(record.path==="P4"){
    const answer=final.restaurant.pageQuestion?.result;
    require(answer?.status==="ANSWERED","G1_NOT_REACHED","The literal merchant answer must be reached through page acquisition.");
    require(record.requests.some(r=>r.turn==="G1_QUESTION"&&r.request.purpose==="restaurant_page_question"),"G1_MODEL_NOT_CALLED","Actual question-model invocation must be recorded.");
    if(answer?.status==="ANSWERED"){
      require(answer.candidateId===first,"WRONG_ANSWER_OUTLET","G1 may answer only about the specified displayed outlet.");
      require(answer.citations.length===1 && answer.citations.every(c=>c.text===oracle.merchantQuote&&c.url===oracle.pageUrl&&c.readAt===oracle.referenceTime),"UNSUPPORTED_G1_CITATION","Exact same-page quotation, URL and read time are required.");
    }
  }
  require(!record.sourceCalls.some(c=>c.kind==="BROWSER_NAVIGATE"&&/form_course|yoyaku|payment|confirm|checkout/iu.test(new URL(c.url).pathname)),"WORKFLOW_REQUEST","No submission/workflow access in the source trace.");
  return {passed:findings.length===0,findings};
}
