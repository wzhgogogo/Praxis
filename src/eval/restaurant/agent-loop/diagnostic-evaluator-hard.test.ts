import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { assessIndependentHard, independentMerchantFields, type HardCriterionEvidence } from "./diagnostic-evaluator-hard.js";
import { readDiagnosticRun } from "./diagnostic-evaluator-record.js";
const sha=(s:string)=>createHash("sha256").update(s).digest("hex");
const url="https://tabelog.com/en/tokyo/A0000/A000000/11111111/";
const at="2026-10-21T10:00:00Z",artifactSha="a".repeat(64);
function fixture(body:string) {
  const html=`<html><head><link rel="canonical" href="${url}"></head><body>${body}</body></html>`;
  const fact={evidenceId:"source-fact",kind:"RESTAURANT_FACT",provider:"TABELOG",candidateId:"candidate-a",sourceUrl:url,observedAt:at,claims:{verifiedHardCriteria:["omakase"]}};
  const root=readDiagnosticRun({diagnostics:{browserTrace:[{kind:"SNAPSHOT",sequence:1,at,detail:{url,htmlSha256:sha("unsanitized original HTML")}}]},caseId:"fixture",materializedCase:{semantic:{date:{value:"2026-11-03"},time:{value:"19:00"},party_size:2}},finalSnapshot:{domainState:{factChecks:{},readEvidence:[fact],presentedResults:{candidateIds:["candidate-a"],evidenceIds:[fact.evidenceId],presentedAt:"2026-10-21T10:01:00Z"}}}}).record;
  const context:HardCriterionEvidence={artifactSha256:artifactSha,snapshots:[{candidateId:"candidate-a",evidenceId:fact.evidenceId,provider:fact.provider,sourceUrl:url,observedAt:at,path:"original.html",html,sha256:sha(html),snapshot:1,runtimeHtmlSha256:sha("unsanitized original HTML")}],witnesses:[]};
  const assess=(criterion="omakase",polarity="POSITIVE")=>assessIndependentHard(root,"candidate-a",criterion,polarity,artifactSha,root.finalSnapshot!.domainState!.readEvidence!,context);
  return{context,root,assess};
}
const card=(title:string,description="",href=url+"party/1/")=>`<div class="rstdtl-course-list"><a href="${href}"><span class="rstdtl-course-list__course-title-text">${title}</span></a><p class="rstdtl-course-list__desc">${description}</p></div>`;

test("HARD32 merchant course/category literals have independent source and offering scope",()=>{
  for(const body of [card("Chef's Omakase Course"),card("Seasonal Course","An omakase meal using seasonal ingredients"),'<table><tr><th>Categories</th><td>Omakase, Sushi</td></tr></table>']) {
    const f=fixture(body);assert.equal(f.assess().status,"MET");assert.equal(f.assess().sourceScope?.requestedCourseAvailability,"NOT_VERIFIED");
    assert.equal(f.assess("omakase","NEGATIVE").status,"NOT_MET");
  }
});

test("HARD32 names, customer reviews, recommendations, hidden text and other outlets are not merchant type proof",()=>{
  for(const body of ['<h1>Omakase Restaurant</h1>','<div class="rstdtl-rvw"><h4>Omakase course experience</h4></div>',`<aside>${card("Omakase Course")}</aside>`,`<section class="recommendations">${card("Omakase Course")}</section>`,`<div hidden>${card("Omakase Course")}</div>`,card("Omakase Course","",url.replace("11111111","22222222")+"party/1/"),card("Seasonal Course","No omakase is offered")]) {
    assert.equal(fixture(body).assess().status,"NOT_CHECKED",body);
  }
});

test("HARD32 lunch can establish venue offering but never a dinner course",()=>{
  const f=fixture(card("Lunch Omakase Course","Dinner reservations are handled separately"));const venue=f.assess();
  assert.equal(venue.status,"MET");assert.deepEqual(venue.sourceScope?.meals,["LUNCH"]);assert.match(venue.basis.join(" "),/requested-time course availability is not established/);
  assert.equal(f.assess("omakase course").status,"NOT_CHECKED");
  f.root.materializedCase!.semantic!.time!.value="12:00";assert.equal(f.assess("omakase course").status,"MET");
});

test("HARD32 rejects wrong artifact, candidate, provider, source, snapshot hash, late and superseded facts",()=>{
  const mutations:Array<(f:ReturnType<typeof fixture>)=>void>=[
    f=>{f.context.snapshots[0]!.runtimeHtmlSha256="b".repeat(64);},f=>{f.context.snapshots[0]!.snapshot=2;},
    f=>{f.context.artifactSha256="b".repeat(64);},f=>{f.context.snapshots[0]!.candidateId="candidate-b";},
    f=>{f.context.snapshots[0]!.provider="TABLECHECK";},f=>{f.context.snapshots[0]!.sourceUrl=url.replace("11111111","22222222");},
    f=>{f.context.snapshots[0]!.sha256="b".repeat(64);},f=>{f.root.finalSnapshot!.domainState!.factChecks={"candidate-a":{supersededEvidenceIds:["source-fact"]}};},
    f=>{f.root.finalSnapshot!.domainState!.readEvidence![0]!.observedAt="2026-10-21T11:00:00Z";f.context.snapshots[0]!.observedAt="2026-10-21T11:00:00Z";},
  ];
  for(const mutate of mutations){const f=fixture(card("Omakase Course"));mutate(f);assert.equal(f.assess().status,"NOT_CHECKED");}
  const missing=fixture(card("Omakase Course"));missing.root.finalSnapshot!.domainState!.presentedResults!.evidenceIds=[];
  assert.equal(missing.assess().status,"NOT_CHECKED");assert.equal(missing.assess().supportDiagnostics[0]!.code,"PRESENTATION_CITATION_MISSING");
});

test("HARD32 manually reviewed witness is bounded to outlet, request, original raw quote and review hashes",()=>{
  const f=fixture('<h1>Kaiseki House</h1>');const sourceText=JSON.stringify({url,evidence:{rawQuotes:[{raw:"Private rooms to Kaiseki"}]}}),reviewText="Independent reviewer accepts this exact witness only.";
  const certificationText=JSON.stringify({validUntil:"2026-10-22T10:00:00Z",variants:[{caseId:"fixture",date:"2026-11-03",earliest:"19:00",partySize:2,witnesses:[{rst_id:"11111111",classification:"KNOWN_FEASIBLE_SUPPORTED",hardEvidence:[{criterion:"kaiseki",quote:"Private rooms to Kaiseki"}]}]}]});
  f.context.witnesses=[{candidateId:"candidate-a",sourceUrl:url,criterion:"kaiseki",quote:"Private rooms to Kaiseki",caseId:"fixture",date:"2026-11-03",time:"19:00",partySize:2,artifactSha256:artifactSha,path:"witness.json",sha256:sha(sourceText),sourceText,reviewedBy:"INDEPENDENT_REVIEWER",reviewPath:"review.md",reviewSha256:sha(reviewText),reviewText,certificationPath:"certified.json",certificationSha256:sha(certificationText),certificationText}];
  assert.equal(f.assess("kaiseki").status,"MET");assert.ok(f.assess("kaiseki").supportDiagnostics.some(x=>x.code==="REVIEWED_WITNESS_ACCEPTED"));
  for(const field of ["candidateId","caseId","date","time","partySize","artifactSha256","quote","sha256","reviewSha256","certificationSha256"] as const){const original=f.context.witnesses[0]![field];(f.context.witnesses[0] as any)[field]=field==="partySize"?3:"wrong";assert.equal(f.assess("kaiseki").status,"NOT_CHECKED",field);(f.context.witnesses[0] as any)[field]=original;}
  f.context.witnesses=[];assert.equal(f.assess("kaiseki").status,"NOT_CHECKED","name-only product input remains unproven without explicit reviewer oracle");
});
