import { createHash } from "node:crypto";
import type { RestaurantCaseView } from "../../../../application/agent-workspace.js";
import type { BrowserSnapshot } from "../../../../infrastructure/browser/browser-runtime.js";
import type { G6EvaluationInput,G6OraclePage } from "./evaluator.js";

export interface ObservedGoogleIdentity {ref:string;bodySHA256:string;name:string;address?:string;phone?:string;websiteUrl?:string;}
type Frame={page:BrowserSnapshot;at:string;ref?:string};
const object=(v:unknown):Record<string,unknown>|undefined=>v!==null&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:undefined;
const phone=(v:string|undefined)=>v?.replace(/\D/gu,"").replace(/^81/u,"0");
const sha=(v:string)=>createHash("sha256").update(v).digest("hex");

/** Independent raw public JSON projection. No production entityMatch or eligibility. */
export function observedGoogleIdentities(body:string,ref:string):ObservedGoogleIdentity[]{
  let value:Record<string,unknown>|undefined;try{value=object(JSON.parse(body));}catch{return [];}
  return (Array.isArray(value?.places)?value.places:[value]).flatMap(v=>{
    const p=object(v),name=object(p?.displayName)?.text;
    if(typeof name!=="string"||!p)return [];
    return [{ref,bodySHA256:sha(body),name,...(typeof p.websiteUri==="string"?{websiteUrl:p.websiteUri}:{}),...(typeof p.formattedAddress==="string"?{address:p.formattedAddress}:{}),...(typeof p.nationalPhoneNumber==="string"?{phone:p.nationalPhoneNumber}:{})}];
  });
}

function jsonLDIdentity(page:BrowserSnapshot){
  const found:Array<{name:string;phone?:string;address?:string}>=[];
  for(const script of page.html.matchAll(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/giu)){
    try{
      const queue:unknown[]=[JSON.parse(script[1]!)];while(queue.length){const v=queue.pop();if(Array.isArray(v)){queue.push(...v);continue;}const p=object(v);if(!p)continue;
        if(Array.isArray(p["@graph"]))queue.push(...p["@graph"]);
        if(p["@type"]!=="Restaurant"||typeof p.name!=="string")continue;
        const a=object(p.address),address=typeof p.address==="string"?p.address:a?[a.streetAddress,a.addressLocality,a.addressRegion,a.postalCode].filter(v=>typeof v==="string").join(" "):undefined;
        found.push({name:p.name,...(typeof p.telephone==="string"?{phone:p.telephone}:{}),...(address?{address}:{})});
      }
    }catch{/* A malformed source identity never becomes a match. */}
  }return found;
}

/** The quotes are claims to check. All identity/text inputs come from this run's
 * source I/O; the product's HIGH match, judgement and eligible flags are ignored. */
export function observedQualificationEvidence(view:RestaurantCaseView,runId:string,frames:readonly Frame[],google:readonly ObservedGoogleIdentity[]):{pages:G6OraclePage[];claims:NonNullable<G6EvaluationInput["qualificationClaims"]>}{
  const pages:G6OraclePage[]=[],claims:NonNullable<G6EvaluationInput["qualificationClaims"]>=[];
  for(const candidateId of view.restaurant.presentedCandidateIds??[]){
    const candidate=view.restaurant.candidates.find(c=>c.restaurant.id===candidateId)?.restaurant;if(!candidate)continue;
    const facts=view.restaurant.currentFactEvidence.filter(e=>e.candidateId===candidateId),conditions=view.restaurant.conditionStates?.[candidateId]??[];
    const hard=conditions.filter(c=>c.strength==="HARD").flatMap(c=>c.sources),selections=hard.length?hard:facts.flatMap(e=>e.sourceFieldQuotes??[]);
    const unique=new Map(selections.map(s=>[s.sourceUrl+"\0"+s.quote,s]));
    // With no HARD/category assertion, the displayed merchant name itself is
    // the literal claim. It cannot establish geographic/complete qualification.
    if(!unique.size)for(const frame of frames)if(frame.page.text.includes(candidate.outletName))unique.set(frame.page.url+"\0"+candidate.outletName,{sourceUrl:frame.page.url,quote:candidate.outletName,field:"CATEGORY",meal:"UNSPECIFIED"});
    const quotes:Array<{text:string;url:string;readAt:string}>=[];
    for(const s of unique.values()){
      const matches=frames.map((f,index)=>({...f,index})).filter(f=>f.page.url===s.sourceUrl);if(!matches.length)continue;
      const frame=matches.find(f=>f.page.text.includes(s.quote))??matches.at(-1)!;
      const alias=google.find(i=>i.name===candidate.outletName&&Boolean(i.phone&&phone(i.phone)===phone(candidate.sourceIds.phone)||i.address&&i.address===candidate.address));
      const sourceIdentities=jsonLDIdentity(frame.page);
      const direct=sourceIdentities.find(i=>Boolean(i.phone&&phone(i.phone)===phone(candidate.sourceIds.phone)||i.address&&i.address===candidate.address)&&(i.name===candidate.outletName||Boolean(alias&&i.phone&&phone(i.phone)===phone(alias.phone))));
      const listing=google.find(i=>i.websiteUrl===s.sourceUrl&&i.name===candidate.outletName&&Boolean(i.phone&&phone(i.phone)===phone(candidate.sourceIds.phone)||i.address&&i.address===candidate.address));
      const other=sourceIdentities.find(i=>i.name!==candidate.outletName&&i.phone&&phone(i.phone)!==phone(candidate.sourceIds.phone)&&google.some(g=>g.name===i.name&&phone(g.phone)===phone(i.phone)));
      const identity=direct?(direct.name!==candidate.outletName&&alias?alias:direct):other??(sourceIdentities.length?undefined:listing);
      // Keep an unmatched captured page as unmatched evidence so a wrong-shop
      // quote is rejected, rather than disappearing as a recording omission.
      // Persist only the claimed public excerpt plus hashes. Do not create a
      // second unrestricted full-page recorder or bypass its sanitization.
      const merchantText=frame.page.text.includes(s.quote)?s.quote:"";
      const bridge=direct&&direct.name!==candidate.outletName?alias:other?google.find(g=>g.name===other.name&&phone(g.phone)===phone(other.phone)):!sourceIdentities.length?listing:undefined;
      const ref=`${frame.ref??`source-snapshot:${frame.index+1}`}:html-sha256:${sha(frame.page.html)}:text-sha256:${sha(frame.page.text)}`+(bridge?`:identity:${bridge.ref}:${bridge.bodySHA256}`:"");
      pages.push({ref,url:frame.page.url,runId,candidateId,readAt:frame.at,merchantText,merchantScope:"EXCERPTS",name:identity?.name??"UNBOUND_SOURCE_IDENTITY",...(identity?.address?{address:identity.address}:{}),...(identity?.phone?{phone:identity.phone}:{}),observedLinks:[]});
      quotes.push({text:s.quote,url:s.sourceUrl,readAt:frame.at});
    }
    claims.push({candidateId,quotes});
  }return {pages,claims};
}
