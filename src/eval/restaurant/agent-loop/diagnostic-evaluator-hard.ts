import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import type { EvidenceRecord, RunRecord } from "./diagnostic-evaluator-record.js";
import { normalizeCriterion } from "./criterion-correspondence.js";

export interface HardSourceSnapshot {
  candidateId: string; evidenceId: string; provider: string; sourceUrl: string; observedAt: string;
  path: string; sha256: string; html: string; snapshot: number; runtimeHtmlSha256: string;
  recordingPath?: string; recordingSha256?: string;
}
export interface ReviewedHardWitness {
  candidateId: string; sourceUrl: string; criterion: string; quote: string;
  caseId: string; date: string; time: string; partySize: number; artifactSha256: string;
  path: string; sha256: string; sourceText: string; reviewedBy: "INDEPENDENT_REVIEWER";
  reviewPath: string; reviewSha256: string; reviewText: string;
  certificationPath: string; certificationSha256: string; certificationText: string;
}
export interface HardCriterionEvidence {
  artifactSha256: string; snapshots: HardSourceSnapshot[]; witnesses: ReviewedHardWitness[];
}
export type HardSupportCode = "SOURCE_TEXT_ACCEPTED" | "REVIEWED_WITNESS_ACCEPTED" | "SOURCE_TEXT_PRESENT_NOT_ACCEPTED" | "CANNOT_INDEPENDENTLY_PROVE" | "PRESENTATION_CITATION_MISSING";
export interface IndependentHardSupport {
  status: "MET" | "NOT_MET" | "NOT_CHECKED"; basis: string[]; evidenceRefs: string[];
  supportDiagnostics: Array<{ code: HardSupportCode; reason: string; refs: string[] }>;
  sourceScope?: { kind: "RESTAURANT_OFFERING"; meals: string[]; requestedCourseAvailability: "NOT_VERIFIED" };
}
interface Node { tag: string; attrs: string; start: number; end: number; parent?: Node; }
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const decode = (s: string) => s.replace(/&(?:amp|quot|apos|lt|gt|nbsp|#\d+|#x[\da-f]+);/gi, x => {
  const names: Record<string,string> = {"&amp;":"&", "&quot;":'"', "&apos;":"'", "&lt;":"<", "&gt;":">", "&nbsp;":" "};
  const n=Number(x[2]?.toLowerCase() === "x" ? "0x"+x.slice(3,-1) : x.slice(2,-1));
  return names[x.toLowerCase()] ?? (Number.isInteger(n)&&n>=0&&n<=0x10ffff?String.fromCodePoint(n):x);
});
const plain = (s: string) => decode(s.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, "").replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim();
const attr = (n: Node, name: string) => decode(n.attrs.match(new RegExp(`\\b${name}=["']([^"']*)["']`,"i"))?.[1] ?? "");
const hasClass = (n: Node, cls: string) => attr(n,"class").split(/\s+/).includes(cls);
function nodes(html: string): Node[] {
  const output: Node[] = [], stack: Node[] = [];
  for (const m of html.matchAll(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<\/?[a-z][^>]*>/gi)) {
    const token=m[0]; if (/^<!--|^<script|^<style/i.test(token)) continue;
    const close=token.match(/^<\/([\w-]+)/)?.[1]?.toLowerCase();
    if (close) { const i=stack.map(x=>x.tag).lastIndexOf(close); if(i>=0) { for(const n of stack.slice(i)) n.end=m.index+token.length; stack.length=i; } continue; }
    const tag=token.match(/^<([\w-]+)/)?.[1]?.toLowerCase(); if(!tag) continue;
    const parent=stack.at(-1); const n: Node={tag,attrs:token,start:m.index,end:m.index+token.length,...(parent?{parent}:{})};output.push(n);
    if(!/^(?:br|hr|img|input|meta|link|source|wbr|area|embed)$/.test(tag)&&!token.endsWith("/>"))stack.push(n);
  }
  return output;
}
function blocked(n: Node): boolean {
  for(let p: Node|undefined=n;p;p=p.parent) if(/^(?:aside|nav|footer)$/.test(p.tag)||/review|rvw|recommend|related|nearby|neighbor|advert/i.test(attr(p,"class"))||/aria-hidden=["']true|\bis-hidden\b|\bhidden(?:\s|=|>)|display\s*:\s*none/i.test(p.attrs))return true;
  return false;
}
const beneath=(n: Node,p: Node)=>n.start>p.start&&n.end<=p.end;
interface MerchantField { field: "COURSE_TITLE"|"COURSE_DESCRIPTION"|"CATEGORY"; quote: string; meals: string[]; }
/** Evaluation-owned HTML traversal. Never imports production parsing or verified labels. */
export function independentMerchantFields(html: string, sourceUrl: string): MerchantField[] {
  const ns=nodes(html), result: MerchantField[]=[];
  const canonical=html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["']/i)?.[1];
  const same=(a:string,b:string)=>{try{const x=new URL(a),y=new URL(b);return x.origin===y.origin&&x.pathname.replace(/\/$/,"")===y.pathname.replace(/\/$/,"");}catch{return false;}};
  if(!canonical||!same(decode(canonical),sourceUrl))return [];
  for(const card of ns.filter(n=>hasClass(n,"rstdtl-course-list")&&!blocked(n))) {
    const children=ns.filter(n=>beneath(n,card)&&!blocked(n));
    if(children.some(n=>n.tag==="a"&&/\/party\//.test(attr(n,"href"))&&!attr(n,"href").startsWith(sourceUrl.replace(/\/$/,"")+"/party/")))continue;
    const title=children.filter(n=>hasClass(n,"rstdtl-course-list__course-title-text")).map(n=>plain(html.slice(n.start,n.end))).join(" ");
    const full=plain(html.slice(card.start,card.end)), titleLunch=/\blunch\b|ランチ|昼食/i.test(title), titleDinner=/\bdinner\b|ディナー|夕食/i.test(title);
    const lunch=titleLunch||(!titleDinner&&/\blunch\b|ランチ|昼食/i.test(full)), dinner=titleDinner||(!titleLunch&&/\bdinner\b|ディナー|夕食/i.test(full));
    const meals=lunch===dinner?[]:[lunch?"LUNCH":"DINNER"];
    for(const [cls,field] of [["rstdtl-course-list__course-title-text","COURSE_TITLE"],["rstdtl-course-list__desc","COURSE_DESCRIPTION"]] as const)
      for(const n of children.filter(n=>hasClass(n,cls))) {const quote=plain(html.slice(n.start,n.end));if(quote)result.push({field,quote,meals});}
  }
  for(const row of ns.filter(n=>n.tag==="tr"&&!blocked(n))) {
    const heading=ns.find(n=>n.tag==="th"&&n.parent===row), value=ns.find(n=>n.tag==="td"&&n.parent===row);
    if(heading&&value&&/^(?:Categories|Cuisine|Genre)$/i.test(plain(html.slice(heading.start,heading.end))))result.push({field:"CATEGORY",quote:plain(html.slice(value.start,value.end)),meals:[]});
  }
  return result;
}
function literalIn(criterion: string, quote: string): boolean {
  const needle=normalizeCriterion(criterion), hay=normalizeCriterion(quote);
  return Boolean(needle)&&(` ${hay} `).includes(` ${needle} `)&&!/(?:\bno\b|\bnot\b|without|unavailable|not offered|提供していません|なし)/i.test(quote);
}
export function assessIndependentHard(root: RunRecord, candidateId: string, criterion: string, polarity: string,
  artifactSha256: string, facts: EvidenceRecord[], context?: HardCriterionEvidence): IndependentHardSupport {
  const domain=root.finalSnapshot?.domainState, shown=domain?.presentedResults, diagnostics: IndependentHardSupport["supportDiagnostics"]=[];
  const result=(status: IndependentHardSupport["status"],basis:string[],refs:string[],meals?:string[]):IndependentHardSupport=>({status,basis,evidenceRefs:refs,supportDiagnostics:diagnostics,
    ...(meals?{sourceScope:{kind:"RESTAURANT_OFFERING",meals,requestedCourseAvailability:"NOT_VERIFIED" as const}}:{})});
  if(!context||context.artifactSha256!==artifactSha256)return result("NOT_CHECKED",["No artifact-bound independent HARD HTML/witness input."],[]);
  const superseded=new Set([...(domain?.factChecks?.[candidateId]?.supersededEvidenceIds??[]),...(domain?.readEvidence??[]).flatMap(e=>e.supersedesEvidenceIds??[])]);
  const accepted: Array<{field:MerchantField;ref:string}>=[];
  for(const snap of context.snapshots.filter(s=>s.candidateId===candidateId)) {
    if(hash(snap.html)!==snap.sha256)continue;
    const trace=[...root.diagnostics?.browserTrace??[],...root.sourceTrace?.browserTrace??[]].filter(t=>t.kind==="SNAPSHOT")[snap.snapshot-1];
    if(!trace||trace.detail?.url!==snap.sourceUrl||trace.detail.htmlSha256!==snap.runtimeHtmlSha256||!trace.at||!shown?.presentedAt||Date.parse(trace.at)>Date.parse(shown.presentedAt)||(root.startedAt&&Date.parse(trace.at)<Date.parse(root.startedAt)))continue;
    const fields=independentMerchantFields(snap.html,snap.sourceUrl).filter(f=>literalIn(criterion,f.quote));
    if(!fields.length)continue;
    const fact=facts.find(e=>e.evidenceId===snap.evidenceId&&e.provider===snap.provider&&e.sourceUrl===snap.sourceUrl&&e.observedAt===snap.observedAt&&!superseded.has(e.evidenceId??""));
    const ref=`${snap.path}#sha256=${snap.sha256}`;
    if(!shown?.evidenceIds?.includes(snap.evidenceId)) { diagnostics.push({code:"PRESENTATION_CITATION_MISSING",reason:"Merchant text exists, but its source fact was not cited by this presentation.",refs:[ref,snap.evidenceId]});continue; }
    if(!fact||!shown.presentedAt||!Number.isFinite(Date.parse(snap.observedAt))||Date.parse(snap.observedAt)>Date.parse(shown.presentedAt)) {diagnostics.push({code:"SOURCE_TEXT_PRESENT_NOT_ACCEPTED",reason:"Merchant text exists, but candidate/source/current executed evidence or observation time is not applicable.",refs:[ref]});continue;}
    for(const f of fields) {
      const time=root.materializedCase?.semantic?.time; const start=time?.value??time?.start, end=time?.value??time?.end;
      const requestedMeal=/\bdinner\b|夕食|ディナー/i.test(criterion)?"DINNER":/\blunch\b|昼食|ランチ/i.test(criterion)?"LUNCH":/course|menu|套餐|コース/i.test(criterion)?(start&&start>="17:00"?"DINNER":end&&end<="15:00"?"LUNCH":undefined):undefined;
      if(requestedMeal&&f.meals.length&&!f.meals.includes(requestedMeal)) {diagnostics.push({code:"SOURCE_TEXT_PRESENT_NOT_ACCEPTED",reason:"Meal-restricted course does not establish the requested meal course.",refs:[ref]});continue;}
      accepted.push({field:f,ref});
    }
  }
  if(accepted.length) {
    diagnostics.push({code:"SOURCE_TEXT_ACCEPTED",reason:"Literal HARD wording occurs in cited, current same-outlet merchant course/category HTML; not in a name or review.",refs:accepted.map(x=>x.ref)});
    return result(polarity==="POSITIVE"?"MET":"NOT_MET",accepted.map(x=>`${x.field.field}: ${x.field.quote}; ${x.field.meals.join("/")||"meal unspecified"}. Restaurant offering only; requested-time course availability is not established.`),accepted.map(x=>x.ref),[...new Set(accepted.flatMap(x=>x.field.meals))]);
  }
  if(!diagnostics.length)diagnostics.push({code:"CANNOT_INDEPENDENTLY_PROVE",reason:"Current structured merchant fields do not independently establish this HARD; a separate reviewed witness, if present, is assessed below.",refs:[]});
  const semantic=root.materializedCase?.semantic;
  for(const w of context.witnesses) {
    if(polarity!=="POSITIVE"||w.artifactSha256!==artifactSha256||w.candidateId!==candidateId||w.caseId!==root.caseId||normalizeCriterion(w.criterion)!==normalizeCriterion(criterion)
      ||w.reviewedBy!=="INDEPENDENT_REVIEWER"||hash(w.sourceText)!==w.sha256||hash(w.reviewText)!==w.reviewSha256||!w.quote.trim())continue;
    const party=typeof semantic?.party_size==="number"?semantic.party_size:semantic?.party_size?.value;
    if(w.date!==semantic?.date?.value||w.time!==(semantic?.time?.value??semantic?.time?.start)||w.partySize!==party)continue;
    if(hash(w.certificationText)!==w.certificationSha256)continue;
    const certified=JSON.parse(w.certificationText) as {validUntil?:string;variants?:Array<{caseId?:string;date?:string;partySize?:number;earliest?:string;witnesses?:Array<{rst_id?:string;classification?:string;hardEvidence?:Array<{criterion?:string;quote?:string}>}>}>};
    const variant=certified.variants?.find(v=>v.caseId===w.caseId&&v.date===w.date&&v.partySize===w.partySize&&v.earliest===w.time);
    const id=w.sourceUrl.match(/\/(\d{8})(?:\/|$)/)?.[1];
    if(!variant?.witnesses?.some(v=>v.rst_id===id&&v.classification==="KNOWN_FEASIBLE_SUPPORTED"&&v.hardEvidence?.some(h=>normalizeCriterion(h.criterion??"")===normalizeCriterion(w.criterion)&&plain(h.quote??"")===plain(w.quote)))||(root.startedAt&&(!certified.validUntil||Date.parse(root.startedAt)>Date.parse(certified.validUntil))))continue;
    const raw=JSON.parse(w.sourceText) as {url?:string;evidence?:{rawQuotes?:Array<{raw?:string}>}};
    if(raw.url!==w.sourceUrl||!raw.evidence?.rawQuotes?.some(q=>q.raw&&plain(q.raw)===plain(w.quote)))continue;
    const sameOutlet=(sourceUrl:string|undefined)=>{if(!sourceUrl)return false;try{const source=new URL(sourceUrl),witness=new URL(w.sourceUrl);return source.origin===witness.origin&&(source.pathname===witness.pathname||(/^\/en\/[^/]+\/[^/]+\/[^/]+\/\d{8}\/$/.test(source.pathname)&&witness.pathname.startsWith(source.pathname+"party/")));}catch{return false;}};
    if(!facts.some(f=>sameOutlet(f.sourceUrl)&&shown?.evidenceIds?.includes(f.evidenceId??"")&&!superseded.has(f.evidenceId??"")))continue;
    diagnostics.push({code:"REVIEWED_WITNESS_ACCEPTED",reason:"Independent manual HARD interpretation applies only to this outlet, request and artifact SHA; it is not a product name-matching rule.",refs:[w.path,w.reviewPath]});
    return result("MET",[`Independent reviewer witness: ${w.quote}. Not inferred from the product's model label; no requested-course availability claim.`],[`${w.path}#sha256=${w.sha256}`,`${w.reviewPath}#sha256=${w.reviewSha256}`]);
  }
  if(!diagnostics.length)diagnostics.push({code:"CANNOT_INDEPENDENTLY_PROVE",reason:"No applicable cited merchant course/category statement or reviewed witness. Names, customer reviews and verified labels are not independent type evidence.",refs:[]});
  return result("NOT_CHECKED",diagnostics.map(d=>d.reason),diagnostics.flatMap(d=>d.refs));
}

/** Caller selects a frozen local evidence manifest; never follows page URLs or fetches. */
export function loadHardCriterionEvidence(path: string, artifactSha256: string): HardCriterionEvidence {
  const manifest=JSON.parse(readFileSync(path,"utf8")) as {schema:string;runs: Array<HardCriterionEvidence>};
  if(manifest.schema!=="restaurant-hard-criterion-evidence@1"||!Array.isArray(manifest.runs))throw Error("Invalid HARD evidence manifest");
  const exact=(value:unknown,keys:string[])=>{if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Invalid HARD evidence object");for(const k of Object.keys(value))if(!keys.includes(k))throw Error(`Unknown HARD evidence key: ${k}`);for(const k of keys)if((value as Record<string,unknown>)[k]===undefined||(value as Record<string,unknown>)[k]===null)throw Error(`Missing HARD evidence key: ${k}`);};
  exact(manifest,["schema","runs"]);
  const run=manifest.runs.find(r=>r.artifactSha256===artifactSha256);if(!run)throw Error("HARD evidence artifact SHA not registered");
  if(manifest.runs.filter(r=>r.artifactSha256===artifactSha256).length!==1)throw Error("Duplicate HARD artifact input");
  exact(run,["artifactSha256","snapshots","witnesses"]);
  for(const s of run.snapshots)exact(s,["candidateId","evidenceId","provider","sourceUrl","observedAt","path","sha256","snapshot","runtimeHtmlSha256","recordingPath","recordingSha256"]);
  for(const w of run.witnesses)exact(w,["candidateId","sourceUrl","criterion","quote","caseId","date","time","partySize","artifactSha256","path","sha256","reviewedBy","reviewPath","reviewSha256","certificationPath","certificationSha256"]);
  const source=(p:string,h:string)=>{const s=readFileSync(resolve(dirname(path),p),"utf8");if(hash(s)!==h)throw Error(`HARD input SHA mismatch: ${p}`);return s;};
  return {artifactSha256,snapshots:run.snapshots.map(s=>{
    const recording=JSON.parse(source(s.recordingPath!,s.recordingSha256!)) as {documents:Array<{snapshot:number;url:string;file:string}>;entries:Array<{kind:string;detail:{url?:string;htmlSha256?:string}}>};
    const doc=recording.documents.find(d=>d.snapshot===s.snapshot),trace=recording.entries.filter(e=>e.kind==="SNAPSHOT")[s.snapshot-1];
    if(!doc||doc.url!==s.sourceUrl||doc.file!==basename(s.path)||trace?.detail.url!==s.sourceUrl||trace.detail.htmlSha256!==s.runtimeHtmlSha256)throw Error("HARD recording/snapshot binding mismatch");
    return {...s,html:source(s.path,s.sha256)};}),witnesses:run.witnesses.map(w=>({...w,sourceText:source(w.path,w.sha256),reviewText:source(w.reviewPath,w.reviewSha256),certificationText:source(w.certificationPath,w.certificationSha256)}))};
}
