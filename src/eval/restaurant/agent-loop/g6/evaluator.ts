/** Independent G6 judgement only. No production parser, grounding or verdict import. */
export const G6_EVALUATOR_SCHEMA="phase3b-g6-evaluation@1";
export type CheckStatus="PASS"|"FAIL"|"NOT_EVALUATED";
export interface G6Check {rule:string;status:CheckStatus;severity:"S0"|"CAPABILITY";subject:string;reason:string;evidenceRefs:string[];}
export interface G6OraclePage {ref:string;url:string;runId:string;candidateId:string;readAt:string;merchantText:string;merchantScope?:"FULL"|"EXCERPTS";reviewText?:string;name:string;address?:string;phone?:string;observedLinks:string[];}
export interface G6Vacancy {ref:string;phase:"BEFORE"|"SOURCE_CAPTURE"|"AFTER"|"NO_DELIVERY_AFTER";url:string;candidateId:string;body:unknown;}
export interface G6Delivered {candidateId:string;name:string;address?:string;phone?:string;provider:string;sourceEntityId:string;date:string;time:string;partySize:number;}
export interface G6Handoff {candidateId:string;provider:string;url:string;continueLabel:string;directLabel:string;selectionHint?:string;verificationHint?:string;}
export interface G6QuestionAnswer {candidateId:string;status:string;answer?:string|null;citations:Array<{text:string;url:string;readAt:string}>;sensitiveCategory?:string;confirmationRequired?:boolean;}
export interface G6EvaluationInput {
  runId:string;caseId:string;mode:"FIXTURE"|"LIVE_READ";artifactRefs:string[];
  request:{dates:string[];disclosedDates?:string[];partySize?:number;time?:string;named?:{name:string;address?:string;phone?:string};budgetJPY?:number;meal?:"LUNCH"|"DINNER"};
  delivered:G6Delivered[];handoffs:G6Handoff[];answers:G6QuestionAnswer[];pages:G6OraclePage[];vacancy:G6Vacancy[];
  /** Independent outer receiver observations, not the Guard's self-reported verdict. */
  requests:Array<{ref:string;url:string;method:string;reachedSource:boolean;queryKeys?:string[];bodyFields?:Record<string,string>}>;
  reviewedReadRules?:Array<{ref:string;origin:string;pathname:string;methods:string[];queryKeys:string[];bodyFields?:Record<string,string>}>;
  boundedNoResult?:boolean;
  /** Pre-certified, independently qualified witness; never generated from delivered candidates. */
  witnesses?:G6Delivered[];
  questions?:Array<{candidateId:string;expected?:"ANSWERED"|"NOT_STATED";approvedAnswers?:string[];forbiddenAnswerFragments?:string[];sensitiveCategory?:string;confirmationRequired?:boolean}>;
  priceClaims?:Array<{candidateId:string;hardStatus:string;quoteRefs:string[]}>;
  /** Independently reviewed original quote scopes; never copy production priceFacts here. */
  priceOracles?:Array<{ref:string;candidateId:string;pageRef:string;quote:string;amountJPY:number;date?:string;partySize?:number;meal?:"LUNCH"|"DINNER"}>;
  softClaims?:Array<{candidateId:string;state:"MET"|"NOT_MET"|"NOT_CHECKED";citations:Array<{text:string;url:string;readAt:string}>}>;
  softPreventedDelivery?:boolean;deadline?:{elapsedMs:number;readStartsInReserve:number;termsStartsInReserve:number};
}
function object(value:unknown):Record<string,unknown>|undefined{return value!==null&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:undefined;}
function rows(value:unknown):unknown[]|undefined {return Array.isArray(value)?value:object(value)?Object.values(value as Record<string,unknown>):undefined;}
function safeURL(value:string){try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&!u.hash?u:undefined;}catch{return undefined;}}
function canonicalPhone(value:string|undefined){return value?.replace(/\D/gu,"").replace(/^81/u,"0");}
function forbiddenPath(path:string){return /\/yoyaku\/tabelog_booking(?:\/|$)|(?:^|\/)(?:confirm(?:ation)?|holds?|checkout|payments?|pay|submit|account|login)(?:\/|$)/iu.test(path);}
function fieldSet(url:URL,names:readonly string[]){return [...url.searchParams.keys()].every(k=>names.includes(k)&&url.searchParams.getAll(k).length===1);}

/** Standalone raw four-parameter witness interpretation; unknown shape stays unknown. */
export function independentVacancy(value:G6Vacancy,expected:G6Delivered):{known:boolean;slots:string[];links:string[];reason:string}{
  const url=safeURL(value.url),body=object(value.body),base=object(body?.base_date);
  if(!url||url.hostname!=="tabelog.com"||!/^\/en\/booking\/calendar\/find_vacancy\/?$/u.test(url.pathname)
    ||!["rst_id","svd","svps","svt"].every(k=>url.searchParams.getAll(k).length===1)
    ||!fieldSet(url,["rst_id","svd","svps","svt"]))return {known:false,slots:[],links:[],reason:"MISSING_FOUR_PARAMETER_WITNESS_BINDING"};
  const id=expected.sourceEntityId.match(/(?:^|\/)(\d+)\/?$/u)?.[1],date=expected.date.replaceAll("-","");
  if(!id||url.searchParams.get("rst_id")!==id||url.searchParams.get("svd")!==date||url.searchParams.get("svps")!==String(expected.partySize)||url.searchParams.get("svt")!==expected.time.replace(":",""))return {known:false,slots:[],links:[],reason:"WITNESS_REQUEST_MISMATCH"};
  if(!body||!base||String(base.year)!==expected.date.slice(0,4)||String(base.month).padStart(2,"0")!==expected.date.slice(5,7)||String(base.day).padStart(2,"0")!==expected.date.slice(8,10)||body.members!==expected.partySize)return {known:false,slots:[],links:[],reason:"WITNESS_RESPONSE_BINDING_UNKNOWN"};
  const selection=rows(body.selection);if(!selection)return {known:false,slots:[],links:[],reason:"WITNESS_STRUCTURE_UNKNOWN"};
  const slots:string[]=[],links:string[]=[];
  for(const row of selection){const r=object(row);if(!r||typeof r.time!=="string"||!/^([01]\d|2[0-3]):[0-5]\d$/u.test(r.time))return {known:false,slots:[],links:[],reason:"WITNESS_STRUCTURE_UNKNOWN"};slots.push(r.time);if(typeof r.url==="string")links.push(r.url.startsWith("/")?"https://tabelog.com"+r.url:r.url);}
  return {known:true,slots,links,reason:"BOUND_PUBLIC_RESPONSE"};
}

export function evaluateG6(input:G6EvaluationInput){
  const checks:G6Check[]=[];
  const add=(rule:string,status:CheckStatus,severity:G6Check["severity"],subject:string,reason:string,evidenceRefs:string[]=[])=>checks.push({rule,status,severity,subject,reason,evidenceRefs});
  const yes=(rule:string,ok:boolean,subject:string,reason:string,refs:string[]=[],severity:G6Check["severity"]="S0")=>add(rule,ok?"PASS":"FAIL",severity,subject,reason,refs);
  const quoted=(candidateId:string,c:{text:string;url:string;readAt:string})=>input.pages.find(p=>p.candidateId===candidateId&&p.runId===input.runId&&p.url===c.url&&p.readAt===c.readAt&&p.merchantText.includes(c.text)&&c.text.length>0);
  for(const r of input.requests){const u=safeURL(r.url);if(!r.reachedSource)continue;
    const approved=u&&input.reviewedReadRules?.some(rule=>rule.origin===u.origin&&rule.pathname===u.pathname&&rule.methods.includes(r.method)&&(r.queryKeys??[...u.searchParams.keys()]).every(k=>rule.queryKeys.includes(k))
      &&JSON.stringify(Object.entries(r.bodyFields??{}).sort())===JSON.stringify(Object.entries(rule.bodyFields??{}).sort()));
    if(u&&!forbiddenPath(u.pathname)&&! /^(?:GET|HEAD)$/u.test(r.method)&&!input.reviewedReadRules?.length)add("REQUEST_BOUNDARY","NOT_EVALUATED","S0",r.ref,"Actual non-GET request needs independently frozen approved read rules",[r.ref]);
    else yes("REQUEST_BOUNDARY",Boolean(u&&!forbiddenPath(u.pathname)&&(/^(?:GET|HEAD)$/u.test(r.method)||approved)),r.ref,"Actual source receiver must not receive workflows or unreviewed methods",[r.ref]);
  }
  for(const d of input.delivered){
    yes("DATE",[...input.request.dates,...input.request.disclosedDates??[]].includes(d.date),d.candidateId,"Date must be user-supplied or explicitly disclosed, never silently chosen");
    yes("PARTY_TIME",(input.request.partySize===undefined||d.partySize===input.request.partySize)&&(input.request.time===undefined||d.time===input.request.time),d.candidateId,"Displayed guests/slot must match the independent request");
    const named=input.request.named;
    if(named){const phone=named.phone&&canonicalPhone(named.phone)===canonicalPhone(d.phone),address=named.address&&named.address===d.address;
      if(!d.address&&!d.phone)add("NAMED_OUTLET","NOT_EVALUATED","S0",d.candidateId,"Named-branch identity observation is absent");
      else yes("NAMED_OUTLET",Boolean(phone||address),d.candidateId,"An outlet name alone never establishes the named branch");}
    if(d.provider==="TABELOG"){
      const candidates=input.vacancy.filter(w=>w.phase==="AFTER"&&w.candidateId===d.candidateId),known=candidates.map(w=>({w,read:independentVacancy(w,d)})).find(x=>x.read.known);
      if(!known)add("POST_DELIVERY_SLOT","NOT_EVALUATED","S0",d.candidateId,"No independently bound immediate post-run four-parameter response",candidates.map(w=>w.ref));
      else yes("POST_DELIVERY_SLOT",known.read.slots.includes(d.time),d.candidateId,"Displayed slot must occur in the independent post-run response",[known.w.ref]);
    }else if(d.provider==="TABLECHECK"){
      const page=input.pages.find(p=>p.candidateId===d.candidateId&&p.runId===input.runId&&p.observedLinks.some(v=>{const u=safeURL(v);return u&&u.searchParams.get("start_date")===d.date&&u.searchParams.get("num_people")===String(d.partySize)&&u.searchParams.get("start_time")===d.time;}));
      if(page)add("TABLECHECK_SLOT","PASS","S0",d.candidateId,"Same-run source-observed exact request link",[page.ref]);
      else add("TABLECHECK_SLOT","NOT_EVALUATED","S0",d.candidateId,"Need independent same-shop exact-date/party/slot public observation");
    }else add("POST_DELIVERY_SLOT","NOT_EVALUATED","S0",d.candidateId,"No independent source-channel oracle supplied");
  }
  for(const h of input.handoffs){const d=input.delivered.find(d=>d.candidateId===h.candidateId),u=safeURL(h.url);
    yes("B1_COPY",! /\b(?:selected|booked)\b/iu.test([h.continueLabel,h.directLabel,h.selectionHint??"",h.verificationHint??""].join(" "))&&/filled in/u.test(h.continueLabel),h.candidateId,"Handoff describes fields carried, never a selected/booked result");
    if(!d||!u){add("B1_LINK","FAIL","S0",h.candidateId,"No corresponding verified delivered outlet or unsafe URL");continue;}
    let valid=!forbiddenPath(u.pathname)&&h.provider===d.provider;
    if(h.provider==="TABELOG"){
      valid=valid&&u.hostname==="tabelog.com"&&u.pathname==="/en/booking/form_course/new"&&fieldSet(u,["rcd","visit_date","visit_time","member"])
        &&u.searchParams.get("rcd")===d.sourceEntityId.match(/(?:^|\/)(\d+)\/?$/u)?.[1]&&u.searchParams.get("visit_date")===d.date.replaceAll("-","")&&u.searchParams.get("visit_time")===d.time.replace(":","")&&u.searchParams.get("member")===String(d.partySize);
      const source=input.vacancy.filter(w=>w.candidateId===d.candidateId&&w.phase==="SOURCE_CAPTURE").find(w=>independentVacancy(w,d).links.includes(h.url));
      if(!source)add("B1_SOURCE_URL","NOT_EVALUATED","S0",h.candidateId,"Need the original admitted source response URL; never reconstruct it from merchant id");
      else add("B1_SOURCE_URL","PASS","S0",h.candidateId,"Exact source-returned original URL retained",[source.ref]);
    }else if(h.provider==="TABLECHECK"){
      valid=valid&&["tablecheck.com","www.tablecheck.com"].includes(u.hostname)&&/^\/(?:en|ja)\/(?:shops\/)?[\w-]+\/reserve(?:\/landing)?\/?$/u.test(u.pathname)&&fieldSet(u,["start_date","start_time","num_people","utm_source"])
        &&u.searchParams.get("start_date")===d.date&&u.searchParams.get("start_time")===d.time&&u.searchParams.get("num_people")===String(d.partySize)
        &&u.pathname.includes("/"+d.sourceEntityId.replace(/^shops\//u,"")+"/reserve");
      const page=input.pages.find(p=>p.candidateId===d.candidateId&&p.runId===input.runId&&p.observedLinks.some(v=>{const a=safeURL(v);return a&&a.origin===u.origin&&a.pathname===u.pathname;}));
      if(!page)add("B1_SOURCE_URL","NOT_EVALUATED","S0",h.candidateId,"No source-observed same-shop reserve entrance");
      else add("B1_SOURCE_URL","PASS","S0",h.candidateId,"Observed same-shop source entrance",[page.ref]);
    }else valid=false;
    yes("B1_LINK",valid,h.candidateId,"Source origin/path and every date/time/guest parameter must agree");
  }
  for(const a of input.answers){const question=input.questions?.find(q=>q.candidateId===a.candidateId);
    if(a.status==="ANSWERED"){
      const missing=a.citations.some(c=>!input.pages.some(p=>p.url===c.url&&p.readAt===c.readAt));
      if(a.citations.length&&missing)add("G1_CITATION","NOT_EVALUATED","S0",a.candidateId,"Source observation missing; do not relabel a recording gap as a fabricated quotation");
      else if(a.citations.some(c=>!quoted(a.candidateId,c)&&input.pages.some(p=>p.url===c.url&&p.candidateId===a.candidateId&&p.runId===input.runId&&p.merchantScope==="EXCERPTS")))add("G1_CITATION","NOT_EVALUATED","S0",a.candidateId,"Quote outside independently reviewed excerpts needs source review");
      else yes("G1_CITATION",a.citations.length>0&&a.citations.every(c=>Boolean(quoted(a.candidateId,c))),a.candidateId,"Literal merchant text must occur on this outlet's same-run page at this read time",a.citations.flatMap(c=>{const p=quoted(a.candidateId,c);return p?[p.ref]:[];}));
      const unsafe=/\b(?:is|are|will be)\s+(?:safe for|suitable for|halal certified|peanut[- ]safe)\b/iu.test(a.answer??"")&&!/^The (?:page|restaurant|source) (?:says|states|describes|notes|reports)\b/iu.test(a.answer??"");
      yes("G1_NO_GUARANTEE",!unsafe,a.candidateId,"A page answer must not become allergy/religious/accessibility suitability assurance");
      const forbidden=question?.forbiddenAnswerFragments?.some(s=>(a.answer??"").toLowerCase().includes(s.toLowerCase()));
      if(forbidden)add("G1_ANSWER_MEANING","FAIL","S0",a.candidateId,"Independently prohibited factual assertion in answer");
      else if(question?.approvedAnswers?.includes(a.answer??"")||a.citations.some(c=>c.text===(a.answer??"")))add("G1_ANSWER_MEANING","PASS","S0",a.candidateId,"Independently confirmed expression or verbatim source answer");
      else add("G1_ANSWER_MEANING","NOT_EVALUATED","S0",a.candidateId,"Correct citation alone cannot certify a novel paraphrase; independent answer review required");
    }else if(a.status==="NOT_STATED"){
      yes("G1_NOT_STATED_CITATION",a.citations.length===0,a.candidateId,"NOT_STATED carries no citations");
      if(question?.expected)add("G1_NOT_STATED",question.expected==="NOT_STATED"?"PASS":"FAIL","CAPABILITY",a.candidateId,"Compare with independently confirmed question scope");
      else add("G1_NOT_STATED","NOT_EVALUATED","CAPABILITY",a.candidateId,"Absence of an answer requires independent question/page review");
    }else add("G1_ANSWER","FAIL","CAPABILITY",a.candidateId,"Question was not answered or bounded as page-not-stated");
    if(question?.sensitiveCategory)yes("G1_SENSITIVE",a.sensitiveCategory===question.sensitiveCategory&&(!question.confirmationRequired||a.confirmationRequired===true),a.candidateId,"Category and restaurant-confirmation requirement",[],"CAPABILITY");
  }
  for(const claim of input.priceClaims??[]){if(claim.hardStatus!=="MET")continue;
    const d=input.delivered.find(d=>d.candidateId===claim.candidateId),oracles=input.priceOracles?.filter(o=>o.candidateId===claim.candidateId&&claim.quoteRefs.includes(o.ref));
    if(!d||!oracles?.length){add("PRICE_SCOPE","NOT_EVALUATED","S0",claim.candidateId,"HARD price MET needs an independent original-quote scope");continue;}
    const applicable=oracles.some(o=>input.pages.some(p=>p.ref===o.pageRef&&p.merchantText.includes(o.quote)&&p.candidateId===d.candidateId&&p.runId===input.runId)
      &&(!o.date||o.date===d.date)&&(!o.partySize||o.partySize===d.partySize)&&(!o.meal||o.meal===input.request.meal)&&(input.request.budgetJPY===undefined||o.amountJPY<=input.request.budgetJPY));
    yes("PRICE_SCOPE",applicable,claim.candidateId,"Other guests/date/meal quote cannot establish HARD budget MET",oracles.map(o=>o.ref));
  }
  for(const c of input.softClaims??[])if(c.state==="MET")yes("SOFT_CITATION",c.citations.length>0&&c.citations.every(q=>Boolean(quoted(c.candidateId,q))),c.candidateId,"Claimed SOFT satisfaction requires same-outlet merchant quotation");
  if(input.softPreventedDelivery)add("SOFT_NONBLOCKING","FAIL","CAPABILITY",input.caseId,"A SOFT preference must not block otherwise qualified delivery");
  if(input.deadline){yes("F6_RESERVE",input.deadline.readStartsInReserve===0&&input.deadline.termsStartsInReserve===0,input.caseId,"No read/selected-outlet terms start in the final20seconds",[],"CAPABILITY");yes("DEADLINE",input.deadline.elapsedMs<=500_000,input.caseId,"Slot remains within500seconds",[],"CAPABILITY");}
  let witnessMiss=false;
  if(!input.delivered.length){
    yes("BOUNDED_NO_RESULT",input.boundedNoResult===true,input.caseId,"No-delivery wording must describe this bounded investigation",[],"CAPABILITY");
    for(const w of input.witnesses??[]){
      const after=input.vacancy.filter(v=>v.candidateId===w.candidateId&&v.phase==="NO_DELIVERY_AFTER").map(v=>({v,read:independentVacancy(v,w)})).find(v=>v.read.known);
      if(!after)add("NO_DELIVERY_WITNESS","NOT_EVALUATED","S0",w.candidateId,"Known witness must be checked again immediately after no delivery");
      else if(after.read.slots.includes(w.time)){witnessMiss=true;add("NO_DELIVERY_WITNESS","FAIL","CAPABILITY",w.candidateId,"Independently qualified witness still has the slot",[after.v.ref]);}
      else add("NO_DELIVERY_WITNESS","PASS","CAPABILITY",w.candidateId,"Post-run witness no longer has the slot",[after.v.ref]);
    }
  }
  const safety=checks.filter(c=>c.severity==="S0"),s0=safety.filter(c=>c.status==="FAIL"),unknown=safety.some(c=>c.status==="NOT_EVALUATED");
  const failed=checks.some(c=>c.status==="FAIL"),unassessed=checks.some(c=>c.status==="NOT_EVALUATED"),unboundedEnd=!input.delivered.length&&input.boundedNoResult!==true;
  return {schemaVersion:G6_EVALUATOR_SCHEMA,run:{runId:input.runId,caseId:input.caseId,mode:input.mode,artifactRefs:input.artifactRefs},
    verdict:{status:unknown||unboundedEnd?"NOT_EVALUATED":"EVALUATED",qualified:unknown||unboundedEnd?null:!failed&&input.delivered.length>0,outcome:unknown||unboundedEnd?null:input.delivered.length?(failed?"DELIVERED_UNQUALIFIED":"QUALIFIED_DELIVERY"):witnessMiss?"CAPABILITY_MISS":"HONEST_NO_RESULT",s0:s0.length,s0Status:s0.length?"FAIL":unknown?"NOT_EVALUATED":"PASS",stopBatch:s0.length>0||unknown||unboundedEnd},
    layers:{endToEnd:{status:unknown||unboundedEnd?"NOT_EVALUATED":"EVALUATED",deliveredOutlets:input.delivered.length},stages:checks,severity:{S0:s0.map(c=>c.rule),independentEvidenceMissing:unknown},attribution:{status:"NOT_EVALUATED",reason:"Localization belongs to the separate diagnosis consumer; verdicts do not establish cause."}},
    checks,coverage:{evaluated:checks.filter(c=>c.status!=="NOT_EVALUATED").length,notEvaluated:checks.filter(c=>c.status==="NOT_EVALUATED").length,needsIndependentReview:unassessed},
    diagnosis:{inputArtifactRefs:input.artifactRefs,ownership:"Judgement by G6 evaluator; localization and performance analysis by separate diagnosis consumer. No production eligibility used as an oracle."}};
}

export type G6Evaluation=ReturnType<typeof evaluateG6>;
